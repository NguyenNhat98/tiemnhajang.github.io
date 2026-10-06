import { distance, lerp } from '../core/Utils.js';

/** Nhân viên đứng ở quầy / đi lại trong world — thuần hiển thị, hiệu ứng gameplay nằm ở StaffSystem. */
export class StaffActor {
  constructor(staff, spot) {
    this.staffId = staff.id;
    this.role = staff.role;
    this.x = spot.x; this.y = spot.y;
    this.targetX = spot.x; this.targetY = spot.y;
    this.animTime = 0;
    this.outfit = ['#2b6ad9', '#d9622b', '#3f8a4a', '#8a4ad8'][['cashier', 'stocker', 'guard', 'shipper'].indexOf(staff.role) % 4];
  }
  moveTo(target) { this.targetX = target.x; this.targetY = target.y; }
  update(dt) {
    this.animTime += dt;
    const d = distance(this.x, this.y, this.targetX, this.targetY);
    if (d > 1) {
      const t = Math.min(1, (40 * dt) / d);
      this.x = lerp(this.x, this.targetX, t);
      this.y = lerp(this.y, this.targetY, t);
    }
  }
}
