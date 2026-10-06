/** Quy đổi thời gian thực (rAF timestamp) sang dt giây, có pause và chặn bước nhảy lớn khi tab mất focus. */
export class Clock {
  constructor() {
    this.last = null;
    this.paused = false;
    this.maxDt = 0.25; // chặn dt bất thường (vd. đổi tab) để tránh game time nhảy vọt
  }
  tick(timestampMs) {
    if (this.last === null) { this.last = timestampMs; return 0; }
    let dt = (timestampMs - this.last) / 1000;
    this.last = timestampMs;
    if (dt < 0) dt = 0;
    if (dt > this.maxDt) dt = this.maxDt;
    return this.paused ? 0 : dt;
  }
  pause() { this.paused = true; }
  resume() { this.paused = false; this.last = null; }
}
