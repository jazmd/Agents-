import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/routing';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatEUR, shortOrderId } from '@/lib/format';
import { LogoutButton } from './logout-button';

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) redirect({ href: '/account/login', locale });

  const t = await getTranslations('account');
  const tS = await getTranslations('admin.status');
  const orders = await prisma.order.findMany({
    where: { userId: user!.id },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
    take: 25,
  });

  const localeForMoney =
    locale === 'de' ? 'de-DE' : locale === 'ru' ? 'ru-RU' : locale === 'tr' ? 'tr-TR' : 'en-DE';

  return (
    <div className="container-page py-12 md:py-16">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
            {t('title')}
          </p>
          <h1 className="mt-1 font-display text-4xl font-bold text-charcoal-900">
            {user!.name}
          </h1>
          <p className="text-sm text-charcoal-500">{user!.email}</p>
        </div>
        <LogoutButton />
      </header>

      <section className="mt-10">
        <h2 className="mb-4 font-display text-2xl font-bold text-charcoal-900">{t('orders')}</h2>
        {orders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-charcoal-200 bg-cream-50 p-10 text-center text-sm text-charcoal-500">
            {t('noOrders')}
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((o) => (
              <li
                key={o.id}
                className="flex flex-col gap-3 rounded-2xl border border-charcoal-100/60 bg-cream-50 p-5 shadow-card sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-display text-lg font-bold">
                    #{shortOrderId(o.publicId)}
                  </div>
                  <div className="text-xs text-charcoal-500">
                    {o.createdAt.toLocaleString(localeForMoney)} · {o.items.length} Artikel
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusChip
                    status={o.status as StatusValue}
                    label={tS(o.status.toLowerCase() as Lowercase<StatusValue>)}
                  />
                  <span className="font-display text-xl font-bold tabular-nums">
                    {formatEUR(o.totalCents, localeForMoney)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

type StatusValue = 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED';

function StatusChip({
  status,
  label,
}: {
  status: StatusValue;
  label: string;
}) {
  const map: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800',
    PREPARING: 'bg-blue-100 text-blue-800',
    READY: 'bg-emerald-100 text-emerald-800',
    DELIVERING: 'bg-violet-100 text-violet-800',
    COMPLETED: 'bg-charcoal-100 text-charcoal-700',
    CANCELLED: 'bg-brand-100 text-brand-700',
  };
  return (
    <span className={`chip ${map[status] ?? 'bg-cream-200 text-charcoal-700'}`}>{label}</span>
  );
}
