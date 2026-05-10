import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Target,
  Sparkles,
  Settings,
  TrendingUp,
  Building2,
  Heart,
  GraduationCap,
  Code,
  Cpu,
  Brain,
  Megaphone,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GoalInputProps {
  onSubmit: (goal: string) => void;
  isPlanning: boolean;
  onAdvancedSettings?: () => void;
}

export const GoalInput = ({ onSubmit, isPlanning, onAdvancedSettings }: GoalInputProps) => {
  const [goal, setGoal] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (goal.trim() && !isPlanning) {
      onSubmit(goal.trim());
    }
  };

  const categories = [
    { id: "finance", label: "Finance", icon: TrendingUp, color: "from-emerald-500 to-emerald-600" },
    { id: "business", label: "Business", icon: Building2, color: "from-blue-500 to-blue-600" },
    { id: "marketing", label: "Marketing", icon: Megaphone, color: "from-orange-500 to-orange-600" },
    { id: "medical", label: "Medical", icon: Heart, color: "from-red-500 to-red-600" },
    { id: "education", label: "Education", icon: GraduationCap, color: "from-amber-500 to-amber-600" },
    { id: "coding", label: "Coding", icon: Code, color: "from-violet-500 to-violet-600" },
    { id: "technical", label: "Technical", icon: Cpu, color: "from-cyan-500 to-cyan-600" },
    { id: "ai-ml", label: "AI & ML", icon: Brain, color: "from-pink-500 to-pink-600" },
  ];

  const handleCategoryClick = async (category: string) => {
    setIsGenerating(true);
    // Simulate generating a goal for the category
    const exampleGoals: Record<string, string> = {
      finance: "Analyze recent market trends and identify emerging investment opportunities in tech stocks",
      business: "Develop a comprehensive business plan for a sustainable e-commerce startup",
      marketing: "Create a multi-channel marketing strategy for a new SaaS product launch",
      medical: "Research the latest advances in personalized medicine and genomic therapy",
      education: "Design an AI-powered learning system for adaptive education",
      coding: "Build a scalable microservices architecture for real-time data processing",
      technical: "Evaluate and compare cloud infrastructure solutions for enterprise deployment",
      "ai-ml": "Develop a machine learning model for predictive analytics and forecasting",
    };

    setTimeout(() => {
      setGoal(exampleGoals[category] || "");
      setIsGenerating(false);
    }, 500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="px-3 py-1 rounded-full bg-gradient-to-r from-violet-500/20 to-pink-500/20 border border-violet-500/30 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-violet-300">GOAP Multi-Agent System</span>
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
          Goal-Oriented Action Planning
        </h1>
        <p className="text-gray-400 text-lg">
          AI-powered research planning using A* pathfinding and dynamic agent coordination
        </p>
      </div>

      {/* Main Input Section */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-blue-500/20 rounded-lg blur opacity-75"></div>
          <div className="relative bg-gray-900/50 backdrop-blur border border-gray-700/50 rounded-lg p-6">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">
              <Target className="w-4 h-4 text-violet-400" />
              Define Research Objective
            </label>
            <Textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Enter your research goal or objective..."
              className="min-h-24 bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-500 focus:border-violet-500/50 focus:ring-violet-500/20 resize-none"
              disabled={isPlanning}
            />
            <p className="text-xs text-gray-500 mt-2">
              The GOAP system will analyze your objective and plan the optimal research workflow
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onAdvancedSettings}
            className="border-gray-600/50 hover:bg-gray-800/50"
          >
            <Settings className="w-4 h-4 mr-2" />
            Advanced
          </Button>
          <Button
            type="submit"
            disabled={!goal.trim() || isPlanning}
            className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white px-8"
          >
            {isPlanning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Research Plan
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Research Plan
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Category Presets */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-400 flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-300">AI-Generated</span>
          Category
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                disabled={isGenerating || isPlanning}
                className={cn(
                  "relative group p-3 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-all duration-300",
                  "bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:from-gray-800 hover:to-gray-800",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 rounded-lg transition-opacity`}></div>
                <div className="relative flex flex-col items-center gap-2">
                  <Icon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  <span className="text-xs font-medium text-gray-400 group-hover:text-white transition-colors text-center">
                    {category.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 text-center">
          Type a goal above or pick a category to begin
        </p>
      </div>
    </div>
  );
};
