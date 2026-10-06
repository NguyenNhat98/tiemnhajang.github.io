import { uid } from './Utils.js';

export const DAY_PHASES = { PREP: 'prep', OPEN: 'open', CLOSING: 'closing', REPORT: 'report' };
export const OPEN_HOUR = 6.5;
export const CLOSE_HOUR = 21.5;
export const START_MONEY = 30_000_000;
export const WIN_ASSETS = 300_000_000;
export const SAVE_VERSION = 1;

export function freshDayStats() {
  return {
    revenue: 0, serviceRevenue: 0, cogs: 0, spoil: 0, theft: 0, incidents: 0,
    salary: 0, rent: 0, utilities: 0, tax: 0, loanInterest: 0, netProfit: 0,
    customersTotal: 0, customersHappy: 0, customersNeutral: 0, customersAngry: 0, productsSoldToday: 0,
  };
}

export function createGameState(storeName, productCatalog) {
  const products = {};
  const prices = {};
  productCatalog.forEach((p) => { products[p.id] = { ...p }; prices[p.id] = { mode: 'market', value: p.referencePrice }; });

  return {
    version: SAVE_VERSION,
    storeName: storeName || 'Tiệm Nhà Tui',
    day: 1,
    time: OPEN_HOUR,
    timeSpeed: 1,
    phase: DAY_PHASES.PREP,

    money: START_MONEY,
    gems: 0,
    reputation: 50,

    inventory: {},       // productId -> batch[] { batchId, productId, quantity, cost, daysLeft, quality, purchasedDay }
    products,              // productId -> định nghĩa sản phẩm (data-driven, copy từ catalog)
    prices,                  // productId -> { mode:'market'|'custom', value }
    market: {},                // productId -> { buyPrice, factors }

    customers: [],               // khách đang trong vòng đời hôm nay (logic, không chứa toạ độ)
    staff: [],
    equipment: {},                  // equipmentId -> { level }
    services: {},                     // serviceId -> true
    ads: [],                            // { id, daysLeft }
    reviews: [],

    weather: null, season: null, holiday: null,
    activeEvent: null,                     // sự kiện sáng đang chờ chọn
    activeDrama: null,                      // tình huống đời thường đang chờ chọn
    eventLog: [],
    pendingDelayed: [],                       // { executeOnDay, type, payload }
    usedEventIds: [],

    quests: [],
    achievements: {},
    story: { flagsShown: [] },
    loan: { principal: 0, interestRate: 0.0015, due: 0 },
    wardrobe: {},
    history: [],
    settings: { sound: true, music: true, vibration: true, freshSaleEnabled: true, rent: 150000, taxRate: 0.02 },

    dayStats: freshDayStats(),
    stats: { totalCustomersServed: 0, totalProductsSold: 0, totalRevenueAllTime: 0, totalRestocked: 0, fiveStarReviews: 0, positiveProfitStreak: 0, noStockoutStreak: 0, loyalCustomerIds: {}, hadViralReview: false, freshBatchesSoldAllTime: 0 },
    consecutiveNegativeDays: 0,
    gameOver: null,

    _uidSeed: uid('run'),
  };
}

/** assets = cash + inventoryValue + equipmentValue + businessValue - outstandingLoan (spec §2). */
export function computeAssets(state, equipmentCatalog) {
  let inventoryValue = 0;
  Object.keys(state.inventory).forEach((pid) => {
    (state.inventory[pid] || []).forEach((b) => { inventoryValue += b.quantity * b.cost; });
  });
  let equipmentValue = 0;
  Object.keys(state.equipment).forEach((id) => {
    const def = equipmentCatalog.find((e) => e.id === id);
    if (def) equipmentValue += def.cost;
  });
  // businessValue: "giá trị thương hiệu" tích lũy theo uy tín, quy mô nhân sự/dịch vụ và thời gian hoạt động —
  // không có công thức chuẩn trong đời thực nên quy ước tuyến tính, dễ kiểm chứng khi cân bằng game.
  const businessValue = state.reputation * 50_000
    + state.staff.length * 200_000
    + Object.keys(state.services).filter((k) => state.services[k]).length * 300_000
    + state.day * 10_000;
  return state.money + inventoryValue + equipmentValue + businessValue - (state.loan?.principal || 0);
}
