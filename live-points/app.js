/* Live Points: the page. Reads the numbers from calc.js and draws the tables. */
(function () {
  'use strict';
  const { $, nf, seg, num, setValue, store } = UI;
  const D = LiveData, C = LiveCalc, S = LiveState;
  const { RANKS, CHALLENGE_CP, SHOP } = D;
  const { perSong, plan, logPlay, songsFor, freeOpts, planOpts, freeMult, betterPlan, bestForFlames } = C;

  const STORE_KEY = 'ournotes.live-points.v1', LEGACY_KEY = 'liveCalc2';
  const TARGET_LABEL = { ep: 'event points', bd: 'badges', cp: 'CP' };
  const PLAYERS = [['f2p', 'F2P'], ['spender', 'Spender']];

  let st = S.normalize(store.load(STORE_KEY, LEGACY_KEY));
  let days = C.daysToSaturday();
  const save = () => store.save(STORE_KEY, st);
  const cur = () => st[st.tab];
  const whole = (el, max) => Math.floor(num(el, max));
  const pl = (n, w) => `${nf(n)} ${w}${n === 1 ? '' : 's'}`;
  const small = x => `<small>${x}</small>`;

  const optLabel = (tab, o) => tab === 'free'
    ? [o, o === 0 ? 'No flame' : (o === 1 ? '1 flame' : o + ' flames'), 'x' + freeMult(o) + (o === 4 || o === 5 ? ' spender' : '')]
    : [o, nf(o) + ' CP', 'x' + o / D.CP_PER_MULTIPLIER];
  const bonusText = b => `bonus ${b.ep}% points, ${b.bd}% badges`;
  const costText = (tab, v) => tab === 'free' ? pl(v, 'flame') : `${nf(v)} CP`;
  const onlyWarn = () => `<span class="warn">only ${days} possible</span>`;

  /* ---------- Free Live and Challenge Live tabs ---------- */

  /* The Challenge Live tab plan, used to check how much CP the Free Lives need to earn. */
  function chPlan() {
    const c = st.ch;
    let n = c.songs;
    if (c.mode === 'goal') { const per = perSong('ch', st.rank, c.opt, c.bonus)[c.target]; n = per > 0 ? Math.ceil(c.amount / per) : 0; }
    return { n, opt: c.opt, cp: n * c.opt };
  }

  const cpDiff = d => d === null ? '<td>–</td>' : `<td class="${d >= 0 ? 'gain' : 'loss'}">${d >= 0 ? '+' : '−'}${nf(Math.abs(d))}</td>`;

  function fundCell(r) {
    if (r.songs === null) return '<td>–</td>';
    const per = perSong('free', st.rank, st.free.opt, st.free.bonus).cp;
    const need = per > 0 ? Math.ceil(r.spent / per) : 0;
    return `<td>${nf(need)}${st.free.opt === 10 && need > days ? onlyWarn() : ''}</td>`;
  }

  /* One row per option: songs, cost, and everything those songs give. */
  function optionTable(t, rows, hitKey, selOpt) {
    const chn = chPlan(), free = t === 'free';
    const hit = k => (k === hitKey ? ' class="hit"' : '');
    const head = `<thead><tr><th>${free ? 'Flames per song' : 'CP per song'}</th><th>Songs</th><th>${free ? 'Flames spent' : 'CP spent'}</th><th>Event points</th><th>Badges</th>${free ? '<th>CP earned</th><th>CP vs Challenge plan</th>' : '<th>Free Lives to fund</th>'}</tr></thead>`;
    const body = rows.map(r => {
      const [, l, x] = optLabel(t, r.opt), dash = r.songs === null;
      return `<tr${r.opt === selOpt ? ' class="sel"' : ''}><td>${l} ${small(x)}</td>` +
        `<td>${dash ? '–' : nf(r.songs)}${(free && r.opt === 10 && !dash && r.songs > days) ? onlyWarn() : ''}</td><td>${dash ? '–' : nf(r.spent)}</td>` +
        `<td${hit('ep')}>${dash ? '–' : nf(r.ep)}</td><td${hit('bd')}>${dash ? '–' : nf(r.bd)}</td>${free ? `<td${hit('cp')}>${dash ? '–' : nf(r.cp)}</td>` + cpDiff(dash ? null : r.cp - chn.cp) : fundCell(r)}</tr>`;
    }).join('');
    return `<div class="scroll"><table>${head}<tbody>${body}</tbody></table></div>`;
  }

  function render() {
    const t = st.tab, c = cur(), free = t === 'free', isOpt = t === 'opt';
    seg($('tab'), 'tab', [['free', 'Free Live'], ['ch', 'Challenge Live'], ['opt', 'Plan both']], t, v => { st.tab = v; render(); });
    $('ctlMain').hidden = isOpt; $('ctlOpt').hidden = !isOpt; $('refPanel').hidden = isOpt;
    if (isOpt) { renderOptControls(); renderOpt(); return; }

    seg($('rank'), 'rk', RANKS.map(r => [r, r]), st.rank, v => { st.rank = v; render(); });
    $('costLabel').textContent = free ? 'Flames per song' : 'CP per song';
    if (free && !freeOpts(st.player).includes(c.opt)) c.opt = 1;
    seg($('player'), 'pl', PLAYERS, st.player, v => { st.player = v; render(); });
    seg($('cost'), 'co', (free ? freeOpts(st.player) : CHALLENGE_CP).map(o => optLabel(t, o)), c.opt, v => { c.opt = +v; render(); });
    seg($('mode'), 'md', [['songs', 'Play a number of songs'], ['goal', 'Reach a goal']], c.mode, v => { c.mode = v; render(); });

    const targets = free ? [['ep', 'Event points'], ['bd', 'Badges'], ['cp', 'CP']] : [['ep', 'Event points'], ['bd', 'Badges']];
    if (!targets.some(x => x[0] === c.target)) c.target = 'ep';
    $('target').innerHTML = targets.map(([v, l]) => `<option value="${v}"${v === c.target ? ' selected' : ''}>${l}</option>`).join('');
    setValue('bonusEp', c.bonus.ep); setValue('bonusBd', c.bonus.bd);
    setValue('songs', c.songs); setValue('amount', c.amount); setValue('have', st.have[c.target]);

    const goal = c.mode === 'goal';
    $('daysField').hidden = !free; $('playerField').hidden = !free;
    setValue('daysMain', days);
    $('songsField').hidden = goal; $('goalField').hidden = !goal; $('haveField').hidden = !goal; $('costField').hidden = goal;
    update();
  }

  function update() {
    const t = st.tab, c = cur(), free = t === 'free';
    const opts = free ? freeOpts(st.player) : CHALLENGE_CP;
    const per = perSong(t, st.rank, c.opt, c.bonus), chn = chPlan();
    const freeCp = perSong('free', st.rank, st.free.opt, st.free.bonus).cp;
    const fundHint = free
      ? ` CP vs Challenge plan compares each row's CP with the Challenge Live tab plan: ${pl(chn.n, 'song')} at ${nf(chn.opt)} CP is ${nf(chn.cp)} CP.`
      : ` Free Lives to fund uses the Free Live tab: ${costText('free', st.free.opt)} each gives ${nf(freeCp)} CP.`;
    let h = '';

    if (c.mode === 'songs') {
      const n = c.songs, p = plan(t, st.rank, c.opt, c.bonus, n);
      h += `<div class="tiles">
      <div class="tile t-ep"><span class="k">Event points</span><span class="v">${nf(p.ep)}</span><span class="s">${nf(per.ep)} per song</span></div>
      <div class="tile t-bd"><span class="k">Badges</span><span class="v">${nf(p.bd)}</span><span class="s">${nf(per.bd)} per song</span></div>
      ${free ? `<div class="tile t-cp"><span class="k">CP earned</span><span class="v">${nf(p.cp)}</span><span class="s">${nf(per.cp)} per song</span></div>` : ''}
      <div class="tile t-cost"><span class="k">${free ? 'Flames spent' : 'CP spent'}</span><span class="v">${nf(p.spent)}</span><span class="s">${pl(n, 'song')} at ${costText(t, c.opt)} each</span></div>
    </div>`;
      const rows = opts.map(o => Object.assign({ opt: o }, plan(t, st.rank, o, c.bonus, n)));
      h += `<section class="panel"><div class="head"><h2>${pl(n, 'song')} at each level</h2><span>Rank ${st.rank}, ${bonusText(c.bonus)}</span></div>${optionTable(t, rows, null, c.opt)}`;
      if (free) {
        const chCost = st.ch.opt, lives = Math.floor(p.cp / chCost);
        h += `<div class="hint">${nf(p.cp)} CP from the selected row covers ${pl(lives, 'Challenge Live')} at ${nf(chCost)} CP each.${c.opt === 10 && n > days ? ` 10 flame Lives are once a day, so only ${days} fit in the ${pl(days, 'day')} left.` : ''}${fundHint}</div>`;
      } else {
        h += `<div class="hint">${fundHint.trim()}</div>`;
      }
      h += '</section>';
    } else {
      const key = c.target, label = TARGET_LABEL[key];
      const have = st.have[key], need = Math.max(0, c.amount - have);
      const rows = opts.map(o => {
        const songs = songsFor(perSong(t, st.rank, o, c.bonus)[key], need);
        return songs === null ? { opt: o, songs: null } : Object.assign({ opt: o }, plan(t, st.rank, o, c.bonus, songs));
      });
      const haveHint = have <= 0 ? '' : need === 0 ? ` You already have ${nf(have)} ${label}, which reaches the goal.` : ` You already have ${nf(have)} ${label}, so the rows earn the other ${nf(need)}.`;
      h += `<section class="panel"><div class="head"><h2>To reach ${nf(c.amount)} ${label}</h2><span>Rank ${st.rank}, ${have > 0 ? `${nf(need)} still to earn, ` : ''}${bonusText(c.bonus)}</span></div>${optionTable(t, rows, key, null)}
      <div class="hint">Each row shows everything those songs give, so the amount you reach can be a little over the goal.${haveHint}${fundHint}</div></section>`;
    }
    $('results').innerHTML = h;
    renderLog();

    $('refSub').textContent = `${costText(t, c.opt)} per song, ${bonusText(c.bonus)}`;
    $('ref').innerHTML = `<thead><tr><th>Rank</th><th>Event points</th><th>Badges</th>${free ? '<th>CP</th>' : ''}</tr></thead><tbody>` +
      RANKS.map(r => { const p = perSong(t, r, c.opt, c.bonus); return `<tr${r === st.rank ? ' class="sel"' : ''}><td>${r}</td><td>${nf(p.ep)}</td><td>${nf(p.bd)}</td>${free ? `<td>${nf(p.cp)}</td>` : ''}</tr>`; }).join('') + '</tbody>';
    updateShop();
  }

  /* ---------- Log plays: +1 after each finished song, -1 to undo ---------- */

  let logCtx = {};                 // what each +1 / -1 button applies, set by renderLog
  let pickFo = null, pickCo = null; // Plan both: the levels chosen in the log, or null for the best plan's

  const gain = (tab, rank, opt, bonus) => {
    const p = perSong(tab, rank, opt, bonus);
    return `+${nf(p.ep)} points, +${nf(p.bd)} badges, ${tab === 'free' ? `+${nf(p.cp)}` : `−${nf(opt)}`} CP`;
  };
  const logButtons = kind => `<div class="btns"><button type="button" data-kind="${kind}" data-d="-1" aria-label="Remove one ${kind === 'free' ? 'Free' : 'Challenge'} Live">−1</button><button type="button" class="primary" data-kind="${kind}" data-d="1" aria-label="Add one ${kind === 'free' ? 'Free' : 'Challenge'} Live">+1</button></div>`;
  const logRow = (kind, title, picker, rank, opt, bonus) =>
    `<div class="logrow"><div class="logtxt"><strong>${title}</strong>${picker || ` <span class="dim">${optLabel(kind, opt)[1]}, rank ${rank}</span>`}<small>${gain(kind, rank, opt, bonus)} per song</small></div>${logButtons(kind)}</div>`;
  const picker = (id, kind, opts, value) =>
    `<select id="${id}" aria-label="${kind === 'free' ? 'Flames' : 'CP'} for the log">${opts.map(o => `<option value="${o}"${o === value ? ' selected' : ''}>${optLabel(kind, o)[1]}</option>`).join('')}</select>`;

  function renderLog(best) {
    const t = st.tab, h = st.have;
    let rows = '';
    if (t === 'free') {
      logCtx = { free: { rank: st.rank, opt: st.free.opt, bonus: st.free.bonus } };
      rows = logRow('free', 'Free Live', null, st.rank, st.free.opt, st.free.bonus);
    } else if (t === 'ch') {
      logCtx = { ch: { rank: st.rank, opt: st.ch.opt, bonus: st.ch.bonus } };
      rows = logRow('ch', 'Challenge Live', null, st.rank, st.ch.opt, st.ch.bonus);
    } else {
      const o = st.opt, fl = freeOpts(st.player);
      const fo = fl.includes(pickFo) ? pickFo : (best && fl.includes(best.fo) ? best.fo : 1);
      const co = CHALLENGE_CP.includes(pickCo) ? pickCo : (best ? best.co : 200);
      logCtx = { free: { rank: o.fr, opt: fo, bonus: o.fb }, ch: { rank: o.cr, opt: co, bonus: o.cb } };
      rows = logRow('free', 'Free Live', ' ' + picker('logFo', 'free', fl, fo) + ` <span class="dim">rank ${o.fr}</span>`, o.fr, fo, o.fb) +
             logRow('ch', 'Challenge Live', ' ' + picker('logCo', 'ch', CHALLENGE_CP, co) + ` <span class="dim">rank ${o.cr}</span>`, o.cr, co, o.cb);
    }
    $('logPanel').innerHTML = `<div class="head"><h2>Log plays</h2><span>Have ${nf(h.ep)} points, ${nf(h.bd)} badges, ${nf(h.cp)} CP</span></div>${rows}` +
      `<div class="hint">+1 adds a finished song to what you already have. −1 takes one back. A Challenge Live also spends its CP.</div>`;
  }

  function onLog(e) {
    const b = e.target.closest('button[data-kind]'); if (!b) return;
    const c = logCtx[b.dataset.kind]; if (!c) return;
    st.have = logPlay(st.have, b.dataset.kind, c.rank, c.opt, c.bonus, +b.dataset.d, S.MAX.have);
    render();
  }

  /* ---------- Plan both lives tab ---------- */

  function renderOptControls() {
    const o = st.opt;
    seg($('oFR'), 'ofr', RANKS.map(r => [r, r]), o.fr, v => { o.fr = v; renderOpt(); });
    seg($('oCR'), 'ocr', RANKS.map(r => [r, r]), o.cr, v => { o.cr = v; renderOpt(); });
    seg($('oPlayer'), 'opl', PLAYERS, st.player, v => { st.player = v; renderOpt(); });
    seg($('oObj'), 'oob', [['songs', 'Total songs'], ['flames', 'Flames spent']], o.obj, v => { o.obj = v; renderOpt(); });
    [['oAmount', o.amount], ['oHave', st.have[o.target]], ['oFBe', o.fb.ep], ['oFBb', o.fb.bd], ['oCBe', o.cb.ep], ['oCBb', o.cb.bd], ['oCP0', st.have.cp], ['oFl', o.flames == null ? '' : o.flames]]
      .forEach(([id, v]) => setValue(id, v));
    $('oTarget').value = o.target;
    setValue('daysOpt', days);
  }

  function renderOpt() {
    const k = st.opt.target, label = TARGET_LABEL[k], have = st.have[k];
    const o = Object.assign({}, st.opt, { days, cp0: st.have.cp, amount: Math.max(0, st.opt.amount - have) });
    const rows = planOpts(st.player).map(fo => ({ fo, p: bestForFlames(o, fo) }));
    let best = null;
    rows.forEach(r => { if (r.p && betterPlan(o.obj, r.p, best)) best = r.p; });
    let h = '';
    if (best) {
      h += `<div class="tiles">
      <div class="tile t-cost"><span class="k">Total songs</span><span class="v">${nf(best.songs)}</span><span class="s">${nf(best.n10 + best.y)} Free + ${nf(best.nC)} Challenge</span></div>
      <div class="tile t-cost"><span class="k">Free Lives</span><span class="v">${nf(best.n10 + best.y)}</span><span class="s">${nf(best.n10)} at 10 flames + ${nf(best.y)} at ${pl(best.fo, 'flame')}</span></div>
      <div class="tile t-cost"><span class="k">Challenge Lives</span><span class="v">${nf(best.nC)}</span><span class="s">${nf(best.co)} CP each, ${nf(best.nC * best.co)} in total</span></div>
      <div class="tile t-cost"><span class="k">Flames spent</span><span class="v">${nf(best.flames)}</span></div>
      <div class="tile t-ep"><span class="k">Event points</span><span class="v">${nf(best.ep)}</span></div>
      <div class="tile t-bd"><span class="k">Badges</span><span class="v">${nf(best.bd)}</span></div>
      <div class="tile t-cp"><span class="k">CP left over</span><span class="v">${nf(best.cpLeft)}</span></div>
    </div>`;
    } else {
      h += `<section class="panel"><div class="hint first">No plan earns ${nf(o.amount)} ${label} with ${nf(o.flames)} flames. Raise the flame limit or lower the goal.</div></section>`;
    }
    const hit = c => (c === k ? ' class="hit"' : '');
    h += `<section class="panel"><div class="head"><h2>Best plan for each flame level</h2><span>Goal ${nf(st.opt.amount)} ${label}${have > 0 ? `, ${nf(o.amount)} still to earn` : ''}, ${pl(days, 'day')} left</span></div><div class="scroll"><table>
    <thead><tr><th>Other Free Lives at</th><th>10 flame Lives</th><th>Lives at that level</th><th>Challenge CP</th><th>Challenge Lives</th><th>Total songs</th><th>Flames</th><th>Event points</th><th>Badges</th><th>CP left</th></tr></thead><tbody>` +
      rows.map(r => {
        const [, l, x] = optLabel('free', r.fo), p = r.p;
        if (!p) return `<tr><td>${l} ${small(x)}</td><td colspan="9" class="none">Not reachable with that flame limit</td></tr>`;
        return `<tr${p === best ? ' class="sel"' : ''}><td>${l} ${small(x)}</td><td>${nf(p.n10)}</td><td>${nf(p.y)}</td><td>${nf(p.co)}</td><td>${nf(p.nC)}</td><td>${nf(p.songs)}</td><td>${nf(p.flames)}</td><td${hit('ep')}>${nf(p.ep)}</td><td${hit('bd')}>${nf(p.bd)}</td><td>${nf(p.cpLeft)}</td></tr>`;
      }).join('') + `</tbody></table></div>
    <div class="hint">Each row plays up to one 10 flame Live a day, then uses that flame level for the other Free Lives. The shaded row is the best plan for what you chose to minimise. Event points and badges are what the plan earns, on top of what you already have.</div></section>`;
    $('results').innerHTML = h;
    renderLog(best);
    updateShop();
  }

  /* ---------- Event shop ---------- */

  const shopTotal = () => SHOP.reduce((s, it, i) => s + it.cost * (st.shop[i] || 0), 0);

  function buildShop() {
    $('shop').innerHTML = `<thead><tr><th>Item</th><th>Reward</th><th>Cost each</th><th>Max</th><th>Buy</th><th>Subtotal</th></tr></thead><tbody>` +
      SHOP.map((it, i) => `<tr><td class="name">${it.en ? `${it.en}<small>${it.jp}</small>` : it.jp}</td><td class="q">x${nf(it.qty)}</td><td>${nf(it.cost)}</td><td>${it.max}</td>` +
        `<td><input type="number" min="0" max="${it.max}" step="1" inputmode="numeric" data-i="${i}" id="shop-${i}" aria-label="Buy count" value="${st.shop[i] || 0}"></td><td id="sub-${i}"></td></tr>`).join('') + '</tbody>';
    updateShop();
  }

  function updateShop() {
    SHOP.forEach((it, i) => { const el = $('sub-' + i); if (el) el.textContent = nf(it.cost * (st.shop[i] || 0)); });
    const all = SHOP.reduce((s, it) => s + it.cost * it.max, 0), tot = shopTotal(), have = st.have.bd;
    const haveText = have <= 0 || tot === 0 ? '' : tot > have ? `. You have ${nf(have)}, ${nf(tot - have)} more to earn` : `. You have ${nf(have)}, which is enough`;
    $('shopTotal').innerHTML = `${nf(tot)} <small>badges, of ${nf(all)} for everything${haveText}</small>`;
    save();
  }

  const syncShopInputs = () => SHOP.forEach((it, i) => { $('shop-' + i).value = st.shop[i]; });

  /* ---------- Inputs ---------- */

  const bindOpt = (id, fn) => $(id).addEventListener('input', e => { fn(e.target); renderOpt(); });
  const bonusInput = (id, set) => $(id).addEventListener('input', e => { set(num(e.target, S.MAX.bonus)); update(); });

  function bindInputs() {
    bonusInput('bonusEp', v => { cur().bonus.ep = v; });
    bonusInput('bonusBd', v => { cur().bonus.bd = v; });
    $('songs').addEventListener('input', e => { cur().songs = whole(e.target, S.MAX.songs); update(); });
    $('amount').addEventListener('input', e => { cur().amount = whole(e.target, S.MAX.amount); update(); });
    $('have').addEventListener('input', e => { st.have[cur().target] = whole(e.target, S.MAX.have); update(); });
    $('target').addEventListener('change', e => { cur().target = e.target.value; render(); });

    bindOpt('oAmount', el => { st.opt.amount = whole(el, S.MAX.amount); });
    bindOpt('oFBe', el => { st.opt.fb.ep = num(el, S.MAX.bonus); });
    bindOpt('oFBb', el => { st.opt.fb.bd = num(el, S.MAX.bonus); });
    bindOpt('oCBe', el => { st.opt.cb.ep = num(el, S.MAX.bonus); });
    bindOpt('oCBb', el => { st.opt.cb.bd = num(el, S.MAX.bonus); });
    bindOpt('oHave', el => { st.have[st.opt.target] = whole(el, S.MAX.have); });
    bindOpt('oCP0', el => { st.have.cp = whole(el, S.MAX.have); });
    bindOpt('oFl', el => { const v = parseFloat(el.value); st.opt.flames = isFinite(v) && v >= 0 ? Math.min(Math.floor(v), S.MAX.flames) : null; });
    $('logPanel').addEventListener('click', onLog);
    $('logPanel').addEventListener('change', e => {
      if (e.target.id === 'logFo') pickFo = +e.target.value;
      else if (e.target.id === 'logCo') pickCo = +e.target.value;
      else return;
      renderOpt();
    });
    $('oTarget').addEventListener('change', e => { st.opt.target = e.target.value; render(); });

    $('daysMain').addEventListener('input', e => { days = whole(e.target, C.MAX_DAYS); $('daysOpt').value = days; update(); });
    $('daysOpt').addEventListener('input', e => { days = whole(e.target, C.MAX_DAYS); $('daysMain').value = days; renderOpt(); });

    $('shop').addEventListener('input', e => {
      const el = e.target; if (!el.dataset.i) return;
      const i = +el.dataset.i, v = Math.floor(parseFloat(el.value));
      st.shop[i] = isFinite(v) ? Math.min(Math.max(v, 0), SHOP[i].max) : 0;
      updateShop();
    });
    $('shop').addEventListener('change', e => { const el = e.target; if (el.dataset.i) el.value = st.shop[+el.dataset.i]; });
    $('shopMax').onclick = () => { st.shop = SHOP.map(it => it.max); syncShopInputs(); updateShop(); };
    $('shopClear').onclick = () => { st.shop = SHOP.map(() => 0); syncShopInputs(); updateShop(); };
    $('shopGoal').onclick = () => {
      if (st.tab === 'opt') { st.opt.target = 'bd'; st.opt.amount = Math.min(shopTotal(), S.MAX.amount); render(); return; }
      const c = cur(); c.mode = 'goal'; c.target = 'bd'; c.amount = Math.min(shopTotal(), S.MAX.amount);
      $('amount').value = c.amount; render();
      try { $('results').scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { /* older browsers */ }
    };
    $('resetAll').onclick = () => {
      if (!confirm('Reset every setting, what you have and the event shop?')) return;
      st = S.normalize(null); days = C.daysToSaturday(); syncShopInputs(); render();
    };
  }

  bindInputs();
  buildShop();
  render();
})();
