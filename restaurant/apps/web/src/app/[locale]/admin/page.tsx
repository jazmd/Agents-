import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/routing';
import { Receipt, TrendingUp, ShoppingBag, BarChart3 } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatEUR, shortOrderId } from '@/lib/format';
import { StatusSelector } from './status-selector';

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) redirect({ href: '/account/login', locale });
  if (user!.role !== 'ADMIN') redirect({ href: '/', locale });

  const t = await getTranslations('admin');
  const tS = await getTranslations('admin.status');

  const localeForMoney =
    locale === 'de' ? 'de-DE' : locale === 'ru' ? 'ru-RU' : locale === 'tr' ? 'tr-TR' : 'en-DE';

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [orders, todayOrders, allTimeCount] = await Promise.all([
    prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: startOfDay } },
    }),
    prisma.order.count(),
  ]);

  const revenueToday = todayOrders.reduce((s, o) => s + o.totalCents, 0);
  const avgOrder =
    todayOrders.length > 0 ? Math.round(revenueToday / todayOrders.length) : 0;

  return (
    <div className="container-page py-12 md:py-16">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
          {t('stats.today')}
        </p>
        <h1 className="mt-1 font-display text-4xl font-bold text-charcoal-900 md:text-5xl">
          {t('title')}
        </h1>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={<ShoppingBag className="h-5 w-5" />}
          value={String(todayOrders.length)}
          label={t('stats.orders')}
          tint="brand"
        />
        <Stat
          icon={<TrendingUp className="h-5 w-5" />}
          value={formatEUR(revenueToday, localeForMoney)}
          label={t('stats.revenue')}
          tint="accent"
        />
        <Stat
          icon={<BarChart3 className="h-5 w-5" />}
          value={formatEUR(avgOrder, localeForMoney)}
          label={t('stats.avgOrder')}
          tint="emerald"
        />
        <Stat
          icon={<Receipt className="h-5 w-5" />}
          value={String(allTimeCount)}
          label="Total"
          tint="charcoal"
        />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 font-display text-2xl font-bold text-charcoal-900">
          {t('orders.title')}
        </h2>
        <div className="overflow-hidden rounded-3xl border border-charcoal-100/60 bg-cream-50 shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-charcoal-100/60 bg-cream-200/50 text-left text-xs font-semibold uppercase tracking-wider text-charcoal-500">
                  <th className="px-5 py-3">{t('orders.id')}</th>
                  <th className="px-5 py-3">{t('orders.customer')}</th>
                  <th className="px-5 py-3">{t('orders.items')}</th>
                  <th className="px-5 py-3 text-right">{t('orders.total')}</th>
                  <th className="px-5 py-3">{t('orders.status')}</th>
                  <th className="px-5 py-3">{t('orders.time')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-charcoal-300">
                      —
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} className="border-b border-charcoal-100/40 last:border-0">
                      <td className="px-5 py-4 font-display font-bold">
                        #{shortOrderId(o.publicId)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold">{o.customerName}</div>
                        <div className="text-xs text-charcoal-500">{o.customerPhone}</div>
                      </td>
                      <td className="px-5 py-4 text-charcoal-700">
                        {o.items
                          .map((i) => `${i.quantity}× ${i.name}`)
                          .join(', ')
                          .slice(0, 60)}
                        {o.items.map((i) => i.name).join('').length > 60 && '…'}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold tabular-nums">
                        {formatEUR(o.totalCents, localeForMoney)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusSelector
                          orderId={o.id}
                          status={o.status as 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED'}
                          labels={{
                            PENDING: tS('pending'),
                            PREPARING: tS('preparing'),
                            READY: tS('ready'),
                            DELIVERING: tS('delivering'),
                            COMPLETED: tS('completed'),
                            CANCELLED: tS('cancelled'),
                          }}
                        />
                      </td>
                      <td className="px-5 py-4 text-xs text-charcoal-500">
                        {o.createdAt.toLocaleTimeString(localeForMoney, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
  tint,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  tint: 'brand' | 'accent' | 'emerald' | 'charcoal';
}) {
  const tintMap = {
    brand: 'bg-brand-500 text-cream-50',
    accent: 'bg-accent-400 text-charcoal-900',
    emerald: 'bg-emerald-500 text-cream-50',
    charcoal: 'bg-charcoal-900 text-cream-50',
  };
  return (
    <article className="rounded-3xl border border-charcoal-100/60 bg-cream-50 p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">{label}</span>
        <div className={`grid h-9 w-9 place-items-center rounded-xl ${tintMap[tint]}`}>{icon}</div>
      </div>
      <div className="mt-2 font-display text-3xl font-bold tabular-nums text-charcoal-900">{value}</div>
    </article>
  );
}
