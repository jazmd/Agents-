/**
 * Smoke tests for gaia-attestation.ts — ADR-135 Track J
 *
 * All crypto is real (no mocks — @noble/ed25519 is pure TS/WASM and fast).
 * Filesystem operations are mocked via in-memory stubs so tests run
 * offline with no ~/.cache side effects.
 *
 * Test inventory:
 *   1. attestAnswer produces a valid attestation → verifyAttestation returns valid=true
 *   2. Tampered answer          → valid=false, reason='signature_mismatch'
 *   3. Tampered trajectory turns → valid=false, reason='signature_mismatch'
 *   4. Different public key claim → valid=false, reason='public_key_mismatch'
 *   5. Canonical serialization is deterministic across runs (same key, same input)
 *   6. Empty answer             → still produces valid attestation
 *   7. Bulk attestResultsFile: 5-result array → 5 attestations in .jsonl
 *
 * Each test is self-contained; tests share no global state.
 *
 * Refs: ADR-135 Track J, #2156
 */

import * as assert from 'node:assert/strict';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  attestAnswer,
  attestResultsFile,
  canonicalize,
  verifyAttestation,
  verifyAttestationWithTrustedKey,
  type AnswerAttestation,
  type AttestationOptions,
  type TrajectorySummary,
} from './gaia-attestation.js';

// ---------------------------------------------------------------------------
// Helpers shared across tests
// ---------------------------------------------------------------------------

/** Generate a fresh 32-byte Ed25519 private key. */
function freshKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

/** A minimal TrajectorySummary for use in tests. */
function sampleTrajectory(overrides: Partial<TrajectorySummary> = {}): TrajectorySummary {
  return {
    turns: 3,
    toolsUsed: ['web_search', 'code_execution'],
    wallMs: 4200,
    ...overrides,
  };
}

/** Options that supply a pre-loaded key so no disk I/O occurs. */
function keyOptions(key: Uint8Array): AttestationOptions {
  return { privateKey: key };
}

// ---------------------------------------------------------------------------
// Test 1 — round-trip: attest then verify
// ---------------------------------------------------------------------------
async function test1_roundTrip(): Promise<void> {
  const key = freshKey();
  const att = await attestAnswer(
    'task-001',
    'What is the capital of France?',
    'Paris',
    sampleTrajectory(),
    'claude-sonnet-4-5',
    keyOptions(key),
  );

  // Basic shape checks
  assert.equal(att.questionId, 'task-001', 'questionId preserved');
  assert.ok(att.questionHash.length === 64, 'questionHash is 64-char hex (SHA-256)');
  assert.equal(att.answer, 'Paris', 'answer preserved');
  assert.equal(att.model, 'claude-sonnet-4-5', 'model preserved');
  assert.ok(att.timestamp.includes('T'), 'timestamp is ISO 8601');
  assert.ok(att.publicKey.length === 64, 'publicKey is 64-char hex');
  assert.ok(att.signature.length === 128, 'signature is 128-char hex (64 bytes)');
  assert.deepEqual(att.signedFields, ['answer', 'model', 'questionHash', 'timestamp', 'trajectorySummary'],
    'signedFields canonical order');

  const result = await verifyAttestation(att);
  assert.equal(result.valid, true, 'test1: round-trip verification must pass');
  console.log('  PASS test1: round-trip attest+verify');
}

// ---------------------------------------------------------------------------
// Test 2 — tampered answer → signature_mismatch
// ---------------------------------------------------------------------------
async function test2_tamperedAnswer(): Promise<void> {
  const key = freshKey();
  const att = await attestAnswer(
    'task-002',
    'Name the highest mountain.',
    'Mount Everest',
    sampleTrajectory(),
    'claude-sonnet-4-5',
    keyOptions(key),
  );

  // Tamper the answer after signing
  const tampered: AnswerAttestation = { ...att, answer: 'K2' };
  const result = await verifyAttestation(tampered);
  assert.equal(result.valid, false, 'test2: tampered answer must fail');
  assert.equal(result.reason, 'signature_mismatch', 'test2: reason must be signature_mismatch');
  console.log('  PASS test2: tampered answer detected');
}

// ---------------------------------------------------------------------------
// Test 3 — tampered trajectory turns → signature_mismatch
// ---------------------------------------------------------------------------
async function test3_tamperedTrajectory(): Promise<void> {
  const key = freshKey();
  const att = await attestAnswer(
    'task-003',
    'How many planets are in the solar system?',
    '8',
    sampleTrajectory({ turns: 2 }),
    'claude-haiku',
    keyOptions(key),
  );

  const tampered: AnswerAttestation = {
    ...att,
    trajectorySummary: { ...att.trajectorySummary, turns: 99 },
  };
  const result = await verifyAttestation(tampered);
  assert.equal(result.valid, false, 'test3: tampered turns must fail');
  assert.equal(result.reason, 'signature_mismatch', 'test3: reason must be signature_mismatch');
  console.log('  PASS test3: tampered trajectory turns detected');
}

// ---------------------------------------------------------------------------
// Test 4 — different public key claim → public_key_mismatch
// ---------------------------------------------------------------------------
async function test4_publicKeyMismatch(): Promise<void> {
  const key = freshKey();
  const att = await attestAnswer(
    'task-004',
    'When was the Eiffel Tower built?',
    '1889',
    sampleTrajectory(),
    'claude-opus',
    keyOptions(key),
  );

  // Generate a different key and claim it was the signer
  const otherKey = freshKey();
  const ed = await import('@noble/ed25519');
  const otherPub = await ed.getPublicKeyAsync(otherKey);
  const otherPubHex = Buffer.from(otherPub).toString('hex');

  const result = await verifyAttestationWithTrustedKey(att, otherPubHex);
  assert.equal(result.valid, false, 'test4: different trusted key must reject');
  assert.equal(result.reason, 'public_key_mismatch', 'test4: reason must be public_key_mismatch');
  console.log('  PASS test4: mismatched public key rejected');
}

// ---------------------------------------------------------------------------
// Test 5 — canonical serialization is deterministic across multiple calls
// ---------------------------------------------------------------------------
async function test5_canonicalizationDeterminism(): Promise<void> {
  const key = freshKey();
  const opts = keyOptions(key);
  const questionText = 'What is 2 + 2?';

  // We can't control the timestamp from outside, so we test canonicalize()
  // directly — its output must be stable for identical inputs.
  const obj1 = {
    answer: '4',
    model: 'claude-sonnet-4-5',
    questionHash: 'aabbcc',
    timestamp: '2026-05-27T00:00:00.000Z',
    trajectorySummary: { toolsUsed: ['calc'], turns: 1, wallMs: 100 },
  };
  // Build an object with keys in a different insertion order
  const obj2 = {
    trajectorySummary: { wallMs: 100, turns: 1, toolsUsed: ['calc'] },
    timestamp: '2026-05-27T00:00:00.000Z',
    questionHash: 'aabbcc',
    model: 'claude-sonnet-4-5',
    answer: '4',
  };

  const c1 = canonicalize(obj1);
  const c2 = canonicalize(obj2);
  assert.equal(c1, c2, 'test5: canonical serialization must be key-order-independent');

  // Also verify: running canonicalize twice on the same object yields identical output
  assert.equal(canonicalize(obj1), canonicalize(obj1), 'test5: canonicalize is idempotent');

  console.log('  PASS test5: canonical serialization deterministic');
}

// ---------------------------------------------------------------------------
// Test 6 — empty answer is still attestable
// ---------------------------------------------------------------------------
async function test6_emptyAnswer(): Promise<void> {
  const key = freshKey();
  const att = await attestAnswer(
    'task-006',
    'What is the population of an unknown city?',
    '', // empty answer — agent could not determine
    sampleTrajectory({ turns: 5, toolsUsed: ['web_search'] }),
    'claude-sonnet-4-5',
    keyOptions(key),
  );

  assert.equal(att.answer, '', 'test6: empty answer preserved');
  const result = await verifyAttestation(att);
  assert.equal(result.valid, true, 'test6: empty answer produces valid attestation');
  console.log('  PASS test6: empty answer attestable');
}

// ---------------------------------------------------------------------------
// Test 7 — bulk attestation of a 5-result file
// ---------------------------------------------------------------------------
async function test7_bulkAttestResultsFile(): Promise<void> {
  const key = freshKey();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gaia-attest-smoke-'));

  try {
    const results = [
      { task_id: 'q1', question: 'Q1 text', answer: 'A1', model: 'haiku' },
      { task_id: 'q2', question: 'Q2 text', answer: 'A2', model: 'haiku' },
      { task_id: 'q3', question: 'Q3 text', answer: 'A3', model: 'sonnet' },
      { task_id: 'q4', question: 'Q4 text', answer: '',   model: 'sonnet' },
      { task_id: 'q5', question: 'Q5 text', answer: 'A5', model: 'opus',
        trajectory: { turns: 7, toolsUsed: ['web_search', 'code'], wallMs: 8000 } },
    ];

    const resultsPath = path.join(tmpDir, 'results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results), 'utf8');

    const bulkResult = await attestResultsFile(resultsPath, keyOptions(key));

    assert.equal(bulkResult.count, 5, 'test7: must produce 5 attestations');
    assert.ok(bulkResult.outputPath.endsWith('-attestations.jsonl'), 'test7: output is .jsonl');
    assert.ok(fs.existsSync(bulkResult.outputPath), 'test7: output file must exist');

    const lines = fs
      .readFileSync(bulkResult.outputPath, 'utf8')
      .split('\n')
      .filter((l) => l.trim().length > 0);
    assert.equal(lines.length, 5, 'test7: .jsonl must have 5 lines');

    // Parse and verify every attestation
    const atts: AnswerAttestation[] = lines.map((l) => JSON.parse(l));
    const taskIds = atts.map((a) => a.questionId);
    assert.deepEqual(taskIds, ['q1', 'q2', 'q3', 'q4', 'q5'], 'test7: task_ids in order');

    // All must verify against the batch public key
    for (const att of atts) {
      const r = await verifyAttestation(att);
      assert.equal(r.valid, true, `test7: att ${att.questionId} must verify`);
    }

    // All must share the same public key (single key for the batch)
    const pubKeys = new Set(atts.map((a) => a.publicKey));
    assert.equal(pubKeys.size, 1, 'test7: all attestations must use the same key');
    assert.equal([...pubKeys][0], bulkResult.publicKey, 'test7: reported publicKey matches');

    console.log('  PASS test7: bulk attestation of 5-result file');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------
async function runSmoke(): Promise<void> {
  console.log('gaia-attestation smoke tests (ADR-135 Track J)');
  console.log('================================================');

  const tests: Array<[string, () => Promise<void>]> = [
    ['test1: round-trip attest+verify', test1_roundTrip],
    ['test2: tampered answer', test2_tamperedAnswer],
    ['test3: tampered trajectory', test3_tamperedTrajectory],
    ['test4: public key mismatch', test4_publicKeyMismatch],
    ['test5: canonical serialization determinism', test5_canonicalizationDeterminism],
    ['test6: empty answer attestable', test6_emptyAnswer],
    ['test7: bulk attestation of 5-result file', test7_bulkAttestResultsFile],
  ];

  let passed = 0;
  let failed = 0;

  for (const [name, fn] of tests) {
    try {
      await fn();
      passed++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.stack ?? err.message : String(err);
      console.error(`  FAIL ${name}\n    ${msg}`);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed out of ${tests.length} total`);

  if (failed > 0) {
    process.exit(1);
  }
}

// Run when executed directly (not imported)
const isMain =
  typeof require !== 'undefined'
    ? require.main === module
    : import.meta.url === new URL(process.argv[1], 'file://').href;

if (isMain) {
  runSmoke().catch((err: unknown) => {
    console.error('Smoke test runner failed:', err);
    process.exit(1);
  });
}
