import type { Locale } from './i18n/config';

const URL_BASE = 'https://tickra.com';

const DESCRIPTIONS: Record<Locale, string> = {
  en: 'A structured trading curriculum — from your first Japanese candle to institutional-grade decision making.',
  fr: "Un cursus de trading structuré — de votre première bougie japonaise jusqu'à la prise de décision institutionnelle.",
};

export function organizationLd(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Tickra',
    url: `${URL_BASE}/${locale}`,
    logo: `${URL_BASE}/icon`,
    description: DESCRIPTIONS[locale],
    sameAs: ['https://twitter.com/tickra'],
    inLanguage: locale === 'fr' ? 'fr-FR' : 'en-US',
  };
}

export function websiteLd(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Tickra',
    url: `${URL_BASE}/${locale}`,
    inLanguage: locale === 'fr' ? 'fr-FR' : 'en-US',
    publisher: { '@type': 'Organization', name: 'Tickra' },
  };
}

export function courseLd(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: locale === 'fr' ? 'Cursus de trading Tickra' : 'Tickra Trading Curriculum',
    description: DESCRIPTIONS[locale],
    provider: { '@type': 'Organization', name: 'Tickra', url: URL_BASE },
    inLanguage: locale === 'fr' ? 'fr-FR' : 'en-US',
    educationalCredentialAwarded: locale === 'fr' ? 'Compétence opérationnelle' : 'Operational proficiency',
    offers: {
      '@type': 'Offer',
      category: 'subscription',
      price: '14.99',
      priceCurrency: 'EUR',
    },
  };
}

export function faqLd(items: ReadonlyArray<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  };
}

export function breadcrumbLd(items: Array<{ name: string; href: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.href.startsWith('http') ? it.href : `${URL_BASE}${it.href}`,
    })),
  };
}

export function jsonLdProps(value: unknown) {
  return {
    type: 'application/ld+json' as const,
    dangerouslySetInnerHTML: { __html: JSON.stringify(value) },
  };
}

export function learningResourceLd(args: {
  locale: Locale;
  slug: string;
  title: string;
  intro: string;
  duration: number;
  paywalled: boolean;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    inLanguage: args.locale === 'fr' ? 'fr-FR' : 'en-US',
    name: args.title,
    description: args.intro,
    url: `${URL_BASE}/${args.locale}/lesson/${args.slug}`,
    learningResourceType: 'Lesson',
    timeRequired: `PT${args.duration}M`,
    isAccessibleForFree: !args.paywalled,
    provider: { '@type': 'Organization', name: 'Tickra', url: URL_BASE },
  };
}

export function productOfferLd(args: {
  locale: Locale;
  name: string;
  price: string;
  currency: 'EUR';
  recurrence: 'P1M' | 'P1Y' | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: args.name,
    brand: { '@type': 'Brand', name: 'Tickra' },
    offers: {
      '@type': 'Offer',
      price: args.price,
      priceCurrency: args.currency,
      availability: 'https://schema.org/InStock',
      url: `${URL_BASE}/${args.locale}/pricing`,
      ...(args.recurrence
        ? {
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              billingDuration: args.recurrence,
              referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' },
            },
          }
        : {}),
    },
  };
}
