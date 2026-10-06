import { dailyQuestPool, questTemplates } from '../data/quests.js';

function progressFor(state, type) {
  switch (type) {
    case 'totalCustomersServed': return state.stats.totalCustomersServed;
    case 'reputation': return state.reputation;
    case 'servicesCount': return Object.keys(state.services).filter((k) => state.services[k]).length;
    case 'staffCount': return state.staff.length;
    case 'totalRevenue': return state.stats.totalRevenueAllTime;
    case 'dayProductsSold': return state.dayStats.productsSoldToday || 0;
    case 'dayCustomersServed': return state.dayStats.customersTotal;
    case 'dayNoAngryLeave': return state.dayStats.customersAngry === 0 && state.dayStats.customersTotal > 0 ? 1 : 0;
    case 'dayFreshBatchesSold': return state._freshBatchesSoldToday || 0;
    case 'dayFiveStarReviews': return state.reviews.filter((r) => r.day === state.day && r.stars === 5).length;
    default: return 0;
  }
}

export const QuestSystem = {
  initDaily(state, rng) {
    const picks = [];
    const pool = [...dailyQuestPool];
    while (picks.length < 3 && pool.length) {
      const idx = rng.int(0, pool.length - 1);
      picks.push({ ...pool.splice(idx, 1)[0], progress: 0, done: false, claimed: false });
    }
    state.dailyQuests = picks;
  },
  ensureLongTerm(state) {
    if (state.quests.length) return;
    state.quests = questTemplates.map((q) => ({ ...q, progress: 0, done: false, claimed: false }));
  },
  update(state) {
    (state.dailyQuests || []).forEach((q) => {
      q.progress = progressFor(state, q.type);
      if (!q.done && q.progress >= q.target) q.done = true;
    });
    (state.quests || []).forEach((q) => {
      q.progress = progressFor(state, q.type);
      if (!q.done && q.progress >= q.target) q.done = true;
    });
  },
  claim(state, questId, daily) {
    const list = daily ? state.dailyQuests : state.quests;
    const q = (list || []).find((x) => x.id === questId);
    if (!q || !q.done || q.claimed) return { ok: false };
    state.money += q.reward;
    q.claimed = true;
    return { ok: true };
  },
};
