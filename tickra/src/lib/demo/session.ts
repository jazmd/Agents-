import 'server-only';
import { cookies } from 'next/headers';

export type DemoPlan = 'free' | 'pro' | 'lifetime';

export type DemoSession = {
  email: string;
  fullName: string;
  plan: DemoPlan;
  createdAt: string;
};

const COOKIE = 'tickra-demo-session';

export function readDemoSession(): DemoSession | null {
  try {
    const raw = cookies().get(COOKIE)?.value;
    if (!raw) return null;
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded) as DemoSession;
    if (!parsed.email || !parsed.plan) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeDemoSession(session: DemoSession) {
  cookies().set(COOKIE, encodeURIComponent(JSON.stringify(session)), {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
    httpOnly: false,
  });
}

export function clearDemoSession() {
  cookies().set(COOKIE, '', { path: '/', maxAge: 0 });
}

export function demoCookieName() {
  return COOKIE;
}
