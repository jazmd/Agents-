export type Symbol =
  | 'EUR/USD'
  | 'BTC/USD'
  | 'XAU/USD'
  | 'AAPL'
  | 'SPX'
  | 'CL'; // WTI crude

export const INSTRUMENTS: { symbol: Symbol; name: Record<'en' | 'fr', string>; basePrice: number; tick: number }[] = [
  { symbol: 'EUR/USD', name: { en: 'EUR / USD',    fr: 'EUR / USD' },           basePrice: 1.08,   tick: 0.0001 },
  { symbol: 'BTC/USD', name: { en: 'Bitcoin / USD', fr: 'Bitcoin / USD' },       basePrice: 95000, tick: 1 },
  { symbol: 'XAU/USD', name: { en: 'Gold / USD',   fr: 'Or / USD' },             basePrice: 2380,  tick: 0.1 },
  { symbol: 'AAPL',    name: { en: 'Apple Inc.',   fr: 'Apple Inc.' },           basePrice: 230,   tick: 0.01 },
  { symbol: 'SPX',     name: { en: 'S&P 500 index', fr: 'Indice S&P 500' },      basePrice: 5400,  tick: 0.25 },
  { symbol: 'CL',      name: { en: 'WTI Crude oil', fr: 'Pétrole WTI' },         basePrice: 76,    tick: 0.01 },
];

export type PaperPosition = {
  id: string;
  user_id: string;
  symbol: Symbol;
  side: 'long' | 'short';
  qty: number;
  entry_price: number;
  exit_price: number | null;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at: string | null;
  pnl: number;
};

export type PaperAccount = {
  user_id: string;
  starting_balance: number;
  balance: number;
  realised_pnl: number;
  updated_at: string;
};

/**
 * Deterministic mock price for a symbol at a given time. Sine wave with a
 * symbol-specific phase. Volatility scales with the instrument's tick size.
 * Educational only — not market data.
 */
export function markPrice(symbol: Symbol, now: number = Date.now()): number {
  const inst = INSTRUMENTS.find((i) => i.symbol === symbol);
  if (!inst) return 1;
  // 1 cycle every 90 minutes; amplitude = base × 0.4% per cycle.
  const cycle = 90 * 60 * 1000;
  const seed = symbol.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const phase = (seed % 360) * (Math.PI / 180);
  const wave = Math.sin((now / cycle) * Math.PI * 2 + phase);
  const noise = Math.sin((now / 15000) + phase) * 0.0008;
  const amplitude = inst.basePrice * 0.004;
  const raw = inst.basePrice + wave * amplitude + noise * inst.basePrice;
  return Math.round(raw / inst.tick) * inst.tick;
}

export function computePnl(p: PaperPosition, currentPrice: number): number {
  const exit = p.exit_price ?? currentPrice;
  const diff = p.side === 'long' ? exit - p.entry_price : p.entry_price - exit;
  return Number((diff * p.qty).toFixed(2));
}

export function formatPrice(symbol: Symbol, price: number): string {
  const inst = INSTRUMENTS.find((i) => i.symbol === symbol);
  if (!inst) return price.toString();
  const digits = inst.tick < 1 ? Math.max(0, Math.ceil(-Math.log10(inst.tick))) : 2;
  return price.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
