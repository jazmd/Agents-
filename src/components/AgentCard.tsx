import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Bot,
  CheckCircle2,
  Clock,
  AlertCircle,
  Zap,
  MessageSquare,
  TrendingUp,
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

interface AgentCardProps {
  agent: Agent;
  onClick?: () => void;
}

export const AgentCard = ({ agent, onClick }: AgentCardProps) => {
  const getStatusColor = (status: Agent["status"]) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
      case "active":
        return "bg-blue-500/10 border-blue-500/30 text-blue-400";
      case "error":
        return "bg-red-500/10 border-red-500/30 text-red-400";
      default:
        return "bg-gray-800/50 border-gray-700/50 text-gray-400";
    }
  };

  const getStatusIcon = (status: Agent["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />;
      case "active":
        return <Zap className="w-4 h-4 animate-pulse" />;
      case "error":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <Card
      onClick={onClick}
      className={cn(
        "bg-gray-900/50 border-gray-700/50 p-4 cursor-pointer transition-all duration-300",
        "hover:border-gray-600/50 hover:bg-gray-900/70 hover:shadow-lg hover:shadow-violet-500/10"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm">{agent.name}</h4>
            <p className="text-xs text-gray-400">{agent.role}</p>
          </div>
        </div>
        <Badge className={cn("border", getStatusColor(agent.status))}>
          {getStatusIcon(agent.status)}
          <span className="ml-1 capitalize">{agent.status}</span>
        </Badge>
      </div>

      {/* Current Task */}
      {agent.currentTask && (
        <div className="mb-3 p-2 rounded bg-gray-800/50 border border-gray-700/30">
          <p className="text-xs font-medium text-gray-300 mb-1">Current Task</p>
          <p className="text-xs text-gray-400 line-clamp-2">{agent.currentTask}</p>
        </div>
      )}

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium text-gray-300">Progress</p>
          <p className="text-xs text-gray-500">{agent.progress}%</p>
        </div>
        <Progress value={agent.progress} className="h-1.5 bg-gray-800" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        {agent.messages !== undefined && (
          <div className="flex items-center gap-2 p-2 rounded bg-gray-800/30 border border-gray-700/20">
            <MessageSquare className="w-3 h-3 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Messages</p>
              <p className="text-sm font-semibold text-white">{agent.messages}</p>
            </div>
          </div>
        )}
        {agent.efficiency !== undefined && (
          <div className="flex items-center gap-2 p-2 rounded bg-gray-800/30 border border-gray-700/20">
            <TrendingUp className="w-3 h-3 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Efficiency</p>
              <p className="text-sm font-semibold text-white">{agent.efficiency}%</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
