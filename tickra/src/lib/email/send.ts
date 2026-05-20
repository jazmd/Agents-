import 'server-only';
import { resend, emailFrom, emailReplyTo, hasEmailEnv } from './client';
import {
  welcomeEmail,
  subscriptionConfirmedEmail,
  weeklyDigestEmail,
  paywallReminderEmail,
} from './templates';

type Locale = 'en' | 'fr';

type SendResult = { ok: true; id: string } | { ok: false; reason: string };

async function dispatch(to: string, payload: { subject: string; html: string; text: string }, tag?: string): Promise<SendResult> {
  const client = resend();
  if (!client) return { ok: false, reason: 'email not configured' };

  try {
    const res = await client.emails.send({
      from: emailFrom(),
      to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      replyTo: emailReplyTo(),
      tags: tag ? [{ name: 'kind', value: tag }] : undefined,
    });
    if (res.error) return { ok: false, reason: res.error.message ?? 'send failed' };
    return { ok: true, id: res.data?.id ?? '' };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : 'send failed' };
  }
}

export function emailReady() {
  return hasEmailEnv();
}

export function sendWelcomeEmail(args: { to: string; locale: Locale; fullName?: string | null }) {
  const payload = welcomeEmail({ locale: args.locale, fullName: args.fullName });
  return dispatch(args.to, payload, 'welcome');
}

export function sendSubscriptionConfirmedEmail(args: {
  to: string;
  locale: Locale;
  plan: 'pro' | 'lifetime';
}) {
  const payload = subscriptionConfirmedEmail({ locale: args.locale, plan: args.plan });
  return dispatch(args.to, payload, 'subscription_confirmed');
}

export function sendWeeklyDigestEmail(args: {
  to: string;
  locale: Locale;
  fullName?: string | null;
  minutes: number;
  lessonsDone: number;
  streak: number;
}) {
  const payload = weeklyDigestEmail(args);
  return dispatch(args.to, payload, 'weekly_digest');
}

export function sendPaywallReminderEmail(args: { to: string; locale: Locale; lessonTitle: string }) {
  const payload = paywallReminderEmail(args);
  return dispatch(args.to, payload, 'paywall_reminder');
}
