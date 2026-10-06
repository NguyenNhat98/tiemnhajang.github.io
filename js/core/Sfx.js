/** SFX tổng hợp bằng WebAudio (không cần file âm thanh nhị phân) — spec §55: mở cửa, tiền, khách gọi, review, event, nâng cấp. */
const NOTES = { open: [523, 659, 784], money: [880, 1175], bell: [988], review: [659, 880, 1047], event: [392, 330], upgrade: [523, 659, 784, 1047] };

export class Sfx {
  constructor(getSettings) {
    this.getSettings = getSettings;
    this.ctx = null;
  }
  _ensureCtx() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    return this.ctx;
  }
  play(name) {
    const settings = this.getSettings?.() || {};
    if (!settings.sound) return;
    const ctx = this._ensureCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const freqs = NOTES[name] || [440];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      const t0 = ctx.currentTime + i * 0.07;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.12, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.2);
    });
  }
}
