'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../live-points/data.js');
const C = require('../live-points/calc.js');
const S = require('../live-points/state.js');

const none = { ep: 0, bd: 0 };

test('Free Live: 0 flames is x1, then x5 per flame, 10 flames is twice 5', () => {
  const at = f => C.perSong('free', 'S', f, none);
  assert.deepEqual(at(0), { ep: 75, bd: 90, cp: 8 });
  assert.deepEqual(at(1), { ep: 375, bd: 450, cp: 40 });
  assert.equal(at(2).ep, 750);
  assert.equal(at(3).ep, 1125);
  assert.equal(at(10).ep, at(5).ep * 2);
  assert.equal(at(10).cp, at(5).cp * 2);
  assert.equal(C.freeMult(0), 1);
  assert.equal(C.freeMult(10), 50);
});

test('Free Live tables: every flame level is 5x the one before the base', () => {
  for (const r of D.RANKS) for (const k of ['ep', 'bd', 'cp']) {
    const row = D.FREE[k][r];
    for (let f = 1; f <= 5; f++) assert.equal(row[f], row[0] * 5 * f);
  }
});

test('Challenge Live scales with CP: x1, x2, x4, x8, and gives no CP', () => {
  const at = cp => C.perSong('ch', 'S', cp, none);
  assert.deepEqual(at(200), { ep: 4500, bd: 4900, cp: 0 });
  assert.equal(at(400).ep, 9000);
  assert.equal(at(800).ep, 18000);
  assert.equal(at(1600).bd, 4900 * 8);
});

test('bonus applies to points and badges separately and rounds down per song', () => {
  const p = C.perSong('free', 'D', 0, { ep: 10, bd: 0 });  // 15 * 1.1 = 16.5 -> 16
  assert.equal(p.ep, 16);
  assert.equal(p.bd, 18);
  assert.equal(p.cp, 3);                                     // CP never gets a bonus
  assert.equal(C.bonusFloor(115, 0), 115);
  assert.equal(C.bonusFloor(100, 15), 115);                  // float noise must not give 114
});

test('plan multiplies per-song rewards by songs', () => {
  const p = C.plan('free', 'S', 1, none, 10);
  assert.deepEqual(p, { songs: 10, spent: 10, ep: 3750, bd: 4500, cp: 400 });
});

test('songsFor rounds up and handles zero rewards', () => {
  assert.equal(C.songsFor(375, 3751), 11);
  assert.equal(C.songsFor(0, 100), null);
});

test('F2P hides 4 and 5 flames', () => {
  assert.deepEqual(C.freeOpts('f2p'), [0, 1, 2, 3, 10]);
  assert.deepEqual(C.freeOpts('spender'), [0, 1, 2, 3, 4, 5, 10]);
});

test('days to Saturday counts today, Sunday gives 7, Saturday gives 1', () => {
  assert.equal(C.daysToSaturday(new Date(2026, 9, 25)), 7);  // Sunday
  assert.equal(C.daysToSaturday(new Date(2026, 9, 31)), 1);  // Saturday
  assert.equal(C.daysToSaturday(new Date(2026, 9, 28)), 4);  // Wednesday
});

const opt = (over) => Object.assign({ target: 'ep', amount: 100000, fr: 'S', fb: none, cr: 'S', cb: none, cp0: 0, flames: null, obj: 'songs', days: 7 }, over);

test('plan both: the plan reaches the goal and has enough CP', () => {
  for (const fo of C.planOpts('spender')) {
    const p = C.bestForFlames(opt(), fo);
    assert.ok(p.ep >= 100000);
    assert.ok(p.cpLeft >= 0);
    assert.ok(p.n10 <= 7);
    assert.equal(p.songs, p.n10 + p.y + p.nC);
  }
});

test('plan both: respects the flame limit and the once-a-day 10 flame Live', () => {
  const p = C.bestForFlames(opt({ flames: 100 }), 3);
  assert.ok(!p || p.flames <= 100);
  assert.equal(C.bestForFlames(opt({ days: 0, amount: 1 }), 0).n10, 0);
  assert.equal(C.bestForFlames(opt({ flames: 0, amount: 1e7 }), 3), null);
});

test('plan both: the solver matches a brute force search', () => {
  const o = opt({ amount: 60000, days: 3, cp0: 50 });
  for (const fo of [0, 1, 3]) for (const co of D.CHALLENGE_CP) {
    const got = C.solveOpt(o, fo, co);
    const pf = C.perSong('free', o.fr, fo, o.fb), p10 = C.perSong('free', o.fr, 10, o.fb), pc = C.perSong('ch', o.cr, co, o.cb);
    let best = null;
    for (let n10 = 0; n10 <= o.days; n10++) for (let nC = 0; nC <= 40; nC++) for (let y = 0; y <= 4000; y++) {
      const ep = n10 * p10.ep + y * pf.ep + nC * pc.ep, cp = o.cp0 + n10 * p10.cp + y * pf.cp - nC * co;
      if (ep < o.amount || cp < 0) continue;
      const cand = { songs: n10 + y + nC, flames: n10 * 10 + y * fo };
      if (C.betterPlan('songs', cand, best)) best = cand;
      break; // smallest y for this n10/nC is enough
    }
    assert.equal(got.songs, best.songs, `fo=${fo} co=${co}`);
    assert.equal(got.flames, best.flames, `fo=${fo} co=${co}`);
  }
});

test('shop: 18 items, everything costs 2,924,500 badges', () => {
  assert.equal(D.SHOP.length, 18);
  assert.equal(D.SHOP.reduce((s, it) => s + it.cost * it.max, 0), 2924500);
  for (const it of D.SHOP) assert.ok(it.en && it.jp);
});

test('normalize: junk gives defaults', () => {
  assert.deepEqual(S.normalize(null), S.defaults());
  assert.deepEqual(S.normalize({ tab: 'free', rank: 'Z', free: {}, ch: {} }), S.defaults());
});

test('normalize: migrates the old save format', () => {
  const old = Object.assign(S.defaults(), { opt: { target: 'bd', amount: 5, fr: 'A', fb: 25, cr: 'B', cb: 5, cp0: 300, flames: null, obj: 'songs' } });
  old.free.bonus = 20;                       // a single number used to cover both rewards
  delete old.have;
  const n = S.normalize(JSON.parse(JSON.stringify(old)));
  assert.deepEqual(n.free.bonus, { ep: 20, bd: 20 });
  assert.deepEqual(n.opt.fb, { ep: 25, bd: 25 });
  assert.equal(n.have.cp, 300);
  assert.equal('cp0' in n.opt, false);
});

test('normalize: clamps huge numbers and bad shop counts', () => {
  const s = S.defaults();
  s.free.amount = 1e15; s.free.songs = -4; s.shop[0] = 99; s.shop[1] = 'x'; s.opt.flames = 1e12;
  const n = S.normalize(s);
  assert.equal(n.free.amount, S.MAX.amount);
  assert.equal(n.free.songs, 0);
  assert.equal(n.shop[0], 1);                // max is 1
  assert.equal(n.shop[1], 0);
  assert.equal(n.opt.flames, S.MAX.flames);
});

test('normalize: a stale choice falls back (CP is not a Challenge Live goal, unknown flames)', () => {
  const s = S.defaults();
  s.ch.target = 'cp'; s.free.opt = 7; s.ch.opt = 123;
  const n = S.normalize(s);
  assert.equal(n.ch.target, 'ep');
  assert.equal(n.free.opt, 1);
  assert.equal(n.ch.opt, 200);
});
