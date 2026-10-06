import { categories, products } from '../data/products.js';
import { InventorySystem } from '../systems/InventorySystem.js';
import { PricingSystem } from '../systems/PricingSystem.js';
import { CustomerSystem } from '../systems/CustomerSystem.js';
import { formatMoney } from '../core/Utils.js';

export function renderQueueStrip(container, engine, refresh) {
  const state = engine.state;
  if (!state.customers.length) {
    container.innerHTML = `<span class="muted" style="padding:6px;">Chưa có khách... đang chờ khách ghé 🙂</span>`;
    return;
  }
  container.innerHTML = state.customers.map((c) => {
    const pct = Math.round((c.patience / c.maxPatience) * 100);
    const cls = pct < 30 ? 'low' : pct < 60 ? 'mid' : '';
    return `<div class="queue-chip ${engine.activeCustomerId === c.id ? 'active' : ''}" data-cid="${c.id}">
      <b>${c.name}</b><br/><span class="muted">${c.personality}</span>
      <div class="patience-bar ${cls}"><div style="width:${pct}%"></div></div>
    </div>`;
  }).join('');
  container.querySelectorAll('.queue-chip').forEach((el) => {
    el.onclick = () => { engine.dispatch({ type: 'SERVE_CUSTOMER', payload: { customerId: el.dataset.cid } }); refresh(); };
  });
}

export function renderOrderPanel(container, engine, refresh) {
  const state = engine.state;
  const customer = state.customers.find((c) => c.id === engine.activeCustomerId);
  if (!customer) { container.innerHTML = `<div class="empty-hint">Chọn một khách ở hàng chờ phía trên để bắt đầu phục vụ.</div>`; return; }

  const shelves = categories.map((cat) => {
    const items = products.filter((p) => p.category === cat.id);
    return `<div class="shelf-group"><div class="label">${cat.icon} ${cat.name}</div>${items.map((p) => {
      const qty = InventorySystem.totalQty(state, p.id);
      const price = PricingSystem.effectivePrice(state, p.id);
      const needed = customer.cart.find((l) => l.productId === p.id && l.fulfilled < l.quantity);
      return `<div class="product-chip ${qty === 0 ? 'disabled' : ''} ${needed ? 'needed' : ''}" data-pid="${qty === 0 ? '' : p.id}" title="${p.name}">
        <span class="ic">${p.icon}</span><span class="q">${qty === 0 ? 'Hết' : qty}</span><span>${formatMoney(price)}</span>
      </div>`;
    }).join('')}</div>`;
  }).join('');

  container.innerHTML = `
    <div class="order-box">
      <div style="margin-bottom:6px;"><b>${customer.name}</b> (${customer.personality})<br/>${CustomerSystem.orderSpeechText(state, customer)}</div>
      ${customer.cart.map((l) => {
        const p = state.products[l.productId];
        const done = l.fulfilled >= l.quantity;
        return `<div class="order-line ${done ? 'complete' : ''}">${p?.icon || ''} ${p?.name || l.productId} — ${l.fulfilled}/${l.quantity}
          ${l.fulfilled > 0 ? `<button class="btn secondary small" data-return="${l.productId}">Bỏ món</button>` : ''}</div>`;
      }).join('')}
      <div style="display:flex;gap:8px;margin-top:8px;">
        <button class="btn success block" id="btnComplete">✅ Thanh toán</button>
        <button class="btn danger block" id="btnCancel">✖ Hủy đơn</button>
      </div>
    </div>
    <div>${shelves}</div>
  `;

  container.querySelectorAll('.product-chip[data-pid]:not([data-pid=""])').forEach((el) => {
    el.onclick = () => { engine.dispatch({ type: 'SELL_PRODUCT', payload: { customerId: customer.id, productId: el.dataset.pid } }); refresh(); };
  });
  container.querySelectorAll('[data-return]').forEach((el) => {
    el.onclick = () => { engine.dispatch({ type: 'RETURN_PRODUCT', payload: { customerId: customer.id, productId: el.dataset.return } }); refresh(); };
  });
  container.querySelector('#btnComplete').onclick = () => { engine.dispatch({ type: 'COMPLETE_ORDER', payload: { customerId: customer.id } }); refresh(); };
  container.querySelector('#btnCancel').onclick = () => { engine.dispatch({ type: 'CANCEL_ORDER', payload: { customerId: customer.id } }); refresh(); };
}
