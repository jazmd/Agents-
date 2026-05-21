import type { Lesson, TrackId } from './types';

// ---------------------------------------------------------------------------
// 12 lessons across 5 tracks. The first three are free.
// Lesson "japanese-candles" mirrors the original Tickra demo lesson.
// ---------------------------------------------------------------------------
export const LESSONS: Lesson[] = [
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
];

export function lessonBySlug(slug: string): Lesson | null {
  return LESSONS.find((l) => l.slug === slug) ?? null;
}

export function lessonsByTrack(track: TrackId): Lesson[] {
  return LESSONS.filter((l) => l.track === track).sort((a, b) => a.order - b.order);
}
