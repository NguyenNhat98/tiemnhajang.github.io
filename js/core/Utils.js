/** Hàm dùng chung — không chứa logic gameplay, chỉ tiện ích thuần. */
export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
export function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function formatMoney(n) {
  const sign = n < 0 ? '-' : '';
  return `${sign}${Math.round(Math.abs(n)).toLocaleString('vi-VN')}đ`;
}
export function formatTimeFloat(hours) {
  const h = Math.floor(hours) % 24;
  const m = Math.floor((hours - Math.floor(hours)) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
export function distance(ax, ay, bx, by) { return Math.hypot(bx - ax, by - ay); }
