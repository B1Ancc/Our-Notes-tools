'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../pull-income/calc.js');
const S = require('../pull-income/state.js');

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} !== ${b}`);

test('daily, weekly and monthly F2P income', () => {
  const r = P.calc('f2p', false, false);
  assert.equal(r.daily.stars, 35);
  assert.equal(r.weekly.stars, 1165);
  assert.equal(r.monthly.stars, 4930);
  assert.equal(r.monthly.tickets, 12);   // 3 tickets x 4 events
  close(r.monthly.total, 36.65);
});

test('monthly totals per tier', () => {
  const total = k => P.calc(k, false, false).monthly.total;
  close(total('lite'), 44.15);
  close(total('standard'), 51.15);
  close(total('premium'), 91.65);
});

test('Premium Mission Pass adds 320 stars a week and 1,280 a month', () => {
  for (const k of Object.keys(P.TIERS)) {
    const a = P.calc(k, false, false), b = P.calc(k, true, false);
    assert.equal(b.weekly.stars - a.weekly.stars, 320);
    assert.equal(b.monthly.stars - a.monthly.stars, 1280);
  }
});

test('Season Mission Pass: free 200 always counted, buying adds 1,500', () => {
  const a = P.calc('f2p', false, false), b = P.calc('f2p', false, true);
  assert.equal(b.monthly.stars - a.monthly.stars, 1500);
  assert.equal(a.monthly.stars, 4930);
});

test('stars convert to pulls at 200 each', () => {
  close(P.calc('f2p', false, false).monthly.starPulls, 4930 / P.STARS_PER_PULL);
});

test('every tier earns at least as much as F2P and totals add up', () => {
  const f2p = P.calc('f2p', true, true).monthly.total;
  for (const k of Object.keys(P.TIERS)) {
    const m = P.calc(k, true, true).monthly;
    assert.ok(m.total >= f2p);
    close(m.total, m.starPulls + m.tickets + m.excl + m.ded + m.pickup);
  }
});

test('daysToGoal finds the first day that reaches the goal', () => {
  const d = P.daysToGoal('f2p', false, false, { stars: 0, tickets: 0 }, 'notesOnly', 100);
  assert.ok(d > 0);
  assert.ok(P.pullsAfter('f2p', false, false, d, { stars: 0, tickets: 0 }).notesOnly >= 100);
  assert.ok(P.pullsAfter('f2p', false, false, d - 1, { stars: 0, tickets: 0 }).notesOnly < 100);
});

test('normalize: junk falls back to defaults', () => {
  const today = new Date(2026, 9, 25);
  assert.deepEqual(S.normalize(null, today), S.defaults(today));
  assert.deepEqual(S.normalize('nope', today), S.defaults(today));
  const n = S.normalize({ scenario: 'bogus', stars: -5, goal: 'x', period: 'hourly' }, today);
  assert.equal(n.scenario, 'f2p');
  assert.equal(n.stars, 0);
  assert.equal(n.period, 'monthly');
});

test('normalize: amounts are whole numbers within the limit', () => {
  const n = S.normalize({ stars: 12.9, goal: 1e15 }, new Date(2026, 9, 25));
  assert.equal(n.stars, 12);
  assert.equal(n.goal, S.MAX_AMOUNT);
});

test('dates round-trip', () => {
  assert.equal(S.isoDate(S.addDays(new Date(2026, 0, 31), 1)), '2026-02-01');
});
