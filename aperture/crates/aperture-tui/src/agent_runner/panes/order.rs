//! Paper-trading order pane — ORDER + BLOTTER verbs.
//!
//! v0.1: in-memory orders only. No real broker hookup.
//! Verbs:
//! - `ORDER`   — append a new order; payload `{symbol, side: "BUY"|"SELL", qty, type?: "MKT"|"LMT", limit_price?}`
//! - `BLOTTER` — list submitted orders → `BLOTTER.RESULT`

use aperture_swarm::{reply, Agent, Envelope};
use serde_json::{json, Value};

use crate::agent_runner::verb;

pub struct OrderPane {
    id: String,
    orders: Vec<Value>,
    next_id: u64,
}

impl OrderPane {
    pub fn new() -> Self {
        Self {
            id: "aperture:pane.order".into(),
            orders: Vec::new(),
            next_id: 1,
        }
    }
}

impl Agent for OrderPane {
    fn id(&self) -> &str {
        &self.id
    }

    async fn handle(&mut self, env: Envelope) -> Vec<Envelope> {
        match verb(&env) {
            Some("ORDER") => {
                let symbol = env
                    .payload
                    .get("symbol")
                    .and_then(Value::as_str)
                    .map(|s| s.to_ascii_uppercase());
                let side = env
                    .payload
                    .get("side")
                    .and_then(Value::as_str)
                    .map(|s| s.to_ascii_uppercase());
                let qty = env.payload.get("qty").and_then(Value::as_i64);
                let order_type = env
                    .payload
                    .get("type")
                    .and_then(Value::as_str)
                    .unwrap_or("MKT")
                    .to_ascii_uppercase();
                let limit_price = env.payload.get("limit_price").and_then(Value::as_f64);

                let (Some(symbol), Some(side), Some(qty)) = (symbol, side, qty) else {
                    return vec![reply(
                        &env,
                        json!({"verb": "ORDER.RESULT", "error": "missing symbol/side/qty"}),
                    )];
                };
                if !matches!(side.as_str(), "BUY" | "SELL") {
                    return vec![reply(
                        &env,
                        json!({"verb": "ORDER.RESULT", "error": "side must be BUY or SELL"}),
                    )];
                }
                if qty <= 0 {
                    return vec![reply(
                        &env,
                        json!({"verb": "ORDER.RESULT", "error": "qty must be positive"}),
                    )];
                }
                if order_type == "LMT" && limit_price.is_none() {
                    return vec![reply(
                        &env,
                        json!({"verb": "ORDER.RESULT", "error": "LMT requires limit_price"}),
                    )];
                }

                let order = json!({
                    "id": self.next_id,
                    "symbol": symbol,
                    "side": side,
                    "qty": qty,
                    "type": order_type,
                    "limit_price": limit_price,
                    "status": "PAPER_FILLED",
                    "ts": env.timestamp,
                });
                self.next_id += 1;
                self.orders.push(order.clone());
                vec![reply(
                    &env,
                    json!({"verb": "ORDER.RESULT", "order": order}),
                )]
            }
            Some("BLOTTER") => vec![reply(
                &env,
                json!({"verb": "BLOTTER.RESULT", "orders": self.orders}),
            )],
            _ => vec![],
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::agent_runner::panes::test_helpers::req;
    use serde_json::json;

    #[tokio::test]
    async fn submits_then_lists() {
        let mut p = OrderPane::new();
        let _ = p
            .handle(req(
                "ORDER",
                json!({"symbol": "AAPL", "side": "BUY", "qty": 10}),
            ))
            .await;
        let _ = p
            .handle(req(
                "ORDER",
                json!({"symbol": "TSLA", "side": "SELL", "qty": 5, "type": "LMT", "limit_price": 250.0}),
            ))
            .await;
        let outs = p.handle(req("BLOTTER", json!({}))).await;
        let orders = outs[0].payload["orders"].as_array().unwrap();
        assert_eq!(orders.len(), 2);
        assert_eq!(orders[0]["symbol"], "AAPL");
        assert_eq!(orders[0]["status"], "PAPER_FILLED");
    }

    #[tokio::test]
    async fn rejects_invalid_side() {
        let mut p = OrderPane::new();
        let outs = p
            .handle(req(
                "ORDER",
                json!({"symbol": "AAPL", "side": "HOLD", "qty": 1}),
            ))
            .await;
        assert!(outs[0].payload["error"].is_string());
    }

    #[tokio::test]
    async fn lmt_requires_limit_price() {
        let mut p = OrderPane::new();
        let outs = p
            .handle(req(
                "ORDER",
                json!({"symbol": "AAPL", "side": "BUY", "qty": 1, "type": "LMT"}),
            ))
            .await;
        assert!(outs[0].payload["error"]
            .as_str()
            .unwrap()
            .contains("limit_price"));
    }
}
