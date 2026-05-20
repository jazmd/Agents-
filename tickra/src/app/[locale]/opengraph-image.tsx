import { ImageResponse } from 'next/og';
import { isLocale, type Locale } from '@/lib/i18n/config';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Tickra — Learn the markets, candle by candle';

export function generateImageMetadata({ params }: { params: { locale: string } }) {
  return [{ id: params.locale, size, contentType, alt }];
}

const copy: Record<Locale, { eyebrow: string; title: string; subtitle: string }> = {
  en: {
    eyebrow: 'TICKRA · A TRADING CURRICULUM',
    title: 'Start at candle 1.\nReach institutional level.',
    subtitle: '127 structured lessons · 10 minutes a day',
  },
  fr: {
    eyebrow: 'TICKRA · UN CURSUS DE TRADING',
    title: 'Commencez à la bougie 1.\nAtteignez le niveau institutionnel.',
    subtitle: '127 leçons structurées · 10 minutes par jour',
  },
};

export default function OG({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'en';
  const t = copy[locale];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#FAFAF7',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <svg viewBox="0 0 24 24" width={36} height={36} fill="none" stroke="#0A0A0C" strokeWidth={1.75}>
            <rect x={4} y={9} width={3} height={10} rx={0.5} />
            <line x1={5.5} y1={5} x2={5.5} y2={9} />
            <line x1={5.5} y1={19} x2={5.5} y2={22} />
            <rect x={10.5} y={5} width={3} height={13} rx={0.5} fill="#0A0A0C" />
            <line x1={12} y1={2} x2={12} y2={5} />
            <line x1={12} y1={18} x2={12} y2={22} />
            <rect x={17} y={11} width={3} height={7} rx={0.5} />
            <line x1={18.5} y1={7} x2={18.5} y2={11} />
            <line x1={18.5} y1={18} x2={18.5} y2={21} />
          </svg>
          <span style={{ fontSize: 22, fontWeight: 600, color: '#0A0A0C', letterSpacing: '-0.01em' }}>
            Tickra
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <span
            style={{
              fontSize: 14,
              letterSpacing: '0.22em',
              color: '#6B6B6B',
              fontFamily: 'monospace',
            }}
          >
            {t.eyebrow}
          </span>
          <div
            style={{
              fontSize: 84,
              lineHeight: 1.02,
              letterSpacing: '-0.03em',
              color: '#0A0A0C',
              whiteSpace: 'pre-line',
              fontWeight: 500,
            }}
          >
            {t.title}
          </div>
          <div style={{ fontSize: 22, color: '#5C5C64', maxWidth: 880 }}>{t.subtitle}</div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontSize: 13,
            letterSpacing: '0.22em',
            color: '#6B6B6B',
            fontFamily: 'monospace',
          }}
        >
          <span>TICKRA.COM</span>
          <span>{locale.toUpperCase()}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
