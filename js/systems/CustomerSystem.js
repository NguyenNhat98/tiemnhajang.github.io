import { archetypes, generateVietnameseName } from '../data/customers.js';
import { uid } from '../core/Utils.js';
import { ReputationSystem } from './ReputationSystem.js';
import { EquipmentSystem } from './EquipmentSystem.js';
import { StaffSystem } from './StaffSystem.js';
import { ServiceSystem } from './ServiceSystem.js';
import { AdvertisingSystem } from './AdvertisingSystem.js';
import { OrderSystem } from './OrderSystem.js';

const PEAK_WINDOWS = [[6.5, 8.5], [11, 13], [17, 20.5]];
const QUIET_WINDOWS = [[9, 10.5], [14, 16]];

export const CustomerSystem = {
  pickArchetype(state, rng) {
    return rng.weighted(archetypes, (a) => {
      let w = 1;
      if (a.id === 'khach_quen') w *= 0.6 + state.reputation / 100;
      if (a.id === 'vip') w *= 0.1 + state.reputation / 180;
      if (a.id === 'khach_kho_tinh') w *= 1.3 - state.reputation / 200;
      return Math.max(0.05, w);
    });
  },
  /** spawnRate = baseTraffic * timeOfDay * weather * reputation * advertising * events (spec §33). */
  spawnRatePerHour(state) {
    const inPeak = PEAK_WINDOWS.some(([a, b]) => state.time >= a && state.time <= b);
    const inQuiet = QUIET_WINDOWS.some(([a, b]) => state.time >= a && state.time <= b);
    const timeOfDayMult = inPeak ? 1.6 : inQuiet ? 0.5 : 1.0;
    const weatherMult = state.weather ? state.weather.trafficMult : 1;
    const seasonMult = state.season ? state.season.trafficMult : 1;
    const eventMult = state.todayEventEffects?.demandBoostAll || 1;
    const eqMult = EquipmentSystem.aggregate(state).customerMoodBonus ? 1.05 : 1;
    const eveningMult = state.time >= 18 ? EquipmentSystem.aggregate(state).eveningCustomerMult : 1;
    const svcMult = 1 + ServiceSystem.aggregate(state).customerBonus;

    const baseTraffic = 3; // khách/giờ cơ sở — tiệm tạp hóa nhỏ, ~35-50 khách/ngày khi đông đúc nhất (spec §52)
    return baseTraffic * timeOfDayMult * weatherMult * seasonMult * eventMult
      * ReputationSystem.customerMultiplier(state) * AdvertisingSystem.aggregateCustomerMult(state)
      * eqMult * eveningMult * svcMult;
  },
  /** spec §48: generateCustomer() */
  spawn(state, rng) {
    const archetype = CustomerSystem.pickArchetype(state, rng);
    const eq = EquipmentSystem.aggregate(state);
    const staffEff = StaffSystem.aggregate(state);
    const maxPatience = archetype.patience * eq.patienceMult * staffEff.patienceMult;
    const customer = {
      id: uid('cust'),
      name: generateVietnameseName(rng),
      ageGroup: archetype.ageGroup,
      personality: archetype.personality,
      archetypeId: archetype.id,
      money: Math.round(rng.range(archetype.minMoney, archetype.maxMoney)),
      patience: maxPatience,
      maxPatience,
      priceSensitivity: archetype.priceSensitivity,
      loyalty: Math.round(rng.range(Math.max(0, archetype.loyalty - 20), Math.min(100, archetype.loyalty + 10))),
      mood: Math.round(rng.range(50, 100)),
      shoppingPattern: archetype.shoppingPattern,
      status: 'walk_in', // walk_in | queue | counter | shopping | done | left
      mistakes: 0,
      spawnedAtTime: state.time,
      rewardBoost: archetype.rewardBoost || 1,
      reviewBoost: archetype.reviewBoost || 1,
    };
    customer.order = OrderSystem.generateOrder(state, rng, customer);
    customer.cart = customer.order.map((line) => ({ ...line, fulfilled: 0 }));
    state.customers.push(customer);
    return customer;
  },
  orderSpeechText(state, customer) {
    const parts = customer.order.map((o) => {
      const p = state.products[o.productId];
      return `${o.quantity} ${p ? p.unit : ''} ${p ? p.name.toLowerCase() : o.productId}`;
    });
    return `${customer.personality} nói: "Cho ${parts.join(', ')} giúp em."`;
  },
  isOrderComplete(customer) {
    return customer.cart.every((l) => l.fulfilled >= l.quantity);
  },
};
