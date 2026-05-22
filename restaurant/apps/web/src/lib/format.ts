export function formatEUR(cents: number, locale: string = 'de-DE'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

export function shortOrderId(id: string): string {
  return id.slice(-6).toUpperCase();
}

export function generatePublicId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BK-${ts}-${rand}`;
}
