import { LESSONS } from '@/lib/lessons/catalog';
import { GLOSSARY } from '@/lib/glossary';
import type { Locale } from '@/lib/i18n/config';

/**
 * Last-resort answer engine when no LLM is configured. Looks at the question,
 * finds relevant lessons by keyword score, and stitches an editorial answer
 * pointing the learner to the right place. Never gives signals or
 * recommendations — by design, just like the real tutor.
 */
export function heuristicAnswer(question: string, locale: Locale): string {
  const q = question.toLowerCase().trim();
  if (q.length < 3) {
    return locale === 'fr'
      ? 'Posez une question un peu plus précise — un mot-clé ou une phrase complète aide le tuteur à trouver la bonne leçon.'
      : 'Ask something a bit more specific — a keyword or full sentence helps the tutor find the right lesson.';
  }

  // Block disallowed intents.
  const forbidden = /(should i buy|should i sell|signal|recommend|will go up|will go down|dois\-je acheter|dois\-je vendre|signal|recommand|va monter|va descendre)/i;
  if (forbidden.test(q)) {
    return locale === 'fr'
      ? 'Le tuteur Tickra ne donne ni recommandations ni signaux d’entrée. Je peux par contre vous expliquer la mécanique, les risques, et où l’apprendre.'
      : 'The Tickra tutor does not give entries, exits, or recommendations. I can explain the mechanics, the risks, and where to learn each — just ask the underlying question.';
  }

  // Glossary fast path
  const tokens = q.split(/\s+/).filter((w) => w.length > 2);
  const glossHit = GLOSSARY.find((g) =>
    tokens.some((t) => g.term[locale].toLowerCase().includes(t) || g.slug.includes(t)),
  );
  if (glossHit) {
    const intro = locale === 'fr'
      ? `**${glossHit.term.fr}** — ${glossHit.definition.fr}`
      : `**${glossHit.term.en}** — ${glossHit.definition.en}`;
    const related = LESSONS.find((l) => l.title[locale].toLowerCase().includes(glossHit.term[locale].toLowerCase()));
    const suggestion = related
      ? locale === 'fr'
        ? `\n\nPour aller plus loin : ouvrez la leçon « ${related.title.fr} ».`
        : `\n\nTo go deeper: open the lesson "${related.title.en}".`
      : '';
    return intro + suggestion;
  }

  // Lesson lookup by simple token match
  let bestLesson: typeof LESSONS[number] | null = null;
  let bestScore = 0;
  for (const lesson of LESSONS) {
    const haystack = (lesson.title[locale] + ' ' + lesson.intro[locale]).toLowerCase();
    const score = tokens.reduce((s, t) => s + (haystack.includes(t) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestLesson = lesson;
    }
  }

  if (bestLesson && bestScore >= 1) {
    return locale === 'fr'
      ? `Le sujet le plus proche dans notre cursus : « ${bestLesson.title.fr} ». ${bestLesson.intro.fr}`
      : `The closest topic in our curriculum: "${bestLesson.title.en}". ${bestLesson.intro.en}`;
  }

  return locale === 'fr'
    ? 'Je n’ai pas trouvé de leçon ni de terme du glossaire qui couvre cette question. Reformulez avec un terme plus précis (bougie, support, risque, RSI…).'
    : 'I couldn’t find a lesson or glossary term that matches this question. Try a more specific term (candle, support, risk, RSI…).';
}
