# Integration Architecture Design

## Architecture Overview

This document outlines the complete integration architecture for embedding agentic-flow into the existing Agents.tsx React application.

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         React Application                            │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                      Agents.tsx (Main UI)                      │  │
│  │  - Goal input                                                  │  │
│  │  - Agent dashboard                                             │  │
│  │  - Workflow visualization                                      │  │
│  └───────────────────┬───────────────────────────────────────────┘  │
│                      │                                               │
│  ┌───────────────────▼───────────────────────────────────────────┐  │
│  │           New UI Components (shadcn/ui based)                  │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │  AgenticFlowSettings  │  Step execution configuration          │  │
│  │  StepVisualization    │  Real-time step display               │  │
│  │  PlanVisualization    │  GOAP plan graph                      │  │
│  │  RealTimeLog          │  Streaming event log                  │  │
│  │  AgentConfigPanel     │  Per-agent configuration              │  │
│  │  QualityGatesPanel    │  Enhanced quality metrics             │  │
│  └───────────────────┬───────────────────────────────────────────┘  │
└──────────────────────┼───────────────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────────────┐
│                    State Management Layer                             │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  AgenticFlowContext (React Context)                            │  │
│  │  ┌──────────────────┬──────────────────┬─────────────────────┐ │  │
│  │  │  ExecutionState  │  Configuration   │  EventStream        │ │  │
│  │  │  - Current plan  │  - Agent config  │  - SSE connection   │ │  │
│  │  │  - Active agents │  - GOAP settings │  - Event queue      │ │  │
│  │  │  - Task queue    │  - Model router  │  - Subscribers      │ │  │
│  │  └──────────────────┴──────────────────┴─────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Custom Hooks                                                   │  │
│  │  - useAgenticFlow()    - Main orchestration hook               │  │
│  │  - useGoalPlanning()   - GOAP planning hook                    │  │
│  │  - useAgentStatus()    - Agent status tracking                 │  │
│  │  - useEventStream()    - SSE event handling                    │  │
│  │  - useStepExecution()  - Step-by-step tracking                 │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────────────┐
│                       Service Layer                                   │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  /src/services/agentic-flow/                                   │  │
│  ├────────────────────────────────────────────────────────────────┤  │
│  │  AgenticFlowAPI.ts         │  Main API wrapper                 │  │
│  │  GOAPPlannerService.ts     │  Goal planning service            │  │
│  │  EventStreamService.ts     │  SSE client management            │  │
│  │  AgentManagerService.ts    │  Agent lifecycle management       │  │
│  │  TaskOrchestratorService.ts│  Task queue & distribution       │  │
│  │  MemoryService.ts          │  Memory persistence wrapper       │  │
│  │  ModelRouterService.ts     │  Multi-model routing              │  │
│  │  StateSync.ts              │  State synchronization            │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────────────┐
│                  Agentic-Flow Library (v1.4.5)                        │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Agent Runtime │ GOAP Planner │ Memory │ MCP Tools (213)       │  │
│  └────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Service Layer Design

Location: `/src/services/agentic-flow/`

#### 1.1 AgenticFlowAPI.ts (Main Orchestrator)

```typescript
/**
 * Main API wrapper for agentic-flow library
 * Provides high-level interface for all agentic-flow operations
 */

import { AgenticFlow } from 'agentic-flow';
import type {
  SwarmConfig,
  AgentConfig,
  TaskConfig,
  ExecutionResult
} from './types';

export class AgenticFlowAPI {
  private flow: AgenticFlow | null = null;
  private initialized = false;

  /**
   * Initialize the agentic-flow instance
   */
  async initialize(config: SwarmConfig): Promise<void> {
    this.flow = new AgenticFlow({
      apiKey: config.apiKey,
      modelRouter: config.modelRouter,
      memory: config.memory,
      hooks: config.hooks
    });

    await this.flow.initSwarm({
      topology: config.topology,
      maxAgents: config.maxAgents,
      strategy: config.strategy
    });

    this.initialized = true;
  }

  /**
   * Spawn a new agent
   */
  async spawnAgent(config: AgentConfig): Promise<string> {
    if (!this.flow) throw new Error('AgenticFlow not initialized');

    const agent = await this.flow.spawnAgent({
      type: config.type,
      capabilities: config.capabilities,
      name: config.name
    });

    return agent.id;
  }

  /**
   * Orchestrate a task with GOAP planning
   */
  async orchestrateTask(config: TaskConfig): Promise<ExecutionResult> {
    if (!this.flow) throw new Error('AgenticFlow not initialized');

    const result = await this.flow.orchestrateTask({
      description: config.description,
      priority: config.priority,
      maxAgents: config.maxAgents,
      strategy: config.strategy,
      goalState: config.goalState,
      currentState: config.currentState
    });

    return result;
  }

  /**
   * Get swarm status
   */
  async getSwarmStatus() {
    if (!this.flow) throw new Error('AgenticFlow not initialized');
    return await this.flow.getSwarmStatus();
  }

  /**
   * Destroy swarm and cleanup
   */
  async destroy(): Promise<void> {
    if (this.flow) {
      await this.flow.destroy();
      this.flow = null;
      this.initialized = false;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

// Singleton instance
let apiInstance: AgenticFlowAPI | null = null;

export function getAgenticFlowAPI(): AgenticFlowAPI {
  if (!apiInstance) {
    apiInstance = new AgenticFlowAPI();
  }
  return apiInstance;
}
```

#### 1.2 GOAPPlannerService.ts

```typescript
/**
 * GOAP planning service
 * Handles goal decomposition and action planning
 */

import type { WorldState, GOAPPlan, GOAPAction } from './types';

export class GOAPPlannerService {
  /**
   * Generate GOAP plan from current state to goal state
   */
  async generatePlan(
    currentState: WorldState,
    goalState: WorldState,
    availableActions: GOAPAction[]
  ): Promise<GOAPPlan> {
    // Use agentic-flow's GOAP planner
    const plan = await this.aStarSearch(
      currentState,
      goalState,
      availableActions
    );

    return {
      id: crypto.randomUUID(),
      actions: plan.actions,
      totalCost: plan.cost,
      estimatedDuration: plan.duration,
      dependencies: this.extractDependencies(plan.actions),
      metadata: {
        generatedAt: Date.now(),
        algorithm: 'A*',
        explored: plan.exploredNodes
      }
    };
  }

  /**
   * A* search implementation for GOAP
   */
  private async aStarSearch(
    start: WorldState,
    goal: WorldState,
    actions: GOAPAction[]
  ) {
    // Implementation leverages agentic-flow's internal planner
    // Returns optimal action sequence
  }

  /**
   * Extract action dependencies
   */
  private extractDependencies(actions: GOAPAction[]): Map<string, string[]> {
    const dependencies = new Map<string, string[]>();

    actions.forEach((action, index) => {
      const deps: string[] = [];

      // Find actions that satisfy this action's preconditions
      Object.keys(action.preconditions).forEach(preKey => {
        for (let i = 0; i < index; i++) {
          if (actions[i].effects[preKey] === action.preconditions[preKey]) {
            deps.push(actions[i].name);
          }
        }
      });

      dependencies.set(action.name, deps);
    });

    return dependencies;
  }

  /**
   * Validate if plan is still valid
   */
  validatePlan(plan: GOAPPlan, currentState: WorldState): boolean {
    // Check if first action's preconditions are still met
    const firstAction = plan.actions[0];
    return this.preconditionsMet(firstAction.preconditions, currentState);
  }

  private preconditionsMet(preconditions: WorldState, state: WorldState): boolean {
    return Object.entries(preconditions).every(
      ([key, value]) => state[key] === value
    );
  }
}
```

#### 1.3 EventStreamService.ts

```typescript
/**
 * SSE event stream management
 * Handles real-time updates from agentic-flow
 */

import type { AgenticFlowEvent, EventCallback } from './types';

export class EventStreamService {
  private eventSource: EventSource | null = null;
  private listeners = new Map<string, Set<EventCallback>>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  /**
   * Connect to SSE event stream
   */
  connect(url: string): void {
    this.eventSource = new EventSource(url);

    // Setup event listeners
    this.eventSource.onopen = () => {
      console.log('[EventStream] Connected');
      this.reconnectAttempts = 0;
    };

    this.eventSource.onerror = (error) => {
      console.error('[EventStream] Error:', error);
      this.handleReconnect(url);
    };

    // Listen for all event types
    this.setupEventListeners();
  }

  /**
   * Setup listeners for all event types
   */
  private setupEventListeners(): void {
    if (!this.eventSource) return;

    const eventTypes = [
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
    ];

    eventTypes.forEach(eventType => {
      this.eventSource!.addEventListener(eventType, (event: MessageEvent) => {
        const data = JSON.parse(event.data) as AgenticFlowEvent;
        this.emit(eventType, data);
      });
    });
  }

  /**
   * Subscribe to specific event type
   */
  on(eventType: string, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  /**
   * Emit event to all subscribers
   */
  private emit(eventType: string, data: AgenticFlowEvent): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }

    // Also emit to wildcard listeners
    const wildcardCallbacks = this.listeners.get('*');
    if (wildcardCallbacks) {
      wildcardCallbacks.forEach(callback => callback(data));
    }
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(url: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[EventStream] Max reconnect attempts reached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(`[EventStream] Reconnecting in ${delay}ms...`);

    setTimeout(() => {
      this.disconnect();
      this.connect(url);
    }, delay);
  }

  /**
   * Disconnect from event stream
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.listeners.clear();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}
```

#### 1.4 AgentManagerService.ts

```typescript
/**
 * Agent lifecycle management
 * Handles agent spawning, tracking, and coordination
 */

import type { Agent, AgentConfig, AgentMetrics } from './types';

export class AgentManagerService {
  private agents = new Map<string, Agent>();
  private metrics = new Map<string, AgentMetrics>();

  /**
   * Register a newly spawned agent
   */
  registerAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
    this.metrics.set(agent.id, {
      tasksCompleted: 0,
      tasksActive: 0,
      tasksFailed: 0,
      avgCompletionTime: 0,
      totalTokens: 0,
      uptime: 0,
      startedAt: Date.now()
    });
  }

  /**
   * Update agent status
   */
  updateAgentStatus(agentId: string, status: Agent['status']): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = status;
      agent.updatedAt = Date.now();
    }
  }

  /**
   * Assign task to agent
   */
  assignTask(agentId: string, taskId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.currentTask = taskId;
      agent.status = 'working';

      const metrics = this.metrics.get(agentId);
      if (metrics) {
        metrics.tasksActive++;
      }
    }
  }

  /**
   * Complete task for agent
   */
  completeTask(agentId: string, duration: number): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.currentTask = undefined;
      agent.status = 'idle';

      const metrics = this.metrics.get(agentId);
      if (metrics) {
        metrics.tasksActive--;
        metrics.tasksCompleted++;

        // Update average completion time
        const total = metrics.avgCompletionTime * (metrics.tasksCompleted - 1);
        metrics.avgCompletionTime = (total + duration) / metrics.tasksCompleted;
      }
    }
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all agents
   */
  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents by type
   */
  getAgentsByType(type: Agent['type']): Agent[] {
    return Array.from(this.agents.values()).filter(a => a.type === type);
  }

  /**
   * Get available agents (idle status)
   */
  getAvailableAgents(): Agent[] {
    return Array.from(this.agents.values()).filter(a => a.status === 'idle');
  }

  /**
   * Get agent metrics
   */
  getAgentMetrics(agentId: string): AgentMetrics | undefined {
    const metrics = this.metrics.get(agentId);
    if (metrics) {
      // Calculate uptime
      metrics.uptime = Date.now() - metrics.startedAt;
    }
    return metrics;
  }

  /**
   * Remove agent
   */
  removeAgent(agentId: string): void {
    this.agents.delete(agentId);
    this.metrics.delete(agentId);
  }

  /**
   * Clear all agents
   */
  clear(): void {
    this.agents.clear();
    this.metrics.clear();
  }
}
```

### 2. State Management Architecture

Location: `/src/contexts/AgenticFlowContext.tsx`

```typescript
/**
 * React Context for agentic-flow state management
 * Provides global state and hooks for all components
 */

import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { getAgenticFlowAPI } from '@/services/agentic-flow/AgenticFlowAPI';
import { EventStreamService } from '@/services/agentic-flow/EventStreamService';
import { AgentManagerService } from '@/services/agentic-flow/AgentManagerService';
import type {
  AgenticFlowState,
  AgenticFlowAction,
  AgenticFlowConfig,
  Agent,
  Task,
  GOAPPlan
} from '@/services/agentic-flow/types';

// Initial state
const initialState: AgenticFlowState = {
  initialized: false,
  config: null,
  swarmStatus: 'idle',
  agents: [],
  tasks: [],
  currentPlan: null,
  executionState: {
    currentPhase: 0,
    worldState: {},
    completedActions: [],
    activeActions: []
  },
  events: [],
  error: null
};

// Context
interface AgenticFlowContextValue {
  state: AgenticFlowState;
  dispatch: React.Dispatch<AgenticFlowAction>;
  api: ReturnType<typeof getAgenticFlowAPI>;
  eventStream: EventStreamService;
  agentManager: AgentManagerService;
}

const AgenticFlowContext = createContext<AgenticFlowContextValue | null>(null);

// Reducer
function agenticFlowReducer(
  state: AgenticFlowState,
  action: AgenticFlowAction
): AgenticFlowState {
  switch (action.type) {
    case 'INITIALIZE':
      return {
        ...state,
        initialized: true,
        config: action.payload,
        swarmStatus: 'initializing'
      };

    case 'SWARM_READY':
      return {
        ...state,
        swarmStatus: 'ready'
      };

    case 'AGENT_SPAWNED':
      return {
        ...state,
        agents: [...state.agents, action.payload]
      };

    case 'AGENT_UPDATED':
      return {
        ...state,
        agents: state.agents.map(agent =>
          agent.id === action.payload.id ? action.payload : agent
        )
      };

    case 'PLAN_GENERATED':
      return {
        ...state,
        currentPlan: action.payload,
        swarmStatus: 'planned'
      };

    case 'EXECUTION_STARTED':
      return {
        ...state,
        swarmStatus: 'executing'
      };

    case 'EXECUTION_PHASE_UPDATED':
      return {
        ...state,
        executionState: {
          ...state.executionState,
          currentPhase: action.payload
        }
      };

    case 'STATE_UPDATED':
      return {
        ...state,
        executionState: {
          ...state.executionState,
          worldState: action.payload
        }
      };

    case 'TASK_ADDED':
      return {
        ...state,
        tasks: [...state.tasks, action.payload]
      };

    case 'TASK_UPDATED':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? action.payload : task
        )
      };

    case 'EVENT_RECEIVED':
      return {
        ...state,
        events: [...state.events.slice(-99), action.payload] // Keep last 100 events
      };

    case 'ERROR':
      return {
        ...state,
        error: action.payload,
        swarmStatus: 'error'
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// Provider component
export function AgenticFlowProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(agenticFlowReducer, initialState);

  // Service instances
  const api = useRef(getAgenticFlowAPI());
  const eventStream = useRef(new EventStreamService());
  const agentManager = useRef(new AgentManagerService());

  // Setup event stream listeners
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // Agent events
    unsubscribers.push(
      eventStream.current.on('agent.spawned', (event) => {
        dispatch({ type: 'AGENT_SPAWNED', payload: event.data });
        agentManager.current.registerAgent(event.data);
      })
    );

    unsubscribers.push(
      eventStream.current.on('agent.progress', (event) => {
        dispatch({ type: 'AGENT_UPDATED', payload: event.data });
      })
    );

    // Plan events
    unsubscribers.push(
      eventStream.current.on('plan.generated', (event) => {
        dispatch({ type: 'PLAN_GENERATED', payload: event.data });
      })
    );

    // State events
    unsubscribers.push(
      eventStream.current.on('state.updated', (event) => {
        dispatch({ type: 'STATE_UPDATED', payload: event.data });
      })
    );

    // Task events
    unsubscribers.push(
      eventStream.current.on('task.started', (event) => {
        dispatch({ type: 'TASK_UPDATED', payload: event.data });
      })
    );

    // All events
    unsubscribers.push(
      eventStream.current.on('*', (event) => {
        dispatch({ type: 'EVENT_RECEIVED', payload: event });
      })
    );

    // Cleanup
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      eventStream.current.disconnect();
      api.current.destroy();
    };
  }, []);

  return (
    <AgenticFlowContext.Provider
      value={{
        state,
        dispatch,
        api: api.current,
        eventStream: eventStream.current,
        agentManager: agentManager.current
      }}
    >
      {children}
    </AgenticFlowContext.Provider>
  );
}

// Hook to use context
export function useAgenticFlowContext() {
  const context = useContext(AgenticFlowContext);
  if (!context) {
    throw new Error('useAgenticFlowContext must be used within AgenticFlowProvider');
  }
  return context;
}
```

### 3. Custom Hooks

Location: `/src/hooks/agentic-flow/`

#### 3.1 useAgenticFlow.ts

```typescript
/**
 * Main orchestration hook
 * Provides high-level API for agentic-flow operations
 */

import { useCallback } from 'react';
import { useAgenticFlowContext } from '@/contexts/AgenticFlowContext';
import type { SwarmConfig, AgentConfig, TaskConfig } from '@/services/agentic-flow/types';

export function useAgenticFlow() {
  const { state, dispatch, api, eventStream } = useAgenticFlowContext();

  /**
   * Initialize the swarm
   */
  const initialize = useCallback(async (config: SwarmConfig) => {
    try {
      dispatch({ type: 'INITIALIZE', payload: config });

      await api.initialize(config);

      // Connect to event stream
      eventStream.connect('/api/agentic-flow/stream');

      dispatch({ type: 'SWARM_READY' });
    } catch (error) {
      dispatch({ type: 'ERROR', payload: error as Error });
    }
  }, [api, eventStream, dispatch]);

  /**
   * Spawn a new agent
   */
  const spawnAgent = useCallback(async (config: AgentConfig) => {
    try {
      const agentId = await api.spawnAgent(config);
      return agentId;
    } catch (error) {
      dispatch({ type: 'ERROR', payload: error as Error });
      return null;
    }
  }, [api, dispatch]);

  /**
   * Execute a goal with GOAP planning
   */
  const executeGoal = useCallback(async (goal: string, goalState: any) => {
    try {
      dispatch({ type: 'EXECUTION_STARTED' });

      const result = await api.orchestrateTask({
        description: goal,
        goalState,
        currentState: state.executionState.worldState,
        priority: 'high',
        strategy: 'adaptive'
      });

      return result;
    } catch (error) {
      dispatch({ type: 'ERROR', payload: error as Error });
      return null;
    }
  }, [api, dispatch, state.executionState.worldState]);

  /**
   * Stop execution
   */
  const stop = useCallback(async () => {
    try {
      await api.destroy();
      eventStream.disconnect();
      dispatch({ type: 'RESET' });
    } catch (error) {
      dispatch({ type: 'ERROR', payload: error as Error });
    }
  }, [api, eventStream, dispatch]);

  return {
    state,
    initialize,
    spawnAgent,
    executeGoal,
    stop,
    isInitialized: state.initialized,
    isExecuting: state.swarmStatus === 'executing',
    error: state.error
  };
}
```

## Data Flow Architecture

### Goal Execution Flow

```
User Input (Goal)
      ↓
[Agents.tsx]
      ↓
useAgenticFlow.executeGoal()
      ↓
[AgenticFlowAPI]
      ↓
[GOAPPlannerService.generatePlan()]
      ↓
[Agentic-Flow Library]
  - Analyze current state
  - Generate action sequence
  - Calculate dependencies
      ↓
[Plan Generated Event]
      ↓
[EventStreamService]
      ↓
[AgenticFlowContext Reducer]
  - Update state.currentPlan
  - Dispatch PLAN_GENERATED
      ↓
[StepVisualization Component]
  - Display plan graph
  - Show action sequence
      ↓
[Execute Actions]
      ↓
[Progress Events]
      ↓
[Real-time UI Updates]
```

### Event Flow

```
[Agentic-Flow Library]
      ↓
SSE Server
      ↓
[EventStreamService]
  - Receive SSE events
  - Parse event data
  - Emit to subscribers
      ↓
[AgenticFlowContext]
  - Receive events
  - Update state via reducer
      ↓
[React Components]
  - Re-render with new state
  - Display updates
```

## Error Handling Strategy

### Error Boundaries

```typescript
// AgenticFlowErrorBoundary.tsx
class AgenticFlowErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AgenticFlow Error:', error, errorInfo);

    // Log to error tracking service
    logError(error, errorInfo);

    // Attempt recovery
    this.attemptRecovery();
  }

  private attemptRecovery() {
    // Try to reconnect event stream
    // Reset failed agents
    // Re-queue failed tasks
  }
}
```

### Retry Logic

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delay = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  throw new Error('Max retry attempts reached');
}
```

## Performance Optimization

### 1. Memoization

```typescript
// Memoize expensive computations
const memoizedPlan = useMemo(() => {
  return generateVisualization(state.currentPlan);
}, [state.currentPlan]);
```

### 2. Debouncing

```typescript
// Debounce frequent updates
const debouncedUpdate = useDebouncedCallback(
  (update) => {
    applyStateUpdate(update);
  },
  100
);
```

### 3. Virtual Scrolling

```typescript
// Use virtual scrolling for large event lists
<VirtualList
  items={state.events}
  height={600}
  itemHeight={50}
  renderItem={(event) => <EventItem event={event} />}
/>
```

## Security Considerations

### 1. API Key Management

```typescript
// Never expose API keys in client code
// Use environment variables
const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

// Or fetch from secure backend
const apiKey = await fetchApiKey();
```

### 2. Input Validation

```typescript
// Validate all user inputs
function validateGoal(goal: string): boolean {
  if (!goal || goal.length < 10) return false;
  if (containsMaliciousCode(goal)) return false;
  return true;
}
```

### 3. Rate Limiting

```typescript
// Implement rate limiting for API calls
const rateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60000 // 1 minute
});
```

## Testing Strategy

### Unit Tests

```typescript
describe('AgenticFlowAPI', () => {
  it('should initialize correctly', async () => {
    const api = new AgenticFlowAPI();
    await api.initialize(mockConfig);
    expect(api.isInitialized()).toBe(true);
  });
});
```

### Integration Tests

```typescript
describe('Goal Execution', () => {
  it('should execute full workflow', async () => {
    const { result } = renderHook(() => useAgenticFlow());

    await act(async () => {
      await result.current.initialize(config);
      await result.current.executeGoal('Build REST API');
    });

    expect(result.current.state.swarmStatus).toBe('executing');
  });
});
```

## Deployment Considerations

### Environment Variables

```bash
# .env.example
VITE_ANTHROPIC_API_KEY=
VITE_AGENTIC_FLOW_API_URL=http://localhost:3000
VITE_ENABLE_AGENTIC_FLOW=true
```

### Feature Flags

```typescript
// Feature flag for gradual rollout
const useAgenticFlowFeature = () => {
  return import.meta.env.VITE_ENABLE_AGENTIC_FLOW === 'true';
};
```

---

**Version**: 1.0.0
**Last Updated**: 2025-10-09
**Status**: Complete
