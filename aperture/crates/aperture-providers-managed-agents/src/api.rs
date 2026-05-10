//! Thin curl-based HTTP client for the Managed Agents endpoints.
//!
//! Each public function owns one of the four wire calls we need:
//!
//! - [`create_agent`]
//! - [`create_environment`]
//! - [`create_session`]
//! - [`run_event`] — opens the SSE stream, sends the user event, and
//!   returns the agent's concatenated `agent.message` text.
//!
//! The argv-building helpers are split out so unit tests can assert
//! shape (URLs, header order, body) without spawning `curl`.

use std::process::Stdio;

use serde_json::{json, Value};
use thiserror::Error;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use tokio::time::timeout;

use crate::config::Config;
use crate::sse::{SseEvent, SseParser};

#[derive(Debug, Error)]
pub enum ApiError {
    #[error("spawn curl failed: {0}")]
    Spawn(String),
    #[error("curl exited with status {status}: {stderr}")]
    NonZero { status: i32, stderr: String },
    #[error("api timed out")]
    Timeout,
    #[error("response JSON parse failed: {0}")]
    Json(String),
    #[error("missing field `{0}` in response")]
    MissingField(&'static str),
    #[error("io: {0}")]
    Io(String),
}

/// `curl` args common to every Managed Agents call.
pub fn common_headers(cfg: &Config) -> Vec<String> {
    vec![
        "-sS".into(),
        "--fail-with-body".into(),
        "-H".into(),
        format!("x-api-key: {}", cfg.api_key),
        "-H".into(),
        format!("anthropic-version: {}", cfg.anthropic_version),
        "-H".into(),
        format!("anthropic-beta: {}", cfg.beta_header),
    ]
}

/// argv for `POST /v1/agents`.
pub fn create_agent_argv(cfg: &Config, body: &str) -> Vec<String> {
    let mut argv = common_headers(cfg);
    argv.extend([
        "-H".into(),
        "content-type: application/json".into(),
        "-X".into(),
        "POST".into(),
        format!("{}/v1/agents", cfg.base_url),
        "-d".into(),
        body.to_string(),
    ]);
    argv
}

/// argv for `POST /v1/environments`.
pub fn create_environment_argv(cfg: &Config, body: &str) -> Vec<String> {
    let mut argv = common_headers(cfg);
    argv.extend([
        "-H".into(),
        "content-type: application/json".into(),
        "-X".into(),
        "POST".into(),
        format!("{}/v1/environments", cfg.base_url),
        "-d".into(),
        body.to_string(),
    ]);
    argv
}

/// argv for `POST /v1/sessions`.
pub fn create_session_argv(cfg: &Config, body: &str) -> Vec<String> {
    let mut argv = common_headers(cfg);
    argv.extend([
        "-H".into(),
        "content-type: application/json".into(),
        "-X".into(),
        "POST".into(),
        format!("{}/v1/sessions", cfg.base_url),
        "-d".into(),
        body.to_string(),
    ]);
    argv
}

/// argv for `POST /v1/sessions/<id>/events`.
pub fn send_event_argv(cfg: &Config, session_id: &str, body: &str) -> Vec<String> {
    let mut argv = common_headers(cfg);
    argv.extend([
        "-H".into(),
        "content-type: application/json".into(),
        "-X".into(),
        "POST".into(),
        format!("{}/v1/sessions/{}/events", cfg.base_url, session_id),
        "-d".into(),
        body.to_string(),
    ]);
    argv
}

/// argv for `GET /v1/sessions/<id>/stream` with the long-lived SSE handle.
pub fn stream_argv(cfg: &Config, session_id: &str) -> Vec<String> {
    let mut argv = common_headers(cfg);
    argv.extend([
        "-N".into(),
        "-H".into(),
        "accept: text/event-stream".into(),
        format!("{}/v1/sessions/{}/stream", cfg.base_url, session_id),
    ]);
    argv
}

/// Spawn curl with the given argv, await stdout, parse as JSON.
async fn run_json(cfg: &Config, argv: Vec<String>) -> Result<Value, ApiError> {
    let mut cmd = Command::new(&cfg.curl_binary);
    cmd.args(&argv).stdin(Stdio::null()).kill_on_drop(true);
    let child = cmd.spawn().map_err(|e| ApiError::Spawn(e.to_string()))?;
    let fut = child.wait_with_output();
    let out = match timeout(cfg.timeout, fut).await {
        Err(_) => return Err(ApiError::Timeout),
        Ok(Err(e)) => return Err(ApiError::Spawn(e.to_string())),
        Ok(Ok(o)) => o,
    };
    if !out.status.success() {
        return Err(ApiError::NonZero {
            status: out.status.code().unwrap_or(-1),
            stderr: String::from_utf8_lossy(&out.stderr).to_string(),
        });
    }
    serde_json::from_slice::<Value>(&out.stdout).map_err(|e| ApiError::Json(e.to_string()))
}

/// Create a research agent. Returns the new agent id.
pub async fn create_agent(cfg: &Config, name: &str, system: &str) -> Result<String, ApiError> {
    let body = json!({
        "name": name,
        "model": cfg.model,
        "system": system,
        "tools": [{"type": "agent_toolset_20260401"}],
    })
    .to_string();
    let v = run_json(cfg, create_agent_argv(cfg, &body)).await?;
    v.get("id")
        .and_then(Value::as_str)
        .map(str::to_string)
        .ok_or(ApiError::MissingField("id"))
}

/// Create an environment. Returns the new environment id.
pub async fn create_environment(cfg: &Config, name: &str) -> Result<String, ApiError> {
    let body = json!({
        "name": name,
        "config": {"type": "cloud", "networking": {"type": "unrestricted"}},
    })
    .to_string();
    let v = run_json(cfg, create_environment_argv(cfg, &body)).await?;
    v.get("id")
        .and_then(Value::as_str)
        .map(str::to_string)
        .ok_or(ApiError::MissingField("id"))
}

/// Create a session against a known agent + environment.
pub async fn create_session(
    cfg: &Config,
    agent_id: &str,
    environment_id: &str,
    title: &str,
) -> Result<String, ApiError> {
    let body = json!({
        "agent": agent_id,
        "environment_id": environment_id,
        "title": title,
    })
    .to_string();
    let v = run_json(cfg, create_session_argv(cfg, &body)).await?;
    v.get("id")
        .and_then(Value::as_str)
        .map(str::to_string)
        .ok_or(ApiError::MissingField("id"))
}

/// Build the JSON body for a single-message user event.
pub fn user_event_body(text: &str) -> String {
    json!({
        "events": [{
            "type": "user.message",
            "content": [{"type": "text", "text": text}],
        }]
    })
    .to_string()
}

/// Full round-trip: open the stream, send `prompt` as a user.message,
/// collect all `agent.message` text until `session.status_idle`,
/// terminate the stream. Returns the concatenated agent text.
///
/// Per the Managed Agents docs the stream MUST be opened before the
/// event is sent — the API buffers events until a stream attaches.
pub async fn run_event(
    cfg: &Config,
    session_id: &str,
    prompt: &str,
) -> Result<String, ApiError> {
    // 1. Spawn the SSE streamer so it attaches before we POST the event.
    let mut stream_cmd = Command::new(&cfg.curl_binary);
    stream_cmd
        .args(stream_argv(cfg, session_id))
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true);
    let mut stream_child = stream_cmd
        .spawn()
        .map_err(|e| ApiError::Spawn(e.to_string()))?;
    let stdout = stream_child
        .stdout
        .take()
        .ok_or_else(|| ApiError::Io("stream stdout missing".into()))?;
    let mut reader = BufReader::new(stdout).lines();

    // 2. Send the user event. The API buffers it until the stream attaches.
    let send = run_json(cfg, send_event_argv(cfg, session_id, &user_event_body(prompt)));
    let _ = match timeout(cfg.timeout, send).await {
        Err(_) => return Err(ApiError::Timeout),
        Ok(r) => r?, // surface the API error if the event POST fails
    };

    // 3. Pump SSE until session.status_idle.
    let mut parser = SseParser::new();
    let mut accumulated = String::new();
    let read_fut = async {
        while let Ok(Some(line)) = reader.next_line().await {
            parser.feed(&line);
            parser.feed("\n");
            for ev in parser.drain() {
                match ev {
                    SseEvent::AgentMessage { text } => accumulated.push_str(&text),
                    SseEvent::SessionIdle => return Ok::<_, ApiError>(()),
                    _ => {}
                }
            }
        }
        Ok(())
    };
    match timeout(cfg.timeout, read_fut).await {
        Err(_) => return Err(ApiError::Timeout),
        Ok(Err(e)) => return Err(e),
        Ok(Ok(())) => {}
    };

    let _ = stream_child.kill().await;
    Ok(accumulated)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn cfg() -> Config {
        Config {
            api_key: "sk-ant-test".into(),
            ..Config::default()
        }
    }

    #[test]
    fn common_headers_include_api_key_and_beta() {
        let h = common_headers(&cfg());
        assert!(h.windows(2).any(|w| w[0] == "-H" && w[1] == "x-api-key: sk-ant-test"));
        assert!(h
            .windows(2)
            .any(|w| w[0] == "-H" && w[1] == "anthropic-beta: managed-agents-2026-04-01"));
        assert!(h
            .windows(2)
            .any(|w| w[0] == "-H" && w[1] == "anthropic-version: 2023-06-01"));
    }

    #[test]
    fn create_agent_argv_has_correct_url_and_body() {
        let argv = create_agent_argv(&cfg(), r#"{"hello":"world"}"#);
        assert!(argv.contains(&"https://api.anthropic.com/v1/agents".to_string()));
        assert!(argv.contains(&"-X".to_string()));
        assert!(argv.contains(&"POST".to_string()));
        assert!(argv.contains(&"-d".to_string()));
        assert!(argv.contains(&r#"{"hello":"world"}"#.to_string()));
    }

    #[test]
    fn send_event_argv_targets_session_subpath() {
        let argv = send_event_argv(&cfg(), "ses_abc", "{}");
        assert!(argv
            .iter()
            .any(|a| a == "https://api.anthropic.com/v1/sessions/ses_abc/events"));
    }

    #[test]
    fn stream_argv_uses_no_buffering_and_sse_accept() {
        let argv = stream_argv(&cfg(), "ses_xyz");
        assert!(argv.contains(&"-N".to_string()));
        assert!(argv
            .windows(2)
            .any(|w| w[0] == "-H" && w[1] == "accept: text/event-stream"));
        assert!(argv
            .iter()
            .any(|a| a == "https://api.anthropic.com/v1/sessions/ses_xyz/stream"));
    }

    #[test]
    fn user_event_body_matches_doc_shape() {
        let body = user_event_body("hello world");
        let v: Value = serde_json::from_str(&body).unwrap();
        assert_eq!(v["events"][0]["type"], "user.message");
        assert_eq!(v["events"][0]["content"][0]["type"], "text");
        assert_eq!(v["events"][0]["content"][0]["text"], "hello world");
    }

    #[test]
    fn base_url_override_propagates() {
        let mut c = cfg();
        c.base_url = "http://localhost:1234".into();
        let argv = create_agent_argv(&c, "{}");
        assert!(argv.contains(&"http://localhost:1234/v1/agents".to_string()));
    }
}
