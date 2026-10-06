import { products } from '../data/products.js';
import { MarketSystem } from './MarketSystem.js';
import { ServiceSystem } from './ServiceSystem.js';
import { AdvertisingSystem } from './AdvertisingSystem.js';

/** demand = baseDemand * weather * event * service * season * reputation * advertising * priceFactor (spec §16). */
export const DemandSystem = {
  compute(state, productId) {
    const p = state.products[productId];
    if (!p) return 0;
    const ev = state.todayEventEffects || {};

    let weatherMult = state.weather ? MarketSystem.weatherCategoryDemandMult(state.weather.id, p.category) : 1;
    let seasonMult = state.season ? state.season.trafficMult : 1;

    let eventMult = 1;
    if (ev.demandBoostAll) eventMult *= ev.demandBoostAll;
    if (ev.demandBoost && ev.demandBoost.categories?.includes(p.category)) eventMult *= ev.demandBoost.mult;

    const serviceMult = 1 + ServiceSystem.aggregate(state).customerBonus;
    const adsMult = AdvertisingSystem.aggregateCustomerMult(state);
    const reputationFactor = 0.5 + state.reputation / 100;

    const priceDef = state.prices[productId];
    const actualPrice = priceDef ? priceDef.value : p.referencePrice;
    // priceFactor = (referencePrice/actualPrice) ^ elasticity — giá cao hơn tham chiếu thì cầu giảm, và ngược lại.
    const priceFactor = Math.pow(p.referencePrice / Math.max(1, actualPrice), p.priceElasticity);

    return p.demand * weatherMult * eventMult * serviceMult * seasonMult * reputationFactor * adsMult * priceFactor;
  },
  /** Chọn `count` sản phẩm theo shoppingPattern của khách, có trọng số theo nhu cầu hiện tại. */
  pickProducts(state, rng, shoppingPattern, count) {
    const pool = products.map((p) => ({ p, w: Math.max(0.01, DemandSystem.compute(state, p.id)) }));
    const chosen = [];
    const used = new Set();
    for (let i = 0; i < count && chosen.length < pool.length; i++) {
      const candidates = pool.filter((x) => !used.has(x.p.id));
      if (!candidates.length) break;
      const pick = rng.weighted(candidates, (x) => x.w);
      used.add(pick.p.id);
      chosen.push(pick.p);
    }
    return chosen;
  },
};
