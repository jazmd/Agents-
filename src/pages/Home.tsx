import { useState, useEffect } from "react";
import { Link as RouterLink } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GoalInput } from "@/components/GoalInput";
import { PlanVisualization } from "@/components/PlanVisualization";
import { AgentCard } from "@/components/AgentCard";
import { GOAPPlanner, parseGoal, Step } from "@/lib/goapPlanner";
import {
  Brain,
  Search,
  FileSearch,
  GitBranch,
  Lightbulb,
  CheckCircle2,
  Target,
  FileText,
  Link,
  Workflow,
  Database,
  TrendingUp,
  Filter,
  Zap,
  Shield,
  Sparkles,
  Clock,
  Network,
  Settings,
  ChevronRight,
  RotateCcw,
  ExternalLink,
  Code,
  Play,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  name: string;
  role: string;
  status: "idle" | "active" | "completed" | "error";
  progress: number;
  currentTask?: string;
  messages?: number;
  efficiency?: number;
}

export default function Home() {
  const [goal, setGoal] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [isPlanning, setIsPlanning] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeTab, setActiveTab] = useState("plan");

  // Initialize GOAP Planner with research actions
  const planner = new GOAPPlanner([
    {
      name: "Define Goal",
      cost: 1,
      preconditions: {},
      effects: { goalDefined: true },
      stepGenerator: (goal: string) => ({
        id: "define-goal",
        title: "Define Research Objective",
        description: "Parse and validate the research goal",
        icon: Target,
        status: "completed",
        data: [
          {
            text: goal,
            details: {
              objective: goal,
            },
          },
        ],
      }),
    },
    {
      name: "Parse Goal",
      cost: 1,
      preconditions: { goalDefined: true },
      effects: { goalParsed: true },
      stepGenerator: (goal: string) => {
        const parsed = parseGoal(goal);
        return {
          id: "parse-goal",
          title: "Parse Goal Components",
          description: "Extract key terms and categorize the research",
          icon: Brain,
          status: "completed",
          data: [
            {
              text: `Category: ${parsed.category}`,
              details: {
                objective: parsed.objective,
              },
            },
            {
              text: `Key Terms: ${parsed.keyTerms.join(", ")}`,
            },
          ],
        };
      },
    },
    {
      name: "Assess State",
      cost: 1,
      preconditions: { goalParsed: true },
      effects: { stateAssessed: true },
      stepGenerator: () => ({
        id: "assess-state",
        title: "Assess Current State",
        description: "Evaluate existing knowledge and identify gaps",
        icon: Search,
        status: "pending",
        metrics: [
          { label: "Knowledge Gaps", value: "3" },
          { label: "Data Sources", value: "5" },
        ],
      }),
    },
    {
      name: "Gather Information",
      cost: 2,
      preconditions: { stateAssessed: true },
      effects: { informationGathered: true },
      stepGenerator: () => ({
        id: "gather-info",
        title: "Gather Information",
        description: "Search and collect relevant data from multiple sources",
        icon: FileSearch,
        status: "pending",
        metrics: [
          { label: "Sources Found", value: "12" },
          { label: "Documents", value: "47" },
        ],
      }),
    },
    {
      name: "Analyze Documents",
      cost: 2,
      preconditions: { informationGathered: true },
      effects: { documentsAnalyzed: true },
      stepGenerator: () => ({
        id: "analyze-docs",
        title: "Analyze Documents",
        description: "Extract key insights and patterns from collected data",
        icon: GitBranch,
        status: "pending",
        metrics: [
          { label: "Patterns Found", value: "8" },
          { label: "Insights", value: "15" },
        ],
      }),
    },
    {
      name: "Synthesize Knowledge",
      cost: 2,
      preconditions: { documentsAnalyzed: true },
      effects: { knowledgeSynthesized: true },
      stepGenerator: () => ({
        id: "synthesize",
        title: "Synthesize Knowledge",
        description: "Combine insights into coherent understanding",
        icon: Lightbulb,
        status: "pending",
        metrics: [
          { label: "Connections", value: "24" },
          { label: "Confidence", value: "87%" },
        ],
      }),
    },
    {
      name: "Generate Insights",
      cost: 1,
      preconditions: { knowledgeSynthesized: true },
      effects: { insightsGenerated: true },
      stepGenerator: () => ({
        id: "generate-insights",
        title: "Generate Insights",
        description: "Create actionable recommendations and conclusions",
        icon: Sparkles,
        status: "pending",
        metrics: [
          { label: "Recommendations", value: "6" },
          { label: "Impact Score", value: "9.2/10" },
        ],
      }),
    },
    {
      name: "Verify Results",
      cost: 1,
      preconditions: { insightsGenerated: true },
      effects: { verified: true },
      stepGenerator: () => ({
        id: "verify",
        title: "Verify Results",
        description: "Validate findings and ensure accuracy",
        icon: CheckCircle2,
        status: "pending",
        metrics: [
          { label: "Accuracy", value: "94%" },
          { label: "Sources Cited", value: "23" },
        ],
      }),
    },
  ]);

  const handleGeneratePlan = (userGoal: string) => {
    setGoal(userGoal);
    setIsPlanning(true);

    // Simulate planning delay
    setTimeout(() => {
      const currentState = {
        goalDefined: false,
        goalParsed: false,
        stateAssessed: false,
        informationGathered: false,
        documentsAnalyzed: false,
        knowledgeSynthesized: false,
        insightsGenerated: false,
        verified: false,
      };

      const goalState = {
        goalDefined: true,
        goalParsed: true,
        stateAssessed: true,
        informationGathered: true,
        documentsAnalyzed: true,
        knowledgeSynthesized: true,
        insightsGenerated: true,
        verified: true,
      };

      const plan = planner.plan(currentState, goalState, userGoal);
      setSteps(plan);

      // Initialize agents
      const mockAgents: Agent[] = [
        {
          id: "researcher",
          name: "Research Agent",
          role: "Information Gathering",
          status: "idle",
          progress: 0,
          messages: 0,
          efficiency: 100,
        },
        {
          id: "analyst",
          name: "Analysis Agent",
          role: "Data Analysis",
          status: "idle",
          progress: 0,
          messages: 0,
          efficiency: 100,
        },
        {
          id: "synthesizer",
          name: "Synthesis Agent",
          role: "Knowledge Integration",
          status: "idle",
          progress: 0,
          messages: 0,
          efficiency: 100,
        },
        {
          id: "validator",
          name: "Validation Agent",
          role: "Quality Assurance",
          status: "idle",
          progress: 0,
          messages: 0,
          efficiency: 100,
        },
      ];
      setAgents(mockAgents);
      setIsPlanning(false);
      setActiveTab("plan");
    }, 1500);
  };

  const handleExecutePlan = () => {
    // Simulate plan execution
      const updatedSteps = steps.map((step, index) => ({
        ...step,
        status: (index === 0 ? "active" : "pending") as "active" | "pending",
      }));
    setSteps(updatedSteps);

    // Simulate agent activation
    const updatedAgents = agents.map((agent, index) => ({
      ...agent,
      status: (index === 0 ? "active" : "idle") as "active" | "idle",
      progress: index === 0 ? 25 : 0,
    }));
    setAgents(updatedAgents);

    setActiveTab("agents");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Grid Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(0deg, transparent 24%, rgba(139, 92, 246, 0.05) 25%, rgba(139, 92, 246, 0.05) 26%, transparent 27%, transparent 74%, rgba(139, 92, 246, 0.05) 75%, rgba(139, 92, 246, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(139, 92, 246, 0.05) 25%, rgba(139, 92, 246, 0.05) 26%, transparent 27%, transparent 74%, rgba(139, 92, 246, 0.05) 75%, rgba(139, 92, 246, 0.05) 76%, transparent 77%, transparent)`,
            backgroundSize: "50px 50px",
          }}
        ></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-gray-800/50 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">RuFlo Research</h1>
            </div>
            <nav className="flex items-center gap-2">
              <RouterLink href="/demo">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Widget Demo
                </Button>
              </RouterLink>
              <RouterLink href="/agents">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <Network className="w-4 h-4 mr-2" />
                  Agent Swarm
                </Button>
              </RouterLink>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-12">
          {steps.length === 0 ? (
            // Initial State - Goal Input
            <div className="space-y-12">
              <GoalInput
                onSubmit={handleGeneratePlan}
                isPlanning={isPlanning}
                onAdvancedSettings={() => setShowAdvanced(true)}
              />

              {/* Features Section */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-6 rounded-lg border border-gray-700/50 bg-gray-900/50 hover:border-gray-600/50 transition-all">
                  <Brain className="w-8 h-8 text-violet-400 mb-3" />
                  <h3 className="font-semibold text-white mb-2">AI-Powered Planning</h3>
                  <p className="text-sm text-gray-400">
                    Uses Goal-Oriented Action Planning (GOAP) with A* pathfinding to find optimal research workflows
                  </p>
                </div>
                <div className="p-6 rounded-lg border border-gray-700/50 bg-gray-900/50 hover:border-gray-600/50 transition-all">
                  <Network className="w-8 h-8 text-blue-400 mb-3" />
                  <h3 className="font-semibold text-white mb-2">Multi-Agent System</h3>
                  <p className="text-sm text-gray-400">
                    Coordinate specialized agents for research, analysis, synthesis, and validation
                  </p>
                </div>
                <div className="p-6 rounded-lg border border-gray-700/50 bg-gray-900/50 hover:border-gray-600/50 transition-all">
                  <Sparkles className="w-8 h-8 text-pink-400 mb-3" />
                  <h3 className="font-semibold text-white mb-2">Real-Time Execution</h3>
                  <p className="text-sm text-gray-400">
                    Monitor agent progress, track metrics, and visualize the research workflow in real-time
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Plan Generated State
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <div className="flex items-center justify-between">
                <TabsList className="bg-gray-800/50 border border-gray-700/50">
                  <TabsTrigger value="plan" className="data-[state=active]:bg-violet-600">
                    <Zap className="w-4 h-4 mr-2" />
                    Research Plan
                  </TabsTrigger>
                  <TabsTrigger value="agents" className="data-[state=active]:bg-violet-600">
                    <Network className="w-4 h-4 mr-2" />
                    Agents ({agents.length})
                  </TabsTrigger>
                </TabsList>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSteps([]);
                      setGoal("");
                      setAgents([]);
                      setActiveTab("plan");
                    }}
                    className="border-gray-600/50 hover:bg-gray-800/50"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    New Plan
                  </Button>
                  {steps.every((s) => s.status === "pending") && (
                    <Button
                      onClick={handleExecutePlan}
                      className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Execute Plan
                    </Button>
                  )}
                </div>
              </div>

              <TabsContent value="plan" className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <PlanVisualization steps={steps} isExecuting={isPlanning} />
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border border-gray-700/50 bg-gray-900/50">
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4 text-violet-400" />
                        Goal
                      </h4>
                      <p className="text-sm text-gray-300 line-clamp-3">{goal}</p>
                    </div>

                    <div className="p-4 rounded-lg border border-gray-700/50 bg-gray-900/50">
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        Statistics
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Steps</span>
                          <span className="text-white font-semibold">{steps.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Completed</span>
                          <span className="text-emerald-400 font-semibold">
                            {steps.filter((s) => s.status === "completed").length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Estimated Time</span>
                          <span className="text-white font-semibold">15-20 min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="agents" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {agents.map((agent) => (
                    <AgentCard key={agent.id} agent={agent} />
                  ))}
                </div>

                {agents.length === 0 && (
                  <div className="text-center py-12">
                    <Network className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No agents spawned yet</p>
                    <p className="text-sm text-gray-500">Execute the plan to activate agents</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-800/50 bg-gray-900/50 backdrop-blur-sm mt-12">
          <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm text-gray-500">
            <p>
              RuFlo Research · Created with{" "}
              <span className="text-red-500">❤️</span> by{" "}
              <a href="https://ruv.io" className="text-violet-400 hover:text-violet-300">
                ruv.io
              </a>
            </p>
          </div>
        </footer>
      </div>

      {/* Advanced Settings Dialog */}
      <Dialog open={showAdvanced} onOpenChange={setShowAdvanced}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Advanced Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300">GOAP Depth</label>
              <input
                type="range"
                min="1"
                max="10"
                defaultValue="5"
                className="w-full mt-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">Agent Count</label>
              <input
                type="number"
                min="1"
                max="10"
                defaultValue="4"
                className="w-full mt-2 px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Placeholder for Github icon
const Github = ({ className }: { className: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.544 2.914 1.186.092-.923.35-1.544.636-1.9-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.817c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.137 18.195 20 14.44 20 10.017 20 4.484 15.522 0 10 0z" clipRule="evenodd" />
  </svg>
);
