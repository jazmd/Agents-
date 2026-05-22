'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { registerAction } from '@/lib/actions/auth';

export function RegisterForm() {
  const t = useTranslations('account.register');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await registerAction(fd);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.push('/account');
      router.refresh();
    });
  }

  return (
    <div className="container-page py-16">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-charcoal-100/60 bg-cream-50 p-8 shadow-card">
        <h1 className="font-display text-3xl font-bold text-charcoal-900">{t('title')}</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Input label={t('name')} name="name" required autoComplete="name" />
          <Input label={t('email')} name="email" type="email" required autoComplete="email" />
          <Input
            label={t('password')}
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
          <Input label={t('phone')} name="phone" type="tel" autoComplete="tel" />
          {error && (
            <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">{error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="btn-primary w-full disabled:opacity-60"
          >
            {pending ? '…' : t('submit')}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-charcoal-500">
          {t('hasAccount')}{' '}
          <Link href="/account/login" className="font-semibold text-brand-500 hover:underline">
            {t('login')}
          </Link>
        </p>
      </div>
    </div>
  );
}

function Input({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input {...props} className="field" />
    </label>
  );
}
