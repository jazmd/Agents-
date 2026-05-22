export const dynamic = 'force-dynamic';

// Rendered for unmatched routes (e.g. /something-without-locale).
// Root layout already provides <html>/<body>, so this is plain content.
export default function GlobalNotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-cream-100 px-4 text-center">
      <div>
        <div className="font-display text-7xl font-bold text-brand-500">404</div>
        <h1 className="mt-4 font-display text-2xl font-bold text-charcoal-900">
          Seite nicht gefunden
        </h1>
        <p className="mt-2 text-sm text-charcoal-500">
          Page not found · Sayfa bulunamadı · Страница не найдена
        </p>
        <a
          href="/de"
          className="mt-6 inline-block rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-cream-50 transition hover:bg-brand-600"
        >
          Zur Startseite →
        </a>
      </div>
    </div>
  );
}
