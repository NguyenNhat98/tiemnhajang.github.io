import { achievementTemplates } from '../data/quests.js';
import { computeAssets, WIN_ASSETS } from '../core/GameState.js';
import { equipment as equipmentCatalog } from '../data/equipment.js';

export const AchievementSystem = {
  init(state) {
    achievementTemplates.forEach((a) => { if (!state.achievements[a.id]) state.achievements[a.id] = { ...a, unlocked: false }; });
  },
  update(state) {
    const unlock = (id) => {
      const a = state.achievements[id];
      if (a && !a.unlocked) { a.unlocked = true; state.notifications = state.notifications || []; state.notifications.push(`🏆 ${a.title}`); }
    };
    if (state.stats.totalCustomersServed >= 1) unlock('a_khai_truong');
    if (state.reputation >= 80) unlock('a_than_thien');
    if (computeAssets(state, equipmentCatalog) >= 100_000_000) unlock('a_cua_an_cua_de');
    if (computeAssets(state, equipmentCatalog) >= WIN_ASSETS) unlock('a_dai_gia');
    if (state.stats.hadViralReview) unlock('a_viral');
    if (Object.keys(state.stats.loyalCustomerIds).length >= 20) unlock('a_khach_quen');
    if (state.stats.totalRestocked >= 10000) unlock('a_ong_trum');
    if (state.stats.freshBatchesSoldAllTime >= 20) unlock('a_khong_hong_rau');
  },
};
