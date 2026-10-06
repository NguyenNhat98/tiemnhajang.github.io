/** Debug overlay vẽ trên Canvas (spec §57) — chỉ bật khi DEBUG=true, không dùng ở production. */
export const UIOverlay = {
  drawDebug(ctx, info) {
    const lines = [
      `FPS: ${info.fps.toFixed(0)}`,
      `GAME TIME: Ngày ${info.day} — ${info.timeLabel}`,
      `CUSTOMERS: ${info.customers}`,
      `QUEUE: ${info.queue}`,
      `MONEY: ${info.money.toLocaleString('vi-VN')}đ`,
      `SPAWN RATE: ${info.spawnRate.toFixed(1)}/giờ`,
      `EVENT: ${info.event || '-'}`,
    ];
    ctx.save();
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(6, 6, 190, lines.length * 14 + 10);
    ctx.fillStyle = '#9CFF9C';
    lines.forEach((l, i) => ctx.fillText(l, 12, 20 + i * 14));
    ctx.restore();
  },
};
