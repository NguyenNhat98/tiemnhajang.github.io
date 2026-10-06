/** Kênh quảng cáo (spec §28) — có thời hạn, không chạy vô hạn. */
export const advertising = [
  { id: 'to_roi', name: 'Tờ rơi', icon: '📰', cost: 300000, duration: 3, customerMultiplier: 1.1, reputationEffect: 0 },
  { id: 'loa', name: 'Loa', icon: '📢', cost: 200000, duration: 2, customerMultiplier: 1.05, reputationEffect: 0 },
  { id: 'zalo', name: 'Zalo', icon: '💬', cost: 500000, duration: 5, customerMultiplier: 1.15, reputationEffect: 1 },
  { id: 'facebook', name: 'Facebook', icon: '📘', cost: 1000000, duration: 7, customerMultiplier: 1.25, reputationEffect: 1 },
  { id: 'pr', name: 'PR báo địa phương', icon: '📝', cost: 2000000, duration: 10, customerMultiplier: 1.3, reputationEffect: 3 },
  { id: 'tiktok_kol', name: 'TikTok KOL', icon: '🎥', cost: 3000000, duration: 2, customerMultiplier: 1.3, reputationEffect: 4 },
  { id: 'tai_tro_le_hoi', name: 'Tài trợ lễ hội', icon: '🎪', cost: 3000000, duration: 7, customerMultiplier: 1.2, reputationEffect: 8 },
];
