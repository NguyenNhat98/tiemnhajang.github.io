/** 20 sự kiện ngẫu nhiên đầu ngày (spec §29) — mỗi event có CHOICE thật, không chỉ trừ tiền vô nghĩa. */
export const events = [
  { id: 'mua_lon', title: '🌧️ Mưa lớn', description: 'Trời đổ mưa lớn bất chợt, đường phố vắng khách.', choices: [
    { label: 'Dọn mái che, cố bán dưới mưa', cost: 200000, reputationEffect: 2 },
    { label: 'Đóng cửa sớm hôm nay', cost: 0, reputationEffect: 0, closeToday: true },
  ] },
  { id: 'nang_nong', title: '🔥 Nắng nóng gay gắt', description: 'Trời nắng nóng, khách đi đường khát nước, thèm đồ mát.', choices: [
    { label: 'Khuyến mãi nước & kem hôm nay', cost: 0, reputationEffect: 1, demandBoost: { categories: ['nuoc_uong', 'dong_lanh'], mult: 1.4 } },
    { label: 'Bán giá bình thường', cost: 0, reputationEffect: 0 },
  ] },
  { id: 'ngay_linh_luong', title: '💵 Ngày lĩnh lương', description: 'Hôm nay nhiều người lĩnh lương, có thể mua sắm nhiều hơn.', choices: [
    { label: 'Chuẩn bị thêm hàng bán', cost: 300000, reward: 500000, reputationEffect: 1 },
    { label: 'Giữ nguyên kế hoạch', cost: 0, reputationEffect: 0 },
  ], demandBoostAll: 1.25 },
  { id: 'ngay_ram', title: '🕯️ Ngày Rằm', description: 'Hôm nay là ngày Rằm, nhu cầu nhang, hoa, trái cây cúng tăng mạnh.', choices: [
    { label: 'Nhập thêm nhang, hoa cúng', cost: 150000, reputationEffect: 0 },
    { label: 'Bỏ qua', cost: 0, reputationEffect: 0 },
  ], demandBoost: { categories: ['do_cung', 'trai_cay'], mult: 2.2 } },
  { id: 'bao', title: '🌀 Bão lớn', description: 'Đài báo bão lớn sắp đổ bộ khu vực.', choices: [
    { label: 'Đóng cửa tránh bão', cost: 0, reputationEffect: 1, closeToday: true },
    { label: 'Vẫn mở cửa bất chấp rủi ro', cost: 0, reputationEffect: -2, delayedEffect: { days: 1, money: -800000, note: 'Hư hại do bão' } },
  ] },
  { id: 'nha_cung_cap_xa_kho', title: '📦 Nhà cung cấp xả kho', description: 'Nhà cung cấp xả kho, giá nhập hôm nay giảm 20%.', choices: [
    { label: 'Nhập hàng số lượng lớn', cost: 1000000, reputationEffect: 0, buyDiscount: 0.2 },
    { label: 'Không nhập thêm', cost: 0, reputationEffect: 0 },
  ] },
  { id: 'doi_thu_khai_truong', title: '🏪 Đối thủ khai trương', description: 'Một cửa hàng tạp hóa mới vừa khai trương gần đó.', choices: [
    { label: 'Giảm giá cạnh tranh', cost: 0, reputationEffect: 0, priceSuggestion: -0.05 },
    { label: 'Giữ nguyên, tập trung chất lượng', cost: 0, reputationEffect: 1 },
    { label: 'Chạy ngay một chiến dịch quảng cáo', cost: 500000, reputationEffect: 2 },
  ] },
  { id: 'gia_heo_tang', title: '📈 Giá heo tăng', description: 'Giá thịt heo trên thị trường tăng đột biến.', choices: [
    { label: 'Tăng giá bán theo thị trường', cost: 0, reputationEffect: -1 },
    { label: 'Giữ giá bán, chấp nhận lời ít hơn', cost: 200000, reputationEffect: 2 },
  ], costMultiplier: { productId: 'thit_heo', mult: 1.3 } },
  { id: 'mat_dien', title: '⚡ Mất điện', description: 'Tủ lạnh đang chứa nhiều hàng tươi.', choices: [
    { label: 'Mua máy phát ngay → bảo vệ hàng', cost: 3000000, reputationEffect: 0, grantsEquipment: 'may_phat_dien' },
    { label: 'Gọi thợ điện → mất 2 giờ', cost: 500000, reputationEffect: 0, delayOpen: 2 },
    { label: 'Chấp nhận rủi ro', cost: 0, reputationEffect: -1, spoilFridgePct: 0.35, needsEquipmentToSkip: 'may_phat_dien' },
  ] },
  { id: 'khach_vip', title: '👑 Khách VIP ghé thăm', description: 'Một vị khách VIP bất ngờ ghé tiệm hôm nay.', choices: [
    { label: 'Phục vụ tận tình, ưu đãi đặc biệt', cost: 0, reward: 300000, reputationEffect: 3 },
    { label: 'Phục vụ như khách thường', cost: 0, reward: 100000, reputationEffect: 1 },
  ] },
  { id: 'review_viral', title: '📱 Review viral', description: 'Một bài đánh giá về tiệm bất ngờ viral trên mạng xã hội.', choices: [
    { label: 'Tương tác tích cực, cảm ơn khách', cost: 0, reputationEffect: 5 },
    { label: 'Phớt lờ, không phản hồi', cost: 0, reputationEffect: 1 },
  ] },
  { id: 'don_hang_lon', title: '🛒 Đơn hàng sỉ lớn', description: 'Một khách muốn đặt đơn hàng số lượng lớn, giảm giá 10%.', choices: [
    { label: 'Nhận đơn', cost: 0, reward: 1500000, reputationEffect: 2 },
    { label: 'Từ chối, không đủ hàng', cost: 0, reward: 0, reputationEffect: -1 },
  ] },
  { id: 'kiem_tra', title: '🕵️ Đoàn kiểm tra', description: 'Đoàn kiểm tra an toàn thực phẩm ghé thăm đột xuất.', choices: [
    { label: 'Xuất trình giấy phép & bình chữa cháy', cost: 0, reputationEffect: 2, needsAllEquipment: ['giay_phep', 'binh_chua_chay'] },
    { label: 'Nộp phạt ngay', cost: 500000, reputationEffect: -2 },
  ] },
  { id: 'trom', title: '🕶️ Nghi có trộm', description: 'Phát hiện một người lạ lảng vảng quanh quầy hàng.', choices: [
    { label: 'Cảnh giác theo dõi sát', cost: 0, reputationEffect: 0 },
    { label: 'Không để ý', cost: 0, reputationEffect: 0, theftRisk: true },
  ] },
  { id: 'hong_tu', title: '🧊 Hỏng tủ lạnh', description: 'Tủ mát/tủ đông trong tiệm đột ngột trục trặc.', choices: [
    { label: 'Gọi thợ sửa ngay', cost: 600000, reputationEffect: 0 },
    { label: 'Để từ từ sửa sau', cost: 0, reputationEffect: -1, spoilFridgePct: 0.4 },
  ] },
  { id: 'vo_ong_nuoc', title: '🚰 Vỡ ống nước', description: 'Đường ống nước trong tiệm bị vỡ, nước tràn ra sàn.', choices: [
    { label: 'Gọi thợ sửa chuyên nghiệp', cost: 400000, reputationEffect: 1 },
    { label: 'Tự xử lý tạm bợ', cost: 100000, reputationEffect: -1 },
  ] },
  { id: 'khach_truot_nga', title: '🤕 Khách trượt ngã', description: 'Một khách bị trượt ngã do sàn ướt trong tiệm.', choices: [
    { label: 'Thương lượng, hỗ trợ viện phí', cost: 300000, reputationEffect: 1 },
    { label: 'Từ chối trách nhiệm', cost: 0, reputationEffect: -3 },
  ] },
  { id: 'hang_giao_tre', title: '🚚 Hàng giao trễ', description: 'Lô hàng nhập hôm nay bị nhà cung cấp giao trễ.', choices: [
    { label: 'Gọi điện thúc giục', cost: 50000, reputationEffect: 0 },
    { label: 'Chờ đợi, bán hàng tồn kho', cost: 0, reputationEffect: 0 },
  ] },
  { id: 'khach_xin_ghi_no', title: '📒 Khách xin ghi nợ', description: 'Một khách quen xin ghi nợ để mua đồ hôm nay.', choices: [
    { label: 'Đồng ý cho ghi nợ', cost: 0, reputationEffect: 2, delayedEffect: { days: 3, money: 150000, note: 'Khách trả nợ' } },
    { label: 'Từ chối khéo léo', cost: 0, reputationEffect: -1 },
  ] },
  { id: 'hang_gia', title: '🚫 Hàng kém chất lượng', description: 'Phát hiện một lô hàng nghi là hàng giả từ nhà cung cấp.', choices: [
    { label: 'Trả lại nhà cung cấp', cost: 0, reputationEffect: 1 },
    { label: 'Vẫn bán ra (rủi ro bị phát hiện)', cost: 0, reward: 200000, reputationEffect: -4 },
  ] },
];
