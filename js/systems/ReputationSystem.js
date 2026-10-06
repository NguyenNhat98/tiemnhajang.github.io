/** Uy tín 0-100 (spec §23) — ảnh hưởng spawn rate, VIP chance, review sentiment, unlock dịch vụ, chất lượng nhân sự, leaderboard. */
export const ReputationSystem = {
  update(state, delta) {
    state.reputation = Math.max(0, Math.min(100, state.reputation + delta));
  },
  customerMultiplier(state) {
    return 0.7 + state.reputation / 100;
  },
};
