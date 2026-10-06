import { advertising as adCatalog } from '../data/advertising.js';
import { ReputationSystem } from './ReputationSystem.js';

export const AdvertisingSystem = {
  catalog: adCatalog,
  launch(state, id) {
    const def = adCatalog.find((a) => a.id === id);
    if (!def) return { ok: false };
    if (state.money < def.cost) return { ok: false, message: 'Không đủ tiền' };
    state.money -= def.cost;
    state.ads.push({ id, daysLeft: def.duration });
    ReputationSystem.update(state, def.reputationEffect);
    return { ok: true };
  },
  tick(state) {
    state.ads = state.ads.map((a) => ({ ...a, daysLeft: a.daysLeft - 1 })).filter((a) => a.daysLeft > 0);
  },
  aggregateCustomerMult(state) {
    return state.ads.reduce((mult, a) => {
      const def = adCatalog.find((x) => x.id === a.id);
      return def ? mult * def.customerMultiplier : mult;
    }, 1);
  },
};
