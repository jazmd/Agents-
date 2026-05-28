/**
 * Smoke tests for extractFinalAnswer + buildUserMessage (iter 52 T2).
 *
 * Gate 1 finding: 9 questions with >100 output tokens returned null finalAnswer.
 * Root cause: agents commit in prose, not FINAL_ANSWER: format.
 *
 * This file validates the 3-stage extraction cascade and the reversed-text
 * pre-processor introduced in iter 52 T2.
 *
 * Run (after build):
 *   node dist/benchmarks/gaia-extract.smoke.js
 *
 * Exit 0 on all pass, 1 on any failure.
 *
 * Refs: ADR-133, ADR-135, iter 52 T2, #2156
 */

// ---------------------------------------------------------------------------
// Import the functions under test (via the compiled JS path at runtime).
// We keep a local copy of the types here to avoid circular build deps.
// ---------------------------------------------------------------------------

interface AnthropicResponse {
  id: string;
  model: string;
  stop_reason: string;
  content: Array<{ type: string; text?: string }>;
  usage: { input_tokens: number; output_tokens: number };
}

// Dynamic import so this file can run either as TS source (tsx) or compiled JS.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _extractFinalAnswer: (resp: AnthropicResponse) => string | null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _buildUserMessage: (question: string) => string;

function makeResp(text: string): AnthropicResponse {
  return {
    id: 'test',
    model: 'test',
    stop_reason: 'end_turn',
    content: [{ type: 'text', text }],
    usage: { input_tokens: 0, output_tokens: 0 },
  };
}

// ---------------------------------------------------------------------------
// Test cases — (label, rawText, expectedExtraction) triples.
// expectedExtraction === null means we expect null (no answer found).
// ---------------------------------------------------------------------------

interface TestCase {
  label: string;
  input: string;
  expected: string | null;
  isUserMsg?: boolean;    // if true, test buildUserMessage instead
}

const CASES: TestCase[] = [
  // Stage 1: primary FINAL_ANSWER: pattern
  {
    label: 'Stage1 basic FINAL_ANSWER:',
    input: 'I searched and found the capital.\nFINAL_ANSWER: Paris',
    expected: 'Paris',
  },
  {
    label: 'Stage1 case-insensitive final_answer:',
    input: 'The result is known.\nfinal_answer: 42',
    expected: '42',
  },
  {
    label: 'Stage1 with leading whitespace',
    input: 'Done.\n   FINAL_ANSWER:   Tokyo   ',
    expected: 'Tokyo',
  },

  // Stage 2: prose fallback patterns
  {
    label: 'Stage2 "The answer is X"',
    input: 'After analysis, the answer is Right.',
    expected: 'Right',   // period stripped by regex optional \.?
  },
  {
    label: 'Stage2 "Therefore X"',
    input: 'Based on the clues, therefore the answer is Berlin.',
    expected: 'Berlin',  // regex captures group after "the answer is "
  },
  {
    label: 'Stage2 "Answer: X"',
    input: 'Let me compute this.\nAnswer: 17',
    expected: '17',
  },

  // Stage 3: last-line heuristic
  {
    label: 'Stage3 all-caps last line',
    input: 'I computed the value based on many steps.\nRIGHT',
    expected: 'RIGHT',
  },
  {
    label: 'Stage3 numeric last line',
    input: 'The final calculation gives us:\n346',
    expected: '346',
  },
  {
    label: 'Stage3 short-phrase last line',
    input: 'After extensive research, the result is:\nBerlin, Germany',
    expected: 'Berlin, Germany',
  },

  // Null case: no answer extractable (verbose prose, no commitment)
  {
    label: 'Null case: only tool-call reasoning, no commitment',
    input: 'I tried searching but could not find the specific information requested.',
    expected: null,
  },

  // Reversed text pre-processor (buildUserMessage)
  {
    label: 'Reversed text: adds decoded hint',
    input: '.rewsna eht sa "tfel" drow eht fo etisoppo eht etirw ,ecnetnes siht dnatsrednu uoy fI',
    expected: '[NOTE:',
    isUserMsg: true,
  },
  {
    label: 'Normal text: no hint added',
    input: 'What is the capital of France?',
    expected: 'What is the capital of France?',
    isUserMsg: true,
  },
];

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // Import at runtime to work with both tsx and compiled JS.
  const mod = await import('./gaia-agent.js');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = mod as any;

  // The functions are not exported directly — we test them through a thin
  // adapter that calls the internal logic.  We expose them for testing via
  // the SMOKE_ONLY export path added in this PR.
  _extractFinalAnswer = m._extractFinalAnswerForTest;
  _buildUserMessage = m._buildUserMessageForTest;

  if (typeof _extractFinalAnswer !== 'function' || typeof _buildUserMessage !== 'function') {
    console.error(
      'ERROR: _extractFinalAnswerForTest / _buildUserMessageForTest not exported from gaia-agent.' +
      '\nAdd `export { extractFinalAnswer as _extractFinalAnswerForTest, ' +
      'buildUserMessage as _buildUserMessageForTest }` to gaia-agent.ts.',
    );
    process.exit(1);
  }

  let failures = 0;
  const PASS = '\x1b[32mPASS\x1b[0m';
  const FAIL = '\x1b[31mFAIL\x1b[0m';

  console.log('\n=== gaia-extract smoke (iter 52 T2) ===\n');

  for (const tc of CASES) {
    let actual: string | null;

    if (tc.isUserMsg) {
      actual = _buildUserMessage(tc.input);
      // For user message tests, check startsWith instead of exact equality.
      const pass = tc.expected === null
        ? actual === null
        : actual !== null && (tc.expected === actual || actual.startsWith(tc.expected));
      if (pass) {
        console.log(`  ${PASS}  ${tc.label}`);
      } else {
        console.log(`  ${FAIL}  ${tc.label}`);
        console.log(`         expected starts-with: ${JSON.stringify(tc.expected)}`);
        console.log(`         actual:               ${JSON.stringify((actual ?? '').slice(0, 80))}`);
        failures++;
      }
    } else {
      actual = _extractFinalAnswer(makeResp(tc.input));
      const pass = tc.expected === null
        ? actual === null
        : actual !== null && actual === tc.expected;
      if (pass) {
        console.log(`  ${PASS}  ${tc.label}`);
      } else {
        console.log(`  ${FAIL}  ${tc.label}`);
        console.log(`         expected: ${JSON.stringify(tc.expected)}`);
        console.log(`         actual:   ${JSON.stringify(actual)}`);
        failures++;
      }
    }
  }

  console.log(`\n=== ${failures === 0 ? 'ALL PASSED' : `${failures} FAILED`} (${CASES.length} cases) ===\n`);
  if (failures > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Smoke crashed:', err);
  process.exit(2);
});
