/**
 * GAIA Per-Answer Ed25519 Attestation — ADR-135 Track J
 *
 * Every (question, answer, trajectory, timestamp) tuple can be signed with
 * an Ed25519 key, producing a cryptographically verifiable attestation of
 * answer provenance. This is one of the 6 architectural primitives that
 * distinguishes ruflo's agent harness from HAL (which has no per-answer
 * provenance).
 *
 * Signing scheme — mirrors the CWE-347 pattern used by signed-artifact.ts
 * and scripts/smoke-plugin-registry-signature.mjs:
 *
 *   1. Build the signed payload: { questionHash, answer, trajectorySummary,
 *      model, timestamp } — deterministic canonical JSON (keys sorted).
 *   2. Sign the UTF-8 bytes of that canonical string with Ed25519.
 *   3. Embed the hex public key + signature in the attestation object.
 *   4. Verification re-canonicalizes the same fields and checks the
 *      signature against the embedded public key.
 *
 * Key resolution order:
 *   1. options.privateKey — caller-supplied Uint8Array
 *   2. options.keyPath    — load from that path (binary)
 *   3. Default cache path: ~/.cache/ruflo/gaia/attestation-key.bin
 *   4. Witness manifest:  plugins/ruflo-core/scripts/witness/keys/ed25519.priv
 *      (only if relative to process.cwd(), i.e. inside the repo)
 *   5. Generate a fresh ephemeral key and persist to cache for next time.
 *
 * Integration note (iter 39 / PR pending):
 *   This module is intentionally NOT wired into gaia-bench.ts yet. When
 *   wiring, add --attest-answers to produce attestations alongside results.
 *   Plugin sync TODO: update plugins/ruflo-workflows/commands/gaia-run.md
 *   and plugins/ruflo-workflows/skills/gaia-submission/SKILL.md.
 *
 * Refs: ADR-135 Track J, ADR-133, ADR-103, #2156, plugin builder PR #2182
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as crypto from 'node:crypto';
import * as readline from 'node:readline';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Summary of the trajectory that produced an answer. */
export interface TrajectorySummary {
  /** Number of agent turns taken. */
  turns: number;
  /** Names of tools invoked at least once. */
  toolsUsed: string[];
  /** Wall-clock time in milliseconds from task start to answer. */
  wallMs: number;
}

/** A cryptographically signed record of one GAIA answer. */
export interface AnswerAttestation {
  /** GAIA task_id for the question. */
  questionId: string;
  /** SHA-256 hex of the question text (allows question verification without embedding full text). */
  questionHash: string;
  /** The agent's final answer string (may be empty — negative results are attestable). */
  answer: string;
  /** Trajectory metadata at the time of answering. */
  trajectorySummary: TrajectorySummary;
  /** Model identifier (e.g. claude-sonnet-4-5). */
  model: string;
  /** ISO 8601 timestamp of attestation creation. */
  timestamp: string;
  /** Hex-encoded Ed25519 public key (no 'ed25519:' prefix). */
  publicKey: string;
  /** Hex-encoded Ed25519 signature over the canonical payload. */
  signature: string;
  /** Ordered list of field names included in the signed canonical payload. */
  signedFields: string[];
}

/** Options for key resolution when creating attestations. */
export interface AttestationOptions {
  /** Pre-loaded private key bytes (32 bytes). If provided, no disk access. */
  privateKey?: Uint8Array;
  /** Path to a raw 32-byte binary private key file. */
  keyPath?: string;
  /**
   * If true, attempt to load from the witness manifest key before falling
   * back to cache generation. Default: true.
   */
  loadFromWitness?: boolean;
}

/** Result object returned from attestResultsFile. */
export interface BulkAttestationResult {
  /** Absolute path to the written attestations.jsonl file. */
  outputPath: string;
  /** Number of attestations written. */
  count: number;
  /** Hex public key used for all attestations in this batch. */
  publicKey: string;
}

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

/** Ordered list of fields that are serialized and signed. */
const SIGNED_FIELDS: ReadonlyArray<string> = [
  'answer',
  'model',
  'questionHash',
  'timestamp',
  'trajectorySummary',
] as const;

const DEFAULT_KEY_CACHE = path.join(
  os.homedir(),
  '.cache',
  'ruflo',
  'gaia',
  'attestation-key.bin',
);

const WITNESS_KEY_PATH = path.join(
  'plugins',
  'ruflo-core',
  'scripts',
  'witness',
  'keys',
  'ed25519.priv',
);

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function bytesToHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex');
}

function hexToBytes(hex: string): Uint8Array {
  return new Uint8Array(Buffer.from(hex, 'hex'));
}

function sha256Hex(text: string): string {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

/**
 * Deterministic canonical JSON: keys sorted alphabetically at every level,
 * no whitespace. Recursively sorts nested objects so canonical serialization
 * is stable regardless of insertion order.
 */
export function canonicalize(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalize).join(',') + ']';
  }
  const sorted = Object.keys(obj as Record<string, unknown>)
    .sort()
    .map((k) => JSON.stringify(k) + ':' + canonicalize((obj as Record<string, unknown>)[k]))
    .join(',');
  return '{' + sorted + '}';
}

/** Build the payload object that will be canonicalized and signed. */
function buildPayload(
  questionHash: string,
  answer: string,
  trajectorySummary: TrajectorySummary,
  model: string,
  timestamp: string,
): Record<string, unknown> {
  return {
    answer,
    model,
    questionHash,
    timestamp,
    trajectorySummary: {
      toolsUsed: [...trajectorySummary.toolsUsed].sort(), // sort for determinism
      turns: trajectorySummary.turns,
      wallMs: trajectorySummary.wallMs,
    },
  };
}

/** Resolve or generate the Ed25519 private key. */
async function resolvePrivateKey(
  options?: AttestationOptions,
): Promise<{ privateKey: Uint8Array; publicKey: Uint8Array }> {
  const ed = await import('@noble/ed25519');

  // 1. Caller-supplied bytes
  if (options?.privateKey) {
    if (options.privateKey.length !== 32) {
      throw new Error(
        `attestAnswer: options.privateKey must be 32 bytes (got ${options.privateKey.length})`,
      );
    }
    const pub = await ed.getPublicKeyAsync(options.privateKey);
    return { privateKey: options.privateKey, publicKey: pub };
  }

  // 2. Explicit keyPath
  const keyPath = options?.keyPath ?? null;
  if (keyPath && fs.existsSync(keyPath)) {
    const raw = fs.readFileSync(keyPath);
    const priv = new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength).slice(0, 32);
    if (priv.length === 32) {
      const pub = await ed.getPublicKeyAsync(priv);
      return { privateKey: priv, publicKey: pub };
    }
  }

  // 3. Default cache path
  if (!keyPath && fs.existsSync(DEFAULT_KEY_CACHE)) {
    try {
      const raw = fs.readFileSync(DEFAULT_KEY_CACHE);
      const priv = new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength).slice(0, 32);
      if (priv.length === 32) {
        const pub = await ed.getPublicKeyAsync(priv);
        return { privateKey: priv, publicKey: pub };
      }
    } catch {
      // fall through to generation
    }
  }

  // 4. Witness manifest key (only when loadFromWitness !== false)
  if (options?.loadFromWitness !== false) {
    const witnessAbs = path.resolve(process.cwd(), WITNESS_KEY_PATH);
    if (fs.existsSync(witnessAbs)) {
      try {
        const raw = fs.readFileSync(witnessAbs);
        // Try interpreting as raw binary first, then as hex text
        let priv: Uint8Array;
        if (raw.length === 32) {
          priv = new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength);
        } else {
          // Maybe hex-encoded text
          const hexStr = raw.toString('utf8').trim();
          priv = hexToBytes(hexStr);
        }
        if (priv.length === 32) {
          const pub = await ed.getPublicKeyAsync(priv);
          return { privateKey: priv, publicKey: pub };
        }
      } catch {
        // fall through to generation
      }
    }
  }

  // 5. Generate ephemeral key and persist to cache
  const priv = crypto.getRandomValues(new Uint8Array(32));
  const pub = await ed.getPublicKeyAsync(priv);

  // Persist for next time
  try {
    const cacheDir = path.dirname(DEFAULT_KEY_CACHE);
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(DEFAULT_KEY_CACHE, Buffer.from(priv), { mode: 0o600 });
  } catch {
    // Cache write failure is non-fatal — ephemeral key still works for this run
  }

  return { privateKey: priv, publicKey: pub };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Sign an answer + trajectory tuple with an Ed25519 key.
 *
 * Returns a full AnswerAttestation that can be embedded in submission
 * packages, written to an attestations.jsonl file, or verified independently
 * with verifyAttestation().
 *
 * Empty answers are valid — a deterministic "no answer found" result has
 * provenance too and is worth attesting.
 */
export async function attestAnswer(
  questionId: string,
  questionText: string,
  answer: string,
  trajectory: TrajectorySummary,
  model: string,
  options?: AttestationOptions,
): Promise<AnswerAttestation> {
  const ed = await import('@noble/ed25519');
  const { privateKey, publicKey } = await resolvePrivateKey(options);

  const questionHash = sha256Hex(questionText);
  const timestamp = new Date().toISOString();

  const payload = buildPayload(questionHash, answer, trajectory, model, timestamp);
  const canonical = canonicalize(payload);
  const msgBytes = new TextEncoder().encode(canonical);

  const sigBytes = await ed.signAsync(msgBytes, privateKey);

  return {
    questionId,
    questionHash,
    answer,
    trajectorySummary: {
      turns: trajectory.turns,
      toolsUsed: [...trajectory.toolsUsed].sort(),
      wallMs: trajectory.wallMs,
    },
    model,
    timestamp,
    publicKey: bytesToHex(publicKey),
    signature: bytesToHex(sigBytes),
    signedFields: [...SIGNED_FIELDS],
  };
}

/**
 * Verify an AnswerAttestation against its own embedded public key and
 * signature.
 *
 * Returns { valid: true } if:
 *   - The canonical payload reconstructed from attestation fields matches
 *     what was originally signed.
 *   - The Ed25519 signature is valid for that payload under the embedded
 *     public key.
 *
 * Returns { valid: false, reason: string } for any failure, with a
 * machine-readable reason code indicating which field was tampered with.
 *
 * Security note: this verifies against the SELF-ASSERTED public key embedded
 * in the attestation. For trust-pinned verification (where you pin to a
 * project-config trusted key and reject attestations signed by unknown keys),
 * extract the publicKey field and compare it against your trusted key list
 * before calling this function.
 */
export async function verifyAttestation(
  att: AnswerAttestation,
): Promise<{ valid: boolean; reason?: string }> {
  if (!att) return { valid: false, reason: 'null_attestation' };
  if (!att.signature) return { valid: false, reason: 'missing_signature' };
  if (!att.publicKey) return { valid: false, reason: 'missing_public_key' };

  const ed = await import('@noble/ed25519');

  // Re-derive the question hash from what's stored — we can't re-hash from
  // the question text at verify time (it's not embedded), so we use the
  // stored questionHash as the authoritative value and reconstruct the
  // payload exactly as it was built during signing.
  const payload = buildPayload(
    att.questionHash,
    att.answer,
    att.trajectorySummary,
    att.model,
    att.timestamp,
  );
  const canonical = canonicalize(payload);
  const msgBytes = new TextEncoder().encode(canonical);

  let pubKeyBytes: Uint8Array;
  let sigBytes: Uint8Array;

  try {
    pubKeyBytes = hexToBytes(att.publicKey);
    sigBytes = hexToBytes(att.signature);
  } catch {
    return { valid: false, reason: 'hex_decode_error' };
  }

  if (pubKeyBytes.length !== 32) {
    return { valid: false, reason: 'public_key_length_invalid' };
  }
  if (sigBytes.length !== 64) {
    return { valid: false, reason: 'signature_length_invalid' };
  }

  try {
    const ok = await ed.verifyAsync(sigBytes, msgBytes, pubKeyBytes);
    if (!ok) {
      return { valid: false, reason: 'signature_mismatch' };
    }
    return { valid: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { valid: false, reason: `verify_error:${msg}` };
  }
}

/**
 * Verify an attestation, but also check that the embedded public key matches
 * a caller-supplied trusted key. Fails if the embedded public key differs
 * from the trusted key, even if the signature itself is valid.
 *
 * This is the safe pattern for trust-pinned verification (CWE-347): pin to
 * your trusted key, do not accept attestations from unknown signers.
 */
export async function verifyAttestationWithTrustedKey(
  att: AnswerAttestation,
  trustedPublicKeyHex: string,
): Promise<{ valid: boolean; reason?: string }> {
  const trusted = trustedPublicKeyHex.replace(/^ed25519:/, '').toLowerCase();
  const embedded = att?.publicKey?.toLowerCase() ?? '';
  if (embedded !== trusted) {
    return { valid: false, reason: 'public_key_mismatch' };
  }
  return verifyAttestation(att);
}

/**
 * Attest all answers in a results JSON file and write an
 * `attestations.jsonl` next to it (one JSON object per line).
 *
 * The results file is expected to be a JSON array where each element has at
 * minimum { task_id, question, answer, model } fields. The trajectory summary
 * is filled from an optional `trajectory` field; if absent, a zero-turn
 * placeholder is used.
 *
 * @param resultsJsonPath  Path to the GAIA results JSON array file.
 * @param options          Key resolution options (same as attestAnswer).
 * @returns                Path to the written .jsonl, count, and public key hex.
 */
export async function attestResultsFile(
  resultsJsonPath: string,
  options?: AttestationOptions,
): Promise<BulkAttestationResult> {
  const raw = fs.readFileSync(resultsJsonPath, 'utf8');
  const results: Array<{
    task_id: string;
    question: string;
    answer: string;
    model?: string;
    trajectory?: TrajectorySummary;
  }> = JSON.parse(raw);

  if (!Array.isArray(results)) {
    throw new Error(`attestResultsFile: expected JSON array in ${resultsJsonPath}`);
  }

  // Resolve key once and reuse for all answers in this batch
  const ed = await import('@noble/ed25519');
  const { privateKey, publicKey } = await resolvePrivateKey(options);
  const publicKeyHex = bytesToHex(publicKey);

  const attestations: AnswerAttestation[] = [];

  for (const entry of results) {
    const questionHash = sha256Hex(entry.question ?? '');
    const answer = entry.answer ?? '';
    const model = entry.model ?? 'unknown';
    const timestamp = new Date().toISOString();
    const trajectory: TrajectorySummary = entry.trajectory ?? {
      turns: 0,
      toolsUsed: [],
      wallMs: 0,
    };

    const payload = buildPayload(questionHash, answer, trajectory, model, timestamp);
    const canonical = canonicalize(payload);
    const msgBytes = new TextEncoder().encode(canonical);
    const sigBytes = await ed.signAsync(msgBytes, privateKey);

    attestations.push({
      questionId: entry.task_id ?? '',
      questionHash,
      answer,
      trajectorySummary: {
        turns: trajectory.turns,
        toolsUsed: [...(trajectory.toolsUsed ?? [])].sort(),
        wallMs: trajectory.wallMs,
      },
      model,
      timestamp,
      publicKey: publicKeyHex,
      signature: bytesToHex(sigBytes),
      signedFields: [...SIGNED_FIELDS],
    });
  }

  const dir = path.dirname(resultsJsonPath);
  const base = path.basename(resultsJsonPath, path.extname(resultsJsonPath));
  const outputPath = path.join(dir, `${base}-attestations.jsonl`);

  const lines = attestations.map((a) => JSON.stringify(a)).join('\n') + '\n';
  fs.writeFileSync(outputPath, lines, 'utf8');

  return { outputPath, count: attestations.length, publicKey: publicKeyHex };
}

/**
 * Read an attestations.jsonl file and verify all entries.
 *
 * Returns a summary with per-entry results and an overall valid flag
 * (true only if every entry passes).
 */
export async function verifyAttestationsFile(
  attestationsJsonlPath: string,
  trustedPublicKeyHex?: string,
): Promise<{
  valid: boolean;
  results: Array<{ questionId: string; valid: boolean; reason?: string }>;
}> {
  const content = fs.readFileSync(attestationsJsonlPath, 'utf8');
  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const results: Array<{ questionId: string; valid: boolean; reason?: string }> = [];

  for (const line of lines) {
    let att: AnswerAttestation;
    try {
      att = JSON.parse(line) as AnswerAttestation;
    } catch {
      results.push({ questionId: '(parse_error)', valid: false, reason: 'json_parse_error' });
      continue;
    }

    const res = trustedPublicKeyHex
      ? await verifyAttestationWithTrustedKey(att, trustedPublicKeyHex)
      : await verifyAttestation(att);

    results.push({ questionId: att.questionId ?? '(unknown)', ...res });
  }

  return {
    valid: results.length > 0 && results.every((r) => r.valid),
    results,
  };
}
