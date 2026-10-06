/** 14 archetype khách hàng (spec §17) + sinh tên người Việt ngẫu nhiên. */
export const archetypes = [
  { id: 'ba_hang_xom', ageGroup: 'Trung niên', personality: 'Bà hàng xóm', minMoney: 50000, maxMoney: 200000, patience: 70, priceSensitivity: 0.5, loyalty: 70, shoppingPattern: 'small' },
  { id: 'sinh_vien', ageGroup: 'Trẻ', personality: 'Sinh viên', minMoney: 20000, maxMoney: 80000, patience: 45, priceSensitivity: 0.8, loyalty: 40, shoppingPattern: 'small' },
  { id: 'cong_nhan', ageGroup: 'Trung niên', personality: 'Công nhân', minMoney: 50000, maxMoney: 150000, patience: 40, priceSensitivity: 0.7, loyalty: 50, shoppingPattern: 'small' },
  { id: 'dan_van_phong', ageGroup: 'Trẻ-trung niên', personality: 'Dân văn phòng', minMoney: 80000, maxMoney: 300000, patience: 50, priceSensitivity: 0.4, loyalty: 50, shoppingPattern: 'specific' },
  { id: 'tre_con', ageGroup: 'Thiếu nhi', personality: 'Trẻ con', minMoney: 10000, maxMoney: 30000, patience: 30, priceSensitivity: 0.2, loyalty: 30, shoppingPattern: 'impulse' },
  { id: 'me_co_con_nho', ageGroup: 'Trung niên', personality: 'Mẹ có con nhỏ', minMoney: 100000, maxMoney: 350000, patience: 60, priceSensitivity: 0.5, loyalty: 60, shoppingPattern: 'bulk' },
  { id: 'chu_xe_om', ageGroup: 'Trung niên', personality: 'Chú xe ôm', minMoney: 20000, maxMoney: 60000, patience: 55, priceSensitivity: 0.6, loyalty: 60, shoppingPattern: 'small' },
  { id: 'khach_quen', ageGroup: 'Đa dạng', personality: 'Khách quen', minMoney: 50000, maxMoney: 250000, patience: 80, priceSensitivity: 0.3, loyalty: 90, shoppingPattern: 'specific' },
  { id: 'khach_voi', ageGroup: 'Đa dạng', personality: 'Khách vội', minMoney: 30000, maxMoney: 120000, patience: 20, priceSensitivity: 0.5, loyalty: 30, shoppingPattern: 'small' },
  { id: 'khach_kho_tinh', ageGroup: 'Đa dạng', personality: 'Khách khó tính', minMoney: 50000, maxMoney: 200000, patience: 35, priceSensitivity: 0.7, loyalty: 30, shoppingPattern: 'specific' },
  { id: 'khach_ngheo', ageGroup: 'Đa dạng', personality: 'Khách nghèo', minMoney: 10000, maxMoney: 50000, patience: 60, priceSensitivity: 0.9, loyalty: 60, shoppingPattern: 'small' },
  { id: 'khach_giau', ageGroup: 'Đa dạng', personality: 'Khách giàu', minMoney: 300000, maxMoney: 1000000, patience: 65, priceSensitivity: 0.1, loyalty: 40, shoppingPattern: 'bulk' },
  { id: 'food_reviewer', ageGroup: 'Trẻ', personality: 'Food reviewer', minMoney: 50000, maxMoney: 150000, patience: 50, priceSensitivity: 0.4, loyalty: 20, shoppingPattern: 'specific', reviewBoost: 2.5 },
  { id: 'vip', ageGroup: 'Đa dạng', personality: 'VIP', minMoney: 500000, maxMoney: 2000000, patience: 35, priceSensitivity: 0.1, loyalty: 80, shoppingPattern: 'bulk', rewardBoost: 1.5 },
];

const FIRST = ['Lan', 'Hùng', 'Minh', 'Hoa', 'Tuấn', 'Trang', 'Dũng', 'Nga', 'Phúc', 'Mai', 'Tâm', 'Khoa', 'Linh', 'Sơn', 'Thảo', 'Huy', 'Yến', 'Quân', 'Vy', 'Đức', 'Sáu', 'Bảy', 'Thu', 'Hiền'];
const TITLE = ['Chị', 'Anh', 'Cô', 'Chú', 'Bác', 'Em', 'Thím', 'Dì', 'Bà'];

export function generateVietnameseName(rng) {
  const title = rng ? rng.pick(TITLE) : TITLE[Math.floor(Math.random() * TITLE.length)];
  const first = rng ? rng.pick(FIRST) : FIRST[Math.floor(Math.random() * FIRST.length)];
  return `${title} ${first}`;
}
