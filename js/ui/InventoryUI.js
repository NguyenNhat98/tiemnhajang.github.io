import { categories, products } from '../data/products.js';
import { InventorySystem } from '../systems/InventorySystem.js';
import { EquipmentSystem } from '../systems/EquipmentSystem.js';
import { formatMoney } from '../core/Utils.js';

export function renderInventoryPanel(container, engine, refresh) {
  const state = engine.state;
  const cap = EquipmentSystem.capacity(state);
  const rows = categories.map((cat) => {
    const items = products.filter((p) => p.category === cat.id);
    return `<h3>${cat.icon} ${cat.name}</h3>
    <table><thead><tr><th>Sản phẩm</th><th>Tồn kho</th><th>Giá nhập</th><th>SL nhập</th><th></th><th>Giá bán</th></tr></thead>
    <tbody>${items.map((p) => {
      const qty = InventorySystem.totalQty(state, p.id);
      const buyPrice = state.market[p.id]?.buyPrice || p.cost;
      const sellPrice = state.prices[p.id]?.value ?? p.referencePrice;
      return `<tr>
        <td>${p.icon} ${p.name} <span class="muted">(${p.unit})</span></td>
        <td>${qty}</td>
        <td>${formatMoney(buyPrice)}</td>
        <td><input type="number" min="0" value="10" style="width:64px" id="restock_${p.id}"/></td>
        <td><button class="btn small" data-buy="${p.id}">Nhập</button></td>
        <td><input type="number" min="0" value="${sellPrice}" style="width:84px" data-price="${p.id}"/></td>
      </tr>`;
    }).join('')}</tbody></table>`;
  }).join('');

  container.innerHTML = `
    <div class="panel-card">
      <h2 style="margin-top:0;">📦 Kho &amp; Nhập hàng — sức chứa ${cap}/sản phẩm</h2>
      <div class="grid cols-4">
        <button class="btn secondary small" id="adjM5">-5% tất cả</button>
        <button class="btn secondary small" id="adjP5">+5% tất cả</button>
        <button class="btn secondary small" id="adjP10">+10% tất cả</button>
        <button class="btn secondary small" id="adj0">Về giá tham chiếu</button>
      </div>
      <label style="display:block;margin:10px 0;"><input type="checkbox" id="freshToggle" ${state.settings.freshSaleEnabled ? 'checked' : ''}/>
        🔥 Tự động "Xả hàng tươi -30%" cho lô sắp hết hạn sau 18:00</label>
      ${rows}
    </div>`;

  container.querySelector('#adjM5').onclick = () => { engine.dispatch({ type: 'SET_GROUP_PRICE', payload: { pct: -0.05 } }); refresh(); };
  container.querySelector('#adjP5').onclick = () => { engine.dispatch({ type: 'SET_GROUP_PRICE', payload: { pct: 0.05 } }); refresh(); };
  container.querySelector('#adjP10').onclick = () => { engine.dispatch({ type: 'SET_GROUP_PRICE', payload: { pct: 0.10 } }); refresh(); };
  container.querySelector('#adj0').onclick = () => { engine.dispatch({ type: 'SET_GROUP_PRICE', payload: { pct: 0 } }); refresh(); };
  container.querySelector('#freshToggle').onchange = () => engine.dispatch({ type: 'TOGGLE_FRESH_SALE' });
  container.querySelectorAll('[data-buy]').forEach((btn) => {
    btn.onclick = () => {
      const qty = Math.max(0, parseInt(container.querySelector(`#restock_${btn.dataset.buy}`).value || '0', 10));
      if (qty > 0) engine.dispatch({ type: 'BUY_STOCK', payload: { productId: btn.dataset.buy, quantity: qty } });
      refresh();
    };
  });
  container.querySelectorAll('[data-price]').forEach((input) => {
    input.onchange = () => engine.dispatch({ type: 'SET_PRICE', payload: { productId: input.dataset.price, value: Number(input.value) } });
  });
}
