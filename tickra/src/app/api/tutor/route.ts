import { NextResponse } from 'next/server';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { rateLimit, ipFrom } from '@/lib/rate-limit';
import { heuristicAnswer } from '@/lib/tutor/heuristic';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const SYSTEM_PROMPT = `You are the Tickra tutor — a careful, plain-language teacher of trading craft.
Rules you never break:
1. You never give trade recommendations, signals, entries, exits, or "should I buy/sell" answers.
2. You never promise future returns or describe any setup as guaranteed.
3. You stay grounded in the Tickra curriculum: candles, structure, patterns, indicators, risk, psychology, asset classes, strategy, execution.
4. You point the learner to specific lessons when relevant.
5. You answer in the user's locale (en or fr) and keep responses under 180 words unless asked otherwise.
6. If a question is off-topic (politics, personal finance advice, legal, taxes), you decline briefly and redirect to the curriculum.`;

async function askAnthropic(question: string, locale: Locale): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: SYSTEM_PROMPT + `\nLocale: ${locale}.`,
        messages: [{ role: 'user', content: question }],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: Array<{ type: string; text: string }> };
    const text = data.content?.find((c) => c.type === 'text')?.text;
    return text ?? null;
  } catch {
    return null;
  }
}

async function askOpenAI(question: string, locale: Locale): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 600,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + `\nLocale: ${locale}.` },
          { role: 'user', content: question },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const limit = rateLimit(`tutor:${ipFrom(req)}`, { limit: 30, windowMs: 60 * 60 * 1000 });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'rate_limit' }, { status: 429 });
  }

  const body = (await req.json().catch(() => ({}))) as { question?: string; locale?: string };
  const question = String(body.question ?? '').trim();
  const localeRaw = body.locale ?? 'en';
  const locale: Locale = isLocale(localeRaw) ? localeRaw : 'en';

  if (!question || question.length > 500) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  // Prefer Anthropic, then OpenAI, then heuristic. All three respect the
  // tutor's hard rules either via system prompt or by construction.
  const answer =
    (await askAnthropic(question, locale)) ??
    (await askOpenAI(question, locale)) ??
    heuristicAnswer(question, locale);

  const source = process.env.ANTHROPIC_API_KEY
    ? 'anthropic'
    : process.env.OPENAI_API_KEY
      ? 'openai'
      : 'heuristic';

  return NextResponse.json({ answer, source });
}
