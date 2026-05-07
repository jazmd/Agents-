/**
 * #bug23.0 — Shared keyword-matching utility for scoring user-installed
 * skills/agents (from `claude-code-registry`) against a free-form task
 * description.
 *
 * Originally lived inside `mcp-tools/hooks-tools.ts` (added in #bug22.3).
 * Extracted here so `swarm_init` (#bug23) can reuse the exact same scorer
 * — we want `hooks_route` and `swarm_init` to agree on which user content
 * matches a task, otherwise the swarm orchestration would say one thing
 * and the routing recommendation would say another.
 *
 * MVP keyword approach (intentionally simple — see TODO below). For each
 * user skill we tokenize:
 *   - The skill `name` (e.g. "polymarket-analyzer" → ["polymarket",
 *     "analyzer"]).
 *   - The first ~40 description tokens, filtered to informative tokens
 *     (>= 3 chars, alphanumerics, deduped, no common stopwords).
 *
 * Each task token that overlaps the skill's bag scores +1, with a 2×
 * weight when the hit is on a name-token (the most reliable signal that
 * the user wrote a skill specifically for this).
 *
 * Returns the top-K matches sorted by score (>= 1). Empty array means no
 * user skill should be considered.
 *
 * TODO(bug22-followup): replace with embedding-based scoring once skill
 * descriptions go through `bridgeStorePattern`. The keyword scorer is a
 * bridge — it covers the obvious "polymarket" / "kali" / "geo" / "ceo"
 * cases that the hardcoded built-in catalog misses, but won't catch
 * synonyms or paraphrases.
 */

import type { UserAgent, UserSkill } from './claude-code-registry.js';

export interface UserSkillMatch {
  type: 'skill' | 'agent';
  name: string;
  score: number;
  description?: string;
  matchedKeywords: string[];
}

export function tokenizeForSkillMatching(text: string): string[] {
  return text
    .toLowerCase()
    // Split on non-alphanumerics so dashes / underscores yield separate tokens.
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3);
}

export const COMMON_STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'use', 'when', 'how', 'has',
  'are', 'you', 'can', 'all', 'any', 'should', 'will', 'have', 'been', 'was',
  'were', 'into', 'from', 'about', 'task', 'tasks', 'agent', 'agents', 'skill',
  'skills', 'using', 'used', 'than', 'then', 'their', 'there', 'where',
]);

export function buildSkillKeywordBag(
  skill: UserSkill | UserAgent,
): { tokens: Set<string>; nameTokens: Set<string> } {
  const nameTokens = new Set(tokenizeForSkillMatching(skill.name));
  const bag = new Set<string>(nameTokens);

  // Cap how much we mine from descriptions — long descriptions otherwise
  // drown out the skill-name signal.
  if (skill.description) {
    const descTokens = tokenizeForSkillMatching(skill.description).slice(0, 40);
    for (const t of descTokens) {
      if (!COMMON_STOPWORDS.has(t)) bag.add(t);
    }
  }
  return { tokens: bag, nameTokens };
}

export function matchUserSkillsForTask(
  task: string,
  context: string | undefined,
  skills: UserSkill[],
  agents: UserAgent[],
  topK = 5,
): UserSkillMatch[] {
  const taskTokens = new Set([
    ...tokenizeForSkillMatching(task),
    ...(context ? tokenizeForSkillMatching(context) : []),
  ]);
  if (taskTokens.size === 0) return [];

  const candidates: UserSkillMatch[] = [];

  for (const skill of skills) {
    const { tokens, nameTokens } = buildSkillKeywordBag(skill);
    let score = 0;
    const matched: string[] = [];
    for (const t of taskTokens) {
      if (tokens.has(t)) {
        // Name-token match weighted 2× — strongest signal.
        const weight = nameTokens.has(t) ? 2 : 1;
        score += weight;
        matched.push(t);
      }
    }
    if (score >= 1) {
      candidates.push({
        type: 'skill',
        name: skill.name,
        score,
        description: skill.description,
        matchedKeywords: matched,
      });
    }
  }

  // Also consider user agents — many agents (polymarket-analyzer, ceo,
  // polybot-ops) are addressable directly even if there's no skill for them.
  for (const agent of agents) {
    const { tokens, nameTokens } = buildSkillKeywordBag(agent);
    let score = 0;
    const matched: string[] = [];
    for (const t of taskTokens) {
      if (tokens.has(t)) {
        const weight = nameTokens.has(t) ? 2 : 1;
        score += weight;
        matched.push(t);
      }
    }
    if (score >= 1) {
      candidates.push({
        type: 'agent',
        name: agent.name,
        score,
        description: agent.description,
        matchedKeywords: matched,
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, topK);
}
