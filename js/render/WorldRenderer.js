import { WORLD_W, WORLD_H } from '../world/World.js';

/** Vẽ nền phố/tiệm bằng Canvas primitives — chưa có art asset thật nên dùng vector thay thế (kiến trúc cho phép thay sau). */
export const WorldRenderer = {
  drawBackground(ctx, state) {
    const isEvening = state.time >= 18;
    const sky = isEvening ? ['#2b2440', '#4a3b63'] : ['#bfe3f2', '#e8f6e0'];
    const grad = ctx.createLinearGradient(0, 0, 0, WORLD_H);
    grad.addColorStop(0, sky[0]);
    grad.addColorStop(1, sky[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    ctx.fillStyle = '#d7c6a8';
    ctx.fillRect(0, WORLD_H - 60, WORLD_W, 60);
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    for (let x = 0; x < WORLD_W; x += 40) { ctx.beginPath(); ctx.moveTo(x, WORLD_H - 60); ctx.lineTo(x, WORLD_H); ctx.stroke(); }

    // cửa ra vào
    ctx.fillStyle = '#7a5230';
    ctx.fillRect(4, WORLD_H - 92, 44, 32);
    ctx.fillStyle = '#fdf6e8';
    ctx.font = '11px Segoe UI';
    ctx.fillText('CỬA', 10, WORLD_H - 76);
  },
  drawCounter(ctx, counter) {
    ctx.fillStyle = '#8a5a34';
    ctx.fillRect(counter.x, counter.y, counter.w, counter.h);
    ctx.fillStyle = '#c99a66';
    ctx.fillRect(counter.x, counter.y, counter.w, 8);
    ctx.fillStyle = '#2e2420';
    ctx.font = 'bold 12px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('QUẦY', counter.x + counter.w / 2, counter.y + counter.h / 2 + 4);
  },
  drawShelves(ctx, shelves) {
    shelves.forEach((s) => {
      ctx.fillStyle = '#efe2c9';
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.strokeStyle = '#c7a96f';
      ctx.strokeRect(s.x, s.y, s.w, s.h);
      ctx.font = '18px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText(s.cat.icon, s.x + s.w / 2, s.y + s.h / 2 + 7);
    });
  },
};
