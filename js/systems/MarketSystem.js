import { products } from '../data/products.js';

export const WEATHERS = [
  { id: 'nang_dep', label: 'Nắng đẹp', icon: '☀️', weight: 5, trafficMult: 1.0 },
  { id: 'nang_nong', label: 'Nắng nóng', icon: '🔥', weight: 2, trafficMult: 0.95 },
  { id: 'mua_nho', label: 'Mưa nhỏ', icon: '🌦️', weight: 2, trafficMult: 0.85 },
  { id: 'mua_lon', label: 'Mưa lớn', icon: '🌧️', weight: 1, trafficMult: 0.6 },
  { id: 'mat_me', label: 'Mát mẻ', icon: '⛅', weight: 3, trafficMult: 1.05 },
];
export const SEASONS = [
  { id: 'xuan', label: 'Mùa Xuân', trafficMult: 1.1 },
  { id: 'ha', label: 'Mùa Hạ', trafficMult: 1.0 },
  { id: 'thu', label: 'Mùa Thu', trafficMult: 1.0 },
  { id: 'dong', label: 'Mùa Đông', trafficMult: 0.95 },
];

/** Hệ số giá/nhu cầu theo thời tiết cho từng nhóm sản phẩm — phản ánh chuỗi phản ứng thị trường
 *  (vd. mưa lớn làm rau tăng giá nhập nhưng khách ra đường mua sắm ít hẳn). */
function weatherCategoryCostMult(weatherId, category) {
  if (weatherId === 'mua_lon' && category === 'rau_cu') return 1.15;
  if (weatherId === 'nang_nong' && (category === 'rau_cu' || category === 'trai_cay')) return 1.08;
  return 1;
}
function weatherCategoryDemandMult(weatherId, category) {
  if (weatherId === 'nang_nong' && (category === 'nuoc_uong' || category === 'dong_lanh')) return 1.35;
  if (weatherId === 'mua_lon' && category === 'nuoc_uong') return 0.8;
  if (weatherId === 'mua_lon' && category === 'mi_gao') return 1.15; // ở nhà nấu mì nhiều hơn
  return 1;
}

export const MarketSystem = {
  rollWeather(state, rng) {
    state.weather = rng.weighted(WEATHERS, (w) => w.weight);
    state.season = SEASONS[Math.floor((state.day - 1) / 20) % SEASONS.length];
  },
  /** Đầu mỗi ngày: marketPrice = referencePrice * randomFactor * weatherFactor * eventFactor * seasonFactor * supplyFactor (spec §15). */
  rollDailyMarket(state, rng) {
    const ev = state.todayEventEffects || {};
    products.forEach((p) => {
      let costMult = rng.range(0.9, 1.1);
      costMult *= weatherCategoryCostMult(state.weather?.id, p.category);
      if (ev.costMultiplier?.productId === p.id) costMult *= ev.costMultiplier.mult;
      if (ev.buyDiscount) costMult *= (1 - ev.buyDiscount);
      state.market[p.id] = { buyPrice: Math.max(1, Math.round(p.cost * costMult)) };
    });
  },
  weatherCategoryDemandMult,
};
