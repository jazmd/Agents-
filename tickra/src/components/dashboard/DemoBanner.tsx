import Link from 'next/link';
import { CheckCircle2, FlaskConical, Sparkles } from 'lucide-react';

type Props = {
  locale: string;
  source: 'supabase' | 'demo';
  plan: 'free' | 'pro' | 'lifetime';
  checkout: string | null;
};

export function DemoBanner({ locale, source, plan, checkout }: Props) {
  const fr = locale === 'fr';

  // Just-bought flash: only relevant when ?checkout=demo or =success
  if (checkout === 'demo' || checkout === 'success') {
    return (
      <div className="mb-8 flex items-start gap-3 rounded-sm border border-up bg-up/10 p-5">
        <Sparkles aria-hidden className="mt-0.5 h-5 w-5 flex-shrink-0 text-ink" strokeWidth={1.6} />
        <div>
          <p className="font-display text-lg font-medium tracking-tight text-ink">
            {fr
              ? plan === 'lifetime'
                ? 'Bienvenue dans Tickra À vie.'
                : 'Bienvenue dans Tickra Pro.'
              : plan === 'lifetime'
                ? 'Welcome to Tickra Lifetime.'
                : 'Welcome to Tickra Pro.'}
          </p>
          <p className="mt-1 text-[14px] leading-relaxed text-muted">
            {fr
              ? 'Toutes les leçons sont débloquées. Bonne pratique.'
              : 'Every lesson is now unlocked. Have a good session.'}
          </p>
        </div>
      </div>
    );
  }

  if (source !== 'demo') return null;

  return (
    <div className="mb-8 flex items-start gap-3 rounded-sm border border-line bg-elevated p-5">
      <FlaskConical aria-hidden className="mt-0.5 h-5 w-5 flex-shrink-0 text-ink" strokeWidth={1.6} />
      <div className="flex-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          {fr ? 'Mode démo' : 'Demo mode'}
        </p>
        <p className="mt-2 text-[14px] leading-relaxed text-ink">
          {fr
            ? 'Vous testez Tickra sans serveur. Votre progression n’est pas sauvegardée. '
            : 'You are testing Tickra without a server. Your progress is not saved. '}
          {plan === 'free' ? (
            <Link href={`/${locale}/pricing`} className="font-medium underline-offset-2 hover:underline">
              {fr ? 'Essayez l’achat Pro pour débloquer toutes les leçons.' : 'Try the Pro purchase to unlock every lesson.'}
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 font-medium text-up">
              <CheckCircle2 aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
              {fr ? 'Plan ' : 'Plan '}
              <span className="uppercase">{plan}</span>
              {fr ? ' actif (démo).' : ' active (demo).'}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
