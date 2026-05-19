import type { Metadata } from 'next';

const SITE_URL = 'https://ruflo.com';
const SITE_NAME = 'Ruflo';
const DESCRIPTION =
  'Ruflo is the orchestration layer for autonomous AI teams. Ship production work with coordinated agents, verifiable memory, and Byzantine-grade consensus.';

export const siteMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Orchestration for autonomous AI teams`,
    template: `%s · ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'AI orchestration',
    'autonomous agents',
    'multi-agent systems',
    'agent infrastructure',
    'LLM operations',
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: { email: false, telephone: false, address: false },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Orchestration for autonomous AI teams`,
    description: DESCRIPTION,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Orchestration for autonomous AI teams`,
    description: DESCRIPTION,
    creator: '@ruflo',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  icons: { icon: '/favicon.svg' },
};
