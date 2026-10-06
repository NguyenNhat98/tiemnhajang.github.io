export function renderQuestPanel(container, engine, refresh) {
  const state = engine.state;
  const questCard = (q, daily) => {
    const pct = Math.min(100, Math.round((q.progress / q.target) * 100));
    return `<div class="quest-card ${q.done ? 'done' : ''}">
      <div><b>${q.title}</b></div>
      <div class="muted">${Math.min(q.progress, q.target).toLocaleString('vi-VN')} / ${q.target.toLocaleString('vi-VN')} · thưởng ${q.reward.toLocaleString('vi-VN')}đ</div>
      <div class="progress-bar"><div style="width:${pct}%"></div></div>
      ${q.done && !q.claimed ? `<button class="btn small" style="margin-top:6px;" data-claim="${q.id}" data-daily="${daily ? '1' : '0'}">Nhận thưởng</button>` : ''}
      ${q.claimed ? '<span class="owned-tag">Đã nhận</span>' : ''}
    </div>`;
  };
  const achList = Object.values(state.achievements).map((a) => `<div class="ach-card ${a.unlocked ? 'unlocked' : ''}">
    <b>${a.unlocked ? '🏆' : '🔒'} ${a.title}</b><div class="muted">${a.desc}</div>
  </div>`).join('');

  container.innerHTML = `
    <div class="panel-card"><h2 style="margin-top:0;">🎯 Nhiệm vụ hôm nay</h2>${(state.dailyQuests || []).map((q) => questCard(q, true)).join('') || '<div class="empty-hint">Chưa có.</div>'}</div>
    <div class="panel-card" style="margin-top:12px;"><h2 style="margin-top:0;">Nhiệm vụ dài hạn</h2>${state.quests.map((q) => questCard(q, false)).join('')}</div>
    <div class="panel-card" style="margin-top:12px;"><h2 style="margin-top:0;">Thành tựu</h2>${achList}</div>
  `;
  container.querySelectorAll('[data-claim]').forEach((btn) => {
    btn.onclick = () => { engine.dispatch({ type: 'CLAIM_QUEST', payload: { questId: btn.dataset.claim, daily: btn.dataset.daily === '1' } }); refresh(); };
  });
}
