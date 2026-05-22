import { Check, Minus, MinusCircle } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { cn } from '@/lib/cn';
import type { Dictionary } from '@/lib/i18n/dictionaries';

export function Compare({ dict }: { dict: Dictionary }) {
  const t = dict.compare;

  function cell(value: string) {
    if (value === 'yes') {
      return (
        <span className="inline-flex items-center justify-center" aria-label={t.legend.yes}>
          <Check className="h-4 w-4 text-ink" strokeWidth={2.25} aria-hidden />
        </span>
      );
    }
    if (value === 'no') {
      return (
        <span className="inline-flex items-center justify-center" aria-label={t.legend.no}>
          <Minus className="h-4 w-4 text-subtle" strokeWidth={2} aria-hidden />
        </span>
      );
    }
    if (value === 'partial') {
      return (
        <span className="inline-flex items-center justify-center" aria-label={t.legend.partial}>
          <MinusCircle className="h-4 w-4 text-muted" strokeWidth={1.6} aria-hidden />
        </span>
      );
    }
    return <span className="font-mono text-[11px] text-muted">{value}</span>;
  }

  return (
    <section aria-labelledby="compare-title" className="border-b border-line">
      <Container as="div" className="py-24 md:py-32">
        <div id="compare-title">
          <SectionHeader eyebrow={t.eyebrow} title={t.title} body={t.body} align="between" />
        </div>

        <div className="mt-14 overflow-x-auto rounded-sm border border-line bg-surface">
          <table className="w-full min-w-[760px] text-left">
            <thead className="border-b border-line bg-elevated">
              <tr>
                {t.headers.map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className={cn(
                      'px-4 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-muted',
                      i === 0 ? 'w-[28%] text-left' : 'text-center',
                      i === 1 ? 'bg-ink text-canvas' : '',
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {t.rows.map((row) => (
                <tr key={row.feature}>
                  <th
                    scope="row"
                    className="px-4 py-4 text-left font-display text-[14.5px] tracking-tight text-ink"
                  >
                    {row.feature}
                  </th>
                  {row.values.map((v, i) => (
                    <td
                      key={i}
                      className={cn(
                        'px-4 py-4 text-center text-[14px]',
                        i === 0 ? 'bg-elevated' : '',
                      )}
                    >
                      {cell(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 max-w-2xl text-pretty text-[12.5px] leading-relaxed text-subtle">
          {t.footnote}
        </p>
      </Container>
    </section>
  );
}
