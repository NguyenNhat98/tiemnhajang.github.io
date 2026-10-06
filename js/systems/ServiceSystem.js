import { services as serviceCatalog } from '../data/services.js';

export const ServiceSystem = {
  catalog: serviceCatalog,
  unlock(state, id) {
    const def = serviceCatalog.find((s) => s.id === id);
    if (!def) return { ok: false };
    if (state.services[id]) return { ok: false, message: 'Đã mở khóa' };
    if (state.reputation < def.reputationRequirement) return { ok: false, message: 'Chưa đủ uy tín' };
    if (def.requiresRole && !state.staff.some((s) => s.role === def.requiresRole)) {
      return { ok: false, message: `Cần nhân viên vai trò "${def.requiresRole}"` };
    }
    if (state.money < def.unlockCost) return { ok: false, message: 'Không đủ tiền' };
    state.money -= def.unlockCost;
    state.services[id] = true;
    return { ok: true };
  },
  dailyUpkeep(state) {
    return Object.keys(state.services).filter((id) => state.services[id])
      .reduce((sum, id) => sum + (serviceCatalog.find((s) => s.id === id)?.dailyCost || 0), 0);
  },
  /** Doanh thu phụ ước tính, có trọng số theo uy tín và theo khung giờ (sáng/trưa) nếu dịch vụ có boost đó. */
  dailyRevenueEstimate(state) {
    const hour = state.time;
    return Object.keys(state.services).filter((id) => state.services[id]).reduce((sum, id) => {
      const def = serviceCatalog.find((s) => s.id === id);
      if (!def) return sum;
      let mult = 0.6 + state.reputation / 250;
      if (def.morningBoost && hour < 9) mult *= def.morningBoost;
      if (def.noonBoost && hour >= 11 && hour <= 13) mult *= def.noonBoost;
      return sum + def.extraRevenue * mult;
    }, 0);
  },
  aggregate(state) {
    const owned = Object.keys(state.services).filter((id) => state.services[id]);
    let customerBonus = 0, loyaltyBoost = 0;
    owned.forEach((id) => {
      const def = serviceCatalog.find((s) => s.id === id);
      if (def) { customerBonus += def.customerBonus; loyaltyBoost += def.loyaltyBoost || 0; }
    });
    return { customerBonus, loyaltyBoost, owned };
  },
};
