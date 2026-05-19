'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, CircleDot } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { fadeUp, easeOutExpo } from '@/lib/motion';

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden border-b border-ink-line"
    >
      <Container as="div" className="relative grid grid-cols-12 gap-x-6 pb-24 pt-20 md:pb-32 md:pt-28">
        <div className="col-span-12 lg:col-span-8">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <Eyebrow>v3.6 · Now generally available</Eyebrow>
          </motion.div>

          <motion.h1
            id="hero-title"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="mt-8 font-display text-display-xl font-medium text-ink"
          >
            Orchestration for{' '}
            <span className="italic text-ink-soft">autonomous</span>
            <br className="hidden sm:block" /> AI teams.
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="mt-8 max-w-xl text-lg leading-relaxed text-ink-muted md:text-xl"
          >
            Ruflo coordinates fleets of specialised agents with verifiable memory,
            Byzantine‑grade consensus, and a runtime engineered to ship production work —
            not demos.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <Button href="#start">
              Start building
              <ArrowUpRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            </Button>
            <Button href="#demo" variant="ghost">
              Book a demo
            </Button>
          </motion.div>

          <motion.dl
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={4}
            className="mt-16 grid max-w-2xl grid-cols-3 gap-x-8 border-t border-ink-line pt-8"
          >
            {[
              { k: '99.99%', v: 'Consensus uptime' },
              { k: '12 500×', v: 'Faster vector recall' },
              { k: '< 100 ms', v: 'Coordination latency' },
            ].map((s) => (
              <div key={s.v}>
                <dt className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                  {s.v}
                </dt>
                <dd className="mt-2 font-display text-2xl font-medium tracking-tight text-ink md:text-3xl">
                  {s.k}
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.aside
          aria-hidden
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.25, ease: easeOutExpo }}
          className="relative col-span-12 mt-16 lg:col-span-4 lg:mt-2"
        >
          <div className="relative ml-auto w-full max-w-md border border-ink-line bg-paper-pure p-6 shadow-[0_1px_0_0_#0A0A0A]">
            <div className="flex items-center justify-between border-b border-ink-line pb-3">
              <div className="flex items-center gap-2">
                <CircleDot className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                  Live swarm
                </span>
              </div>
              <span className="font-mono text-[11px] text-ink-subtle">SF · 14:02</span>
            </div>

            <ul className="mt-5 space-y-4 font-mono text-[12.5px] leading-relaxed text-ink-soft">
              {[
                ['architect', 'designed schema · 4 entities'],
                ['coder', 'wrote 312 lines · auth module'],
                ['tester', 'passed 47 / 47 specs'],
                ['reviewer', 'approved · 2 suggestions'],
              ].map(([agent, msg], i) => (
                <motion.li
                  key={agent}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 + i * 0.12, ease: easeOutExpo }}
                  className="grid grid-cols-[88px_1fr] items-baseline gap-3"
                >
                  <span className="text-ink-muted">{agent}</span>
                  <span>{msg}</span>
                </motion.li>
              ))}
            </ul>

            <div className="mt-6 flex items-center justify-between border-t border-ink-line pt-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                consensus
              </span>
              <span className="font-mono text-[11px] text-ink">raft · quorum 4/4</span>
            </div>
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute -right-6 -top-6 hidden h-24 w-24 border border-ink lg:block"
          />
        </motion.aside>
      </Container>

      <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-ink-line" />
    </section>
  );
}
