# Settings & Configuration Model

## Overview

This document defines the comprehensive configuration schema for agentic-flow integration, including all settings, options, and customization points.

## Configuration Architecture

### Hierarchical Configuration Structure

```
┌──────────────────────────────────────────┐
│         Application Config               │
│  - Global defaults                       │
│  - Environment settings                  │
└─────────────────┬────────────────────────┘
                  │
┌─────────────────▼────────────────────────┐
│         Swarm Configuration              │
│  - Topology                              │
│  - Agent limits                          │
│  - Coordination strategy                 │
└─────────────────┬────────────────────────┘
                  │
┌─────────────────▼────────────────────────┐
│         Agent Configuration              │
│  - Per-agent settings                    │
│  - Capabilities                          │
│  - Resource limits                       │
└─────────────────┬────────────────────────┘
                  │
┌─────────────────▼────────────────────────┐
│         GOAP Configuration               │
│  - Planning algorithm                    │
│  - Heuristics                            │
│  - Cost functions                        │
└─────────────────┬────────────────────────┘
                  │
┌─────────────────▼────────────────────────┐
│         Execution Configuration          │
│  - Execution mode                        │
│  - Parallelism                           │
│  - Quality gates                         │
└──────────────────────────────────────────┘
```

## TypeScript Interfaces

### Root Configuration

```typescript
/**
 * Root configuration for agentic-flow integration
 */
export interface AgenticFlowConfiguration {
  /** Application-wide settings */
  app: AppConfig;

  /** Swarm orchestration settings */
  swarm: SwarmConfig;

  /** Agent-specific settings */
  agents: AgentConfigMap;

  /** GOAP planning settings */
  goap: GOAPConfig;

  /** Execution settings */
  execution: ExecutionConfig;

  /** Model router settings */
  modelRouter: ModelRouterConfig;

  /** Memory & persistence settings */
  memory: MemoryConfig;

  /** Quality gates & validation */
  qualityGates: QualityGatesConfig;

  /** Logging & observability */
  logging: LoggingConfig;

  /** UI/UX preferences */
  ui: UIConfig;
}
```

### Application Config

```typescript
export interface AppConfig {
  /** API endpoint for agentic-flow backend */
  apiEndpoint: string;

  /** Anthropic API key */
  anthropicApiKey?: string;

  /** Enable/disable agentic-flow features */
  enabled: boolean;

  /** Development mode flag */
  devMode: boolean;

  /** Enable mock mode (for testing) */
  mockMode: boolean;

  /** Timeout for API requests (ms) */
  requestTimeout: number;

  /** Maximum retries for failed requests */
  maxRetries: number;

  /** Retry delay (ms) */
  retryDelay: number;
}

// Default values
export const defaultAppConfig: AppConfig = {
  apiEndpoint: '/api/agentic-flow',
  enabled: true,
  devMode: import.meta.env.DEV,
  mockMode: false,
  requestTimeout: 30000,
  maxRetries: 3,
  retryDelay: 1000
};
```

### Swarm Configuration

```typescript
export interface SwarmConfig {
  /** Swarm topology */
  topology: SwarmTopology;

  /** Maximum number of concurrent agents */
  maxAgents: number;

  /** Agent distribution strategy */
  strategy: DistributionStrategy;

  /** Auto-scaling settings */
  autoScaling: AutoScalingConfig;

  /** Coordination settings */
  coordination: CoordinationConfig;

  /** Consensus mechanism */
  consensus: ConsensusConfig;
}

export type SwarmTopology =
  | 'mesh'          // Fully connected, peer-to-peer
  | 'hierarchical'  // Tree structure with coordinators
  | 'ring'          // Circular communication
  | 'star';         // Centralized coordinator

export type DistributionStrategy =
  | 'balanced'      // Evenly distribute tasks
  | 'specialized'   // Assign based on capabilities
  | 'adaptive';     // Dynamic based on load

export interface AutoScalingConfig {
  /** Enable auto-scaling */
  enabled: boolean;

  /** Minimum agents to maintain */
  minAgents: number;

  /** Maximum agents allowed */
  maxAgents: number;

  /** Scale up threshold (CPU %) */
  scaleUpThreshold: number;

  /** Scale down threshold (CPU %) */
  scaleDownThreshold: number;

  /** Cooldown period between scaling operations (ms) */
  cooldownPeriod: number;
}

export interface CoordinationConfig {
  /** Shared memory enabled */
  sharedMemory: boolean;

  /** Heartbeat interval (ms) */
  heartbeatInterval: number;

  /** Agent timeout (ms) */
  agentTimeout: number;

  /** Enable distributed consensus */
  enableConsensus: boolean;
}

export interface ConsensusConfig {
  /** Consensus algorithm */
  algorithm: 'raft' | 'byzantine' | 'gossip';

  /** Quorum size (for voting) */
  quorumSize: number;

  /** Timeout for consensus (ms) */
  timeout: number;
}

// Default values
export const defaultSwarmConfig: SwarmConfig = {
  topology: 'hierarchical',
  maxAgents: 10,
  strategy: 'adaptive',
  autoScaling: {
    enabled: true,
    minAgents: 2,
    maxAgents: 20,
    scaleUpThreshold: 80,
    scaleDownThreshold: 20,
    cooldownPeriod: 60000
  },
  coordination: {
    sharedMemory: true,
    heartbeatInterval: 5000,
    agentTimeout: 30000,
    enableConsensus: false
  },
  consensus: {
    algorithm: 'raft',
    quorumSize: 3,
    timeout: 10000
  }
};
```

### Agent Configuration

```typescript
export interface AgentConfig {
  /** Agent type */
  type: AgentType;

  /** Custom agent name */
  name?: string;

  /** Agent capabilities */
  capabilities: string[];

  /** Resource limits */
  resources: AgentResourceConfig;

  /** Retry policy */
  retryPolicy: RetryPolicy;

  /** Timeout settings */
  timeout: AgentTimeoutConfig;

  /** Priority level */
  priority: AgentPriority;

  /** Enable/disable this agent */
  enabled: boolean;
}

export type AgentType =
  | 'coder'
  | 'reviewer'
  | 'tester'
  | 'planner'
  | 'researcher'
  | 'architect'
  | 'devops'
  | 'documenter';

export interface AgentResourceConfig {
  /** Max concurrent tasks */
  maxConcurrentTasks: number;

  /** Max memory (MB) */
  maxMemory: number;

  /** Max tokens per request */
  maxTokens: number;

  /** Max execution time per task (ms) */
  maxExecutionTime: number;
}

export interface RetryPolicy {
  /** Enable retries */
  enabled: boolean;

  /** Max retry attempts */
  maxAttempts: number;

  /** Backoff strategy */
  backoffStrategy: 'linear' | 'exponential' | 'fibonacci';

  /** Initial delay (ms) */
  initialDelay: number;

  /** Max delay (ms) */
  maxDelay: number;

  /** Retry on these error types */
  retryableErrors: string[];
}

export interface AgentTimeoutConfig {
  /** Idle timeout (ms) - terminate if idle */
  idleTimeout: number;

  /** Task timeout (ms) - abort task if exceeded */
  taskTimeout: number;

  /** Total lifetime (ms) - max agent lifetime */
  maxLifetime: number;
}

export type AgentPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

// Agent configuration map
export type AgentConfigMap = {
  [K in AgentType]?: AgentConfig;
};

// Default agent config
export const defaultAgentConfig: AgentConfig = {
  type: 'coder',
  capabilities: [],
  resources: {
    maxConcurrentTasks: 3,
    maxMemory: 512,
    maxTokens: 8000,
    maxExecutionTime: 300000 // 5 minutes
  },
  retryPolicy: {
    enabled: true,
    maxAttempts: 3,
    backoffStrategy: 'exponential',
    initialDelay: 1000,
    maxDelay: 30000,
    retryableErrors: ['timeout', 'rate_limit', 'network']
  },
  timeout: {
    idleTimeout: 600000, // 10 minutes
    taskTimeout: 300000, // 5 minutes
    maxLifetime: 3600000 // 1 hour
  },
  priority: 'medium',
  enabled: true
};
```

### GOAP Configuration

```typescript
export interface GOAPConfig {
  /** Planning algorithm */
  algorithm: PlanningAlgorithm;

  /** Heuristic function */
  heuristic: HeuristicConfig;

  /** Cost calculation */
  costFunction: CostFunctionConfig;

  /** Planning constraints */
  constraints: PlanningConstraints;

  /** Optimization settings */
  optimization: OptimizationConfig;

  /** Re-planning settings */
  replanning: ReplanningConfig;
}

export type PlanningAlgorithm =
  | 'a-star'      // A* search (optimal)
  | 'greedy'      // Greedy best-first
  | 'dijkstra'    // Dijkstra's algorithm
  | 'bfs'         // Breadth-first search
  | 'dfs';        // Depth-first search

export interface HeuristicConfig {
  /** Heuristic function type */
  type: HeuristicType;

  /** Weight for heuristic (0-1) */
  weight: number;

  /** Custom heuristic parameters */
  parameters: Record<string, any>;
}

export type HeuristicType =
  | 'manhattan'   // Manhattan distance
  | 'euclidean'   // Euclidean distance
  | 'hamming'     // Hamming distance
  | 'custom';     // Custom function

export interface CostFunctionConfig {
  /** Base cost calculation method */
  method: CostMethod;

  /** Cost weights */
  weights: CostWeights;

  /** Penalty for action failures */
  failurePenalty: number;

  /** Discount factor for future costs */
  discountFactor: number;
}

export type CostMethod =
  | 'uniform'     // All actions have same cost
  | 'time'        // Based on execution time
  | 'resources'   // Based on resource usage
  | 'tokens'      // Based on token consumption
  | 'hybrid';     // Combination of factors

export interface CostWeights {
  /** Weight for execution time */
  time: number;

  /** Weight for resource usage */
  resources: number;

  /** Weight for token consumption */
  tokens: number;

  /** Weight for complexity */
  complexity: number;

  /** Weight for risk */
  risk: number;
}

export interface PlanningConstraints {
  /** Maximum planning time (ms) */
  maxPlanningTime: number;

  /** Maximum plan length (actions) */
  maxPlanLength: number;

  /** Maximum states to explore */
  maxStatesExplored: number;

  /** Require all goals satisfied */
  requireAllGoals: boolean;

  /** Allow partial plans */
  allowPartialPlans: boolean;
}

export interface OptimizationConfig {
  /** Enable plan optimization */
  enabled: boolean;

  /** Optimization passes */
  passes: number;

  /** Parallel action detection */
  detectParallel: boolean;

  /** Remove redundant actions */
  removeRedundant: boolean;

  /** Merge similar actions */
  mergeSimilar: boolean;
}

export interface ReplanningConfig {
  /** Enable automatic re-planning */
  enabled: boolean;

  /** Re-plan on action failure */
  onFailure: boolean;

  /** Re-plan on state mismatch */
  onStateMismatch: boolean;

  /** Re-plan periodically */
  periodic: boolean;

  /** Period for periodic re-planning (ms) */
  period: number;

  /** Threshold for state drift before re-planning */
  stateDriftThreshold: number;
}

// Default GOAP config
export const defaultGOAPConfig: GOAPConfig = {
  algorithm: 'a-star',
  heuristic: {
    type: 'manhattan',
    weight: 0.8,
    parameters: {}
  },
  costFunction: {
    method: 'hybrid',
    weights: {
      time: 0.3,
      resources: 0.2,
      tokens: 0.2,
      complexity: 0.2,
      risk: 0.1
    },
    failurePenalty: 10,
    discountFactor: 0.95
  },
  constraints: {
    maxPlanningTime: 10000,
    maxPlanLength: 50,
    maxStatesExplored: 10000,
    requireAllGoals: true,
    allowPartialPlans: false
  },
  optimization: {
    enabled: true,
    passes: 2,
    detectParallel: true,
    removeRedundant: true,
    mergeSimilar: true
  },
  replanning: {
    enabled: true,
    onFailure: true,
    onStateMismatch: true,
    periodic: false,
    period: 60000,
    stateDriftThreshold: 0.3
  }
};
```

### Execution Configuration

```typescript
export interface ExecutionConfig {
  /** Execution mode */
  mode: ExecutionMode;

  /** Parallelism settings */
  parallelism: ParallelismConfig;

  /** Step execution settings */
  stepExecution: StepExecutionConfig;

  /** Error handling */
  errorHandling: ErrorHandlingConfig;

  /** Progress tracking */
  progressTracking: ProgressTrackingConfig;
}

export type ExecutionMode =
  | 'sequential'  // Execute actions one by one
  | 'parallel'    // Execute independent actions concurrently
  | 'hybrid'      // Mix of sequential and parallel
  | 'adaptive';   // Dynamic based on resources

export interface ParallelismConfig {
  /** Maximum parallel actions */
  maxParallelActions: number;

  /** Enable dynamic parallelism */
  dynamic: boolean;

  /** Parallelism factor (1-10) */
  factor: number;

  /** Resource threshold for parallelism (%) */
  resourceThreshold: number;
}

export interface StepExecutionConfig {
  /** Pause between steps (ms) */
  pauseBetweenSteps: number;

  /** Enable step-by-step mode */
  stepByStep: boolean;

  /** Require confirmation before each step */
  requireConfirmation: boolean;

  /** Enable rollback on failure */
  enableRollback: boolean;

  /** Checkpoint interval (steps) */
  checkpointInterval: number;
}

export interface ErrorHandlingConfig {
  /** Stop on first error */
  stopOnError: boolean;

  /** Continue on non-critical errors */
  continueOnNonCritical: boolean;

  /** Max errors before abort */
  maxErrors: number;

  /** Error recovery strategy */
  recoveryStrategy: ErrorRecoveryStrategy;

  /** Fallback actions */
  fallbackActions: boolean;
}

export type ErrorRecoveryStrategy =
  | 'retry'       // Retry failed action
  | 'skip'        // Skip failed action
  | 'replan'      // Generate new plan
  | 'abort'       // Stop execution
  | 'fallback';   // Use fallback action

export interface ProgressTrackingConfig {
  /** Update interval (ms) */
  updateInterval: number;

  /** Track detailed metrics */
  detailedMetrics: boolean;

  /** Enable progress estimation */
  enableEstimation: boolean;

  /** Emit progress events */
  emitEvents: boolean;

  /** Store progress history */
  storeHistory: boolean;
}

// Default execution config
export const defaultExecutionConfig: ExecutionConfig = {
  mode: 'adaptive',
  parallelism: {
    maxParallelActions: 5,
    dynamic: true,
    factor: 5,
    resourceThreshold: 70
  },
  stepExecution: {
    pauseBetweenSteps: 0,
    stepByStep: false,
    requireConfirmation: false,
    enableRollback: true,
    checkpointInterval: 5
  },
  errorHandling: {
    stopOnError: false,
    continueOnNonCritical: true,
    maxErrors: 5,
    recoveryStrategy: 'retry',
    fallbackActions: true
  },
  progressTracking: {
    updateInterval: 1000,
    detailedMetrics: true,
    enableEstimation: true,
    emitEvents: true,
    storeHistory: true
  }
};
```

### Model Router Configuration

```typescript
export interface ModelRouterConfig {
  /** Primary provider */
  primaryProvider: ModelProvider;

  /** Fallback providers (in order) */
  fallbackProviders: ModelProvider[];

  /** Routing strategy */
  strategy: RoutingStrategy;

  /** Cost constraints */
  costConstraints: CostConstraints;

  /** Performance requirements */
  performanceRequirements: PerformanceRequirements;

  /** Provider-specific configs */
  providers: ProviderConfigs;
}

export type ModelProvider =
  | 'anthropic'
  | 'openrouter'
  | 'gemini'
  | 'local';

export type RoutingStrategy =
  | 'cost'        // Minimize cost
  | 'speed'       // Maximize speed
  | 'quality'     // Maximize quality
  | 'privacy'     // Use local models
  | 'balanced';   // Balance all factors

export interface CostConstraints {
  /** Maximum cost per request ($) */
  maxCostPerRequest: number;

  /** Maximum total cost ($) */
  maxTotalCost: number;

  /** Cost tracking enabled */
  trackCost: boolean;

  /** Warn when cost exceeds threshold (%) */
  costWarningThreshold: number;
}

export interface PerformanceRequirements {
  /** Maximum latency (ms) */
  maxLatency: number;

  /** Minimum tokens per second */
  minTokensPerSecond: number;

  /** Target quality score (0-1) */
  targetQualityScore: number;
}

export interface ProviderConfigs {
  anthropic?: AnthropicConfig;
  openrouter?: OpenRouterConfig;
  gemini?: GeminiConfig;
  local?: LocalModelConfig;
}

export interface AnthropicConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface GeminiConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface LocalModelConfig {
  modelPath: string;
  backend: 'onnx' | 'llama.cpp' | 'ollama';
  threads: number;
  contextSize: number;
}

// Default model router config
export const defaultModelRouterConfig: ModelRouterConfig = {
  primaryProvider: 'anthropic',
  fallbackProviders: ['openrouter', 'gemini'],
  strategy: 'balanced',
  costConstraints: {
    maxCostPerRequest: 0.10,
    maxTotalCost: 10.00,
    trackCost: true,
    costWarningThreshold: 80
  },
  performanceRequirements: {
    maxLatency: 5000,
    minTokensPerSecond: 10,
    targetQualityScore: 0.8
  },
  providers: {}
};
```

### Quality Gates Configuration

```typescript
export interface QualityGatesConfig {
  /** Enable quality gates */
  enabled: boolean;

  /** Compilation check */
  compileCheck: QualityGate;

  /** Test coverage */
  testCoverage: QualityGate;

  /** Code quality */
  codeQuality: QualityGate;

  /** Security scan */
  securityScan: QualityGate;

  /** Performance check */
  performanceCheck: QualityGate;

  /** Custom gates */
  customGates: CustomQualityGate[];
}

export interface QualityGate {
  /** Enable this gate */
  enabled: boolean;

  /** Required for completion */
  required: boolean;

  /** Threshold value */
  threshold: number;

  /** Block on failure */
  blockOnFailure: boolean;

  /** Retry on failure */
  retryOnFailure: boolean;
}

export interface CustomQualityGate extends QualityGate {
  /** Gate name */
  name: string;

  /** Gate description */
  description: string;

  /** Validation function */
  validate: (result: any) => Promise<boolean>;
}

// Default quality gates config
export const defaultQualityGatesConfig: QualityGatesConfig = {
  enabled: true,
  compileCheck: {
    enabled: true,
    required: true,
    threshold: 100,
    blockOnFailure: true,
    retryOnFailure: false
  },
  testCoverage: {
    enabled: true,
    required: false,
    threshold: 80,
    blockOnFailure: false,
    retryOnFailure: false
  },
  codeQuality: {
    enabled: true,
    required: false,
    threshold: 70,
    blockOnFailure: false,
    retryOnFailure: false
  },
  securityScan: {
    enabled: true,
    required: true,
    threshold: 90,
    blockOnFailure: true,
    retryOnFailure: false
  },
  performanceCheck: {
    enabled: false,
    required: false,
    threshold: 80,
    blockOnFailure: false,
    retryOnFailure: false
  },
  customGates: []
};
```

## Configuration Presets

```typescript
/**
 * Pre-defined configuration presets for common use cases
 */
export const ConfigurationPresets = {
  /** Fast development mode */
  development: {
    swarm: {
      topology: 'mesh',
      maxAgents: 5,
      strategy: 'adaptive'
    },
    goap: {
      algorithm: 'greedy',
      constraints: {
        maxPlanningTime: 5000,
        maxPlanLength: 20
      }
    },
    execution: {
      mode: 'parallel',
      errorHandling: {
        stopOnError: false,
        continueOnNonCritical: true
      }
    },
    modelRouter: {
      strategy: 'speed',
      primaryProvider: 'gemini'
    }
  },

  /** Production-ready configuration */
  production: {
    swarm: {
      topology: 'hierarchical',
      maxAgents: 10,
      strategy: 'specialized',
      autoScaling: {
        enabled: true,
        minAgents: 3,
        maxAgents: 20
      }
    },
    goap: {
      algorithm: 'a-star',
      optimization: {
        enabled: true,
        passes: 3
      }
    },
    execution: {
      mode: 'adaptive',
      errorHandling: {
        recoveryStrategy: 'replan'
      }
    },
    qualityGates: {
      enabled: true,
      compileCheck: { enabled: true, required: true },
      testCoverage: { enabled: true, required: true, threshold: 80 },
      securityScan: { enabled: true, required: true }
    }
  },

  /** Cost-optimized configuration */
  budget: {
    swarm: {
      maxAgents: 3,
      strategy: 'balanced'
    },
    modelRouter: {
      strategy: 'cost',
      primaryProvider: 'openrouter',
      costConstraints: {
        maxCostPerRequest: 0.01,
        maxTotalCost: 1.00
      }
    }
  },

  /** High-quality configuration */
  quality: {
    swarm: {
      topology: 'hierarchical',
      maxAgents: 15
    },
    goap: {
      algorithm: 'a-star',
      optimization: {
        enabled: true,
        passes: 5
      }
    },
    modelRouter: {
      strategy: 'quality',
      primaryProvider: 'anthropic'
    },
    qualityGates: {
      enabled: true,
      testCoverage: { threshold: 90 },
      codeQuality: { threshold: 85 },
      securityScan: { threshold: 95 }
    }
  }
};
```

## Configuration Persistence

```typescript
/**
 * Configuration persistence layer
 */
export class ConfigurationManager {
  private readonly STORAGE_KEY = 'agentic-flow-config';

  /**
   * Load configuration from localStorage
   */
  load(): AgenticFlowConfiguration | null {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to parse stored configuration:', error);
      return null;
    }
  }

  /**
   * Save configuration to localStorage
   */
  save(config: AgenticFlowConfiguration): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  }

  /**
   * Reset to default configuration
   */
  reset(): AgenticFlowConfiguration {
    const defaultConfig = this.getDefaultConfiguration();
    this.save(defaultConfig);
    return defaultConfig;
  }

  /**
   * Get default configuration
   */
  private getDefaultConfiguration(): AgenticFlowConfiguration {
    return {
      app: defaultAppConfig,
      swarm: defaultSwarmConfig,
      agents: {},
      goap: defaultGOAPConfig,
      execution: defaultExecutionConfig,
      modelRouter: defaultModelRouterConfig,
      memory: {}, // defined in 05-SERVICE-LAYER
      qualityGates: defaultQualityGatesConfig,
      logging: {}, // defined below
      ui: {} // defined below
    };
  }
}
```

---

**Version**: 1.0.0
**Last Updated**: 2025-10-09
**Status**: Complete
