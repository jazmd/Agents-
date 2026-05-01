# Service Layer Design

## Overview

This document provides detailed specifications for the service layer that interfaces between the React UI and the agentic-flow library. The service layer abstracts complexity, provides error handling, and ensures clean separation of concerns.

## Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Components                          │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   Custom Hooks Layer                         │
│  useAgenticFlow() | useGoalPlanning() | useAgent Status()   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Service Layer                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ AgenticFlowAPI (Main Orchestrator)                   │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ GOAPPlannerService (Planning)                        │   │
│  │ EventStreamService (SSE)                             │   │
│  │ AgentManagerService (Agent Lifecycle)                │   │
│  │ TaskOrchestratorService (Task Queue)                 │   │
│  │ MemoryService (Persistence)                          │   │
│  │ ModelRouterService (Multi-model)                     │   │
│  │ StateSyncService (State Management)                  │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              Agentic-Flow Library (v1.4.5)                   │
└──────────────────────────────────────────────────────────────┘
```

## Core Service Implementations

### 1. TaskOrchestratorService.ts

Location: `/src/services/agentic-flow/TaskOrchestratorService.ts`

```typescript
/**
 * Task queue and orchestration service
 * Manages task distribution, prioritization, and execution coordination
 */

import type {
  Task,
  TaskConfig,
  TaskStatus,
  TaskPriority,
  Agent
} from './types';

export class TaskOrchestratorService {
  private taskQueue: Task[] = [];
  private activeTasks = new Map<string, Task>();
  private completedTasks = new Map<string, Task>();
  private failedTasks = new Map<string, Task>();

  /**
   * Add task to queue
   */
  enqueueTask(config: TaskConfig): Task {
    const task: Task = {
      id: crypto.randomUUID(),
      description: config.description,
      priority: config.priority || 'medium',
      status: 'queued',
      createdAt: Date.now(),
      dependencies: config.dependencies || [],
      preconditions: config.preconditions || {},
      effects: config.effects || {},
      estimatedDuration: config.estimatedDuration,
      maxRetries: config.maxRetries || 3,
      retryCount: 0
    };

    this.taskQueue.push(task);
    this.sortQueueByPriority();

    return task;
  }

  /**
   * Get next available task for agent
   */
  getNextTask(agent: Agent): Task | null {
    // Find task that matches agent capabilities
    const availableTask = this.taskQueue.find(task => {
      // Check if task dependencies are met
      const dependenciesMet = task.dependencies.every(depId =>
        this.completedTasks.has(depId)
      );

      if (!dependenciesMet) return false;

      // Check if agent has required capabilities
      if (task.requiredCapabilities) {
        return task.requiredCapabilities.every(cap =>
          agent.capabilities.includes(cap)
        );
      }

      return true;
    });

    if (availableTask) {
      // Move task from queue to active
      this.taskQueue = this.taskQueue.filter(t => t.id !== availableTask.id);
      availableTask.status = 'active';
      availableTask.assignedAgent = agent.id;
      availableTask.startedAt = Date.now();
      this.activeTasks.set(availableTask.id, availableTask);
    }

    return availableTask || null;
  }

  /**
   * Mark task as completed
   */
  completeTask(taskId: string, result: any): void {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found in active tasks`);
    }

    task.status = 'completed';
    task.completedAt = Date.now();
    task.duration = task.completedAt - (task.startedAt || task.createdAt);
    task.result = result;

    this.activeTasks.delete(taskId);
    this.completedTasks.set(taskId, task);

    // Check if any queued tasks can now be started
    this.checkQueuedTasks();
  }

  /**
   * Mark task as failed
   */
  failTask(taskId: string, error: Error): void {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found in active tasks`);
    }

    task.retryCount++;

    // Check if should retry
    if (task.retryCount < task.maxRetries) {
      task.status = 'queued';
      task.assignedAgent = undefined;
      this.activeTasks.delete(taskId);
      this.taskQueue.unshift(task); // Add to front of queue
      return;
    }

    // Max retries exceeded
    task.status = 'failed';
    task.completedAt = Date.now();
    task.error = error.message;

    this.activeTasks.delete(taskId);
    this.failedTasks.set(taskId, task);
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): Task | undefined {
    return (
      this.activeTasks.get(taskId) ||
      this.completedTasks.get(taskId) ||
      this.failedTasks.get(taskId) ||
      this.taskQueue.find(t => t.id === taskId)
    );
  }

  /**
   * Get all tasks
   */
  getAllTasks(): Task[] {
    return [
      ...this.taskQueue,
      ...Array.from(this.activeTasks.values()),
      ...Array.from(this.completedTasks.values()),
      ...Array.from(this.failedTasks.values())
    ];
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    return {
      queued: this.taskQueue.length,
      active: this.activeTasks.size,
      completed: this.completedTasks.size,
      failed: this.failedTasks.size,
      total: this.getAllTasks().length
    };
  }

  /**
   * Clear all tasks
   */
  clear(): void {
    this.taskQueue = [];
    this.activeTasks.clear();
    this.completedTasks.clear();
    this.failedTasks.clear();
  }

  /**
   * Sort queue by priority
   */
  private sortQueueByPriority(): void {
    const priorityOrder: Record<TaskPriority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3
    };

    this.taskQueue.sort((a, b) => {
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      return aPriority - bPriority;
    });
  }

  /**
   * Check if any queued tasks can now be started
   */
  private checkQueuedTasks(): void {
    this.taskQueue.forEach(task => {
      const dependenciesMet = task.dependencies.every(depId =>
        this.completedTasks.has(depId)
      );

      if (dependenciesMet && task.status === 'blocked') {
        task.status = 'queued';
      }
    });
  }
}
```

### 2. MemoryService.ts

```typescript
/**
 * Memory persistence and retrieval service
 * Wraps agentic-flow memory operations with caching and optimization
 */

import type { MemoryEntry, MemoryQuery } from './types';

export class MemoryService {
  private cache = new Map<string, MemoryEntry>();
  private cacheExpiry = new Map<string, number>();
  private readonly DEFAULT_TTL = 3600000; // 1 hour

  /**
   * Store data in memory
   */
  async store(
    key: string,
    value: any,
    options?: {
      namespace?: string;
      ttl?: number;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    const fullKey = this.getFullKey(key, options?.namespace);

    const entry: MemoryEntry = {
      key: fullKey,
      value,
      timestamp: Date.now(),
      ttl: options?.ttl || this.DEFAULT_TTL,
      metadata: options?.metadata
    };

    // Store in cache
    this.cache.set(fullKey, entry);
    this.cacheExpiry.set(fullKey, Date.now() + entry.ttl);

    // Store in agentic-flow memory
    try {
      await this.storeInAgenticFlow(entry);
    } catch (error) {
      console.error('Failed to store in agentic-flow memory:', error);
      // Continue - cache still has the value
    }
  }

  /**
   * Retrieve data from memory
   */
  async retrieve(
    key: string,
    options?: { namespace?: string }
  ): Promise<any | null> {
    const fullKey = this.getFullKey(key, options?.namespace);

    // Check cache first
    const cached = this.getCachedValue(fullKey);
    if (cached !== null) {
      return cached;
    }

    // Fetch from agentic-flow memory
    try {
      const entry = await this.retrieveFromAgenticFlow(fullKey);
      if (entry) {
        // Update cache
        this.cache.set(fullKey, entry);
        this.cacheExpiry.set(fullKey, Date.now() + (entry.ttl || this.DEFAULT_TTL));
        return entry.value;
      }
    } catch (error) {
      console.error('Failed to retrieve from agentic-flow memory:', error);
    }

    return null;
  }

  /**
   * Search memory with pattern
   */
  async search(query: MemoryQuery): Promise<MemoryEntry[]> {
    try {
      return await this.searchInAgenticFlow(query);
    } catch (error) {
      console.error('Memory search failed:', error);
      // Fallback to cache search
      return this.searchCache(query);
    }
  }

  /**
   * Delete entry from memory
   */
  async delete(key: string, options?: { namespace?: string }): Promise<void> {
    const fullKey = this.getFullKey(key, options?.namespace);

    // Remove from cache
    this.cache.delete(fullKey);
    this.cacheExpiry.delete(fullKey);

    // Remove from agentic-flow memory
    try {
      await this.deleteFromAgenticFlow(fullKey);
    } catch (error) {
      console.error('Failed to delete from agentic-flow memory:', error);
    }
  }

  /**
   * Clear all memory (optionally by namespace)
   */
  async clear(namespace?: string): Promise<void> {
    if (namespace) {
      // Clear specific namespace
      const prefix = `${namespace}:`;
      const keysToDelete = Array.from(this.cache.keys()).filter(k =>
        k.startsWith(prefix)
      );
      keysToDelete.forEach(key => {
        this.cache.delete(key);
        this.cacheExpiry.delete(key);
      });

      await this.clearAgenticFlowNamespace(namespace);
    } else {
      // Clear all
      this.cache.clear();
      this.cacheExpiry.clear();
      await this.clearAgenticFlowMemory();
    }
  }

  /**
   * Get memory statistics
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      totalBytes: this.calculateCacheSize(),
      namespaces: this.getNamespaces()
    };
  }

  // Private helper methods

  private getFullKey(key: string, namespace?: string): string {
    return namespace ? `${namespace}:${key}` : key;
  }

  private getCachedValue(key: string): any | null {
    const expiry = this.cacheExpiry.get(key);
    if (!expiry || Date.now() > expiry) {
      // Expired
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return null;
    }

    const entry = this.cache.get(key);
    return entry ? entry.value : null;
  }

  private calculateCacheSize(): number {
    let total = 0;
    this.cache.forEach(entry => {
      total += JSON.stringify(entry.value).length;
    });
    return total;
  }

  private getNamespaces(): string[] {
    const namespaces = new Set<string>();
    this.cache.forEach((_, key) => {
      const parts = key.split(':');
      if (parts.length > 1) {
        namespaces.add(parts[0]);
      }
    });
    return Array.from(namespaces);
  }

  private searchCache(query: MemoryQuery): MemoryEntry[] {
    const results: MemoryEntry[] = [];

    this.cache.forEach(entry => {
      const matchesPattern = query.pattern
        ? entry.key.includes(query.pattern)
        : true;

      const matchesNamespace = query.namespace
        ? entry.key.startsWith(`${query.namespace}:`)
        : true;

      if (matchesPattern && matchesNamespace) {
        results.push(entry);
      }
    });

    return results;
  }

  // Agentic-flow integration methods (to be implemented)
  private async storeInAgenticFlow(entry: MemoryEntry): Promise<void> {
    // Implementation will call agentic-flow memory API
    // await agenticFlow.memory.store(entry);
  }

  private async retrieveFromAgenticFlow(key: string): Promise<MemoryEntry | null> {
    // Implementation will call agentic-flow memory API
    // return await agenticFlow.memory.retrieve(key);
    return null;
  }

  private async searchInAgenticFlow(query: MemoryQuery): Promise<MemoryEntry[]> {
    // Implementation will call agentic-flow memory API
    // return await agenticFlow.memory.search(query);
    return [];
  }

  private async deleteFromAgenticFlow(key: string): Promise<void> {
    // Implementation will call agentic-flow memory API
    // await agenticFlow.memory.delete(key);
  }

  private async clearAgenticFlowNamespace(namespace: string): Promise<void> {
    // Implementation will call agentic-flow memory API
    // await agenticFlow.memory.clearNamespace(namespace);
  }

  private async clearAgenticFlowMemory(): Promise<void> {
    // Implementation will call agentic-flow memory API
    // await agenticFlow.memory.clear();
  }
}
```

### 3. ModelRouterService.ts

```typescript
/**
 * Multi-model routing service
 * Handles intelligent routing between different AI providers
 */

import type {
  ModelProvider,
  RoutingStrategy,
  ModelRouterConfig,
  ModelRequest,
  ModelResponse
} from './types';

export class ModelRouterService {
  private config: ModelRouterConfig;
  private costTracking = new Map<ModelProvider, number>();
  private requestCounts = new Map<ModelProvider, number>();

  constructor(config: ModelRouterConfig) {
    this.config = config;
  }

  /**
   * Route request to optimal provider
   */
  async route(request: ModelRequest): Promise<ModelResponse> {
    const provider = this.selectProvider(request);

    try {
      const response = await this.executeRequest(provider, request);

      // Track usage
      this.trackUsage(provider, response);

      return response;
    } catch (error) {
      // Try fallback providers
      return await this.handleFailure(provider, request, error as Error);
    }
  }

  /**
   * Select optimal provider based on strategy
   */
  private selectProvider(request: ModelRequest): ModelProvider {
    switch (this.config.strategy) {
      case 'cost':
        return this.selectByCost(request);
      case 'speed':
        return this.selectBySpeed(request);
      case 'quality':
        return this.selectByQuality(request);
      case 'privacy':
        return 'local';
      case 'balanced':
        return this.selectBalanced(request);
      default:
        return this.config.primaryProvider;
    }
  }

  /**
   * Select by cost (cheapest first)
   */
  private selectByCost(request: ModelRequest): ModelProvider {
    const providers = this.getAvailableProviders();
    const costs = providers.map(p => ({
      provider: p,
      cost: this.estimateCost(p, request)
    }));

    costs.sort((a, b) => a.cost - b.cost);

    // Check cost constraints
    if (costs[0].cost > this.config.costConstraints.maxCostPerRequest) {
      throw new Error('Request exceeds cost constraints');
    }

    return costs[0].provider;
  }

  /**
   * Select by speed (fastest first)
   */
  private selectBySpeed(request: ModelRequest): ModelProvider {
    // Gemini is typically fastest
    if (this.isProviderAvailable('gemini')) {
      return 'gemini';
    }

    // OpenRouter is second
    if (this.isProviderAvailable('openrouter')) {
      return 'openrouter';
    }

    return this.config.primaryProvider;
  }

  /**
   * Select by quality (best quality first)
   */
  private selectByQuality(request: ModelRequest): ModelProvider {
    // Anthropic typically has best quality
    if (this.isProviderAvailable('anthropic')) {
      return 'anthropic';
    }

    // Fallback to other providers
    return this.config.primaryProvider;
  }

  /**
   * Select balanced across multiple factors
   */
  private selectBalanced(request: ModelRequest): ModelProvider {
    const providers = this.getAvailableProviders();

    const scores = providers.map(p => ({
      provider: p,
      score: this.calculateBalancedScore(p, request)
    }));

    scores.sort((a, b) => b.score - a.score);

    return scores[0].provider;
  }

  /**
   * Calculate balanced score considering cost, speed, quality
   */
  private calculateBalancedScore(
    provider: ModelProvider,
    request: ModelRequest
  ): number {
    const costScore = 1 / this.estimateCost(provider, request);
    const speedScore = this.getSpeedScore(provider);
    const qualityScore = this.getQualityScore(provider);

    // Weighted average
    return (
      costScore * 0.3 +
      speedScore * 0.3 +
      qualityScore * 0.4
    );
  }

  /**
   * Handle request failure with fallback
   */
  private async handleFailure(
    failedProvider: ModelProvider,
    request: ModelRequest,
    error: Error
  ): Promise<ModelResponse> {
    console.warn(`Provider ${failedProvider} failed:`, error);

    // Try fallback providers
    for (const provider of this.config.fallbackProviders) {
      if (provider === failedProvider) continue;

      try {
        return await this.executeRequest(provider, request);
      } catch (fallbackError) {
        console.warn(`Fallback provider ${provider} failed:`, fallbackError);
        continue;
      }
    }

    throw new Error('All providers failed');
  }

  /**
   * Execute request with specific provider
   */
  private async executeRequest(
    provider: ModelProvider,
    request: ModelRequest
  ): Promise<ModelResponse> {
    // Implementation will call appropriate provider API
    // This is a placeholder
    return {
      provider,
      content: '',
      tokens: 0,
      cost: 0,
      duration: 0,
      timestamp: Date.now()
    };
  }

  /**
   * Track usage and costs
   */
  private trackUsage(provider: ModelProvider, response: ModelResponse): void {
    // Update cost tracking
    const currentCost = this.costTracking.get(provider) || 0;
    this.costTracking.set(provider, currentCost + response.cost);

    // Update request counts
    const currentCount = this.requestCounts.get(provider) || 0;
    this.requestCounts.set(provider, currentCount + 1);

    // Check cost warnings
    const totalCost = Array.from(this.costTracking.values()).reduce(
      (sum, cost) => sum + cost,
      0
    );

    const threshold =
      this.config.costConstraints.maxTotalCost *
      (this.config.costConstraints.costWarningThreshold / 100);

    if (totalCost > threshold) {
      console.warn(`Cost warning: $${totalCost.toFixed(2)} / $${this.config.costConstraints.maxTotalCost}`);
    }
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    const totalCost = Array.from(this.costTracking.values()).reduce(
      (sum, cost) => sum + cost,
      0
    );

    const totalRequests = Array.from(this.requestCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    );

    return {
      totalCost,
      totalRequests,
      byProvider: Array.from(this.costTracking.entries()).map(([provider, cost]) => ({
        provider,
        cost,
        requests: this.requestCounts.get(provider) || 0,
        avgCost: cost / (this.requestCounts.get(provider) || 1)
      }))
    };
  }

  // Helper methods

  private getAvailableProviders(): ModelProvider[] {
    return [
      this.config.primaryProvider,
      ...this.config.fallbackProviders
    ];
  }

  private isProviderAvailable(provider: ModelProvider): boolean {
    return this.getAvailableProviders().includes(provider);
  }

  private estimateCost(provider: ModelProvider, request: ModelRequest): number {
    // Placeholder - actual implementation would calculate based on tokens
    const baseCosts: Record<ModelProvider, number> = {
      anthropic: 0.015,
      openrouter: 0.0015,
      gemini: 0.001,
      local: 0
    };

    return baseCosts[provider] || 0.01;
  }

  private getSpeedScore(provider: ModelProvider): number {
    const speeds: Record<ModelProvider, number> = {
      gemini: 1.0,
      openrouter: 0.8,
      anthropic: 0.7,
      local: 0.5
    };

    return speeds[provider] || 0.5;
  }

  private getQualityScore(provider: ModelProvider): number {
    const quality: Record<ModelProvider, number> = {
      anthropic: 1.0,
      gemini: 0.85,
      openrouter: 0.75,
      local: 0.6
    };

    return quality[provider] || 0.5;
  }
}
```

### 4. StateSyncService.ts

```typescript
/**
 * State synchronization service
 * Keeps UI state in sync with agentic-flow execution state
 */

import type { WorldState, StateUpdate, StateDiff } from './types';

export class StateSyncService {
  private currentState: WorldState = {};
  private stateHistory: StateUpdate[] = [];
  private subscribers = new Set<(state: WorldState) => void>();

  /**
   * Update state with new values
   */
  updateState(updates: Partial<WorldState>): void {
    const previousState = { ...this.currentState };

    // Merge updates
    this.currentState = {
      ...this.currentState,
      ...updates
    };

    // Record history
    this.stateHistory.push({
      timestamp: Date.now(),
      previous: previousState,
      current: this.currentState,
      diff: this.calculateDiff(previousState, this.currentState)
    });

    // Notify subscribers
    this.notifySubscribers();
  }

  /**
   * Get current state
   */
  getCurrentState(): WorldState {
    return { ...this.currentState };
  }

  /**
   * Get state value by key
   */
  get(key: string): any {
    return this.currentState[key];
  }

  /**
   * Set state value by key
   */
  set(key: string, value: any): void {
    this.updateState({ [key]: value });
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback: (state: WorldState) => void): () => void {
    this.subscribers.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Get state history
   */
  getHistory(limit?: number): StateUpdate[] {
    if (limit) {
      return this.stateHistory.slice(-limit);
    }
    return [...this.stateHistory];
  }

  /**
   * Calculate diff between states
   */
  private calculateDiff(
    previous: WorldState,
    current: WorldState
  ): StateDiff {
    const added: string[] = [];
    const modified: string[] = [];
    const removed: string[] = [];

    // Check for added and modified keys
    Object.keys(current).forEach(key => {
      if (!(key in previous)) {
        added.push(key);
      } else if (previous[key] !== current[key]) {
        modified.push(key);
      }
    });

    // Check for removed keys
    Object.keys(previous).forEach(key => {
      if (!(key in current)) {
        removed.push(key);
      }
    });

    return { added, modified, removed };
  }

  /**
   * Notify all subscribers of state change
   */
  private notifySubscribers(): void {
    const state = this.getCurrentState();
    this.subscribers.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('State subscriber error:', error);
      }
    });
  }

  /**
   * Reset state
   */
  reset(): void {
    this.currentState = {};
    this.stateHistory = [];
    this.notifySubscribers();
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.stateHistory = [];
  }
}
```

## Service Factory Pattern

```typescript
// /src/services/agentic-flow/ServiceFactory.ts

import { AgenticFlowAPI } from './AgenticFlowAPI';
import { GOAPPlannerService } from './GOAPPlannerService';
import { EventStreamService } from './EventStreamService';
import { AgentManagerService } from './AgentManagerService';
import { TaskOrchestratorService } from './TaskOrchestratorService';
import { MemoryService } from './MemoryService';
import { ModelRouterService } from './ModelRouterService';
import { StateSyncService } from './StateSyncService';
import type { AgenticFlowConfiguration } from './types';

/**
 * Service factory for creating and managing service instances
 * Implements singleton pattern for each service
 */
export class ServiceFactory {
  private static instances = new Map<string, any>();

  /**
   * Get or create AgenticFlowAPI instance
   */
  static getAgenticFlowAPI(): AgenticFlowAPI {
    return this.getInstance('AgenticFlowAPI', () => new AgenticFlowAPI());
  }

  /**
   * Get or create GOAPPlannerService instance
   */
  static getGOAPPlannerService(): GOAPPlannerService {
    return this.getInstance('GOAPPlannerService', () => new GOAPPlannerService());
  }

  /**
   * Get or create EventStreamService instance
   */
  static getEventStreamService(): EventStreamService {
    return this.getInstance('EventStreamService', () => new EventStreamService());
  }

  /**
   * Get or create AgentManagerService instance
   */
  static getAgentManagerService(): AgentManagerService {
    return this.getInstance('AgentManagerService', () => new AgentManagerService());
  }

  /**
   * Get or create TaskOrchestratorService instance
   */
  static getTaskOrchestratorService(): TaskOrchestratorService {
    return this.getInstance('TaskOrchestratorService', () => new TaskOrchestratorService());
  }

  /**
   * Get or create MemoryService instance
   */
  static getMemoryService(): MemoryService {
    return this.getInstance('MemoryService', () => new MemoryService());
  }

  /**
   * Get or create ModelRouterService instance
   */
  static getModelRouterService(config: ModelRouterConfig): ModelRouterService {
    return this.getInstance(
      'ModelRouterService',
      () => new ModelRouterService(config)
    );
  }

  /**
   * Get or create StateSyncService instance
   */
  static getStateSyncService(): StateSyncService {
    return this.getInstance('StateSyncService', () => new StateSyncService());
  }

  /**
   * Clear all service instances (useful for testing)
   */
  static clearAll(): void {
    this.instances.clear();
  }

  /**
   * Clear specific service instance
   */
  static clear(serviceName: string): void {
    this.instances.delete(serviceName);
  }

  /**
   * Generic singleton getter
   */
  private static getInstance<T>(
    key: string,
    factory: () => T
  ): T {
    if (!this.instances.has(key)) {
      this.instances.set(key, factory());
    }
    return this.instances.get(key) as T;
  }
}
```

## API Client Wrapper

```typescript
// /src/services/agentic-flow/ApiClient.ts

/**
 * HTTP client for agentic-flow backend API
 * Provides consistent error handling and request/response transformation
 */

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;

  constructor(config: {
    baseUrl: string;
    apiKey?: string;
    timeout?: number;
  }) {
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout || 30000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
    };
  }

  /**
   * GET request
   */
  async get<T>(path: string, params?: Record<string, any>): Promise<T> {
    const url = this.buildUrl(path, params);
    return this.request<T>('GET', url);
  }

  /**
   * POST request
   */
  async post<T>(path: string, data?: any): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>('POST', url, data);
  }

  /**
   * PUT request
   */
  async put<T>(path: string, data?: any): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>('PUT', url, data);
  }

  /**
   * DELETE request
   */
  async delete<T>(path: string): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>('DELETE', url);
  }

  /**
   * Generic request method
   */
  private async request<T>(
    method: string,
    url: string,
    data?: any
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: this.defaultHeaders,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw await this.handleError(response);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      throw error;
    }
  }

  /**
   * Handle API errors
   */
  private async handleError(response: Response): Promise<Error> {
    try {
      const errorData = await response.json();
      return new Error(errorData.message || `HTTP ${response.status}`);
    } catch {
      return new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * Build full URL with query params
   */
  private buildUrl(path: string, params?: Record<string, any>): string {
    const url = new URL(path, this.baseUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }
}
```

---

**Version**: 1.0.0
**Last Updated**: 2025-10-09
**Status**: Complete
