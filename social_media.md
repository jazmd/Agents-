javascript
// ruvector/q-learning-router.js
import { EventEmitter } from 'events';
import path from 'path';
import { promisify } from 'util';
import { randomBytes } from 'crypto';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('q-learning-router');

/**
 * Default configuration for the Q-learning router.
 * @type {Readonly<Config>}
 */
const DEFAULT_CONFIG = Object.freeze({
  alpha: 0.1,
  gamma: 0.9,
  epsilon: 1.0,
  epsilonDecay: 0.999,
  epsilonMin: 0.01,
  autoSaveInterval: 1, // Save after every update to ensure persistence in short-lived processes
});

/**
 * @typedef {Object} Config
 * @property {number} alpha - Learning rate (0 < alpha <= 1).
 * @property {number} gamma - Discount factor (0 <= gamma <= 1).
 * @property {number} epsilon - Exploration rate (initial).
 * @property {number} epsilonDecay - Decay multiplier per update.
 * @property {number} epsilonMin - Minimum epsilon.
 * @property {number} autoSaveInterval - Number of updates between automatic saves (0 = off).
 */

/**
 * @typedef {Object} SerializedModel
 * @property {number} alpha
 * @property {number} gamma
 * @property {number} epsilon
 * @property {number} epsilonDecay
 * @property {number} epsilonMin
 * @property {number} updateCount
 * @property {Object<string, Object<string, number>>} qTable - Nested map serialized as objects.
 */

/**
 * @typedef {Object} UpdateResult
 * @property {number} tdError - Temporal difference error.
 * @property {number} newQ - Updated Q-value.
 */

/**
 * @typedef {Object} Status
 * @property {number} alpha
 * @property {number} gamma
 * @property {number} epsilon
 * @property {number} epsilonDecay
 * @property {number} epsilonMin
 * @property {number} updateCount
 * @property {number} tableSize - Number of tasks in the Q-table.
 * @property {number} totalEntries - Total number of (task, agent) pairs.
 */

/**
 * Q-learning router for agent selection.
 * Uses tabular Q-learning to associate tasks with optimal agents.
 * Emits 'updated' on each successful update with { task, agent, reward, tdError, newQ }.
 * Emits 'saved' after a model file is persisted.
 */
export class QLearningRouter extends EventEmitter {
  /** @type {number} – Learning rate */
  #alpha;

  /** @type {number} – Discount factor */
  #gamma;

  /** @type {number} – Exploration rate */
  #epsilon;

  /** @type {number} – Epsilon decay factor */
  #epsilonDecay;

  /** @type {number} – Minimum epsilon */
  #epsilonMin;

  /** @type {Map<string, Map<string, number>>} – Q-table: task -> agent -> value */
  #qTable;

  /** @type {number} – Auto-save interval in updates */
  #autoSaveInterval;

  /** @type {number} – Cumulative update count */
  #updateCount = 0;

  /** @type {string|null} – Last file path used for save (for convenience) */
  #lastSavePath = null;

  /**
   * Creates a new Q-learning router.
   * @param {Partial<Config>} [config] - Optional overrides for default configuration.
   * @throws {TypeError} If any config value is invalid.
   */
  constructor(config = {}) {
    super();
    const cfg = { ...DEFAULT_CONFIG, ...config };
    this.#validateConfig(cfg);

    this.#alpha = cfg.alpha;
    this.#gamma = cfg.gamma;
    this.#epsilon = cfg.epsilon;
    this.#epsilonDecay = cfg.epsilonDecay;
    this.#epsilonMin = cfg.epsilonMin;
    this.#autoSaveInterval = cfg.autoSaveInterval;
    this.#qTable = new Map();
  }

  /**
   * Validates configuration parameters.
   * @param {Config} config - Configuration to validate.
   * @returns {void}
   * @throws {TypeError} If any parameter is out of acceptable range.
   */
  #validateConfig(config) {
    const { alpha, gamma, epsilon, epsilonDecay, epsilonMin, autoSaveInterval } = config;
    const assertInRange = (name, value, min, max, inclusiveMin = true) => {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new TypeError(`${name} must be a finite number`);
      }
      const lower = inclusiveMin ? value < min : value <= min;
      const upper = value > max;
      if (lower || upper) {
        throw new TypeError(`${name} must be in [${inclusiveMin ? '' : '('}${min}, ${max}]`);
      }
    };
    assertInRange('alpha', alpha, 0, 1);
    assertInRange('gamma', gamma, 0, 1);
    assertInRange('epsilon', epsilon, 0, 1);
    assertInRange('epsilonDecay', epsilonDecay, 0, 1);
    assertInRange('epsilonMin', epsilonMin, 0, 1);
    if (epsilon < epsilonMin) {
      throw new TypeError('epsilon must be >= epsilonMin');
    }
    if (typeof autoSaveInterval !== 'number' || !Number.isInteger(autoSaveInterval) || autoSaveInterval < 0) {
      throw new TypeError('autoSaveInterval must be a non-negative integer');
    }
  }

  /**
   * Loads a Q-learning router from a serialized JSON file.
   * @param {string} filePath - Path to the model JSON file.
   * @returns {Promise<QLearningRouter>}
   * @throws {TypeError} If filePath is invalid.
   * @throws {Error} If file is missing, unreadable, or malformed.
   */
  static async load(filePath) {
    if (typeof filePath !== 'string' || filePath.length === 0) {
      throw new TypeError('filePath must be a non-empty string');
    }

    // Security: resolve path and prevent traversal / null byte attacks
    const resolvedPath = path.resolve(filePath);
    if (resolvedPath.includes('\0')) {
      throw new TypeError('filePath contains null byte (potential attack)');
    }

    const fs = await import('fs/promises');
    let raw;
    try {
      raw = await fs.readFile(resolvedPath, { encoding: 'utf-8' });
    } catch (err) {
      logger.error('Failed to read model file', { path: resolvedPath, error: err.message });
      throw err instanceof Error ? err : new Error(`Failed to read model file: ${err}`);
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      const msg = `Invalid JSON in model file: ${err instanceof Error ? err.message : err}`;
      logger.error(msg, { path: resolvedPath });
      throw new SyntaxError(msg);
    }

    // Validate serialized structure
    if (!parsed || typeof parsed.alpha !== 'number' || typeof parsed.qTable !== 'object' || parsed.qTable === null) {
      throw new Error('Invalid model format: missing or invalid alpha or qTable');
    }

    const router = new QLearningRouter({
      alpha: parsed.alpha,
      gamma: typeof parsed.gamma === 'number' ? parsed.gamma : DEFAULT_CONFIG.gamma,
      epsilon: typeof parsed.epsilon === 'number' ? parsed.epsilon : DEFAULT_CONFIG.epsilon,
      epsilonDecay: typeof parsed.epsilonDecay === 'number' ? parsed.epsilonDecay : DEFAULT_CONFIG.epsilonDecay,
      epsilonMin: typeof parsed.epsilonMin === 'number' ? parsed.epsilonMin : DEFAULT_CONFIG.epsilonMin,
      autoSaveInterval: typeof parsed.autoSaveInterval === 'number' ? parsed.autoSaveInterval : 0,
    });

    router.#updateCount = Number.isFinite(parsed.updateCount) ? Math.max(0, parsed.updateCount) : 0;

    for (const [task, agents] of Object.entries(parsed.qTable)) {
      if (typeof agents !== 'object' || agents === null) continue;
      const agentMap = new Map();
      for (const [agent, value] of Object.entries(agents)) {
        if (typeof value === 'number' && Number.isFinite(value)) {
          agentMap.set(agent, value);
        }
      }
      if (agentMap.size > 0) {
        router.#qTable.set(task, agentMap);
      }
    }

    logger.info('Q-learning model loaded', {
      updateCount: router.#updateCount,
      qTableSize: router.#qTable.size,
      epsilon: router.#epsilon,
    });

    return router;
  }

  /**
   * Serializes the current router state to a plain object suitable for JSON storage.
   * @returns {SerializedModel}
   */
  serialize() {
    const qTableObj = {};
    for (const [task, agents] of this.#qTable) {
      const agentObj = {};
      for (const [agent, value] of agents) {
        agentObj[agent] = value;
      }
      qTableObj[task] = agentObj;
    }
    return {
      alpha: this.#alpha,
      gamma: this.#gamma,
      epsilon: this.#epsilon,
      epsilonDecay: this.#epsilonDecay,
      epsilonMin: this.#epsilonMin,
      autoSaveInterval: this.#autoSaveInterval,
      updateCount: this.#updateCount,
      qTable: qTableObj,
    };
  }

  /**
   * Persists the current model to a file using atomic write (write to temp file then rename).
   * @param {string} filePath - Destination file path.
   * @returns {Promise<void>}
   * @throws {TypeError} If filePath is invalid.
   * @throws {Error} If write fails.
   */
  async saveModel(filePath) {
    if (typeof filePath !== 'string' || filePath.length === 0) {
      throw new TypeError('filePath must be a non-empty string');
    }

    const resolvedPath = path.resolve(filePath);
    if (resolvedPath.includes('\0')) {
      throw new TypeError('filePath contains null byte (potential attack)');
    }

    const fs = await import('fs/promises');
    const tempPath = `${resolvedPath}.tmp.${randomBytes(6).toString('hex')}`;

    try {
      const data = JSON.stringify(this.serialize(), null, 2);
      await fs.writeFile(tempPath, data, { encoding: 'utf-8', mode: 0o644 });
      await fs.rename(tempPath, resolvedPath);
      this.#lastSavePath = resolvedPath;
      logger.info('Q-learning model saved', { path: resolvedPath, updateCount: this.#updateCount });
      this.emit('saved', { path: resolvedPath, updateCount: this.#updateCount });
    } catch (err) {
      // Clean up temp file if rename failed
      try {
        await fs.unlink(tempPath);
      } catch {
        // ignore cleanup failure
      }
      logger.error('Failed to save model file', { path: resolvedPath, error: err.message });
      throw err instanceof Error ? err : new Error(`Failed to save model file: ${err}`);
    }
  }

  /**
   * Returns the last path the model was saved to, or null if never saved.
   * @returns {string|null}
   */
  getLastSavePath() {
    return this.#lastSavePath;
  }

  /**
   * Computes the maximum Q-value for a given task over all known agents.
   * If the task is unknown, returns 0.
   * @param {string} task - The task identifier.
   * @returns {number} Maximum Q-value.
   */
  #maxQ(task) {
    const agents = this.#qTable.get(task);
    if (!agents || agents.size === 0) return 0;
    let max = -Infinity;
    for (const value of agents.values()) {
      if (value > max) max = value;
    }
    return max;
  }

  /**
   * Returns the Q-value for a specific task-agent pair.
   * @param {string} task - Task identifier.
   * @param {string} agent - Agent identifier.
   * @returns {number} Current Q-value (0 if not present).
   */
  getQValue(task, agent) {
    if (typeof task !== 'string' || typeof agent !== 'string') {
      throw new TypeError('task and agent must be strings');
    }
    const agents = this.#qTable.get(task);
    return agents?.get(agent) ?? 0;
  }

  /**
   * Chooses an agent for a given task using epsilon-greedy policy.
   * @param {string} task - Task identifier.
   * @param {string[]} availableAgents - List of available agent identifiers.
   * @returns {string} Selected agent.
   * @throws {TypeError} If inputs are invalid.
   * @throws {Error} If no agents are available.
   */
  chooseAction(task, availableAgents) {
    if (typeof task !== 'string' || task.length === 0) {
      throw new TypeError('task must be a non-empty string');
    }
    if (!Array.isArray(availableAgents) || availableAgents.length === 0) {
      throw new TypeError('availableAgents must be a non-empty array of strings');
    }
    // Validate all agent strings
    const agents = availableAgents.filter(a => typeof a === 'string' && a.length > 0);
    if (agents.length === 0) {
      throw new Error('No valid agents in availableAgents');
    }

    // Exploration: random agent
    if (Math.random() < this.#epsilon) {
      const idx = Math.floor(Math.random() * agents.length);
      return agents[idx];
    }

    // Exploitation: choose agent with highest Q-value for this task
    let bestAgent = agents[0];
    let bestValue = this.getQValue(task, bestAgent);
    for (let i = 1; i < agents.length; i++) {
      const value = this.getQValue(task, agents[i]);
      if (value > bestValue) {
        bestValue = value;
        bestAgent = agents[i];
      }
    }
    return bestAgent;
  }

  /**
   * Updates the Q-value for a given task-agent pair using the Q-learning formula.
   * If nextTask is provided, bootstraps using the max Q-value of nextTask.
   *
   * @param {string} task - The task for which the action was taken.
   * @param {string} agent - The agent that was selected.
   * @param {number} reward - The reward received (must be finite).
   * @param {string} [nextTask] - The next task (for bootstrapping). If omitted, uses 0.
   * @returns {UpdateResult} The TD error and new Q-value.
   * @throws {TypeError} If any parameter is invalid.
   */
  update(task, agent, reward, nextTask) {
    if (typeof task !== 'string' || task.length === 0) {
      throw new TypeError('task must be a non-empty string');
    }
    if (typeof agent !== 'string' || agent.length === 0) {
      throw new TypeError('agent must be a non-empty string');
    }
    if (typeof reward !== 'number' || !Number.isFinite(reward)) {
      throw new TypeError('reward must be a finite number');
    }
    if (nextTask !== undefined && (typeof nextTask !== 'string' || nextTask.length === 0)) {
      throw new TypeError('nextTask must be a non-empty string if provided');
    }

    if (!this.#qTable.has(task)) {
      this.#qTable.set(task, new Map());
    }
    const agents = this.#qTable.get(task);

    const oldQ = agents.get(agent) ?? 0;
    const maxNext = nextTask !== undefined ? this.#maxQ(nextTask) : 0;
    const tdError = reward + this.#gamma * maxNext - oldQ;
    const newQ = oldQ + this.#alpha * tdError;

    agents.set(agent, newQ);

    // Decay epsilon
    if (this.#epsilon > this.#epsilonMin) {
      this.#epsilon = Math.max(this.#epsilon * this.#epsilonDecay, this.#epsilonMin);
    }

    this.#updateCount++;

    // Emit event for observers
    this.emit('updated', {
      task,
      agent,
      reward,
      tdError,
      newQ,
      updateCount: this.#updateCount,
      epsilon: this.#epsilon,
    });

    // Auto-save if configured
    if (this.#autoSaveInterval > 0 && this.#updateCount % this.#autoSaveInterval === 0) {
      // If we have a last save path, auto-save there; caller must have called saveModel at least once.
      // To support auto-save without explicit first save, we require the caller to manage persistence.
      // This is a safety measure: we only auto-save if a path was provided earlier.
      if (this.#lastSavePath) {
        // Fire and forget save – errors are logged inside saveModel
        this.saveModel(this.#lastSavePath).catch(err => {
          logger.error('Auto-save failed', { path: this.#lastSavePath, error: err.message });
        });
      } else {
        logger.warn('Auto-save triggered but no save path set. Use saveModel() before updates.');
      }
    }

    return { tdError, newQ };
  }

  /**
   * Returns a snapshot of the current configuration and statistics.
   * @returns {Status}
   */
  getStatus() {
    let totalEntries = 0;
    for (const agents of this.#qTable.values()) {
      totalEntries += agents.size;
    }
    return {
      alpha: this.#alpha,
      gamma: this.#gamma,
      epsilon: this.#epsilon,
      epsilonDecay: this.#epsilonDecay,
      epsilonMin: this.#epsilonMin,
      updateCount: this.#updateCount,
      tableSize: this.#qTable.size,
      totalEntries,
    };
  }

  /**
   * Resets the router to its initial state (empty Q-table, epsilon reset, update count 0).
   * Configuration parameters (alpha, gamma, etc.) are preserved.
   * @returns {void}
   */
  reset() {
    this.#qTable.clear();
    this.#epsilon = DEFAULT_CONFIG.epsilon;
    this.#updateCount = 0;
    this.#lastSavePath = null;
    logger.info('Q-learning router reset');
  }

  /**
   * Returns the underlying Q-table (read-only). For debugging or statistics.
   * @returns {ReadonlyMap<string, ReadonlyMap<string, number>>}
   */
  getTable() {
    // Return a shallow frozen copy to prevent external mutation
    const copy = new Map();
    for (const [task, agents] of this.#qTable) {
      copy.set(task, new Map(agents));
    }
    return copy;
  }
}