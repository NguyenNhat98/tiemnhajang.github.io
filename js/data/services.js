/** Dịch vụ mở rộng (spec §27) — mỗi dịch vụ thay đổi gameplay thật (không chỉ cộng số). */
export const services = [
  { id: 'nap_the', name: 'Nạp thẻ điện thoại', icon: '📱', unlockCost: 1000000, reputationRequirement: 0, dailyCost: 0, customerBonus: 0.05, extraRevenue: 50000 },
  { id: 'banh_mi_xoi', name: 'Bánh mì / Xôi', icon: '🥖', unlockCost: 2000000, reputationRequirement: 10, dailyCost: 20000, customerBonus: 0.10, extraRevenue: 150000, morningBoost: 1.3 },
  { id: 'ca_phe', name: 'Cà phê', icon: '☕', unlockCost: 3000000, reputationRequirement: 20, dailyCost: 30000, customerBonus: 0.10, extraRevenue: 200000, morningBoost: 1.2 },
  { id: 'giao_hang', name: 'Giao hàng', icon: '🛵', unlockCost: 5000000, reputationRequirement: 30, dailyCost: 50000, customerBonus: 0.15, extraRevenue: 300000, requiresRole: 'shipper' },
  { id: 'membership', name: 'Membership', icon: '💳', unlockCost: 4000000, reputationRequirement: 25, dailyCost: 10000, customerBonus: 0.10, extraRevenue: 150000, loyaltyBoost: 10 },
  { id: 'so_che_thit_ca', name: 'Sơ chế thịt cá', icon: '🔪', unlockCost: 3500000, reputationRequirement: 20, dailyCost: 20000, customerBonus: 0.08, extraRevenue: 180000 },
  { id: 'banh_ngot', name: 'Bánh ngọt', icon: '🍰', unlockCost: 2500000, reputationRequirement: 15, dailyCost: 20000, customerBonus: 0.08, extraRevenue: 160000 },
  { id: 'com_hop', name: 'Cơm hộp', icon: '🍱', unlockCost: 4500000, reputationRequirement: 35, dailyCost: 40000, customerBonus: 0.12, extraRevenue: 250000, noonBoost: 1.3 },
];
