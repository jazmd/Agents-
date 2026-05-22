import { setRequestLocale, getTranslations } from 'next-intl/server';
import { categories, getProductsByCategory } from '@bykebap/menu';
import { CategoryPills } from '@/components/category-pills';
import { MenuSection } from '@/components/menu-section';

export const dynamic = 'force-static';

export default async function MenuPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('menu');

  return (
    <div className="bg-cream-100">
      <div className="container-page pt-12 pb-4 md:pt-20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
          {t('subtitle')}
        </p>
        <h1 className="mt-2 font-display text-5xl font-bold text-charcoal-900 md:text-6xl">
          {t('title')}
        </h1>
      </div>

      <CategoryPills categories={categories} />

      <div className="container-page pb-16">
        {categories.map((cat) => (
          <MenuSection key={cat.id} category={cat} products={getProductsByCategory(cat.id)} />
        ))}
      </div>
    </div>
  );
}
