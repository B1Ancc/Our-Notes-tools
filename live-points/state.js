/* Live Points: saved settings. Pure functions, so they run under Node for the tests. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./data.js'));
  else root.LiveState = factory(root.LiveData);
}(typeof self !== 'undefined' ? self : this, function (D) {
  'use strict';

  // Upper limits keep a typo (an extra zero or three) from freezing the page.
  const MAX = { amount: 1e8, have: 1e9, songs: 1e6, flames: 1e7, bonus: 1e4 };
  const TABS = ['free', 'ch', 'opt'];

  const int = (v, max) => Math.min(Math.max(0, Math.floor(+v || 0)), max);
  const pct = v => Math.min(Math.max(0, +v || 0), MAX.bonus);

  function defaults() {
    return {
      tab: 'free', rank: 'S', player: 'f2p', shop: D.SHOP.map(() => 0),
      have: { ep: 0, bd: 0, cp: 0 },
      opt: { target: 'ep', amount: 100000, fr: 'S', fb: { ep: 0, bd: 0 }, cr: 'S', cb: { ep: 0, bd: 0 }, flames: null, obj: 'songs' },
      free: { opt: 1, bonus: { ep: 0, bd: 0 }, mode: 'songs', songs: 10, target: 'ep', amount: 10000 },
      ch:   { opt: 200, bonus: { ep: 0, bd: 0 }, mode: 'songs', songs: 5, target: 'ep', amount: 50000 },
    };
  }

  /* Older saves kept one bonus number for both rewards. */
  const bonusOf = v => (v && typeof v === 'object') ? { ep: pct(v.ep), bd: pct(v.bd) } : { ep: pct(v), bd: pct(v) };

  /* Turn whatever was saved into a valid state. Anything unknown or broken falls back to the defaults. */
  function normalize(saved) {
    const d = defaults();
    if (!saved || typeof saved !== 'object' || !saved.free || !saved.ch || !D.RANKS.includes(saved.rank) || !TABS.includes(saved.tab)) return d;
    const st = Object.assign(d, saved);
    const free = Object.assign(defaults().free, saved.free), ch = Object.assign(defaults().ch, saved.ch), opt = Object.assign(defaults().opt, saved.opt || {});

    free.bonus = bonusOf(free.bonus); ch.bonus = bonusOf(ch.bonus); opt.fb = bonusOf(opt.fb); opt.cb = bonusOf(opt.cb);
    for (const c of [free, ch]) {
      if (c.mode !== 'songs' && c.mode !== 'goal') c.mode = 'songs';
      if (!['ep', 'bd', 'cp'].includes(c.target)) c.target = 'ep';
      c.songs = int(c.songs, MAX.songs); c.amount = int(c.amount, MAX.amount);
    }
    if (!D.FREE_FLAMES.includes(free.opt)) free.opt = 1;
    if (!D.CHALLENGE_CP.includes(ch.opt)) ch.opt = 200;
    if (ch.target === 'cp') ch.target = 'ep';

    // Older saves kept the CP you have as opt.cp0.
    const hv = saved.have || {};
    st.have = { ep: int(hv.ep, MAX.have), bd: int(hv.bd, MAX.have), cp: int(hv.cp != null ? hv.cp : opt.cp0, MAX.have) };
    delete opt.cp0;

    if (st.player !== 'f2p' && st.player !== 'spender') st.player = 'f2p';
    if (!D.RANKS.includes(opt.fr)) opt.fr = 'S';
    if (!D.RANKS.includes(opt.cr)) opt.cr = 'S';
    if (opt.target !== 'ep' && opt.target !== 'bd') opt.target = 'ep';
    if (opt.obj !== 'songs' && opt.obj !== 'flames') opt.obj = 'songs';
    opt.amount = int(opt.amount, MAX.amount);
    opt.flames = opt.flames == null ? null : int(opt.flames, MAX.flames);

    st.shop = Array.isArray(saved.shop) && saved.shop.length === D.SHOP.length ? saved.shop.map((n, i) => Math.min(int(n, D.SHOP[i].max), D.SHOP[i].max)) : D.SHOP.map(() => 0);
    st.free = free; st.ch = ch; st.opt = opt;
    return st;
  }

  return { MAX, TABS, defaults, normalize };
}));
