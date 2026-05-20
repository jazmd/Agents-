import { renderEmail, renderPlainText } from './layout';

type Locale = 'en' | 'fr';

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://tickra.com';
}

// ---------------------------------------------------------------------------
// Welcome (post sign-up, post email confirmation)
// ---------------------------------------------------------------------------
export function welcomeEmail({
  locale,
  fullName,
}: {
  locale: Locale;
  fullName?: string | null;
}) {
  const name = fullName ? fullName.split(' ')[0] : null;
  const href = `${siteUrl()}/${locale}/onboarding`;

  if (locale === 'fr') {
    const greeting = name ? `Bienvenue, ${name}.` : 'Bienvenue.';
    const body = `
      <p style="margin: 0 0 18px;">Votre compte Tickra est prêt. Avant la leçon 01, six questions calibrent votre point de départ — quatre‑vingt‑dix secondes, pas de mauvaise réponse.</p>
      <p style="margin: 0 0 18px;">Vos premières leçons sont déjà débloquées. Dix minutes par jour suffisent pour démarrer le streak.</p>
    `;
    const text = `Votre compte Tickra est prêt. Six questions, quatre‑vingt‑dix secondes : Tickra calibre votre point de départ avant la leçon 01.`;

    return {
      subject: 'Bienvenue chez Tickra.',
      html: renderEmail({
        preheader: 'Six questions, puis la leçon 01.',
        title: greeting,
        bodyHtml: body,
        ctaLabel: 'Passer le test de niveau',
        ctaHref: href,
        signoff: 'L’équipe Tickra',
      }),
      text: renderPlainText({
        title: greeting,
        bodyText: text,
        ctaLabel: 'Passer le test de niveau',
        ctaHref: href,
        signoff: 'L’équipe Tickra',
      }),
    };
  }

  const greeting = name ? `Welcome, ${name}.` : 'Welcome.';
  const body = `
    <p style="margin: 0 0 18px;">Your Tickra account is ready. Before lesson 01, six questions calibrate your starting line — ninety seconds, no wrong answers.</p>
    <p style="margin: 0 0 18px;">Your first lessons are already unlocked. Ten minutes a day is enough to start the streak.</p>
  `;
  const text = `Your Tickra account is ready. Six questions, ninety seconds: Tickra calibrates your starting line before lesson 01.`;

  return {
    subject: 'Welcome to Tickra.',
    html: renderEmail({
      preheader: 'Six questions, then lesson 01.',
      title: greeting,
      bodyHtml: body,
      ctaLabel: 'Take the placement test',
      ctaHref: href,
      signoff: 'The Tickra team',
    }),
    text: renderPlainText({
      title: greeting,
      bodyText: text,
      ctaLabel: 'Take the placement test',
      ctaHref: href,
      signoff: 'The Tickra team',
    }),
  };
}

// ---------------------------------------------------------------------------
// Subscription confirmed (post Stripe checkout)
// ---------------------------------------------------------------------------
export function subscriptionConfirmedEmail({
  locale,
  plan,
}: {
  locale: Locale;
  plan: 'pro' | 'lifetime';
}) {
  const dashboard = `${siteUrl()}/${locale}/dashboard`;

  if (locale === 'fr') {
    const title =
      plan === 'lifetime' ? 'Bienvenue dans Tickra À vie.' : 'Bienvenue dans Tickra Pro.';
    const body =
      plan === 'lifetime'
        ? `
          <p style="margin: 0 0 18px;">Les 127 leçons sont désormais débloquées. À vie. Les modules futurs s’ajouteront automatiquement à votre bibliothèque.</p>
          <p style="margin: 0 0 18px;">Une garantie satisfait ou remboursé de 14 jours couvre votre achat. Au‑delà, c’est définitif.</p>
        `
        : `
          <p style="margin: 0 0 18px;">Les 127 leçons sont débloquées. Vies illimitées, zéro publicité, choix libre de la piste — Tickra cesse de freiner et commence à enseigner.</p>
          <p style="margin: 0 0 18px;">Annulable à tout moment depuis vos réglages.</p>
        `;
    return {
      subject: plan === 'lifetime' ? 'Tickra À vie · Activé' : 'Tickra Pro · Activé',
      html: renderEmail({
        preheader: 'Votre abonnement est actif.',
        title,
        bodyHtml: body,
        ctaLabel: 'Ouvrir le tableau de bord',
        ctaHref: dashboard,
        signoff: 'L’équipe Tickra',
      }),
      text: renderPlainText({
        title,
        bodyText: 'Votre abonnement est actif. Les 127 leçons sont débloquées.',
        ctaLabel: 'Ouvrir le tableau de bord',
        ctaHref: dashboard,
        signoff: 'L’équipe Tickra',
      }),
    };
  }

  const title = plan === 'lifetime' ? 'Welcome to Tickra Lifetime.' : 'Welcome to Tickra Pro.';
  const body =
    plan === 'lifetime'
      ? `
        <p style="margin: 0 0 18px;">All 127 lessons are now unlocked. For life. Future modules will be added to your library automatically.</p>
        <p style="margin: 0 0 18px;">A 14‑day money‑back guarantee covers this purchase. After that, it is final.</p>
      `
      : `
        <p style="margin: 0 0 18px;">All 127 lessons are unlocked. Unlimited lives, zero ads, free pick of any track — Tickra stops gating and starts teaching.</p>
        <p style="margin: 0 0 18px;">Cancellable any time from your settings.</p>
      `;

  return {
    subject: plan === 'lifetime' ? 'Tickra Lifetime · Activated' : 'Tickra Pro · Activated',
    html: renderEmail({
      preheader: 'Your subscription is active.',
      title,
      bodyHtml: body,
      ctaLabel: 'Open the dashboard',
      ctaHref: dashboard,
      signoff: 'The Tickra team',
    }),
    text: renderPlainText({
      title,
      bodyText: 'Your subscription is active. All 127 lessons are unlocked.',
      ctaLabel: 'Open the dashboard',
      ctaHref: dashboard,
      signoff: 'The Tickra team',
    }),
  };
}

// ---------------------------------------------------------------------------
// Weekly digest
// ---------------------------------------------------------------------------
export function weeklyDigestEmail({
  locale,
  fullName,
  minutes,
  lessonsDone,
  streak,
}: {
  locale: Locale;
  fullName?: string | null;
  minutes: number;
  lessonsDone: number;
  streak: number;
}) {
  const dashboard = `${siteUrl()}/${locale}/dashboard`;
  const name = fullName ? fullName.split(' ')[0] : null;

  if (locale === 'fr') {
    const title = 'Votre semaine sur Tickra.';
    const greet = name ? `Bonjour ${name},` : 'Bonjour,';
    const body = `
      <p style="margin: 0 0 22px;">${greet} voici la semaine que vous venez de poser sur la table.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 22px; border-top: 1px solid #E2E0DA; border-bottom: 1px solid #E2E0DA;">
        ${row('Minutes pratiquées', String(minutes))}
        ${row('Leçons terminées', String(lessonsDone))}
        ${row('Série actuelle', `${streak} jours`)}
      </table>
      <p style="margin: 0 0 18px;">La piste suivante vous attend. Dix minutes aujourd’hui suffisent à maintenir le streak.</p>
    `;
    return {
      subject: `Votre semaine · ${minutes} min sur Tickra`,
      html: renderEmail({
        preheader: `${minutes} minutes pratiquées, ${lessonsDone} leçons, streak ${streak}.`,
        title,
        bodyHtml: body,
        ctaLabel: 'Reprendre la prochaine leçon',
        ctaHref: dashboard,
        signoff: 'L’équipe Tickra',
      }),
      text: renderPlainText({
        title,
        bodyText: `Minutes: ${minutes} · Leçons: ${lessonsDone} · Streak: ${streak} jours.`,
        ctaLabel: 'Reprendre la prochaine leçon',
        ctaHref: dashboard,
        signoff: 'L’équipe Tickra',
      }),
    };
  }

  const title = 'Your week on Tickra.';
  const greet = name ? `Hi ${name},` : 'Hi,';
  const body = `
    <p style="margin: 0 0 22px;">${greet} here is the week you just put on the table.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 22px; border-top: 1px solid #E2E0DA; border-bottom: 1px solid #E2E0DA;">
      ${row('Minutes practised', String(minutes))}
      ${row('Lessons completed', String(lessonsDone))}
      ${row('Current streak', `${streak} days`)}
    </table>
    <p style="margin: 0 0 18px;">The next track is waiting. Ten minutes today is enough to keep the streak alive.</p>
  `;

  return {
    subject: `Your week · ${minutes} min on Tickra`,
    html: renderEmail({
      preheader: `${minutes} minutes practised, ${lessonsDone} lessons done, streak ${streak}.`,
      title,
      bodyHtml: body,
      ctaLabel: 'Resume the next lesson',
      ctaHref: dashboard,
      signoff: 'The Tickra team',
    }),
    text: renderPlainText({
      title,
      bodyText: `Minutes: ${minutes} · Lessons: ${lessonsDone} · Streak: ${streak} days.`,
      ctaLabel: 'Resume the next lesson',
      ctaHref: dashboard,
      signoff: 'The Tickra team',
    }),
  };
}

// ---------------------------------------------------------------------------
// Paywall reminder (free user hit the paywall today)
// ---------------------------------------------------------------------------
export function paywallReminderEmail({ locale, lessonTitle }: { locale: Locale; lessonTitle: string }) {
  const pricing = `${siteUrl()}/${locale}/pricing`;

  if (locale === 'fr') {
    return {
      subject: 'Une leçon vous attend de l’autre côté.',
      html: renderEmail({
        preheader: 'Continuez la leçon avec Tickra Pro.',
        title: 'Encore une bougie.',
        bodyHtml: `
          <p style="margin: 0 0 18px;">Vous vous êtes arrêté sur "${escape(lessonTitle)}". Le reste de la leçon — l’exercice TradingView, le point de contrôle, la revue — vous attend dans Tickra Pro.</p>
          <p style="margin: 0 0 18px;">Annulable à tout moment. Garantie 14 jours sur l’offre À vie.</p>
        `,
        ctaLabel: 'Voir les tarifs',
        ctaHref: pricing,
        signoff: 'L’équipe Tickra',
      }),
      text: renderPlainText({
        title: 'Encore une bougie.',
        bodyText: `Vous vous êtes arrêté sur "${lessonTitle}". Continuez avec Tickra Pro.`,
        ctaLabel: 'Voir les tarifs',
        ctaHref: pricing,
        signoff: 'L’équipe Tickra',
      }),
    };
  }

  return {
    subject: 'One more candle waiting.',
    html: renderEmail({
      preheader: 'Finish the lesson with Tickra Pro.',
      title: 'One more candle.',
      bodyHtml: `
        <p style="margin: 0 0 18px;">You stopped at "${escape(lessonTitle)}". The rest of the lesson — the TradingView drill, the checkpoint, the review — is waiting inside Tickra Pro.</p>
        <p style="margin: 0 0 18px;">Cancel any time. Lifetime is covered by a 14‑day guarantee.</p>
      `,
      ctaLabel: 'See pricing',
      ctaHref: pricing,
      signoff: 'The Tickra team',
    }),
    text: renderPlainText({
      title: 'One more candle.',
      bodyText: `You stopped at "${lessonTitle}". Continue with Tickra Pro.`,
      ctaLabel: 'See pricing',
      ctaHref: pricing,
      signoff: 'The Tickra team',
    }),
  };
}

function row(label: string, value: string): string {
  return `
    <tr>
      <td style="padding: 14px 0; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: #71717A;">${escape(label)}</td>
      <td align="right" style="padding: 14px 0; font-family: 'Fraunces', Georgia, serif; font-size: 22px; font-weight: 500; letter-spacing: -0.02em; color: #0A0A0C;">${escape(value)}</td>
    </tr>`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
