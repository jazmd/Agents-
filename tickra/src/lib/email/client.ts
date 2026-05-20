import 'server-only';
import { Resend } from 'resend';

let cached: Resend | null = null;

export function hasEmailEnv() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export function resend(): Resend | null {
  if (!hasEmailEnv()) return null;
  if (cached) return cached;
  cached = new Resend(process.env.RESEND_API_KEY!);
  return cached;
}

export function emailFrom(): string {
  return process.env.EMAIL_FROM || 'Tickra <hello@tickra.com>';
}

export function emailReplyTo(): string | undefined {
  return process.env.EMAIL_REPLY_TO || undefined;
}
