/** PRNG có seed (mulberry32) — cho phép kết quả tái lập khi debug/test, không dùng Math.random() rải rác trong logic kinh tế. */
export class RNG {
  constructor(seed = Date.now() % 2147483647) {
    this.seed = seed >>> 0 || 1;
  }
  next() {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(min, max) { return min + this.next() * (max - min); }
  int(min, max) { return Math.floor(this.range(min, max + 1)); }
  chance(p) { return this.next() < p; }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  weighted(items, weightFn) {
    const total = items.reduce((s, it) => s + Math.max(0, weightFn(it)), 0);
    if (total <= 0) return items[0];
    let r = this.next() * total;
    for (const it of items) {
      r -= Math.max(0, weightFn(it));
      if (r <= 0) return it;
    }
    return items[items.length - 1];
  }
}
