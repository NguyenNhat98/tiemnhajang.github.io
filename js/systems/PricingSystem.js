import { InventorySystem } from './InventorySystem.js';

/** Giá bán + "Xả hàng tươi -30%" sau 18:00 cho batch sắp hết hạn (spec §14, §32). */
export const PricingSystem = {
  setPrice(state, productId, value) {
    state.prices[productId] = { mode: 'custom', value: Math.max(0, Math.round(value)) };
  },
  bulkAdjust(state, pct) {
    Object.values(state.products).forEach((p) => {
      state.prices[p.id] = { mode: pct === 0 ? 'market' : 'custom', value: Math.round(p.referencePrice * (1 + pct)) };
    });
  },
  effectivePrice(state, productId) {
    const base = state.prices[productId]?.value ?? state.products[productId]?.referencePrice ?? 0;
    if (state.settings.freshSaleEnabled && state.time >= 18 && InventorySystem.isNearExpiry(state, productId)) {
      return Math.round(base * 0.7);
    }
    return base;
  },
  isFreshSaleActive(state, productId) {
    return state.settings.freshSaleEnabled && state.time >= 18 && InventorySystem.isNearExpiry(state, productId);
  },
  calculateCartTotal(state, cart) {
    return cart.reduce((sum, line) => sum + PricingSystem.effectivePrice(state, line.productId) * line.quantity, 0);
  },
};
