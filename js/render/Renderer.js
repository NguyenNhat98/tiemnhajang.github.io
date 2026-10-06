import { WorldRenderer } from './WorldRenderer.js';
import { CharacterRenderer } from './CharacterRenderer.js';
import { UIOverlay } from './UIOverlay.js';
import { WORLD_W, WORLD_H } from '../world/World.js';

/** Vòng vẽ (spec §36): clear -> drawWorld -> drawShelves -> drawCustomers -> drawEffects -> drawUI. */
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.debug = false;
    this._fps = 0;
  }
  resize() {
    const dpr = window.devicePixelRatio || 1;
    const cssW = this.canvas.clientWidth || WORLD_W;
    const scale = cssW / WORLD_W;
    this.canvas.width = WORLD_W * dpr;
    this.canvas.height = WORLD_H * dpr;
    this.canvas.style.height = `${WORLD_H * scale}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  clear() { this.ctx.clearRect(0, 0, WORLD_W, WORLD_H); }
  drawWorld(state) { WorldRenderer.drawBackground(this.ctx, state); }
  drawShelves(world) { WorldRenderer.drawShelves(this.ctx, world.shelves); WorldRenderer.drawCounter(this.ctx, world.counter); }
  drawCustomers(world, state) {
    world.customerActors.forEach((a) => {
      const c = state.customers.find((x) => x.id === a.customerId);
      CharacterRenderer.drawCustomer(this.ctx, a, c);
    });
    world.staffActors.forEach((a) => {
      const s = state.staff.find((x) => x.id === a.staffId);
      CharacterRenderer.drawStaff(this.ctx, a, s);
    });
  }
  drawEffects(world) { world.particles.render(this.ctx); }
  drawUI(debugInfo) { if (this.debug && debugInfo) UIOverlay.drawDebug(this.ctx, debugInfo); }

  frame(world, state, debugInfo) {
    this.clear();
    this.drawWorld(state);
    this.drawShelves(world);
    this.drawCustomers(world, state);
    this.drawEffects(world);
    this.drawUI(debugInfo);
  }
}
