/** 4 vai trò nhân viên (spec §24-25). */
export const staffRoles = [
  { id: 'cashier', name: 'Thu ngân', icon: '🧾', desc: '+ tốc độ phục vụ, + sức chứa hàng chờ, giảm khách bỏ đi.' },
  { id: 'stocker', name: 'Nhân viên kho', icon: '📦', desc: 'Tự bổ sung hàng bán chạy mỗi sáng, giảm hao hụt.' },
  { id: 'guard', name: 'Bảo vệ', icon: '🛡️', desc: 'Giảm mạnh nguy cơ trộm cắp.' },
  { id: 'shipper', name: 'Shipper', icon: '🛵', desc: 'Cho phép nhận đơn giao hàng (dịch vụ Giao hàng hiệu quả hơn).' },
];
const NAMES = ['Nguyễn Văn An', 'Trần Thị Bích', 'Lê Văn Cường', 'Phạm Thị Dung', 'Hoàng Văn Em', 'Vũ Thị Gấm', 'Đặng Văn Hải', 'Bùi Thị Hiên', 'Ngô Văn Khang', 'Đỗ Thị Lài', 'Phan Văn Minh', 'Lý Thị Nhung'];
const HAIR = ['Tóc ngắn', 'Tóc búi', 'Tóc xoăn', 'Tóc dài thẳng', 'Đầu đinh'];
const OUTFIT = ['Đồng phục xanh', 'Áo sơ mi trắng', 'Áo thun tiệm', 'Tạp dề nâu'];

export function rollCandidate(rng) {
  const role = rng.pick(staffRoles);
  return {
    id: `staff_${Math.random().toString(36).slice(2, 9)}`,
    name: rng.pick(NAMES),
    role: role.id,
    speed: rng.int(40, 95),
    accuracy: rng.int(50, 98),
    mood: rng.int(60, 90),
    skill: rng.int(40, 90),
    salary: rng.int(80000, 220000),
    hair: rng.pick(HAIR),
    outfit: rng.pick(OUTFIT),
  };
}
