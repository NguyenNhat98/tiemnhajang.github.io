export function renderReviewPanel(container, engine, refresh) {
  const state = engine.state;
  if (!state.reviews.length) {
    container.innerHTML = `<div class="panel-card"><h2 style="margin-top:0;">⭐ Đánh giá</h2><div class="empty-hint">Chưa có đánh giá nào.</div></div>`;
    return;
  }
  container.innerHTML = `<div class="panel-card"><h2 style="margin-top:0;">⭐ Đánh giá khách hàng (${state.reviews.length})</h2>
    ${state.reviews.slice(0, 40).map((r) => `<div class="review-card">
      <div><b>${r.customer}</b> · ngày ${r.day} · <span class="stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</span></div>
      <div>${r.text}</div>
      <div class="review-tags">${r.tags.map((t) => `<span>${t}</span>`).join('')}</div>
      ${r.reply ? `<div class="muted">↳ Phản hồi: ${r.reply}</div>` : `<div style="margin-top:6px;display:flex;gap:6px;">
          <input type="text" placeholder="Trả lời đánh giá..." style="flex:1;" data-reply-input="${r.id}"/>
          <button class="btn small" data-reply-btn="${r.id}">Gửi</button>
        </div>`}
    </div>`).join('')}
  </div>`;
  container.querySelectorAll('[data-reply-btn]').forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.replyBtn;
      const input = container.querySelector(`[data-reply-input="${id}"]`);
      const text = (input?.value || '').trim();
      if (!text) return;
      engine.dispatch({ type: 'REPLY_REVIEW', payload: { reviewId: id, text } });
      refresh();
    };
  });
}
