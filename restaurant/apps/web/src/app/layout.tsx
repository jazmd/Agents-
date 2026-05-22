import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'By Kebap — Authentic Döner aus Paderborn',
    template: '%s · By Kebap',
  },
  description:
    'Frisches Döner-Erlebnis aus Paderborn. Jetzt online bestellen — Lieferung in 30 Minuten.',
  icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-cream-100 antialiased">{children}</body>
    </html>
  );
}
