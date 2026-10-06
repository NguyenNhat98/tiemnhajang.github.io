/** Tình huống đời thường trong giờ mở cửa (spec §30) — có thể tạo delayedEffect (spec §31). */
export const drama = [
  { id: 'ba_sau_xin_no', title: 'Bà Sáu xin ghi nợ', description: '"Cô cho bà ghi 100 nghìn tới cuối tuần nha."', choices: [
    { label: 'Cho ghi nợ', cost: 0, reputationEffect: 3, loyaltyEffect: 10, delayedEffect: { days: 3, money: 100000, note: 'Bà Sáu trả nợ', failChance: 0.2, failNote: 'Bà Sáu quên trả' } },
    { label: 'Chỉ cho ghi 50k', cost: 0, reward: 50000, reputationEffect: 1, delayedEffect: { days: 3, money: 50000, note: 'Bà Sáu trả nợ', failChance: 0.1 } },
    { label: 'Từ chối', cost: 0, reputationEffect: -2, loyaltyEffect: -10 },
  ] },
  { id: 'khach_quen_phat_hien_gia', title: 'Khách quen phát hiện giá cao', description: '"Ủa hôm qua cô bán tui 12 nghìn, sao nay 15 nghìn vậy?"', choices: [
    { label: 'Giải thích giá nhập tăng', cost: 0, reputationEffect: 1 },
    { label: 'Giảm giá cho khách quen', cost: 10000, reputationEffect: 2, loyaltyEffect: 10 },
    { label: 'Giữ giá', cost: 0, reputationEffect: -1 },
  ] },
  { id: 'doi_thu_giam_gia', title: 'Đối thủ giảm giá', description: 'Tiệm bên cạnh giảm giá nước 20%.', choices: [
    { label: 'Giảm theo', cost: 0, reputationEffect: 0, priceSuggestion: -0.1 },
    { label: 'Giữ giá', cost: 0, reputationEffect: 0 },
    { label: 'Tăng quảng cáo', cost: 300000, reputationEffect: 1 },
    { label: 'Chạy khuyến mãi riêng', cost: 150000, reputationEffect: 2 },
  ] },
  { id: 'khach_quen_dien_thoai', title: 'Khách để quên điện thoại', description: 'Một khách để quên điện thoại trên quầy hàng rồi rời đi.', choices: [
    { label: 'Giữ lại', cost: 0, reputationEffect: 3, loyaltyEffect: 15 },
    { label: 'Tìm cách liên hệ', cost: 0, reputationEffect: 4, loyaltyEffect: 10 },
  ] },
  { id: 'tre_con_nhin_tu_kem', title: 'Trẻ con đứng nhìn tủ kem', description: 'Một đứa trẻ đứng tần ngần trước tủ kem mãi không rời.', choices: [
    { label: 'Tặng một cây kem', cost: 8000, reputationEffect: 2, impulsePurchase: true },
    { label: 'Nhắc nhở phụ huynh', cost: 0, reputationEffect: 0 },
  ] },
  { id: 'khach_dang_bai_che', title: 'Khách đăng bài chê tiệm', description: 'Một khách đăng bài chê tiệm trong nhóm khu phố.', choices: [
    { label: 'Phản hồi lịch sự', cost: 0, reputationEffect: 1 },
    { label: 'Xin lỗi + hoàn tiền', cost: 50000, reputationEffect: 3, viralPositiveChance: 0.3 },
    { label: 'Tranh luận', cost: 0, reputationEffect: -4, viralNegativeChance: 0.4 },
    { label: 'Không phản hồi', cost: 0, reputationEffect: -2 },
  ] },
  { id: 'shipper_het_mon', title: 'Shipper đến lấy hàng hết món', description: '"Chị ơi đơn này hết món rồi."', choices: [
    { label: 'Đổi sản phẩm', cost: 0, reputationEffect: 1 },
    { label: 'Hủy đơn', cost: 0, reputationEffect: -1 },
    { label: 'Chạy đi nhập', cost: 30000, reputationEffect: 2, delayOpen: 0.5 },
  ] },
];
