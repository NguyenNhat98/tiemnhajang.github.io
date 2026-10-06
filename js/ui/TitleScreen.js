import { achievementTemplates } from '../data/quests.js';
import { SaveSystem, AUTO_SLOT } from '../systems/SaveSystem.js';

const MOVERS = ['🚶', '🛵', '👵', '🧑', '👧', '🧓', '🚲'];

export function renderTitleScreen(container, handlers) {
  const hasContinue = SaveSystem.has(AUTO_SLOT);
  container.innerHTML = `
    <div class="street-scene" id="streetScene"></div>
    <div class="signboard">
      <h1>🏪 TIỆM NHÀ TUI</h1>
      <p>"Buôn bán có tâm, khách thương dài lâu"</p>
    </div>
    <div class="title-buttons">
      <button class="btn" id="btnStart">▶ BẮT ĐẦU CHƠI</button>
      <button class="btn secondary" id="btnContinue" ${hasContinue ? '' : 'disabled'}>▣ CHƠI TIẾP</button>
      <button class="btn secondary" id="btnSettings">⚙ CÀI ĐẶT</button>
      <button class="btn secondary" id="btnHelp">? HƯỚNG DẪN</button>
      <button class="btn secondary" id="btnAchievements">🏆 THÀNH TÍCH</button>
    </div>
  `;
  const scene = container.querySelector('#streetScene');
  for (let i = 0; i < 5; i++) {
    const el = document.createElement('div');
    el.className = 'mover bob';
    el.textContent = MOVERS[i % MOVERS.length];
    el.style.left = `${i * 12}%`;
    el.style.animationDuration = `${14 + i * 3}s`;
    el.style.animationDelay = `-${i * 4}s`;
    scene.appendChild(el);
  }
  ['🌳', '🏠', '🏠', '🌳'].forEach((s, i) => {
    const el = document.createElement('div');
    el.className = s === '🌳' ? 'tree' : 'house';
    el.textContent = s;
    el.style.left = `${8 + i * 24}%`;
    scene.appendChild(el);
  });
  const wire = document.createElement('div'); wire.className = 'wire'; scene.appendChild(wire);

  container.querySelector('#btnStart').onclick = handlers.onStart;
  container.querySelector('#btnContinue').onclick = handlers.onContinue;
  container.querySelector('#btnSettings').onclick = () => showSettingsModal(handlers);
  container.querySelector('#btnHelp').onclick = () => showHelpModal();
  container.querySelector('#btnAchievements').onclick = () => showAchievementsModal();
}

function modal(html) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal-box">${html}</div>`;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  return overlay;
}

function showSettingsModal(handlers) {
  const s = handlers.getSettings ? handlers.getSettings() : { sound: true, music: true, vibration: true };
  const overlay = modal(`
    <h2>⚙ Cài đặt</h2>
    <label style="display:block;margin-bottom:8px;"><input type="checkbox" id="cfgSound" ${s.sound ? 'checked' : ''}/> Âm thanh (SFX)</label>
    <label style="display:block;margin-bottom:8px;"><input type="checkbox" id="cfgMusic" ${s.music ? 'checked' : ''}/> Nhạc nền</label>
    <label style="display:block;margin-bottom:12px;"><input type="checkbox" id="cfgVibration" ${s.vibration ? 'checked' : ''}/> Rung (mobile)</label>
    <button class="btn block" id="cfgClose">Đóng</button>
  `);
  const save = () => handlers.onSettingsChange?.({
    sound: overlay.querySelector('#cfgSound').checked,
    music: overlay.querySelector('#cfgMusic').checked,
    vibration: overlay.querySelector('#cfgVibration').checked,
  });
  overlay.querySelectorAll('input').forEach((i) => i.addEventListener('change', save));
  overlay.querySelector('#cfgClose').onclick = () => overlay.remove();
}

function showHelpModal() {
  modal(`
    <h2>🌿 Một ngày ở tiệm tạp hóa</h2>
    <ol class="story-steps">
      <li><b>Buổi sáng:</b> xem kho, nhập thêm món sắp hết và điều chỉnh giá bán.</li>
      <li><b>Khách ghé tiệm:</b> chạm vào thẻ khách đang chờ để nghe và xem danh sách món họ cần.</li>
      <li><b>Soạn giỏ hàng:</b> lấy từng món khách gọi. Kiểm tra biểu tượng, số lượng và thanh tiến độ; món đã lấy sẽ được đánh dấu.</li>
      <li><b>Ra quầy:</b> khi đã đủ tất cả món, nút “Mang ra quầy” sẽ sáng. Chạm để hoàn tất đơn và nhận tiền.</li>
      <li><b>Cuối ngày:</b> đọc báo cáo rồi dùng lợi nhuận nâng cấp tiệm, thuê nhân viên và mở dịch vụ mới.</li>
    </ol>
    <p class="muted">Khách sẽ mất kiên nhẫn nếu phải chờ lâu. Hàng được lấy theo hạn sử dụng gần nhất trước.</p>
    <p class="muted">Mục tiêu: đạt tổng tài sản 300.000.000đ. Nếu tiền âm 3 ngày liên tiếp, tiệm sẽ phá sản.</p>
    <button class="btn block" id="helpClose">Đã hiểu</button>
  `).querySelector('#helpClose').onclick = (e) => e.target.closest('.modal-overlay').remove();
}

function showAchievementsModal() {
  modal(`
    <h2>🏆 Danh sách thành tựu</h2>
    ${achievementTemplates.map((a) => `<div class="ach-card"><b>${a.title}</b><div class="muted">${a.desc}</div></div>`).join('')}
    <p class="muted">Trạng thái mở khóa hiển thị trong ván chơi của bạn, ở tab Nhiệm vụ.</p>
    <button class="btn block" id="achClose">Đóng</button>
  `).querySelector('#achClose').onclick = (e) => e.target.closest('.modal-overlay').remove();
}
