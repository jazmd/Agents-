# Step Visualization System Design

## Overview

This document defines the UI component architecture for real-time step-by-step visualization of agentic-flow execution, including GOAP planning visualization, agent action tracking, and execution monitoring.

## Component Hierarchy

```
┌────────────────────────────────────────────────────────────┐
│              AgenticFlowDashboard                          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              PlanVisualization                        │ │
│  │  - GOAP action graph                                 │ │
│  │  - Dependency visualization                          │ │
│  │  - Critical path highlighting                        │ │
│  └──────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              StepExecutionPanel                       │ │
│  │  ┌────────────────────────────────────────────────┐  │ │
│  │  │         CurrentStepCard                        │  │ │
│  │  │  - Step details                                │  │ │
│  │  │  - Agent assignment                            │  │ │
│  │  │  - Real-time progress                          │  │ │
│  │  └────────────────────────────────────────────────┘  │ │
│  │  ┌────────────────────────────────────────────────┐  │ │
│  │  │         StepTimeline                           │  │ │
│  │  │  - Completed steps                             │  │ │
│  │  │  - Pending steps                               │  │ │
│  │  │  - Timeline visualization                      │  │ │
│  │  └────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              AgentActivityPanel                       │ │
│  │  - Per-agent activity logs                           │ │
│  │  - Resource usage metrics                            │ │
│  │  - Communication visualization                       │ │
│  └──────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              RealTimeEventLog                         │ │
│  │  - Streaming event display                           │ │
│  │  - Filterable by type/agent                          │ │
│  │  - Export capabilities                               │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

## Component Specifications

### 1. PlanVisualization Component

#### Purpose
Displays the GOAP-generated action plan as an interactive graph with dependencies, costs, and execution paths.

#### Component Structure

```typescript
// /src/components/agentic-flow/PlanVisualization.tsx

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { GOAPPlan, GOAPAction } from '@/services/agentic-flow/types';

interface PlanVisualizationProps {
  plan: GOAPPlan;
  currentActionId?: string;
  completedActionIds: string[];
  onActionClick?: (action: GOAPAction) => void;
}

export function PlanVisualization({
  plan,
  currentActionId,
  completedActionIds,
  onActionClick
}: PlanVisualizationProps) {
  const [viewMode, setViewMode] = useState<'graph' | 'timeline' | 'table'>('graph');

  // Convert GOAP plan to ReactFlow nodes and edges
  const { nodes, edges } = useMemo(() => {
    return convertPlanToGraph(plan, currentActionId, completedActionIds);
  }, [plan, currentActionId, completedActionIds]);

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-purple-500" />
            Execution Plan
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {plan.actions.length} Actions
            </Badge>
            <Badge variant="outline">
              Cost: {plan.totalCost}
            </Badge>
            <Badge variant="outline">
              Est. {formatDuration(plan.estimatedDuration)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="graph">Graph View</TabsTrigger>
            <TabsTrigger value="timeline">Timeline View</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
          </TabsList>

          <TabsContent value="graph" className="h-[600px]">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodeClick={(event, node) => {
                const action = plan.actions.find(a => a.id === node.id);
                if (action && onActionClick) {
                  onActionClick(action);
                }
              }}
              fitView
              className="bg-muted/30 rounded-lg"
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </TabsContent>

          <TabsContent value="timeline">
            <PlanTimeline
              actions={plan.actions}
              currentActionId={currentActionId}
              completedActionIds={completedActionIds}
            />
          </TabsContent>

          <TabsContent value="table">
            <PlanTable
              actions={plan.actions}
              dependencies={plan.dependencies}
              onActionClick={onActionClick}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Helper function to convert plan to graph
function convertPlanToGraph(
  plan: GOAPPlan,
  currentActionId?: string,
  completedActionIds: string[] = []
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = plan.actions.map((action, index) => {
    const isCompleted = completedActionIds.includes(action.id);
    const isCurrent = action.id === currentActionId;
    const isPending = !isCompleted && !isCurrent;

    return {
      id: action.id,
      type: 'custom',
      position: calculateNodePosition(index, plan.actions.length),
      data: {
        label: action.name,
        cost: action.cost,
        status: isCompleted ? 'completed' : isCurrent ? 'active' : 'pending',
        preconditions: action.preconditions,
        effects: action.effects
      },
      style: {
        background: isCompleted
          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
          : isCurrent
          ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
          : 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
        color: 'white',
        border: isCurrent ? '2px solid #a855f7' : '1px solid transparent',
        borderRadius: '8px',
        padding: '10px',
        width: 180
      }
    };
  });

  const edges: Edge[] = [];
  plan.dependencies.forEach((deps, actionName) => {
    const targetAction = plan.actions.find(a => a.name === actionName);
    if (!targetAction) return;

    deps.forEach(depName => {
      const sourceAction = plan.actions.find(a => a.name === depName);
      if (!sourceAction) return;

      edges.push({
        id: `${sourceAction.id}-${targetAction.id}`,
        source: sourceAction.id,
        target: targetAction.id,
        animated: targetAction.id === currentActionId,
        style: {
          stroke: completedActionIds.includes(sourceAction.id) ? '#10b981' : '#64748b',
          strokeWidth: 2
        }
      });
    });
  });

  return { nodes, edges };
}

function calculateNodePosition(index: number, total: number): { x: number; y: number } {
  // Arrange nodes in a flowing layout
  const nodesPerRow = Math.ceil(Math.sqrt(total));
  const row = Math.floor(index / nodesPerRow);
  const col = index % nodesPerRow;

  return {
    x: col * 250,
    y: row * 150
  };
}
```

#### Visual Design

```
┌────────────────────────────────────────────────────────────┐
│  Execution Plan                        [5 Actions] Cost: 15│
├────────────────────────────────────────────────────────────┤
│  [Graph View] [Timeline View] [Table View]                 │
│                                                             │
│    ┌───────────┐                                           │
│    │ Action 1  │ ──┐                                       │
│    │ Cost: 3   │   │                                       │
│    └───────────┘   │     ┌───────────┐                    │
│         ✓          └────>│ Action 3  │                    │
│                           │ Cost: 2   │ ─┐                │
│    ┌───────────┐     ┌──>└───────────┘  │  ┌───────────┐ │
│    │ Action 2  │ ────┘        ⚡          └─>│ Action 5  │ │
│    │ Cost: 4   │                            │ Cost: 1   │ │
│    └───────────┘          ┌───────────┐    └───────────┘ │
│         ✓                 │ Action 4  │ ────┘             │
│                           │ Cost: 5   │                    │
│                           └───────────┘                    │
│                                ⏳                          │
│                                                             │
│  Legend: ✓ Completed  ⚡ Current  ⏳ Pending               │
└────────────────────────────────────────────────────────────┘
```

### 2. StepExecutionPanel Component

#### Purpose
Real-time display of the currently executing step with detailed progress information.

```typescript
// /src/components/agentic-flow/StepExecutionPanel.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import type { GOAPAction, Agent } from '@/services/agentic-flow/types';

interface StepExecutionPanelProps {
  currentAction: GOAPAction;
  assignedAgent: Agent;
  progress: number;
  logs: string[];
  onPause?: () => void;
  onResume?: () => void;
  onSkip?: () => void;
  onRetry?: () => void;
  isPaused: boolean;
}

export function StepExecutionPanel({
  currentAction,
  assignedAgent,
  progress,
  logs,
  onPause,
  onResume,
  onSkip,
  onRetry,
  isPaused
}: StepExecutionPanelProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500 animate-pulse" />
            Current Step
          </CardTitle>
          <div className="flex gap-2">
            {isPaused ? (
              <Button size="sm" variant="outline" onClick={onResume}>
                <Play className="w-4 h-4 mr-1" /> Resume
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={onPause}>
                <Pause className="w-4 h-4 mr-1" /> Pause
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={onSkip}>
              <SkipForward className="w-4 h-4 mr-1" /> Skip
            </Button>
            <Button size="sm" variant="outline" onClick={onRetry}>
              <RotateCcw className="w-4 h-4 mr-1" /> Retry
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Info */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">{currentAction.name}</h4>
            <Badge variant="outline">Cost: {currentAction.cost}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {currentAction.description}
          </p>
        </div>

        {/* Assigned Agent */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Bot className="w-5 h-5 text-purple-500" />
          <div>
            <div className="text-sm font-medium">{assignedAgent.name}</div>
            <div className="text-xs text-muted-foreground">
              {assignedAgent.type}
            </div>
          </div>
          <div className="ml-auto">
            <Badge
              variant={
                assignedAgent.status === 'working'
                  ? 'default'
                  : assignedAgent.status === 'blocked'
                  ? 'destructive'
                  : 'secondary'
              }
            >
              {assignedAgent.status}
            </Badge>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {getProgressLabel(progress)}
          </div>
        </div>

        {/* Preconditions & Effects */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h5 className="text-sm font-semibold mb-2">Preconditions</h5>
            <div className="space-y-1">
              {Object.entries(currentAction.preconditions).map(([key, value]) => (
                <div
                  key={key}
                  className="text-xs flex items-center gap-2 p-2 bg-muted/30 rounded"
                >
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>{key}: {String(value)}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h5 className="text-sm font-semibold mb-2">Effects</h5>
            <div className="space-y-1">
              {Object.entries(currentAction.effects).map(([key, value]) => (
                <div
                  key={key}
                  className="text-xs flex items-center gap-2 p-2 bg-muted/30 rounded"
                >
                  <ArrowRight className="w-3 h-3 text-blue-500" />
                  <span>{key}: {String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time Logs */}
        <div>
          <h5 className="text-sm font-semibold mb-2">Execution Log</h5>
          <ScrollArea className="h-[120px] rounded-md border p-3">
            <div className="space-y-1 font-mono text-xs">
              {logs.map((log, index) => (
                <div key={index} className="text-muted-foreground">
                  <span className="text-purple-500">
                    [{new Date().toLocaleTimeString()}]
                  </span>{' '}
                  {log}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

function getProgressLabel(progress: number): string {
  if (progress < 25) return 'Initializing...';
  if (progress < 50) return 'Processing...';
  if (progress < 75) return 'Executing...';
  if (progress < 100) return 'Finalizing...';
  return 'Complete!';
}
```

### 3. StepTimeline Component

#### Purpose
Visual timeline showing completed, current, and upcoming steps.

```typescript
// /src/components/agentic-flow/StepTimeline.tsx

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import type { GOAPAction } from '@/services/agentic-flow/types';

interface StepTimelineProps {
  actions: GOAPAction[];
  currentActionId?: string;
  completedActionIds: string[];
  onActionClick?: (action: GOAPAction) => void;
}

export function StepTimeline({
  actions,
  currentActionId,
  completedActionIds,
  onActionClick
}: StepTimelineProps) {
  return (
    <div className="space-y-4">
      {actions.map((action, index) => {
        const isCompleted = completedActionIds.includes(action.id);
        const isCurrent = action.id === currentActionId;
        const isPending = !isCompleted && !isCurrent;

        return (
          <div
            key={action.id}
            className={`
              relative pl-8 pb-8 cursor-pointer transition-all hover:bg-muted/50 p-4 rounded-lg
              ${isCurrent ? 'bg-purple-500/10 border-l-4 border-purple-500' : ''}
            `}
            onClick={() => onActionClick?.(action)}
          >
            {/* Timeline connector */}
            {index < actions.length - 1 && (
              <div
                className={`
                  absolute left-3 top-8 bottom-0 w-0.5
                  ${isCompleted ? 'bg-green-500' : 'bg-muted'}
                `}
              />
            )}

            {/* Status icon */}
            <div className="absolute left-0 top-4">
              {isCompleted ? (
                <CheckCircle className="w-6 h-6 text-green-500 fill-green-500/20" />
              ) : isCurrent ? (
                <div className="w-6 h-6 rounded-full bg-purple-500 animate-pulse flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-white" />
                </div>
              ) : (
                <Circle className="w-6 h-6 text-muted-foreground" />
              )}
            </div>

            {/* Action details */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">{action.name}</h4>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    Cost: {action.cost}
                  </Badge>
                  {isCompleted && (
                    <Badge variant="outline" className="text-xs text-green-500">
                      ✓ Complete
                    </Badge>
                  )}
                  {isCurrent && (
                    <Badge variant="outline" className="text-xs text-purple-500">
                      ⚡ In Progress
                    </Badge>
                  )}
                </div>
              </div>

              {action.description && (
                <p className="text-sm text-muted-foreground">
                  {action.description}
                </p>
              )}

              {/* Show duration if completed */}
              {isCompleted && action.duration && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{formatDuration(action.duration)}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}
```

### 4. AgentActivityPanel Component

```typescript
// /src/components/agentic-flow/AgentActivityPanel.tsx

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Cpu, Memory, Zap } from 'lucide-react';
import type { Agent, AgentMetrics } from '@/services/agentic-flow/types';

interface AgentActivityPanelProps {
  agents: Agent[];
  metrics: Map<string, AgentMetrics>;
}

export function AgentActivityPanel({ agents, metrics }: AgentActivityPanelProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(
    agents[0] || null
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-500" />
          Agent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedAgent?.id} onValueChange={(id) => {
          const agent = agents.find(a => a.id === id);
          if (agent) setSelectedAgent(agent);
        }}>
          <TabsList className="w-full justify-start overflow-x-auto">
            {agents.map(agent => (
              <TabsTrigger key={agent.id} value={agent.id} className="gap-2">
                <Bot className="w-4 h-4" />
                {agent.name}
                <Badge
                  variant={
                    agent.status === 'working'
                      ? 'default'
                      : agent.status === 'idle'
                      ? 'secondary'
                      : 'destructive'
                  }
                  className="ml-1"
                >
                  {agent.status}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {agents.map(agent => {
            const agentMetrics = metrics.get(agent.id);

            return (
              <TabsContent key={agent.id} value={agent.id} className="space-y-4">
                {/* Agent Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Agent Type</div>
                    <Badge variant="outline">{agent.type}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Status</div>
                    <Badge
                      variant={
                        agent.status === 'working'
                          ? 'default'
                          : agent.status === 'idle'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {agent.status}
                    </Badge>
                  </div>
                </div>

                {/* Current Task */}
                {agent.currentTask && (
                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <div className="text-sm font-medium mb-1">Current Task</div>
                    <div className="text-sm text-muted-foreground">
                      {agent.currentTask}
                    </div>
                  </div>
                )}

                {/* Metrics */}
                {agentMetrics && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium mb-1">Tasks Completed</div>
                        <div className="text-2xl font-bold text-green-500">
                          {agentMetrics.tasksCompleted}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-1">Tasks Active</div>
                        <div className="text-2xl font-bold text-blue-500">
                          {agentMetrics.tasksActive}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-1">Tasks Failed</div>
                        <div className="text-2xl font-bold text-red-500">
                          {agentMetrics.tasksFailed}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-1">Avg Time</div>
                        <div className="text-2xl font-bold">
                          {formatDuration(agentMetrics.avgCompletionTime)}
                        </div>
                      </div>
                    </div>

                    {/* Resource Usage */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="flex items-center gap-1">
                            <Cpu className="w-4 h-4" /> CPU Usage
                          </span>
                          <span>65%</span>
                        </div>
                        <Progress value={65} />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="flex items-center gap-1">
                            <Memory className="w-4 h-4" /> Memory Usage
                          </span>
                          <span>420 MB</span>
                        </div>
                        <Progress value={82} />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="flex items-center gap-1">
                            <Zap className="w-4 h-4" /> Token Usage
                          </span>
                          <span>{agentMetrics.totalTokens.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Uptime */}
                    <div className="text-xs text-muted-foreground">
                      Uptime: {formatDuration(agentMetrics.uptime)}
                    </div>
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
```

### 5. RealTimeEventLog Component

```typescript
// /src/components/agentic-flow/RealTimeEventLog.tsx

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Download, Filter } from 'lucide-react';
import type { AgenticFlowEvent } from '@/services/agentic-flow/types';

interface RealTimeEventLogProps {
  events: AgenticFlowEvent[];
  maxEvents?: number;
}

export function RealTimeEventLog({ events, maxEvents = 100 }: RealTimeEventLogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());

  const filteredEvents = useMemo(() => {
    return events
      .filter(event => {
        if (searchTerm && !JSON.stringify(event).toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        if (selectedTypes.size > 0 && !selectedTypes.has(event.type)) {
          return false;
        }
        return true;
      })
      .slice(-maxEvents);
  }, [events, searchTerm, selectedTypes, maxEvents]);

  const eventTypes = useMemo(() => {
    return Array.from(new Set(events.map(e => e.type)));
  }, [events]);

  const handleExport = () => {
    const data = JSON.stringify(filteredEvents, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `events-${Date.now()}.json`;
    a.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-500" />
            Event Log
            <Badge variant="outline">{filteredEvents.length}</Badge>
          </CardTitle>
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" /> Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Event Type Filters */}
        <div className="flex flex-wrap gap-2">
          {eventTypes.map(type => (
            <Badge
              key={type}
              variant={selectedTypes.has(type) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => {
                const newTypes = new Set(selectedTypes);
                if (newTypes.has(type)) {
                  newTypes.delete(type);
                } else {
                  newTypes.add(type);
                }
                setSelectedTypes(newTypes);
              }}
            >
              {type}
            </Badge>
          ))}
        </div>

        {/* Event List */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-2 font-mono text-xs">
            {filteredEvents.map((event, index) => (
              <div
                key={index}
                className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {event.type}
                  </Badge>
                  <span className="text-muted-foreground">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(event.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
```

## Responsive Design

### Mobile Layout

```typescript
// Responsive breakpoints
const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
};

// Mobile-first responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Components adapt to screen size */}
</div>

// Stack panels vertically on mobile
<div className="flex flex-col lg:flex-row gap-4">
  <PlanVisualization className="lg:w-2/3" />
  <StepExecutionPanel className="lg:w-1/3" />
</div>
```

## Animation & Transitions

```typescript
// Smooth transitions for state changes
const transitionClasses = "transition-all duration-300 ease-in-out";

// Pulse animation for active states
const pulseAnimation = "animate-pulse";

// Fade-in for new elements
const fadeInAnimation = "animate-fade-in";

// Slide-in for panels
const slideInAnimation = "animate-slide-in-right";
```

## Accessibility

```typescript
// ARIA labels for screen readers
<button aria-label="Pause execution" onClick={onPause}>
  <Pause />
</button>

// Keyboard navigation support
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && onClick()}
>
  {/* Content */}
</div>

// Focus indicators
className="focus:ring-2 focus:ring-purple-500 focus:outline-none"
```

## Performance Optimization

### Virtual Scrolling for Large Lists

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualEventLog({ events }: { events: AgenticFlowEvent[] }) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 10,
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <EventItem event={events[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Memoization

```typescript
// Memoize expensive graph calculations
const graphData = useMemo(() => {
  return convertPlanToGraph(plan, currentActionId, completedActionIds);
}, [plan, currentActionId, completedActionIds]);

// Memoize filtered lists
const filteredEvents = useMemo(() => {
  return events.filter(e => e.type.includes(filter));
}, [events, filter]);
```

### Throttle UI Updates

```typescript
import { useThrottle } from '@/hooks/useThrottle';

function RealTimeProgress({ progress }: { progress: number }) {
  // Throttle progress updates to 60fps
  const throttledProgress = useThrottle(progress, 16);

  return <Progress value={throttledProgress} />;
}
```

---

**Version**: 1.0.0
**Last Updated**: 2025-10-09
**Status**: Complete
