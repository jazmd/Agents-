import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { extractFirstJsonObject, geminiGenerateText, normalizeGeminiModel } from "../_shared/gemini.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResearchConfig {
  researchGuidance?: {
    focusAreas: string[];
    excludeTopics: string[];
    depth: "surface" | "moderate" | "deep";
    perspective: string;
    timeframe: string;
  };
  prompts?: {
    systemPrompt: string;
    searchQueryTemplate: string;
    analysisPrompt: string;
    synthesisPrompt: string;
  };
  parameters?: {
    maxSources: number;
    minConfidence: number;
    maxSteps: number;
    parallelAgents: number;
    timeout: number;
  };
  filters?: {
    dateRange: string;
    sourceTypes: string[];
    languages: string[];
    excludeDomains: string[];
  };
}

interface ResearchRequest {
  goal: string;
  stepTitle: string;
  stepDescription: string;
  stepType: string;
  aiModel?: string;
  config?: ResearchConfig;
  previousStepsData?: Array<{
    stepTitle: string;
    data: ResearchDataItem[];
  }>;
}

interface ResearchDataItem {
  id: string;
  title: string;
  content: string;
  source?: string;
  confidence?: number;
  timestamp: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { goal, stepTitle, stepDescription, stepType, aiModel, config, previousStepsData }: ResearchRequest = await req.json();
    
    console.log('Research request:', { 
      goal, 
      stepTitle, 
      stepDescription, 
      stepType, 
      aiModel, 
      previousStepsCount: previousStepsData?.length || 0,
      configProvided: !!config,
      depth: config?.researchGuidance?.depth,
      perspective: config?.researchGuidance?.perspective,
      focusAreas: config?.researchGuidance?.focusAreas?.length || 0
    });

    // Use custom system prompt if provided, otherwise use default
    const defaultSystemPrompt = `You are a senior research analyst with expertise in conducting comprehensive research and generating substantive findings.

CRITICAL INSTRUCTIONS:
- You MUST provide ACTUAL research findings, not task descriptions
- Include specific data points, statistics, percentages, and numbers
- Reference real-world developments, breakthroughs, or trends
- Provide concrete examples, case studies, or citations
- Generate findings as if you just completed real research

BAD EXAMPLE (task description): "Analyze quantum computing developments"
GOOD EXAMPLE (actual finding): "Google's Willow quantum chip achieved breakthrough in quantum error correction using surface codes with 99.9% fidelity (Nature Physics, Dec 2024), reducing error rates by 50% compared to previous generation."

BAD EXAMPLE: "Identify market opportunities"  
GOOD EXAMPLE: "Quantum computing market projected to reach $125B by 2030 (McKinsey, 2024), with pharmaceutical simulation representing 38% of near-term revenue. Key opportunity: NISQ algorithms for drug discovery showing 10x speedup over classical methods."

Your findings must be SPECIFIC, DETAILED, and SUBSTANTIVE.`;

    // Apply research depth modifier
    const depthModifier = config?.researchGuidance?.depth === 'deep' 
      ? '\n\nDEPTH: Provide comprehensive, in-depth analysis with extensive details, multiple examples, and thorough exploration of nuances (7-10 sentences per finding).'
      : config?.researchGuidance?.depth === 'surface'
      ? '\n\nDEPTH: Provide concise, high-level overview with key points only (2-3 sentences per finding).'
      : '\n\nDEPTH: Provide balanced analysis with solid detail and examples (4-5 sentences per finding).';
    
    // Apply perspective modifier
    const perspectiveModifier = config?.researchGuidance?.perspective 
      ? `\n\nPERSPECTIVE: Approach this research from a ${config.researchGuidance.perspective} perspective, focusing on relevant aspects for that viewpoint.`
      : '';

    // Apply focus areas guidance
    const focusAreasModifier = config?.researchGuidance?.focusAreas && config.researchGuidance.focusAreas.length > 0
      ? `\n\nFOCUS AREAS: Emphasize these specific topics: ${config.researchGuidance.focusAreas.join(', ')}`
      : '';

    // Apply exclude topics guidance  
    const excludeTopicsModifier = config?.researchGuidance?.excludeTopics && config.researchGuidance.excludeTopics.length > 0
      ? `\n\nEXCLUDE: Do NOT include information about: ${config.researchGuidance.excludeTopics.join(', ')}`
      : '';

    const systemPrompt = (config?.prompts?.systemPrompt || defaultSystemPrompt) 
      + depthModifier 
      + perspectiveModifier 
      + focusAreasModifier
      + excludeTopicsModifier;
    
    // Build context from previous steps
    let previousContext = '';
    if (previousStepsData && previousStepsData.length > 0) {
      previousContext = '\n\nPREVIOUS RESEARCH FINDINGS (build upon these):\n';
      previousStepsData.forEach((step, idx) => {
        previousContext += `\n${step.stepTitle}:\n`;
        step.data.forEach((item) => {
          previousContext += `• ${item.title}: ${item.content}\n`;
        });
      });
      previousContext += '\n**Your findings must reference and extend these previous discoveries.**\n';
    }
    
    // Special handling for final report - provide answer-focused synthesis
    const isFinalReport = stepType === "final-report";
    
    const userPrompt = isFinalReport ? `
RESEARCH GOAL: ${goal}
${previousContext}

Based on ALL the research findings above, generate 3-5 SPECIFIC, ACTIONABLE RECOMMENDATIONS that directly answer the research goal.

CRITICAL: Your response must ANSWER THE QUESTION, not just summarize research steps.

For example, if the goal is "best family car in 2025 ontario canada":
- BAD: "Analysis of search queries shows SUV dominance"
- GOOD: "Honda CR-V Hybrid 2025 - Best Overall Family SUV for Ontario. Offers AWD for winter driving, 40 MPG fuel efficiency, and excellent safety ratings (IIHS Top Safety Pick+). Price: $38,000 CAD. Resale value after 5 years: 65% (highest in class)."

Each recommendation MUST include:

1. **title**: Specific recommendation or answer (not a task or analysis description)
   - If recommending a product: Include model name/year
   - If recommending an action: State the specific action
   - If answering a question: Provide the direct answer
   - Examples: "2025 Toyota Sienna Hybrid - Best Family Minivan", "Implement Zero-Trust Architecture with Cloudflare Access", "Yes, quantum computing is commercially viable for drug discovery"

2. **content**: DETAILED justification with specifics (minimum 5-6 sentences):
   - WHY this recommendation answers the goal
   - SPECIFIC data from research findings (reference previous steps)
   - Key benefits with quantified metrics
   - Practical considerations or trade-offs
   - Supporting evidence from research
   - Examples:
     * "The 2025 Toyota Sienna Hybrid dominates the minivan segment in Ontario based on multiple criteria from our research. It features AWD (critical for Ontario winters per our State Assessment findings), achieving 36 MPG combined fuel economy which translates to approximately $1,200 annual fuel savings vs non-hybrid competitors. Safety analysis revealed it earned IIHS Top Safety Pick+ with standard Toyota Safety Sense 3.0. Our Document Analysis phase identified its superior reliability rating (4.5/5 Consumer Reports) and strongest resale value in class at 58% after 5 years. Starting MSRP of $42,500 CAD positions it competitively while our Web Search findings show average dealer discounts of $2,000 in Ontario markets."

3. **source**: Real source from research OR credible industry source
   - Reference findings from previous research steps when applicable
   - Examples: "Web Search findings + Consumer Reports 2024", "Document Analysis + edmunds.com", "Knowledge Synthesis + Motor Trend 2025 Buyer's Guide"

4. **confidence**: 0.80-0.95 based on research depth

REMEMBER: The user wants ANSWERS, not research summaries. Be specific, actionable, and directly address their goal.

Format:
{
  "title": "Specific Recommendation/Answer [directly addressing ${goal}]",
  "content": "Detailed justification with data from research findings, benefits, metrics, and practical advice...",
  "source": "Source from research OR industry authority (Year)",
  "confidence": 0.88
}` : `
RESEARCH GOAL: ${goal}
CURRENT ANALYSIS STEP: ${stepTitle}
STEP OBJECTIVE: ${stepDescription}
${previousContext}

Generate ${config?.parameters?.maxSources ? `up to ${config.parameters.maxSources}` : '3-5'} ACTUAL research findings with substantive content. Each finding MUST include:

1. **title**: Specific discovery or insight (what was found, not what to find)
   - Include key metrics, names, or breakthrough details in the title
   - Examples: "IBM's 433-Qubit Osprey Processor Achieves Quantum Advantage", "87% of Fortune 500 Investing in AI Infrastructure"

2. **content**: DETAILED research findings (${config?.researchGuidance?.depth === 'deep' ? '7-10 sentences' : config?.researchGuidance?.depth === 'surface' ? '2-3 sentences' : '4-5 sentences'} minimum):
   - Start with the core finding and supporting data
   - Include specific numbers, percentages, or metrics
   - Mention real companies, technologies, or research when relevant
   - Explain implications and significance
   - Reference previous step findings to show progression
   - Examples:
     * "IBM's latest 433-qubit Osprey processor demonstrated quantum advantage in solving optimization problems 120x faster than classical supercomputers (IBM Research, Nov 2024). The system achieved 99.7% two-qubit gate fidelity using dynamic error suppression. This breakthrough enables practical applications in logistics optimization, with DHL reporting 15% cost reduction in route planning trials. The technology utilizes heavy-hexagonal qubit topology for improved connectivity."
     * "Analysis of 156 quantum computing research papers (2023-2024) reveals strong consensus on topological qubits as the most promising path to fault-tolerant quantum computing. Current limitations include decoherence times averaging 85 microseconds and error rates of 0.1% for two-qubit gates. Leading institutions (Google, IBM, IonQ) are converging on surface code implementations, with projections suggesting 1000+ logical qubit systems by 2027."

3. **source**: REQUIRED - Credible source with year (MUST be provided for every finding)
   - Examples: "Nature Physics (2024)", "McKinsey Quantum Report 2024", "IEEE Quantum Computing Survey (Dec 2024)"
   - Use Google Search grounding to find real sources
   - ${config?.filters?.sourceTypes && config.filters.sourceTypes.length > 0 
      ? `Prioritize these source types: ${config.filters.sourceTypes.join(', ')}` 
      : 'If no specific source available, use: "Industry Analysis (2024)" or "Market Research (2024)"'}
   - ${config?.filters?.excludeDomains && config.filters.excludeDomains.length > 0
      ? `DO NOT use sources from these domains: ${config.filters.excludeDomains.join(', ')}`
      : ''}

4. **confidence**: REQUIRED - Realistic score ${config?.parameters?.minConfidence ? `${config.parameters.minConfidence / 100}-0.95` : '0.7-0.95'} based on finding specificity

CRITICAL REQUIREMENTS:
- DO NOT generate generic task descriptions like "Analyze X" or "Identify Y"
- Generate ACTUAL findings as if research was just completed, with real data and insights
- EVERY finding MUST have a source citation - this is non-negotiable
- Use Google Search results to find real, current information specific to the query
- ONLY include information that is directly relevant to: "${goal || stepTitle}"
- DO NOT include unrelated topics (e.g., quantum computing when researching marketing trends)
- Verify each finding relates to the actual research goal before including it
${config?.filters?.dateRange ? `\n- Focus on information from: ${config.filters.dateRange}` : ''}

IMPORTANT: Every finding MUST:
1. Be directly relevant to the research goal: "${goal || stepTitle}"
2. Include a source citation from Google Search results
3. Contain current, verifiable information
4. ${config?.parameters?.minConfidence ? `Meet minimum confidence threshold of ${config.parameters.minConfidence}%` : 'Have realistic confidence score'}

Format (all fields required):
{
  "title": "Specific Finding with Key Metric [directly related to ${goal || stepTitle}]",
  "content": "Detailed research findings with data, examples, implications...",
  "source": "Source Name (Year)", // REQUIRED - NEVER omit this
  "confidence": ${config?.parameters?.minConfidence ? (config.parameters.minConfidence / 100) : 0.85} // REQUIRED - Must be between ${config?.parameters?.minConfidence ? `${config.parameters.minConfidence / 100}` : '0.7'} and 0.95
}`;

    // Gemini API cannot guarantee web grounding; require sources when known, otherwise use "Unknown".
    const jsonInstruction =
      `\n\nReturn ONLY valid JSON (no markdown, no commentary).` +
      ` Shape: {"items":[{"title":string,"content":string,"source":string,"confidence":number}]}` +
      ` (confidence must be between ${config?.parameters?.minConfidence ? `${config.parameters.minConfidence / 100}` : "0.7"} and 0.95).` +
      ` If you don't know an exact source, set source to "Unknown" and reduce confidence.`;

    const text = await geminiGenerateText({
      system: systemPrompt,
      user: `${userPrompt}${jsonInstruction}`,
      model: normalizeGeminiModel(aiModel),
      temperature: 0.7,
      maxOutputTokens: 4096,
    });

    const parsed = extractFirstJsonObject(text) as any;
    const researchItems = Array.isArray(parsed) ? parsed : parsed?.items;
    if (!Array.isArray(researchItems)) throw new Error("Model did not return items[]");

    const formattedData: ResearchDataItem[] = researchItems.map((item: any, index: number) => {
      return {
        id: `${stepType}-${Date.now()}-${index}`,
        title: item.title,
        content: item.content,
        source: item.source || 'Research Analysis',
        confidence: item.confidence || undefined,
        timestamp: new Date().toISOString(),
      };
    });

    console.log('Formatted research data with citations:', formattedData);

    return new Response(JSON.stringify(formattedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in research-step function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: 'Failed to generate research data'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
