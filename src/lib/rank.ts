import type { RankKey } from './types';

export function getRankKey(score: number): RankKey {
  if (score === 10) return 'security_sentinel';
  if (score >= 8) return 'cautious_operator';
  if (score >= 6) return 'aware_but_vulnerable';
  if (score >= 4) return 'at_risk';
  return 'high_exposure';
}
