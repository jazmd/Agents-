import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ArrowRight, Star, Clock, ShoppingBag, Flame, Leaf, Truck } from 'lucide-react';
import { categories, products } from '@bykebap/menu';
import type { AppLocale } from '@bykebap/i18n';
import { ProductCard } from '@/components/product-card';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('hero');
  const tH = await getTranslations('highlights');
  const tM = await getTranslations('menu');
  const tB = await getTranslations('brand');

  const featured = products.filter((p) => p.popular).slice(0, 6);
  const localeKey = locale as AppLocale;

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-cream-100 bg-radial-spotlight">
        <div className="container-page grid items-center gap-12 py-16 md:grid-cols-[1.05fr_1fr] md:py-24 lg:py-32">
          <div className="relative animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              <Flame className="h-3.5 w-3.5" /> {t('kicker')}
            </span>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight text-charcoal-900 sm:text-6xl lg:text-7xl text-balance">
              {t('title')}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-charcoal-500 text-pretty">
              {t('subtitle')}
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/menu" className="btn-primary text-base">
                <ShoppingBag className="h-4 w-4" />
                {t('ctaOrder')}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/menu" className="btn-outline text-base">
                {t('ctaMenu')}
              </Link>
            </div>

            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-charcoal-100 pt-8">
              <Stat icon={<Star className="h-4 w-4" />} value="4.9" label={t('stats.rating')} />
              <Stat icon={<Clock className="h-4 w-4" />} value="30′" label={t('stats.delivery')} />
              <Stat icon={<Flame className="h-4 w-4" />} value="12k+" label={t('stats.orders')} />
            </dl>
          </div>

          {/* Decorative visual */}
          <div className="relative mx-auto w-full max-w-md animate-fade-in">
            <div className="relative aspect-square overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-500 via-brand-700 to-charcoal-900 shadow-glow">
              <div className="absolute inset-0 bg-grain opacity-30 mix-blend-overlay" />
              <div className="absolute inset-0 bg-radial-burgundy" />
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <div className="text-[12rem] leading-none drop-shadow-2xl">🥙</div>
                  <div className="mt-6 font-display text-2xl font-bold text-cream-50 drop-shadow">
                    {tB('name')}
                  </div>
                </div>
              </div>
              {/* Decorative dot */}
              <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-accent-400 blur-3xl opacity-50" />
            </div>
            {/* Floating price card */}
            <div className="absolute -bottom-6 -left-6 rounded-2xl bg-cream-50 px-5 py-4 shadow-soft">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-300">
                ab nur
              </div>
              <div className="font-display text-2xl font-bold text-charcoal-900 tabular-nums">
                € 7,50
              </div>
            </div>
            <div className="absolute -right-4 top-8 rounded-2xl border border-accent-200 bg-cream-50 px-4 py-3 shadow-card">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-accent-400 text-accent-400" />
                <span className="font-display text-lg font-bold">4.9</span>
              </div>
              <div className="text-[10px] text-charcoal-500">2.300+ Bewertungen</div>
            </div>
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section className="container-page py-16 md:py-20">
        <div className="grid gap-4 md:grid-cols-3">
          <Highlight
            icon={<Flame className="h-5 w-5" />}
            title={tH('fresh.title')}
            text={tH('fresh.text')}
            tint="brand"
          />
          <Highlight
            icon={<Leaf className="h-5 w-5" />}
            title={tH('halal.title')}
            text={tH('halal.text')}
            tint="accent"
          />
          <Highlight
            icon={<Truck className="h-5 w-5" />}
            title={tH('fast.title')}
            text={tH('fast.text')}
            tint="charcoal"
          />
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container-page py-12">
        <header className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
              {tM('subtitle')}
            </p>
            <h2 className="mt-2 font-display text-4xl font-bold text-charcoal-900 md:text-5xl">
              {tM('title')}
            </h2>
          </div>
          <Link href="/menu" className="btn-outline">
            {tM('title')} <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {categories.slice(0, 10).map((cat) => (
            <Link
              key={cat.id}
              href={{ pathname: '/menu', hash: `cat-${cat.id}` }}
              className="group flex flex-col items-center gap-2 rounded-3xl border border-charcoal-100/60 bg-cream-50 p-5 text-center shadow-card transition hover:-translate-y-0.5 hover:border-brand-300"
            >
              <span className="text-4xl transition group-hover:scale-110">{cat.icon}</span>
              <span className="font-display text-sm font-bold text-charcoal-900">
                {cat.name[localeKey] ?? cat.name.de}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="container-page py-12">
        <header className="mb-8 flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-bold text-charcoal-900 md:text-4xl">
            Beliebte Klassiker
          </h2>
          <Link href="/menu" className="text-sm font-semibold text-brand-500 hover:underline">
            Alles ansehen →
          </Link>
        </header>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="container-page py-16">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-charcoal-900 px-8 py-14 text-center shadow-soft md:py-20">
          <div className="absolute inset-0 bg-grain opacity-20" />
          <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-brand-500/40 blur-3xl" />
          <div className="absolute -right-10 bottom-0 h-80 w-80 rounded-full bg-accent-400/30 blur-3xl" />
          <div className="relative mx-auto max-w-2xl text-cream-50">
            <h2 className="font-display text-4xl font-bold md:text-5xl">
              Hunger? Bestelle jetzt.
            </h2>
            <p className="mt-4 text-lg text-cream-100/80">
              Lieferung in 30 Minuten — oder hol dir den Geschmack direkt ab.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link href="/menu" className="btn-accent text-base">
                <ShoppingBag className="h-4 w-4" /> {t('ctaOrder')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-accent-500">
        {icon}
        <span className="font-display text-2xl font-bold text-charcoal-900 tabular-nums">{value}</span>
      </div>
      <div className="mt-0.5 text-xs font-medium uppercase tracking-wider text-charcoal-500">{label}</div>
    </div>
  );
}

function Highlight({
  icon,
  title,
  text,
  tint,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  tint: 'brand' | 'accent' | 'charcoal';
}) {
  const tintMap = {
    brand: 'bg-brand-500 text-cream-50',
    accent: 'bg-accent-400 text-charcoal-900',
    charcoal: 'bg-charcoal-900 text-cream-50',
  };
  return (
    <article className="group flex gap-5 rounded-3xl bg-cream-50 p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tintMap[tint]} transition group-hover:scale-105`}>
        {icon}
      </div>
      <div>
        <h3 className="font-display text-xl font-bold text-charcoal-900">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-charcoal-500">{text}</p>
      </div>
    </article>
  );
}
