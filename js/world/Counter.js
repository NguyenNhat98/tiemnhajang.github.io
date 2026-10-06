/** Quầy thu ngân + các điểm chờ xếp hàng (toạ độ logic trong canvas world, không phải DOM). */
export class Counter {
  constructor(worldW, worldH) {
    this.x = worldW / 2 - 70;
    this.y = worldH / 2 - 20;
    this.w = 140;
    this.h = 46;
    this.queueSpot = (index) => ({
      x: this.x + this.w / 2 - 70 - index * 26,
      y: this.y + this.h + 30 + (index % 2) * 18,
    });
    this.serviceSpot = { x: this.x + this.w / 2, y: this.y + this.h + 14 };
    this.doorSpot = { x: 24, y: worldH - 40 };
    this.exitSpot = { x: 24, y: worldH - 40 };
  }
}
