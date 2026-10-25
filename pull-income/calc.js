/* Pull Income: the numbers. No DOM here, so it also runs under Node for the tests. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PullCalc = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Stars from the base game loop. Weekly and monthly figures are built from these.
  const BASE = {
    loginDaily: 20, missionDaily: 15,           // every day
    stampWeekly: 160,                           // weekly stamp
    eventStars: 360 + 400,                      // one event: reward + story
    tickets: 3,                                 // Our Notes tickets per event
    missionPassWeekly: 320,                     // Premium Mission Pass (Event), paid Stars
    seasonFree: 200, seasonPaid: 1500,          // Season Mission Pass, per month
  };
  const STARS_PER_PULL = 200;
  const EVENTS_PER_MONTH = 4;

  // Our Notes passes. freeDaily and monthlyStars are Stars; excl/ded are weekly pulls; pickupDaily is a daily pull.
  const TIERS = {
    f2p:      { sub: '',         freeDaily: 0,  monthlyStars: 0,    excl: 0, ded: 0, pickupDaily: 0 },
    lite:     { sub: 'Lite',     freeDaily: 10, monthlyStars: 400,  excl: 1, ded: 0, pickupDaily: 0 },
    standard: { sub: 'Standard', freeDaily: 30, monthlyStars: 1200, excl: 0, ded: 1, pickupDaily: 0 },
    premium:  { sub: 'Premium',  freeDaily: 60, monthlyStars: 2400, excl: 0, ded: 1, pickupDaily: 1 },
  };

  const DAILY_BASE = BASE.loginDaily + BASE.missionDaily;
  // Weeks and days that each period spans: [weeks, days]. Daily rewards are counted per day, weekly rewards per week.
  const SPAN = { daily: [0, 1], weekly: [1, 7], monthly: [EVENTS_PER_MONTH, 30] };

  /* Income for one pass: Stars and pulls for a day, a week and a month. */
  function calc(key, mission, seasonPaid) {
    const t = TIERS[key];
    const mp = mission ? BASE.missionPassWeekly : 0;
    const sp = BASE.seasonFree + (seasonPaid ? BASE.seasonPaid : 0);
    const stars = {
      daily:   DAILY_BASE + t.freeDaily,
      weekly:  DAILY_BASE * 7 + BASE.stampWeekly + BASE.eventStars + t.freeDaily * 7 + mp,
      monthly: DAILY_BASE * 30 + (BASE.stampWeekly + BASE.eventStars) * EVENTS_PER_MONTH + t.freeDaily * 30 + mp * EVENTS_PER_MONTH + t.monthlyStars + sp,
    };
    const out = {};
    for (const p of Object.keys(SPAN)) {
      const [weeks, days] = SPAN[p];
      const starPulls = stars[p] / STARS_PER_PULL;
      const tickets = p === 'daily' ? 0 : BASE.tickets * weeks;
      const excl = t.excl * weeks, ded = t.ded * weeks, pickup = t.pickupDaily * days;
      out[p] = {
        stars: stars[p], starPulls, tickets, excl, ded, pickup,
        total: starPulls + tickets + excl + ded + pickup,
        notesOnly: starPulls + tickets,
        pickupOnly: starPulls + pickup,
      };
    }
    return out;
  }

  /* What you hold after `days` days, starting from `have` ({stars, tickets}).
     Daily income counts every day, weekly income is spread over 7 days and monthly over 30.
     Pulls are whole, so Stars and weekly rewards are rounded down. */
  function pullsAfter(key, mission, seasonPaid, days, have) {
    const t = TIERS[key];
    const weeklyStars = BASE.stampWeekly + BASE.eventStars + (mission ? BASE.missionPassWeekly : 0);
    const monthlyStars = t.monthlyStars + BASE.seasonFree + (seasonPaid ? BASE.seasonPaid : 0);
    const stars = have.stars + (DAILY_BASE + t.freeDaily) * days + Math.floor(weeklyStars * days / 7) + Math.floor(monthlyStars * days / 30);
    const starPulls = Math.floor(stars / STARS_PER_PULL);
    const tickets = have.tickets + Math.floor(BASE.tickets * days / 7);
    const weekly = Math.floor((t.excl + t.ded) * days / 7), pickup = t.pickupDaily * days;
    return { stars, notesOnly: starPulls + tickets, pickupOnly: starPulls + pickup, total: starPulls + tickets + weekly + pickup };
  }

  /* First day on which `count` ('notesOnly' | 'pickupOnly' | 'total') reaches `goal`, or null within maxDays. */
  function daysToGoal(key, mission, seasonPaid, have, count, goal, maxDays = 3650) {
    for (let d = 0; d <= maxDays; d++) if (pullsAfter(key, mission, seasonPaid, d, have)[count] >= goal) return d;
    return null;
  }

  return { BASE, TIERS, STARS_PER_PULL, calc, pullsAfter, daysToGoal };
}));
