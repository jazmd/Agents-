'use client';

import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { fadeUp } from '@/lib/motion';
import type { Dictionary } from '@/lib/i18n/dictionaries';

export function Testimonials({ dict }: { dict: Dictionary }) {
  const t = dict.testimonials;
  return (
    <section aria-labelledby="testimonials-title" className="border-b border-line bg-elevated">
      <Container as="div" className="py-24 md:py-32">
        <div id="testimonials-title">
          <SectionHeader eyebrow={t.eyebrow} title={t.title} body={t.body} align="between" />
        </div>

        <ul className="mt-20 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {t.items.map((item, i) => (
            <motion.li
              key={item.name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={fadeUp}
              custom={i}
              className="flex flex-col justify-between rounded-sm border border-line bg-surface p-8 md:p-10"
            >
              <div>
                <Quote aria-hidden className="h-6 w-6 text-ink" strokeWidth={1.4} />
                <blockquote className="mt-6 font-display text-xl font-medium leading-snug tracking-tight text-balance text-ink md:text-2xl">
                  “{item.quote}”
                </blockquote>
              </div>
              <footer className="mt-10 border-t border-line pt-5">
                <p className="font-display text-[15.5px] tracking-tight text-ink">{item.name}</p>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                  {item.role}
                </p>
              </footer>
            </motion.li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
