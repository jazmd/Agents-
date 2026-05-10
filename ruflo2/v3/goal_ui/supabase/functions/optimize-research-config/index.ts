import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { extractFirstJsonObject, geminiGenerateText } from "../_shared/gemini.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OptimizeConfigRequest {
  preset: string;
  currentGoal?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { preset, currentGoal }: OptimizeConfigRequest = await req.json();
    
    console.log('Optimize config request:', { preset, currentGoal });

    const systemPrompt = `You are an expert research workflow architect specializing in GOAP (Goal-Oriented Action Planning) configuration optimization.

Generate optimized research configuration settings based on the given preset/objective. Your configuration should maximize research effectiveness for the specific use case.

Consider:
- Research depth appropriate for the objective
- Source types and quality thresholds matching the domain
- Execution parameters balancing speed and thoroughness
- Perspective and focus areas relevant to the preset
- GOAP settings for optimal planning and replanning

Be specific and practical - these settings will directly control AI research behavior.`;

    const presetPrompts: Record<string, string> = {
      'academic-deep': `Optimize for: Academic/Scientific Deep Research
      - Maximum depth and rigor
      - Academic and peer-reviewed sources prioritized
      - High confidence thresholds (90%+)
      - Comprehensive analysis with extensive cross-referencing
      - Focus: Methodology, citations, reproducibility
      - Timeframe: Include seminal works, not just recent
      Goal: ${currentGoal || 'Scientific research with publication-grade rigor'}`,

      'industry-quick': `Optimize for: Industry Quick Scan
      - Speed and actionable insights prioritized
      - Industry reports, market data, business sources
      - Moderate confidence acceptable (75%+)
      - Surface to moderate depth
      - Focus: Practical applications, ROI, trends
      - Timeframe: Recent only (past 6-12 months)
      Goal: ${currentGoal || 'Fast industry insights for business decisions'}`,

      'competitive-analysis': `Optimize for: Competitive Intelligence & Analysis
      - Comprehensive competitor research
      - Industry reports, news, company filings, social media
      - Focus: Market positioning, strategies, strengths/weaknesses
      - Moderate to deep depth
      - Business and strategic perspective
      - Parallel execution for multiple competitors
      Goal: ${currentGoal || 'Competitive landscape analysis'}`,

      'technical-feasibility': `Optimize for: Technical Feasibility Study
      - Technical and engineering focus
      - Academic papers, technical documentation, GitHub
      - Deep analysis of implementation details
      - Focus: Architecture, performance, limitations, trade-offs
      - High confidence for technical claims (85%+)
      - Technical perspective with practical considerations
      Goal: ${currentGoal || 'Technical implementation feasibility assessment'}`,

      'market-trends': `Optimize for: Market Trends & Predictions
      - Trend analysis and future predictions
      - Industry reports, market research, financial data
      - Focus: Growth patterns, emerging opportunities, disruptions
      - Moderate depth with broad coverage
      - Business and analytical perspective
      - Recent timeframe with historical context
      Goal: ${currentGoal || 'Market trend analysis and forecasting'}`,

      'medical-clinical': `Optimize for: Medical/Clinical Research
      - Medical journals, clinical trials, PubMed prioritized
      - Very high confidence required (90%+)
      - Deep analysis with safety/efficacy focus
      - Focus: Clinical evidence, patient outcomes, safety profiles
      - Academic and clinical perspective
      - Exclude non-peer-reviewed sources
      Goal: ${currentGoal || 'Clinical research with evidence-based analysis'}`,

      'startup-validation': `Optimize for: Startup/Business Idea Validation
      - Market size, competition, customer needs
      - Industry reports, surveys, competitor analysis
      - Practical and business perspective
      - Focus: Market gaps, validation metrics, go-to-market
      - Moderate depth, broad coverage
      - Cost-effective with parallel research
      Goal: ${currentGoal || 'Startup idea validation and market assessment'}`,

      'policy-regulatory': `Optimize for: Policy & Regulatory Research
      - Government sources, legal documents, policy papers
      - High accuracy and recency critical
      - Focus: Compliance, legal frameworks, regulatory trends
      - Deep analysis with risk assessment
      - Academic and legal perspective
      - Exclude opinion pieces, prioritize official sources
      Goal: ${currentGoal || 'Policy and regulatory compliance research'}`
    };

    const userPrompt = presetPrompts[preset.toLowerCase()] || `Optimize research settings for: ${preset}. Goal: ${currentGoal || 'general research'}`;

    const jsonInstruction =
      `\n\nReturn ONLY valid JSON (no markdown, no commentary).` +
      ` The JSON must match this shape:\n` +
      `{\n` +
      `  "researchGuidance": {"focusAreas": string[], "excludeTopics": string[], "depth": "surface"|"moderate"|"deep", "perspective": string, "timeframe": string},\n` +
      `  "prompts": {"systemPrompt": string},\n` +
      `  "parameters": {"maxSources": number, "minConfidence": number, "maxSteps": number, "parallelAgents": number, "timeout": number},\n` +
      `  "filters": {"dateRange": string, "sourceTypes": string[], "languages": string[], "excludeDomains": string[]},\n` +
      `  "goapConfig": {"executionMode": "focused"|"closed"|"open", "enableReplanning": boolean, "costOptimization": boolean, "parallelExecution": boolean}\n` +
      `}\n`;

    const text = await geminiGenerateText({
      system: systemPrompt,
      user: `${userPrompt}${jsonInstruction}`,
      model: "gemini-2.5-flash",
      temperature: 0.4,
      maxOutputTokens: 2048,
    });

    const parsed = extractFirstJsonObject(text) as any;
    const config = parsed?.config ?? parsed;
    console.log('Generated optimized config:', config);

    return new Response(JSON.stringify({ config }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in optimize-research-config function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: 'Failed to optimize research configuration'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
