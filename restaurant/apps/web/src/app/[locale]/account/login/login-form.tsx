'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { loginAction } from '@/lib/actions/auth';

export function LoginForm() {
  const t = useTranslations('account.login');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await loginAction(fd);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.push('/account');
      router.refresh();
    });
  }

  return (
    <AuthShell title={t('title')}>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="label">{t('email')}</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="field"
          />
        </label>
        <label className="block">
          <span className="label">{t('password')}</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            minLength={1}
            className="field"
          />
        </label>
        {error && (
          <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">{error}</p>
        )}
        <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-60">
          {pending ? '…' : t('submit')}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-charcoal-500">
        {t('noAccount')}{' '}
        <Link href="/account/register" className="font-semibold text-brand-500 hover:underline">
          {t('register')}
        </Link>
      </p>
    </AuthShell>
  );
}

function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="container-page py-16">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-charcoal-100/60 bg-cream-50 p-8 shadow-card">
        <h1 className="font-display text-3xl font-bold text-charcoal-900">{title}</h1>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
