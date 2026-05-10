import { useState, useEffect } from "react";
import { Link as RouterLink } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentCard } from "@/components/AgentCard";
import {
  ArrowLeft,
  Bot,
  Network,
  Activity,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Settings,
  Zap,
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  role: string;
  status: "idle" | "active" | "completed" | "error";
  progress: number;
  currentTask?: string;
  messages?: number;
  efficiency?: number;
  uptime?: string;
  tasksCompleted?: number;
}

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: "researcher",
      name: "Research Agent",
      role: "Information Gathering",
      status: "active",
      progress: 65,
      currentTask: "Gathering data from academic sources",
      messages: 24,
      efficiency: 94,
      uptime: "2h 15m",
      tasksCompleted: 12,
    },
    {
      id: "analyst",
      name: "Analysis Agent",
      role: "Data Analysis",
      status: "idle",
      progress: 0,
      messages: 18,
      efficiency: 89,
      uptime: "1h 45m",
      tasksCompleted: 8,
    },
    {
      id: "synthesizer",
      name: "Synthesis Agent",
      role: "Knowledge Integration",
      status: "idle",
      progress: 0,
      messages: 12,
      efficiency: 92,
      uptime: "1h 30m",
      tasksCompleted: 6,
    },
    {
      id: "validator",
      name: "Validation Agent",
      role: "Quality Assurance",
      status: "completed",
      progress: 100,
      messages: 8,
      efficiency: 98,
      uptime: "45m",
      tasksCompleted: 4,
    },
  ]);

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Simulate agent activity
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents((prevAgents) =>
        prevAgents.map((agent) => {
          if (agent.status === "active" && agent.progress < 100) {
            return {
              ...agent,
              progress: Math.min(agent.progress + Math.random() * 5, 100),
              messages: agent.messages! + Math.floor(Math.random() * 3),
            };
          }
          return agent;
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const activeAgents = agents.filter((a) => a.status === "active");
  const completedAgents = agents.filter((a) => a.status === "completed");
  const totalMessages = agents.reduce((sum, a) => sum + (a.messages || 0), 0);
  const avgEfficiency = Math.round(
    agents.reduce((sum, a) => sum + (a.efficiency || 0), 0) / agents.length
  );

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
            <div className="flex items-center gap-4">
              <RouterLink href="/">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Research
                </Button>
            </RouterLink>
              <div className="h-6 w-px bg-gray-700/50"></div>
              <div className="flex items-center gap-2">
                <Network className="w-5 h-5 text-violet-400" />
                <h1 className="text-xl font-bold text-white">Agent Swarm</h1>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-gray-600/50 hover:bg-gray-800/50">
              <Settings className="w-4 h-4 mr-2" />
              Advanced Settings
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-12">
          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gray-900/50 border-gray-700/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Active Agents</p>
                  <p className="text-3xl font-bold text-white">{activeAgents.length}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-400 opacity-50" />
              </div>
            </Card>
            <Card className="bg-gray-900/50 border-gray-700/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-white">{completedAgents.length}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-emerald-400 opacity-50" />
              </div>
            </Card>
            <Card className="bg-gray-900/50 border-gray-700/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Total Messages</p>
                  <p className="text-3xl font-bold text-white">{totalMessages}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-violet-400 opacity-50" />
              </div>
            </Card>
            <Card className="bg-gray-900/50 border-gray-700/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Avg Efficiency</p>
                  <p className="text-3xl font-bold text-white">{avgEfficiency}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-400 opacity-50" />
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-gray-800/50 border border-gray-700/50">
              <TabsTrigger value="overview" className="data-[state=active]:bg-violet-600">
                <Bot className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-violet-600">
                <Activity className="w-4 h-4 mr-2" />
                Activity
              </TabsTrigger>
              <TabsTrigger value="communication" className="data-[state=active]:bg-violet-600">
                <MessageSquare className="w-4 h-4 mr-2" />
                Communication
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className="cursor-pointer"
                  >
                    <AgentCard agent={agent} />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card className="bg-gray-900/50 border-gray-700/50 p-6">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-violet-400" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      agent: "Research Agent",
                      action: "Completed information gathering from 12 sources",
                      time: "2 minutes ago",
                      status: "success",
                    },
                    {
                      agent: "Validation Agent",
                      action: "Verified data accuracy with 98% confidence",
                      time: "5 minutes ago",
                      status: "success",
                    },
                    {
                      agent: "Synthesis Agent",
                      action: "Integrated 47 data points into knowledge graph",
                      time: "8 minutes ago",
                      status: "success",
                    },
                    {
                      agent: "Analysis Agent",
                      action: "Identified 8 key patterns in research data",
                      time: "12 minutes ago",
                      status: "success",
                    },
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{item.agent}</p>
                        <p className="text-sm text-gray-400">{item.action}</p>
                        <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="communication" className="space-y-4">
              <Card className="bg-gray-900/50 border-gray-700/50 p-6">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-violet-400" />
                  Agent Communication Log
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {[
                    {
                      from: "Research Agent",
                      to: "Analysis Agent",
                      message: "Sending 47 documents for analysis",
                      time: "3 min ago",
                    },
                    {
                      from: "Analysis Agent",
                      to: "Synthesis Agent",
                      message: "Analysis complete: 8 patterns identified",
                      time: "2 min ago",
                    },
                    {
                      from: "Synthesis Agent",
                      to: "Validation Agent",
                      message: "Knowledge synthesis complete, ready for validation",
                      time: "1 min ago",
                    },
                    {
                      from: "Validation Agent",
                      to: "Research Agent",
                      message: "Validation passed with 98% confidence",
                      time: "Just now",
                    },
                  ].map((item, index) => (
                    <div key={index} className="p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {item.from}
                        </Badge>
                        <span className="text-gray-500">→</span>
                        <Badge variant="secondary" className="text-xs">
                          {item.to}
                        </Badge>
                        <span className="text-xs text-gray-500 ml-auto">{item.time}</span>
                      </div>
                      <p className="text-sm text-gray-300">{item.message}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
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
    </div>
  );
}
