import 'server-only';

/**
 * Verifies a Vercel Cron request. In production, Vercel sets the
 * `Authorization: Bearer <CRON_SECRET>` header on cron-triggered calls
 * (when CRON_SECRET env var is configured on the project).
 *
 * When CRON_SECRET is missing (e.g. local dev) we still allow Vercel's
 * `x-vercel-cron` header so the route remains testable in preview.
 */
export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = request.headers.get('authorization') || '';
    if (header === `Bearer ${secret}`) return true;
  }
  if (request.headers.get('x-vercel-cron') === '1') return true;
  return false;
}
