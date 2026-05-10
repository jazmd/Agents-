import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { extractFirstJsonObject, geminiGenerateText } from "../_shared/gemini.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateGoalRequest {
  category: string;
  customContext?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category, customContext }: GenerateGoalRequest = await req.json();
    
    console.log('Generate research goal request:', { category, customContext });

    const systemPrompt = `You are an expert research consultant and futurist who helps formulate cutting-edge, innovative research objectives that push boundaries.

Generate 3 HIGHLY DIVERSE and NOVEL research goals for the given category. Each goal should be:
- Innovative and forward-thinking (explore emerging trends, novel applications, or unconventional angles)
- Specific and actionable (clear research direction, not vague exploration)
- Current and relevant to 2024-2025 cutting-edge developments
- Professionally articulated with compelling detail
- DIFFERENT from each other (vary the approach, scale, application, or methodology)
- Boundary-pushing (challenge conventional thinking, explore unexplored intersections)

CRITICAL: Generate VARIETY across the 3 goals by varying:
- Scale (micro vs macro, individual vs enterprise vs societal)
- Application domain (different industries, use cases, or contexts)
- Approach (technical implementation, business impact, ethical considerations, future predictions)
- Time horizon (near-term practical vs long-term transformative)

Examples of EXCELLENT diverse research goals for AI & ML:
1. "Investigate the emergence of spontaneous goal-formation in multi-agent reinforcement learning systems deployed in competitive market simulations, focusing on measuring agency, cooperation patterns, and alignment drift over 10,000+ iteration cycles"
2. "Analyze the ethical and regulatory frameworks needed for autonomous AI agents conducting financial trading with self-evolving risk strategies, examining liability models and human oversight mechanisms"
3. "Research hybrid neurosymbolic architectures that combine LLMs with symbolic reasoning engines to solve multi-step mathematical proofs, benchmarking against GPT-5 and human mathematicians"

Examples of POOR goals (too generic, not novel):
- "Study machine learning applications in healthcare"
- "Research neural network optimization techniques"
- "Investigate AI ethics and bias"

Push the boundaries. Be specific. Be innovative.`;

    const categoryPrompts: Record<string, string> = {
      'finance': 'Generate 3 cutting-edge, diverse research goals for finance. Vary across: (1) emerging technologies (crypto, DeFi, AI trading), (2) novel market mechanisms or regulations, (3) behavioral/psychological aspects or systemic risks. Include specific metrics, timeframes, or novel applications. Examples: algorithmic stablecoin mechanisms, neurofinance trading patterns, tokenized real estate liquidity.',
      
      'business': 'Generate 3 innovative, diverse research goals for business. Vary across: (1) emerging business models or platforms, (2) organizational transformation or culture, (3) data-driven decision making or automation. Be specific about industry, scale, and measurable outcomes. Examples: DAO governance for enterprises, AI-augmented strategic planning, remote-first organizational psychology.',
      
      'marketing': 'Generate 3 boundary-pushing, diverse research goals for marketing. Vary across: (1) emerging channels or technologies (AI, AR/VR, Web3), (2) behavioral science or psychology, (3) measurement or attribution innovation. Include specific platforms, demographics, or novel approaches. Examples: neuromarketing with eye-tracking AI, decentralized creator economies, predictive CLV using graph neural networks.',
      
      'medical': 'Generate 3 cutting-edge, diverse research goals for medical/healthcare. Vary across: (1) emerging diagnostic or treatment technologies, (2) healthcare delivery or access innovations, (3) personalized/precision medicine or AI applications. Be specific about conditions, populations, or technologies. Examples: AI-discovered antibiotics using protein folding, CRISPR germline editing ethics, digital therapeutics efficacy for mental health.',
      
      'education': 'Generate 3 innovative, diverse research goals for education. Vary across: (1) emerging pedagogical technologies (AI tutors, VR, adaptive learning), (2) learning science or cognitive research, (3) educational equity or accessibility. Include specific age groups, subjects, or measurable learning outcomes. Examples: AI-generated personalized curricula, VR historical immersion effectiveness, neuroplasticity-optimized learning schedules.',
      
      'technical': 'Generate 3 cutting-edge, diverse research goals for technical/engineering. Vary across: (1) emerging architectures or paradigms, (2) performance or efficiency breakthroughs, (3) security or reliability innovations. Be specific about technologies, metrics, or novel approaches. Examples: quantum-resistant cryptography migration paths, edge AI model compression techniques, chaos engineering for distributed systems.',
      
      'coding': 'Generate 3 innovative, diverse research goals for coding/software development. Vary across: (1) emerging languages, frameworks, or paradigms, (2) AI-assisted development or automation, (3) code quality, testing, or collaboration tools. Include specific technologies or measurable productivity gains. Examples: LLM-powered automated test generation, effect systems for safer concurrency, AI code review for security vulnerabilities.',
      
      'ai-ml': 'Generate 3 CUTTING-EDGE, diverse research goals for AI, Machine Learning, and Autonomous Agents. MUST vary across: (1) agentic AI systems (multi-agent coordination, autonomous decision-making, goal-seeking behavior, emergent agency), (2) novel architectures or training paradigms (neurosymbolic, multimodal fusion, self-improving systems), (3) real-world applications or societal implications (alignment, safety, ethics, transformative capabilities). Be SPECIFIC about agent behaviors, architectural innovations, or measurable capabilities. Push boundaries with novel intersections. Examples: "Measure spontaneous tool-use emergence in LLM agents given only raw API documentation", "Benchmark multi-agent negotiation protocols in adversarial trading environments with evolving objectives", "Investigate constitutional AI approaches for value alignment in self-modifying agent systems", "Analyze swarm intelligence patterns in distributed AI agents solving NP-hard optimization problems".',
      
      'custom': `Generate 3 innovative, boundary-pushing research goals based on: ${customContext || 'general cutting-edge research topics'}. Make them specific, actionable, and explore novel angles or unconventional applications.`
    };

    const userPrompt = categoryPrompts[category.toLowerCase()] || categoryPrompts['custom'];

    const jsonInstruction =
      `\n\nReturn ONLY valid JSON in this exact shape:\n` +
      `{"goals":["goal 1","goal 2","goal 3"]}\n` +
      `Rules:\n` +
      `- No markdown, no extra keys, no commentary.\n` +
      `- Each goal must be ONE sentence, <= 200 characters.\n` +
      `- Escape any quotes inside strings.\n`;

    const prompt = `${userPrompt}${jsonInstruction}`;
    const attemptGenerate = async (temperature: number) =>
      geminiGenerateText({
        system: systemPrompt,
        user: prompt,
        model: "gemini-2.5-flash",
        temperature,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      });

    let parsed: any;
    try {
      const text = await attemptGenerate(0.8);
      parsed = extractFirstJsonObject(text) as any;
    } catch (e1) {
      // Retry once with deterministic settings and an explicit JSON-only reminder.
      const text2 = await geminiGenerateText({
        system: systemPrompt,
        user:
          `${prompt}\n\nIMPORTANT: Respond with ONLY a single valid JSON object, starting with '{' and ending with '}'.`,
        model: "gemini-2.5-flash",
        temperature: 0,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      });
      parsed = extractFirstJsonObject(text2) as any;
    }

    const goals = Array.isArray(parsed?.goals) ? parsed.goals : [];
    if (goals.length !== 3) throw new Error("Model did not return exactly 3 goals");

    console.log('Generated goals:', goals);

    return new Response(JSON.stringify({ goals }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-research-goal function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: 'Failed to generate research goals'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
