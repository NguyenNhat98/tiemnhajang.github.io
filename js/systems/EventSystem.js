import { events } from '../data/events.js';
import { ReputationSystem } from './ReputationSystem.js';
import { InventorySystem } from './InventorySystem.js';
import { EquipmentSystem } from './EquipmentSystem.js';

export const EventSystem = {
  /** Lịch cố định cho 2 event theo lịch Việt + random 55% các ngày còn lại (spec §15 "Ngày Rằm", "Ngày lĩnh lương"). */
  maybeTriggerDaily(state, rng) {
    if (state.activeEvent) return null;
    let forcedId = null;
    if (state.day % 15 === 0) forcedId = 'ngay_ram';
    else if (state.day % 30 === 5) forcedId = 'ngay_linh_luong';

    let def;
    if (forcedId) {
      def = events.find((e) => e.id === forcedId);
    } else {
      if (!rng.chance(0.55)) { state.todayEventEffects = {}; return null; }
      const pool = events.filter((e) => e.id !== 'ngay_ram' && e.id !== 'ngay_linh_luong' && !state.usedEventIds.includes(e.id));
      def = rng.pick(pool.length ? pool : events.filter((e) => e.id !== 'ngay_ram' && e.id !== 'ngay_linh_luong'));
    }
    state.activeEvent = { def };
    state.usedEventIds.push(def.id);
    if (state.usedEventIds.length > 12) state.usedEventIds.shift();
    // Hiệu ứng cung/cầu cấp "sự kiện" áp dụng cả ngày bất kể người chơi chọn lựa chọn nào.
    state.todayEventEffects = { demandBoost: def.demandBoost, demandBoostAll: def.demandBoostAll, costMultiplier: def.costMultiplier };
    return state.activeEvent;
  },
  resolveChoice(state, choiceIndex, rng) {
    const active = state.activeEvent;
    if (!active) return null;
    const choice = active.def.choices[choiceIndex];
    const result = EventSystem.applyChoice(state, choice, active.def, rng);
    state.eventLog.unshift({ day: state.day, title: active.def.title, choice: choice.label });
    state.activeEvent = null;
    return result;
  },
  /** Dùng chung cho EventSystem (sáng) và DramaSystem (trong ngày). */
  applyChoice(state, choice, def, rng) {
    const info = { closeToday: false, delayOpenHours: 0 };
    if (choice.cost) { state.money -= choice.cost; state.dayStats.incidents += choice.cost; }
    if (choice.reward) { state.money += choice.reward; state.dayStats.revenue += choice.reward; }
    if (choice.reputationEffect) ReputationSystem.update(state, choice.reputationEffect);
    if (choice.loyaltyEffect) { /* áp dụng cho khách đang tương tác nếu có, xử lý ở phía gọi (Drama) */ }

    if (choice.buyDiscount) state.todayEventEffects = { ...state.todayEventEffects, buyDiscount: choice.buyDiscount };
    if (choice.priceSuggestion) info.priceSuggestion = choice.priceSuggestion;

    if (choice.grantsEquipment) state.equipment[choice.grantsEquipment] = { level: 1 };
    if (choice.needsAllEquipment) {
      const missing = choice.needsAllEquipment.some((id) => !state.equipment[id]);
      if (missing) { state.money -= 500000; state.dayStats.incidents += 500000; ReputationSystem.update(state, -2); }
    }
    if (choice.spoilFridgePct) {
      const eq = EquipmentSystem.aggregate(state);
      if (!(choice.needsEquipmentToSkip && eq.blackoutProtected)) {
        const loss = InventorySystem.spoilFridgePct(state, choice.spoilFridgePct);
        state.dayStats.spoil += loss;
      }
    }
    if (choice.theftRisk && rng.chance(0.5)) {
      const eq = EquipmentSystem.aggregate(state);
      if (!rng.chance(eq.theftReduction)) {
        const loss = Math.round(rng.range(100000, 500000));
        state.money -= loss; state.dayStats.theft += loss;
      }
    }
    if (choice.closeToday) info.closeToday = true;
    if (choice.delayOpen) info.delayOpenHours = choice.delayOpen;
    if (choice.delayedEffect) {
      state.pendingDelayed.push({
        executeOnDay: state.day + choice.delayedEffect.days,
        type: 'EVENT',
        payload: choice.delayedEffect,
      });
    }
    return info;
  },
  applyDuePending(state, rng) {
    const due = state.pendingDelayed.filter((e) => e.executeOnDay <= state.day);
    due.forEach((e) => {
      const p = e.payload;
      const failed = p.failChance && rng.chance(p.failChance);
      if (failed) {
        state.notifications = state.notifications || [];
        state.notifications.push(p.failNote || `${p.note}: không xảy ra`);
      } else {
        state.money += p.money || 0;
        if (p.reputation) ReputationSystem.update(state, p.reputation);
        state.notifications = state.notifications || [];
        state.notifications.push(`${p.note}: ${(p.money || 0) >= 0 ? '+' : ''}${p.money || 0}đ`);
      }
    });
    state.pendingDelayed = state.pendingDelayed.filter((e) => e.executeOnDay > state.day);
  },
};
