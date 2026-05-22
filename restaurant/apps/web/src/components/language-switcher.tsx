'use client';

import { useLocale } from 'next-intl';
import { useTransition } from 'react';
import { Globe } from 'lucide-react';
import { useRouter, usePathname } from '@/i18n/routing';
import { locales, localeLabels, localeFlags, type AppLocale } from '@bykebap/i18n';

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale() as AppLocale;
  const [pending, startTransition] = useTransition();

  function change(next: AppLocale) {
    if (next === locale) return;
    startTransition(() => router.replace(pathname, { locale: next }));
  }

  return (
    <div className="group relative">
      <button
        type="button"
        aria-label="Language"
        className="inline-flex items-center gap-2 rounded-full border border-charcoal-100 bg-cream-50 px-3 py-2.5 text-sm font-semibold text-charcoal-900 transition hover:border-brand-500"
        disabled={pending}
      >
        <Globe className="h-4 w-4" />
        <span aria-hidden>{localeFlags[locale]}</span>
        <span className="hidden md:inline">{localeLabels[locale]}</span>
      </button>
      <div className="absolute right-0 top-full z-50 mt-2 hidden min-w-[10rem] origin-top-right rounded-2xl border border-charcoal-100 bg-cream-50 p-2 shadow-soft group-hover:block group-focus-within:block">
        {locales.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => change(l)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
              l === locale
                ? 'bg-brand-50 text-brand-700'
                : 'text-charcoal-700 hover:bg-cream-200'
            }`}
          >
            <span aria-hidden>{localeFlags[l]}</span>
            <span>{localeLabels[l]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
