import type { Lesson, LessonLevel, LessonTier, TrackId } from './types';

type LessonInput = Omit<Lesson, 'level' | 'tier'> & Partial<Pick<Lesson, 'level' | 'tier'>>;

function normalizeLesson(input: LessonInput, indexInArray: number): Lesson {
  // Free tier: the first 10 lessons in declaration order are always free.
  // Beyond that, paywalled lessons map to 'pro', the rest stay 'free'.
  const inferredTier: LessonTier =
    input.tier ?? (indexInArray < 10 ? 'free' : input.paywalled ? 'pro' : 'free');
  // Level inference: 'novice' for the first 6 lessons of a track,
  // 'intermediate' next 6, 'advanced' beyond.
  const inferredLevel: LessonLevel =
    input.level ?? (input.order <= 3 ? 'novice' : input.order <= 8 ? 'intermediate' : 'advanced');
  return {
    ...input,
    level: inferredLevel,
    tier: inferredTier,
    paywalled: inferredTier !== 'free',
  };
}

// ---------------------------------------------------------------------------
// 12 lessons across 5 tracks. The first three are free.
// Lesson "japanese-candles" mirrors the original Tickra demo lesson.
// ---------------------------------------------------------------------------
const RAW_LESSONS: LessonInput[] = [
  {
    slug: 'what-a-candle-says',
    track: 'foundations',
    order: 1,
    duration: 6,
    paywalled: false,
    title: { en: 'What a candle says.', fr: 'Ce qu’une bougie dit.' },
    eyebrow: { en: 'Lesson 01 · 6 minutes', fr: 'Leçon 01 · 6 minutes' },
    breadcrumb: {
      en: 'Curriculum / Track 01 · Foundations',
      fr: 'Parcours / Piste 01 · Fondations',
    },
    intro: {
      en: 'Before patterns and indicators, before strategy, there is one object: the candle. Four numbers, one minute (or hour, or day) of crowd behaviour, told as a shape. This lesson is the first reading.',
      fr: "Avant les figures et les indicateurs, avant la stratégie, il y a un objet : la bougie. Quatre nombres, une minute (ou heure, ou jour) de comportement de foule, racontés comme une forme. Cette leçon est la première lecture.",
    },
    blocks: [
      {
        kind: 'lede',
        text: {
          en: 'A candle is a sentence. The body is the verb, the wicks are the punctuation, the color tells you who won the round.',
          fr: 'Une bougie est une phrase. Le corps est le verbe, les mèches sont la ponctuation, la couleur dit qui a gagné le round.',
        },
      },
      { kind: 'anatomy' },
      {
        kind: 'paragraph',
        text: {
          en: 'Across this curriculum we will read thousands of candles. The drill is always the same: open, close, high, low. Four numbers, in this order, in this hierarchy.',
          fr: 'Dans ce cursus nous lirons des milliers de bougies. L’exercice est toujours le même : ouverture, clôture, plus haut, plus bas. Quatre nombres, dans cet ordre, dans cette hiérarchie.',
        },
      },
      {
        kind: 'quiz',
        question: {
          en: 'On a bullish candle, the body’s top is the…',
          fr: 'Sur une bougie haussière, le haut du corps est le…',
        },
        choices: {
          en: ['Open price', 'Close price', 'Highest price', 'Lowest price'],
          fr: ['Prix d’ouverture', 'Prix de clôture', 'Prix le plus haut', 'Prix le plus bas'],
        },
        correct: 1,
        success: {
          en: 'Correct — bullish closes are always above the open. The wick continues to the high.',
          fr: 'Correct — sur une bougie haussière, la clôture est toujours au‑dessus de l’ouverture. La mèche continue jusqu’au plus haut.',
        },
        retry: {
          en: 'Not quite. Re‑read the anatomy and try again.',
          fr: 'Pas tout à fait. Relisez l’anatomie et réessayez.',
        },
      },
    ],
  },
  {
    slug: 'bullish-and-bearish-bodies',
    track: 'foundations',
    order: 2,
    duration: 7,
    paywalled: false,
    title: { en: 'Bullish & bearish bodies.', fr: 'Corps haussiers et baissiers.' },
    eyebrow: { en: 'Lesson 02 · 7 minutes', fr: 'Leçon 02 · 7 minutes' },
    breadcrumb: {
      en: 'Curriculum / Track 01 · Foundations',
      fr: 'Parcours / Piste 01 · Fondations',
    },
    intro: {
      en: 'A green body means buyers ended the round on top. A red body means sellers did. The size of the body is the conviction of the side that won.',
      fr: 'Un corps vert signifie que les acheteurs ont fini la séance en tête. Un corps rouge, les vendeurs. La taille du corps est la conviction du camp qui l’a emporté.',
    },
    blocks: [
      {
        kind: 'paragraph',
        text: {
          en: 'Body length is not a magnitude of price — it is a magnitude of agreement. A wide green body says: from open to close, buyers never lost control.',
          fr: 'La longueur du corps n’est pas une magnitude de prix — c’est une magnitude d’accord. Un grand corps vert dit : de l’ouverture à la clôture, les acheteurs n’ont jamais perdu le contrôle.',
        },
      },
      {
        kind: 'callout',
        tone: 'info',
        title: { en: 'A heuristic', fr: 'Une heuristique' },
        text: {
          en: 'If the body covers more than 70% of the candle’s total range, the side that won was in clear control. Less than 30%, and the session was a fight.',
          fr: 'Si le corps couvre plus de 70 % de l’amplitude totale de la bougie, le camp gagnant avait le contrôle clair. Moins de 30 %, la séance a été un combat.',
        },
      },
      {
        kind: 'list',
        ordered: false,
        items: {
          en: [
            'Wide body, same color as the previous candle → continuation.',
            'Wide body, opposite color → reversal worth investigating.',
            'Thin body, both colors → indecision; wait.',
          ],
          fr: [
            'Grand corps, même couleur que la bougie précédente → continuation.',
            'Grand corps, couleur opposée → renversement à investiguer.',
            'Corps fin, deux couleurs → indécision ; attendre.',
          ],
        },
      },
      {
        kind: 'multi',
        question: {
          en: 'Which of these are signs of a strong bullish session?',
          fr: 'Lesquels de ces signes indiquent une séance haussière forte ?',
        },
        choices: {
          en: [
            'Wide green body covering > 70% of the range',
            'Close near the high of the session',
            'Tiny green body with a long upper wick',
            'Close higher than the previous candle',
          ],
          fr: [
            'Grand corps vert couvrant > 70 % de l’amplitude',
            'Clôture proche du plus haut de la séance',
            'Petit corps vert avec une longue mèche haute',
            'Clôture au‑dessus de la bougie précédente',
          ],
        },
        correct: [0, 1, 3],
        success: {
          en: 'Right. A wide body + close near the high + breaking the prior bar are aligned. A long upper wick is rejection, not strength.',
          fr: 'Exact. Grand corps + clôture proche du plus haut + cassure de la bougie précédente sont alignés. Une longue mèche haute est un rejet, pas de la force.',
        },
        retry: {
          en: 'A long upper wick is the market refusing the highs — that is not strength. Try again.',
          fr: 'Une longue mèche haute est un rejet des plus hauts — ce n’est pas de la force. Réessayez.',
        },
      },
    ],
  },
  {
    slug: 'wicks-the-rejected-extremes',
    track: 'foundations',
    order: 3,
    duration: 8,
    paywalled: false,
    title: { en: 'Wicks, the rejected extremes.', fr: 'Mèches, les extrêmes rejetés.' },
    eyebrow: { en: 'Lesson 03 · 8 minutes', fr: 'Leçon 03 · 8 minutes' },
    breadcrumb: {
      en: 'Curriculum / Track 01 · Foundations',
      fr: 'Parcours / Piste 01 · Fondations',
    },
    intro: {
      en: 'A wick is a price visited and refused. The longer the wick, the louder the refusal. This is where pin bars, hammers, and rejections are born.',
      fr: 'Une mèche est un prix visité et refusé. Plus la mèche est longue, plus le refus est fort. C’est ici que naissent pin bars, marteaux et rejets.',
    },
    blocks: [
      {
        kind: 'paragraph',
        text: {
          en: 'Read upper wicks as ceilings the market tested and walked away from. Read lower wicks as floors that absorbed selling and pushed back.',
          fr: 'Lisez les mèches hautes comme des plafonds que le marché a testés et quittés. Lisez les mèches basses comme des planchers qui ont absorbé la vente et repoussé.',
        },
      },
      {
        kind: 'callout',
        tone: 'warn',
        title: { en: 'Wicks lie at the edges', fr: 'Les mèches mentent aux extrémités' },
        text: {
          en: 'A single long wick on its own is data, not signal. We will spend the Patterns track learning when a long wick is a setup and when it is noise.',
          fr: 'Une longue mèche isolée est de la donnée, pas un signal. Nous passerons la piste Figures à apprendre quand une longue mèche est un setup et quand c’est du bruit.',
        },
      },
    ],
  },
  {
    slug: 'japanese-candles',
    track: 'foundations',
    order: 4,
    duration: 12,
    paywalled: true,
    title: { en: 'Reading a Japanese candle.', fr: 'Lire une bougie japonaise.' },
    eyebrow: { en: 'Lesson 04 · 12 minutes', fr: 'Leçon 04 · 12 minutes' },
    breadcrumb: {
      en: 'Curriculum / Track 01 · Foundations',
      fr: 'Parcours / Piste 01 · Fondations',
    },
    intro: {
      en: 'A single candle is a compressed story: open, close, the highest price reached, the lowest one. Read four numbers and you read what 60 minutes of crowd behaviour looked like. This lesson trains the muscle.',
      fr: "Une bougie est une histoire compressée : ouverture, clôture, plus haut atteint, plus bas atteint. Lisez quatre nombres et vous lisez ce qu'ont été 60 minutes de comportement de foule. Cette leçon entraîne ce muscle.",
    },
    blocks: [
      { kind: 'anatomy' },
      { kind: 'chart' },
      {
        kind: 'quiz',
        question: {
          en: 'On a bullish candle, the body’s top is the…',
          fr: 'Sur une bougie haussière, le haut du corps est le…',
        },
        choices: {
          en: ['Open price', 'Close price', 'Highest price', 'Lowest price'],
          fr: ['Prix d’ouverture', 'Prix de clôture', 'Prix le plus haut', 'Prix le plus bas'],
        },
        correct: 1,
        success: {
          en: 'Correct — bullish closes are always above the open. The wick continues to the high.',
          fr: 'Correct — sur une bougie haussière, la clôture est toujours au‑dessus de l’ouverture. La mèche continue jusqu’au plus haut.',
        },
        retry: {
          en: 'Not quite. Re‑read the anatomy and try again.',
          fr: 'Pas tout à fait. Relisez l’anatomie et réessayez.',
        },
      },
    ],
  },
  {
    slug: 'support-resistance-structure',
    track: 'structure',
    order: 1,
    duration: 11,
    paywalled: true,
    title: { en: 'Support, resistance, structure.', fr: 'Supports, résistances, structure.' },
    eyebrow: { en: 'Lesson 17 · 11 minutes', fr: 'Leçon 17 · 11 minutes' },
    breadcrumb: { en: 'Curriculum / Track 02 · Structure', fr: 'Parcours / Piste 02 · Structure' },
    intro: {
      en: 'Markets are not random. They build memory at specific prices — the levels where buyers or sellers historically showed up. Read structure before you read any pattern.',
      fr: 'Les marchés ne sont pas aléatoires. Ils construisent une mémoire à des prix précis — les niveaux où acheteurs ou vendeurs sont historiquement apparus. Lisez la structure avant la moindre figure.',
    },
    blocks: [
      {
        kind: 'lede',
        text: {
          en: 'A level is not a line. It is a zone — the band of prices the market remembers.',
          fr: 'Un niveau n’est pas une ligne. C’est une zone — la bande de prix dont le marché se souvient.',
        },
      },
      { kind: 'chart' },
      {
        kind: 'list',
        ordered: true,
        items: {
          en: [
            'Identify swing highs and swing lows on the higher timeframe first.',
            'Mark zones, not lines — draw a 0.1% band around the price.',
            'Wait for the market to revisit. The level is only a level on the second touch.',
          ],
          fr: [
            'Identifiez d’abord les swing highs et swing lows sur le timeframe supérieur.',
            'Marquez des zones, pas des lignes — tracez une bande de 0,1 % autour du prix.',
            'Attendez que le marché revienne. Le niveau n’est confirmé qu’au second touch.',
          ],
        },
      },
      {
        kind: 'match',
        question: {
          en: 'Match each structure term with its definition.',
          fr: 'Associez chaque terme de structure à sa définition.',
        },
        pairs: {
          en: [
            { term: 'Support', definition: 'Zone where buyers historically absorb selling pressure.' },
            { term: 'Resistance', definition: 'Zone where sellers historically cap a rally.' },
            { term: 'Swing high', definition: 'Local peak with lower bars on both sides.' },
            { term: 'Breakout', definition: 'Decisive close beyond a confirmed level.' },
          ],
          fr: [
            { term: 'Support', definition: 'Zone où les acheteurs absorbent historiquement la vente.' },
            { term: 'Résistance', definition: 'Zone où les vendeurs plafonnent historiquement une hausse.' },
            { term: 'Swing high', definition: 'Pic local entouré de barres plus basses des deux côtés.' },
            { term: 'Breakout', definition: 'Clôture décisive au‑delà d’un niveau confirmé.' },
          ],
        },
        success: {
          en: 'All four matched. You now have the grammar for the rest of this track.',
          fr: 'Les quatre sont corrects. Vous avez désormais la grammaire pour le reste de cette piste.',
        },
        retry: {
          en: 'Read each definition twice before pairing — the wording is precise on purpose.',
          fr: 'Relisez chaque définition deux fois avant d’associer — la formulation est précise volontairement.',
        },
      },
    ],
  },
  {
    slug: 'higher-highs-lower-lows',
    track: 'structure',
    order: 2,
    duration: 9,
    paywalled: true,
    title: { en: 'Higher highs, lower lows.', fr: 'Plus hauts, plus bas.' },
    eyebrow: { en: 'Lesson 18 · 9 minutes', fr: 'Leçon 18 · 9 minutes' },
    breadcrumb: { en: 'Curriculum / Track 02 · Structure', fr: 'Parcours / Piste 02 · Structure' },
    intro: {
      en: 'Trends have a grammar. Uptrend: each swing high prints above the last, each pullback bottoms above the previous one. Downtrend: the mirror. Anything else is a range.',
      fr: 'Les tendances ont une grammaire. Haussière : chaque swing high est au‑dessus du précédent, chaque repli touche au‑dessus du dernier creux. Baissière : le miroir. Tout le reste est un range.',
    },
    blocks: [
      {
        kind: 'paragraph',
        text: {
          en: 'When a trend breaks its own grammar — a higher high failing to print, then a lower low arriving — the regime has changed. That signal is more important than any indicator.',
          fr: 'Quand une tendance brise sa propre grammaire — un plus haut qui ne se forme pas, puis un plus bas qui arrive — le régime a changé. Ce signal compte plus que n’importe quel indicateur.',
        },
      },
    ],
  },
  {
    slug: 'bullish-engulfing',
    track: 'patterns',
    order: 1,
    duration: 10,
    paywalled: true,
    title: { en: 'The bullish engulfing.', fr: 'L’avalement haussier.' },
    eyebrow: { en: 'Lesson 31 · 10 minutes', fr: 'Leçon 31 · 10 minutes' },
    breadcrumb: { en: 'Curriculum / Track 03 · Patterns', fr: 'Parcours / Piste 03 · Figures' },
    intro: {
      en: 'Two candles, a red one followed by a green one whose body fully covers the previous body. In the right context, this is one of the cleanest reversal patterns.',
      fr: 'Deux bougies, une rouge suivie d’une verte dont le corps couvre entièrement le corps précédent. Dans le bon contexte, c’est l’une des figures de retournement les plus claires.',
    },
    blocks: [
      {
        kind: 'callout',
        tone: 'info',
        title: { en: 'Context first', fr: 'Le contexte d’abord' },
        text: {
          en: 'A bullish engulfing in the middle of a range is noise. A bullish engulfing at the second touch of a major demand zone is a setup.',
          fr: 'Un avalement haussier en milieu de range est du bruit. Un avalement haussier au second touch d’une zone de demande majeure est un setup.',
        },
      },
    ],
  },
  {
    slug: 'pin-bars-rejections',
    track: 'patterns',
    order: 2,
    duration: 10,
    paywalled: true,
    title: { en: 'Pin bars and rejections.', fr: 'Pin bars et rejets.' },
    eyebrow: { en: 'Lesson 32 · 10 minutes', fr: 'Leçon 32 · 10 minutes' },
    breadcrumb: { en: 'Curriculum / Track 03 · Patterns', fr: 'Parcours / Piste 03 · Figures' },
    intro: {
      en: 'A pin bar is a single candle with a long wick and a tiny body — a market that tried to push past a level and got slapped back. Read it as a refusal, not a target.',
      fr: "Un pin bar est une bougie unique à longue mèche et corps minuscule — un marché qui a tenté de franchir un niveau et s'est fait repousser. Lisez‑le comme un refus, pas comme une cible.",
    },
    blocks: [
      { kind: 'chart' },
    ],
  },
  {
    slug: 'position-sizing',
    track: 'risk',
    order: 1,
    duration: 14,
    paywalled: true,
    title: { en: 'Position sizing.', fr: 'Taille de position.' },
    eyebrow: { en: 'Lesson 51 · 14 minutes', fr: 'Leçon 51 · 14 minutes' },
    breadcrumb: { en: 'Curriculum / Track 04 · Risk', fr: 'Parcours / Piste 04 · Risque' },
    intro: {
      en: 'There is one calculation that matters before any trade: what fraction of the account is at risk. Everything else is downstream.',
      fr: 'Il y a un seul calcul qui compte avant tout trade : quelle fraction du compte est en risque. Tout le reste en découle.',
    },
    blocks: [
      {
        kind: 'lede',
        text: {
          en: 'Position size = (account × risk %) / stop distance. Memorise the equation. Practise it before every entry.',
          fr: 'Taille de position = (compte × risque %) / distance au stop. Apprenez la formule. Pratiquez‑la avant chaque entrée.',
        },
      },
      {
        kind: 'callout',
        tone: 'warn',
        title: { en: 'Why 1% is not a rule', fr: 'Pourquoi 1 % n’est pas une règle' },
        text: {
          en: 'Risking 1% per trade is a calibration default. Once you know your win rate and your expectancy, you should re‑derive your own number.',
          fr: 'Risquer 1 % par trade est un défaut de calibrage. Une fois que vous connaissez votre taux de réussite et votre espérance, vous devez redériver votre propre chiffre.',
        },
      },
    ],
  },
  {
    slug: 'stop-placement',
    track: 'risk',
    order: 2,
    duration: 11,
    paywalled: true,
    title: { en: 'Stop placement.', fr: 'Placement du stop.' },
    eyebrow: { en: 'Lesson 52 · 11 minutes', fr: 'Leçon 52 · 11 minutes' },
    breadcrumb: { en: 'Curriculum / Track 04 · Risk', fr: 'Parcours / Piste 04 · Risque' },
    intro: {
      en: 'A stop is not a number — it is the question "at what price has this trade become wrong?". Place it where the thesis breaks, not where the loss feels comfortable.',
      fr: 'Un stop n’est pas un nombre — c’est la question « à quel prix ce trade est‑il devenu faux ? ». Placez‑le là où la thèse casse, pas là où la perte est confortable.',
    },
    blocks: [
      {
        kind: 'list',
        ordered: false,
        items: {
          en: [
            'Stops belong on the other side of the level you traded — never inside.',
            'Add a small buffer for noise, not for hope.',
            'If the stop is too far for your risk budget, reduce the position; do not move the stop.',
          ],
          fr: [
            'Les stops vont de l’autre côté du niveau tradé — jamais dedans.',
            'Ajoutez une petite marge pour le bruit, pas pour l’espoir.',
            'Si le stop est trop loin pour votre budget de risque, réduisez la position ; ne déplacez pas le stop.',
          ],
        },
      },
    ],
  },
  {
    slug: 'expectancy',
    track: 'risk',
    order: 3,
    duration: 12,
    paywalled: true,
    title: { en: 'Expectancy.', fr: 'Espérance.' },
    eyebrow: { en: 'Lesson 53 · 12 minutes', fr: 'Leçon 53 · 12 minutes' },
    breadcrumb: { en: 'Curriculum / Track 04 · Risk', fr: 'Parcours / Piste 04 · Risque' },
    intro: {
      en: 'Expectancy is the only metric that survives bad luck. Win rate × average win − loss rate × average loss. Run it on every strategy before you scale it.',
      fr: 'L’espérance est la seule métrique qui survit à la malchance. Taux de réussite × gain moyen − taux de perte × perte moyenne. Calculez‑la sur chaque stratégie avant de la scaler.',
    },
    blocks: [
      {
        kind: 'callout',
        tone: 'info',
        title: { en: 'A craft, not a slogan', fr: 'Un métier, pas un slogan' },
        text: {
          en: 'Two strategies with a 40% win rate can have radically different expectancies. One scales, the other ruins. The arithmetic is short — do it.',
          fr: 'Deux stratégies à 40 % de réussite peuvent avoir des espérances radicalement différentes. L’une scale, l’autre ruine. L’arithmétique est courte — faites‑la.',
        },
      },
    ],
  },
  {
    slug: 'order-types',
    track: 'execution',
    order: 1,
    duration: 9,
    paywalled: true,
    title: { en: 'Order types.', fr: 'Types d’ordres.' },
    eyebrow: { en: 'Lesson 71 · 9 minutes', fr: 'Leçon 71 · 9 minutes' },
    breadcrumb: { en: 'Curriculum / Track 05 · Execution', fr: 'Parcours / Piste 05 · Exécution' },
    intro: {
      en: 'Market, limit, stop, stop‑limit. Four order types cover ninety‑five percent of execution. Knowing when to use which is half of execution discipline.',
      fr: 'Market, limit, stop, stop‑limit. Quatre types d’ordres couvrent quatre‑vingt‑quinze pour cent de l’exécution. Savoir quand utiliser lequel, c’est la moitié de la discipline d’exécution.',
    },
    blocks: [
      {
        kind: 'list',
        ordered: true,
        items: {
          en: [
            'Market — buy or sell now at the best available price. Use sparingly.',
            'Limit — buy below market or sell above market at a fixed price.',
            'Stop — fires a market order when price crosses a threshold.',
            'Stop‑limit — fires a limit order when price crosses a threshold. Beware of gaps.',
          ],
          fr: [
            'Market — achat ou vente immédiat au meilleur prix disponible. À utiliser avec parcimonie.',
            'Limit — achat sous le marché ou vente au‑dessus à un prix fixe.',
            'Stop — déclenche un ordre market quand le prix franchit un seuil.',
            'Stop‑limit — déclenche un ordre limit quand le prix franchit un seuil. Attention aux gaps.',
          ],
        },
      },
      {
        kind: 'order',
        question: {
          en: 'Arrange the steps of a disciplined market entry, top to bottom.',
          fr: 'Classez les étapes d’une entrée en marché disciplinée, de haut en bas.',
        },
        items: {
          en: [
            'Define the maximum loss you accept on this trade.',
            'Compute position size from that loss and the stop distance.',
            'Place the order with the calculated size.',
            'Write the thesis in your journal before clicking Buy.',
          ],
          fr: [
            'Définir la perte maximale acceptée sur ce trade.',
            'Calculer la taille de position à partir de cette perte et de la distance au stop.',
            'Passer l’ordre avec la taille calculée.',
            'Écrire la thèse dans votre journal avant de cliquer sur Acheter.',
          ],
        },
        success: {
          en: 'Right. Risk first, math second, journal third, execution last. Anything else is improvisation.',
          fr: 'Exact. Risque d’abord, calcul ensuite, journal troisième, exécution en dernier. Le reste est de l’improvisation.',
        },
        retry: {
          en: 'Risk and sizing always come before execution. Try again.',
          fr: 'Le risque et le sizing viennent toujours avant l’exécution. Réessayez.',
        },
      },
    ],
  },

  // ==========================================================================
  // FOUNDATIONS — extension (lessons 05–06)
  // ==========================================================================
  {
    slug: 'timeframes-explained',
    track: 'foundations',
    order: 5,
    duration: 9,
    paywalled: true,
    title: { en: 'Timeframes, explained.', fr: 'Les timeframes, expliqués.' },
    eyebrow: { en: 'Lesson 05 · 9 minutes', fr: 'Leçon 05 · 9 minutes' },
    breadcrumb: { en: 'Curriculum / Track 01 · Foundations', fr: 'Parcours / Piste 01 · Fondations' },
    intro: {
      en: 'A candle on a 1-hour chart compresses sixty 1-minute candles into one shape. Same market, different lens. Pick the lens before you read.',
      fr: 'Une bougie sur un graphique 1 heure compresse soixante bougies de 1 minute en une seule forme. Même marché, autre objectif. Choisissez l’objectif avant de lire.',
    },
    blocks: [
      {
        kind: 'lede',
        text: {
          en: 'The right timeframe is the one that matches the duration of your trade. Not the other way around.',
          fr: 'Le bon timeframe est celui qui correspond à la durée de votre trade. Pas l’inverse.',
        },
      },
      {
        kind: 'list',
        ordered: false,
        items: {
          en: [
            'Daily / Weekly — investors, position traders, multi-week holds.',
            '4h / 1h — swing traders, multi-day holds.',
            '15m / 5m — intraday traders, hours-long holds.',
            '1m — scalpers and execution refinement.',
          ],
          fr: [
            'Quotidien / Hebdomadaire — investisseurs, traders de position, durées multi‑semaines.',
            '4h / 1h — swing traders, durées multi‑jours.',
            '15m / 5m — traders intraday, durées de quelques heures.',
            '1m — scalpers et affinage d’exécution.',
          ],
        },
      },
      {
        kind: 'quiz',
        question: {
          en: 'A swing trader who holds for three days should primarily decide on the…',
          fr: 'Un swing trader qui garde une position trois jours devrait principalement décider sur le…',
        },
        choices: {
          en: ['1-minute chart', '15-minute chart', '4-hour chart', 'Daily chart'],
          fr: ['Graphique 1 minute', 'Graphique 15 minutes', 'Graphique 4 heures', 'Graphique quotidien'],
        },
        correct: 2,
        success: {
          en: 'The 4-hour chart matches a multi-day swing horizon — granular enough to see structure, slow enough to avoid noise.',
          fr: 'Le 4h correspond à un horizon swing multi‑jours — assez granulaire pour voir la structure, assez lent pour éviter le bruit.',
        },
        retry: {
          en: 'Match the chart to the holding period. A three-day hold is too long for intraday and too short for the daily.',
          fr: 'Adaptez le graphique à la durée de détention. Trois jours, c’est trop long pour l’intraday et trop court pour le quotidien.',
        },
      },
    ],
  },
  {
    slug: 'reading-a-session',
    track: 'foundations',
    order: 6,
    duration: 10,
    paywalled: true,
    title: { en: 'Reading a full session.', fr: 'Lire une séance entière.' },
    eyebrow: { en: 'Lesson 06 · 10 minutes', fr: 'Leçon 06 · 10 minutes' },
    breadcrumb: { en: 'Curriculum / Track 01 · Foundations', fr: 'Parcours / Piste 01 · Fondations' },
    intro: {
      en: 'Beyond a single candle: how do dozens of them, strung together, tell the story of one trading day?',
      fr: 'Au‑delà d’une bougie unique : comment des dizaines, mises bout à bout, racontent l’histoire d’une journée de trading ?',
    },
    blocks: [
      { kind: 'chart' },
      {
        kind: 'order',
        question: {
          en: 'Order the four phases of a typical FX trading day.',
          fr: 'Classez les quatre phases d’une journée FX typique.',
        },
        items: {
          en: [
            'Asia session — low volatility, range establishment.',
            'London open — sharp directional move on European data.',
            'NY overlap — peak liquidity, biggest swings of the day.',
            'NY close — gradual fade, position squaring.',
          ],
          fr: [
            'Séance asiatique — faible volatilité, établissement du range.',
            'Ouverture de Londres — mouvement directionnel net sur les données européennes.',
            'Recouvrement NY — pic de liquidité, plus grands swings de la journée.',
            'Clôture NY — fade graduel, rééquilibrage des positions.',
          ],
        },
        success: {
          en: 'Right. The day breathes in this rhythm — read every session as a chapter.',
          fr: 'Exact. La journée respire à ce rythme — lisez chaque séance comme un chapitre.',
        },
        retry: {
          en: 'Think geographically: Asia → Europe → America → back to Asia.',
          fr: 'Pensez géographique : Asie → Europe → Amérique → retour Asie.',
        },
      },
    ],
  },

  // ==========================================================================
  // STRUCTURE — extension (lessons 03–05)
  // ==========================================================================
  {
    slug: 'multi-timeframe-context',
    track: 'structure',
    order: 3,
    duration: 12,
    paywalled: true,
    title: { en: 'Multi‑timeframe context.', fr: 'Contexte multi‑temporel.' },
    eyebrow: { en: 'Lesson 19 · 12 minutes', fr: 'Leçon 19 · 12 minutes' },
    breadcrumb: { en: 'Curriculum / Track 02 · Structure', fr: 'Parcours / Piste 02 · Structure' },
    intro: {
      en: 'A trade lives on three timeframes: the one that gives context, the one that gives the setup, the one that gives the trigger.',
      fr: 'Un trade vit sur trois timeframes : celui qui donne le contexte, celui qui donne le setup, celui qui donne le déclencheur.',
    },
    blocks: [
      {
        kind: 'callout',
        tone: 'info',
        title: { en: 'The triple-screen rule', fr: 'La règle des trois écrans' },
        text: {
          en: 'Context = highest timeframe (trend). Setup = middle (level + pattern). Trigger = lowest (entry confirmation). Always read top‑down.',
          fr: 'Contexte = timeframe le plus élevé (tendance). Setup = intermédiaire (niveau + figure). Trigger = le plus bas (confirmation d’entrée). Toujours lire de haut en bas.',
        },
      },
      {
        kind: 'multi',
        question: {
          en: 'For a 4-hour swing trade, which timeframes make a coherent triple-screen?',
          fr: 'Pour un swing 4h, quels timeframes forment un triple‑écran cohérent ?',
        },
        choices: {
          en: ['Daily', '4-hour', '15-minute', '1-minute'],
          fr: ['Quotidien', '4 heures', '15 minutes', '1 minute'],
        },
        correct: [0, 1, 2],
        success: {
          en: 'Daily for context, 4h for setup, 15m for trigger. The 1-minute would be over-resolved noise.',
          fr: 'Quotidien pour le contexte, 4h pour le setup, 15m pour le trigger. Le 1 minute serait du bruit sur‑résolu.',
        },
        retry: {
          en: 'Roughly factor-of-4 between layers works best. 1-minute is too granular for a 4-hour decision.',
          fr: 'Un facteur d’environ 4 entre les couches fonctionne le mieux. Le 1 minute est trop granulaire pour une décision 4h.',
        },
      },
    ],
  },
  {
    slug: 'trend-vs-range',
    track: 'structure',
    order: 4,
    duration: 10,
    paywalled: true,
    title: { en: 'Trend vs range.', fr: 'Tendance vs range.' },
    eyebrow: { en: 'Lesson 20 · 10 minutes', fr: 'Leçon 20 · 10 minutes' },
    breadcrumb: { en: 'Curriculum / Track 02 · Structure', fr: 'Parcours / Piste 02 · Structure' },
    intro: {
      en: 'Markets spend roughly 70% of time in ranges and 30% in trends. The same setup is a winner in one regime and a loser in the other.',
      fr: 'Les marchés passent environ 70 % du temps en range et 30 % en tendance. Le même setup est gagnant dans un régime, perdant dans l’autre.',
    },
    blocks: [
      {
        kind: 'list',
        ordered: false,
        items: {
          en: [
            'In a trend → trade pullbacks toward the trend direction.',
            'In a range → trade rejections at the range extremes.',
            'At a regime change → wait. The first move out of a range is rarely the right one to chase.',
          ],
          fr: [
            'En tendance → tradez les pullbacks dans le sens de la tendance.',
            'En range → tradez les rejets aux extrémités du range.',
            'Au changement de régime → attendez. Le premier mouvement hors d’un range est rarement le bon à chasser.',
          ],
        },
      },
    ],
  },
  {
    slug: 'liquidity-zones',
    track: 'structure',
    order: 5,
    duration: 11,
    paywalled: true,
    title: { en: 'Liquidity zones.', fr: 'Zones de liquidité.' },
    eyebrow: { en: 'Lesson 21 · 11 minutes', fr: 'Leçon 21 · 11 minutes' },
    breadcrumb: { en: 'Curriculum / Track 02 · Structure', fr: 'Parcours / Piste 02 · Structure' },
    intro: {
      en: 'Liquidity sits where stops are stacked: above swing highs, below swing lows. Institutions trade around it; retail trades into it.',
      fr: 'La liquidité s’accumule là où les stops sont empilés : au‑dessus des swing highs, sous les swing lows. Les institutionnels tradent autour ; le retail trade dedans.',
    },
    blocks: [
      {
        kind: 'callout',
        tone: 'warn',
        title: { en: 'Stop hunts are real', fr: 'Les chasses au stop existent' },
        text: {
          en: 'A sudden spike beyond a known swing followed by a sharp reversal often signals liquidity being collected before the real move.',
          fr: 'Un pic soudain au‑delà d’un swing connu suivi d’un retournement brutal signale souvent une collecte de liquidité avant le vrai mouvement.',
        },
      },
    ],
  },

  // ==========================================================================
  // PATTERNS — extension (lessons 03–06)
  // ==========================================================================
  {
    slug: 'double-top-bottom',
    track: 'patterns',
    order: 3,
    duration: 10,
    paywalled: true,
    title: { en: 'Double top, double bottom.', fr: 'Double top, double bottom.' },
    eyebrow: { en: 'Lesson 33 · 10 minutes', fr: 'Leçon 33 · 10 minutes' },
    breadcrumb: { en: 'Curriculum / Track 03 · Patterns', fr: 'Parcours / Piste 03 · Figures' },
    intro: {
      en: 'Two failed attempts to break a level, separated by a meaningful pullback. Classic for a reason: it captures genuine exhaustion.',
      fr: 'Deux tentatives échouées de casser un niveau, séparées par un pullback significatif. Classique pour une raison : elle capture une vraie capitulation.',
    },
    blocks: [
      {
        kind: 'order',
        question: {
          en: 'Order the four phases of a textbook double top.',
          fr: 'Classez les quatre phases d’un double top de manuel.',
        },
        items: {
          en: [
            'Price reaches a resistance and prints the first peak.',
            'Price pulls back to a clear neckline.',
            'Price retests the resistance and prints the second peak, lower or equal.',
            'Price breaks the neckline — confirmation of the pattern.',
          ],
          fr: [
            'Le prix atteint une résistance et imprime le premier sommet.',
            'Le prix rebaisse vers une encolure (neckline) claire.',
            'Le prix retest la résistance et imprime le second sommet, plus bas ou égal.',
            'Le prix casse l’encolure — confirmation de la figure.',
          ],
        },
        success: {
          en: 'Exactly. Without the neckline break, you have two failed attempts — not a confirmed pattern.',
          fr: 'Exactement. Sans la cassure de l’encolure, vous avez deux tentatives échouées — pas une figure confirmée.',
        },
        retry: {
          en: 'The neckline break is always last. Without it, the pattern is incomplete.',
          fr: 'La cassure de l’encolure est toujours la dernière étape. Sans elle, la figure est incomplète.',
        },
      },
    ],
  },
  {
    slug: 'head-and-shoulders',
    track: 'patterns',
    order: 4,
    duration: 11,
    paywalled: true,
    title: { en: 'Head and shoulders.', fr: 'Tête‑épaules.' },
    eyebrow: { en: 'Lesson 34 · 11 minutes', fr: 'Leçon 34 · 11 minutes' },
    breadcrumb: { en: 'Curriculum / Track 03 · Patterns', fr: 'Parcours / Piste 03 · Figures' },
    intro: {
      en: 'Three peaks. The middle one is the head, the outer two are the shoulders. Inverted, it’s the most reliable bottom reversal pattern in the book.',
      fr: 'Trois sommets. Celui du milieu est la tête, les deux extérieurs sont les épaules. Inversée, c’est la figure de retournement bas la plus fiable du manuel.',
    },
    blocks: [
      {
        kind: 'paragraph',
        text: {
          en: 'The pattern measures itself: the projected move after the neckline break is roughly equal to the height between the head and the neckline.',
          fr: 'La figure se mesure elle‑même : le mouvement projeté après la cassure de l’encolure est environ égal à la hauteur entre la tête et l’encolure.',
        },
      },
    ],
  },
  {
    slug: 'flags-and-pennants',
    track: 'patterns',
    order: 5,
    duration: 9,
    paywalled: true,
    title: { en: 'Flags and pennants.', fr: 'Drapeaux et fanions.' },
    eyebrow: { en: 'Lesson 35 · 9 minutes', fr: 'Leçon 35 · 9 minutes' },
    breadcrumb: { en: 'Curriculum / Track 03 · Patterns', fr: 'Parcours / Piste 03 · Figures' },
    intro: {
      en: 'Brief consolidations inside a strong trend. The pole is the impulse, the flag is the pause. The market exhales, then resumes.',
      fr: 'Brèves consolidations à l’intérieur d’une tendance forte. Le mât est l’impulsion, le drapeau est la pause. Le marché expire, puis reprend.',
    },
    blocks: [
      {
        kind: 'callout',
        tone: 'info',
        title: { en: 'Time matters', fr: 'Le temps compte' },
        text: {
          en: 'A healthy flag resolves within 5–15 candles. If consolidation drags beyond that, the impulse is losing energy — the breakout will be weaker.',
          fr: 'Un drapeau sain se résout en 5 à 15 bougies. Si la consolidation traîne au‑delà, l’impulsion perd de l’énergie — la cassure sera plus faible.',
        },
      },
    ],
  },
  {
    slug: 'channel-trading',
    track: 'patterns',
    order: 6,
    duration: 10,
    paywalled: true,
    title: { en: 'Trading inside a channel.', fr: 'Trader dans un canal.' },
    eyebrow: { en: 'Lesson 36 · 10 minutes', fr: 'Leçon 36 · 10 minutes' },
    breadcrumb: { en: 'Curriculum / Track 03 · Patterns', fr: 'Parcours / Piste 03 · Figures' },
    intro: {
      en: 'Two parallel trendlines containing price action. While they hold, you can trade them. When they break, you wait.',
      fr: 'Deux lignes de tendance parallèles contenant l’action des prix. Tant qu’elles tiennent, vous pouvez les trader. Quand elles cassent, vous attendez.',
    },
    blocks: [
      {
        kind: 'quiz',
        question: {
          en: 'In a clean ascending channel, the safest entry is near the…',
          fr: 'Dans un canal ascendant propre, l’entrée la plus sûre est près de la…',
        },
        choices: {
          en: ['Upper trendline', 'Middle of the channel', 'Lower trendline', 'Outside the channel'],
          fr: ['Ligne de tendance supérieure', 'Milieu du canal', 'Ligne de tendance inférieure', 'Hors du canal'],
        },
        correct: 2,
        success: {
          en: 'Right. Buy at the lower trendline, where risk is defined and reward extends to the upper one.',
          fr: 'Exact. Achetez à la ligne basse, où le risque est défini et la cible va jusqu’à la ligne haute.',
        },
        retry: {
          en: 'Always trade with the trend, into the trend. Buying at the upper line is buying into resistance.',
          fr: 'Tradez toujours dans le sens de la tendance, vers la tendance. Acheter en haut, c’est acheter dans la résistance.',
        },
      },
    ],
  },

  // ==========================================================================
  // RISK — extension (lessons 04–06)
  // ==========================================================================
  {
    slug: 'risk-reward-ratio',
    track: 'risk',
    order: 4,
    duration: 10,
    paywalled: true,
    title: { en: 'Risk / reward ratio.', fr: 'Ratio risque / récompense.' },
    eyebrow: { en: 'Lesson 54 · 10 minutes', fr: 'Leçon 54 · 10 minutes' },
    breadcrumb: { en: 'Curriculum / Track 04 · Risk', fr: 'Parcours / Piste 04 · Risque' },
    intro: {
      en: 'A 1:2 R/R means you risk one unit to make two. Combined with win rate, it defines whether your strategy survives a losing streak.',
      fr: 'Un R/R 1:2 signifie risquer une unité pour en gagner deux. Combiné au taux de réussite, il définit si votre stratégie survit à une série perdante.',
    },
    blocks: [
      {
        kind: 'quiz',
        question: {
          en: 'With a 1:3 R/R, what minimum win rate keeps your account breakeven?',
          fr: 'Avec un R/R de 1:3, quel taux de réussite minimum maintient le compte à l’équilibre ?',
        },
        choices: { en: ['25%', '33%', '50%', '66%'], fr: ['25 %', '33 %', '50 %', '66 %'] },
        correct: 0,
        success: {
          en: 'Exactly 25%. Win 1 in 4 at 1:3 R/R and you break even before costs.',
          fr: 'Exactement 25 %. Gagner 1 sur 4 à 1:3 R/R et vous êtes à l’équilibre avant les coûts.',
        },
        retry: {
          en: 'Breakeven win rate = 1 / (1 + R/R). For 1:3, that’s 1/4 = 25%.',
          fr: 'Taux de réussite à l’équilibre = 1 / (1 + R/R). Pour 1:3, c’est 1/4 = 25 %.',
        },
      },
    ],
  },
  {
    slug: 'drawdown-management',
    track: 'risk',
    order: 5,
    duration: 11,
    paywalled: true,
    title: { en: 'Drawdown management.', fr: 'Gestion du drawdown.' },
    eyebrow: { en: 'Lesson 55 · 11 minutes', fr: 'Leçon 55 · 11 minutes' },
    breadcrumb: { en: 'Curriculum / Track 04 · Risk', fr: 'Parcours / Piste 04 · Risque' },
    intro: {
      en: 'A 20% drawdown requires a 25% gain to recover. A 50% drawdown requires 100%. Math punishes carelessness asymmetrically.',
      fr: 'Un drawdown de 20 % nécessite 25 % de gain pour récupérer. 50 % nécessite 100 %. Les maths punissent l’imprudence de façon asymétrique.',
    },
    blocks: [
      {
        kind: 'callout',
        tone: 'warn',
        title: { en: 'Hard rule', fr: 'Règle dure' },
        text: {
          en: 'If you’re down 10% on the month, halve your position size for the rest of the month. Recovery is mathematically harder than preservation.',
          fr: 'Si vous êtes à −10 % sur le mois, divisez par deux votre taille de position pour le reste du mois. La récupération est mathématiquement plus dure que la préservation.',
        },
      },
    ],
  },
  {
    slug: 'risk-of-ruin',
    track: 'risk',
    order: 6,
    duration: 12,
    paywalled: true,
    title: { en: 'Risk of ruin.', fr: 'Risque de ruine.' },
    eyebrow: { en: 'Lesson 56 · 12 minutes', fr: 'Leçon 56 · 12 minutes' },
    breadcrumb: { en: 'Curriculum / Track 04 · Risk', fr: 'Parcours / Piste 04 · Risque' },
    intro: {
      en: 'The probability of zeroing your account given your win rate, R/R, and per‑trade risk. Most retail traders never compute it. They should.',
      fr: 'La probabilité de ramener votre compte à zéro étant donné votre taux de réussite, R/R, et risque par trade. La plupart des traders particuliers ne la calculent jamais. Ils devraient.',
    },
    blocks: [
      {
        kind: 'paragraph',
        text: {
          en: 'A 55% win rate with 1:1 R/R sounds safe. Risk 5% per trade and the probability of ruin over 200 trades is roughly 2.5%. Risk 10% and it jumps to 20%+.',
          fr: 'Un taux de 55 % à 1:1 R/R semble sûr. Risquez 5 % par trade et la probabilité de ruine sur 200 trades est d’environ 2,5 %. Risquez 10 % et elle monte à plus de 20 %.',
        },
      },
    ],
  },

  // ==========================================================================
  // EXECUTION — extension (lessons 02–04)
  // ==========================================================================
  {
    slug: 'broker-mechanics',
    track: 'execution',
    order: 2,
    duration: 10,
    paywalled: true,
    title: { en: 'Broker mechanics.', fr: 'Mécanique du broker.' },
    eyebrow: { en: 'Lesson 72 · 10 minutes', fr: 'Leçon 72 · 10 minutes' },
    breadcrumb: { en: 'Curriculum / Track 05 · Execution', fr: 'Parcours / Piste 05 · Exécution' },
    intro: {
      en: 'Spread, slippage, commission, swap. The four costs every trade carries. Ignore them and your expectancy quietly turns negative.',
      fr: 'Spread, slippage, commission, swap. Les quatre coûts que tout trade supporte. Ignorez‑les et votre espérance devient discrètement négative.',
    },
    blocks: [
      {
        kind: 'match',
        question: {
          en: 'Match each broker cost with what it actually pays for.',
          fr: 'Associez chaque coût broker à ce qu’il paie réellement.',
        },
        pairs: {
          en: [
            { term: 'Spread', definition: 'The gap between bid and ask prices.' },
            { term: 'Slippage', definition: 'Difference between intended fill and actual fill.' },
            { term: 'Commission', definition: 'Fixed per‑trade fee charged by the broker.' },
            { term: 'Swap', definition: 'Overnight financing cost for leveraged positions.' },
          ],
          fr: [
            { term: 'Spread', definition: 'L’écart entre prix bid et ask.' },
            { term: 'Slippage', definition: 'Différence entre prix visé et prix obtenu.' },
            { term: 'Commission', definition: 'Frais fixe par trade prélevé par le broker.' },
            { term: 'Swap', definition: 'Coût de financement overnight des positions à effet de levier.' },
          ],
        },
        success: {
          en: 'Right. These four sit between you and your edge — model them in every backtest.',
          fr: 'Exact. Ces quatre se placent entre vous et votre edge — modélisez‑les dans tout backtest.',
        },
        retry: {
          en: 'Read carefully — spread is structural, slippage is execution, commission is fixed, swap is overnight.',
          fr: 'Lisez attentivement — le spread est structurel, le slippage est d’exécution, la commission est fixe, le swap est overnight.',
        },
      },
    ],
  },
  {
    slug: 'journaling-the-decision',
    track: 'execution',
    order: 3,
    duration: 12,
    paywalled: true,
    title: { en: 'Journaling the decision.', fr: 'Journaliser la décision.' },
    eyebrow: { en: 'Lesson 73 · 12 minutes', fr: 'Leçon 73 · 12 minutes' },
    breadcrumb: { en: 'Curriculum / Track 05 · Execution', fr: 'Parcours / Piste 05 · Exécution' },
    intro: {
      en: 'A trading journal is not a P&L spreadsheet. It is the written record of what you were thinking before you knew the outcome.',
      fr: 'Un journal de trading n’est pas un tableur P&L. C’est l’enregistrement écrit de ce que vous pensiez avant de connaître l’issue.',
    },
    blocks: [
      {
        kind: 'list',
        ordered: true,
        items: {
          en: [
            'Setup — what pattern, what level, what timeframe.',
            'Thesis — the one-sentence reason the trade should work.',
            'Invalidation — the exact price that proves the thesis wrong.',
            'Target — where you will take profit, and why.',
            'Emotion before — calm? FOMO? revenge? Be honest.',
          ],
          fr: [
            'Setup — quel pattern, quel niveau, quel timeframe.',
            'Thèse — la phrase unique qui justifie pourquoi le trade devrait fonctionner.',
            'Invalidation — le prix exact qui prouve la thèse fausse.',
            'Cible — où vous prendrez le profit, et pourquoi.',
            'Émotion avant — calme ? FOMO ? revanche ? Soyez honnête.',
          ],
        },
      },
    ],
  },
  {
    slug: 'post-trade-review',
    track: 'execution',
    order: 4,
    duration: 11,
    paywalled: true,
    title: { en: 'Post‑trade review.', fr: 'Revue post‑trade.' },
    eyebrow: { en: 'Lesson 74 · 11 minutes', fr: 'Leçon 74 · 11 minutes' },
    breadcrumb: { en: 'Curriculum / Track 05 · Execution', fr: 'Parcours / Piste 05 · Exécution' },
    intro: {
      en: 'Every closed trade has two grades: the outcome, and the decision quality. They are not the same. Review the decision, not the result.',
      fr: 'Chaque trade clôturé a deux notes : l’issue, et la qualité de la décision. Ce ne sont pas les mêmes. Revoyez la décision, pas le résultat.',
    },
    blocks: [
      {
        kind: 'callout',
        tone: 'info',
        title: { en: 'Decision vs outcome', fr: 'Décision vs issue' },
        text: {
          en: 'A losing trade taken correctly is still a good trade. A winning trade taken impulsively is still a bad trade. Grade the process.',
          fr: 'Un trade perdant pris correctement reste un bon trade. Un trade gagnant pris impulsivement reste un mauvais trade. Notez le processus.',
        },
      },
      {
        kind: 'order',
        question: {
          en: 'Order the four steps of a weekly post‑trade review.',
          fr: 'Classez les quatre étapes d’une revue post‑trade hebdomadaire.',
        },
        items: {
          en: [
            'Read every journal entry from the past week, in order.',
            'Tag each trade: A (followed plan), B (drifted), C (broke plan).',
            'Identify the most common cause of B and C entries.',
            'Write one rule for next week that addresses that cause.',
          ],
          fr: [
            'Lire chaque entrée de journal de la semaine passée, dans l’ordre.',
            'Étiqueter chaque trade : A (plan suivi), B (dérive), C (plan cassé).',
            'Identifier la cause la plus fréquente des entrées B et C.',
            'Écrire une règle pour la semaine suivante adressant cette cause.',
          ],
        },
        success: {
          en: 'Exactly. Review → tag → diagnose → prescribe. Repeat every week and the curve bends.',
          fr: 'Exactement. Revue → étiquetage → diagnostic → prescription. Répétez chaque semaine et la courbe se redresse.',
        },
        retry: {
          en: 'Diagnosis must come before prescription. You can’t fix what you haven’t named.',
          fr: 'Le diagnostic doit précéder la prescription. On ne corrige pas ce qu’on n’a pas nommé.',
        },
      },
    ],
  },

  // ==========================================================================
  // INDICATORS — 6 lessons
  // ==========================================================================
  { slug: 'moving-averages', track: 'indicators', order: 1, duration: 10, paywalled: true,
    title: { en: 'Moving averages.', fr: 'Moyennes mobiles.' },
    eyebrow: { en: 'Lesson 81 · 10 min', fr: 'Leçon 81 · 10 min' },
    breadcrumb: { en: 'Curriculum / Track 04 · Indicators', fr: 'Parcours / Piste 04 · Indicateurs' },
    intro: { en: 'The simplest indicator: average price over N periods. Useful as a trend filter, dangerous as a signal.', fr: "L'indicateur le plus simple : le prix moyen sur N périodes. Utile comme filtre de tendance, dangereux comme signal." },
    blocks: [
      { kind: 'list', ordered: false, items: { en: ['Above the 200-day MA = bull market regime.', 'Below = bear market.', 'Slope matters more than crossings.'], fr: ['Au-dessus de la MM200 = régime haussier.', 'En-dessous = baissier.', 'La pente compte plus que les croisements.'] } },
      { kind: 'quiz', question: { en: 'A flat 200-day MA suggests…', fr: 'Une MM200 plate suggère…' }, choices: { en: ['A strong trend', 'A range or transition', 'An imminent crash', 'A buy signal'], fr: ['Une tendance forte', 'Un range ou une transition', 'Un krach imminent', 'Un signal d’achat'] }, correct: 1, success: { en: 'Right. Flat MA = no directional bias. Don’t trend-trade.', fr: 'Exact. MM plate = pas de biais directionnel. Ne tradez pas la tendance.' }, retry: { en: 'Flat = no direction. That’s the whole point.', fr: 'Plate = pas de direction. C’est le point.' } },
    ],
  },
  { slug: 'rsi-explained', track: 'indicators', order: 2, duration: 11, paywalled: true,
    title: { en: 'RSI, properly.', fr: 'Le RSI, correctement.' },
    eyebrow: { en: 'Lesson 82 · 11 min', fr: 'Leçon 82 · 11 min' },
    breadcrumb: { en: 'Curriculum / Track 04 · Indicators', fr: 'Parcours / Piste 04 · Indicateurs' },
    intro: { en: 'Relative Strength Index measures the speed of price changes from 0 to 100. The textbook says 70 overbought, 30 oversold. The textbook lies in strong trends.', fr: 'Le Relative Strength Index mesure la vitesse des changements de prix de 0 à 100. Le manuel dit 70 surachat, 30 survente. Le manuel ment en tendance forte.' },
    blocks: [
      { kind: 'callout', tone: 'warn', title: { en: 'Trend trap', fr: 'Piège de tendance' }, text: { en: 'In a strong uptrend, RSI stays above 70 for weeks. Selling 70 is selling strength.', fr: 'En tendance haussière forte, le RSI reste au-dessus de 70 des semaines. Vendre 70 = vendre la force.' } },
      { kind: 'quiz', question: { en: 'In a confirmed downtrend, an RSI bounce to 60 is best read as…', fr: 'En tendance baissière confirmée, un rebond du RSI à 60 se lit comme…' }, choices: { en: ['A buy signal', 'A short-entry zone', 'A reversal warning', 'Neutral'], fr: ['Un signal d’achat', 'Une zone d’entrée short', 'Une alerte de retournement', 'Neutre'] }, correct: 1, success: { en: 'Right. In a downtrend, RSI rejection from 60 is a classic short setup.', fr: 'Exact. En tendance baissière, un rejet RSI à 60 est un setup short classique.' }, retry: { en: 'Trade with the trend. Bounces in a downtrend favour shorts.', fr: 'Tradez la tendance. Les rebonds en baissier favorisent les shorts.' } },
    ],
  },
  { slug: 'macd-deeper', track: 'indicators', order: 3, duration: 12, paywalled: true,
    title: { en: 'MACD, deeper.', fr: 'Le MACD, plus profond.' },
    eyebrow: { en: 'Lesson 83 · 12 min', fr: 'Leçon 83 · 12 min' },
    breadcrumb: { en: 'Curriculum / Track 04 · Indicators', fr: 'Parcours / Piste 04 · Indicateurs' },
    intro: { en: 'MACD is the difference between two moving averages, smoothed. Read the divergence, not the crossover.', fr: 'Le MACD est la différence entre deux moyennes mobiles, lissée. Lisez la divergence, pas le croisement.' },
    blocks: [
      { kind: 'paragraph', text: { en: 'Bullish divergence: price prints a lower low while MACD prints a higher low. The thrust is leaving the move.', fr: 'Divergence haussière : le prix imprime un plus bas plus bas alors que le MACD imprime un plus bas plus haut. La poussée quitte le mouvement.' } },
    ],
  },
  { slug: 'bollinger-bands', track: 'indicators', order: 4, duration: 10, paywalled: true,
    title: { en: 'Bollinger bands.', fr: 'Bandes de Bollinger.' },
    eyebrow: { en: 'Lesson 84 · 10 min', fr: 'Leçon 84 · 10 min' },
    breadcrumb: { en: 'Curriculum / Track 04 · Indicators', fr: 'Parcours / Piste 04 · Indicateurs' },
    intro: { en: 'A 20-period moving average with bands at ±2 standard deviations. Price touching the upper band is not overbought — it is volatile.', fr: 'Une MM 20 périodes avec des bandes à ±2 écarts-types. Toucher la bande haute n’est pas du surachat — c’est de la volatilité.' },
    blocks: [
      { kind: 'list', ordered: false, items: { en: ['Squeeze (bands narrowing) = breakout imminent.', 'Walking the band = strong trend, do not fade.', 'Mean reversion only when bands are wide.'], fr: ['Squeeze (bandes qui se resserrent) = cassure imminente.', 'Marcher sur la bande = tendance forte, ne pas contrer.', 'Mean reversion seulement quand les bandes sont larges.'] } },
    ],
  },
  { slug: 'volume-analysis', track: 'indicators', order: 5, duration: 11, paywalled: true,
    title: { en: 'Volume analysis.', fr: 'Analyse du volume.' },
    eyebrow: { en: 'Lesson 85 · 11 min', fr: 'Leçon 85 · 11 min' },
    breadcrumb: { en: 'Curriculum / Track 04 · Indicators', fr: 'Parcours / Piste 04 · Indicateurs' },
    intro: { en: 'Volume confirms or denies what price tells you. A breakout on weak volume is a fake.', fr: 'Le volume confirme ou dément ce que le prix raconte. Une cassure sur faible volume est fausse.' },
    blocks: [
      { kind: 'quiz', question: { en: 'A breakout to a new high on volume 3× the average suggests…', fr: 'Une cassure vers un nouveau plus haut avec un volume 3× la moyenne suggère…' }, choices: { en: ['A trap', 'A genuine breakout', 'Indecision', 'A pullback ahead'], fr: ['Un piège', 'Une vraie cassure', 'Indécision', 'Un repli à venir'] }, correct: 1, success: { en: 'Right. High volume + new high = institutional participation, real breakout.', fr: 'Exact. Volume élevé + nouveau plus haut = participation institutionnelle, vraie cassure.' }, retry: { en: 'High volume on a directional move confirms it. That is the rule.', fr: 'Volume élevé sur un mouvement directionnel le confirme. C’est la règle.' } },
    ],
  },
  { slug: 'fibonacci-retracement', track: 'indicators', order: 6, duration: 12, paywalled: true,
    title: { en: 'Fibonacci retracement.', fr: 'Retracement de Fibonacci.' },
    eyebrow: { en: 'Lesson 86 · 12 min', fr: 'Leçon 86 · 12 min' },
    breadcrumb: { en: 'Curriculum / Track 04 · Indicators', fr: 'Parcours / Piste 04 · Indicateurs' },
    intro: { en: '0.382, 0.5, 0.618. Three levels where pullbacks tend to end. Not magic — convergence with structure makes them work.', fr: '0,382, 0,5, 0,618. Trois niveaux où les pullbacks tendent à se terminer. Pas magique — la convergence avec la structure les fait fonctionner.' },
    blocks: [],
  },

  // ==========================================================================
  // PSYCHOLOGY — 6 lessons
  // ==========================================================================
  { slug: 'fomo', track: 'psychology', order: 1, duration: 9, paywalled: true,
    title: { en: 'FOMO — naming the enemy.', fr: 'FOMO — nommer l’ennemi.' },
    eyebrow: { en: 'Lesson 91 · 9 min', fr: 'Leçon 91 · 9 min' },
    breadcrumb: { en: 'Curriculum / Track 06 · Psychology', fr: 'Parcours / Piste 06 · Psychologie' },
    intro: { en: 'Fear of missing out is the most expensive emotion in trading. Buying because price moves without you = buying tops.', fr: 'La peur de rater (FOMO) est l’émotion la plus chère en trading. Acheter parce que le prix monte sans vous = acheter des sommets.' },
    blocks: [
      { kind: 'callout', tone: 'warn', title: { en: 'Antidote', fr: 'Antidote' }, text: { en: 'If a trade was not in your plan an hour ago, it’s not your trade now.', fr: 'Si un trade n’était pas dans votre plan il y a une heure, ce n’est pas votre trade maintenant.' } },
    ],
  },
  { slug: 'revenge-trading', track: 'psychology', order: 2, duration: 10, paywalled: true,
    title: { en: 'Revenge trading.', fr: 'Trading de revanche.' },
    eyebrow: { en: 'Lesson 92 · 10 min', fr: 'Leçon 92 · 10 min' },
    breadcrumb: { en: 'Curriculum / Track 06 · Psychology', fr: 'Parcours / Piste 06 · Psychologie' },
    intro: { en: 'Doubling down after a loss to "make it back" is how blowups happen. The market does not owe you anything.', fr: 'Doubler la mise après une perte pour « se refaire » est ainsi que les comptes sautent. Le marché ne vous doit rien.' },
    blocks: [],
  },
  { slug: 'tilt', track: 'psychology', order: 3, duration: 9, paywalled: true,
    title: { en: 'Recognising tilt.', fr: 'Reconnaître le tilt.' },
    eyebrow: { en: 'Lesson 93 · 9 min', fr: 'Leçon 93 · 9 min' },
    breadcrumb: { en: 'Curriculum / Track 06 · Psychology', fr: 'Parcours / Piste 06 · Psychologie' },
    intro: { en: 'Tilt is when you keep trading after the day is decided. Pros walk away. Amateurs press.', fr: 'Le tilt, c’est continuer à trader après que la journée est jouée. Les pros s’arrêtent. Les amateurs insistent.' },
    blocks: [
      { kind: 'quiz', question: { en: 'You hit your daily loss limit. The next action is…', fr: 'Vous touchez votre limite de perte journalière. L’action suivante est…' }, choices: { en: ['One more trade to even out', 'Reduce size and continue', 'Close everything, stop trading today', 'Switch to a different market'], fr: ['Un trade de plus pour égaliser', 'Réduire la taille et continuer', 'Tout fermer, arrêter pour aujourd’hui', 'Changer de marché'] }, correct: 2, success: { en: 'Right. The limit exists for a reason. Respect it.', fr: 'Exact. La limite existe pour une raison. Respectez-la.' }, retry: { en: 'The discipline IS the strategy.', fr: 'La discipline EST la stratégie.' } },
    ],
  },
  { slug: 'cognitive-biases', track: 'psychology', order: 4, duration: 11, paywalled: true,
    title: { en: 'Cognitive biases.', fr: 'Biais cognitifs.' },
    eyebrow: { en: 'Lesson 94 · 11 min', fr: 'Leçon 94 · 11 min' },
    breadcrumb: { en: 'Curriculum / Track 06 · Psychology', fr: 'Parcours / Piste 06 · Psychologie' },
    intro: { en: 'Confirmation bias, anchoring, recency. Three biases that quietly drain accounts.', fr: 'Biais de confirmation, ancrage, récence. Trois biais qui vident les comptes en silence.' },
    blocks: [],
  },
  { slug: 'routines', track: 'psychology', order: 5, duration: 10, paywalled: true,
    title: { en: 'Pre-trade routine.', fr: 'Routine pré-trade.' },
    eyebrow: { en: 'Lesson 95 · 10 min', fr: 'Leçon 95 · 10 min' },
    breadcrumb: { en: 'Curriculum / Track 06 · Psychology', fr: 'Parcours / Piste 06 · Psychologie' },
    intro: { en: 'Same five-minute ritual before every session. Removes emotion, surfaces context.', fr: 'Même rituel de cinq minutes avant chaque séance. Supprime l’émotion, fait remonter le contexte.' },
    blocks: [],
  },
  { slug: 'attention-management', track: 'psychology', order: 6, duration: 11, paywalled: true,
    title: { en: 'Attention as currency.', fr: 'L’attention comme monnaie.' },
    eyebrow: { en: 'Lesson 96 · 11 min', fr: 'Leçon 96 · 11 min' },
    breadcrumb: { en: 'Curriculum / Track 06 · Psychology', fr: 'Parcours / Piste 06 · Psychologie' },
    intro: { en: 'Six hours staring at a 1-minute chart is not edge. It is exhaustion. Choose your screen time like you choose your size.', fr: 'Six heures à fixer un graphique 1 minute n’est pas un edge. C’est de l’épuisement. Choisissez votre temps d’écran comme votre taille.' },
    blocks: [],
  },

  // ==========================================================================
  // ASSETS — 5 lessons
  // ==========================================================================
  { slug: 'forex-basics', track: 'assets', order: 1, duration: 11, paywalled: true,
    title: { en: 'Forex, basics.', fr: 'Forex, les bases.' },
    eyebrow: { en: 'Lesson 101 · 11 min', fr: 'Leçon 101 · 11 min' },
    breadcrumb: { en: 'Curriculum / Track 07 · Asset classes', fr: 'Parcours / Piste 07 · Classes d’actifs' },
    intro: { en: 'Major pairs trade 24/5 with deep liquidity. Spreads tight, leverage abundant, mistakes still expensive.', fr: 'Les paires majeures se tradent 24/5 avec une liquidité profonde. Spreads serrés, levier abondant, erreurs toujours coûteuses.' },
    blocks: [],
  },
  { slug: 'stock-trading', track: 'assets', order: 2, duration: 12, paywalled: true,
    title: { en: 'Stocks.', fr: 'Actions.' },
    eyebrow: { en: 'Lesson 102 · 12 min', fr: 'Leçon 102 · 12 min' },
    breadcrumb: { en: 'Curriculum / Track 07 · Asset classes', fr: 'Parcours / Piste 07 · Classes d’actifs' },
    intro: { en: 'Single names. Earnings drive multi-week regimes. Sector rotation moves weeks ahead of price.', fr: 'Titres individuels. Les résultats trimestriels conduisent les régimes pluri-semaines. La rotation sectorielle anticipe le prix.' },
    blocks: [],
  },
  { slug: 'crypto-trading', track: 'assets', order: 3, duration: 11, paywalled: true,
    title: { en: 'Crypto.', fr: 'Crypto.' },
    eyebrow: { en: 'Lesson 103 · 11 min', fr: 'Leçon 103 · 11 min' },
    breadcrumb: { en: 'Curriculum / Track 07 · Asset classes', fr: 'Parcours / Piste 07 · Classes d’actifs' },
    intro: { en: '24/7 markets, retail-heavy flow, occasional manipulation. Risk management matters more here, not less.', fr: 'Marchés 24/7, flux dominé par le retail, manipulation occasionnelle. La gestion du risque compte plus ici, pas moins.' },
    blocks: [
      { kind: 'callout', tone: 'warn', title: { en: 'Liquidations', fr: 'Liquidations' }, text: { en: 'Leveraged crypto positions auto-liquidate when margin runs out. Use isolated margin, not cross.', fr: 'Les positions crypto à levier sont liquidées automatiquement quand la marge s’épuise. Utilisez la marge isolée, pas croisée.' } },
    ],
  },
  { slug: 'indices-trading', track: 'assets', order: 4, duration: 10, paywalled: true,
    title: { en: 'Indices.', fr: 'Indices.' },
    eyebrow: { en: 'Lesson 104 · 10 min', fr: 'Leçon 104 · 10 min' },
    breadcrumb: { en: 'Curriculum / Track 07 · Asset classes', fr: 'Parcours / Piste 07 · Classes d’actifs' },
    intro: { en: 'S&P, Nasdaq, DAX, FTSE. Cleaner trends, smoother flow. The starter market for many pros.', fr: 'S&P, Nasdaq, DAX, FTSE. Tendances plus propres, flux plus lisse. Le marché d’entrée pour beaucoup de pros.' },
    blocks: [],
  },
  { slug: 'commodities-trading', track: 'assets', order: 5, duration: 11, paywalled: true,
    title: { en: 'Commodities.', fr: 'Matières premières.' },
    eyebrow: { en: 'Lesson 105 · 11 min', fr: 'Leçon 105 · 11 min' },
    breadcrumb: { en: 'Curriculum / Track 07 · Asset classes', fr: 'Parcours / Piste 07 · Classes d’actifs' },
    intro: { en: 'Gold, oil, copper. Driven by macro flows, geopolitics, and inventory cycles. Slow but explosive.', fr: 'Or, pétrole, cuivre. Conduits par les flux macro, la géopolitique, et les cycles de stocks. Lents mais explosifs.' },
    blocks: [],
  },

  // ==========================================================================
  // STRATEGY — 5 lessons
  // ==========================================================================
  { slug: 'mean-reversion', track: 'strategy', order: 1, duration: 12, paywalled: true,
    title: { en: 'Mean reversion.', fr: 'Mean reversion.' },
    eyebrow: { en: 'Lesson 111 · 12 min', fr: 'Leçon 111 · 12 min' },
    breadcrumb: { en: 'Curriculum / Track 08 · Strategy', fr: 'Parcours / Piste 08 · Stratégie' },
    intro: { en: 'Buy weakness, sell strength — works in ranges, dies in trends. Knowing the regime is the whole job.', fr: 'Acheter la faiblesse, vendre la force — marche en range, meurt en tendance. Reconnaître le régime est tout le travail.' },
    blocks: [],
  },
  { slug: 'breakout-strategy', track: 'strategy', order: 2, duration: 11, paywalled: true,
    title: { en: 'Breakout strategy.', fr: 'Stratégie de cassure.' },
    eyebrow: { en: 'Lesson 112 · 11 min', fr: 'Leçon 112 · 11 min' },
    breadcrumb: { en: 'Curriculum / Track 08 · Strategy', fr: 'Parcours / Piste 08 · Stratégie' },
    intro: { en: 'Buy strength, sell weakness — opposite of mean reversion. Win rate lower, average winner larger.', fr: 'Acheter la force, vendre la faiblesse — opposé de la mean reversion. Taux de réussite plus bas, gain moyen plus grand.' },
    blocks: [],
  },
  { slug: 'momentum-strategy', track: 'strategy', order: 3, duration: 12, paywalled: true,
    title: { en: 'Momentum.', fr: 'Momentum.' },
    eyebrow: { en: 'Lesson 113 · 12 min', fr: 'Leçon 113 · 12 min' },
    breadcrumb: { en: 'Curriculum / Track 08 · Strategy', fr: 'Parcours / Piste 08 · Stratégie' },
    intro: { en: 'What is moving keeps moving for longer than people expect. Ride it, don’t fade it.', fr: 'Ce qui bouge continue à bouger plus longtemps qu’on ne le pense. Suivez, ne contrez pas.' },
    blocks: [],
  },
  { slug: 'backtest-101', track: 'strategy', order: 4, duration: 14, paywalled: true,
    title: { en: 'Backtesting, properly.', fr: 'Backtester correctement.' },
    eyebrow: { en: 'Lesson 114 · 14 min', fr: 'Leçon 114 · 14 min' },
    breadcrumb: { en: 'Curriculum / Track 08 · Strategy', fr: 'Parcours / Piste 08 · Stratégie' },
    intro: { en: 'A backtest with 30 trades proves nothing. You need 200+ across regimes. Slippage, commission, look-ahead bias — all the gotchas.', fr: 'Un backtest sur 30 trades ne prouve rien. Il en faut 200+ traversant plusieurs régimes. Slippage, commission, biais de look-ahead — tous les pièges.' },
    blocks: [
      { kind: 'list', ordered: true, items: { en: ['200+ trades minimum.', 'Three different volatility regimes.', 'Realistic costs subtracted.', 'No look-ahead in the rules.'], fr: ['200+ trades minimum.', 'Trois régimes de volatilité différents.', 'Coûts réalistes soustraits.', 'Pas de look-ahead dans les règles.'] } },
    ],
  },
  { slug: 'walk-forward', track: 'strategy', order: 5, duration: 13, paywalled: true,
    title: { en: 'Walk-forward analysis.', fr: 'Analyse walk-forward.' },
    eyebrow: { en: 'Lesson 115 · 13 min', fr: 'Leçon 115 · 13 min' },
    breadcrumb: { en: 'Curriculum / Track 08 · Strategy', fr: 'Parcours / Piste 08 · Stratégie' },
    intro: { en: 'Optimise on data A, validate on unseen data B, walk forward in time. The only honest way to test a system.', fr: 'Optimiser sur les données A, valider sur les données B inconnues, avancer dans le temps. La seule façon honnête de tester un système.' },
    blocks: [],
  },

  // ==========================================================================
  // FOUNDATIONS — extra lessons
  // ==========================================================================
  { slug: 'demo-account', track: 'foundations', order: 7, duration: 8, paywalled: true,
    title: { en: 'Demo accounts.', fr: 'Comptes démo.' },
    eyebrow: { en: 'Lesson 07 · 8 min', fr: 'Leçon 07 · 8 min' },
    breadcrumb: { en: 'Curriculum / Track 01 · Foundations', fr: 'Parcours / Piste 01 · Fondations' },
    intro: { en: 'Useful for mechanics, dangerous for psychology. You behave differently when nothing is at stake.', fr: 'Utiles pour la mécanique, dangereux pour la psychologie. Vous agissez différemment sans argent en jeu.' },
    blocks: [],
  },
  { slug: 'choosing-a-broker', track: 'foundations', order: 8, duration: 12, paywalled: true,
    title: { en: 'Choosing a broker.', fr: 'Choisir un broker.' },
    eyebrow: { en: 'Lesson 08 · 12 min', fr: 'Leçon 08 · 12 min' },
    breadcrumb: { en: 'Curriculum / Track 01 · Foundations', fr: 'Parcours / Piste 01 · Fondations' },
    intro: { en: 'Regulation matters most. Then spreads, execution, withdrawal speed. Glossy interface is the last criterion.', fr: 'La régulation compte d’abord. Puis spreads, exécution, vitesse de retrait. L’interface jolie est le dernier critère.' },
    blocks: [
      { kind: 'list', ordered: false, items: { en: ['Regulated by a tier-1 authority (FCA, SEC, AMF, ASIC, BaFin).', 'Segregated client funds.', 'Public spread + commission schedule.', 'Withdrawal SLA under 48 hours.'], fr: ['Régulé par une autorité tier-1 (FCA, SEC, AMF, ASIC, BaFin).', 'Fonds clients ségrégués.', 'Grille de spreads + commissions publique.', 'SLA de retrait sous 48 heures.'] } },
    ],
  },
  { slug: 'reading-the-news', track: 'foundations', order: 9, duration: 11, paywalled: true,
    title: { en: 'Reading the news.', fr: 'Lire l’actualité.' },
    eyebrow: { en: 'Lesson 09 · 11 min', fr: 'Leçon 09 · 11 min' },
    breadcrumb: { en: 'Curriculum / Track 01 · Foundations', fr: 'Parcours / Piste 01 · Fondations' },
    intro: { en: 'Economic calendar, central bank dates, earnings. The events that move price more than any pattern.', fr: 'Calendrier économique, dates de banques centrales, résultats. Les événements qui bougent le prix plus que n’importe quelle figure.' },
    blocks: [],
  },
  { slug: 'market-hours', track: 'foundations', order: 10, duration: 9, paywalled: true,
    title: { en: 'Market hours.', fr: 'Heures de marché.' },
    eyebrow: { en: 'Lesson 10 · 9 min', fr: 'Leçon 10 · 9 min' },
    breadcrumb: { en: 'Curriculum / Track 01 · Foundations', fr: 'Parcours / Piste 01 · Fondations' },
    intro: { en: 'Liquidity has a schedule. London open, NY open, FOMC press. Plan your screen time around them.', fr: 'La liquidité a un horaire. Ouverture Londres, ouverture NY, conférence FOMC. Planifiez votre temps d’écran autour.' },
    blocks: [],
  },
];

const LESSONS_NORMALIZED: Lesson[] = RAW_LESSONS.map(normalizeLesson);

export const LESSONS: Lesson[] = LESSONS_NORMALIZED;

export function lessonBySlug(slug: string): Lesson | null {
  return LESSONS.find((l) => l.slug === slug) ?? null;
}

export function lessonsByTrack(track: TrackId): Lesson[] {
  return LESSONS.filter((l) => l.track === track).sort((a, b) => a.order - b.order);
}

export function lessonsByLevel(level: Lesson['level']): Lesson[] {
  return LESSONS.filter((l) => l.level === level);
}

export function freeLessons(): Lesson[] {
  return LESSONS.filter((l) => l.tier === 'free');
}
