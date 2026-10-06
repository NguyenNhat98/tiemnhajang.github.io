import { uid } from '../core/Utils.js';
import { EquipmentSystem } from './EquipmentSystem.js';
import { StaffSystem } from './StaffSystem.js';
import { ServiceSystem } from './ServiceSystem.js';

/** spec §22: reviewScore = serviceSpeed + priceScore + stockScore + qualityScore + staffScore + equipmentScore + serviceScore + random. */
export const ReviewSystem = {
  maybeCreateReview(state, customer, fulfillRate, forced) {
    const baseChance = 0.3 * (customer.reviewBoost || 1);
    if (!forced && Math.random() > Math.min(0.9, baseChance)) return null;

    const eq = EquipmentSystem.aggregate(state);
    const staffEff = StaffSystem.aggregate(state);
    const waitRatio = customer.maxPatience ? customer.patience / customer.maxPatience : 1;

    const serviceSpeed = waitRatio * 25;
    const priceScore = customer.priceSensitivity < 0.5 ? 15 : 10;
    const stockScore = fulfillRate * 20;
    const qualityScore = Math.min(15, eq.qualityPerceptionBonus + 10);
    const staffScore = Math.min(10, staffEff.moodAvg / 10);
    const equipmentScore = Math.min(10, eq.serviceQuality);
    const serviceScoreBonus = Math.min(5, ServiceSystem.aggregate(state).owned.length);
    let score = serviceSpeed + priceScore + stockScore + qualityScore + staffScore + equipmentScore + serviceScoreBonus + Math.random() * 10;
    if (forced) score = Math.min(score, 30);
    score = Math.max(0, Math.min(100, score));

    const stars = Math.max(1, Math.min(5, Math.round(score / 20)));
    const tags = [];
    if (fulfillRate < 1) tags.push('thiếu hàng');
    if (customer.mistakes > 0) tags.push('nhầm món');
    if (waitRatio < 0.5) tags.push('chờ lâu');
    if (stars >= 4) tags.push('hài lòng');
    if (stars <= 2) tags.push('không hài lòng');

    const product = customer.cart.find((l) => l.fulfilled > 0);
    const text = pickFeedbackText(stars, waitRatio, customer, fulfillRate);
    const review = { id: uid('rev'), customer: customer.name, day: state.day, productId: product?.productId || null, stars, text, tags, replied: false, reply: null, viral: false };
    state.reviews.unshift(review);
    if (stars >= 5) state.stats.fiveStarReviews += 1;
    return review;
  },
  reply(state, reviewId, text) {
    const r = state.reviews.find((x) => x.id === reviewId);
    if (!r) return;
    r.reply = text; r.replied = true;
  },
};

/** spec §51: feedback phải dựa trên hành vi, không chung chung. */
function pickFeedbackText(stars, waitRatio, customer, fulfillRate) {
  if (fulfillRate < 1) return 'Không có món này thì thôi vậy.';
  if (waitRatio < 0.4) return 'Đứng đợi hơi lâu.';
  if (customer.priceSensitivity > 0.7 && stars <= 3) return 'Giá hơi cao so với bên kia.';
  if (stars >= 5) return 'Tiệm bán dễ chịu ghê, lấy đồ cái có liền, chắc chắn quay lại.';
  if (stars === 4) return 'Tiệm cô chủ dễ thương, hàng tươi, lấy đồ nhanh.';
  if (stars === 3) return 'Tạm ổn, cũng bình thường.';
  return 'Nhầm món, phục vụ chưa tốt lắm.';
}
