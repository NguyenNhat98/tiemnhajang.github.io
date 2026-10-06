import { staffRoles } from '../data/staff.js';
import { StaffSystem } from '../systems/StaffSystem.js';
import { formatMoney } from '../core/Utils.js';

let hireCandidates = [];

export function renderStaffPanel(container, engine, refresh) {
  const state = engine.state;
  const roleInfo = (id) => staffRoles.find((r) => r.id === id) || { name: id, icon: '👤' };

  const current = state.staff.length
    ? `<div class="grid cards">${state.staff.map((s) => `<div class="item-card">
        <div class="title">${roleInfo(s.role).icon} ${s.name}</div>
        <div class="desc">${roleInfo(s.role).name} · Tốc độ ${s.speed} · Chính xác ${s.accuracy} · Mood ${Math.round(s.mood)}</div>
        <div class="price">Lương: ${formatMoney(s.salary)}/ngày</div>
        <button class="btn danger small" data-fire="${s.id}">Sa thải</button>
      </div>`).join('')}</div>`
    : `<div class="empty-hint">Chưa có nhân viên nào — tự làm hết mọi việc.</div>`;

  const candidates = hireCandidates.length
    ? `<div class="grid cards">${hireCandidates.map((c, i) => `<div class="item-card">
        <div class="title">${roleInfo(c.role).icon} ${c.name}</div>
        <div class="desc">${roleInfo(c.role).name} · Tốc độ ${c.speed} · Chính xác ${c.accuracy} · Kỹ năng ${c.skill}<br/>${c.hair}, ${c.outfit}</div>
        <div class="price">Phí tuyển: ${formatMoney(c.salary * 3)} · Lương ${formatMoney(c.salary)}/ngày</div>
        <button class="btn small" data-hire="${i}">Thuê</button>
      </div>`).join('')}</div>`
    : `<button class="btn" id="btnFind">🔍 Tìm ứng viên mới</button>`;

  container.innerHTML = `
    <div class="panel-card"><h2 style="margin-top:0;">👥 Nhân viên hiện tại</h2>${current}</div>
    <div class="panel-card" style="margin-top:12px;"><h2 style="margin-top:0;">Tuyển dụng</h2>${candidates}</div>
  `;
  container.querySelector('#btnFind')?.addEventListener('click', () => {
    hireCandidates = [StaffSystem.rollCandidate(engine.rng), StaffSystem.rollCandidate(engine.rng), StaffSystem.rollCandidate(engine.rng)];
    refresh();
  });
  container.querySelectorAll('[data-hire]').forEach((btn) => {
    btn.onclick = () => {
      engine.dispatch({ type: 'HIRE_STAFF', payload: { candidate: hireCandidates[Number(btn.dataset.hire)] } });
      hireCandidates = [];
      refresh();
    };
  });
  container.querySelectorAll('[data-fire]').forEach((btn) => {
    btn.onclick = () => { engine.dispatch({ type: 'FIRE_STAFF', payload: { staffId: btn.dataset.fire } }); refresh(); };
  });
}
