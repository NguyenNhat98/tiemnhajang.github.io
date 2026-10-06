import { DemandSystem } from './DemandSystem.js';
import { InventorySystem } from './InventorySystem.js';
import { PricingSystem } from './PricingSystem.js';
import { ReviewSystem } from './ReviewSystem.js';
import { ReputationSystem } from './ReputationSystem.js';

const PATTERN_COUNT = {
  impulse: () => 1,
  bulk: (rng) => rng.int(3, 5),
  specific: (rng) => rng.int(1, 3),
  small: (rng) => rng.int(1, 3),
};

export const OrderSystem = {
  /** spec §49: generateOrder(customer) — 1..5 sản phẩm theo shoppingPattern & nhu cầu hiện tại. */
  generateOrder(state, rng, customer) {
    const count = (PATTERN_COUNT[customer.shoppingPattern] || PATTERN_COUNT.small)(rng);
    const picked = DemandSystem.pickProducts(state, rng, customer.shoppingPattern, count);
    return picked.map((p) => ({
      productId: p.id,
      quantity: customer.shoppingPattern === 'bulk' ? rng.int(2, 5) : rng.int(1, 2),
    }));
  },
  validate(order, cart) {
    const mismatch = order.find((line) => {
      const got = cart.find((c) => c.productId === line.productId);
      return !got || got.fulfilled < line.quantity;
    });
    return mismatch ? { valid: false, reason: `Thiếu/sai: ${mismatch.productId}` } : { valid: true };
  },
  /** SELL_PRODUCT: lấy 1 đơn vị sản phẩm bỏ vào giỏ của khách đang phục vụ, FEFO ngay tại chỗ. */
  sellProduct(state, customerId, productId) {
    const customer = state.customers.find((c) => c.id === customerId);
    if (!customer || customer.status === 'done' || customer.status === 'left') return { ok: false };
    const line = customer.cart.find((l) => l.productId === productId);
    if (!line || line.fulfilled >= line.quantity) {
      customer.mistakes += 1;
      customer.mood = Math.max(0, customer.mood - 8);
      customer.patience = Math.max(0, customer.patience - customer.maxPatience * 0.06);
      return { ok: false, reason: 'wrong_item' };
    }
    const result = InventorySystem.consumeFEFO(state, productId, 1);
    if (result.taken < 1) {
      customer.mood = Math.max(0, customer.mood - 5);
      return { ok: false, reason: 'out_of_stock' };
    }
    line.fulfilled += 1;
    line._lastCost = result.avgCost;
    line._lastQuality = result.avgQuality;
    if (PricingSystem.isFreshSaleActive(state, productId)) state._freshBatchesSoldToday = (state._freshBatchesSoldToday || 0) + 1;
    customer.status = 'shopping';
    return { ok: true };
  },
  /** RETURN_PRODUCT: bỏ món đã lấy nhầm/thừa, hoàn lại kho (batch mới, giữ nguyên hạn trung bình tạm). */
  returnProduct(state, customerId, productId) {
    const customer = state.customers.find((c) => c.id === customerId);
    if (!customer) return { ok: false };
    const line = customer.cart.find((l) => l.productId === productId);
    if (!line || line.fulfilled <= 0) return { ok: false };
    line.fulfilled -= 1;
    InventorySystem.addBatch(state, productId, 1, line._lastCost || state.market[productId]?.buyPrice || 0);
    return { ok: true };
  },
  /** spec §50 completeOrder(customer, cart) — tính tiền, cập nhật kinh tế + review + uy tín. */
  completeOrder(state, customerId) {
    const customer = state.customers.find((c) => c.id === customerId);
    if (!customer) return null;
    let revenue = 0, cogs = 0, requested = 0, fulfilled = 0;
    customer.cart.forEach((line) => {
      requested += line.quantity;
      fulfilled += line.fulfilled;
      if (line.fulfilled > 0) {
        revenue += PricingSystem.effectivePrice(state, line.productId) * line.fulfilled;
        cogs += (line._lastCost || 0) * line.fulfilled;
      }
    });
    const fulfillRate = requested ? fulfilled / requested : 0;
    const validation = OrderSystem.validate(customer.order, customer.cart);
    if (!validation.valid) {
      customer.mood = Math.max(0, customer.mood - (1 - fulfillRate) * 40);
      customer.patience = Math.max(0, customer.patience - 20);
    }

    revenue = Math.round(revenue * customer.rewardBoost);
    state.money += revenue;
    state.dayStats.revenue += revenue;
    state.dayStats.cogs += cogs;
    state.stats.totalProductsSold += fulfilled;
    state.stats.totalCustomersServed += 1;
    state.stats.totalRevenueAllTime += revenue;
    state.dayStats.productsSoldToday += fulfilled;
    if (customer.loyalty >= 80) state.stats.loyalCustomerIds[customer.id] = true;

    customer.status = fulfillRate >= 0.99 ? 'done' : fulfillRate > 0 ? 'done' : 'left';
    if (customer.mood >= 65) state.dayStats.customersHappy += 1;
    else if (customer.mood >= 35) state.dayStats.customersNeutral += 1;
    else state.dayStats.customersAngry += 1;
    state.dayStats.customersTotal += 1;

    ReputationSystem.update(state, (customer.mood - 50) / 40);
    const review = ReviewSystem.maybeCreateReview(state, customer, fulfillRate);
    state.customers = state.customers.filter((c) => c.id !== customerId);
    return { revenue, cogs, fulfillRate, review, customer };
  },
  /** CANCEL_ORDER: khách hủy/bỏ đi — hoàn hết hàng đã lấy, không doanh thu. */
  cancelOrder(state, customerId, reason = 'cancelled') {
    const customer = state.customers.find((c) => c.id === customerId);
    if (!customer) return;
    customer.cart.forEach((line) => {
      if (line.fulfilled > 0) InventorySystem.addBatch(state, line.productId, line.fulfilled, line._lastCost || 0);
    });
    customer.status = 'left';
    customer.mood = Math.max(0, customer.mood - 20);
    state.dayStats.customersAngry += 1;
    state.dayStats.customersTotal += 1;
    ReputationSystem.update(state, -1);
    ReviewSystem.maybeCreateReview(state, customer, 0, true);
    state.customers = state.customers.filter((c) => c.id !== customerId);
  },
};
