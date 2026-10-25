/* Live Points: game data. Edit the numbers here when the game changes. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LiveData = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const RANKS = ['D', 'C', 'B', 'A', 'S', 'SS'];

  // Free Live rewards per song, by rank, for 0, 1, 2, 3, 4 and 5 flames.
  // 0 flames is x1, then each flame adds x5 (1 flame x5, 2 flames x10, and so on).
  const FREE = {
    ep: { // event points
      SS: [100, 500, 1000, 1500, 2000, 2500], S: [75, 375, 750, 1125, 1500, 1875], A: [50, 250, 500, 750, 1000, 1250],
      B: [35, 175, 350, 525, 700, 875], C: [25, 125, 250, 375, 500, 625], D: [15, 75, 150, 225, 300, 375],
    },
    bd: { // badges (the event item reward)
      SS: [120, 600, 1200, 1800, 2400, 3000], S: [90, 450, 900, 1350, 1800, 2250], A: [60, 300, 600, 900, 1200, 1500],
      B: [42, 210, 420, 630, 840, 1050], C: [30, 150, 300, 450, 600, 750], D: [18, 90, 180, 270, 360, 450],
    },
    cp: { // Challenge Points
      SS: [10, 50, 100, 150, 200, 250], S: [8, 40, 80, 120, 160, 200], A: [6, 30, 60, 90, 120, 150],
      B: [5, 25, 50, 75, 100, 125], C: [4, 20, 40, 60, 80, 100], D: [3, 15, 30, 45, 60, 75],
    },
  };

  // Challenge Live rewards per song at 200 CP (x1): [event points, badges]. 400 CP is x2, 800 is x4, 1600 is x8.
  const CHALLENGE = { D: [1500, 2150], C: [2000, 2650], B: [2750, 3400], A: [3500, 4150], S: [4500, 4900], SS: [5500, 5650] };

  const FREE_FLAMES = [0, 1, 2, 3, 4, 5, 10]; // 10 flames is twice the 5 flame row and can be used once a day
  const CHALLENGE_CP = [200, 400, 800, 1600];
  const CP_PER_MULTIPLIER = 200;

  // Event shop. cost is in badges, qty is what one purchase gives, max is how many purchases are allowed.
  const SHOP = [
    { jp: 'SRスナップ（ボーナス）', en: 'Event SSR Snapshot (first)', qty: 1, cost: 75000, max: 1 },
    { jp: 'SRスナップ', en: 'Event SSR Snapshot', qty: 1, cost: 100000, max: 4 },
    { jp: 'アワーノーツガチャチケット', en: 'Our Notes Gacha Ticket', qty: 1, cost: 100000, max: 3 },
    { jp: '楽曲チケット', en: 'Song Ticket', qty: 1, cost: 5000, max: 10 },
    { jp: '奇跡のクリスタル', en: 'Crystal of Miracle', qty: 5, cost: 13500, max: 6 },
    { jp: '幸運のクリスタル', en: 'Crystal of Fortune', qty: 5, cost: 7200, max: 10 },
    { jp: 'SPスキル強化チケット', en: 'SP Skill Upgrade Ticket', qty: 5, cost: 13500, max: 20 },
    { jp: 'スキル強化チケット', en: 'Skill Upgrade Ticket', qty: 5, cost: 7200, max: 20 },
    { jp: 'ライブスキル強化チケット', en: 'LIVE Skill Upgrade Ticket', qty: 5, cost: 2100, max: 45 },
    { jp: '撃奏スキル強化チケット', en: 'GEKISO Skill Upgrade Ticket', qty: 5, cost: 2100, max: 45 },
    { jp: '希望のプリズム', en: 'Hope Prism', qty: 5, cost: 13500, max: 15 },
    { jp: '（バンド）プリズム', en: '(Band) Prism', qty: 5, cost: 7200, max: 30 },
    { jp: '（属性）のかけら（大）', en: '(Attribute) Fragment (L)', qty: 120, cost: 5500, max: 50 },
    { jp: '（属性）のかけら（中）', en: '(Attribute) Fragment (M)', qty: 240, cost: 5500, max: 50 },
    { jp: '（属性）のかけら（小）', en: '(Attribute) Fragment (S)', qty: 400, cost: 5500, max: 50 },
    { jp: 'メンバーEXP', en: 'Member EXP', qty: 20000, cost: 1100, max: 20 },
    { jp: 'スナップEXP', en: 'Snapshot EXP', qty: 20000, cost: 1100, max: 20 },
    { jp: 'コイン', en: 'Coin', qty: 60000, cost: 2800, max: 20 },
  ];

  return { RANKS, FREE, CHALLENGE, FREE_FLAMES, CHALLENGE_CP, CP_PER_MULTIPLIER, SHOP };
}));
