import { LucideIcon } from "lucide-react";

export interface DataItem {
  text: string;
  icon?: LucideIcon;
  details?: {
    objective?: string;
    sources?: string[];
    citations?: string[];
    agents?: string[];
    preconditions?: string[];
    effects?: string[];
  };
}

export interface Step {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  status: "pending" | "active" | "completed" | "error";
  data?: DataItem[];
  metrics?: { label: string; value: string }[];
}

interface WorldState {
  goalDefined: boolean;
  goalParsed: boolean;
  stateAssessed: boolean;
  informationGathered: boolean;
  documentsAnalyzed: boolean;
  knowledgeSynthesized: boolean;
  insightsGenerated: boolean;
  verified: boolean;
}

interface Action {
  name: string;
  cost: number;
  preconditions: Partial<WorldState>;
  effects: Partial<WorldState>;
  stepGenerator: (goal: string) => Step;
}

/**
 * GOAP (Goal-Oriented Action Planning) Planner
 * Uses A* algorithm to find optimal action sequence
 */
export class GOAPPlanner {
  private actions: Action[];

  constructor(actions: Action[]) {
    this.actions = actions;
  }

  /**
   * Calculate heuristic distance to goal (number of unmet conditions)
   */
  private heuristic(state: WorldState, goal: WorldState): number {
    let distance = 0;
    for (const key in goal) {
      if (goal[key as keyof WorldState] && !state[key as keyof WorldState]) {
        distance++;
      }
    }
    return distance;
  }

  /**
   * Check if all preconditions are met
   */
  private preconditionsMet(state: WorldState, preconditions: Partial<WorldState>): boolean {
    for (const key in preconditions) {
      if (preconditions[key as keyof WorldState] && !state[key as keyof WorldState]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Apply action effects to state
   */
  private applyEffects(state: WorldState, effects: Partial<WorldState>): WorldState {
    return { ...state, ...effects };
  }

  /**
   * Find optimal plan using A* search
   */
  public plan(currentState: WorldState, goalState: WorldState, userGoal: string): Step[] {
    interface Node {
      state: WorldState;
      actions: Action[];
      cost: number;
      heuristic: number;
    }

    const openList: Node[] = [];
    const closedList: Set<string> = new Set();

    const stateToString = (state: WorldState): string => JSON.stringify(state);

    openList.push({
      state: currentState,
      actions: [],
      cost: 0,
      heuristic: this.heuristic(currentState, goalState),
    });

    while (openList.length > 0) {
      // Sort by f-score (cost + heuristic)
      openList.sort((a, b) => (a.cost + a.heuristic) - (b.cost + b.heuristic));
      const current = openList.shift()!;

      const stateStr = stateToString(current.state);
      if (closedList.has(stateStr)) continue;
      closedList.add(stateStr);

      // Check if goal reached
      if (this.heuristic(current.state, goalState) === 0) {
        return current.actions.map((action) => action.stepGenerator(userGoal));
      }

      // Explore neighbors
      for (const action of this.actions) {
        if (this.preconditionsMet(current.state, action.preconditions)) {
          const newState = this.applyEffects(current.state, action.effects);
          const newStateStr = stateToString(newState);

          if (!closedList.has(newStateStr)) {
            openList.push({
              state: newState,
              actions: [...current.actions, action],
              cost: current.cost + action.cost,
              heuristic: this.heuristic(newState, goalState),
            });
          }
        }
      }
    }

    // Fallback if no plan found
    return [];
  }
}

/**
 * Parse a plain-English goal and extract key components
 */
export function parseGoal(goal: string): {
  objective: string;
  keyTerms: string[];
  category: string;
} {
  const lowerGoal = goal.toLowerCase();
  
  // Categorize the goal
  let category = "general";
  if (lowerGoal.includes("research") || lowerGoal.includes("study")) category = "research";
  else if (lowerGoal.includes("build") || lowerGoal.includes("create")) category = "development";
  else if (lowerGoal.includes("analyze") || lowerGoal.includes("analyze")) category = "analysis";
  else if (lowerGoal.includes("optimize") || lowerGoal.includes("improve")) category = "optimization";
  else if (lowerGoal.includes("plan") || lowerGoal.includes("design")) category = "planning";

  // Extract key terms
  const keyTerms = goal
    .split(/[\s,;.!?]+/)
    .filter((word) => word.length > 3)
    .slice(0, 5);

  return {
    objective: goal,
    keyTerms,
    category,
  };
}
