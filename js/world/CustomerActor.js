import { distance, lerp } from '../core/Utils.js';

export const CUSTOMER_STATES = ['WALK_IN', 'QUEUE', 'APPROACH_COUNTER', 'WAIT_SERVICE', 'SHOPPING', 'PAYING', 'HAPPY', 'ANGRY', 'WALK_OUT'];

let seed = 1;
export class CustomerActor {
  constructor(customer, doorSpot) {
    this.customerId = customer.id;
    this.x = doorSpot.x; this.y = doorSpot.y;
    this.targetX = doorSpot.x; this.targetY = doorSpot.y;
    this.state = 'WALK_IN';
    this.speed = 46 + ((seed = (seed * 9301 + 49297) % 233280) / 233280) * 24;
    this.body = { skin: ['#f0c99a', '#e0ab73', '#c98a55'][Math.floor(Math.random() * 3)], outfit: ['#d9622b', '#3f8a4a', '#2b6ad9', '#d8a53d', '#8a4ad8'][Math.floor(Math.random() * 5)] };
    this.animTime = 0;
    this.bubble = null;
    this.bubbleTimer = 0;
  }
  moveTo(target) { this.targetX = target.x; this.targetY = target.y; }
  arrived(threshold = 4) { return distance(this.x, this.y, this.targetX, this.targetY) < threshold; }
  update(dt, logicalStatus) {
    this.animTime += dt;
    const d = distance(this.x, this.y, this.targetX, this.targetY);
    if (d > 1) {
      const t = Math.min(1, (this.speed * dt) / d);
      this.x = lerp(this.x, this.targetX, t);
      this.y = lerp(this.y, this.targetY, t);
    }
    if (this.bubbleTimer > 0) { this.bubbleTimer -= dt; if (this.bubbleTimer <= 0) this.bubble = null; }
    // đồng bộ state hiển thị với trạng thái logic (GameState.customers[].status) do GameEngine cập nhật
    if (logicalStatus === 'shopping' && this.state !== 'SHOPPING' && this.state !== 'WALK_OUT') this.state = 'SHOPPING';
    if (logicalStatus === 'done' && this.state !== 'HAPPY' && this.state !== 'WALK_OUT') this.state = 'PAYING';
    if (logicalStatus === 'left' && this.state !== 'ANGRY' && this.state !== 'WALK_OUT') this.state = 'ANGRY';
  }
  say(text, seconds = 2.2) { this.bubble = text; this.bubbleTimer = seconds; }
  isWalking() { return distance(this.x, this.y, this.targetX, this.targetY) > 1; }
}
