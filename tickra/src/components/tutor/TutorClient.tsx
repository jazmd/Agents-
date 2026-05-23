'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2, Send, Trash2 } from 'lucide-react';

type Msg = { role: 'user' | 'tutor'; text: string };

type Labels = {
  placeholder: string;
  send: string;
  thinking: string;
  error: string;
  youLabel: string;
  tutorLabel: string;
  clear: string;
  disclaimer: string;
};

type Props = { locale: string; labels: Labels; suggestions: readonly string[] };

export function TutorClient({ locale, labels, suggestions }: Props) {
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pending]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || pending) return;
    setError(null);
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setPending(true);
    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: q, locale }),
      });
      const data = (await res.json()) as { answer?: string; error?: string };
      if (data.answer) {
        setMessages((m) => [...m, { role: 'tutor', text: data.answer ?? '' }]);
      } else {
        setError(labels.error);
      }
    } catch {
      setError(labels.error);
    } finally {
      setPending(false);
    }
  }

  function clearAll() {
    setMessages([]);
    setError(null);
  }

  return (
    <div className="rounded-sm border border-line bg-surface">
      <div className="max-h-[520px] min-h-[260px] overflow-y-auto p-6 md:p-8">
        {messages.length === 0 ? (
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{labels.disclaimer}</p>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {suggestions.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => ask(s)}
                    className="w-full rounded-sm border border-line bg-canvas px-4 py-3 text-left text-[14px] text-ink hover:border-ink hover:bg-elevated"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ul className="space-y-5">
            {messages.map((m, i) => (
              <li key={i} className="flex flex-col gap-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                  {m.role === 'user' ? labels.youLabel : labels.tutorLabel}
                </p>
                <p className="whitespace-pre-wrap rounded-sm bg-canvas px-4 py-3 text-[15px] leading-relaxed text-ink">
                  {m.text}
                </p>
              </li>
            ))}
            {pending ? (
              <li className="flex items-center gap-2 text-muted">
                <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} />
                <span className="font-mono text-[11px] uppercase tracking-[0.22em]">{labels.thinking}</span>
              </li>
            ) : null}
            <div ref={endRef} />
          </ul>
        )}
        {error ? <p className="mt-4 text-[13px] text-down">{error}</p> : null}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex items-center gap-2 border-t border-line p-4"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={labels.placeholder}
          maxLength={500}
          className="h-11 flex-1 rounded-full border border-line bg-canvas px-4 text-[15px] text-ink placeholder:text-subtle focus:border-ink focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending || input.trim().length < 3}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-4 text-[13.5px] font-medium tracking-tight text-canvas hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
          {labels.send}
        </button>
        {messages.length > 0 ? (
          <button
            type="button"
            onClick={clearAll}
            aria-label={labels.clear}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-muted hover:border-ink hover:text-ink"
          >
            <Trash2 aria-hidden className="h-4 w-4" strokeWidth={1.6} />
          </button>
        ) : null}
      </form>
    </div>
  );
}
