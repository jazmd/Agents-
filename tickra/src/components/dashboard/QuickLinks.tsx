import Link from 'next/link';
import { ArrowUpRight, Award, BookMarked, CalendarClock, NotebookPen, Trophy, Users, type LucideIcon } from 'lucide-react';

type Item = { href: string; label: string; Icon: LucideIcon };

type Labels = {
  curriculum: string;
  reviews: string;
  journal: string;
  achievements: string;
  leaderboard: string;
  refer: string;
};

export function QuickLinks({ locale, labels }: { locale: string; labels: Labels }) {
  const items: Item[] = [
    { href: `/${locale}/curriculum`, label: labels.curriculum, Icon: BookMarked },
    { href: `/${locale}/reviews`, label: labels.reviews, Icon: CalendarClock },
    { href: `/${locale}/journal`, label: labels.journal, Icon: NotebookPen },
    { href: `/${locale}/achievements`, label: labels.achievements, Icon: Award },
    { href: `/${locale}/leaderboard`, label: labels.leaderboard, Icon: Trophy },
    { href: `/${locale}/refer`, label: labels.refer, Icon: Users },
  ];
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {items.map(({ href, label, Icon }) => (
        <li key={href}>
          <Link
            href={href}
            className="group flex h-full items-center gap-3 rounded-sm border border-line bg-surface p-4 transition-colors hover:border-ink hover:bg-ink hover:text-canvas"
          >
            <Icon aria-hidden className="h-4 w-4 flex-shrink-0" strokeWidth={1.6} />
            <span className="flex-1 truncate text-[13.5px] font-medium tracking-tight">{label}</span>
            <ArrowUpRight
              aria-hidden
              className="h-3.5 w-3.5 flex-shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-canvas"
              strokeWidth={1.5}
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
