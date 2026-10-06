import { staffRoles, rollCandidate } from '../data/staff.js';

export const StaffSystem = {
  roles: staffRoles,
  rollCandidate,
  hire(state, candidate) { state.staff.push({ ...candidate }); },
  fire(state, staffId) { state.staff = state.staff.filter((s) => s.id !== staffId); },
  dailySalary(state) { return state.staff.reduce((sum, s) => sum + s.salary, 0); },
  /** Mood nhân viên trôi theo lương/khối lượng công việc — không phải buff tĩnh (spec §25). */
  updateMood(state, customersServedToday) {
    const workloadPenalty = Math.min(20, customersServedToday / Math.max(1, state.staff.length) / 3);
    state.staff.forEach((s) => {
      let delta = -workloadPenalty + 5; // nghỉ ngơi qua đêm hồi lại phần nào
      if (s.salary < 100000) delta -= 5; // lương thấp -> mood giảm thêm
      s.mood = Math.max(0, Math.min(100, s.mood + delta));
    });
  },
  aggregate(state) {
    const eff = { checkoutSpeedMult: 1, patienceMult: 1, theftReduction: 0, restockBonus: 0, deliveryUnlocked: false, moodAvg: 70 };
    let moodSum = 0;
    state.staff.forEach((s) => {
      const moodFactor = 0.5 + s.mood / 200; // mood thấp kéo hiệu suất xuống
      const perf = ((s.speed + s.accuracy + s.skill) / 300) * moodFactor;
      moodSum += s.mood;
      if (s.role === 'cashier') { eff.checkoutSpeedMult *= 1 + perf * 0.5; eff.patienceMult *= 1 + perf * 0.3; }
      if (s.role === 'stocker') { eff.restockBonus += perf * 10; }
      if (s.role === 'guard') { eff.theftReduction = Math.min(0.95, eff.theftReduction + 0.35 + perf * 0.3); }
      if (s.role === 'shipper') { eff.deliveryUnlocked = true; }
    });
    if (state.staff.length) eff.moodAvg = moodSum / state.staff.length;
    return eff;
  },
};
