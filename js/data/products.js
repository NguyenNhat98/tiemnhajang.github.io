/** Danh mục sản phẩm — data-driven, không hard-code vào logic gameplay. 86 sản phẩm / 15 nhóm. */
const P = (id, name, category, unit, icon, cost, referencePrice, shelfLife, demand, quality, priceElasticity) =>
  ({ id, name, category, unit, icon, cost, referencePrice, shelfLife, demand, quality, priceElasticity });

export const categories = [
  { id: 'rau_cu', name: 'Rau củ', icon: '🥬' },
  { id: 'trai_cay', name: 'Trái cây', icon: '🍊' },
  { id: 'thit_ca', name: 'Thịt cá', icon: '🥩' },
  { id: 'trung_sua', name: 'Trứng sữa', icon: '🥛' },
  { id: 'mi_gao', name: 'Mì/Gạo', icon: '🍚' },
  { id: 'gia_vi', name: 'Gia vị', icon: '🧂' },
  { id: 'banh_keo', name: 'Bánh kẹo', icon: '🍬' },
  { id: 'nuoc_uong', name: 'Nước uống', icon: '🥤' },
  { id: 'dong_lanh', name: 'Đông lạnh', icon: '🧊' },
  { id: 'hoa_pham', name: 'Hóa phẩm', icon: '🧴' },
  { id: 'cham_soc_ca_nhan', name: 'Chăm sóc cá nhân', icon: '🧼' },
  { id: 'an_sang', name: 'Đồ ăn sáng', icon: '🥐' },
  { id: 'van_phong_pham', name: 'Văn phòng phẩm', icon: '✏️' },
  { id: 'do_cung', name: 'Đồ cúng', icon: '🕯️' },
  { id: 'thu_cung', name: 'Thú cưng', icon: '🐾' },
];

export const products = [
  // Rau củ
  P('rau_muong', 'Rau muống', 'rau_cu', 'bó', '🥬', 5000, 8000, 2, 14, 80, 1.4),
  P('cai_xanh', 'Cải xanh', 'rau_cu', 'bó', '🥬', 6000, 9000, 2, 10, 80, 1.3),
  P('cai_thao', 'Cải thảo', 'rau_cu', 'kg', '🥬', 9000, 14000, 3, 8, 80, 1.2),
  P('ca_chua', 'Cà chua', 'rau_cu', 'kg', '🍅', 12000, 18000, 4, 15, 82, 1.2),
  P('khoai_tay', 'Khoai tây', 'rau_cu', 'kg', '🥔', 15000, 22000, 10, 12, 85, 1.0),
  P('hanh_tay', 'Hành tây', 'rau_cu', 'kg', '🧅', 10000, 16000, 14, 8, 85, 0.9),
  P('toi', 'Tỏi', 'rau_cu', 'kg', '🧄', 25000, 38000, 30, 6, 85, 0.6),
  P('ot', 'Ớt', 'rau_cu', 'kg', '🌶️', 20000, 32000, 7, 5, 82, 0.8),
  P('dau_que', 'Đậu que', 'rau_cu', 'kg', '🫛', 14000, 20000, 3, 6, 80, 1.1),
  P('bi_do', 'Bí đỏ', 'rau_cu', 'kg', '🎃', 8000, 13000, 10, 5, 82, 0.9),
  // Trái cây
  P('chuoi', 'Chuối', 'trai_cay', 'nải', '🍌', 15000, 22000, 4, 13, 80, 1.1),
  P('cam', 'Cam', 'trai_cay', 'kg', '🍊', 20000, 30000, 7, 14, 82, 1.0),
  P('tao', 'Táo', 'trai_cay', 'kg', '🍎', 35000, 50000, 12, 10, 85, 0.9),
  P('dua_hau', 'Dưa hấu', 'trai_cay', 'kg', '🍉', 10000, 16000, 6, 11, 80, 1.1),
  P('xoai', 'Xoài', 'trai_cay', 'kg', '🥭', 25000, 38000, 5, 12, 80, 1.1),
  P('oi', 'Ổi', 'trai_cay', 'kg', '🍈', 12000, 18000, 5, 7, 78, 1.0),
  P('thanh_long', 'Thanh long', 'trai_cay', 'kg', '🐉', 18000, 27000, 8, 8, 80, 1.0),
  P('mit', 'Mít', 'trai_cay', 'kg', '🟡', 22000, 32000, 4, 6, 78, 1.1),
  P('le', 'Lê', 'trai_cay', 'kg', '🍐', 30000, 44000, 10, 7, 83, 0.9),
  P('quyt', 'Quýt', 'trai_cay', 'kg', '🍊', 22000, 33000, 7, 8, 80, 1.0),
  // Thịt cá
  P('thit_heo', 'Thịt heo', 'thit_ca', 'kg', '🥩', 110000, 140000, 2, 17, 85, 1.3),
  P('thit_bo', 'Thịt bò', 'thit_ca', 'kg', '🥩', 220000, 280000, 2, 9, 85, 1.4),
  P('thit_ga', 'Thịt gà', 'thit_ca', 'kg', '🍗', 70000, 95000, 2, 13, 83, 1.2),
  P('ca_ro', 'Cá rô', 'thit_ca', 'kg', '🐟', 55000, 72000, 1, 6, 76, 1.3),
  P('ca_thu', 'Cá thu', 'thit_ca', 'kg', '🐟', 90000, 115000, 1, 6, 78, 1.3),
  P('ca_basa', 'Cá basa', 'thit_ca', 'kg', '🐟', 45000, 60000, 1, 9, 78, 1.3),
  P('tom', 'Tôm', 'thit_ca', 'kg', '🦐', 150000, 190000, 1, 8, 78, 1.4),
  P('muc', 'Mực', 'thit_ca', 'kg', '🦑', 130000, 170000, 1, 6, 78, 1.4),
  // Trứng sữa
  P('trung_ga', 'Trứng gà', 'trung_sua', 'chục', '🥚', 28000, 35000, 14, 15, 88, 0.9),
  P('trung_vit', 'Trứng vịt', 'trung_sua', 'chục', '🥚', 32000, 40000, 14, 7, 86, 0.9),
  P('sua_tuoi', 'Sữa tươi', 'trung_sua', 'hộp', '🥛', 28000, 34000, 10, 14, 90, 0.8),
  P('sua_chua', 'Sữa chua', 'trung_sua', 'hộp', '🍦', 20000, 26000, 14, 10, 88, 0.9),
  P('pho_mai', 'Phô mai', 'trung_sua', 'hộp', '🧀', 32000, 42000, 30, 7, 85, 1.0),
  // Mì/gạo
  P('gao_st25', 'Gạo ST25', 'mi_gao', 'kg', '🍚', 22000, 28000, 90, 16, 90, 0.7),
  P('gao_thom', 'Gạo thơm', 'mi_gao', 'kg', '🍚', 18000, 23000, 90, 12, 85, 0.7),
  P('mi_tom', 'Mì tôm', 'mi_gao', 'gói', '🍜', 3500, 4500, 150, 18, 75, 0.8),
  P('mi_bo_ham', 'Mì bò hầm', 'mi_gao', 'gói', '🍜', 5000, 7000, 150, 10, 78, 0.9),
  P('mi_chua_cay', 'Mì chua cay', 'mi_gao', 'gói', '🍜', 5000, 7000, 150, 10, 78, 0.9),
  P('bun_kho', 'Bún khô', 'mi_gao', 'gói', '🍜', 10000, 14000, 120, 7, 78, 0.9),
  P('pho_kho', 'Phở khô', 'mi_gao', 'gói', '🍜', 12000, 17000, 120, 7, 78, 0.9),
  // Gia vị
  P('nuoc_mam', 'Nước mắm', 'gia_vi', 'chai', '🧴', 25000, 32000, 365, 10, 85, 0.6),
  P('nuoc_tuong', 'Nước tương', 'gia_vi', 'chai', '🧴', 15000, 20000, 365, 7, 82, 0.6),
  P('dau_an', 'Dầu ăn', 'gia_vi', 'chai', '🫗', 32000, 42000, 270, 10, 85, 0.6),
  P('duong', 'Đường', 'gia_vi', 'kg', '🧂', 18000, 24000, 365, 7, 85, 0.6),
  P('muoi', 'Muối', 'gia_vi', 'gói', '🧂', 4000, 6000, 365, 6, 80, 0.5),
  P('tieu', 'Tiêu', 'gia_vi', 'gói', '🧂', 20000, 28000, 365, 4, 82, 0.5),
  P('bot_ngot', 'Bột ngọt', 'gia_vi', 'gói', '🧂', 9000, 13000, 365, 8, 80, 0.6),
  // Bánh kẹo
  P('banh_quy', 'Bánh quy', 'banh_keo', 'gói', '🍪', 10000, 14000, 120, 7, 80, 1.1),
  P('banh_oreos', 'Bánh chocolate', 'banh_keo', 'gói', '🍫', 14000, 19000, 120, 8, 85, 1.1),
  P('keo_mut', 'Kẹo mút', 'banh_keo', 'gói', '🍭', 8000, 12000, 150, 6, 80, 1.1),
  P('snack', 'Snack', 'banh_keo', 'gói', '🍟', 6000, 9000, 90, 9, 78, 1.2),
  P('banh_xop', 'Bánh xốp', 'banh_keo', 'gói', '🧇', 11000, 15000, 100, 6, 82, 1.1),
  // Nước uống
  P('nuoc_loc', 'Nước lọc', 'nuoc_uong', 'chai', '🥤', 3500, 5000, 180, 12, 95, 1.2),
  P('nuoc_ngot', 'Nước ngọt', 'nuoc_uong', 'chai', '🥤', 8000, 12000, 180, 13, 85, 1.0),
  P('nuoc_tang_luc', 'Nước tăng lực', 'nuoc_uong', 'lon', '🥫', 9000, 13000, 200, 7, 82, 1.0),
  P('tra_xanh', 'Trà xanh', 'nuoc_uong', 'chai', '🍵', 7000, 11000, 180, 9, 82, 1.0),
  P('nuoc_dua', 'Nước dừa', 'nuoc_uong', 'hộp', '🥥', 10000, 15000, 120, 6, 82, 1.1),
  // Đông lạnh
  P('xuc_xich', 'Xúc xích', 'dong_lanh', 'gói', '🌭', 24000, 32000, 45, 8, 78, 1.1),
  P('ca_vien', 'Cá viên', 'dong_lanh', 'gói', '🐟', 26000, 35000, 45, 7, 78, 1.1),
  P('bo_vien', 'Bò viên', 'dong_lanh', 'gói', '🥩', 30000, 40000, 45, 6, 78, 1.1),
  P('kem', 'Kem', 'dong_lanh', 'cây', '🍦', 5000, 8000, 60, 10, 80, 1.3),
  // Hóa phẩm
  P('nuoc_rua_chen', 'Nước rửa chén', 'hoa_pham', 'chai', '🧴', 22000, 30000, 365, 6, 85, 0.9),
  P('bot_giat', 'Bột giặt', 'hoa_pham', 'gói', '🧺', 45000, 58000, 365, 6, 85, 0.9),
  P('nuoc_lau_san', 'Nước lau sàn', 'hoa_pham', 'chai', '🧴', 20000, 27000, 365, 4, 80, 0.9),
  P('giay_ve_sinh', 'Giấy vệ sinh', 'hoa_pham', 'lốc', '🧻', 28000, 38000, 365, 8, 82, 0.8),
  P('tui_rac', 'Túi rác', 'hoa_pham', 'cuộn', '🗑️', 10000, 15000, 365, 5, 80, 0.8),
  // Chăm sóc cá nhân
  P('dau_goi', 'Dầu gội', 'cham_soc_ca_nhan', 'chai', '🧴', 48000, 62000, 365, 5, 85, 1.0),
  P('kem_danh_rang', 'Kem đánh răng', 'cham_soc_ca_nhan', 'tuýp', '🪥', 14000, 19000, 365, 6, 85, 0.9),
  P('ban_chai', 'Bàn chải', 'cham_soc_ca_nhan', 'cái', '🪥', 6000, 10000, 365, 4, 80, 0.9),
  P('xa_phong', 'Xà phòng', 'cham_soc_ca_nhan', 'cục', '🧼', 7000, 11000, 365, 5, 80, 0.9),
  P('khan_giay', 'Khăn giấy', 'cham_soc_ca_nhan', 'hộp', '🧻', 9000, 13000, 365, 6, 80, 0.9),
  // Đồ ăn sáng
  P('banh_mi', 'Bánh mì', 'an_sang', 'ổ', '🥖', 5000, 12000, 1, 15, 75, 1.3),
  P('xoi', 'Xôi', 'an_sang', 'gói', '🍙', 8000, 15000, 1, 10, 75, 1.2),
  P('trung_op_la', 'Trứng ốp la', 'an_sang', 'phần', '🍳', 6000, 12000, 1, 6, 75, 1.2),
  P('cha_lua', 'Chả lụa', 'an_sang', 'lạng', '🍖', 12000, 18000, 3, 7, 80, 1.1),
  // Văn phòng phẩm
  P('but_bi', 'Bút bi', 'van_phong_pham', 'cây', '🖊️', 2500, 4000, 365, 5, 80, 0.8),
  P('vo_hoc_sinh', 'Vở học sinh', 'van_phong_pham', 'cuốn', '📓', 6000, 9000, 365, 6, 80, 0.8),
  P('but_chi', 'Bút chì', 'van_phong_pham', 'cây', '✏️', 2000, 3500, 365, 4, 80, 0.8),
  P('tay', 'Tẩy', 'van_phong_pham', 'cục', '🧽', 2000, 3500, 365, 3, 80, 0.8),
  // Đồ cúng
  P('nhang', 'Nhang', 'do_cung', 'bó', '🕯️', 9000, 14000, 365, 5, 80, 0.7),
  P('nen', 'Nến', 'do_cung', 'cặp', '🕯️', 8000, 13000, 365, 3, 80, 0.7),
  P('giay_tien', 'Giấy tiền', 'do_cung', 'bộ', '🧧', 12000, 18000, 365, 4, 78, 0.7),
  P('hoa_cung', 'Hoa cúng', 'do_cung', 'bó', '💐', 15000, 24000, 2, 5, 78, 1.2),
  // Thú cưng
  P('thuc_an_meo', 'Thức ăn mèo', 'thu_cung', 'gói', '🐱', 18000, 25000, 270, 5, 82, 1.0),
  P('thuc_an_cho', 'Thức ăn chó', 'thu_cung', 'gói', '🐶', 20000, 28000, 270, 5, 82, 1.0),
  P('cat_meo', 'Cát mèo', 'thu_cung', 'bao', '🐾', 35000, 48000, 365, 3, 80, 0.9),
];

/** category tủ mát/tủ đông cần ưu tiên (ảnh hưởng InventorySystem/EquipmentSystem). */
export const freshCategories = ['rau_cu', 'trai_cay', 'trung_sua', 'an_sang'];
export const frozenCategories = ['dong_lanh', 'thit_ca'];
