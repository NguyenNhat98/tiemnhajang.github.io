import { products } from '../data/products.js';
import { InventorySystem } from '../systems/InventorySystem.js';
import { PricingSystem } from '../systems/PricingSystem.js';
import { CustomerSystem } from '../systems/CustomerSystem.js';
import { formatMoney } from '../core/Utils.js';

export function renderQueueStrip(container, engine, refresh) {
  const customers = engine.state.customers;
  if (!customers.length) {
    container.innerHTML = '<div class="queue-empty"><span class="queue-empty-icon">☕</span><span>Chưa có khách ghé tiệm</span></div>';
    return;
  }
  container.innerHTML = `<div class="queue-heading"><span>ĐANG CHỜ</span><b>${customers.length}</b></div><div class="queue-list">${customers.map((c) => {
    const pct = Math.round((c.patience / c.maxPatience) * 100);
    const cls = pct < 30 ? 'low' : pct < 60 ? 'mid' : '';
    return `<button class="queue-chip ${engine.activeCustomerId === c.id ? 'active' : ''}" data-cid="${c.id}">
      <span class="queue-avatar">${customerEmoji(c.personality)}</span>
      <span class="queue-customer-copy"><b>${c.name}</b><small>${c.personality}</small>
      <span class="patience-bar ${cls}"><i style="width:${pct}%"></i></span></span>
      <span class="queue-arrow">›</span>
    </button>`;
  }).join('')}</div>`;
  container.querySelectorAll('.queue-chip').forEach((el) => {
    el.onclick = () => { engine.dispatch({ type: 'SERVE_CUSTOMER', payload: { customerId: el.dataset.cid } }); refresh(); };
  });
}

export function renderOrderPanel(container, engine, refresh) {
  const state = engine.state;
  const customer = state.customers.find((c) => c.id === engine.activeCustomerId);
  if (!customer) {
    container.innerHTML = '<div class="empty-hint">Chọn khách đang chờ để bắt đầu lấy hàng.</div>';
    return;
  }

  const totalRequested = customer.cart.reduce((n, line) => n + line.quantity, 0);
  const totalCollected = customer.cart.reduce((n, line) => n + line.fulfilled, 0);
  const complete = totalCollected >= totalRequested;
  const pct = totalRequested ? Math.round(totalCollected / totalRequested * 100) : 100;
  const rows = customer.cart.map((line) => {
    const p = products.find((item) => item.id === line.productId);
    const qty = InventorySystem.totalQty(state, line.productId);
    const lineDone = line.fulfilled >= line.quantity;
    const price = PricingSystem.effectivePrice(state, line.productId);
    return `<article class="pick-card ${lineDone ? 'picked' : ''}">
      <span class="pick-icon">${p?.icon || '📦'}</span>
      <span class="pick-copy"><b>${p?.name || line.productId}</b><small>${formatMoney(price)} · còn ${qty} trong kho</small>
        <span class="pick-meter"><i style="width:${Math.min(100, line.fulfilled / line.quantity * 100)}%"></i></span>
      </span>
      <span class="pick-quantity">${line.fulfilled}<small>/${line.quantity}</small></span>
      ${line.fulfilled < line.quantity
        ? `<button class="pick-action" data-pick="${line.productId}" ${qty < 1 ? 'disabled' : ''}>${qty < 1 ? 'Hết hàng' : '＋ Lấy món'}</button>`
        : `<button class="pick-return" data-return="${line.productId}" aria-label="Bỏ một món">−</button>`}
    </article>`;
  }).join('');
  const total = Math.round(customer.cart.reduce((sum, line) => sum + PricingSystem.effectivePrice(state, line.productId) * line.fulfilled, 0) * customer.rewardBoost);
  const missing = Math.max(0, totalRequested - totalCollected);

  container.innerHTML = `
    <section class="order-panel">
      <header class="order-heading">
        <span class="order-avatar">${customerEmoji(customer.personality)}</span>
        <span class="order-customer"><small>ĐANG PHỤC VỤ</small><b>${customer.name}</b><span>${customer.personality}</span></span>
        <span class="order-count">${totalCollected}<small> / ${totalRequested}</small></span>
      </header>
      <div class="customer-speech"><span class="speech-mark">“</span>${CustomerSystem.orderSpeechText(state, customer)}</div>
      <div class="order-progress"><div><b>${complete ? 'Đã lấy đủ hàng' : 'Danh sách khách cần mua'}</b><span>${complete ? 'Có thể mang ra quầy' : `Còn thiếu ${missing} ${missing === 1 ? 'món' : 'món'}`}</span></div><i><b style="width:${pct}%"></b></i></div>
      <div class="pick-list">${rows}</div>
      <footer class="order-footer">
        <button class="btn danger order-cancel" id="btnCancel">Hủy đơn</button>
        <span class="order-total"><small>TẠM TÍNH</small><b>${formatMoney(total)}</b></span>
        <button class="btn success order-checkout" id="btnComplete" ${complete ? '' : 'disabled'}>${complete ? 'Mang ra quầy ›' : `Còn thiếu ${missing} món`}</button>
      </footer>
    </section>`;

  container.querySelectorAll('[data-pick]').forEach((el) => {
    el.onclick = () => { engine.dispatch({ type: 'SELL_PRODUCT', payload: { customerId: customer.id, productId: el.dataset.pick } }); refresh(); };
  });
  container.querySelectorAll('[data-return]').forEach((el) => {
    el.onclick = () => { engine.dispatch({ type: 'RETURN_PRODUCT', payload: { customerId: customer.id, productId: el.dataset.return } }); refresh(); };
  });
  container.querySelector('#btnComplete').onclick = () => {
    if (complete) { engine.dispatch({ type: 'COMPLETE_ORDER', payload: { customerId: customer.id } }); refresh(); }
  };
  container.querySelector('#btnCancel').onclick = () => { engine.dispatch({ type: 'CANCEL_ORDER', payload: { customerId: customer.id } }); refresh(); };
}

function customerEmoji(personality = '') {
  if (/bà|cô|mẹ/i.test(personality)) return '👩🏻';
  if (/chú|anh|công nhân|xe ôm/i.test(personality)) return '👨🏻';
  if (/trẻ con/i.test(personality)) return '🧒🏻';
  if (/vip|giàu/i.test(personality)) return '🧑🏻‍💼';
  return '🧑🏻';
}
