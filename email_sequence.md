javascript
// commands/route.js — Production-grade route feedback command with persistence
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import winston from 'winston';
import { z } from 'zod';
import { QLearningRouter } from '../ruvector/q-learning-router.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Logger — configurable via environment (stubs for testability)
// ---------------------------------------------------------------------------
const LOG_LEVEL = process.env.ROUTE_LOG_LEVEL || 'info';
const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
});

// ---------------------------------------------------------------------------
// Schema for input validation
// ---------------------------------------------------------------------------
const feedbackSchema = z.object({
  task: z
    .string()
    .min(1, 'Task description is required')
    .max(4096, 'Task description exceeds maximum length of 4096 characters'),
  agent: z
    .string()
    .regex(/^[a-zA-Z0-9_-]{1,64}$/, 'Agent name must be 1–64 alphanumeric, underscore or hyphen'),
  reward: z
    .number()
    .finite('Reward must be a finite number')
    .min(-1, 'Reward cannot be less than -1')
    .max(1, 'Reward cannot exceed 1'),
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const DEFAULT_MODEL_DIR = path.join(__dirname, '..', '..', '.swarm');
const MODEL_FILE_NAME = 'q-learning-model.json';
const INPUT_DISPLAY_LENGTH = 80; // truncate for logs

// ---------------------------------------------------------------------------
// Types (JSDoc)
// ---------------------------------------------------------------------------

/** @typedef {Object} FeedbackArgs
 * @property {string} task
 * @property {string} agent
 * @property {number} reward
 */

/** @typedef {Object} RouterDeps
 * @property {QLearningRouter} router
 * @property {winston.Logger} logger
 * @property {string} modelDir
 * @property {string} modelPath
 */

// ---------------------------------------------------------------------------
// Internal helper: ensure model directory exists (if needed)
// ---------------------------------------------------------------------------

/**
 * Ensures the directory for the model file exists; creates it if missing.
 * @param {string} dirPath - Directory to ensure
 * @returns {Promise<void>}
 */
async function ensureModelDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    // EEXIST is fine (directory already exists)
    if (err.code !== 'EEXIST') throw err;
  }
}

// ---------------------------------------------------------------------------
// Main command
// ---------------------------------------------------------------------------

/**
 * Applies a single piece of route feedback, persisting the Q‑learning model
 * to disk immediately after the update. Includes full validation, security
 * checks, structured logging, and error handling.
 *
 * @param {FeedbackArgs} args - Command arguments
 * @returns {Promise<void>}
 * @throws {Error} On validation failure or persistent I/O issue
 */
export async function feedbackCommand(args) {
  // 1. Validate input
  const parseResult = feedbackSchema.safeParse(args);
  if (!parseResult.success) {
    const issues = parseResult.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    logger.error('Input validation failed', { issues });
    throw new Error(`Validation failure: ${issues}`);
  }

  const { task, agent, reward } = parseResult.data;

  // 2. Security: additional guard against path traversal (regex already restricts)
  if (agent.includes('..') || agent.includes('/') || agent.includes('\\')) {
    logger.warn('Path traversal attempt blocked', { agent });
    throw new Error('Security violation: agent name contains path separators');
  }

  // 3. Prepare model path
  const modelPath = path.join(DEFAULT_MODEL_DIR, MODEL_FILE_NAME);

  // 4. Bootstrap router
  const router = new QLearningRouter();

  try {
    // 5. Ensure model directory exists
    await ensureModelDir(DEFAULT_MODEL_DIR);

    // 6. Load existing model (if any) – silent if file missing
    let loaded = false;
    try {
      await router.loadModel(modelPath);
      loaded = true;
    } catch (loadErr) {
      // FileNotFound or first run – start fresh
      logger.debug('No existing model loaded; starting from scratch', {
        reason: loadErr.message,
      });
    }

    if (loaded) {
      logger.info('Q-learning model loaded', {
        updateCount: router.updateCount,
        epsilon: router.epsilon,
      });
    }

    // 7. Apply feedback
    router.update(task, agent, reward);
    logger.info('Route feedback applied', {
      task: task.substring(0, INPUT_DISPLAY_LENGTH),
      agent,
      reward,
      updateCountAfter: router.updateCount,
    });

    // 8. **Critical fix:** persist immediately (bypass auto-save interval)
    await router.saveModel(modelPath);
    logger.debug('Model saved to disk', { modelPath });

    // 9. Log post-update stats
    const stats = router.getStats();
    logger.info('Route stats after feedback', {
      updateCount: stats.updateCount,
      epsilon: stats.epsilon,
      tableSize: stats.tableSize,
    });
  } catch (err) {
    logger.error('Route feedback command failed', {
      error: err.message,
      stack: err.stack,
      args: {
        task: task?.substring(0, INPUT_DISPLAY_LENGTH) ?? '?',
        agent,
        reward,
      },
    });
    // Re-throw as a generic user‑facing error
    throw new Error(`Feedback processing error: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Testable variant with dependency injection
// ---------------------------------------------------------------------------

/**
 * Identical to `feedbackCommand` but accepts an optional `deps` object to
 * override the router, logger, model path, etc. – useful for unit testing.
 *
 * @param {FeedbackArgs} args
 * @param {Partial<RouterDeps>} [deps]
 * @returns {Promise<void>}
 */
export async function feedbackCommandWithDeps(args, deps = {}) {
  const parseResult = feedbackSchema.safeParse(args);
  if (!parseResult.success) {
    const issues = parseResult.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`Validation failure: ${issues}`);
  }

  const { task, agent, reward } = parseResult.data;

  const log = deps.logger ?? logger;
  const router = deps.router ?? new QLearningRouter();
  const modelPath = deps.modelPath ?? path.join(DEFAULT_MODEL_DIR, MODEL_FILE_NAME);
  const modelDir = deps.modelDir ?? path.dirname(modelPath);

  try {
    await ensureModelDir(modelDir);

    let loaded = false;
    try {
      await router.loadModel(modelPath);
      loaded = true;
    } catch (loadErr) {
      log.debug('No existing model loaded (test mode)', {
        reason: loadErr.message,
      });
    }

    if (loaded) {
      log.info('Router model loaded', {
        updateCount: router.updateCount,
        epsilon: router.epsilon,
      });
    }

    router.update(task, agent, reward);
    log.info('Feedback applied via injected deps', {
      task: task.substring(0, INPUT_DISPLAY_LENGTH),
      agent,
      reward,
    });

    await router.saveModel(modelPath);
    log.debug('Model persisted', { modelPath });
  } catch (err) {
    log.error('Feedback command (deps) failed', {
      error: err.message,
      stack: err.stack,
    });
    throw err;
  }
}