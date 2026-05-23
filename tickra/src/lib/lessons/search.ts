import { LESSONS } from './catalog';
import { TRACKS } from './tracks';
import type { Locale, Lesson, Block } from './types';

export type SearchHit = {
  slug: string;
  trackId: string;
  title: string;
  trackTitle: string;
  excerpt: string;
  score: number;
};

function blockText(block: Block, locale: Locale): string {
  switch (block.kind) {
    case 'lede':
    case 'paragraph':
    case 'heading':
      return block.text[locale];
    case 'list':
      return block.items[locale].join(' · ');
    case 'callout':
      return `${block.title[locale]} — ${block.text[locale]}`;
    case 'quiz':
    case 'multi':
      return `${block.question[locale]} ${block.choices[locale].join(' ')}`;
    case 'match':
      return `${block.question[locale]} ${block.pairs[locale]
        .map((p) => `${p.term} ${p.definition}`)
        .join(' · ')}`;
    case 'order':
      return `${block.question[locale]} ${block.items[locale].join(' · ')}`;
    case 'anatomy':
    case 'chart':
      return '';
    case 'video':
      return `${block.title[locale]} ${block.caption?.[locale] ?? ''}`;
  }
}

function lessonText(l: Lesson, locale: Locale): string {
  return [
    l.title[locale],
    l.intro[locale],
    ...l.blocks.map((b) => blockText(b, locale)),
  ]
    .join(' \n ')
    .toLowerCase();
}

const trackTitleMap: Record<string, Record<Locale, string>> = Object.fromEntries(
  TRACKS.map((t) => [t.id, t.title]),
);

export function searchLessons(query: string, locale: Locale, limit = 12): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const hits: SearchHit[] = [];
  for (const lesson of LESSONS) {
    const body = lessonText(lesson, locale);
    const title = lesson.title[locale].toLowerCase();

    let score = 0;
    for (const t of tokens) {
      if (title.includes(t)) score += 5;
      if (body.includes(t)) score += 1;
    }
    if (score === 0) continue;

    // build an excerpt around the first match
    let excerpt = lesson.intro[locale];
    const first = body.indexOf(tokens[0]);
    if (first >= 0) {
      const start = Math.max(0, first - 80);
      const end = Math.min(body.length, first + 160);
      excerpt = body.slice(start, end);
      if (start > 0) excerpt = `…${excerpt}`;
      if (end < body.length) excerpt = `${excerpt}…`;
    }

    hits.push({
      slug: lesson.slug,
      trackId: lesson.track,
      title: lesson.title[locale],
      trackTitle: trackTitleMap[lesson.track]?.[locale] ?? lesson.track,
      excerpt: excerpt.replace(/\s+/g, ' ').trim(),
      score,
    });
  }

  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}
