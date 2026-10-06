import { formatMoney, formatTimeFloat } from '../core/Utils.js';
import { DAY_PHASES, OPEN_HOUR, CLOSE_HOUR, computeAssets, WIN_ASSETS } from '../core/GameState.js';
import { equipment as equipmentCatalog } from '../data/equipment.js';
import { renderQueueStrip, renderOrderPanel } from './CustomerUI.js';
import { renderInventoryPanel } from './InventoryUI.js';
import { renderStaffPanel } from './StaffUI.js';
import { renderEquipmentPanel, renderServicesPanel, renderAdsPanel } from './UpgradeUI.js';
import { renderReviewPanel } from './ReviewUI.js';
import { renderQuestPanel } from './QuestUI.js';
import { renderHistoryPanel, renderEndDayModal, renderGameOverModal } from './EndDayUI.js';
import { renderEventModal } from './EventModal.js';

const TABS = [
  ['inventory', '📦 Kho & Giá'],
  ['staff', '👥 Nhân viên'],
  ['equipment', '🛠️ Thiết bị'],
  ['ads', '📣 Quảng cáo'],
  ['services', '🔓 Dịch vụ'],
  ['reviews', '⭐ Đánh giá'],
  ['quests', '🎯 Nhiệm vụ'],
  ['history', '📊 Báo cáo'],
];
const PANEL_RENDERERS = {
  inventory: renderInventoryPanel, staff: renderStaffPanel, equipment: renderEquipmentPanel,
  ads: renderAdsPanel, services: renderServicesPanel, reviews: renderReviewPanel,
  quests: renderQuestPanel, history: (c, e) => renderHistoryPanel(c, e),
};

export function mountGameScreen(container, engine, renderer, world, sfx, handlers) {
  const uiState = { tab: 'inventory', mobilePanelOpen: false };

  container.innerHTML = `
    <div id="gameTopbar">
      <div class="brand">🏪 ${engine.state.storeName}</div>
      <div id="headerStats"></div>
      <div class="spacer"></div>
      <button class="btn small secondary" id="btnSaveGame">💾 Lưu</button>
      <button class="btn small secondary" id="btnToTitle2">🏠</button>
    </div>
    <div id="gameBody">
      <div id="sidebar">${TABS.map(([id, label]) => `<button data-tab="${id}">${label}</button>`).join('')}</div>
      <div id="worldArea">
        <div id="canvasWrap"><canvas id="gameCanvas"></canvas></div>
        <div id="queueStrip"></div>
        <div id="panelArea"></div>
      </div>
    </div>
    <div id="mobileNav">${TABS.slice(0, 4).map(([id, label]) => `<button data-tab="${id}">${label.split(' ')[0]}</button>`).join('')}</div>
    <div id="timeBar">
      <span id="timeLabel" class="stat-pill"></span>
      <div class="time-track"><div id="timeFill"></div></div>
      <div class="speed-btns" id="speedBtns">
        <button data-speed="1">1x</button><button data-speed="2">2x</button><button data-speed="4">4x</button>
      </div>
      <button class="btn small" id="btnOpenClose"></button>
    </div>
    <div id="eventModalRoot"></div>
    <div id="toastWrap" class="toast-wrap"></div>
  `;

  const canvas = container.querySelector('#gameCanvas');
  renderer.canvas = canvas;
  renderer.ctx = canvas.getContext('2d');
  renderer.resize();
  window.addEventListener('resize', () => renderer.resize());

  const panelArea = container.querySelector('#panelArea');
  const queueStrip = container.querySelector('#queueStrip');
  const eventModalRoot = container.querySelector('#eventModalRoot');

  function refreshPanel() {
    renderQueueStrip(queueStrip, engine, refreshPanel);
    if (engine.activeCustomerId && engine.state.customers.some((c) => c.id === engine.activeCustomerId)) {
      renderOrderPanel(panelArea, engine, refreshPanel);
    } else {
      const fn = PANEL_RENDERERS[uiState.tab] || renderInventoryPanel;
      fn(panelArea, engine, refreshPanel);
    }
    renderEventModal(eventModalRoot, engine, () => { refreshPanel(); refreshHeader(); });
  }

  function setTab(tab) {
    uiState.tab = tab;
    container.querySelectorAll('#sidebar button, #mobileNav button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    uiState.mobilePanelOpen = true;
    panelArea.classList.remove('closed');
    refreshPanel();
  }
  container.querySelectorAll('#sidebar button, #mobileNav button').forEach((b) => { b.onclick = () => setTab(b.dataset.tab); });
  setTab('inventory');

  function refreshHeader() {
    const s = engine.state;
    const phaseLabel = s.phase === DAY_PHASES.OPEN ? 'Đang mở cửa' : s.phase === DAY_PHASES.REPORT ? 'Đã đóng cửa' : 'Chuẩn bị';
    container.querySelector('#headerStats').innerHTML = `
      <span class="stat-pill">📅 Ngày ${s.day}</span>
      <span class="stat-pill">🕒 ${formatTimeFloat(s.time)} · ${phaseLabel}</span>
      <span class="stat-pill">💰 ${formatMoney(s.money)}</span>
      <span class="stat-pill">⭐ ${Math.round(s.reputation)}/100</span>
      <span class="stat-pill">${s.weather ? s.weather.icon + ' ' + s.weather.label : ''}</span>
    `;
    const pct = Math.max(0, Math.min(100, ((s.time - OPEN_HOUR) / (CLOSE_HOUR - OPEN_HOUR)) * 100));
    container.querySelector('#timeFill').style.width = `${pct}%`;
    container.querySelector('#timeLabel').textContent = `${formatTimeFloat(OPEN_HOUR)} → ${formatTimeFloat(CLOSE_HOUR)}`;
    container.querySelectorAll('#speedBtns button').forEach((b) => b.classList.toggle('active', Number(b.dataset.speed) === s.timeSpeed));
    const openBtn = container.querySelector('#btnOpenClose');
    if (s.phase === DAY_PHASES.OPEN) { openBtn.textContent = 'Đóng cửa ngay'; openBtn.disabled = false; }
    else if (s.phase === DAY_PHASES.PREP) { openBtn.textContent = s.activeEvent ? 'Xử lý sự kiện trước' : 'Mở cửa'; openBtn.disabled = !!s.activeEvent; }
    else { openBtn.textContent = '...'; openBtn.disabled = true; }
  }

  container.querySelectorAll('#speedBtns button').forEach((b) => {
    b.onclick = () => { engine.dispatch({ type: 'SET_SPEED', payload: { speed: Number(b.dataset.speed) } }); refreshHeader(); };
  });
  container.querySelector('#btnOpenClose').onclick = () => {
    if (engine.state.phase === DAY_PHASES.OPEN) engine.dispatch({ type: 'CLOSE_STORE' });
    else engine.dispatch({ type: 'OPEN_STORE' });
    refreshHeader(); refreshPanel();
  };
  container.querySelector('#btnSaveGame').onclick = () => { handlers.onSave(); toast(container, 'Đã lưu game'); };
  container.querySelector('#btnToTitle2').onclick = handlers.onToTitle;

  engine.bus.on('day:started', () => { refreshHeader(); refreshPanel(); });
  engine.bus.on('store:opened', () => { refreshHeader(); refreshPanel(); sfx?.play('open'); });
  engine.bus.on('sell:result', () => { refreshHeader(); });
  engine.bus.on('order:completed', (r) => { refreshHeader(); refreshPanel(); if (r) sfx?.play('money'); if (r?.review) sfx?.play('review'); });
  engine.bus.on('event:resolved', () => { refreshHeader(); refreshPanel(); });
  engine.bus.on('drama:resolved', () => { refreshHeader(); refreshPanel(); });
  engine.bus.on('day:report', () => { refreshHeader(); renderEndDayModal(eventModalRoot, engine, {
    onNextDay: () => { engine.dispatch({ type: 'START_DAY' }); eventModalRoot.innerHTML = ''; refreshHeader(); refreshPanel(); },
  }); sfx?.play('event'); });
  engine.bus.on('customer:spawned', () => { refreshPanel(); sfx?.play('bell'); });
  engine.bus.on('action:result', ({ result }) => { if (result && result.ok === false && result.message) toast(container, result.message); else if (result?.ok) { toast(container, 'Thành công'); sfx?.play('upgrade'); } refreshPanel(); refreshHeader(); });
  engine.bus.on('toast', (msg) => toast(container, msg));

  refreshHeader(); refreshPanel();

  let domAccumulator = 0;
  return {
    renderFrame(fps, debugOn, dtSeconds) {
      renderer.debug = debugOn;
      renderer.frame(world, engine.state, debugOn ? {
        fps, day: engine.state.day, timeLabel: formatTimeFloat(engine.state.time),
        customers: engine.state.customers.length, queue: engine.state.customers.length,
        money: engine.state.money, spawnRate: 0, event: engine.state.activeEvent?.def.title,
      } : null);
      if (renderGameOverModal(eventModalRoot, engine, handlers.gameOverHandlers)) return;
      // DOM (hàng chờ/đơn hàng) chỉ cập nhật vài lần/giây — tránh dựng lại toàn bộ cây DOM ở 60fps.
      domAccumulator += dtSeconds || 0;
      if (domAccumulator >= 0.25) {
        domAccumulator = 0;
        refreshHeader();
        if (engine.state.phase === DAY_PHASES.OPEN) {
          renderQueueStrip(queueStrip, engine, refreshPanel);
          if (engine.activeCustomerId) renderOrderPanel(panelArea, engine, refreshPanel);
        }
      }
    },
  };
}

function toast(container, msg) {
  const wrap = container.querySelector('#toastWrap');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}
