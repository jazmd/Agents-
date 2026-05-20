import { notFound } from 'next/navigation';
import { Send } from 'lucide-react';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';

export const dynamic = 'force-static';

export default async function ContactPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.contact;

  return (
    <AppShell dict={dict} locale={params.locale}>
      <section className="border-b border-line">
        <Container as="div" className="grid grid-cols-12 gap-x-6 gap-y-12 py-20 md:py-28">
          <div className="col-span-12 lg:col-span-5">
            <Eyebrow>{t.eyebrow}</Eyebrow>
            <h1 className="mt-6 font-display text-display-lg font-medium tracking-tight text-balance text-ink">
              {t.title}
            </h1>
            <p className="mt-6 max-w-md text-pretty text-[16px] leading-relaxed text-muted">
              {t.body}
            </p>

            <div className="mt-12 border-t border-line pt-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                {t.directs.title}
              </p>
              <dl className="mt-6 grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6">
                {t.directs.items.map((d) => (
                  <div key={d.label}>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-subtle">
                      {d.label}
                    </dt>
                    <dd className="mt-1.5 text-[14.5px] text-ink">{d.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <form
            method="post"
            action="#"
            aria-label="Contact form"
            className="col-span-12 grid gap-5 rounded-sm border border-line bg-surface p-6 md:p-10 lg:col-span-6 lg:col-start-7"
          >
            <Field label={t.form.name} id="name" placeholder={t.form.namePlaceholder} required autoComplete="name" />
            <Field label={t.form.email} id="email" type="email" placeholder={t.form.emailPlaceholder} required autoComplete="email" />

            <div>
              <label htmlFor="topic" className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                {t.form.topic}
              </label>
              <select
                id="topic"
                name="topic"
                className="h-12 w-full rounded-sm border border-line bg-canvas px-4 text-[15px] text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15"
              >
                {t.form.topics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="message" className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                {t.form.message}
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                placeholder={t.form.messagePlaceholder}
                required
                className="block w-full resize-none rounded-sm border border-line bg-canvas px-4 py-3 text-[15px] text-ink placeholder:text-subtle focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15"
              />
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-medium tracking-tight text-canvas hover:bg-ink/90 sm:w-auto sm:self-start sm:px-6"
            >
              {t.form.cta}
              <Send aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            </button>

            <p className="text-[12.5px] leading-relaxed text-subtle">{t.form.notice}</p>
          </form>
        </Container>
      </section>
    </AppShell>
  );
}

type FieldProps = {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
};

function Field({ label, id, type = 'text', placeholder, autoComplete, required }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="h-12 w-full rounded-sm border border-line bg-canvas px-4 text-[15px] text-ink placeholder:text-subtle focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15"
      />
    </div>
  );
}
