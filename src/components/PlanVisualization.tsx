import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Zap,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Step } from "@/lib/goapPlanner";

interface PlanVisualizationProps {
  steps: Step[];
  onStepClick?: (step: Step) => void;
  isExecuting?: boolean;
}

export const PlanVisualization = ({ steps, onStepClick, isExecuting }: PlanVisualizationProps) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set(steps.map((_, i) => `step-${i}`)));

  const toggleExpand = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const getStatusColor = (status: Step["status"]) => {
    switch (status) {
      case "completed":
        return "text-emerald-400";
      case "active":
        return "text-blue-400 animate-pulse";
      case "error":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusIcon = (status: Step["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case "active":
        return <Zap className="w-5 h-5 text-blue-400 animate-pulse" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  if (steps.length === 0) {
    return (
      <Card className="bg-gray-900/50 border-gray-700/50 p-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
            <Zap className="w-6 h-6 text-gray-500" />
          </div>
          <p className="text-gray-400">No plan generated yet</p>
          <p className="text-sm text-gray-500">Enter a goal and click "Generate Research Plan" to begin</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-violet-400" />
          Research Plan ({steps.length} steps)
        </h3>
        <Badge variant="outline" className="border-gray-600 text-gray-300">
          {steps.filter((s) => s.status === "completed").length}/{steps.length} completed
        </Badge>
      </div>

      <div className="space-y-2">
        {steps.map((step, index) => {
          const stepId = `step-${index}`;
          const isExpanded = expandedSteps.has(stepId);
          const Icon = step.icon;

          return (
            <div key={stepId} className="space-y-0">
              {/* Step Header */}
              <button
                onClick={() => {
                  toggleExpand(stepId);
                  onStepClick?.(step);
                }}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-lg border transition-all duration-200",
                  "hover:border-gray-600 hover:bg-gray-800/50",
                  step.status === "active" && "border-blue-500/50 bg-blue-500/5",
                  step.status === "completed" && "border-emerald-500/30 bg-emerald-500/5",
                  step.status === "error" && "border-red-500/30 bg-red-500/5",
                  step.status === "pending" && "border-gray-700/50 bg-gray-800/30"
                )}
              >
                {/* Expand Toggle */}
                <div className="pt-1">
                  {step.data && step.data.length > 0 ? (
                    isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )
                  ) : (
                    <div className="w-4 h-4" />
                  )}
                </div>

                {/* Status Icon */}
                {getStatusIcon(step.status)}

                {/* Content */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-white">{step.title}</h4>
                    <Badge variant="secondary" className="text-xs">
                      Step {index + 1}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-400">{step.description}</p>
                </div>

                {/* Arrow */}
                {index < steps.length - 1 && (
                  <ArrowRight className={cn("w-4 h-4 text-gray-600 flex-shrink-0", getStatusColor(step.status))} />
                )}
              </button>

              {/* Expanded Content */}
              {isExpanded && step.data && step.data.length > 0 && (
                <div className="ml-10 mt-2 space-y-2 pb-2">
                  {step.data.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="p-2 rounded bg-gray-800/30 border border-gray-700/30 text-sm text-gray-300"
                    >
                      <div className="flex items-start gap-2">
                        {item.icon && <item.icon className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />}
                        <div className="flex-1">
                          <p>{item.text}</p>
                          {item.details && (
                            <div className="mt-1 text-xs text-gray-500 space-y-1">
                              {item.details.objective && <p>Objective: {item.details.objective}</p>}
                              {item.details.sources && item.details.sources.length > 0 && (
                                <p>Sources: {item.details.sources.join(", ")}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Metrics */}
              {isExpanded && step.metrics && step.metrics.length > 0 && (
                <div className="ml-10 mt-2 grid grid-cols-2 gap-2 pb-2">
                  {step.metrics.map((metric, metricIndex) => (
                    <div
                      key={metricIndex}
                      className="p-2 rounded bg-gray-800/20 border border-gray-700/30 text-xs"
                    >
                      <p className="text-gray-500">{metric.label}</p>
                      <p className="font-semibold text-white">{metric.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Execute Button */}
      {steps.length > 0 && steps.every((s) => s.status === "pending") && (
        <Button className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white mt-4">
          <Zap className="w-4 h-4 mr-2" />
          Execute Plan
        </Button>
      )}
    </div>
  );
};
