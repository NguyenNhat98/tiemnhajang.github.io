import { drama } from '../data/drama.js';
import { EventSystem } from './EventSystem.js';
import { ReputationSystem } from './ReputationSystem.js';

export const DramaSystem = {
  maybeTrigger(state, rng, dtGameMinutes) {
    if (state.activeDrama || state.activeEvent || state.phase !== 'open') return null;
    // xác suất theo phút game trôi qua — trung bình ~1 drama mỗi 1.5-2 giờ mở cửa.
    const chancePerMinute = 0.012;
    if (!rng.chance(chancePerMinute * dtGameMinutes)) return null;
    const def = rng.pick(drama);
    state.activeDrama = { def };
    return state.activeDrama;
  },
  resolveChoice(state, choiceIndex, rng) {
    const active = state.activeDrama;
    if (!active) return null;
    const choice = active.def.choices[choiceIndex];
    const info = EventSystem.applyChoice(state, choice, active.def, rng);
    if (choice.viralPositiveChance && rng.chance(choice.viralPositiveChance)) { ReputationSystem.update(state, 6); info.viral = 'positive'; }
    if (choice.viralNegativeChance && rng.chance(choice.viralNegativeChance)) { ReputationSystem.update(state, -6); info.viral = 'negative'; }
    state.eventLog.unshift({ day: state.day, title: active.def.title, choice: choice.label });
    state.activeDrama = null;
    return { ...info, impulsePurchase: !!choice.impulsePurchase };
  },
};
