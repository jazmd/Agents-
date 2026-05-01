# TypeScript Type Definitions

## Overview

This document provides comprehensive TypeScript interfaces and type definitions for the agentic-flow integration. All types are designed for strict type safety and IDE autocomplete support.

## Core Type Definitions

### Location: `/src/services/agentic-flow/types/index.ts`

```typescript
/**
 * Core type definitions for agentic-flow integration
 * @module agentic-flow/types
 */

// ============================================================================
// Agent Types
// ============================================================================

export type AgentType =
  | 'coder'
  | 'reviewer'
  | 'tester'
  | 'planner'
  | 'researcher'
  | 'architect'
  | 'devops'
  | 'documenter'
  | 'security'
  | 'ml-engineer'
  | 'data-analyst';

export type AgentStatus =
  | 'idle'
  | 'working'
  | 'blocked'
  | 'completed'
  | 'failed';

export interface Agent {
  id: string;
  type: AgentType;
  name: string;
  status: AgentStatus;
  capabilities: string[];
  currentTask?: string;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, any>;
}

export interface AgentConfig {
  type: AgentType;
  name?: string;
  capabilities: string[];
  resources?: AgentResourceConfig;
  retryPolicy?: RetryPolicy;
  timeout?: AgentTimeoutConfig;
  priority?: AgentPriority;
  enabled?: boolean;
}

export interface AgentResourceConfig {
  maxConcurrentTasks: number;
  maxMemory: number;
  maxTokens: number;
  maxExecutionTime: number;
}

export interface AgentTimeoutConfig {
  idleTimeout: number;
  taskTimeout: number;
  maxLifetime: number;
}

export type AgentPriority = 'low' | 'medium' | 'high' | 'critical';

export interface AgentMetrics {
  tasksCompleted: number;
  tasksActive: number;
  tasksFailed: number;
  avgCompletionTime: number;
  totalTokens: number;
  uptime: number;
  startedAt: number;
}

// ============================================================================
// Task Types
// ============================================================================

export type TaskStatus =
  | 'queued'
  | 'active'
  | 'completed'
  | 'failed'
  | 'blocked';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedAgent?: string;
  dependencies: string[];
  preconditions: WorldState;
  effects: WorldState;
  requiredCapabilities?: string[];
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  duration?: number;
  estimatedDuration?: number;
  maxRetries: number;
  retryCount: number;
  result?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface TaskConfig {
  description: string;
  priority?: TaskPriority;
  dependencies?: string[];
  preconditions?: WorldState;
  effects?: WorldState;
  goalState?: WorldState;
  currentState?: WorldState;
  requiredCapabilities?: string[];
  estimatedDuration?: number;
  maxRetries?: number;
  strategy?: ExecutionStrategy;
  maxAgents?: number;
}

// ============================================================================
// GOAP Types
// ============================================================================

export interface WorldState {
  [key: string]: any;
}

export interface GOAPAction {
  id: string;
  name: string;
  description?: string;
  preconditions: WorldState;
  effects: WorldState;
  cost: number;
  duration?: number;
  requiredCapabilities?: string[];
  execute?: () => Promise<void>;
}

export interface GOAPPlan {
  id: string;
  actions: GOAPAction[];
  totalCost: number;
  estimatedDuration: number;
  dependencies: Map<string, string[]>;
  metadata: {
    generatedAt: number;
    algorithm: string;
    explored: number;
    [key: string]: any;
  };
}

export interface GOAPGoal {
  name: string;
  desiredState: WorldState;
  priority: number;
}

// ============================================================================
// Execution Types
// ============================================================================

export type ExecutionStrategy =
  | 'sequential'
  | 'parallel'
  | 'hybrid'
  | 'adaptive';

export interface ExecutionResult {
  success: boolean;
  result?: any;
  error?: Error;
  duration: number;
  tokensUsed: number;
  cost: number;
  metadata?: Record<string, any>;
}

export interface ExecutionState {
  currentPhase: number;
  worldState: WorldState;
  completedActions: string[];
  activeActions: string[];
}

// ============================================================================
// Event Types
// ============================================================================

export type AgenticFlowEventType =
  | 'agent.spawned'
  | 'agent.started'
  | 'agent.progress'
  | 'agent.completed'
  | 'agent.failed'
  | 'task.queued'
  | 'task.started'
  | 'task.progress'
  | 'task.completed'
  | 'task.failed'
  | 'plan.generated'
  | 'state.updated'
  | 'error';

export interface AgenticFlowEvent {
  type: AgenticFlowEventType;
  timestamp: number;
  agentId?: string;
  taskId?: string;
  data: any;
}

export type EventCallback = (event: AgenticFlowEvent) => void;

// ============================================================================
// Swarm Types
// ============================================================================

export type SwarmTopology = 'mesh' | 'hierarchical' | 'ring' | 'star';

export type DistributionStrategy = 'balanced' | 'specialized' | 'adaptive';

export type SwarmStatus =
  | 'idle'
  | 'initializing'
  | 'ready'
  | 'planned'
  | 'executing'
  | 'completed'
  | 'error';

export interface SwarmConfig {
  apiKey?: string;
  topology: SwarmTopology;
  maxAgents: number;
  strategy: DistributionStrategy;
  modelRouter?: ModelRouterConfig;
  memory?: MemoryConfig;
  hooks?: HooksConfig;
  autoScaling?: AutoScalingConfig;
  coordination?: CoordinationConfig;
  consensus?: ConsensusConfig;
}

export interface AutoScalingConfig {
  enabled: boolean;
  minAgents: number;
  maxAgents: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  cooldownPeriod: number;
}

export interface CoordinationConfig {
  sharedMemory: boolean;
  heartbeatInterval: number;
  agentTimeout: number;
  enableConsensus: boolean;
}

export interface ConsensusConfig {
  algorithm: 'raft' | 'byzantine' | 'gossip';
  quorumSize: number;
  timeout: number;
}

// ============================================================================
// Model Router Types
// ============================================================================

export type ModelProvider = 'anthropic' | 'openrouter' | 'gemini' | 'local';

export type RoutingStrategy =
  | 'cost'
  | 'speed'
  | 'quality'
  | 'privacy'
  | 'balanced';

export interface ModelRouterConfig {
  primaryProvider: ModelProvider;
  fallbackProviders: ModelProvider[];
  strategy: RoutingStrategy;
  costConstraints: CostConstraints;
  performanceRequirements: PerformanceRequirements;
  providers: ProviderConfigs;
}

export interface CostConstraints {
  maxCostPerRequest: number;
  maxTotalCost: number;
  trackCost: boolean;
  costWarningThreshold: number;
}

export interface PerformanceRequirements {
  maxLatency: number;
  minTokensPerSecond: number;
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

export interface ModelRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  metadata?: Record<string, any>;
}

export interface ModelResponse {
  provider: ModelProvider;
  content: string;
  tokens: number;
  cost: number;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

// ============================================================================
// Memory Types
// ============================================================================

export interface MemoryConfig {
  namespace?: string;
  ttl?: number;
  maxSize?: number;
  persistent?: boolean;
}

export interface MemoryEntry {
  key: string;
  value: any;
  timestamp: number;
  ttl: number;
  metadata?: Record<string, any>;
}

export interface MemoryQuery {
  pattern?: string;
  namespace?: string;
  limit?: number;
}

// ============================================================================
// State Types
// ============================================================================

export interface StateUpdate {
  timestamp: number;
  previous: WorldState;
  current: WorldState;
  diff: StateDiff;
}

export interface StateDiff {
  added: string[];
  modified: string[];
  removed: string[];
}

// ============================================================================
// Quality Gates Types
// ============================================================================

export interface QualityGatesConfig {
  enabled: boolean;
  compileCheck: QualityGate;
  testCoverage: QualityGate;
  codeQuality: QualityGate;
  securityScan: QualityGate;
  performanceCheck: QualityGate;
  customGates: CustomQualityGate[];
}

export interface QualityGate {
  enabled: boolean;
  required: boolean;
  threshold: number;
  blockOnFailure: boolean;
  retryOnFailure: boolean;
}

export interface CustomQualityGate extends QualityGate {
  name: string;
  description: string;
  validate: (result: any) => Promise<boolean>;
}

// ============================================================================
// Retry Policy Types
// ============================================================================

export interface RetryPolicy {
  enabled: boolean;
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential' | 'fibonacci';
  initialDelay: number;
  maxDelay: number;
  retryableErrors: string[];
}

// ============================================================================
// Hooks Types
// ============================================================================

export interface HooksConfig {
  preTask?: (task: Task) => Promise<void>;
  postTask?: (task: Task, result: any) => Promise<void>;
  preAgent?: (agent: Agent) => Promise<void>;
  postAgent?: (agent: Agent) => Promise<void>;
  onError?: (error: Error) => Promise<void>;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface AgenticFlowConfiguration {
  app: AppConfig;
  swarm: SwarmConfig;
  agents: AgentConfigMap;
  goap: GOAPConfig;
  execution: ExecutionConfig;
  modelRouter: ModelRouterConfig;
  memory: MemoryConfig;
  qualityGates: QualityGatesConfig;
  logging: LoggingConfig;
  ui: UIConfig;
}

export interface AppConfig {
  apiEndpoint: string;
  anthropicApiKey?: string;
  enabled: boolean;
  devMode: boolean;
  mockMode: boolean;
  requestTimeout: number;
  maxRetries: number;
  retryDelay: number;
}

export type AgentConfigMap = {
  [K in AgentType]?: AgentConfig;
};

export interface GOAPConfig {
  algorithm: PlanningAlgorithm;
  heuristic: HeuristicConfig;
  costFunction: CostFunctionConfig;
  constraints: PlanningConstraints;
  optimization: OptimizationConfig;
  replanning: ReplanningConfig;
}

export type PlanningAlgorithm =
  | 'a-star'
  | 'greedy'
  | 'dijkstra'
  | 'bfs'
  | 'dfs';

export interface HeuristicConfig {
  type: HeuristicType;
  weight: number;
  parameters: Record<string, any>;
}

export type HeuristicType =
  | 'manhattan'
  | 'euclidean'
  | 'hamming'
  | 'custom';

export interface CostFunctionConfig {
  method: CostMethod;
  weights: CostWeights;
  failurePenalty: number;
  discountFactor: number;
}

export type CostMethod =
  | 'uniform'
  | 'time'
  | 'resources'
  | 'tokens'
  | 'hybrid';

export interface CostWeights {
  time: number;
  resources: number;
  tokens: number;
  complexity: number;
  risk: number;
}

export interface PlanningConstraints {
  maxPlanningTime: number;
  maxPlanLength: number;
  maxStatesExplored: number;
  requireAllGoals: boolean;
  allowPartialPlans: boolean;
}

export interface OptimizationConfig {
  enabled: boolean;
  passes: number;
  detectParallel: boolean;
  removeRedundant: boolean;
  mergeSimilar: boolean;
}

export interface ReplanningConfig {
  enabled: boolean;
  onFailure: boolean;
  onStateMismatch: boolean;
  periodic: boolean;
  period: number;
  stateDriftThreshold: number;
}

export interface ExecutionConfig {
  mode: ExecutionMode;
  parallelism: ParallelismConfig;
  stepExecution: StepExecutionConfig;
  errorHandling: ErrorHandlingConfig;
  progressTracking: ProgressTrackingConfig;
}

export type ExecutionMode =
  | 'sequential'
  | 'parallel'
  | 'hybrid'
  | 'adaptive';

export interface ParallelismConfig {
  maxParallelActions: number;
  dynamic: boolean;
  factor: number;
  resourceThreshold: number;
}

export interface StepExecutionConfig {
  pauseBetweenSteps: number;
  stepByStep: boolean;
  requireConfirmation: boolean;
  enableRollback: boolean;
  checkpointInterval: number;
}

export interface ErrorHandlingConfig {
  stopOnError: boolean;
  continueOnNonCritical: boolean;
  maxErrors: number;
  recoveryStrategy: ErrorRecoveryStrategy;
  fallbackActions: boolean;
}

export type ErrorRecoveryStrategy =
  | 'retry'
  | 'skip'
  | 'replan'
  | 'abort'
  | 'fallback';

export interface ProgressTrackingConfig {
  updateInterval: number;
  detailedMetrics: boolean;
  enableEstimation: boolean;
  emitEvents: boolean;
  storeHistory: boolean;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enabled: boolean;
  format: 'json' | 'text';
  includeTimestamp: boolean;
  includeAgentId: boolean;
}

export interface UIConfig {
  theme: 'light' | 'dark' | 'auto';
  animationsEnabled: boolean;
  soundEnabled: boolean;
  compactMode: boolean;
  maxEventsDisplayed: number;
}

// ============================================================================
// Context Types (React)
// ============================================================================

export interface AgenticFlowState {
  initialized: boolean;
  config: AgenticFlowConfiguration | null;
  swarmStatus: SwarmStatus;
  agents: Agent[];
  tasks: Task[];
  currentPlan: GOAPPlan | null;
  executionState: ExecutionState;
  events: AgenticFlowEvent[];
  error: Error | null;
}

export type AgenticFlowAction =
  | { type: 'INITIALIZE'; payload: AgenticFlowConfiguration }
  | { type: 'SWARM_READY' }
  | { type: 'AGENT_SPAWNED'; payload: Agent }
  | { type: 'AGENT_UPDATED'; payload: Agent }
  | { type: 'PLAN_GENERATED'; payload: GOAPPlan }
  | { type: 'EXECUTION_STARTED' }
  | { type: 'EXECUTION_PHASE_UPDATED'; payload: number }
  | { type: 'STATE_UPDATED'; payload: WorldState }
  | { type: 'TASK_ADDED'; payload: Task }
  | { type: 'TASK_UPDATED'; payload: Task }
  | { type: 'EVENT_RECEIVED'; payload: AgenticFlowEvent }
  | { type: 'ERROR'; payload: Error }
  | { type: 'RESET' };

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// ============================================================================
// Type Guards
// ============================================================================

export function isAgent(obj: any): obj is Agent {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.status === 'string'
  );
}

export function isTask(obj: any): obj is Task {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.status === 'string'
  );
}

export function isGOAPPlan(obj: any): obj is GOAPPlan {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    Array.isArray(obj.actions)
  );
}

export function isAgenticFlowEvent(obj: any): obj is AgenticFlowEvent {
  return (
    typeof obj === 'object' &&
    typeof obj.type === 'string' &&
    typeof obj.timestamp === 'number'
  );
}
```

## Export Configuration

```typescript
// /src/services/agentic-flow/types/index.ts (continued)

/**
 * Re-export all types from this module
 */
export * from './agent';
export * from './task';
export * from './goap';
export * from './execution';
export * from './event';
export * from './swarm';
export * from './model';
export * from './memory';
export * from './config';
```

## Validation Schemas (using Zod)

```typescript
// /src/services/agentic-flow/types/validation.ts

import { z } from 'zod';

/**
 * Runtime validation schemas using Zod
 * Provides both TypeScript types and runtime validation
 */

export const AgentTypeSchema = z.enum([
  'coder',
  'reviewer',
  'tester',
  'planner',
  'researcher',
  'architect',
  'devops',
  'documenter'
]);

export const AgentStatusSchema = z.enum([
  'idle',
  'working',
  'blocked',
  'completed',
  'failed'
]);

export const AgentSchema = z.object({
  id: z.string().uuid(),
  type: AgentTypeSchema,
  name: z.string().min(1),
  status: AgentStatusSchema,
  capabilities: z.array(z.string()),
  currentTask: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
  metadata: z.record(z.any()).optional()
});

export const TaskStatusSchema = z.enum([
  'queued',
  'active',
  'completed',
  'failed',
  'blocked'
]);

export const TaskPrioritySchema = z.enum([
  'low',
  'medium',
  'high',
  'critical'
]);

export const TaskSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1),
  priority: TaskPrioritySchema,
  status: TaskStatusSchema,
  assignedAgent: z.string().optional(),
  dependencies: z.array(z.string()),
  preconditions: z.record(z.any()),
  effects: z.record(z.any()),
  createdAt: z.number(),
  completedAt: z.number().optional(),
  duration: z.number().optional()
});

export const WorldStateSchema = z.record(z.any());

export const GOAPActionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  preconditions: WorldStateSchema,
  effects: WorldStateSchema,
  cost: z.number().min(0),
  duration: z.number().optional()
});

export const GOAPPlanSchema = z.object({
  id: z.string().uuid(),
  actions: z.array(GOAPActionSchema),
  totalCost: z.number().min(0),
  estimatedDuration: z.number().min(0),
  dependencies: z.map(z.string(), z.array(z.string())),
  metadata: z.object({
    generatedAt: z.number(),
    algorithm: z.string(),
    explored: z.number()
  })
});

/**
 * Validation helper functions
 */
export function validateAgent(data: unknown): Agent {
  return AgentSchema.parse(data);
}

export function validateTask(data: unknown): Task {
  return TaskSchema.parse(data);
}

export function validateGOAPPlan(data: unknown): GOAPPlan {
  return GOAPPlanSchema.parse(data);
}
```

## Constants

```typescript
// /src/services/agentic-flow/types/constants.ts

/**
 * Constant values used throughout the application
 */

export const AGENT_TYPES = [
  'coder',
  'reviewer',
  'tester',
  'planner',
  'researcher',
  'architect',
  'devops',
  'documenter'
] as const;

export const AGENT_STATUSES = [
  'idle',
  'working',
  'blocked',
  'completed',
  'failed'
] as const;

export const TASK_PRIORITIES = [
  'low',
  'medium',
  'high',
  'critical'
] as const;

export const SWARM_TOPOLOGIES = [
  'mesh',
  'hierarchical',
  'ring',
  'star'
] as const;

export const MODEL_PROVIDERS = [
  'anthropic',
  'openrouter',
  'gemini',
  'local'
] as const;

export const EXECUTION_STRATEGIES = [
  'sequential',
  'parallel',
  'hybrid',
  'adaptive'
] as const;

export const EVENT_TYPES = [
  'agent.spawned',
  'agent.started',
  'agent.progress',
  'agent.completed',
  'agent.failed',
  'task.queued',
  'task.started',
  'task.progress',
  'task.completed',
  'plan.generated',
  'state.updated'
] as const;

// Default timeout values (ms)
export const TIMEOUTS = {
  REQUEST: 30000,
  AGENT_IDLE: 600000,
  TASK: 300000,
  SSE_RECONNECT: 5000
} as const;

// Default limits
export const LIMITS = {
  MAX_AGENTS: 20,
  MAX_TASKS: 1000,
  MAX_EVENTS: 100,
  MAX_RETRIES: 3
} as const;

// Cost thresholds ($)
export const COST_LIMITS = {
  MAX_PER_REQUEST: 0.10,
  MAX_TOTAL: 10.00,
  WARNING_THRESHOLD: 0.80
} as const;
```

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-09  
**Status**: Complete
