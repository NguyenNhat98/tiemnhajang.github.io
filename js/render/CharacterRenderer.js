/** Vẽ nhân vật bằng vector/emoji sprite tạm (spec §61 Master Prompt cho phép placeholder, kiến trúc thay sprite thật sau). */

export const CharacterRenderer = {
  drawCustomer(ctx, actor, logicalCustomer) {
    const bounce = actor.isWalking() ? Math.sin(actor.animTime * 10) * 2 : Math.sin(actor.animTime * 2) * 1;
    const x = actor.x, y = actor.y + bounce;
    drawPerson(ctx, x, y, actor.body.skin, actor.body.outfit);

    if (logicalCustomer) {
      const ratio = logicalCustomer.maxPatience ? logicalCustomer.patience / logicalCustomer.maxPatience : 1;
      ctx.fillStyle = ratio < 0.3 ? '#c0392b' : ratio < 0.6 ? '#d8a53d' : '#3f8a4a';
      ctx.fillRect(x - 12, y - 34, 24 * Math.max(0, ratio), 3);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.strokeRect(x - 12, y - 34, 24, 3);

      const emoji = actor.state === 'ANGRY' ? '😠' : actor.state === 'HAPPY' ? '😊' : ratio < 0.3 ? '😠' : ratio < 0.6 ? '😐' : '🙂';
      ctx.font = '14px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText(emoji, x, y - 38);
    }

    if (actor.bubble) {
      ctx.font = '11px Segoe UI';
      ctx.textAlign = 'center';
      const w = Math.min(160, ctx.measureText(actor.bubble).width + 16);
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.strokeStyle = '#d9622b';
      roundRect(ctx, x - w / 2, y - 64, w, 22, 6);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2e2420';
      ctx.fillText(actor.bubble, x, y - 49, w - 8);
    }

    ctx.font = '9px Segoe UI';
    ctx.fillStyle = '#2e2420';
    ctx.textAlign = 'center';
    if (logicalCustomer) ctx.fillText(logicalCustomer.name, x, y + 16);
  },
  drawStaff(ctx, actor, staff) {
    const bounce = Math.sin(actor.animTime * 3) * 1;
    drawPerson(ctx, actor.x, actor.y + bounce, '#e0ab73', actor.outfit);
    ctx.font = '9px Segoe UI';
    ctx.fillStyle = '#2e2420';
    ctx.textAlign = 'center';
    if (staff) ctx.fillText(staff.name.split(' ').pop(), actor.x, actor.y + 16);
  },
};

function drawPerson(ctx, x, y, skin, outfit) {
  ctx.fillStyle = outfit;
  ctx.fillRect(x - 6, y - 14, 12, 16);
  ctx.beginPath();
  ctx.arc(x, y - 20, 6, 0, Math.PI * 2);
  ctx.fillStyle = skin;
  ctx.fill();
  ctx.fillStyle = '#2e2420';
  ctx.fillRect(x - 6, y + 2, 4, 8);
  ctx.fillRect(x + 2, y + 2, 4, 8);
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
