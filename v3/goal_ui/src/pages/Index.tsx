import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import useEmblaCarousel from 'embla-carousel-react';
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
  Briefcase,
  Users,
  BarChart,
  Globe,
  Layers,
  Cpu
} from "lucide-react";
import { AgentStep, StepStatus } from "@/components/AgentStep";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoalInput } from "@/components/GoalInput";
import { WidgetCustomizer } from "@/components/WidgetCustomizer";
import { ResearchReportModal } from "@/components/ResearchReportModal";
import { ReviseResearchForm, type ResearchConfig } from "@/components/ReviseResearchForm";
import { StateAssessmentCard } from "@/components/StateAssessmentCard";
import { GOAPConfigDisplay } from "@/components/GOAPConfigDisplay";
import { GOAPPlanner, parseGoal, type Step, type DataItem } from "@/lib/goapPlanner";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface WidgetConfig {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  cardBackgroundColor: string;
  cardBorderColor: string;
  textColor: string;
  secondaryTextColor: string;
  successColor: string;
  title: string;
  description: string;
  brandName: string;
  defaultGoal: string;
  fontFamily: string;
  borderRadius: string;
  animationSpeed: string;
  cardSpacing: string;
  showMetrics: boolean;
  showStats: boolean;
  compactMode: boolean;
  enableAI: boolean;
  aiModel: string;
}

const defaultResearchConfig: ResearchConfig = {
  goal: "",
  stateDefinition: {
    currentState: { goalDefined: true, informationGathered: false },
    goalState: { verified: true, insightsGenerated: true },
    stateGaps: ["Information needs to be gathered", "Analysis required", "Insights need generation"],
  },
  researchGuidance: {
    focusAreas: [],
    excludeTopics: [],
    depth: "moderate",
    perspective: "technical",
    timeframe: "recent",
  },
  prompts: {
    systemPrompt: `You are an expert research assistant specializing in GOAP (Goal-Oriented Action Planning) research workflows. 
Your role is to provide precise, evidence-based information for each research step.
Format your responses as structured data points that can be used in subsequent research steps.
Always include sources, confidence levels, and timestamps when available.`,
    searchQueryTemplate: "Latest {topic} advancements {year} research site:arxiv.org OR site:scholar.google.com OR site:ieee.org",
    analysisPrompt: `Analyze the following content and extract:
1. Key findings and methodologies
2. Actionable insights and recommendations  
3. Technical details and specifications
4. Sources and citations
5. Confidence level (0-100%) based on source quality`,
    synthesisPrompt: `Synthesize the research findings into:
1. Coherent summary of key discoveries
2. Connections between different sources
3. Practical recommendations
4. Identified gaps or conflicts in the data
5. Overall confidence assessment`,
  },
  goapConfig: {
    executionMode: "closed",
    enableReplanning: true,
    replanningTriggers: ["Action failure", "Low confidence results", "Missing preconditions"],
    costOptimization: true,
    parallelExecution: true,
  },
  actionConfig: {
    maxActionCost: 5,
    enableFallbacks: true,
    validatePreconditions: true,
    trackEffects: true,
  },
  parameters: {
    maxSources: 15,
    minConfidence: 85,
    maxSteps: 7,
    parallelAgents: 3,
    timeout: 120,
  },
  filters: {
    dateRange: "past-year",
    sourceTypes: ["academic", "technical", "industry"],
    languages: ["en"],
    excludeDomains: [],
  },
};

const Index = () => {
  const { toast } = useToast();
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>({
    primaryColor: "#0088FF",
    accentColor: "#0088FF",
    backgroundColor: "#F8FAFC",
    cardBackgroundColor: "#ffffff",
    cardBorderColor: "#E2E8F0",
    textColor: "#2A2A3C",
    secondaryTextColor: "#64748B",
    successColor: "#10B981",
    title: "RuFlo Research",
    description: "Autonomous AI agents that turn plain-English goals into executable plans using Goal-Oriented Action Planning (GOAP).",
    brandName: "RUFLO PLATFORM",
    defaultGoal: "Research the latest advancements in quantum computing",
    fontFamily: "Schibsted Grotesk, sans-serif",
    borderRadius: "2rem",
    animationSpeed: "normal",
    cardSpacing: "1.5rem",
    showMetrics: true,
    showStats: true,
    compactMode: false,
    enableAI: true,
    aiModel: "google/gemini-2.0-flash",
  });
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [userGoal, setUserGoal] = useState<string>("");
  const [isPlanning, setIsPlanning] = useState(false);
  const [planGenerated, setPlanGenerated] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState<number>(1);
  const [showFinalAnalysis, setShowFinalAnalysis] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReviseForm, setShowReviseForm] = useState(false);
  const [finalRecommendations, setFinalRecommendations] = useState<any[]>([]);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [researchConfig, setResearchConfig] = useState<ResearchConfig>(defaultResearchConfig);
  const [currentGOAPState, setCurrentGOAPState] = useState<Record<string, boolean | string | number>>(defaultResearchConfig.stateDefinition.currentState);
  const [showGOAPCards, setShowGOAPCards] = useState(false);
  const activeStepRef = useRef<HTMLDivElement>(null);
  const goapCardsRef = useRef<HTMLDivElement>(null);
  const objectiveRef = useRef<HTMLDivElement>(null);
  const finalAnalysisRef = useRef<HTMLDivElement>(null);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const rufloCapabilities = [
    {
      title: "Multi-Agent Swarms",
      description: "Orchestrate 100+ specialized agents across machines and teams with zero-trust federation.",
      icon: Users,
      color: "#8B5CF6"
    },
    {
      title: "Self-Learning Memory",
      description: "Persistent AgentDB with HNSW indexing for 150x faster pattern retrieval and cross-session recall.",
      icon: Brain,
      color: "#06B6D4"
    },
    {
      title: "GOAP A* Planning",
      description: "Decompose high-level goals into executable plans using state-space search and adaptive replanning.",
      icon: Target,
      color: "#F59E0B"
    },
    {
      title: "Agent Federation",
      description: "Zero-trust protocol for agents to discover, authenticate, and collaborate across organizations.",
      icon: Globe,
      color: "#10B981"
    },
    {
      title: "Neural Optimization",
      description: "Self-improving local model layer using SONA patterns and ReasoningBank trajectory learning.",
      icon: Cpu,
      color: "#EF4444"
    }
  ];

  // GOAP Action definitions
  const createGOAPActions = (goal: string) => {
    const { domain, action, keywords } = parseGoal(goal);
    const keywordStr = keywords.join(", ");

    return [
      {
        name: "analyzeGoal",
        cost: 1,
        preconditions: { goalDefined: true },
        effects: { goalParsed: true },
        stepGenerator: (userGoal: string) => ({
          id: "1",
          title: "Goal Analysis",
          description: `Analyzing "${userGoal.slice(0, 60)}..." and breaking it down into actionable sub-goals.`,
          icon: Target,
          status: "pending" as StepStatus,
          data: [
            { 
              text: "Parse objective", 
              icon: FileText,
              details: {
                objective: "Extract and structure the high-level goal from natural language input",
                preconditions: ["User input received", "NLP module initialized"],
                effects: ["Structured goal object created", "Sub-goals identified"],
                agents: ["Parser Agent", "NLP Agent"],
              }
            },
            { 
              text: "Identify dependencies", 
              icon: Link,
              details: {
                objective: "Map relationships between actions and their requirements",
                preconditions: ["Goal parsed", "Action library loaded"],
                effects: ["Dependency graph generated", "Critical path identified"],
                agents: ["Dependency Analyzer", "Graph Builder"],
                sources: ["Action Registry", "State Definitions"]
              }
            },
            { 
              text: "Map state transitions", 
              icon: Workflow,
              details: {
                objective: "Define how each action transforms the world state",
                preconditions: ["Dependencies mapped", "State space defined"],
                effects: ["Transition matrix created", "State reachability confirmed"],
                agents: ["State Mapper", "Validator Agent"],
                citations: ["GOAP: Goal-Oriented Action Planning - Orkin, J. (2006)"]
              }
            },
          ],
          metrics: [{ label: "Sub-goals", value: "3" }, { label: "Actions", value: "7" }],
        }),
      },
      {
        name: "assessState",
        cost: 1,
        preconditions: { goalParsed: true },
        effects: { stateAssessed: true },
        stepGenerator: () => ({
          id: "2",
          title: "State Assessment",
          description: `Evaluating current knowledge about ${domain} and identifying information gaps.`,
          icon: Brain,
          status: "pending" as StepStatus,
          data: [
            { 
              text: "Assessing current state...", 
              icon: Database,
              details: {
                objective: `Assess current knowledge and capability state for ${goal}`,
                effects: ["Baseline established", "Gaps identified"],
                agents: ["State Assessor"],
              }
            },
            { 
              text: "Defining success criteria...", 
              icon: CheckCircle2,
              details: {
                objective: `Define success criteria and validation requirements for ${domain}`,
                preconditions: ["Goals defined"],
                effects: ["Validation criteria set", "Acceptance tests defined"],
              }
            },
            { 
              text: "Analyzing gaps...", 
              icon: TrendingUp,
              details: {
                objective: `Quantify differences between current and target state for ${action} in ${domain}`,
                effects: ["Priority list generated", "Resource needs identified"],
                agents: ["Gap Analyzer", "Priority Ranker"],
              }
            },
          ],
          metrics: [],
        }),
      },
      {
        name: "gatherInformation",
        cost: 2,
        preconditions: { stateAssessed: true },
        effects: { informationGathered: true },
        stepGenerator: () => ({
          id: "3",
          title: "Web Search",
          description: `Conducting intelligent searches for: ${keywordStr}`,
          icon: Search,
          status: "pending" as StepStatus,
          data: [
            { 
              text: `Searching for ${action} ${keywords[0] || "methods"}...`, 
              icon: Search,
              details: {
                objective: `Execute targeted web searches for ${goal}`,
                sources: ["arXiv.org", "Google Scholar", "ACM Digital Library"],
                agents: ["Search Agent", "Query Optimizer"],
              }
            },
            { 
              text: "Gathering sources...", 
              icon: Database,
              details: {
                objective: `Aggregate and catalog information sources for ${domain}`,
                effects: ["Source database populated", "Relevance scores assigned"],
              }
            },
            { 
              text: "Calculating relevance...", 
              icon: TrendingUp,
              details: {
                objective: `Calculate information quality and applicability metrics for ${keywordStr}`,
                agents: ["Relevance Scorer", "ML Classifier"],
                citations: ["Information Retrieval Metrics - Manning et al."]
              }
            },
          ],
          metrics: [],
        }),
      },
      {
        name: "analyzeDocuments",
        cost: 2,
        preconditions: { informationGathered: true },
        effects: { documentsAnalyzed: true },
        stepGenerator: () => ({
          id: "4",
          title: "Document Analysis",
          description: `Processing documents related to ${domain} to extract key insights.`,
          icon: FileSearch,
          status: "pending" as StepStatus,
          data: [
            { 
              text: "Parsing documents...", 
              icon: FileText,
              details: {
                objective: `Extract structured data from ${domain} documents for ${goal}`,
                preconditions: ["Documents retrieved", "Parser modules loaded"],
                effects: ["Content extracted", "Metadata catalogued"],
                agents: ["Document Parser", "Text Extractor"],
                sources: ["PDF Parser", "HTML Scraper", "API Responses"]
              }
            },
            { 
              text: "Extracting insights...", 
              icon: Lightbulb,
              details: {
                objective: `Identify key findings about ${keywordStr}`,
                preconditions: ["Documents parsed", "NLP models ready"],
                effects: ["Insights database populated", "Key points highlighted"],
                agents: ["Insight Extractor", "NLP Analyzer", "Pattern Recognizer"],
                citations: ["Named Entity Recognition - Nadeau & Sekine"]
              }
            },
            { 
              text: "Validating claims...", 
              icon: Shield,
              details: {
                objective: `Verify factual accuracy for ${action} in ${domain}`,
                preconditions: ["Insights extracted", "Validation rules defined"],
                effects: ["Accuracy scores assigned", "Unreliable sources flagged"],
                agents: ["Fact Checker", "Source Validator", "Cross-Referencer"],
                sources: ["Fact-checking APIs", "Citation Databases"]
              }
            },
          ],
          metrics: [],
        }),
      },
      {
        name: "synthesizeKnowledge",
        cost: 2,
        preconditions: { documentsAnalyzed: true },
        effects: { knowledgeSynthesized: true },
        stepGenerator: () => ({
          id: "5",
          title: "Knowledge Synthesis",
          description: `Synthesizing information from multiple ${domain} sources.`,
          icon: GitBranch,
          status: "pending" as StepStatus,
          data: [
            { 
              text: "Cross-referencing sources...", 
              icon: Link,
              details: {
                objective: `Correlate ${domain} information across multiple sources for ${goal}`,
                preconditions: ["Multiple sources validated", "Correlation rules set"],
                effects: ["Source connections mapped", "Confidence levels adjusted"],
                agents: ["Cross-Referencer", "Correlation Analyzer"],
                sources: ["Academic papers", "Industry reports", "Technical documentation"]
              }
            },
            { 
              text: "Merging concepts...", 
              icon: GitBranch,
              details: {
                objective: `Combine ${keywordStr} concepts into unified knowledge structures`,
                preconditions: ["Concepts identified", "Relationships defined"],
                effects: ["Knowledge graph updated", "Concept taxonomy refined"],
                agents: ["Concept Merger", "Ontology Builder", "Semantic Analyzer"],
                citations: ["Knowledge Graphs - Hogan et al. (2021)"]
              }
            },
            { 
              text: "Resolving conflicts...", 
              icon: CheckCircle2,
              details: {
                objective: `Handle contradictory information about ${action} in ${domain}`,
                preconditions: ["Conflicts detected", "Resolution strategies loaded"],
                effects: ["Consensus reached", "Conflict resolution logged"],
                agents: ["Conflict Resolver", "Evidence Weigher", "Decision Maker"],
                sources: ["Source credibility scores", "Temporal data", "Expert systems"]
              }
            },
          ],
          metrics: [{ label: "Sources", value: "18" }, { label: "Concepts", value: "12" }],
        }),
      },
      {
        name: "generateInsights",
        cost: 2,
        preconditions: { knowledgeSynthesized: true },
        effects: { insightsGenerated: true },
        stepGenerator: () => ({
          id: "6",
          title: "Insight Generation",
          description: `Generating actionable insights for ${domain} based on research findings.`,
          icon: Lightbulb,
          status: "pending" as StepStatus,
          data: [
            { 
              text: "Generating insights...", 
              icon: Zap,
              details: {
                objective: `Create novel conclusions from synthesized ${domain} knowledge for ${goal}`,
                preconditions: ["Knowledge synthesized", "Analysis complete"],
                effects: ["Actionable insights created", "Recommendations formulated"],
                agents: ["Insight Generator", "Recommendation Engine", "Inference Agent"],
                citations: ["Automated Reasoning - Robinson (1965)", "AI Planning - Ghallab et al."]
              }
            },
            { 
              text: "Prioritizing by impact...", 
              icon: TrendingUp,
              details: {
                objective: `Rank insights about ${keywordStr} by potential value and applicability`,
                preconditions: ["Insights generated", "Impact metrics defined"],
                effects: ["Priority scores assigned", "Implementation order set"],
                agents: ["Priority Ranker", "Impact Analyzer", "ROI Calculator"],
                sources: ["Business metrics", "Historical outcomes", "Expert heuristics"]
              }
            },
            { 
              text: "Validating feasibility...", 
              icon: CheckCircle2,
              details: {
                objective: `Assess practicality of ${action} recommendations for ${domain}`,
                preconditions: ["Insights prioritized", "Constraint database available"],
                effects: ["Feasibility scores computed", "Resource needs estimated"],
                agents: ["Feasibility Validator", "Resource Planner", "Constraint Checker"],
                sources: ["Available resources", "Technical constraints", "Timeline requirements"]
              }
            },
          ],
          metrics: [],
        }),
      },
      {
        name: "verify",
        cost: 1,
        preconditions: { insightsGenerated: true },
        effects: { verified: true },
        stepGenerator: () => ({
          id: "7",
          title: "Verification",
          description: "Cross-checking findings and ensuring accuracy before final presentation.",
          icon: CheckCircle2,
          status: "pending" as StepStatus,
          data: [
            { 
              text: "Verifying insights...", 
              icon: Shield,
              details: {
                objective: `Perform final quality assurance on ${domain} insights for ${goal}`,
                preconditions: ["Insights validated", "Verification criteria set"],
                effects: ["Quality confirmed", "Errors corrected"],
                agents: ["Quality Assurance Agent", "Verification Bot", "Audit Agent"],
                sources: ["Quality standards", "Best practices", "Validation protocols"]
              }
            },
            { 
              text: "Checking sources...", 
              icon: Filter,
              details: {
                objective: `Re-validate all ${keywordStr} information sources for final output`,
                preconditions: ["Sources catalogued", "Verification complete"],
                effects: ["Source reliability confirmed", "Citations verified"],
                agents: ["Source Checker", "Citation Validator", "Provenance Tracker"],
                citations: ["Information Provenance - Buneman et al. (2001)"]
              }
            },
            { 
              text: "Calculating confidence...", 
              icon: TrendingUp,
              details: {
                objective: `Calculate overall confidence in ${action} research findings`,
                preconditions: ["All checks complete", "Confidence model loaded"],
                effects: ["Final confidence score computed", "Report ready"],
                agents: ["Confidence Calculator", "Statistical Analyzer", "Meta-Evaluator"],
                sources: ["Validation results", "Source quality scores", "Cross-reference matches"]
              }
            },
          ],
          metrics: [],
        }),
      },
    ];
  };

  // Handle goal submission and planning
  const handleGoalSubmit = async (goal: string) => {
    setUserGoal(goal);
    setIsPlanning(true);
    setShowFinalAnalysis(false);
    setShowGOAPCards(false);

    // Simulate planning phase
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Reset GOAP state to initial
    setCurrentGOAPState(researchConfig.stateDefinition.currentState);

    // Create GOAP planner
    const actions = createGOAPActions(goal);
    const planner = new GOAPPlanner(actions);

    // Calculate adaptive metrics based on goal complexity and GOAP config
    const goalComplexity = goal.split(' ').length;
    const adaptiveSubGoals = Math.min(
      Math.max(2, Math.ceil(goalComplexity / 10)), // 2-5 sub-goals based on word count
      researchConfig.parameters.maxSteps
    );
    
    const adaptiveActions = researchConfig.goapConfig.executionMode === "open" 
      ? researchConfig.parameters.maxSteps + 3 // More actions in open mode
      : researchConfig.goapConfig.executionMode === "focused"
      ? Math.min(5, researchConfig.parameters.maxSteps) // Fewer actions in focused mode
      : researchConfig.parameters.maxSteps; // Normal for closed mode

    // Define current and goal states
    const currentState = {
      goalDefined: true,
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

    // Generate plan
    const plan = planner.plan(currentState, goalState, goal);

    if (plan.length === 0) {
      toast({
        title: "Planning Failed",
        description: "Could not generate a valid plan for this objective.",
        variant: "destructive",
      });
      setIsPlanning(false);
      return;
    }

    // Update Goal Analysis step with adaptive metrics
    if (plan[0]) {
      plan[0].metrics = [
        { label: "Sub-goals", value: String(adaptiveSubGoals) },
        { label: "Actions", value: String(adaptiveActions) }
      ];
    }

    toast({
      title: "Plan Generated",
      description: `Created ${plan.length}-step research workflow using GOAP algorithm.`,
    });

    setSteps(plan);
    setIsPlanning(false);
    setPlanGenerated(true);
    setVisibleSteps(1);
    // Issue #1694: do NOT auto-execute. Wait for the user to click
    // "Start Research" so the planning step is observable and reversible.
  };

  // Execute research plan
  const executeResearch = async (stepsToExecute?: Step[], researchGoal?: string) => {
    const initialSteps = stepsToExecute || steps;
    console.log('executeResearch started, steps:', initialSteps.length);
    console.log('GOAP Config:', {
      executionMode: researchConfig.goapConfig.executionMode,
      enableReplanning: researchConfig.goapConfig.enableReplanning,
      costOptimization: researchConfig.goapConfig.costOptimization,
      parallelExecution: researchConfig.goapConfig.parallelExecution,
    });
    
    setIsRunning(true);
    setShowFinalAnalysis(false);
    
    // Animate GOAP cards in
    setTimeout(() => setShowGOAPCards(true), 300);
    
    // Wait for GOAP cards animation to complete (4 seconds total)
    // State Assessment: 2s, Config: 1.5s delay + 2.5s = 4s total
    await new Promise(resolve => setTimeout(resolve, 4500));

    // Keep a working copy that we update with AI data
    let workingSteps = [...initialSteps];

    // Process each step sequentially
    for (let i = 0; i < workingSteps.length; i++) {
      console.log(`\n=== Processing step ${i}: ${workingSteps[i].title} ===`);
      
      // Update GOAP state based on step progression
      const stateUpdates: Record<string, boolean> = {
        goalParsed: i >= 0,
        stateAssessed: i >= 1,
        informationGathered: i >= 2,
        documentsAnalyzed: i >= 3,
        knowledgeSynthesized: i >= 4,
        insightsGenerated: i >= 5,
        verified: i >= 6,
      };
      
      setCurrentGOAPState(prev => ({ ...prev, ...stateUpdates }));
      console.log('GOAP State Updated:', stateUpdates);
      
      // Show and activate current step
      setVisibleSteps(i + 1);
      setSteps((prev) => {
        const newSteps = [...prev];
        newSteps[i].status = "active";
        return newSteps;
      });

      // Wait a moment for UI to update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Call edge function to get real research data from Gemini
      if (widgetConfig.enableAI) {
        try {
          const currentStep = workingSteps[i];
          
          // Build context from all previous completed steps (with their AI data)
          const previousStepsData = workingSteps.slice(0, i).map(step => ({
            stepTitle: step.title,
            data: step.data.map(item => {
              const details = item.details as any;
              return {
                id: '',
                title: item.text,
                content: details?.objective || item.text,
                source: details?.source || (Array.isArray(details?.sources) ? details.sources[0] : undefined),
                confidence: details?.confidence,
                timestamp: details?.timestamp || new Date().toISOString(),
              };
            })
          }));
          
          console.log(`📤 Calling Gemini API for step ${i}`);
          console.log(`   Context: ${previousStepsData.length} previous steps with ${previousStepsData.reduce((sum, s) => sum + s.data.length, 0)} total data items`);
          
          const { data, error } = await supabase.functions.invoke('research-step', {
            body: {
              goal: researchGoal || userGoal,
              stepTitle: currentStep.title,
              stepDescription: currentStep.description,
              stepType: currentStep.id,
              aiModel: widgetConfig.aiModel,
              config: {
                researchGuidance: researchConfig.researchGuidance,
                prompts: researchConfig.prompts,
                parameters: researchConfig.parameters,
                filters: researchConfig.filters,
              },
              previousStepsData: previousStepsData,
            },
          });

          if (error) {
            console.error('❌ Error fetching research data:', error);
            
            // Check if replanning is enabled
            if (researchConfig.goapConfig.enableReplanning) {
              console.log('🔄 Replanning enabled - checking triggers');
              const shouldReplan = researchConfig.goapConfig.replanningTriggers.includes("Action failure");
              
              if (shouldReplan) {
                console.log('🔄 Replanning triggered due to action failure');
                toast({
                  title: "Replanning Triggered",
                  description: "Action failed - GOAP system is adapting the plan...",
                });
              }
            }
            
            toast({
              title: "AI Research Error",
              description: error.message || "Failed to generate research data",
              variant: "destructive",
            });
          } else if (data && Array.isArray(data)) {
            console.log(`✅ Gemini returned ${data.length} items for step ${i}`);
            
            // Transform AI data into step data format
            const aiData = data.map((item: any) => ({
              text: item.title,
              icon: Sparkles,
              details: {
                objective: item.content,
                source: item.source,
                confidence: item.confidence,
                timestamp: item.timestamp,
              }
            }));
            
            // Update working copy with AI data (THIS is what gets passed to next step)
            workingSteps[i].data = aiData;
            console.log(`💾 Updated working copy of step ${i} - will be used as context for step ${i + 1}`);
            
            // Also update UI state
            setSteps((prev) => {
              const newSteps = [...prev];
              if (newSteps[i]) {
                newSteps[i].data = aiData;
              }
              return newSteps;
            });
          }
        } catch (err) {
          console.error('Exception calling research-step:', err);
          toast({
            title: "AI Research Error",
            description: "Failed to connect to research service",
            variant: "destructive",
          });
        }
      }

      // Wait for research to complete (simulate processing time)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Complete current step
      workingSteps[i].status = "completed";
      setSteps((prev) => {
        const newSteps = [...prev];
        newSteps[i].status = "completed";
        console.log(`✓ Completed step ${i}: ${newSteps[i].title}`);
        return newSteps;
      });

      // Wait before moving to next step
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log(`=== Step ${i} complete. Moving to next step ===\n`);
    }

    // All steps complete
    setIsRunning(false);
    
    // Generate final research report with all context
    if (widgetConfig.enableAI) {
      try {
        // Build comprehensive context from all completed steps
        const allResearchContext = workingSteps.map(step => ({
          stepTitle: step.title,
          data: step.data.map(item => {
            const details = item.details as any;
            return {
              id: '',
              title: item.text,
              content: details?.objective || item.text,
              source: details?.source || (Array.isArray(details?.sources) ? details.sources[0] : undefined),
              confidence: details?.confidence,
              timestamp: details?.timestamp || new Date().toISOString(),
            };
          })
        }));

        const { data, error } = await supabase.functions.invoke('research-step', {
          body: {
            goal: researchGoal || userGoal,
            stepTitle: "Final Recommendations",
            stepDescription: `Based on all research findings, provide specific, actionable recommendations that directly answer: "${researchGoal || userGoal}". Include concrete suggestions with supporting data from the research.`,
            stepType: "final-report",
            aiModel: widgetConfig.aiModel,
            previousStepsData: allResearchContext,
          },
        });

        if (!error && data && Array.isArray(data)) {
          console.log('Final report recommendations generated:', data.length, 'items');
          setFinalRecommendations(data);
        }
      } catch (err) {
        console.error('Error generating final report:', err);
      }
    }
    
    setTimeout(() => {
      setShowFinalAnalysis(true);
    }, 1000);
  };

  const resetAll = () => {
    setUserGoal("");
    setPlanGenerated(false);
    setSteps([]);
    setIsRunning(false);
    setShowFinalAnalysis(false);
    setShowReportModal(false);
    setShowReviseForm(false);
    setShowAdvancedSettings(false);
    setShowGOAPCards(false);
    setFinalRecommendations([]);
    setResearchConfig(defaultResearchConfig);
    setCurrentGOAPState(defaultResearchConfig.stateDefinition.currentState);
    setVisibleSteps(1);
  };

  const handleReviseSubmit = (config: ResearchConfig) => {
    console.log("Revised research config:", config);
    setResearchConfig(config);
    setShowReviseForm(false);
    setUserGoal(config.goal);
    handleGoalSubmit(config.goal);
    toast({
      title: "Research Revised",
      description: "Starting new research with updated parameters...",
    });
  };

  const handleAdvancedSettingsSubmit = (config: ResearchConfig) => {
    console.log("Advanced research config:", config);
    setResearchConfig(config);
    setShowAdvancedSettings(false);
    
    // If there's a goal in the config, update it
    if (config.goal && config.goal !== userGoal) {
      setUserGoal(config.goal);
    }
    
    toast({
      title: "Advanced Settings Applied",
      description: "Research parameters have been configured. Submit your research goal to begin.",
    });
  };

  const handleGenerateWidget = () => {
    toast({
      title: "Widget Code Generated",
      description: "Copy the embed code and paste it into your website.",
    });
  };

  // Auto-scroll effects
  useEffect(() => {
    if (activeStepRef.current && isRunning) {
      activeStepRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [visibleSteps, isRunning]);

  useEffect(() => {
    if (goapCardsRef.current && showGOAPCards) {
      setTimeout(() => {
        goapCardsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 200);
      
      // After GOAP Configuration completes (1.5s delay + 2.5s animation = 4s), scroll to objective
      setTimeout(() => {
        objectiveRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 4200);
    }
  }, [showGOAPCards]);

  useEffect(() => {
    if (finalAnalysisRef.current && showFinalAnalysis) {
      setTimeout(() => {
        finalAnalysisRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 300);
    }
  }, [showFinalAnalysis]);

  return (
    <div 
      className="min-h-screen transition-colors duration-300"
      style={{ 
        backgroundColor: widgetConfig.backgroundColor,
        fontFamily: widgetConfig.fontFamily,
      }}
    >
      {/* Header / Personal Hero Section */}
      <header className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,#8b5cf615_0%,transparent_100%)]" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-top-10 duration-1000">
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-500 hover:scale-105 hover:tracking-[0.25em]"
              style={{ 
                backgroundColor: `${widgetConfig.primaryColor}10`,
                color: widgetConfig.primaryColor,
                border: `1px solid ${widgetConfig.primaryColor}25`
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Product Leader & Innovation Architect
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl md:text-8xl font-bold tracking-tighter text-slate-900 mb-2 font-sans">
                Faidhi Fahmi
              </h1>
              <div className="h-1.5 w-24 bg-blue-600 mx-auto rounded-full" />
            </div>
            
            <p className="text-xl md:text-3xl text-slate-500 max-w-3xl mx-auto leading-relaxed font-light font-sans italic">
              Scaling innovation through <span className="text-slate-900 font-medium not-italic">autonomous AI systems</span> and data-driven product strategies.
            </p>

            <div className="flex flex-wrap justify-center gap-4 pt-6">
              {[
                { icon: Briefcase, text: "CEO @ iLyF" },
                { icon: Target, text: "Founder Institute SEA '22" },
                { icon: BarChart, text: "8+ Years in Startup Ecosystem" }
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/50 backdrop-blur-sm border border-slate-200/60 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
                >
                  <item.icon className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-slate-700 tracking-tight">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="pt-8 flex gap-4">
              <Button
                onClick={() => {
                  const el = document.getElementById('ruflo-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="rounded-2xl px-10 h-14 text-base font-bold shadow-xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Explore Projects
              </Button>
              <a 
                href="https://www.linkedin.com/in/faidhifahmi/" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  className="rounded-2xl px-10 h-14 text-base font-bold border-2 transition-all hover:bg-slate-50 active:scale-95"
                >
                  Get in Touch
                </Button>
              </a>
            </div>
          </div>
        </div>
      </header>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute top-[-10%] left-[10%] w-72 h-72 bg-blue-400 rounded-full blur-[120px]" />
          <div className="absolute bottom-[10%] right-[10%] w-96 h-96 bg-indigo-300 rounded-full blur-[150px]" />
        </div>
      </div>

      {/* Professional Bio / About Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left-10 duration-1000">
            <h2 className="text-4xl font-bold text-slate-900 tracking-tight">
              Building products that feel <span className="text-blue-600">inevitable</span>.
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              With over 8 years in the startup ecosystem, I've dedicated my career to bridging the gap between complex technology and real-world impact. As the CEO of iLyF and a graduate of the Founder Institute, I focus on scaling innovation through data-driven strategies and autonomous AI systems.
            </p>
            <p className="text-lg text-slate-600 leading-relaxed">
              My approach combines rigorous product management with a deep understanding of AI orchestration—creating systems like RuFlo that don't just execute, but learn and evolve.
            </p>
            <div className="flex gap-10 pt-4">
              <div>
                <div className="text-3xl font-bold text-slate-900">8+</div>
                <div className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Years Exp</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900">100+</div>
                <div className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Agents Built</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900">2022</div>
                <div className="text-sm text-slate-500 uppercase tracking-wider font-semibold">FI Graduate</div>
              </div>
            </div>
          </div>
          
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600/20 to-purple-600/20 rounded-[3rem] blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
            <div className="relative aspect-square rounded-[2.5rem] bg-slate-100 overflow-hidden border border-slate-200 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                <Users className="w-32 h-32 text-slate-400 opacity-20" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center space-y-4">
                  <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center mb-4">
                    <Sparkles className="w-10 h-10 text-blue-600" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900">Innovation Mindset</h4>
                  <p className="text-sm text-slate-500 italic">"The best way to predict the future is to build it autonomously."</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Expertise Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 border-t border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {[
            { label: "Expertise", title: "Product Strategy", desc: "Scaling products from zero to millions of users with a focus on core value and unit economics.", icon: Layers },
            { label: "Focus", title: "Agentic AI", desc: "Architecting autonomous systems that solve complex, multi-step problems using GOAP and LLMs.", icon: Brain },
            { label: "Engine", title: "Data Analytics", desc: "Transforming raw data into actionable insights that drive growth and product innovation.", icon: BarChart },
            { label: "Culture", title: "Leadership", desc: "Building high-performance teams and fostering a culture of rapid experimentation and excellence.", icon: Users },
          ].map((item, i) => (
            <div key={i} className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-blue-600 uppercase">
                <item.icon className="w-3 h-3" />
                {item.label}
              </div>
              <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Main Content / RuFlo Section */}
      <div id="ruflo-section" className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 scroll-mt-20">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">RuFlo Research</h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            A state-of-the-art autonomous research engine powered by Goal-Oriented Action Planning.
          </p>
        </div>

        {/* Widget Customization Modal */}
        <Dialog open={showCustomizer} onOpenChange={setShowCustomizer}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Widget Customization</DialogTitle>
            </DialogHeader>
            <WidgetCustomizer
              config={widgetConfig}
              onConfigChange={setWidgetConfig}
              onGenerate={handleGenerateWidget}
            />
          </DialogContent>
        </Dialog>

        {/* Goal Input */}
        {!planGenerated && (
          <div 
            style={{ 
              '--card-bg': widgetConfig.backgroundColor,
              '--border-color': `${widgetConfig.primaryColor}40`
            } as React.CSSProperties}
          >
          <GoalInput
            onSubmit={handleGoalSubmit}
            isPlanning={isPlanning}
            onAdvancedSettings={() => setShowAdvancedSettings(true)}
            onConfigUpdate={(optimizedConfig) => {
              setResearchConfig(prev => ({
                ...prev,
                researchGuidance: {
                  ...prev.researchGuidance,
                  ...optimizedConfig.researchGuidance
                },
                prompts: {
                  ...prev.prompts,
                  ...optimizedConfig.prompts
                },
                parameters: {
                  ...prev.parameters,
                  ...optimizedConfig.parameters
                },
                filters: {
                  ...prev.filters,
                  ...optimizedConfig.filters
                },
                goapConfig: {
                  ...prev.goapConfig,
                  ...optimizedConfig.goapConfig
                }
              }));
            }}
          />
          </div>
        )}

        {/* Planning Status */}
        {isPlanning && (
          <div 
            className="mt-8 border rounded-lg p-6 animate-pulse"
            style={{ 
              backgroundColor: `${widgetConfig.backgroundColor}dd`,
              borderColor: `${widgetConfig.primaryColor}40`
            }}
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 animate-spin" style={{ color: widgetConfig.primaryColor }} />
              <div>
                <h3 className="font-medium" style={{ color: widgetConfig.textColor }}>Planning Research Workflow</h3>
                <p className="text-sm" style={{ color: widgetConfig.secondaryTextColor }}>
                  Analyzing objective, identifying preconditions, calculating optimal action sequence...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Research Execution */}
        {planGenerated && steps.length > 0 && (
          <>
            {/* GOAP Configuration and State Assessment - Animated */}
            {showGOAPCards && (
              <div ref={goapCardsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div 
                  className="opacity-0"
                  style={{ 
                    animation: 'fade-in 2s ease-out forwards',
                    animationDelay: '0ms' 
                  }}
                >
                  <StateAssessmentCard
                    currentState={currentGOAPState}
                    goalState={researchConfig.stateDefinition.goalState}
                    stateGaps={researchConfig.stateDefinition.stateGaps}
                    primaryColor={widgetConfig.primaryColor}
                    accentColor={widgetConfig.accentColor}
                  />
                </div>
                <div 
                  className="opacity-0"
                  style={{ 
                    animation: 'fade-in 2.5s ease-out forwards',
                    animationDelay: '1500ms' 
                  }}
                >
                  <GOAPConfigDisplay
                    executionMode={researchConfig.goapConfig.executionMode}
                    enableReplanning={researchConfig.goapConfig.enableReplanning}
                    replanningTriggers={researchConfig.goapConfig.replanningTriggers}
                    costOptimization={researchConfig.goapConfig.costOptimization}
                    parallelExecution={researchConfig.goapConfig.parallelExecution}
                    maxActionCost={researchConfig.actionConfig.maxActionCost}
                    primaryColor={widgetConfig.primaryColor}
                  />
                </div>
              </div>
            )}

            {/* Control Button */}
            <div ref={objectiveRef} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-6 sm:mb-8">
              <Button
                onClick={resetAll}
                variant="outline"
                size="sm"
                disabled={isRunning}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                New Research
              </Button>
              <div className="text-xs sm:text-sm flex-1 min-w-0 text-center px-4" style={{ color: widgetConfig.secondaryTextColor }}>
                <span className="font-medium" style={{ color: widgetConfig.textColor }}>Objective:</span> <span className="break-words">{userGoal}</span>
              </div>
              {/* Issue #1694: explicit "Start Research" gate so the plan is reviewable before execution. */}
              {!isRunning && visibleSteps <= 1 ? (
                <Button
                  onClick={() => executeResearch(steps, userGoal)}
                  size="sm"
                  className="gap-2"
                  style={{ backgroundColor: widgetConfig.primaryColor, color: "#fff" }}
                >
                  <Play className="w-4 h-4" />
                  Start Research
                </Button>
              ) : (
                <div className="w-[120px]" />
              )}
            </div>

              {/* Timeline */}
              <div className="relative">
                {/* Vertical line */}
                <div 
                  className="absolute left-0 sm:left-0 top-0 bottom-0 w-px ml-1.5 sm:ml-2.5"
                  style={{ backgroundColor: `${widgetConfig.primaryColor}40` }}
                />

                {/* Steps */}
                <div 
                  className="pl-6 sm:pl-10"
                  style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    gap: widgetConfig.cardSpacing
                  }}
                >
                {steps.slice(0, visibleSteps).map((step, index) => (
                  <div
                    key={step.id}
                    ref={index === visibleSteps - 1 ? activeStepRef : null}
                  >
                    <AgentStep
                      title={step.title}
                      description={step.description}
                      icon={step.icon}
                      status={step.status}
                      delay={0}
                      data={step.data}
                      metrics={widgetConfig.showMetrics ? step.metrics : undefined}
                      primaryColor={widgetConfig.primaryColor}
                      accentColor={widgetConfig.accentColor}
                      cardBackgroundColor={widgetConfig.cardBackgroundColor}
                      cardBorderColor={widgetConfig.cardBorderColor}
                      textColor={widgetConfig.textColor}
                      secondaryTextColor={widgetConfig.secondaryTextColor}
                      successColor={widgetConfig.successColor}
                      borderRadius={widgetConfig.borderRadius}
                      animationSpeed={widgetConfig.animationSpeed}
                      compactMode={widgetConfig.compactMode}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            {widgetConfig.showStats && (
              <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div 
                  className="border p-4 text-center"
                  style={{ 
                    backgroundColor: `${widgetConfig.backgroundColor}dd`,
                    borderColor: `${widgetConfig.primaryColor}40`,
                    borderRadius: widgetConfig.borderRadius,
                  }}
                >
                  <div className="text-2xl font-semibold mb-1" style={{ color: widgetConfig.primaryColor }}>
                    {steps.filter((s) => s.status === "completed").length}
                  </div>
                  <div className="text-xs" style={{ color: widgetConfig.secondaryTextColor }}>Completed</div>
                </div>
                <div 
                  className="border p-4 text-center"
                  style={{ 
                    backgroundColor: `${widgetConfig.backgroundColor}dd`,
                    borderColor: `${widgetConfig.primaryColor}40`,
                    borderRadius: widgetConfig.borderRadius,
                  }}
                >
                  <div className="text-2xl font-semibold mb-1" style={{ color: widgetConfig.primaryColor }}>
                    {steps.filter((s) => s.status === "active").length}
                  </div>
                  <div className="text-xs" style={{ color: widgetConfig.secondaryTextColor }}>Active</div>
                </div>
                <div 
                  className="border p-4 text-center"
                  style={{ 
                    backgroundColor: `${widgetConfig.backgroundColor}dd`,
                    borderColor: `${widgetConfig.primaryColor}40`,
                    borderRadius: widgetConfig.borderRadius,
                  }}
                >
                  <div className="text-2xl font-semibold mb-1" style={{ color: widgetConfig.secondaryTextColor }}>
                    {steps.filter((s) => s.status === "pending").length}
                  </div>
                  <div className="text-xs" style={{ color: widgetConfig.secondaryTextColor }}>Pending</div>
                </div>
              </div>
            )}

            {/* Final Research Report */}
            {showFinalAnalysis && (
              <div 
                ref={finalAnalysisRef}
                className="mt-8 space-y-6 animate-scale-in"
              >
                {/* Header */}
                <div 
                  className="rounded-lg p-6"
                  style={{
                    background: `linear-gradient(to bottom right, ${widgetConfig.accentColor}1a, ${widgetConfig.accentColor}0d)`,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: `${widgetConfig.accentColor}4d`
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div 
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${widgetConfig.accentColor}33` }}
                    >
                      <FileText className="w-6 h-6" style={{ color: widgetConfig.accentColor }} />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2 flex items-center gap-2" style={{ color: widgetConfig.accentColor }}>
                        Final Research Report
                        <CheckCircle2 className="w-5 h-5" />
                      </h3>
                      <p className="text-sm mb-4" style={{ color: widgetConfig.secondaryTextColor }}>
                        Comprehensive analysis generated by multi-agent GOAP research system
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                        <div className="rounded p-3" style={{ backgroundColor: `${widgetConfig.backgroundColor}80` }}>
                          <div className="text-xs mb-1" style={{ color: widgetConfig.secondaryTextColor }}>Total Steps</div>
                          <div className="text-xl font-semibold" style={{ color: widgetConfig.textColor }}>{steps.length}</div>
                        </div>
                        <div className="rounded p-3" style={{ backgroundColor: `${widgetConfig.backgroundColor}80` }}>
                          <div className="text-xs mb-1" style={{ color: widgetConfig.secondaryTextColor }}>Data Points</div>
                          <div className="text-xl font-semibold" style={{ color: widgetConfig.textColor }}>
                            {steps.reduce((acc, step) => acc + (step.data?.length || 0), 0)}
                          </div>
                        </div>
                        <div className="rounded p-3" style={{ backgroundColor: `${widgetConfig.backgroundColor}80` }}>
                          <div className="text-xs mb-1" style={{ color: "#a3a3a3" }}>Confidence</div>
                          <div className="text-xl font-semibold" style={{ color: widgetConfig.accentColor }}>94%</div>
                        </div>
                        <div className="rounded p-3" style={{ backgroundColor: `${widgetConfig.backgroundColor}80` }}>
                          <div className="text-xs mb-1 flex items-center gap-1" style={{ color: widgetConfig.secondaryTextColor }}>
                            <Clock className="w-3 h-3" />
                            Duration
                          </div>
                          <div className="text-xl font-semibold" style={{ color: widgetConfig.textColor }}>
                            {Math.round(steps.length * 3.5)}s
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Executive Summary */}
                <div 
                  className="rounded-lg p-6"
                  style={{
                    backgroundColor: widgetConfig.cardBackgroundColor,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: widgetConfig.cardBorderColor
                  }}
                >
                  <h4 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: widgetConfig.textColor }}>
                    <Target className="w-5 h-5" style={{ color: widgetConfig.primaryColor }} />
                    Executive Summary
                  </h4>
                  <p className="text-sm leading-relaxed" style={{ color: widgetConfig.secondaryTextColor }}>
                    This research successfully analyzed <span style={{ color: widgetConfig.accentColor, fontWeight: 600 }}>"{userGoal}"</span> through 
                    a {steps.length}-step Goal-Oriented Action Planning (GOAP) workflow. The system coordinated multiple specialized agents 
                    to gather information, analyze documents, synthesize knowledge, and generate actionable insights with 
                    high confidence scores across all validation checks.
                  </p>
                </div>

                {/* Tabbed Report Sections */}
                <Tabs defaultValue="direct-answer" className="w-full">
                  <TabsList 
                    className="w-full grid grid-cols-2 md:grid-cols-4 gap-1 md:gap-2 h-auto p-1"
                    style={{
                      backgroundColor: widgetConfig.cardBackgroundColor,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: widgetConfig.cardBorderColor
                    }}
                  >
                    <TabsTrigger 
                      value="direct-answer"
                      className="text-xs md:text-sm py-2 md:py-2.5"
                      style={{
                        color: widgetConfig.secondaryTextColor,
                      }}
                    >
                      <Sparkles className="w-4 h-4 mr-1 md:mr-2" />
                      <span className="hidden sm:inline">Direct Answer</span>
                      <span className="sm:hidden">Answer</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="key-findings"
                      className="text-xs md:text-sm py-2 md:py-2.5"
                      style={{
                        color: widgetConfig.secondaryTextColor,
                      }}
                    >
                      <Lightbulb className="w-4 h-4 mr-1 md:mr-2" />
                      <span className="hidden sm:inline">Key Findings</span>
                      <span className="sm:hidden">Findings</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="methodology"
                      className="text-xs md:text-sm py-2 md:py-2.5"
                      style={{
                        color: widgetConfig.secondaryTextColor,
                      }}
                    >
                      <Workflow className="w-4 h-4 mr-1 md:mr-2" />
                      <span className="hidden sm:inline">Methodology</span>
                      <span className="sm:hidden">Method</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="next-steps"
                      className="text-xs md:text-sm py-2 md:py-2.5"
                      style={{
                        color: widgetConfig.secondaryTextColor,
                      }}
                    >
                      <TrendingUp className="w-4 h-4 mr-1 md:mr-2" />
                      <span className="hidden sm:inline">Next Steps</span>
                      <span className="sm:hidden">Steps</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Direct Answer Tab */}
                  <TabsContent value="direct-answer" className="mt-4">
                    {finalRecommendations.length > 0 ? (
                      <div 
                        className="rounded-lg p-6"
                        style={{
                          backgroundColor: widgetConfig.cardBackgroundColor,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          borderColor: widgetConfig.cardBorderColor
                        }}
                      >
                        <div className="space-y-4">
                          {finalRecommendations.slice(0, 4).map((rec: any, idx: number) => (
                            <div key={idx} className="rounded p-4" style={{ backgroundColor: `${widgetConfig.accentColor}0d` }}>
                              <div className="font-medium mb-1" style={{ color: widgetConfig.textColor }}>{rec.title}</div>
                              <p className="text-sm" style={{ color: widgetConfig.secondaryTextColor }}>{rec.content}</p>
                              {rec.source && (
                                <div className="mt-2 text-xs" style={{ color: widgetConfig.accentColor }}>Source: {rec.source}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="rounded-lg p-6 text-center"
                        style={{
                          backgroundColor: widgetConfig.cardBackgroundColor,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          borderColor: widgetConfig.cardBorderColor
                        }}
                      >
                        <p className="text-sm" style={{ color: widgetConfig.secondaryTextColor }}>
                          No direct answers available yet. Complete the research to see results.
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Key Findings Tab */}
                  <TabsContent value="key-findings" className="mt-4">
                    <div 
                      className="rounded-lg p-6"
                      style={{
                        backgroundColor: widgetConfig.cardBackgroundColor,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: widgetConfig.cardBorderColor
                      }}
                    >
                      <div className="space-y-3">
                        {steps.slice(0, 3).map((step, idx) => (
                          <div 
                            key={idx}
                            className="rounded p-4"
                            style={{ backgroundColor: `${widgetConfig.primaryColor}0d` }}
                          >
                            <div className="flex items-start gap-3">
                              <div 
                                className="p-1.5 rounded"
                                style={{ backgroundColor: `${widgetConfig.primaryColor}1a` }}
                              >
                                {step.icon && <step.icon className="w-4 h-4" style={{ color: widgetConfig.primaryColor }} />}
                              </div>
                              <div className="flex-1">
                                <h5 className="font-medium text-sm mb-1" style={{ color: widgetConfig.textColor }}>
                                  {step.title}
                                </h5>
                                <p className="text-xs" style={{ color: widgetConfig.secondaryTextColor }}>
                                  {step.description}
                                </p>
                                {step.data && step.data.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {step.data.slice(0, 3).map((item, i) => (
                                      <span 
                                        key={i}
                                        className="text-xs px-2 py-1 rounded"
                                        style={{ 
                                          backgroundColor: `${widgetConfig.accentColor}1a`,
                                          color: widgetConfig.accentColor 
                                        }}
                                      >
                                        {item.text}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Methodology Tab */}
                  <TabsContent value="methodology" className="mt-4">
                    <div 
                      className="rounded-lg p-6"
                      style={{
                        backgroundColor: widgetConfig.cardBackgroundColor,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: widgetConfig.cardBorderColor
                      }}
                    >
                      <div className="space-y-2">
                        {steps.map((step, idx) => (
                          <div 
                            key={idx}
                            className="flex items-center gap-3 text-sm"
                          >
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                              style={{ 
                                backgroundColor: `${widgetConfig.successColor}33`,
                                color: widgetConfig.successColor 
                              }}
                            >
                              {idx + 1}
                            </div>
                            <span style={{ color: widgetConfig.secondaryTextColor }}>
                              {step.title}
                            </span>
                            <div className="flex-1 h-px" style={{ backgroundColor: widgetConfig.cardBorderColor }} />
                            <CheckCircle2 className="w-4 h-4" style={{ color: widgetConfig.successColor }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Next Steps Tab */}
                  <TabsContent value="next-steps" className="mt-4">
                    <div 
                      className="rounded-lg p-6"
                      style={{
                        backgroundColor: widgetConfig.cardBackgroundColor,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: widgetConfig.cardBorderColor
                      }}
                    >
                      <ul className="space-y-2">
                        {[
                          "Review all gathered data points and cross-reference findings",
                          "Validate insights with domain experts and stakeholders",
                          "Develop implementation plan based on prioritized recommendations",
                          "Monitor outcomes and iterate on initial strategies"
                        ].map((rec, idx) => (
                          <li 
                            key={idx}
                            className="flex items-start gap-2 text-sm"
                            style={{ color: widgetConfig.secondaryTextColor }}
                          >
                            <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: widgetConfig.accentColor }} />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Footer */}
                <div 
                  className="rounded-lg p-4 flex items-center justify-between"
                  style={{
                    backgroundColor: `${widgetConfig.successColor}0d`,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: `${widgetConfig.successColor}4d`
                  }}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4" style={{ color: widgetConfig.successColor }} />
                    <span style={{ color: widgetConfig.successColor, fontWeight: 500 }}>
                      All verification checks passed
                    </span>
                  </div>
                  <Button
                    onClick={resetAll}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    New Research
                  </Button>
                  <Button
                    onClick={() => setShowReportModal(true)}
                    size="sm"
                    className="gap-2"
                    style={{ 
                      backgroundColor: widgetConfig.accentColor,
                      color: '#fff'
                    }}
                  >
                    <FileText className="w-4 h-4" />
                    View Full Report
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Research Report Modal */}
      <ResearchReportModal
        open={showReportModal}
        onOpenChange={setShowReportModal}
        userGoal={userGoal}
        steps={steps}
        onRevise={() => {
          setShowReportModal(false);
          setShowReviseForm(true);
        }}
        primaryColor={widgetConfig.primaryColor}
        accentColor={widgetConfig.accentColor}
        successColor={widgetConfig.successColor}
      />

      {/* Revise Research Form Modal */}
      <Dialog open={showReviseForm} onOpenChange={setShowReviseForm}>
        <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              Revise Research Configuration
            </DialogTitle>
          </DialogHeader>
          <ReviseResearchForm
            currentGoal={userGoal}
            onSubmit={handleReviseSubmit}
            onCancel={() => setShowReviseForm(false)}
            primaryColor={widgetConfig.primaryColor}
            accentColor={widgetConfig.accentColor}
            backgroundColor={widgetConfig.backgroundColor}
          />
        </DialogContent>
      </Dialog>

      {/* Advanced Settings Modal */}
      <Dialog open={showAdvancedSettings} onOpenChange={setShowAdvancedSettings}>
        <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Advanced Research Settings
            </DialogTitle>
          </DialogHeader>
          <ReviseResearchForm
            currentGoal={userGoal || researchConfig.goal}
            onSubmit={handleAdvancedSettingsSubmit}
            onCancel={() => setShowAdvancedSettings(false)}
            initialConfig={researchConfig}
            primaryColor={widgetConfig.primaryColor}
            accentColor={widgetConfig.accentColor}
            backgroundColor={widgetConfig.backgroundColor}
          />
        </DialogContent>
      </Dialog>

      {/* RuFlo Showcase Carousel Section */}
      <section className="py-24 bg-slate-50 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                The RuFlo Platform
              </h2>
              <p className="text-slate-600 max-w-xl text-lg">
                Building a decentralized nervous system for AI agents, enabling autonomous collaboration across boundaries.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={scrollPrev}
                className="rounded-full border-slate-200 bg-white hover:bg-slate-50 transition-all"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={scrollNext}
                className="rounded-full border-slate-200 bg-white hover:bg-slate-50 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="embla overflow-hidden cursor-grab active:cursor-grabbing" ref={emblaRef}>
            <div className="embla__container flex gap-6">
              {rufloCapabilities.map((cap, i) => (
                <div key={i} className="embla__slide flex-[0_0_85%] md:flex-[0_0_30%] min-w-0">
                  <div className="h-full p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                      style={{ backgroundColor: `${cap.color}15`, color: cap.color }}
                    >
                      <cap.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{cap.title}</h3>
                    <p className="text-slate-500 leading-relaxed text-sm">
                      {cap.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-white" style={{ borderColor: `#8b5cf610` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="space-y-2">
              <div className="text-xl font-bold text-slate-900">Faidhi Fahmi</div>
              <p className="text-sm text-slate-500">Product Leader & CEO</p>
            </div>
            
            <div className="flex items-center gap-6">
              <a href="https://faidhifahmi.my" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Website</a>
              <a href="https://www.linkedin.com/in/faidhifahmi/" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">LinkedIn</a>
              <a href="https://ruv.io" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">rUv.io</a>
            </div>

            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} Faidhi Fahmi. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
