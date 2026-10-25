/* Pull Income: the page. Reads the calculator in calc.js and draws two tables. */
(function () {
  'use strict';
  const { $, nf, seg, num, setValue, store } = UI;
  const { TIERS, calc, pullsAfter, daysToGoal } = PullCalc;
  const S = PullState;

  const STORE_KEY = 'ournotes.pull-income.v1', LEGACY_KEY = 'pullIncome';
  const LABEL = { f2p: ['F2P', ''], lite: ['P2P', 'Lite'], standard: ['P2P', 'Standard'], premium: ['P2P', 'Premium'], all: ['All', 'compare'] };
  const PERIOD_LABEL = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };
  const COUNT_LABEL = { notesOnly: 'Our Notes only', pickupOnly: 'Pickup only', total: 'All pulls' };
  const COMPARE = ['f2p', 'lite', 'standard', 'premium'];
  const ROWS = [
    { sec: 'Income' },
    { k: 'stars', label: 'Stars', int: true },
    { sec: 'Pulls' },
    { k: 'starPulls', label: 'Star pulls' },
    { k: 'tickets', label: 'Event tickets' },
    { k: 'excl', label: 'Exclusive pulls' },
    { k: 'ded', label: 'Dedicated pulls' },
    { k: 'pickup', label: 'Pickup pulls' },
    { k: 'total', label: 'Total', total: true },
    { sec: 'Breakdown' },
    { k: 'notesOnly', label: 'Our Notes only' },
    { k: 'pickupOnly', label: 'Pickup only' },
  ];

  const fmt = n => (Math.round(n * 100) / 100).toFixed(2).replace(/\.?0+$/, '');
  const fmtDate = d => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const passName = k => TIERS[k].sub ? `P2P ${TIERS[k].sub}` : 'F2P';

  const state = S.normalize(store.load(STORE_KEY, LEGACY_KEY), S.startOfDay());

  function buildControls() {
    $('mp').addEventListener('change', e => { state.mission = e.target.checked; render(); });
    $('sp').addEventListener('change', e => { state.seasonPaid = e.target.checked; render(); });
    $('hStars').addEventListener('input', e => { state.stars = S.whole(e.target.value); render(); });
    $('hTickets').addEventListener('input', e => { state.tickets = S.whole(e.target.value); render(); });
    $('goal').addEventListener('input', e => { state.goal = S.whole(e.target.value); render(); });
    $('until').min = S.isoDate(S.startOfDay());
    $('until').addEventListener('change', e => { if (S.parseDate(e.target.value)) { state.until = e.target.value; render(); } });
  }

  function cell(r, v, bar = '') {
    const zero = !r.total && v === 0;
    return `<td${zero ? ' class="zero"' : ''}>${zero ? '–' : bar + (r.int ? nf(v) : fmt(v))}</td>`;
  }

  /* Main table: one pass over day, week and month, or all passes for one period. */
  function renderIncome(keys, all) {
    const data = Object.fromEntries(keys.map(k => [k, calc(k, state.mission, state.seasonPaid)]));
    const cols = all ? keys.map(k => ({ head: passName(k), get: key => data[k][state.period][key] }))
                     : S.PERIODS.map(p => ({ head: PERIOD_LABEL[p], get: key => data[keys[0]][p][key] }));
    const maxTotal = Math.max(...cols.map(c => c.get('total')));

    $('title').textContent = all ? `All options, ${PERIOD_LABEL[state.period].toLowerCase()}`
      : (TIERS[state.scenario].sub ? `P2P with ${TIERS[state.scenario].sub}` : 'Free to play') + (state.mission ? ' + Mission Pass' : '') + (state.seasonPaid ? ' + Season Pass' : '');

    let h = `<thead><tr><th></th>${cols.map(c => `<th>${c.head}</th>`).join('')}</tr></thead><tbody>`;
    for (const r of ROWS) {
      if (r.sec) { h += `<tr class="sec"><td colspan="${cols.length + 1}">${r.sec}</td></tr>`; continue; }
      h += `<tr${r.total ? ' class="total"' : ''}><td>${r.label}</td>`;
      for (const c of cols) {
        const v = c.get(r.k);
        const bar = (all && r.total) ? `<span class="bar" style="width:${Math.round(v / maxTotal * 40)}px"></span>` : '';
        h += cell(r, v, bar);
      }
      h += '</tr>';
    }
    $('tbl').innerHTML = h + '</tbody>';
  }

  /* Saving up: Stars and pulls by a date, and the day each pass reaches the goal. */
  function renderPlan(keys) {
    setValue('hStars', state.stars); setValue('hTickets', state.tickets); setValue('goal', state.goal); setValue('until', state.until);
    seg($('count'), 'ct', S.COUNTS.map(c => [c, COUNT_LABEL[c]]), state.count, v => { state.count = v; render(); });

    const have = { stars: state.stars, tickets: state.tickets };
    const start = S.startOfDay(), until = S.parseDate(state.until) || start;
    const days = Math.max(0, Math.round((until - start) / S.DAY_MS));
    let h = `<thead><tr><th></th><th>Stars by ${fmtDate(until)}</th><th>Pulls by then</th><th>Days to ${nf(state.goal)} pulls</th><th>Reached on</th></tr></thead><tbody>`;
    for (const k of keys) {
      const p = pullsAfter(k, state.mission, state.seasonPaid, days, have);
      const d = daysToGoal(k, state.mission, state.seasonPaid, have, state.count, state.goal);
      h += `<tr><td>${passName(k)}</td><td>${nf(p.stars)}</td><td${p[state.count] >= state.goal ? ' class="ok"' : ''}>${nf(p[state.count])}</td>` +
        (d === null ? '<td>–</td><td>Over 10 years</td>' : `<td>${d === 0 ? 'Already there' : nf(d)}</td><td>${fmtDate(S.addDays(start, d))}</td>`) + '</tr>';
    }
    $('plan').innerHTML = h + '</tbody>';
    $('planHint').textContent = `${nf(days)} day${days === 1 ? '' : 's'} from today. Counting: ${COUNT_LABEL[state.count]}. ` +
      'Weekly income is spread over 7 days and monthly income over 30, so the real day can be a few days off. Uses the passes chosen above.';
  }

  function render() {
    const all = state.scenario === 'all';
    seg($('scenario'), 'sc', S.SCENARIOS.map(k => [k, LABEL[k][0] + (LABEL[k][1] ? ` <small>${LABEL[k][1]}</small>` : '')]), state.scenario, v => { state.scenario = v; render(); });
    seg($('period'), 'pd', S.PERIODS.map(p => [p, PERIOD_LABEL[p]]), state.period, v => { state.period = v; render(); });
    $('mp').checked = state.mission;
    $('sp').checked = state.seasonPaid;
    $('period').hidden = !all;
    const keys = all ? COMPARE : [state.scenario];
    renderIncome(keys, all);
    renderPlan(keys);
    store.save(STORE_KEY, state);
  }

  buildControls();
  render();
})();
