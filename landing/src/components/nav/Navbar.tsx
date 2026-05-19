import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';

const links = [
  { href: '#features', label: 'Product' },
  { href: '#metrics', label: 'Metrics' },
  { href: '#faq', label: 'FAQ' },
  { href: '#docs', label: 'Docs' },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-line/70 bg-paper/80 backdrop-blur-md">
      <Container as="div" className="flex h-16 items-center justify-between">
        <Link href="/" aria-label="Ruflo home" className="flex items-center gap-2">
          <span aria-hidden className="block h-2.5 w-2.5 rounded-full bg-ink" />
          <span className="text-[15px] font-semibold tracking-tight">Ruflo</span>
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sm text-ink-muted transition-colors hover:text-ink"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="#signin"
            className="hidden text-sm text-ink-muted transition-colors hover:text-ink md:inline"
          >
            Sign in
          </Link>
          <Button href="#start">Start building</Button>
        </div>
      </Container>
    </header>
  );
}
