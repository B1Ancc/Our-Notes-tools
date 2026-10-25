/* Live Points: the numbers. No DOM here, so it also runs under Node for the tests. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./data.js'));
  else root.LiveCalc = factory(root.LiveData);
}(typeof self !== 'undefined' ? self : this, function (D) {
  'use strict';

  const MAX_DAYS = 14;          // an event runs Sunday to Saturday
  const MAX_CHALLENGE_LIVES = 1e6;

  /* Free Live row for a flame count: [index into the tables, how many times that row counts]. 10 flames is the 5 flame row twice. */
  const freeIdx = f => f === 10 ? [5, 2] : [f, 1];
  const freeMult = f => f === 0 ? 1 : f * 5;
  /* Apply a bonus in percent, then round down. toFixed guards against float noise like 114.99999. */
  const bonusFloor = (base, bonus) => Math.floor(+(base * (100 + bonus) / 100).toFixed(6));

  /* What one song gives. tab is 'free' or 'ch'; opt is flames (free) or CP (challenge); bonus is {ep, bd} in percent. */
  function perSong(tab, rank, opt, bonus) {
    if (tab === 'free') {
      const [i, k] = freeIdx(opt);
      return { ep: bonusFloor(D.FREE.ep[rank][i] * k, bonus.ep), bd: bonusFloor(D.FREE.bd[rank][i] * k, bonus.bd), cp: D.FREE.cp[rank][i] * k };
    }
    const m = opt / D.CP_PER_MULTIPLIER;
    return { ep: bonusFloor(D.CHALLENGE[rank][0] * m, bonus.ep), bd: bonusFloor(D.CHALLENGE[rank][1] * m, bonus.bd), cp: 0 };
  }

  /* `songs` songs at one level: what they cost and what they give. */
  function plan(tab, rank, opt, bonus, songs) {
    const p = perSong(tab, rank, opt, bonus);
    return { songs, spent: songs * opt, ep: p.ep * songs, bd: p.bd * songs, cp: p.cp * songs };
  }

  /* Songs needed to earn `amount` at `per` each, or null if a song gives nothing. */
  const songsFor = (per, amount) => per > 0 ? Math.ceil(amount / per) : null;

  /* 4 and 5 flames are for spenders. F2P plays 0 to 3 flames plus the daily 10 flame Live. */
  const freeOpts = player => player === 'spender' ? [0, 1, 2, 3, 4, 5, 10] : [0, 1, 2, 3, 10];
  const planOpts = player => player === 'spender' ? [0, 1, 2, 3, 4, 5] : [0, 1, 2, 3];

  /* Days left until the event ends on Saturday, counting today. */
  function daysToSaturday(d) { d = d || new Date(); return (6 - d.getDay() + 7) % 7 + 1; }

  /* Plan both lives: Free Lives earn the CP that Challenge Lives spend. */
  function betterPlan(obj, a, b) {
    if (!b) return true;
    return obj === 'songs' ? (a.songs < b.songs || (a.songs === b.songs && a.flames < b.flames))
                           : (a.flames < b.flames || (a.flames === b.flames && a.songs < b.songs));
  }

  /* Best plan for one Free Live flame level `fo` and one Challenge CP level `co`.
     o: { target 'ep'|'bd', amount, fr, fb, cr, cb, cp0, flames (limit or null), obj 'songs'|'flames', days }.
     10 flame Lives are once a day, so at most `days` of them; every other Free Live uses level `fo`. */
  function solveOpt(o, fo, co) {
    const pf = perSong('free', o.fr, fo, o.fb), p10 = perSong('free', o.fr, 10, o.fb), pc = perSong('ch', o.cr, co, o.cb);
    const k = o.target, g = Math.max(0, o.amount), days = Math.min(Math.max(0, o.days || 0), MAX_DAYS);
    const maxC = pc[k] > 0 ? Math.min(Math.ceil(g / pc[k]), MAX_CHALLENGE_LIVES) : 0;
    let best = null;
    for (let n10 = 0; n10 <= days; n10++) {
      for (let nC = 0; nC <= maxC; nC++) {
        const left = g - nC * pc[k] - n10 * p10[k];
        const yE = left > 0 ? Math.ceil(left / pf[k]) : 0;                                   // Free Lives the goal needs
        const yC = Math.max(0, Math.ceil((nC * co - o.cp0 - n10 * p10.cp) / pf.cp));         // Free Lives the CP needs
        const y = Math.max(yE, yC);
        const flames = n10 * 10 + y * fo;
        if (o.flames == null || flames <= o.flames) {
          const cand = { fo, co, n10, y, nC, songs: n10 + y + nC, flames,
            ep: n10 * p10.ep + y * pf.ep + nC * pc.ep, bd: n10 * p10.bd + y * pf.bd + nC * pc.bd,
            cpLeft: o.cp0 + n10 * p10.cp + y * pf.cp - nC * co };
          if (betterPlan(o.obj, cand, best)) best = cand;
        }
        // Once CP is the limit, each extra Challenge Live only needs more Free Lives, so nothing past here is better.
        if (yC >= yE) break;
      }
    }
    return best;
  }

  /* Best plan for a Free Live flame level, trying every Challenge CP level. */
  function bestForFlames(o, fo) {
    let best = null;
    for (const co of D.CHALLENGE_CP) { const p = solveOpt(o, fo, co); if (p && betterPlan(o.obj, p, best)) best = p; }
    return best;
  }

  return { MAX_DAYS, freeIdx, freeMult, bonusFloor, perSong, plan, songsFor, freeOpts, planOpts, daysToSaturday, betterPlan, solveOpt, bestForFlames };
}));
