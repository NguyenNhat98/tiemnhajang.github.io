import { formatMoney } from '../core/Utils.js';
import { computeAssets, WIN_ASSETS } from '../core/GameState.js';
import { equipment as equipmentCatalog } from '../data/equipment.js';

/** spec §40: màn hình báo cáo cuối ngày. */
export function renderEndDayModal(root, engine, handlers) {
  const state = engine.state;
  if (state.phase !== 'report' || !state.history.length) { root.innerHTML = ''; return; }
  const r = state.history[0];
  root.innerHTML = `<div class="modal-overlay"><div class="modal-box">
    <h2>📊 BÁO CÁO NGÀY ${r.day}</h2>
    <p>👥 Khách hàng ${r.customersTotal} — 😊 ${r.customersHappy} hài lòng · 😐 ${r.customersNeutral} bình thường · 😡 ${r.customersAngry} bỏ đi</p>
    <h3 style="margin-bottom:4px;">DOANH THU</h3>
    <div class="report-row pos"><span>Bán hàng</span><span>+${formatMoney(r.revenue)}</span></div>
    <div class="report-row pos"><span>Dịch vụ</span><span>+${formatMoney(r.serviceRevenue)}</span></div>
    <h3 style="margin-bottom:4px;">CHI PHÍ</h3>
    <div class="report-row neg"><span>Giá vốn</span><span>-${formatMoney(r.cogs)}</span></div>
    <div class="report-row neg"><span>Hàng hỏng</span><span>-${formatMoney(r.spoil)}</span></div>
    <div class="report-row neg"><span>Trộm cắp</span><span>-${formatMoney(r.theft)}</span></div>
    <div class="report-row neg"><span>Sự cố</span><span>-${formatMoney(r.incidents)}</span></div>
    <div class="report-row neg"><span>Nhân viên</span><span>-${formatMoney(r.salary)}</span></div>
    <div class="report-row neg"><span>Thuê mặt bằng</span><span>-${formatMoney(r.rent)}</span></div>
    <div class="report-row neg"><span>Điện nước</span><span>-${formatMoney(r.utilities)}</span></div>
    <div class="report-row neg"><span>Thuế</span><span>-${formatMoney(r.tax)}</span></div>
    <div class="report-row neg"><span>Lãi vay</span><span>-${formatMoney(r.loanInterest)}</span></div>
    <div class="report-row total" style="color:${r.netProfit >= 0 ? 'var(--green)' : 'var(--red)'}"><span>LÃI RÒNG</span><span>${formatMoney(r.netProfit)}</span></div>
    <p>⭐ Uy tín: ${Math.round(r.reputation)} &nbsp; 💰 Tiền: ${formatMoney(state.money)}</p>
    <p class="muted">Tổng tài sản hiện tại: ${formatMoney(computeAssets(state, equipmentCatalog))} / ${formatMoney(WIN_ASSETS)}</p>
    <button class="btn block" id="btnNextDay">➡️ Sang ngày tiếp theo</button>
  </div></div>`;
  root.querySelector('#btnNextDay').onclick = handlers.onNextDay;
}

export function renderHistoryPanel(container, engine) {
  const state = engine.state;
  if (!state.history.length) { container.innerHTML = `<div class="panel-card"><h2 style="margin-top:0;">📊 Báo cáo</h2><div class="empty-hint">Chưa có dữ liệu.</div></div>`; return; }
  container.innerHTML = `<div class="panel-card"><h2 style="margin-top:0;">📊 Lịch sử kinh doanh</h2>
    <table><thead><tr><th>Ngày</th><th>Doanh thu</th><th>Lãi ròng</th><th>Uy tín</th><th>Khách</th></tr></thead>
    <tbody>${state.history.slice(0, 30).map((h) => `<tr>
      <td>${h.day}</td><td>${formatMoney(h.revenue)}</td>
      <td style="color:${h.netProfit >= 0 ? 'var(--green)' : 'var(--red)'}">${formatMoney(h.netProfit)}</td>
      <td>${Math.round(h.reputation)}</td><td>${h.customersTotal}</td>
    </tr>`).join('')}</tbody></table>
  </div>
  <div class="panel-card" style="margin-top:12px;"><h2 style="margin-top:0;">Nhật ký sự kiện</h2>
    ${(state.eventLog || []).slice(0, 20).map((e) => `<div class="review-card"><b>Ngày ${e.day} — ${e.title}:</b> ${e.choice}</div>`).join('') || '<div class="empty-hint">Chưa có.</div>'}
  </div>`;
}

export function renderGameOverModal(root, engine, handlers) {
  const state = engine.state;
  if (!state.gameOver) return false;
  const win = state.gameOver === 'win';
  root.innerHTML = `<div class="modal-overlay"><div class="modal-box gameover-box">
    <div class="big">${win ? '🎉' : '💸'}</div>
    <h2>${win ? 'TIỆM NHÀ TUI THÀNH CÔNG!' : 'PHÁ SẢN'}</h2>
    <p>${win ? `Tổng tài sản đạt ${formatMoney(computeAssets(state, equipmentCatalog))} sau ${state.day} ngày kinh doanh.`
      : 'Tài khoản âm 3 ngày liên tiếp. Hành trình khởi nghiệp kết thúc tại đây.'}</p>
    ${win ? `
      <button class="btn block" id="btnContinuePlay">Tiếp tục chơi</button>
      <button class="btn secondary block" id="btnNewGamePlus" style="margin-top:8px;">New Game+</button>
    ` : `<button class="btn block" id="btnRestart">🔄 Chơi lại</button>`}
    <button class="btn secondary block" id="btnToTitle" style="margin-top:8px;">🏠 Về màn hình chính</button>
  </div></div>`;
  root.querySelector('#btnContinuePlay')?.addEventListener('click', handlers.onContinuePlay);
  root.querySelector('#btnNewGamePlus')?.addEventListener('click', handlers.onNewGamePlus);
  root.querySelector('#btnRestart')?.addEventListener('click', handlers.onRestart);
  root.querySelector('#btnToTitle').onclick = handlers.onToTitle;
  return true;
}
