import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';

export const dynamic = 'force-static';

export default async function EditorialPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.editorial;

  return (
    <AppShell dict={dict} locale={params.locale}>
      <section className="border-b border-line">
        <Container as="div" className="grid grid-cols-12 gap-x-6 gap-y-10 py-24 md:py-32">
          <div className="col-span-12 lg:col-span-7">
            <Eyebrow>{t.eyebrow}</Eyebrow>
            <h1 className="mt-8 font-display text-display-xl font-medium tracking-tight text-balance text-ink">
              {t.title}
            </h1>
          </div>
          <p className="col-span-12 max-w-xl text-pretty text-[16.5px] leading-relaxed text-muted lg:col-span-5 lg:col-start-8 lg:mt-32">
            {t.body}
          </p>
        </Container>
      </section>

      <section className="border-b border-line">
        <Container as="div" className="py-12 md:py-16">
          <ul className="divide-y divide-line border-y border-line">
            {t.posts.map((post, i) => (
              <li key={post.title}>
                <Link
                  href={`/${params.locale}/editorial#post-${i + 1}`}
                  className="group grid grid-cols-12 gap-x-6 gap-y-3 py-10 md:py-12"
                >
                  <div className="col-span-12 flex items-center gap-4 md:col-span-3">
                    <span className="font-display text-[44px] font-medium leading-none tracking-tightest text-line transition-colors group-hover:text-ink">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                        {post.kicker}
                      </p>
                      <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
                        {post.date}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-12 md:col-span-8 md:col-start-4">
                    <h2 className="font-display text-2xl font-medium tracking-tight text-balance text-ink md:text-3xl">
                      {post.title}
                    </h2>
                    <p className="mt-4 max-w-2xl text-pretty text-[15px] leading-relaxed text-muted">
                      {post.excerpt}
                    </p>
                  </div>

                  <span
                    aria-hidden
                    className="col-span-12 hidden text-muted transition-transform group-hover:translate-x-1 group-hover:text-ink md:col-span-1 md:col-start-12 md:inline-flex md:items-start md:justify-end"
                  >
                    <ArrowUpRight className="h-5 w-5" strokeWidth={1.5} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </AppShell>
  );
}
