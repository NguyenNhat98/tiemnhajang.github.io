import { CLOSE_HOUR } from '../core/GameState.js';

/** spec §9: game time chạy nhanh hơn real time. 1x: 1 real second = 1.5 game minutes. */
export const GAME_MINUTES_PER_REAL_SECOND = 1.5;

export const TimeSystem = {
  update(state, dtSeconds) {
    const gameMinutes = dtSeconds * GAME_MINUTES_PER_REAL_SECOND * state.timeSpeed;
    state.time += gameMinutes / 60;
    if (state.time > CLOSE_HOUR) state.time = CLOSE_HOUR;
  },
  isClosingTime(state) {
    return state.time >= CLOSE_HOUR;
  },
};
