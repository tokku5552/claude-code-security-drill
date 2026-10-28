import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getRankKey } from '../src/lib/rank.ts';

test('getRankKey maps score boundaries to ranks', () => {
  assert.equal(getRankKey(10), 'security_sentinel');
  assert.equal(getRankKey(9), 'cautious_operator');
  assert.equal(getRankKey(8), 'cautious_operator');
  assert.equal(getRankKey(7), 'aware_but_vulnerable');
  assert.equal(getRankKey(6), 'aware_but_vulnerable');
  assert.equal(getRankKey(5), 'at_risk');
  assert.equal(getRankKey(4), 'at_risk');
  assert.equal(getRankKey(3), 'high_exposure');
  assert.equal(getRankKey(0), 'high_exposure');
});
