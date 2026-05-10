import {
  Brain,
  CheckCircle2,
  Database,
  FileSearch,
  FileText,
  Filter,
  GitBranch,
  Lightbulb,
  Link,
  Search,
  Shield,
  Target,
  TrendingUp,
  Workflow,
  Zap,
} from "lucide-react";

import { parseGoal, type Action, type WorldState } from "@/lib/goapPlanner";

export function createResearchWorldStates(): { currentState: WorldState; goalState: WorldState } {
  const currentState: WorldState = {
    goalDefined: true,
    goalParsed: false,
    stateAssessed: false,
    informationGathered: false,
    documentsAnalyzed: false,
    knowledgeSynthesized: false,
    insightsGenerated: false,
    verified: false,
  };

  const goalState: WorldState = {
    goalDefined: true,
    goalParsed: true,
    stateAssessed: true,
    informationGathered: true,
    documentsAnalyzed: true,
    knowledgeSynthesized: true,
    insightsGenerated: true,
    verified: true,
  };

  return { currentState, goalState };
}

export function createResearchGOAPActions(goal: string): Action[] {
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
        status: "pending",
        data: [
          {
            text: "Parse objective",
            icon: FileText,
            details: {
              objective: "Extract and structure the high-level goal from natural language input",
              preconditions: ["User input received", "NLP module initialized"],
              effects: ["Structured goal object created", "Sub-goals identified"],
              agents: ["Parser Agent", "NLP Agent"],
            },
          },
          {
            text: "Identify dependencies",
            icon: Link,
            details: {
              objective: "Map relationships between actions and their requirements",
              preconditions: ["Goal parsed", "Action library loaded"],
              effects: ["Dependency graph generated", "Critical path identified"],
              agents: ["Dependency Analyzer", "Graph Builder"],
              sources: ["Action Registry", "State Definitions"],
            },
          },
          {
            text: "Map state transitions",
            icon: Workflow,
            details: {
              objective: "Define how each action transforms the world state",
              preconditions: ["Dependencies mapped", "State space defined"],
              effects: ["Transition matrix created", "State reachability confirmed"],
              agents: ["State Mapper", "Validator Agent"],
              citations: ["GOAP: Goal-Oriented Action Planning - Orkin, J. (2006)"],
            },
          },
        ],
        metrics: [
          { label: "Sub-goals", value: "3" },
          { label: "Actions", value: "7" },
        ],
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
        status: "pending",
        data: [
          {
            text: "Assessing current state...",
            icon: Database,
            details: {
              objective: `Assess current knowledge and capability state for ${goal}`,
              effects: ["Baseline established", "Gaps identified"],
              agents: ["State Assessor"],
            },
          },
          {
            text: "Defining success criteria...",
            icon: CheckCircle2,
            details: {
              objective: `Define success criteria and validation requirements for ${domain}`,
              preconditions: ["Goals defined"],
              effects: ["Validation criteria set", "Acceptance tests defined"],
            },
          },
          {
            text: "Analyzing gaps...",
            icon: TrendingUp,
            details: {
              objective: `Quantify differences between current and target state for ${action} in ${domain}`,
              effects: ["Priority list generated", "Resource needs identified"],
              agents: ["Gap Analyzer", "Priority Ranker"],
            },
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
        status: "pending",
        data: [
          {
            text: `Searching for ${action} ${keywords[0] || "methods"}...`,
            icon: Search,
            details: {
              objective: `Execute targeted web searches for ${goal}`,
              sources: ["arXiv.org", "Google Scholar", "ACM Digital Library"],
              agents: ["Search Agent", "Query Optimizer"],
            },
          },
          {
            text: "Gathering sources...",
            icon: Database,
            details: {
              objective: `Aggregate and catalog information sources for ${domain}`,
              effects: ["Source database populated", "Relevance scores assigned"],
            },
          },
          {
            text: "Calculating relevance...",
            icon: TrendingUp,
            details: {
              objective: `Calculate information quality and applicability metrics for ${keywordStr}`,
              agents: ["Relevance Scorer", "ML Classifier"],
              citations: ["Information Retrieval Metrics - Manning et al."],
            },
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
        status: "pending",
        data: [
          {
            text: "Parsing documents...",
            icon: FileText,
            details: {
              objective: `Extract structured data from ${domain} documents for ${goal}`,
              preconditions: ["Documents retrieved", "Parser modules loaded"],
              effects: ["Content extracted", "Metadata catalogued"],
              agents: ["Document Parser", "Text Extractor"],
              sources: ["PDF Parser", "HTML Scraper", "API Responses"],
            },
          },
          {
            text: "Extracting insights...",
            icon: Lightbulb,
            details: {
              objective: `Identify key findings about ${keywordStr}`,
              preconditions: ["Documents parsed", "NLP models ready"],
              effects: ["Insights database populated", "Key points highlighted"],
              agents: ["Insight Extractor", "NLP Analyzer", "Pattern Recognizer"],
              citations: ["Named Entity Recognition - Nadeau & Sekine"],
            },
          },
          {
            text: "Validating claims...",
            icon: Shield,
            details: {
              objective: `Verify factual accuracy for ${action} in ${domain}`,
              preconditions: ["Insights extracted", "Validation rules defined"],
              effects: ["Accuracy scores assigned", "Unreliable sources flagged"],
              agents: ["Fact Checker", "Source Validator", "Cross-Referencer"],
              sources: ["Fact-checking APIs", "Citation Databases"],
            },
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
        status: "pending",
        data: [
          {
            text: "Cross-referencing sources...",
            icon: Link,
            details: {
              objective: `Correlate ${domain} information across multiple sources for ${goal}`,
              preconditions: ["Multiple sources validated", "Correlation rules set"],
              effects: ["Source connections mapped", "Confidence levels adjusted"],
              agents: ["Cross-Referencer", "Correlation Analyzer"],
              sources: ["Academic papers", "Industry reports", "Technical documentation"],
            },
          },
          {
            text: "Merging concepts...",
            icon: GitBranch,
            details: {
              objective: `Combine ${keywordStr} concepts into unified knowledge structures`,
              preconditions: ["Concepts identified", "Relationships defined"],
              effects: ["Knowledge graph updated", "Concept taxonomy refined"],
              agents: ["Concept Merger", "Ontology Builder", "Semantic Analyzer"],
              citations: ["Knowledge Graphs - Hogan et al. (2021)"],
            },
          },
          {
            text: "Resolving conflicts...",
            icon: CheckCircle2,
            details: {
              objective: `Handle contradictory information about ${action} in ${domain}`,
              preconditions: ["Conflicts detected", "Resolution strategies loaded"],
              effects: ["Consensus reached", "Conflict resolution logged"],
              agents: ["Conflict Resolver", "Evidence Weigher", "Decision Maker"],
              sources: ["Source credibility scores", "Temporal data", "Expert systems"],
            },
          },
        ],
        metrics: [
          { label: "Sources", value: "18" },
          { label: "Concepts", value: "12" },
        ],
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
        status: "pending",
        data: [
          {
            text: "Generating insights...",
            icon: Zap,
            details: {
              objective: `Create novel conclusions from synthesized ${domain} knowledge for ${goal}`,
              preconditions: ["Knowledge synthesized", "Analysis complete"],
              effects: ["Actionable insights created", "Recommendations formulated"],
              agents: ["Insight Generator", "Recommendation Engine", "Inference Agent"],
              citations: ["Automated Reasoning - Robinson (1965)", "AI Planning - Ghallab et al."],
            },
          },
          {
            text: "Prioritizing by impact...",
            icon: TrendingUp,
            details: {
              objective: `Rank insights about ${keywordStr} by potential value and applicability`,
              preconditions: ["Insights generated", "Impact metrics defined"],
              effects: ["Priority scores assigned", "Implementation order set"],
              agents: ["Priority Ranker", "Impact Analyzer", "ROI Calculator"],
              sources: ["Business metrics", "Historical outcomes", "Expert heuristics"],
            },
          },
          {
            text: "Validating feasibility...",
            icon: CheckCircle2,
            details: {
              objective: `Assess practicality of ${action} recommendations for ${domain}`,
              preconditions: ["Insights prioritized", "Constraint database available"],
              effects: ["Feasibility scores computed", "Resource needs estimated"],
              agents: ["Feasibility Validator", "Resource Planner", "Constraint Checker"],
              sources: ["Available resources", "Technical constraints", "Timeline requirements"],
            },
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
        status: "pending",
        data: [
          {
            text: "Verifying insights...",
            icon: Shield,
            details: {
              objective: `Perform final quality assurance on ${domain} insights for ${goal}`,
              preconditions: ["Insights validated", "Verification criteria set"],
              effects: ["Quality confirmed", "Errors corrected"],
              agents: ["Quality Assurance Agent", "Verification Bot", "Audit Agent"],
              sources: ["Quality standards", "Best practices", "Validation protocols"],
            },
          },
          {
            text: "Checking sources...",
            icon: Filter,
            details: {
              objective: `Re-validate all ${keywordStr} information sources for final output`,
              preconditions: ["Sources catalogued", "Verification complete"],
              effects: ["Source reliability confirmed", "Citations verified"],
              agents: ["Source Checker", "Citation Validator", "Provenance Tracker"],
              citations: ["Information Provenance - Buneman et al. (2001)"],
            },
          },
          {
            text: "Calculating confidence...",
            icon: TrendingUp,
            details: {
              objective: `Calculate overall confidence in ${action} research findings`,
              preconditions: ["All checks complete", "Confidence model loaded"],
              effects: ["Final confidence score computed", "Report ready"],
              agents: ["Confidence Calculator", "Statistical Analyzer", "Meta-Evaluator"],
              sources: ["Validation results", "Source quality scores", "Cross-reference matches"],
            },
          },
        ],
        metrics: [],
      }),
    },
  ];
}

