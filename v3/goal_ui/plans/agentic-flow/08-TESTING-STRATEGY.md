# Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for the agentic-flow integration, covering unit tests, integration tests, end-to-end tests, performance tests, and accessibility validation.

## Testing Pyramid

```
        /\
       /E2E\        10% - End-to-End Tests
      /━━━━━\
     /Integr.\ 20% - Integration Tests
    /━━━━━━━━━\
   /Unit Tests\ 70% - Unit Tests
  /━━━━━━━━━━━━━\
```

## Test Framework Stack

### Core Testing Tools
- **Jest** - Unit and integration testing
- **React Testing Library** - React component testing
- **Vitest** - Fast unit test runner (alternative to Jest)
- **Playwright** - E2E testing
- **MSW (Mock Service Worker)** - API mocking
- **@testing-library/jest-dom** - Custom matchers

### Installation

```bash
npm install --save-dev \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @playwright/test \
  msw \
  vitest \
  @vitest/ui
```

## Unit Testing Strategy

### Service Layer Tests

#### AgenticFlowAPI.test.ts

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AgenticFlowAPI } from '@/services/agentic-flow/AgenticFlowAPI';
import type { SwarmConfig, AgentConfig } from '@/services/agentic-flow/types';

describe('AgenticFlowAPI', () => {
  let api: AgenticFlowAPI;
  const mockConfig: SwarmConfig = {
    topology: 'mesh',
    maxAgents: 5,
    strategy: 'balanced'
  };

  beforeEach(() => {
    api = new AgenticFlowAPI();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with valid config', async () => {
      await api.initialize(mockConfig);
      expect(api.isInitialized()).toBe(true);
    });

    it('should throw error with invalid config', async () => {
      const invalidConfig = { ...mockConfig, maxAgents: -1 };
      await expect(api.initialize(invalidConfig)).rejects.toThrow();
    });

    it('should not initialize twice', async () => {
      await api.initialize(mockConfig);
      await expect(api.initialize(mockConfig)).rejects.toThrow(
        'Already initialized'
      );
    });
  });

  describe('agent spawning', () => {
    beforeEach(async () => {
      await api.initialize(mockConfig);
    });

    it('should spawn agent with valid config', async () => {
      const agentConfig: AgentConfig = {
        type: 'coder',
        capabilities: ['react', 'typescript']
      };

      const agentId = await api.spawnAgent(agentConfig);
      expect(agentId).toBeDefined();
      expect(typeof agentId).toBe('string');
    });

    it('should throw error when not initialized', async () => {
      const uninitializedApi = new AgenticFlowAPI();
      await expect(
        uninitializedApi.spawnAgent({ type: 'coder', capabilities: [] })
      ).rejects.toThrow('not initialized');
    });
  });

  describe('task orchestration', () => {
    beforeEach(async () => {
      await api.initialize(mockConfig);
    });

    it('should orchestrate task successfully', async () => {
      const result = await api.orchestrateTask({
        description: 'Build REST API',
        priority: 'high',
        goalState: { api_built: true }
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle task failure gracefully', async () => {
      vi.spyOn(api, 'orchestrateTask').mockRejectedValue(
        new Error('Task failed')
      );

      await expect(
        api.orchestrateTask({
          description: 'Invalid task',
          priority: 'low'
        })
      ).rejects.toThrow('Task failed');
    });
  });

  describe('cleanup', () => {
    it('should destroy and cleanup resources', async () => {
      await api.initialize(mockConfig);
      await api.destroy();
      expect(api.isInitialized()).toBe(false);
    });
  });
});
```

#### GOAPPlannerService.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { GOAPPlannerService } from '@/services/agentic-flow/GOAPPlannerService';
import type { WorldState, GOAPAction } from '@/services/agentic-flow/types';

describe('GOAPPlannerService', () => {
  const planner = new GOAPPlannerService();

  describe('plan generation', () => {
    it('should generate optimal plan', async () => {
      const currentState: WorldState = {
        code_written: false,
        tests_written: false,
        deployed: false
      };

      const goalState: WorldState = {
        code_written: true,
        tests_written: true,
        deployed: true
      };

      const actions: GOAPAction[] = [
        {
          id: '1',
          name: 'write_code',
          preconditions: {},
          effects: { code_written: true },
          cost: 5
        },
        {
          id: '2',
          name: 'write_tests',
          preconditions: { code_written: true },
          effects: { tests_written: true },
          cost: 3
        },
        {
          id: '3',
          name: 'deploy',
          preconditions: { code_written: true, tests_written: true },
          effects: { deployed: true },
          cost: 2
        }
      ];

      const plan = await planner.generatePlan(currentState, goalState, actions);

      expect(plan).toBeDefined();
      expect(plan.actions.length).toBe(3);
      expect(plan.totalCost).toBe(10);
      expect(plan.actions[0].name).toBe('write_code');
      expect(plan.actions[1].name).toBe('write_tests');
      expect(plan.actions[2].name).toBe('deploy');
    });

    it('should handle impossible goals', async () => {
      const currentState = { locked: true };
      const goalState = { unlocked: true };
      const actions: GOAPAction[] = []; // No actions to unlock

      await expect(
        planner.generatePlan(currentState, goalState, actions)
      ).rejects.toThrow('No plan found');
    });

    it('should respect cost constraints', async () => {
      // Test that planner prefers cheaper paths
      const currentState = { start: true };
      const goalState = { end: true };

      const actions: GOAPAction[] = [
        {
          id: '1',
          name: 'expensive_path',
          preconditions: { start: true },
          effects: { end: true },
          cost: 100
        },
        {
          id: '2',
          name: 'cheap_path',
          preconditions: { start: true },
          effects: { end: true },
          cost: 1
        }
      ];

      const plan = await planner.generatePlan(currentState, goalState, actions);

      expect(plan.actions[0].name).toBe('cheap_path');
      expect(plan.totalCost).toBe(1);
    });
  });

  describe('plan validation', () => {
    it('should validate correct plan', () => {
      const plan = {
        id: '1',
        actions: [
          {
            id: '1',
            name: 'action1',
            preconditions: {},
            effects: { done: true },
            cost: 1
          }
        ],
        totalCost: 1,
        estimatedDuration: 1000,
        dependencies: new Map(),
        metadata: {
          generatedAt: Date.now(),
          algorithm: 'a-star',
          explored: 10
        }
      };

      const currentState = {};
      expect(planner.validatePlan(plan, currentState)).toBe(true);
    });

    it('should invalidate plan with unmet preconditions', () => {
      const plan = {
        id: '1',
        actions: [
          {
            id: '1',
            name: 'action1',
            preconditions: { required: true },
            effects: { done: true },
            cost: 1
          }
        ],
        totalCost: 1,
        estimatedDuration: 1000,
        dependencies: new Map(),
        metadata: {
          generatedAt: Date.now(),
          algorithm: 'a-star',
          explored: 10
        }
      };

      const currentState = { required: false };
      expect(planner.validatePlan(plan, currentState)).toBe(false);
    });
  });
});
```

### React Hook Tests

#### useAgenticFlow.test.tsx

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAgenticFlow } from '@/hooks/agentic-flow/useAgenticFlow';
import { AgenticFlowProvider } from '@/contexts/AgenticFlowContext';
import type { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => (
  <AgenticFlowProvider>{children}</AgenticFlowProvider>
);

describe('useAgenticFlow', () => {
  it('should initialize successfully', async () => {
    const { result } = renderHook(() => useAgenticFlow(), { wrapper });

    expect(result.current.isInitialized).toBe(false);

    await act(async () => {
      await result.current.initialize({
        topology: 'mesh',
        maxAgents: 5,
        strategy: 'balanced'
      });
    });

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });
  });

  it('should spawn agents', async () => {
    const { result } = renderHook(() => useAgenticFlow(), { wrapper });

    await act(async () => {
      await result.current.initialize({
        topology: 'mesh',
        maxAgents: 5,
        strategy: 'balanced'
      });
    });

    await act(async () => {
      await result.current.spawnAgent({
        type: 'coder',
        capabilities: ['react']
      });
    });

    await waitFor(() => {
      expect(result.current.state.agents.length).toBeGreaterThan(0);
    });
  });

  it('should execute goal', async () => {
    const { result } = renderHook(() => useAgenticFlow(), { wrapper });

    await act(async () => {
      await result.current.initialize({
        topology: 'mesh',
        maxAgents: 5,
        strategy: 'balanced'
      });
    });

    await act(async () => {
      await result.current.executeGoal('Build REST API', {
        api_built: true
      });
    });

    await waitFor(() => {
      expect(result.current.isExecuting).toBe(true);
    });
  });
});
```

### Component Tests

#### PlanVisualization.test.tsx

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlanVisualization } from '@/components/agentic-flow/PlanVisualization';
import type { GOAPPlan } from '@/services/agentic-flow/types';

const mockPlan: GOAPPlan = {
  id: '1',
  actions: [
    {
      id: '1',
      name: 'Write Code',
      preconditions: {},
      effects: { code_written: true },
      cost: 5
    },
    {
      id: '2',
      name: 'Write Tests',
      preconditions: { code_written: true },
      effects: { tests_written: true },
      cost: 3
    }
  ],
  totalCost: 8,
  estimatedDuration: 10000,
  dependencies: new Map([['Write Tests', ['Write Code']]]),
  metadata: {
    generatedAt: Date.now(),
    algorithm: 'a-star',
    explored: 25
  }
};

describe('PlanVisualization', () => {
  it('should render plan graph', () => {
    render(<PlanVisualization plan={mockPlan} />);

    expect(screen.getByText('Execution Plan')).toBeInTheDocument();
    expect(screen.getByText('2 Actions')).toBeInTheDocument();
    expect(screen.getByText('Cost: 8')).toBeInTheDocument();
  });

  it('should switch between views', () => {
    render(<PlanVisualization plan={mockPlan} />);

    const timelineTab = screen.getByRole('tab', { name: /timeline/i });
    fireEvent.click(timelineTab);

    expect(screen.getByText('Write Code')).toBeInTheDocument();
    expect(screen.getByText('Write Tests')).toBeInTheDocument();
  });

  it('should call onActionClick when action is clicked', () => {
    const handleActionClick = vi.fn();

    render(
      <PlanVisualization plan={mockPlan} onActionClick={handleActionClick} />
    );

    // Simulate clicking an action node
    const actionNode = screen.getByText('Write Code');
    fireEvent.click(actionNode.closest('[data-action-id]')!);

    expect(handleActionClick).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Write Code' })
    );
  });

  it('should highlight current action', () => {
    render(
      <PlanVisualization
        plan={mockPlan}
        currentActionId="2"
        completedActionIds={['1']}
      />
    );

    // Check that first action is marked as completed
    const writeCodeNode = screen.getByText('Write Code').closest('[data-status]');
    expect(writeCodeNode).toHaveAttribute('data-status', 'completed');

    // Check that second action is marked as current
    const writeTestsNode = screen.getByText('Write Tests').closest('[data-status]');
    expect(writeTestsNode).toHaveAttribute('data-status', 'active');
  });
});
```

## Integration Testing

### Service Integration Tests

```typescript
// tests/integration/agentic-flow.integration.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ServiceFactory } from '@/services/agentic-flow/ServiceFactory';

describe('Agentic Flow Integration', () => {
  beforeAll(() => {
    // Setup test environment
  });

  afterAll(() => {
    ServiceFactory.clearAll();
  });

  it('should complete full workflow', async () => {
    const api = ServiceFactory.getAgenticFlowAPI();
    const planner = ServiceFactory.getGOAPPlannerService();
    const orchestrator = ServiceFactory.getTaskOrchestratorService();

    // 1. Initialize swarm
    await api.initialize({
      topology: 'mesh',
      maxAgents: 5,
      strategy: 'adaptive'
    });

    // 2. Spawn agents
    const coderId = await api.spawnAgent({
      type: 'coder',
      capabilities: ['react', 'typescript']
    });

    // 3. Generate plan
    const plan = await planner.generatePlan(
      { code_written: false },
      { code_written: true },
      [
        {
          id: '1',
          name: 'write_code',
          preconditions: {},
          effects: { code_written: true },
          cost: 5
        }
      ]
    );

    // 4. Execute plan
    const task = orchestrator.enqueueTask({
      description: 'Write React component',
      priority: 'high',
      preconditions: {},
      effects: { code_written: true }
    });

    const nextTask = orchestrator.getNextTask({
      id: coderId,
      type: 'coder',
      name: 'Coder',
      status: 'idle',
      capabilities: ['react'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    expect(nextTask).toBeDefined();
    expect(nextTask?.id).toBe(task.id);

    // 5. Complete task
    orchestrator.completeTask(task.id, { code: '...' });

    const stats = orchestrator.getQueueStats();
    expect(stats.completed).toBe(1);
  });
});
```

### SSE Integration Tests

```typescript
// tests/integration/event-stream.integration.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EventStreamService } from '@/services/agentic-flow/EventStreamService';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  http.get('/api/agentic-flow/stream', ({ request }) => {
    const stream = new ReadableStream({
      start(controller) {
        // Simulate SSE events
        controller.enqueue('event: agent.spawned\n');
        controller.enqueue('data: {"agentId":"1","type":"coder"}\n\n');

        setTimeout(() => {
          controller.enqueue('event: task.started\n');
          controller.enqueue('data: {"taskId":"1"}\n\n');
          controller.close();
        }, 100);
      }
    });

    return new HttpResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  })
);

describe('EventStreamService Integration', () => {
  let eventStream: EventStreamService;

  beforeEach(() => {
    server.listen();
    eventStream = new EventStreamService();
  });

  afterEach(() => {
    eventStream.disconnect();
    server.close();
  });

  it('should receive SSE events', async () => {
    const events: any[] = [];

    eventStream.on('agent.spawned', (event) => {
      events.push(event);
    });

    eventStream.connect('/api/agentic-flow/stream');

    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(events.length).toBeGreaterThan(0);
    expect(events[0].data.agentId).toBe('1');
  });

  it('should handle reconnection', async () => {
    let connectionCount = 0;

    server.use(
      http.get('/api/agentic-flow/stream', () => {
        connectionCount++;

        if (connectionCount === 1) {
          return new HttpResponse(null, { status: 500 });
        }

        return new HttpResponse(new ReadableStream(), {
          headers: { 'Content-Type': 'text/event-stream' }
        });
      })
    );

    eventStream.connect('/api/agentic-flow/stream');

    await new Promise((resolve) => setTimeout(resolve, 6000));

    expect(connectionCount).toBeGreaterThan(1);
  });
});
```

## End-to-End Testing

### Playwright E2E Tests

```typescript
// tests/e2e/agentic-flow.e2e.test.ts

import { test, expect } from '@playwright/test';

test.describe('Agentic Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/agents');
  });

  test('complete goal execution workflow', async ({ page }) => {
    // 1. Enter goal
    await page.fill('input[placeholder*="coding objective"]', 'Build REST API');

    // 2. Generate plan
    await page.click('button:has-text("Generate Plan")');

    // 3. Wait for plan to appear
    await expect(page.locator('text=Execution Plan')).toBeVisible();

    // 4. Start swarm
    await page.click('button:has-text("Start Swarm")');

    // 5. Wait for execution to begin
    await expect(page.locator('text=Executing...')).toBeVisible();

    // 6. Monitor progress
    await expect(page.locator('[data-testid="step-timeline"]')).toBeVisible();

    // 7. Wait for completion (with timeout)
    await page.waitForSelector('text=Complete', { timeout: 60000 });

    // 8. Verify results
    const completedSteps = await page.locator('[data-status="completed"]').count();
    expect(completedSteps).toBeGreaterThan(0);
  });

  test('settings configuration', async ({ page }) => {
    // Open settings
    await page.click('button[aria-label="Settings"]');

    // Change topology
    await page.click('select[name="topology"]');
    await page.click('option:has-text("Hierarchical")');

    // Save settings
    await page.click('button:has-text("Save")');

    // Verify settings persisted
    await page.reload();
    await page.click('button[aria-label="Settings"]');

    const topology = await page.inputValue('select[name="topology"]');
    expect(topology).toBe('hierarchical');
  });

  test('error handling', async ({ page }) => {
    // Trigger an error scenario
    await page.fill('input[placeholder*="coding objective"]', '');

    await page.click('button:has-text("Generate Plan")');

    // Should show validation error
    await expect(page.locator('text=Goal is required')).toBeVisible();
  });

  test('real-time updates', async ({ page }) => {
    await page.fill('input[placeholder*="coding objective"]', 'Simple task');
    await page.click('button:has-text("Start Swarm")');

    // Monitor event log for updates
    const eventLog = page.locator('[data-testid="event-log"]');

    // Should receive events within 5 seconds
    await expect(eventLog.locator('text=agent.spawned')).toBeVisible({
      timeout: 5000
    });
  });
});
```

## Performance Testing

### Load Testing Script

```typescript
// tests/performance/load.test.ts

import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should handle 10 concurrent agents', async ({ page }) => {
    await page.goto('/agents');

    const startTime = Date.now();

    // Spawn 10 agents
    for (let i = 0; i < 10; i++) {
      await page.click('button:has-text("Spawn Agent")');
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // All agents should spawn within 5 seconds
    expect(duration).toBeLessThan(5000);

    // UI should remain responsive
    const isResponsive = await page.evaluate(() => {
      const start = performance.now();
      // Trigger a heavy operation
      document.querySelectorAll('*');
      const end = performance.now();
      return (end - start) < 100; // Should complete within 100ms
    });

    expect(isResponsive).toBe(true);
  });

  test('memory leak detection', async ({ page }) => {
    await page.goto('/agents');

    // Get initial memory
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // Execute workflow 5 times
    for (let i = 0; i < 5; i++) {
      await page.fill('input', 'Test goal');
      await page.click('button:has-text("Start Swarm")');
      await page.waitForSelector('text=Complete', { timeout: 10000 });
      await page.click('button:has-text("Reset")');
    }

    // Get final memory
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // Memory growth should be less than 50MB
    const memoryGrowth = (finalMemory - initialMemory) / 1024 / 1024;
    expect(memoryGrowth).toBeLessThan(50);
  });
});
```

## Accessibility Testing

```typescript
// tests/accessibility/a11y.test.ts

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('should have no accessibility violations', async ({ page }) => {
    await page.goto('/agents');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('keyboard navigation', async ({ page }) => {
    await page.goto('/agents');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    let focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBe('INPUT');

    await page.keyboard.press('Tab');
    focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBe('BUTTON');

    // Space/Enter should activate buttons
    await page.keyboard.press('Space');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('screen reader support', async ({ page }) => {
    await page.goto('/agents');

    // Check ARIA labels
    const settingsButton = page.locator('button[aria-label="Settings"]');
    await expect(settingsButton).toHaveAttribute('aria-label', 'Settings');

    // Check ARIA live regions for updates
    const eventLog = page.locator('[aria-live="polite"]');
    await expect(eventLog).toBeVisible();
  });
});
```

## Test Coverage Goals

### Coverage Targets

```
Overall Coverage: 80%
- Service Layer: 90%
- Hooks: 85%
- Components: 75%
- Utils: 90%
```

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
npm run coverage:open
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml

name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e

  accessibility-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:a11y
```

## Test Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:a11y": "playwright test tests/accessibility",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch",
    "test:ui": "vitest --ui"
  }
}
```

---

**Version**: 1.0.0
**Last Updated**: 2025-10-09
**Status**: Complete
