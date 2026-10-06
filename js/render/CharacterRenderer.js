/** Vẽ nhân vật bằng vector/emoji sprite tạm (spec §61 Master Prompt cho phép placeholder, kiến trúc thay sprite thật sau). */

export const CharacterRenderer = {
  drawCustomer(ctx, actor, logicalCustomer) {
    const bounce = actor.isWalking() ? Math.sin(actor.animTime * 10) * 2 : Math.sin(actor.animTime * 2) * 1;
    const x = actor.x, y = actor.y + bounce;
    drawPerson(ctx, x, y, actor.body.skin, actor.body.outfit);

    if (logicalCustomer) {
      const ratio = logicalCustomer.maxPatience ? logicalCustomer.patience / logicalCustomer.maxPatience : 1;
      ctx.fillStyle = ratio < 0.3 ? '#c0392b' : ratio < 0.6 ? '#d8a53d' : '#3f8a4a';
      ctx.fillRect(x - 15, y - 57, 30 * Math.max(0, ratio), 4);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.strokeRect(x - 15, y - 57, 30, 4);

      const emoji = actor.state === 'ANGRY' ? '😠' : actor.state === 'HAPPY' ? '😊' : ratio < 0.3 ? '😠' : ratio < 0.6 ? '😐' : '🙂';
      ctx.font = '14px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText(emoji, x, y - 63);
    }

    if (actor.bubble) {
      ctx.font = '11px Segoe UI';
      ctx.textAlign = 'center';
      const w = Math.min(160, ctx.measureText(actor.bubble).width + 16);
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.strokeStyle = '#d9622b';
      roundRect(ctx, x - w / 2, y - 83, w, 22, 7);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2e2420';
      ctx.fillText(actor.bubble, x, y - 68, w - 8);
    }

    ctx.font = '9px Segoe UI';
    ctx.fillStyle = '#2e2420';
    ctx.textAlign = 'center';
    if (logicalCustomer) ctx.fillText(logicalCustomer.name, x, y + 22);
  },
  drawStaff(ctx, actor, staff) {
    const bounce = Math.sin(actor.animTime * 3) * 1;
    drawPerson(ctx, actor.x, actor.y + bounce, '#e0ab73', actor.outfit);
    ctx.font = 'bold 9px Segoe UI';
    ctx.fillStyle = '#2e2420';
    ctx.textAlign = 'center';
    if (staff) ctx.fillText(staff.name.split(' ').pop(), actor.x, actor.y + 22);
  },
};

function drawPerson(ctx, x, y, skin, outfit) {
  // soft ground shadow
  ctx.fillStyle = 'rgba(39,51,34,.16)';
  ctx.beginPath(); ctx.ellipse(x, y + 10, 13, 4, 0, 0, Math.PI * 2); ctx.fill();
  // legs and shoes
  ctx.fillStyle = '#4b4038';
  roundRect(ctx, x - 8, y - 2, 6, 13, 3); ctx.fill();
  roundRect(ctx, x + 2, y - 2, 6, 13, 3); ctx.fill();
  ctx.fillStyle = '#342f2c';
  roundRect(ctx, x - 10, y + 7, 8, 4, 2); ctx.fill();
  roundRect(ctx, x + 2, y + 7, 8, 4, 2); ctx.fill();
  // arms behind the body
  ctx.fillStyle = skin;
  roundRect(ctx, x - 14, y - 31, 7, 22, 4); ctx.fill();
  roundRect(ctx, x + 7, y - 31, 7, 22, 4); ctx.fill();
  // torso with collar and small pocket
  ctx.fillStyle = outfit;
  roundRect(ctx, x - 11, y - 34, 22, 34, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.beginPath(); ctx.moveTo(x - 5, y - 33); ctx.lineTo(x, y - 27); ctx.lineTo(x + 5, y - 33); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(35,50,36,.2)'; ctx.fillRect(x + 3, y - 17, 4, 6);
  // face, hair and friendly facial features
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(x, y - 43, 11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#4b3329';
  ctx.beginPath(); ctx.arc(x, y - 47, 11, Math.PI, Math.PI * 2); ctx.lineTo(x + 10, y - 42); ctx.quadraticCurveTo(x + 4, y - 45, x, y - 42); ctx.quadraticCurveTo(x - 6, y - 45, x - 10, y - 41); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#362d28';
  ctx.beginPath(); ctx.arc(x - 3.5, y - 42, 1, 0, Math.PI * 2); ctx.arc(x + 3.5, y - 42, 1, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(83,48,39,.8)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(x, y - 39, 3, .15, Math.PI - .15); ctx.stroke();
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
