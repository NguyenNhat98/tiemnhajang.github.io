/** Nhiệm vụ (spec §41) + Thành tựu (spec §42). */
export const dailyQuestPool = [
  { id: 'dq_sell20', title: 'Bán 20 sản phẩm', type: 'dayProductsSold', target: 20, reward: 100000 },
  { id: 'dq_serve10', title: 'Phục vụ 10 khách', type: 'dayCustomersServed', target: 10, reward: 100000 },
  { id: 'dq_noangry', title: 'Không để khách bỏ đi', type: 'dayNoAngryLeave', target: 1, reward: 150000 },
  { id: 'dq_fresh5', title: 'Bán hết 5 batch hàng tươi', type: 'dayFreshBatchesSold', target: 5, reward: 100000 },
  { id: 'dq_5star3', title: 'Có 3 review 5 sao', type: 'dayFiveStarReviews', target: 3, reward: 150000 },
];

export const questTemplates = [
  { id: 'q_serve100', title: 'Phục vụ 100 khách', type: 'totalCustomersServed', target: 100, reward: 500000 },
  { id: 'q_rep70', title: 'Đạt uy tín 70', type: 'reputation', target: 70, reward: 500000 },
  { id: 'q_services3', title: 'Mở 3 dịch vụ', type: 'servicesCount', target: 3, reward: 600000 },
  { id: 'q_staff2', title: 'Thuê 2 nhân viên', type: 'staffCount', target: 2, reward: 400000 },
  { id: 'q_revenue100m', title: 'Đạt doanh thu 100 triệu', type: 'totalRevenue', target: 100000000, reward: 1000000 },
];

export const achievementTemplates = [
  { id: 'a_khai_truong', title: '🏪 Khai trương', desc: 'Phục vụ khách đầu tiên.' },
  { id: 'a_khong_hong_rau', title: '🥬 Không để rau hỏng', desc: 'Bán hết 20 batch rau trước khi hỏng.' },
  { id: 'a_than_thien', title: '⭐ Chủ tiệm thân thiện', desc: 'Uy tín đạt 80.' },
  { id: 'a_cua_an_cua_de', title: '💰 Có của ăn của để', desc: 'Tổng tài sản đạt 100 triệu.' },
  { id: 'a_dai_gia', title: '👑 Đại gia khu phố', desc: 'Tổng tài sản đạt 300 triệu — chiến thắng!' },
  { id: 'a_viral', title: '🔥 Viral', desc: 'Có một review viral.' },
  { id: 'a_khach_quen', title: '🤝 Khách quen', desc: 'Có 20 khách loyalty cao (>=80).' },
  { id: 'a_ong_trum', title: '📦 Ông trùm nhập hàng', desc: 'Nhập tổng cộng 10.000 sản phẩm.' },
];
