import { uid } from '../core/Utils.js';
import { EquipmentSystem } from './EquipmentSystem.js';
import { freshCategories, frozenCategories } from '../data/products.js';

/** Kho hàng theo batch (spec §12), bán ưu tiên FEFO (hết hạn gần nhất trước), spoilage cuối ngày (spec §13). */
export const InventorySystem = {
  totalQty(state, productId) {
    return (state.inventory[productId] || []).reduce((s, b) => s + b.quantity, 0);
  },
  addBatch(state, productId, quantity, unitCost) {
    const product = state.products[productId];
    if (!product || quantity <= 0) return;
    if (!state.inventory[productId]) state.inventory[productId] = [];
    state.inventory[productId].push({
      batchId: uid('batch'), productId, quantity, cost: unitCost,
      daysLeft: EquipmentSystem.shelfLifeFor(state, product), quality: 100, purchasedDay: state.day,
    });
    if (state.stats) state.stats.totalRestocked += quantity;
  },
  /** FEFO: batch gần hết hạn nhất bán trước. Trả về {taken, avgCost, avgQuality}. */
  consumeFEFO(state, productId, qty) {
    const batches = state.inventory[productId];
    if (!batches || !batches.length) return { taken: 0, avgCost: 0, avgQuality: 0 };
    batches.sort((a, b) => a.daysLeft - b.daysLeft);
    let remaining = qty, taken = 0, costSum = 0, qualitySum = 0;
    for (const b of batches) {
      if (remaining <= 0) break;
      const take = Math.min(b.quantity, remaining);
      b.quantity -= take; remaining -= take; taken += take;
      costSum += take * b.cost; qualitySum += take * b.quality;
    }
    state.inventory[productId] = batches.filter((b) => b.quantity > 0);
    return { taken, avgCost: taken ? costSum / taken : 0, avgQuality: taken ? qualitySum / taken : 0 };
  },
  /** Cuối ngày: daysLeft -= 1; <=0 thì hỏng, ghi dayStats.spoil; quality giảm dần khi gần hết hạn. */
  applyDailyDecay(state) {
    let spoilLoss = 0, spoiledBatches = 0, freshBatchesSold = state._freshBatchesSoldToday || 0;
    Object.keys(state.inventory).forEach((pid) => {
      const kept = [];
      (state.inventory[pid] || []).forEach((b) => {
        const nb = { ...b, daysLeft: b.daysLeft - 1 };
        if (nb.daysLeft <= 0) { spoilLoss += nb.quantity * nb.cost; spoiledBatches += 1; }
        else { if (nb.daysLeft <= 1) nb.quality = Math.max(10, nb.quality - 30); kept.push(nb); }
      });
      state.inventory[pid] = kept;
    });
    return { spoilLoss, spoiledBatches, freshBatchesSold };
  },
  spoilFridgePct(state, pct) {
    let loss = 0;
    [...freshCategories, ...frozenCategories].forEach((cat) => {
      Object.values(state.products).filter((p) => p.category === cat).forEach((p) => {
        (state.inventory[p.id] || []).forEach((b) => {
          const lostQty = Math.floor(b.quantity * pct);
          loss += lostQty * b.cost;
          b.quantity -= lostQty;
        });
        state.inventory[p.id] = (state.inventory[p.id] || []).filter((b) => b.quantity > 0);
      });
    });
    return loss;
  },
  isNearExpiry(state, productId) {
    return (state.inventory[productId] || []).some((b) => b.daysLeft <= 1);
  },
};
