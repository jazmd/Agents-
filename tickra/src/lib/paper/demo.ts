import 'server-only';
import { cookies } from 'next/headers';
import { computePnl, markPrice, type PaperAccount, type PaperPosition, type Symbol } from './types';

const COOKIE = 'tickra-paper';

type DemoState = {
  account: { balance: number; starting_balance: number; realised_pnl: number };
  positions: Array<Omit<PaperPosition, 'user_id'>>;
};

const DEFAULT_STATE: DemoState = {
  account: { balance: 10000, starting_balance: 10000, realised_pnl: 0 },
  positions: [],
};

export function readDemoPaper(): DemoState {
  try {
    const raw = cookies().get(COOKIE)?.value;
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(decodeURIComponent(raw)) as DemoState;
    return {
      account: { ...DEFAULT_STATE.account, ...parsed.account },
      positions: Array.isArray(parsed.positions) ? parsed.positions : [],
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function writeDemoPaper(state: DemoState) {
  cookies().set(COOKIE, encodeURIComponent(JSON.stringify(state)), {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
  });
}

export function demoAccountToView(state: DemoState): PaperAccount {
  return {
    user_id: 'demo',
    starting_balance: state.account.starting_balance,
    balance: state.account.balance,
    realised_pnl: state.account.realised_pnl,
    updated_at: new Date().toISOString(),
  };
}

export function demoOpenPosition(symbol: Symbol, side: 'long' | 'short', qty: number): DemoState {
  const state = readDemoPaper();
  const id = Math.random().toString(36).slice(2, 12);
  state.positions.unshift({
    id,
    symbol,
    side,
    qty,
    entry_price: markPrice(symbol),
    exit_price: null,
    status: 'open',
    opened_at: new Date().toISOString(),
    closed_at: null,
    pnl: 0,
  });
  writeDemoPaper(state);
  return state;
}

export function demoClosePosition(id: string): DemoState {
  const state = readDemoPaper();
  const pos = state.positions.find((p) => p.id === id && p.status === 'open');
  if (!pos) return state;
  const exit = markPrice(pos.symbol);
  const pnl = computePnl({ ...pos, user_id: 'demo' } as PaperPosition, exit);
  pos.exit_price = exit;
  pos.status = 'closed';
  pos.closed_at = new Date().toISOString();
  pos.pnl = pnl;
  state.account.balance = Number((state.account.balance + pnl).toFixed(2));
  state.account.realised_pnl = Number((state.account.realised_pnl + pnl).toFixed(2));
  writeDemoPaper(state);
  return state;
}
