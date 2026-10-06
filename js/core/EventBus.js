/** Pub/sub nội bộ — tách Render/UI khỏi logic gameplay (không ai sửa DOM trực tiếp từ đây). */
export class EventBus {
  constructor() {
    this.handlers = new Map();
  }
  on(event, fn) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event).add(fn);
    return () => this.off(event, fn);
  }
  off(event, fn) {
    this.handlers.get(event)?.delete(fn);
  }
  emit(event, payload) {
    this.handlers.get(event)?.forEach((fn) => fn(payload));
    this.handlers.get('*')?.forEach((fn) => fn(event, payload));
  }
}
