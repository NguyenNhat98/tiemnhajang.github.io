import { WORLD_W, WORLD_H } from '../world/World.js';

/** Illustrated neighborhood grocery rendered with canvas primitives. */
export const WorldRenderer = {
  drawBackground(ctx, state) {
    const evening = state.time >= 18;
    const sky = ctx.createLinearGradient(0, 0, 0, WORLD_H);
    sky.addColorStop(0, evening ? '#66749a' : '#9bd8e8');
    sky.addColorStop(.52, evening ? '#f1b37d' : '#d9edc1');
    sky.addColorStop(.521, '#e7c58a');
    sky.addColorStop(1, '#bd8755');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    // distant rooftops and leafy neighborhood
    ctx.fillStyle = evening ? '#56685a' : '#82a86a';
    for (let i = 0; i < 7; i++) {
      const x = i * 132 - 18, h = 55 + (i % 3) * 17;
      ctx.fillRect(x, 180 - h, 105, h);
      ctx.fillStyle = '#d7b07a'; ctx.fillRect(x + 9, 190 - h, 87, h - 10);
      ctx.fillStyle = '#82a86a';
      for (let j = 0; j < 3; j++) { ctx.fillStyle = '#687f50'; ctx.fillRect(x + j * 34 + 7, 164 - h, 25, 22); }
      ctx.fillStyle = evening ? '#56685a' : '#82a86a';
    }
    // shop exterior wall, warm timber trim and awning
    ctx.fillStyle = '#f8e6bf'; ctx.fillRect(0, 142, WORLD_W, 180);
    ctx.fillStyle = '#d4a56a'; ctx.fillRect(0, 142, WORLD_W, 9);
    ctx.fillStyle = '#fff9e8'; ctx.fillRect(44, 160, 712, 143);
    ctx.fillStyle = '#6a4530'; ctx.fillRect(41, 154, 718, 8);
    ctx.fillStyle = '#39734a'; ctx.fillRect(48, 164, 704, 29);
    for (let x = 48; x < 752; x += 44) {
      ctx.fillStyle = Math.floor((x - 48) / 44) % 2 ? '#e9a34d' : '#f7d577';
      ctx.beginPath(); ctx.moveTo(x, 193); ctx.lineTo(x + 44, 193); ctx.lineTo(x + 38, 204); ctx.lineTo(x + 6, 204); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#fff5d6'; roundRect(ctx, 275, 122, 250, 42, 9); ctx.fill();
    ctx.strokeStyle = '#8e5435'; ctx.lineWidth = 4; roundRect(ctx, 275, 122, 250, 42, 9); ctx.stroke();
    ctx.fillStyle = '#346342'; ctx.font = 'bold 17px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(state.storeName || 'TIỆM TẠP HÓA', 400, 149, 230);
    // glass door and sunny shop windows
    ctx.fillStyle = '#bfe4dd'; ctx.fillRect(58, 205, 112, 89); ctx.fillRect(630, 205, 112, 89);
    ctx.strokeStyle = '#936442'; ctx.lineWidth = 5; ctx.strokeRect(58, 205, 112, 89); ctx.strokeRect(630, 205, 112, 89);
    ctx.fillStyle = '#fff1c4'; ctx.fillRect(62, 209, 104, 81); ctx.fillRect(634, 209, 104, 81);
    ctx.fillStyle = '#c6e8e0'; ctx.fillRect(69, 214, 91, 69); ctx.fillRect(641, 214, 91, 69);
    ctx.fillStyle = '#76995c'; ctx.fillRect(104, 214, 5, 69); ctx.fillRect(676, 214, 5, 69);

    // shop floor and tile pattern
    ctx.fillStyle = '#efd9ad'; ctx.fillRect(0, 303, WORLD_W, 117);
    for (let y = 304; y < WORLD_H; y += 28) for (let x = (Math.floor(y / 28) % 2) * 24; x < WORLD_W; x += 48) {
      ctx.fillStyle = 'rgba(151,105,58,.12)'; ctx.fillRect(x, y, 46, 26);
    }
    // entrance mat
    ctx.fillStyle = '#4e7952'; roundRect(ctx, 78, 291, 75, 15, 3); ctx.fill();
    ctx.fillStyle = '#fff4d5'; ctx.font = 'bold 8px Segoe UI'; ctx.fillText('WELCOME', 115, 302);
    // potted plants
    [[20,275],[766,275]].forEach(([x,y]) => {
      ctx.fillStyle = '#bc7445'; ctx.fillRect(x, y + 18, 22, 15);
      ctx.fillStyle = '#4d874f'; ctx.beginPath(); ctx.arc(x+11,y+12,13,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#79a956'; ctx.beginPath(); ctx.arc(x+5,y+8,7,0,Math.PI*2); ctx.fill();
    });
    if (evening) { ctx.fillStyle = 'rgba(38,42,76,.17)'; ctx.fillRect(0, 0, WORLD_W, WORLD_H); }
  },
  drawCounter(ctx, counter) {
    ctx.fillStyle = 'rgba(62,42,27,.18)'; roundRect(ctx, counter.x - 3, counter.y + 5, counter.w + 6, counter.h + 4, 8); ctx.fill();
    ctx.fillStyle = '#8b5434'; roundRect(ctx, counter.x, counter.y, counter.w, counter.h, 7); ctx.fill();
    ctx.fillStyle = '#d9a766'; roundRect(ctx, counter.x, counter.y, counter.w, 13, 5); ctx.fill();
    ctx.fillStyle = '#fff3da'; ctx.font = 'bold 12px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('THANH TOÁN', counter.x + counter.w / 2, counter.y + 31);
    ctx.fillStyle = '#f4d78b'; ctx.fillRect(counter.x + 14, counter.y - 10, 22, 10);
    ctx.fillStyle = '#78a45b'; ctx.fillRect(counter.x + 45, counter.y - 8, 17, 8);
    ctx.fillStyle = '#df9860'; ctx.fillRect(counter.x + 69, counter.y - 11, 23, 11);
    ctx.fillStyle = '#f4d78b'; ctx.fillRect(counter.x + 102, counter.y - 9, 20, 9);
  },
  drawShelves(ctx, shelves) {
    shelves.forEach((s) => {
      ctx.fillStyle = 'rgba(65,43,25,.16)'; roundRect(ctx, s.x + 2, s.y + 4, s.w, s.h, 4); ctx.fill();
      ctx.fillStyle = '#a76d3d'; roundRect(ctx, s.x, s.y, s.w, s.h, 4); ctx.fill();
      ctx.fillStyle = '#f3d59b'; ctx.fillRect(s.x + 3, s.y + 3, s.w - 6, s.h - 8);
      const colors = ['#df704d','#79a85d','#e6b64f','#6394aa','#b17aa1'];
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = colors[(i + Math.floor(s.x / 10)) % colors.length];
        ctx.fillRect(s.x + 6 + i * 13, s.y + 8 + (i % 2) * 2, 10, 15);
        ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(s.x + 8 + i * 13, s.y + 10 + (i % 2) * 2, 2, 8);
      }
      ctx.fillStyle = '#795033'; ctx.fillRect(s.x + 2, s.y + s.h - 7, s.w - 4, 5);
      ctx.fillStyle = '#fff8e8'; ctx.font = '15px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(s.cat.icon, s.x + s.w / 2, s.y + s.h - 3);
    });
  },
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}
