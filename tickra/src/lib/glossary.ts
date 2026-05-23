import type { Locale } from './i18n/config';

export type GlossaryTerm = {
  slug: string;
  term: Record<Locale, string>;
  definition: Record<Locale, string>;
  category: 'foundations' | 'patterns' | 'risk' | 'execution' | 'indicators' | 'macro';
  related?: string[];
};

export const GLOSSARY: GlossaryTerm[] = [
  { slug: 'ask', category: 'execution',
    term: { en: 'Ask', fr: 'Ask (demande)' },
    definition: { en: 'The lowest price a seller is willing to accept right now. You buy at the ask.', fr: 'Le prix le plus bas qu’un vendeur accepte maintenant. Vous achetez à l’ask.' } },
  { slug: 'backtest', category: 'execution',
    term: { en: 'Backtest', fr: 'Backtest' },
    definition: { en: 'Running a strategy on historical data to estimate how it would have performed. Needs 200+ trades to mean anything.', fr: 'Exécuter une stratégie sur des données historiques pour estimer sa performance passée. Il faut 200+ trades pour être significatif.' } },
  { slug: 'bid', category: 'execution',
    term: { en: 'Bid', fr: 'Bid (offre)' },
    definition: { en: 'The highest price a buyer is willing to pay right now. You sell at the bid.', fr: 'Le prix le plus haut qu’un acheteur paie maintenant. Vous vendez au bid.' } },
  { slug: 'bollinger-bands', category: 'indicators',
    term: { en: 'Bollinger bands', fr: 'Bandes de Bollinger' },
    definition: { en: 'A 20-period moving average flanked by ±2 standard deviations. Used for volatility and mean-reversion context.', fr: 'Une moyenne mobile 20 périodes encadrée par ±2 écarts-types. Sert au contexte de volatilité et de mean reversion.' } },
  { slug: 'breakout', category: 'patterns',
    term: { en: 'Breakout', fr: 'Cassure' },
    definition: { en: 'Decisive close beyond a confirmed support or resistance level. Volume matters more than the close itself.', fr: 'Clôture décisive au-delà d’un niveau de support ou résistance confirmé. Le volume compte plus que la clôture.' } },
  { slug: 'candle', category: 'foundations',
    term: { en: 'Candle', fr: 'Bougie' },
    definition: { en: 'Visualisation of a price period with open, close, high, low. The basic unit of every chart we read.', fr: 'Visualisation d’une période de prix : ouverture, clôture, plus haut, plus bas. L’unité de base de chaque graphique.' } },
  { slug: 'capitulation', category: 'macro',
    term: { en: 'Capitulation', fr: 'Capitulation' },
    definition: { en: 'A high-volume final flush where the last holders sell. Often marks a major bottom — only obvious in hindsight.', fr: 'Un dégagement final à fort volume où les derniers porteurs vendent. Marque souvent un creux majeur — évident seulement a posteriori.' } },
  { slug: 'commission', category: 'execution',
    term: { en: 'Commission', fr: 'Commission' },
    definition: { en: 'Fixed fee charged per trade by the broker, on top of the spread.', fr: 'Frais fixe par trade prélevé par le broker, en plus du spread.' } },
  { slug: 'correlation', category: 'risk',
    term: { en: 'Correlation', fr: 'Corrélation' },
    definition: { en: 'Statistical measure of how two instruments move together (from −1 to +1). Two positively-correlated positions are not diversification.', fr: 'Mesure statistique de la co-évolution de deux instruments (de −1 à +1). Deux positions positivement corrélées ne sont pas une diversification.' } },
  { slug: 'divergence', category: 'indicators',
    term: { en: 'Divergence', fr: 'Divergence' },
    definition: { en: 'When price prints a new extreme but the indicator (RSI, MACD…) does not confirm it. Early warning of regime change.', fr: 'Quand le prix imprime un nouvel extrême mais que l’indicateur (RSI, MACD…) ne le confirme pas. Avertissement précoce de changement de régime.' } },
  { slug: 'drawdown', category: 'risk',
    term: { en: 'Drawdown', fr: 'Drawdown' },
    definition: { en: 'Peak-to-trough decline in account value, measured as a percentage. 20% drawdown requires a 25% gain to recover.', fr: 'Baisse pic-à-creux de la valeur du compte, en pourcentage. Un drawdown de 20 % nécessite 25 % de gain pour récupérer.' } },
  { slug: 'engulfing', category: 'patterns',
    term: { en: 'Engulfing pattern', fr: 'Figure d’avalement' },
    definition: { en: 'Two candles where the second body fully covers the first. Bullish or bearish depending on direction. Strongest at structural levels.', fr: 'Deux bougies où le corps de la seconde couvre entièrement celui de la première. Haussière ou baissière selon le sens. Plus forte à un niveau structurel.' } },
  { slug: 'expectancy', category: 'risk',
    term: { en: 'Expectancy', fr: 'Espérance' },
    definition: { en: '(Win rate × average win) − (loss rate × average loss). The only metric that survives a losing streak.', fr: '(Taux de réussite × gain moyen) − (taux de perte × perte moyenne). La seule métrique qui survit à une série perdante.' } },
  { slug: 'fomo', category: 'risk',
    term: { en: 'FOMO', fr: 'FOMO' },
    definition: { en: 'Fear of missing out. Entering a trade because price moves without you, not because the setup matches your plan.', fr: 'Fear of missing out (peur de rater). Entrer dans un trade parce que le prix monte sans vous, pas parce que le setup correspond au plan.' } },
  { slug: 'hammer', category: 'patterns',
    term: { en: 'Hammer', fr: 'Marteau' },
    definition: { en: 'Single candle with a small body and a long lower wick. Often signals reversal at a confirmed support.', fr: 'Bougie unique à petit corps et longue mèche basse. Souvent un signal de retournement à un support confirmé.' } },
  { slug: 'leverage', category: 'risk',
    term: { en: 'Leverage', fr: 'Levier' },
    definition: { en: 'Using borrowed capital to control a position larger than your margin. Scales gains and losses by the same factor.', fr: 'Utilisation de capital emprunté pour contrôler une position plus grande que la marge. Multiplie gains et pertes du même facteur.' } },
  { slug: 'limit-order', category: 'execution',
    term: { en: 'Limit order', fr: 'Ordre limit' },
    definition: { en: 'Order to buy below or sell above the current market, at a fixed price. May not fill if the level is never touched.', fr: 'Ordre d’achat sous ou de vente au-dessus du marché courant, à un prix fixe. Peut ne pas être exécuté si le niveau n’est jamais touché.' } },
  { slug: 'liquidity', category: 'macro',
    term: { en: 'Liquidity', fr: 'Liquidité' },
    definition: { en: 'How easily an instrument can be bought or sold without moving its price. Higher liquidity = tighter spreads.', fr: 'Facilité d’achat ou de vente d’un instrument sans bouger son prix. Plus de liquidité = spreads plus serrés.' } },
  { slug: 'macd', category: 'indicators',
    term: { en: 'MACD', fr: 'MACD' },
    definition: { en: 'Moving Average Convergence Divergence. The difference between two EMAs, smoothed. Read divergence, not crossovers.', fr: 'Moving Average Convergence Divergence. Différence entre deux EMAs, lissée. Lisez la divergence, pas les croisements.' } },
  { slug: 'market-order', category: 'execution',
    term: { en: 'Market order', fr: 'Ordre market' },
    definition: { en: 'Order to buy or sell immediately at the best available price. Use sparingly — slippage risk.', fr: 'Ordre d’achat ou de vente immédiat au meilleur prix disponible. À utiliser avec parcimonie — risque de slippage.' } },
  { slug: 'moving-average', category: 'indicators',
    term: { en: 'Moving average', fr: 'Moyenne mobile' },
    definition: { en: 'Average closing price over N periods. Above the 200-day MA = bull regime, below = bear.', fr: 'Prix de clôture moyen sur N périodes. Au-dessus de la MM 200 = régime haussier, en-dessous = baissier.' } },
  { slug: 'pip', category: 'foundations',
    term: { en: 'Pip', fr: 'Pip' },
    definition: { en: 'Smallest price move on a forex pair, typically 0.0001 for major pairs (or 0.01 for yen pairs).', fr: 'Plus petit mouvement de prix sur une paire forex, typiquement 0,0001 sur les majeures (ou 0,01 sur les paires yen).' } },
  { slug: 'pin-bar', category: 'patterns',
    term: { en: 'Pin bar', fr: 'Pin bar' },
    definition: { en: 'Single candle with a long wick and a tiny body. Market tried to push past a level and was rejected.', fr: 'Bougie unique à longue mèche et corps minuscule. Le marché a tenté de franchir un niveau et a été rejeté.' } },
  { slug: 'position-size', category: 'risk',
    term: { en: 'Position size', fr: 'Taille de position' },
    definition: { en: '(Account × risk %) / stop distance. The single calculation that matters before any trade.', fr: '(Compte × risque %) / distance au stop. Le seul calcul qui compte avant tout trade.' } },
  { slug: 'rsi', category: 'indicators',
    term: { en: 'RSI', fr: 'RSI' },
    definition: { en: 'Relative Strength Index — momentum oscillator 0 to 100. 70/30 only works in ranges, not trends.', fr: 'Relative Strength Index — oscillateur de momentum 0 à 100. 70/30 ne marche qu’en range, pas en tendance.' } },
  { slug: 'risk-reward', category: 'risk',
    term: { en: 'Risk / reward', fr: 'Risque / récompense' },
    definition: { en: 'Ratio of potential loss to potential gain on a single trade. A 1:3 R/R needs only a 25% win rate to break even.', fr: 'Ratio entre la perte potentielle et le gain potentiel sur un trade. Un R/R 1:3 ne demande que 25 % de réussite à l’équilibre.' } },
  { slug: 'slippage', category: 'execution',
    term: { en: 'Slippage', fr: 'Slippage' },
    definition: { en: 'Difference between your intended fill price and the actual fill. Worst on market orders during fast moves.', fr: 'Différence entre le prix visé et le prix obtenu. Pire sur les ordres market lors des mouvements rapides.' } },
  { slug: 'spread', category: 'execution',
    term: { en: 'Spread', fr: 'Spread' },
    definition: { en: 'Gap between bid and ask. Your transaction cost on every entry — model it in every backtest.', fr: 'Écart entre bid et ask. Votre coût de transaction à chaque entrée — modélisez-le dans tout backtest.' } },
  { slug: 'stop-loss', category: 'risk',
    term: { en: 'Stop loss', fr: 'Stop loss' },
    definition: { en: 'Order placed at the price where the trade thesis is invalidated. Caps the maximum acceptable loss.', fr: 'Ordre placé au prix où la thèse du trade est invalidée. Plafonne la perte maximale acceptée.' } },
  { slug: 'support', category: 'foundations',
    term: { en: 'Support', fr: 'Support' },
    definition: { en: 'Zone where buyers historically absorb selling pressure. Read as a band, not a line.', fr: 'Zone où les acheteurs absorbent historiquement la vente. Lisez-la comme une bande, pas une ligne.' } },
  { slug: 'resistance', category: 'foundations',
    term: { en: 'Resistance', fr: 'Résistance' },
    definition: { en: 'Zone where sellers historically cap a rally. Mirror of support; flips role on a confirmed break.', fr: 'Zone où les vendeurs plafonnent une hausse. Miroir du support ; bascule de rôle sur cassure confirmée.' } },
  { slug: 'swap', category: 'execution',
    term: { en: 'Swap', fr: 'Swap' },
    definition: { en: 'Overnight financing cost on a leveraged position. Positive or negative depending on the interest-rate differential.', fr: 'Coût de financement overnight sur une position à effet de levier. Positif ou négatif selon le différentiel de taux.' } },
  { slug: 'trend', category: 'foundations',
    term: { en: 'Trend', fr: 'Tendance' },
    definition: { en: 'Sequence of higher highs and higher lows (uptrend) or lower highs and lower lows (downtrend). Anything else is a range.', fr: 'Séquence de plus hauts plus hauts et plus bas plus hauts (haussière), ou l’inverse (baissière). Le reste est un range.' } },
  { slug: 'volume', category: 'indicators',
    term: { en: 'Volume', fr: 'Volume' },
    definition: { en: 'Number of units traded in a period. Confirms or denies what price suggests — high volume on a breakout = institutional participation.', fr: 'Nombre d’unités tradées sur une période. Confirme ou dément ce que le prix suggère — volume élevé sur cassure = participation institutionnelle.' } },
  { slug: 'wick', category: 'foundations',
    term: { en: 'Wick', fr: 'Mèche' },
    definition: { en: 'Thin line above or below the candle body, showing prices visited and refused during the period.', fr: 'Trait fin au-dessus ou en-dessous du corps de la bougie, montrant les prix visités et refusés pendant la période.' } },
];

export function glossaryBySlug(slug: string): GlossaryTerm | null {
  return GLOSSARY.find((t) => t.slug === slug) ?? null;
}

export function glossaryByLetter(letter: string, locale: Locale): GlossaryTerm[] {
  const upper = letter.toUpperCase();
  return GLOSSARY.filter((t) => t.term[locale].toUpperCase().startsWith(upper)).sort((a, b) =>
    a.term[locale].localeCompare(b.term[locale]),
  );
}

export function glossaryLetters(locale: Locale): string[] {
  return Array.from(new Set(GLOSSARY.map((t) => t.term[locale][0].toUpperCase()))).sort();
}
