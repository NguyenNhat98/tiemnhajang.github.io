/** Modal sự kiện sáng (activeEvent) / tình huống trong ngày (activeDrama) — spec §29-30. */
export function renderEventModal(root, engine, refresh) {
  const state = engine.state;
  const active = state.activeEvent || state.activeDrama;
  if (!active) { root.innerHTML = ''; return; }
  const isDrama = !!state.activeDrama;
  const d = active.def;
  root.innerHTML = `<div class="modal-overlay"><div class="modal-box event-modal">
    <h2>${isDrama ? '💬' : ''} ${d.title}</h2>
    <p>${d.description}</p>
    ${d.choices.map((c, i) => `<button class="choice-btn" data-choice="${i}">${c.label}</button>`).join('')}
  </div></div>`;
  root.querySelectorAll('[data-choice]').forEach((btn) => {
    btn.onclick = () => {
      engine.dispatch({ type: isDrama ? 'RESOLVE_DRAMA' : 'RESOLVE_EVENT', payload: { choiceIndex: Number(btn.dataset.choice) } });
      refresh();
    };
  });
}
