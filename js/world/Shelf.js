/** Kệ hàng trang trí trong world (việc chọn sản phẩm thật sự diễn ra ở panel DOM, không click trực tiếp lên Canvas). */
import { categories } from '../data/products.js';

export function buildShelves(worldW, worldH) {
  const cols = 5;
  const shelfW = 64, shelfH = 34, gapX = 14, gapY = 14;
  const startX = worldW - cols * (shelfW + gapX) - 20;
  const startY = 24;
  return categories.map((cat, i) => ({
    cat,
    x: startX + (i % cols) * (shelfW + gapX),
    y: startY + Math.floor(i / cols) * (shelfH + gapY),
    w: shelfW, h: shelfH,
  }));
}
