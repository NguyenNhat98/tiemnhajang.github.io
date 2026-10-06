import { equipment as equipmentCatalog } from '../data/equipment.js';
import { services as serviceCatalog } from '../data/services.js';
import { advertising as adCatalog } from '../data/advertising.js';
import { formatMoney } from '../core/Utils.js';

export function renderEquipmentPanel(container, engine, refresh) {
  const state = engine.state;
  container.innerHTML = `<div class="panel-card"><h2 style="margin-top:0;">🛠️ Thiết bị</h2>
    <div class="grid cards">${equipmentCatalog.map((e) => {
      const owned = !!state.equipment[e.id];
      return `<div class="item-card">
        <div class="title">${e.icon} ${e.name}</div>
        <div class="desc">${e.effect}</div>
        <div class="price">${formatMoney(e.cost)}${e.dailyCost ? ' · ' + formatMoney(e.dailyCost) + '/ngày' : ''}</div>
        ${owned ? '<span class="owned-tag">Đã sở hữu</span>' : `<button class="btn small" data-buy="${e.id}">Mua</button>`}
      </div>`;
    }).join('')}</div></div>`;
  container.querySelectorAll('[data-buy]').forEach((btn) => {
    btn.onclick = () => { engine.dispatch({ type: 'BUY_EQUIPMENT', payload: { id: btn.dataset.buy } }); refresh(); };
  });
}

export function renderServicesPanel(container, engine, refresh) {
  const state = engine.state;
  container.innerHTML = `<div class="panel-card"><h2 style="margin-top:0;">🔓 Dịch vụ</h2>
    <div class="grid cards">${serviceCatalog.map((s) => {
      const owned = !!state.services[s.id];
      const locked = state.reputation < s.reputationRequirement;
      return `<div class="item-card">
        <div class="title">${s.icon} ${s.name}</div>
        <div class="desc">Yêu cầu uy tín ${s.reputationRequirement} · +${Math.round(s.customerBonus * 100)}% khách · DT phụ ~${formatMoney(s.extraRevenue)}/ngày</div>
        <div class="price">${formatMoney(s.unlockCost)}${s.dailyCost ? ' · ' + formatMoney(s.dailyCost) + '/ngày' : ''}</div>
        ${owned ? '<span class="owned-tag">Đang hoạt động</span>' : locked ? `<span class="muted">Cần uy tín ${s.reputationRequirement}</span>` : `<button class="btn small" data-unlock="${s.id}">Mở khóa</button>`}
      </div>`;
    }).join('')}</div></div>`;
  container.querySelectorAll('[data-unlock]').forEach((btn) => {
    btn.onclick = () => { engine.dispatch({ type: 'START_SERVICE', payload: { id: btn.dataset.unlock } }); refresh(); };
  });
}

export function renderAdsPanel(container, engine, refresh) {
  const state = engine.state;
  const active = state.ads.map((a) => {
    const def = adCatalog.find((x) => x.id === a.id);
    return def ? `<span class="stat-pill" style="color:#2e2420;background:#f1e5d2;">${def.icon} ${def.name} · còn ${a.daysLeft} ngày</span>` : '';
  }).join(' ');
  container.innerHTML = `<div class="panel-card"><h2 style="margin-top:0;">📣 Quảng cáo</h2>
    ${active ? `<p>${active}</p>` : '<p class="muted">Chưa có chiến dịch nào đang chạy.</p>'}
    <div class="grid cards">${adCatalog.map((a) => `<div class="item-card">
        <div class="title">${a.icon} ${a.name}</div>
        <div class="desc">Thời lượng ${a.duration} ngày · x${a.customerMultiplier} khách · uy tín +${a.reputationEffect}</div>
        <div class="price">${formatMoney(a.cost)}</div>
        <button class="btn small" data-ad="${a.id}">Chạy quảng cáo</button>
      </div>`).join('')}</div></div>`;
  container.querySelectorAll('[data-ad]').forEach((btn) => {
    btn.onclick = () => { engine.dispatch({ type: 'BUY_AD', payload: { id: btn.dataset.ad } }); refresh(); };
  });
}
