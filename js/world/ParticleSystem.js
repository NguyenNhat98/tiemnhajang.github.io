/** Micro-feedback nổi lên rồi mờ dần (spec §54: +12.000đ, ❤️ +2 loyalty, ⭐ uy tín, milestone...). */
export class ParticleSystem {
  constructor() { this.particles = []; }
  spawn(x, y, text, color = '#2e2420') {
    this.particles.push({ x, y, text, color, life: 1.4, age: 0 });
  }
  update(dt) {
    this.particles.forEach((p) => { p.age += dt; p.y -= dt * 22; });
    this.particles = this.particles.filter((p) => p.age < p.life);
  }
  render(ctx) {
    ctx.save();
    ctx.font = 'bold 13px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    this.particles.forEach((p) => {
      const alpha = Math.max(0, 1 - p.age / p.life);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    });
    ctx.restore();
  }
}
