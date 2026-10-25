/* Pull Income: saved settings. Pure functions, so they run under Node for the tests. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PullState = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SCENARIOS = ['f2p', 'lite', 'standard', 'premium', 'all'];
  const PERIODS = ['daily', 'weekly', 'monthly'];
  const COUNTS = ['notesOnly', 'pickupOnly', 'total'];
  const MAX_AMOUNT = 1e9;
  const DAY_MS = 86400000;

  const pad = n => String(n).padStart(2, '0');
  const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const parseDate = s => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? new Date(+m[1], m[2] - 1, +m[3]) : null; };
  const startOfDay = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const whole = v => { const n = Math.floor(+v); return isFinite(n) && n > 0 ? Math.min(n, MAX_AMOUNT) : 0; };

  function defaults(today) {
    return {
      scenario: 'f2p', period: 'monthly', mission: false, seasonPaid: false,
      stars: 0, tickets: 0, goal: 100, until: isoDate(addDays(today, 30)), count: 'notesOnly',
    };
  }

  /* Turn whatever was saved into a valid state. Unknown or broken values fall back to the defaults. */
  function normalize(saved, today) {
    const s = saved && typeof saved === 'object' ? saved : {};
    const state = defaults(today);
    if (SCENARIOS.includes(s.scenario)) state.scenario = s.scenario;
    if (PERIODS.includes(s.period)) state.period = s.period;
    state.mission = !!s.mission;
    state.seasonPaid = !!s.seasonPaid;
    if (s.stars != null) state.stars = whole(s.stars);
    if (s.tickets != null) state.tickets = whole(s.tickets);
    if (s.goal != null) state.goal = whole(s.goal);
    const until = parseDate(s.until);
    if (until && until >= today) state.until = s.until;
    if (COUNTS.includes(s.count)) state.count = s.count;
    return state;
  }

  return { SCENARIOS, PERIODS, COUNTS, MAX_AMOUNT, DAY_MS, isoDate, addDays, parseDate, startOfDay, whole, defaults, normalize };
}));
