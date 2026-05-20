const en = {
  nav: {
    method: 'Method',
    curriculum: 'Curriculum',
    pricing: 'Pricing',
    signIn: 'Sign in',
    getStarted: 'Get started',
  },
  hero: {
    eyebrow: 'A structured path · From candle 1',
    title: ['Start at candle 1.', 'Reach institutional level.'],
    titleEm: 'institutional',
    body: 'Tickra teaches the markets the way trading floors learn them — pattern by pattern, risk by risk, decision by decision. Ten‑minute lessons, real charts, no theatrics.',
    primaryCta: 'Take the placement test',
    secondaryCta: 'See a sample lesson',
    chartCaption: 'EUR/USD · 1H · Last 24 sessions',
    stats: [
      { value: '127', label: 'Structured lessons' },
      { value: '11', label: 'Mastery tracks' },
      { value: '10 min', label: 'Daily commitment' },
    ],
  },
  method: {
    eyebrow: 'The method',
    title: 'Three steps. No detours.',
    body: 'Most trading courses sell hours. We sell a path. Yours starts with a calibration, runs on ten daily minutes, and ends in front of a real chart.',
    steps: [
      {
        index: '01',
        title: 'Calibrate your starting line',
        body: 'A six‑question placement test reads what you already know and routes you to the right module. No condescension, no false start.',
      },
      {
        index: '02',
        title: 'Train ten minutes a day',
        body: 'A lesson, a quiz, a chart drill, a review. Streaks reward consistency; lives protect attention. Skip nothing, master one block at a time.',
      },
      {
        index: '03',
        title: 'Graduate to the real chart',
        body: 'When patterns become reflex, you move from drills to live markets — embedded TradingView, journaled decisions, post‑trade review.',
      },
    ],
  },
  bento: {
    eyebrow: 'The product',
    title: 'A workshop, not a library.',
    body: 'Every lesson is built around something you do, not something you watch.',
    items: {
      charts: {
        title: 'Real charts, drawn live.',
        body: 'Every lesson opens on the chart it teaches. Trendlines, Fibonacci, supply zones — practised on actual historical sessions.',
      },
      streak: {
        title: 'Streaks that respect your time.',
        body: 'Ten minutes counts. Miss a day, keep your streak with a freeze. Tickra rewards consistency, not grinding.',
      },
      library: {
        title: '127 modules, eleven tracks.',
        body: 'From Japanese candles to volatility regimes. Every module ends with a checkpoint you can fail — and retake.',
      },
      risk: {
        title: 'Risk first. Always.',
        body: 'Position sizing, stop placement, expectancy. We teach risk before patterns, because losing slowly is the whole game.',
      },
      journal: {
        title: 'Decisions, journaled.',
        body: 'Every drill captures your reasoning. After ten sessions, Tickra surfaces the patterns in your own mistakes.',
      },
      tv: {
        title: 'TradingView, native.',
        body: 'The chart engine you already trust, embedded in every lesson. Same drawing tools, same data, zero context switching.',
      },
    },
  },
  metrics: {
    eyebrow: 'In the field',
    title: 'Learners. Lessons. Honesty.',
    body: 'No paper trading screenshots, no fabricated returns. The only numbers we publish are the ones a learning platform should be measured on.',
    items: [
      { value: '12,400+', label: 'Active learners' },
      { value: '92%', label: 'Finish the placement test' },
      { value: '4.8 / 5', label: 'Average lesson rating' },
      { value: '67', label: 'Countries reached' },
    ],
    footnote: 'Self‑reported figures, May 2026. Updated monthly.',
  },
  pricing: {
    eyebrow: 'Pricing',
    title: 'Pick how seriously you want to learn.',
    body: 'No trial games. Start free, upgrade when the streak proves you mean it.',
    plans: [
      {
        id: 'free',
        name: 'Free',
        price: '€0',
        cadence: 'forever',
        tagline: 'For the first week of curiosity.',
        cta: 'Start free',
        features: [
          'Placement test included',
          'First 12 lessons unlocked',
          '3 lives per day',
          'Streak tracking',
          'Lesson reviews with ads',
        ],
      },
      {
        id: 'pro',
        name: 'Pro',
        price: '€14.99',
        cadence: '/ month',
        tagline: 'For the daily learner.',
        cta: 'Go Pro',
        highlighted: true,
        features: [
          'All 127 lessons unlocked',
          'Unlimited lives, zero ads',
          'Pick any module, any time',
          'TradingView Pro embed',
          'Decision journal & post‑trade review',
          'Cancel anytime',
        ],
      },
      {
        id: 'lifetime',
        name: 'Lifetime',
        price: '€199',
        cadence: 'once',
        tagline: 'For the committed.',
        cta: 'Buy once',
        features: [
          'Everything in Pro',
          'All future modules included',
          'Private learner cohort',
          '14‑day money‑back guarantee',
        ],
      },
    ],
  },
  faq: {
    eyebrow: 'Questions',
    title: 'Honest answers.',
    items: [
      {
        q: 'Do I need a brokerage account to start?',
        a: 'No. The first sixty lessons run entirely inside Tickra on historical data. You only need a broker when you decide to graduate to live execution — and we walk you through choosing one.',
      },
      {
        q: 'Is Tickra a signal service?',
        a: 'No. We do not publish entries, exits, or recommendations. Tickra is a learning platform — the trades you take are yours, the reasoning is yours, the responsibility is yours.',
      },
      {
        q: 'How long until I can trade real money?',
        a: 'Most Pro learners reach the Risk Management capstone in 4–6 weeks. Whether you should trade then is a separate question — Tickra refuses to rush that decision.',
      },
      {
        q: 'Can I cancel anytime?',
        a: 'Yes. Pro is month‑to‑month, cancelled in two clicks. Lifetime is covered by a 14‑day money‑back guarantee, no email ping‑pong required.',
      },
      {
        q: 'Do you guarantee profits?',
        a: 'No serious teacher does. We guarantee a curriculum, a community, and the same drills professional desks use to onboard juniors. The rest is the market.',
      },
    ],
  },
  cta: {
    eyebrow: 'Begin',
    title: 'Read your first candle today.',
    body: 'Six questions, ninety seconds. Tickra finds where you stand and queues lesson one.',
    primary: 'Take the placement test',
    secondary: 'See pricing',
  },
  footer: {
    tagline: 'A trading curriculum, built like a craft.',
    columns: [
      {
        title: 'Product',
        links: [
          { label: 'Method', href: '#method' },
          { label: 'Curriculum', href: '#curriculum' },
          { label: 'Pricing', href: '/pricing' },
          { label: 'Changelog', href: '/changelog' },
        ],
      },
      {
        title: 'Company',
        links: [
          { label: 'About', href: '/about' },
          { label: 'Editorial', href: '/editorial' },
          { label: 'Contact', href: '/contact' },
        ],
      },
      {
        title: 'Legal',
        links: [
          { label: 'Terms', href: '/terms' },
          { label: 'Privacy', href: '/privacy' },
          { label: 'Risk disclosure', href: '/risk' },
        ],
      },
    ],
    risk:
      'Trading involves substantial risk of loss. Tickra is an educational platform; nothing on this site constitutes investment advice.',
    copyright: '© 2026 Tickra. All rights reserved.',
  },
  onboarding: {
    eyebrow: 'Placement test',
    title: 'Six questions, then a tailored start.',
    subtitle: 'Answer honestly. There is no grade, only a starting line.',
    progress: 'Question {current} of {total}',
    cta: { next: 'Next', back: 'Back', finish: 'See my level' },
    result: {
      novice: {
        label: 'Apprentice',
        body: 'You are starting from the candle itself — perfect. Tickra opens with a four‑lesson primer on what charts actually represent.',
        recommended: 'Lesson 01 · What a candle says',
      },
      intermediate: {
        label: 'Operator',
        body: 'You know the vocabulary. Tickra will skip the primer and start you on structure, support, and risk sizing.',
        recommended: 'Lesson 17 · Support, resistance, structure',
      },
      advanced: {
        label: 'Strategist',
        body: 'You are past the basics. Tickra routes you straight to multi‑timeframe analysis and capital allocation.',
        recommended: 'Lesson 64 · Multi‑timeframe context',
      },
    },
    questions: [
      {
        q: 'Have you ever placed a real trade with your own money?',
        choices: [
          { label: 'Never', weight: 0 },
          { label: 'A few times', weight: 1 },
          { label: 'Regularly for over a year', weight: 2 },
        ],
      },
      {
        q: 'A green Japanese candle means the price closed…',
        choices: [
          { label: 'Higher than it opened', weight: 2 },
          { label: 'Lower than it opened', weight: 0 },
          { label: 'I’m not sure', weight: 0 },
        ],
      },
      {
        q: 'A stop‑loss is used to…',
        choices: [
          { label: 'Cap how much you can lose on a trade', weight: 2 },
          { label: 'Guarantee a profit target', weight: 0 },
          { label: 'I’ve heard of it but never used one', weight: 1 },
        ],
      },
      {
        q: 'If you risk 1% per trade, after 10 consecutive losses your account is down roughly…',
        choices: [
          { label: '10%', weight: 1 },
          { label: '9.6%', weight: 2 },
          { label: '1%', weight: 0 },
        ],
      },
      {
        q: 'A bullish engulfing pattern is…',
        choices: [
          { label: 'Two candles where the second fully covers the first’s body', weight: 2 },
          { label: 'A single tall green candle', weight: 0 },
          { label: 'A horizontal level on the chart', weight: 0 },
        ],
      },
      {
        q: 'Before entering a trade, the first thing you decide is…',
        choices: [
          { label: 'The maximum loss you accept on this trade', weight: 2 },
          { label: 'The profit target', weight: 1 },
          { label: 'The size of the position', weight: 1 },
        ],
      },
    ],
  },
  dashboard: {
    eyebrow: 'Today',
    greeting: 'Welcome back.',
    subtitle: 'Ten minutes today keeps the streak alive.',
    streak: { label: 'Current streak', unit: 'days', best: 'Best · {n}' },
    xp: { label: 'Experience', toNext: '{n} XP to {level}' },
    level: 'Level {n}',
    lives: { label: 'Lives', empty: 'Out of lives — refill or wait until tomorrow.' },
    next: {
      label: 'Today’s lesson',
      cta: 'Resume lesson',
      duration: '8 min · Track 02',
    },
    map: {
      title: 'Your path',
      legend: { done: 'Completed', current: 'In progress', locked: 'Locked' },
    },
    activity: {
      title: 'Past seven days',
      caption: 'Minutes practised',
    },
  },
  lesson: {
    breadcrumb: 'Curriculum / Track 01 · Foundations',
    eyebrow: 'Lesson 04 · 12 minutes',
    title: 'Reading a Japanese candle.',
    intro:
      'A single candle is a compressed story: open, close, the highest price reached, the lowest one. Read four numbers and you read what 60 minutes of crowd behaviour looked like. This lesson trains the muscle.',
    anatomy: {
      title: 'Anatomy of a candle',
      caption: 'A bullish session: close above open. The body shows the trading range; wicks show rejected extremes.',
      labels: { high: 'High', low: 'Low', open: 'Open', close: 'Close', body: 'Body', wick: 'Wick' },
    },
    practice: {
      title: 'Practice on a live chart',
      body: 'Below, the same EUR/USD chart professional desks watch. Use TradingView’s drawing tools — they are the ones you will use in every future lesson.',
    },
    quiz: {
      title: 'Checkpoint',
      question: 'On a bullish candle, the body’s top is the…',
      choices: ['Open price', 'Close price', 'Highest price', 'Lowest price'],
      correct: 1,
      success: 'Correct — bullish closes are always above the open. The wick continues to the high.',
      retry: 'Not quite. Re‑read the anatomy and try again.',
    },
    paywall: {
      eyebrow: 'Pro lesson',
      title: 'Continue with the full lesson.',
      body: 'The remaining nine drills, the chart playback, and the checkpoint review are part of Tickra Pro.',
      primary: 'Unlock with Pro',
      secondary: 'See pricing',
    },
  },
  theme: { light: 'Switch to light theme', dark: 'Switch to dark theme' },
  locale: { switch: 'Change language' },
} as const;

export default en;
