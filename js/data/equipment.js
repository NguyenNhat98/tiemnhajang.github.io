/** Thiết bị (spec §26) — mỗi món đều có hiệu ứng gameplay thật, không trang trí. */
export const equipment = [
  { id: 'giay_phep', name: 'Giấy phép kinh doanh', icon: '📜', cost: 2000000, dailyCost: 0, effect: 'Bắt buộc để qua các đợt kiểm tra.', tags: { inspectionRequired: true } },
  { id: 'binh_chua_chay', name: 'Bình chữa cháy', icon: '🧯', cost: 500000, dailyCost: 0, effect: 'Bắt buộc để qua các đợt kiểm tra.', tags: { inspectionRequired: true } },
  { id: 'pos', name: 'Quầy POS', icon: '💳', cost: 4000000, dailyCost: 20000, effect: '+ tốc độ thanh toán, mở khóa self-service.', tags: { checkoutSpeedMult: 1.25, serviceQuality: 5 } },
  { id: 'tu_mat', name: 'Tủ mát', icon: '🧊', cost: 8000000, dailyCost: 30000, effect: '+ hạn sử dụng & capacity nhóm hàng tươi.', tags: { freshShelfLifeMult: 1.5, capacityBonus: 40 } },
  { id: 'tu_dong', name: 'Tủ đông', icon: '❄️', cost: 10000000, dailyCost: 40000, effect: '+ hạn sử dụng nhóm đông lạnh/thịt cá.', tags: { frozenShelfLifeMult: 2.0, capacityBonus: 40 } },
  { id: 'ke_hang', name: 'Kệ hàng', icon: '🗄️', cost: 2500000, dailyCost: 0, effect: '+ sức chứa kho.', tags: { capacityBonus: 60 } },
  { id: 'may_lanh', name: 'Máy lạnh', icon: '❄️', cost: 12000000, dailyCost: 50000, effect: '+ tâm trạng khách, + chất lượng cảm nhận sản phẩm.', tags: { customerMoodBonus: 10, qualityPerceptionBonus: 5 } },
  { id: 'wifi', name: 'Wi-Fi miễn phí', icon: '📶', cost: 1500000, dailyCost: 10000, effect: '+ kiên nhẫn khách khi chờ.', tags: { patienceMult: 1.1 } },
  { id: 'led', name: 'Đèn LED', icon: '💡', cost: 3000000, dailyCost: 15000, effect: '+ khách buổi tối.', tags: { eveningCustomerMult: 1.2 } },
  { id: 'camera', name: 'Camera an ninh', icon: '📷', cost: 5000000, dailyCost: 10000, effect: '- nguy cơ trộm cắp mạnh.', tags: { theftReduction: 0.6 } },
  { id: 'alarm', name: 'Chuông báo động', icon: '🔔', cost: 2000000, dailyCost: 5000, effect: '- nguy cơ trộm cắp (cộng dồn).', tags: { theftReduction: 0.2 } },
  { id: 'may_phat_dien', name: 'Máy phát điện', icon: '🔋', cost: 15000000, dailyCost: 20000, effect: 'Giảm thiệt hại khi mất điện.', tags: { blackoutProtected: true } },
];
