import { Counter } from './Counter.js';
import { buildShelves } from './Shelf.js';
import { CustomerActor } from './CustomerActor.js';
import { StaffActor } from './StaffActor.js';
import { ParticleSystem } from './ParticleSystem.js';

export const WORLD_W = 800;
export const WORLD_H = 420;

export class World {
  constructor() {
    this.counter = new Counter(WORLD_W, WORLD_H);
    this.shelves = buildShelves(WORLD_W, WORLD_H);
    this.customerActors = [];
    this.staffActors = [];
    this.particles = new ParticleSystem();
  }

  /** Đồng bộ actor hiển thị với GameState (nguồn sự thật duy nhất) — World không tự ý đổi logic nghiệp vụ. */
  syncWithState(state, activeCustomerId) {
    const liveIds = new Set(state.customers.map((c) => c.id));
    // actor của khách đã rời khỏi state (đã thanh toán/bỏ đi) -> cho đi ra rồi dọn
    this.customerActors.forEach((a) => {
      if (!liveIds.has(a.customerId) && a.state !== 'WALK_OUT') {
        a.state = 'WALK_OUT';
        a.moveTo(this.counter.exitSpot);
      }
    });
    state.customers.forEach((c) => {
      if (!this.customerActors.find((a) => a.customerId === c.id)) {
        const actor = new CustomerActor(c, this.counter.doorSpot);
        this.customerActors.push(actor);
      }
    });

    // Xếp hàng: khách đang được phục vụ đi tới quầy, còn lại xếp theo thứ tự chờ.
    let queueIndex = 0;
    this.customerActors.forEach((a) => {
      const c = state.customers.find((x) => x.id === a.customerId);
      if (!c) return;
      if (c.id === activeCustomerId) {
        a.moveTo(this.counter.serviceSpot);
        if (a.arrived(6)) a.state = a.state === 'WALK_IN' || a.state === 'QUEUE' ? 'APPROACH_COUNTER' : a.state;
      } else {
        a.moveTo(this.counter.queueSpot(queueIndex));
        if (a.state === 'WALK_IN' && a.arrived(6)) a.state = 'QUEUE';
        queueIndex += 1;
      }
    });
  }

  syncStaff(state) {
    state.staff.forEach((s, i) => {
      if (!this.staffActors.find((a) => a.staffId === s.id)) {
        const spot = { x: this.counter.x + 20 + i * 18, y: this.counter.y - 16 };
        this.staffActors.push(new StaffActor(s, spot));
      }
    });
    this.staffActors = this.staffActors.filter((a) => state.staff.some((s) => s.id === a.staffId));
  }

  update(dt, state) {
    this.customerActors.forEach((a) => {
      const c = state.customers.find((x) => x.id === a.customerId);
      a.update(dt, c ? c.status : 'left');
    });
    this.customerActors = this.customerActors.filter((a) => {
      if (a.state === 'WALK_OUT' && a.arrived(5)) return false;
      return true;
    });
    this.staffActors.forEach((a) => a.update(dt));
    this.particles.update(dt);
  }
}
