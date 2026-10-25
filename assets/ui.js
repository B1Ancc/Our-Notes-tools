/* Small helpers shared by both tools. Plain script, exposes window.UI. */
(function (root) {
  'use strict';

  const $ = id => document.getElementById(id);
  const nf = n => n.toLocaleString('en-US');

  /* Radio buttons drawn as segments. The markup is rebuilt only when the choices change,
     so a radio keeps keyboard focus after you pick it. items: [value, label, optionalSmallText]. */
  function seg(el, name, items, value, onPick) {
    const html = items.map(([v, l, sub]) =>
      `<input type="radio" name="${name}" id="${name}-${v}" value="${v}"><label for="${name}-${v}">${l}${sub ? `<small>${sub}</small>` : ''}</label>`).join('');
    if (el._html !== html) { el.innerHTML = html; el._html = html; }
    el.querySelectorAll('input').forEach(i => { i.checked = i.value === String(value); });
    el.onchange = e => onPick(e.target.value);
  }

  /* Read a number input. Empty, negative or invalid gives 0, and max caps it. */
  function num(el, max = Infinity) {
    const v = parseFloat(el.value);
    return isFinite(v) && v >= 0 ? Math.min(v, max) : 0;
  }

  /* Set an input's value, unless the user is typing in it right now. */
  function setValue(id, value) {
    const el = $(id);
    if (document.activeElement !== el) el.value = value;
  }

  /* localStorage that never throws (private windows, blocked storage). A legacy key lets old saves carry over. */
  const store = {
    load(key, legacyKey) {
      try {
        const raw = localStorage.getItem(key) || (legacyKey && localStorage.getItem(legacyKey));
        return raw ? JSON.parse(raw) : null;
      } catch (e) { return null; }
    },
    save(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
    },
  };

  root.UI = { $, nf, seg, num, setValue, store };
})(window);
