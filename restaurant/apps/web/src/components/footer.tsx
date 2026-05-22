import { useTranslations } from 'next-intl';
import { Flame, MapPin, Phone, Clock } from 'lucide-react';

export function Footer() {
  const t = useTranslations('footer');
  const tBrand = useTranslations('brand');
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-charcoal-100/60 bg-charcoal-900 text-cream-100">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-500 text-cream-50 shadow-glow">
              <Flame className="h-5 w-5" />
            </span>
            <div className="font-display text-xl font-bold">By Kebap</div>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream-100/70">
            {tBrand('tagline')}
          </p>
        </div>

        <div>
          <h4 className="mb-3 flex items-center gap-2 font-display text-lg">
            <Clock className="h-4 w-4 text-accent-400" /> {t('hours')}
          </h4>
          <ul className="space-y-1 text-sm text-cream-100/70">
            <li>{t('monThu')}</li>
            <li>{t('friSat')}</li>
            <li>{t('sun')}</li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 flex items-center gap-2 font-display text-lg">
            <MapPin className="h-4 w-4 text-accent-400" /> {t('address')}
          </h4>
          <p className="text-sm text-cream-100/70">
            Westernstraße 12<br />
            33098 Paderborn<br />
            Deutschland
          </p>
        </div>

        <div>
          <h4 className="mb-3 flex items-center gap-2 font-display text-lg">
            <Phone className="h-4 w-4 text-accent-400" /> {t('contact')}
          </h4>
          <p className="text-sm text-cream-100/70">
            +49 5251 123 456<br />
            hallo@bykebap.de
          </p>
        </div>
      </div>
      <div className="border-t border-cream-100/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-6 text-xs text-cream-100/50 sm:flex-row">
          <span>© {year} By Kebap. {t('copyright')}</span>
          <span className="font-medium tracking-wide">Paderborn · Made with charcoal & care</span>
        </div>
      </div>
    </footer>
  );
}
