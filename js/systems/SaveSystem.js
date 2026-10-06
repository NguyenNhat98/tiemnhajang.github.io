import { SAVE_VERSION } from '../core/GameState.js';

const PREFIX = 'tiemnhatui_save_';
export const AUTO_SLOT = 'auto';
export const SLOTS = ['1', '2', '3'];

function checksum(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) >>> 0; }
  return h.toString(36);
}

export const SaveSystem = {
  save(slot, state) {
    try {
      const body = JSON.stringify(state);
      const payload = { version: SAVE_VERSION, timestamp: Date.now(), checksum: checksum(body), state };
      localStorage.setItem(PREFIX + slot, JSON.stringify(payload));
      return true;
    } catch (e) { return false; }
  },
  load(slot) {
    try {
      const raw = localStorage.getItem(PREFIX + slot);
      if (!raw) return null;
      const payload = JSON.parse(raw);
      const body = JSON.stringify(payload.state);
      if (checksum(body) !== payload.checksum) return null; // dữ liệu hỏng/bị sửa tay
      if (payload.version !== SAVE_VERSION) return null; // tránh nạp save không tương thích
      return payload.state;
    } catch (e) { return null; }
  },
  has(slot) { return !!localStorage.getItem(PREFIX + slot); },
  info(slot) {
    try {
      const raw = localStorage.getItem(PREFIX + slot);
      if (!raw) return null;
      const payload = JSON.parse(raw);
      return { timestamp: payload.timestamp, day: payload.state?.day, storeName: payload.state?.storeName, money: payload.state?.money };
    } catch (e) { return null; }
  },
  delete(slot) { localStorage.removeItem(PREFIX + slot); },
  exportSave(state) {
    const body = JSON.stringify(state);
    return JSON.stringify({ version: SAVE_VERSION, timestamp: Date.now(), checksum: checksum(body), state });
  },
  importSave(jsonText) {
    try {
      const payload = JSON.parse(jsonText);
      const body = JSON.stringify(payload.state);
      if (checksum(body) !== payload.checksum) return { ok: false, message: 'File save không hợp lệ (sai checksum)' };
      if (payload.version !== SAVE_VERSION) return { ok: false, message: 'Phiên bản save không tương thích' };
      return { ok: true, state: payload.state };
    } catch (e) { return { ok: false, message: 'File không đọc được' }; }
  },
};
