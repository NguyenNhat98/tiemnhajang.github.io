import { equipment as equipmentCatalog } from '../data/equipment.js';
import { freshCategories, frozenCategories } from '../data/products.js';

export const EquipmentSystem = {
  catalog: equipmentCatalog,
  buy(state, id) {
    const def = equipmentCatalog.find((e) => e.id === id);
    if (!def) return { ok: false, message: 'Thiết bị không tồn tại' };
    if (state.equipment[id]) return { ok: false, message: 'Đã sở hữu thiết bị này' };
    if (state.money < def.cost) return { ok: false, message: 'Không đủ tiền' };
    state.money -= def.cost;
    state.equipment[id] = { level: 1 };
    return { ok: true };
  },
  dailyUpkeep(state) {
    return Object.keys(state.equipment).reduce((sum, id) => {
      const def = equipmentCatalog.find((e) => e.id === id);
      return sum + (def ? def.dailyCost : 0);
    }, 0);
  },
  /** Gộp mọi hiệu ứng thiết bị đang sở hữu thành một bộ số nhân/bonus dùng chung toàn hệ thống. */
  aggregate(state) {
    const eff = {
      checkoutSpeedMult: 1, freshShelfLifeMult: 1, frozenShelfLifeMult: 1, capacityBonus: 0,
      customerMoodBonus: 0, qualityPerceptionBonus: 0, patienceMult: 1, eveningCustomerMult: 1,
      theftReduction: 0, blackoutProtected: false, serviceQuality: 0, inspectionReady: {},
      ownedIds: Object.keys(state.equipment),
    };
    eff.ownedIds.forEach((id) => {
      const def = equipmentCatalog.find((e) => e.id === id);
      if (!def) return;
      const t = def.tags || {};
      if (t.checkoutSpeedMult) eff.checkoutSpeedMult *= t.checkoutSpeedMult;
      if (t.freshShelfLifeMult) eff.freshShelfLifeMult = Math.max(eff.freshShelfLifeMult, t.freshShelfLifeMult);
      if (t.frozenShelfLifeMult) eff.frozenShelfLifeMult = Math.max(eff.frozenShelfLifeMult, t.frozenShelfLifeMult);
      if (t.capacityBonus) eff.capacityBonus += t.capacityBonus;
      if (t.customerMoodBonus) eff.customerMoodBonus += t.customerMoodBonus;
      if (t.qualityPerceptionBonus) eff.qualityPerceptionBonus += t.qualityPerceptionBonus;
      if (t.patienceMult) eff.patienceMult *= t.patienceMult;
      if (t.eveningCustomerMult) eff.eveningCustomerMult *= t.eveningCustomerMult;
      if (t.theftReduction) eff.theftReduction = Math.min(0.95, eff.theftReduction + t.theftReduction);
      if (t.blackoutProtected) eff.blackoutProtected = true;
      if (t.serviceQuality) eff.serviceQuality += t.serviceQuality;
      if (t.inspectionRequired) eff.inspectionReady[id] = true;
    });
    return eff;
  },
  shelfLifeFor(state, product) {
    const eff = EquipmentSystem.aggregate(state);
    let mult = 1;
    if (freshCategories.includes(product.category)) mult = eff.freshShelfLifeMult;
    if (frozenCategories.includes(product.category)) mult = Math.max(mult, eff.frozenShelfLifeMult);
    return Math.max(1, Math.round(product.shelfLife * mult));
  },
  capacity(state) {
    return 200 + EquipmentSystem.aggregate(state).capacityBonus;
  },
};
