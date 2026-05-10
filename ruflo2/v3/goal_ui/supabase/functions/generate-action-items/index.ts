import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { extractFirstJsonObject, geminiGenerateText } from "../_shared/gemini.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ActionItemsRequest {
  goal: string;
  researchContext: Array<{
    stepTitle: string;
    findings: Array<{
      title: string;
      content: string;
      source?: string;
    }>;
  }>;
  totalSteps: number;
  totalDataPoints: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { goal, researchContext, totalSteps, totalDataPoints }: ActionItemsRequest = await req.json();
    
    console.log('Generating action items for goal:', goal);

    // Build research summary from all steps
    let researchSummary = '';
    researchContext.forEach(step => {
      researchSummary += `\n${step.stepTitle}:\n`;
      step.findings.forEach(finding => {
        researchSummary += `• ${finding.title}: ${finding.content}\n`;
        if (finding.source) researchSummary += `  Source: ${finding.source}\n`;
      });
    });

    const systemPrompt = `You are an expert strategic planner and implementation consultant. Generate contextual, actionable recommendations based on research findings.

CRITICAL INSTRUCTIONS:
- Generate action items that are DIRECTLY RELEVANT to the research goal
- Base recommendations on ACTUAL research findings provided
- Do NOT use generic "pilot program" or "scale to production" templates unless they make sense for this specific goal
- Tailor action items to the domain and context of the research
- Include specific, actionable steps with realistic timelines and resources

For example:
- If researching "best family car" → recommend specific car models, comparison steps, test drives
- If researching "law school alternatives" → recommend specific programs, application steps, bar exam prep
- If researching "quantum computing" → recommend learning paths, tools, research papers
- If researching business strategies → recommend market analysis, competitor research, implementation plans`;

    const userPrompt = `
RESEARCH GOAL: ${goal}

RESEARCH FINDINGS (${totalSteps} steps, ${totalDataPoints} data points):
${researchSummary}

Generate 3-4 CONTEXTUAL action items that directly help achieve or implement the research goal based on these findings.

REQUIREMENTS:
1. Each action item must be SPECIFIC to "${goal}" - not generic project management steps
2. Reference actual research findings in the description
3. Provide realistic timelines appropriate for the goal (not always "Week 1-4")
4. Include relevant resources and metrics for this specific domain
5. Identify domain-specific risks and mitigation strategies

Also generate a comprehensive 2-3 paragraph executive summary that:
- Directly addresses what was learned about "${goal}"
- Highlights the most important findings with specifics
- Provides clear conclusions and recommendations based on the research

Format:
{
  "actionItems": [
    {
      "id": "1",
      "title": "Specific action relevant to ${goal}",
      "description": "Detailed description referencing actual research findings...",
      "timeline": "Appropriate timeline (e.g., '1-2 weeks', '3 months', 'Immediately')",
      "timelineDetails": "Breakdown of timeline phases",
      "priority": "High" | "Medium" | "Low",
      "resources": {
        "budget": "Realistic budget if applicable, or 'Minimal cost' or 'Research only'",
        "team": "Required people/roles",
        "tools": ["Domain-specific tools/resources"]
      },
      "metrics": ["Specific success metrics for this action"],
      "risks": [
        {
          "risk": "Domain-specific risk",
          "mitigation": "Realistic mitigation strategy"
        }
      ],
      "references": [
        { "title": "Relevant resource", "url": "URL if applicable" }
      ],
      "researchContext": "How this connects to research findings"
    }
  ],
  "summary": "Comprehensive 2-3 paragraph executive summary addressing the research goal with specific findings and recommendations..."
}`;

    const jsonInstruction =
      `\n\nReturn ONLY valid JSON in this exact shape (no markdown):\n` +
      `{"actionItems":[{"id":"1","title":"...","description":"...","timeline":"...","timelineDetails":"...","priority":"High|Medium|Low","resources":{"budget":"...","team":"...","tools":["..."]},"metrics":["..."],"risks":[{"risk":"...","mitigation":"..."}],"references":[{"title":"...","url":"..."}],"researchContext":"..."}],"summary":"..."}\n`;

    const prompt = `${userPrompt}${jsonInstruction}`;
    const attemptGenerate = async (temperature: number) =>
      geminiGenerateText({
        system: systemPrompt,
        user: prompt,
        model: "gemini-2.5-flash",
        temperature,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      });

    let result: any;
    try {
      const text = await attemptGenerate(0.6);
      result = extractFirstJsonObject(text) as any;
    } catch (e1) {
      // Retry once with deterministic settings and an explicit JSON-only reminder.
      const text2 = await geminiGenerateText({
        system: systemPrompt,
        user:
          `${prompt}\n\nIMPORTANT: Respond with ONLY valid JSON (no markdown, no prose). Start with '{' and end with '}'.`,
        model: "gemini-2.5-flash",
        temperature: 0,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      });
      result = extractFirstJsonObject(text2) as any;
    }
    
    console.log('Generated action items:', result.actionItems?.length || 0);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-action-items function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
