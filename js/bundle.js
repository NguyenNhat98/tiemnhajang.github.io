(() => {
  // js/core/EventBus.js
  var EventBus = class {
    constructor() {
      this.handlers = /* @__PURE__ */ new Map();
    }
    on(event, fn) {
      if (!this.handlers.has(event)) this.handlers.set(event, /* @__PURE__ */ new Set());
      this.handlers.get(event).add(fn);
      return () => this.off(event, fn);
    }
    off(event, fn) {
      this.handlers.get(event)?.delete(fn);
    }
    emit(event, payload) {
      this.handlers.get(event)?.forEach((fn) => fn(payload));
      this.handlers.get("*")?.forEach((fn) => fn(event, payload));
    }
  };

  // js/core/RNG.js
  var RNG = class {
    constructor(seed2 = Date.now() % 2147483647) {
      this.seed = seed2 >>> 0 || 1;
    }
    next() {
      let t = this.seed += 1831565813;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
    range(min, max) {
      return min + this.next() * (max - min);
    }
    int(min, max) {
      return Math.floor(this.range(min, max + 1));
    }
    chance(p) {
      return this.next() < p;
    }
    pick(arr) {
      return arr[Math.floor(this.next() * arr.length)];
    }
    weighted(items, weightFn) {
      const total = items.reduce((s, it) => s + Math.max(0, weightFn(it)), 0);
      if (total <= 0) return items[0];
      let r = this.next() * total;
      for (const it of items) {
        r -= Math.max(0, weightFn(it));
        if (r <= 0) return it;
      }
      return items[items.length - 1];
    }
  };

  // js/core/Clock.js
  var Clock = class {
    constructor() {
      this.last = null;
      this.paused = false;
      this.maxDt = 0.25;
    }
    tick(timestampMs) {
      if (this.last === null) {
        this.last = timestampMs;
        return 0;
      }
      let dt = (timestampMs - this.last) / 1e3;
      this.last = timestampMs;
      if (dt < 0) dt = 0;
      if (dt > this.maxDt) dt = this.maxDt;
      return this.paused ? 0 : dt;
    }
    pause() {
      this.paused = true;
    }
    resume() {
      this.paused = false;
      this.last = null;
    }
  };

  // js/core/Sfx.js
  var NOTES = { open: [523, 659, 784], money: [880, 1175], bell: [988], review: [659, 880, 1047], event: [392, 330], upgrade: [523, 659, 784, 1047] };
  var Sfx = class {
    constructor(getSettings) {
      this.getSettings = getSettings;
      this.ctx = null;
    }
    _ensureCtx() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      }
      return this.ctx;
    }
    play(name) {
      const settings = this.getSettings?.() || {};
      if (!settings.sound) return;
      const ctx = this._ensureCtx();
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();
      const freqs = NOTES[name] || [440];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = f;
        const t0 = ctx.currentTime + i * 0.07;
        gain.gain.setValueAtTime(1e-4, t0);
        gain.gain.exponentialRampToValueAtTime(0.12, t0 + 0.02);
        gain.gain.exponentialRampToValueAtTime(1e-4, t0 + 0.18);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.2);
      });
    }
  };

  // js/core/Utils.js
  function uid(prefix = "id") {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function formatMoney(n) {
    const sign = n < 0 ? "-" : "";
    return `${sign}${Math.round(Math.abs(n)).toLocaleString("vi-VN")}\u0111`;
  }
  function formatTimeFloat(hours) {
    const h = Math.floor(hours) % 24;
    const m = Math.floor((hours - Math.floor(hours)) * 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  function distance(ax, ay, bx, by) {
    return Math.hypot(bx - ax, by - ay);
  }

  // js/core/GameState.js
  var DAY_PHASES = { PREP: "prep", OPEN: "open", CLOSING: "closing", REPORT: "report" };
  var OPEN_HOUR = 6.5;
  var CLOSE_HOUR = 21.5;
  var START_MONEY = 3e7;
  var WIN_ASSETS = 3e8;
  var SAVE_VERSION = 1;
  function freshDayStats() {
    return {
      revenue: 0,
      serviceRevenue: 0,
      cogs: 0,
      spoil: 0,
      theft: 0,
      incidents: 0,
      salary: 0,
      rent: 0,
      utilities: 0,
      tax: 0,
      loanInterest: 0,
      netProfit: 0,
      customersTotal: 0,
      customersHappy: 0,
      customersNeutral: 0,
      customersAngry: 0,
      productsSoldToday: 0
    };
  }
  function createGameState(storeName, productCatalog) {
    const products2 = {};
    const prices = {};
    productCatalog.forEach((p) => {
      products2[p.id] = { ...p };
      prices[p.id] = { mode: "market", value: p.referencePrice };
    });
    return {
      version: SAVE_VERSION,
      storeName: storeName || "Ti\u1EC7m Nh\xE0 Tui",
      day: 1,
      time: OPEN_HOUR,
      timeSpeed: 1,
      phase: DAY_PHASES.PREP,
      money: START_MONEY,
      gems: 0,
      reputation: 50,
      inventory: {},
      // productId -> batch[] { batchId, productId, quantity, cost, daysLeft, quality, purchasedDay }
      products: products2,
      // productId -> định nghĩa sản phẩm (data-driven, copy từ catalog)
      prices,
      // productId -> { mode:'market'|'custom', value }
      market: {},
      // productId -> { buyPrice, factors }
      customers: [],
      // khách đang trong vòng đời hôm nay (logic, không chứa toạ độ)
      staff: [],
      equipment: {},
      // equipmentId -> { level }
      services: {},
      // serviceId -> true
      ads: [],
      // { id, daysLeft }
      reviews: [],
      weather: null,
      season: null,
      holiday: null,
      activeEvent: null,
      // sự kiện sáng đang chờ chọn
      activeDrama: null,
      // tình huống đời thường đang chờ chọn
      eventLog: [],
      pendingDelayed: [],
      // { executeOnDay, type, payload }
      usedEventIds: [],
      quests: [],
      achievements: {},
      story: { flagsShown: [] },
      loan: { principal: 0, interestRate: 15e-4, due: 0 },
      wardrobe: {},
      history: [],
      settings: { sound: true, music: true, vibration: true, freshSaleEnabled: true, rent: 15e4, taxRate: 0.02 },
      dayStats: freshDayStats(),
      stats: { totalCustomersServed: 0, totalProductsSold: 0, totalRevenueAllTime: 0, totalRestocked: 0, fiveStarReviews: 0, positiveProfitStreak: 0, noStockoutStreak: 0, loyalCustomerIds: {}, hadViralReview: false, freshBatchesSoldAllTime: 0 },
      consecutiveNegativeDays: 0,
      gameOver: null,
      _uidSeed: uid("run")
    };
  }
  function computeAssets(state, equipmentCatalog) {
    let inventoryValue = 0;
    Object.keys(state.inventory).forEach((pid) => {
      (state.inventory[pid] || []).forEach((b) => {
        inventoryValue += b.quantity * b.cost;
      });
    });
    let equipmentValue = 0;
    Object.keys(state.equipment).forEach((id) => {
      const def = equipmentCatalog.find((e) => e.id === id);
      if (def) equipmentValue += def.cost;
    });
    const businessValue = state.reputation * 5e4 + state.staff.length * 2e5 + Object.keys(state.services).filter((k) => state.services[k]).length * 3e5 + state.day * 1e4;
    return state.money + inventoryValue + equipmentValue + businessValue - (state.loan?.principal || 0);
  }

  // js/systems/TimeSystem.js
  var GAME_MINUTES_PER_REAL_SECOND = 1.5;
  var TimeSystem = {
    update(state, dtSeconds) {
      const gameMinutes = dtSeconds * GAME_MINUTES_PER_REAL_SECOND * state.timeSpeed;
      state.time += gameMinutes / 60;
      if (state.time > CLOSE_HOUR) state.time = CLOSE_HOUR;
    },
    isClosingTime(state) {
      return state.time >= CLOSE_HOUR;
    }
  };

  // js/data/products.js
  var P = (id, name, category, unit, icon, cost, referencePrice, shelfLife, demand, quality, priceElasticity) => ({ id, name, category, unit, icon, cost, referencePrice, shelfLife, demand, quality, priceElasticity });
  var categories = [
    { id: "rau_cu", name: "Rau c\u1EE7", icon: "\u{1F96C}" },
    { id: "trai_cay", name: "Tr\xE1i c\xE2y", icon: "\u{1F34A}" },
    { id: "thit_ca", name: "Th\u1ECBt c\xE1", icon: "\u{1F969}" },
    { id: "trung_sua", name: "Tr\u1EE9ng s\u1EEFa", icon: "\u{1F95B}" },
    { id: "mi_gao", name: "M\xEC/G\u1EA1o", icon: "\u{1F35A}" },
    { id: "gia_vi", name: "Gia v\u1ECB", icon: "\u{1F9C2}" },
    { id: "banh_keo", name: "B\xE1nh k\u1EB9o", icon: "\u{1F36C}" },
    { id: "nuoc_uong", name: "N\u01B0\u1EDBc u\u1ED1ng", icon: "\u{1F964}" },
    { id: "dong_lanh", name: "\u0110\xF4ng l\u1EA1nh", icon: "\u{1F9CA}" },
    { id: "hoa_pham", name: "H\xF3a ph\u1EA9m", icon: "\u{1F9F4}" },
    { id: "cham_soc_ca_nhan", name: "Ch\u0103m s\xF3c c\xE1 nh\xE2n", icon: "\u{1F9FC}" },
    { id: "an_sang", name: "\u0110\u1ED3 \u0103n s\xE1ng", icon: "\u{1F950}" },
    { id: "van_phong_pham", name: "V\u0103n ph\xF2ng ph\u1EA9m", icon: "\u270F\uFE0F" },
    { id: "do_cung", name: "\u0110\u1ED3 c\xFAng", icon: "\u{1F56F}\uFE0F" },
    { id: "thu_cung", name: "Th\xFA c\u01B0ng", icon: "\u{1F43E}" }
  ];
  var products = [
    // Rau củ
    P("rau_muong", "Rau mu\u1ED1ng", "rau_cu", "b\xF3", "\u{1F96C}", 5e3, 8e3, 2, 14, 80, 1.4),
    P("cai_xanh", "C\u1EA3i xanh", "rau_cu", "b\xF3", "\u{1F96C}", 6e3, 9e3, 2, 10, 80, 1.3),
    P("cai_thao", "C\u1EA3i th\u1EA3o", "rau_cu", "kg", "\u{1F96C}", 9e3, 14e3, 3, 8, 80, 1.2),
    P("ca_chua", "C\xE0 chua", "rau_cu", "kg", "\u{1F345}", 12e3, 18e3, 4, 15, 82, 1.2),
    P("khoai_tay", "Khoai t\xE2y", "rau_cu", "kg", "\u{1F954}", 15e3, 22e3, 10, 12, 85, 1),
    P("hanh_tay", "H\xE0nh t\xE2y", "rau_cu", "kg", "\u{1F9C5}", 1e4, 16e3, 14, 8, 85, 0.9),
    P("toi", "T\u1ECFi", "rau_cu", "kg", "\u{1F9C4}", 25e3, 38e3, 30, 6, 85, 0.6),
    P("ot", "\u1EDAt", "rau_cu", "kg", "\u{1F336}\uFE0F", 2e4, 32e3, 7, 5, 82, 0.8),
    P("dau_que", "\u0110\u1EADu que", "rau_cu", "kg", "\u{1FADB}", 14e3, 2e4, 3, 6, 80, 1.1),
    P("bi_do", "B\xED \u0111\u1ECF", "rau_cu", "kg", "\u{1F383}", 8e3, 13e3, 10, 5, 82, 0.9),
    // Trái cây
    P("chuoi", "Chu\u1ED1i", "trai_cay", "n\u1EA3i", "\u{1F34C}", 15e3, 22e3, 4, 13, 80, 1.1),
    P("cam", "Cam", "trai_cay", "kg", "\u{1F34A}", 2e4, 3e4, 7, 14, 82, 1),
    P("tao", "T\xE1o", "trai_cay", "kg", "\u{1F34E}", 35e3, 5e4, 12, 10, 85, 0.9),
    P("dua_hau", "D\u01B0a h\u1EA5u", "trai_cay", "kg", "\u{1F349}", 1e4, 16e3, 6, 11, 80, 1.1),
    P("xoai", "Xo\xE0i", "trai_cay", "kg", "\u{1F96D}", 25e3, 38e3, 5, 12, 80, 1.1),
    P("oi", "\u1ED4i", "trai_cay", "kg", "\u{1F348}", 12e3, 18e3, 5, 7, 78, 1),
    P("thanh_long", "Thanh long", "trai_cay", "kg", "\u{1F409}", 18e3, 27e3, 8, 8, 80, 1),
    P("mit", "M\xEDt", "trai_cay", "kg", "\u{1F7E1}", 22e3, 32e3, 4, 6, 78, 1.1),
    P("le", "L\xEA", "trai_cay", "kg", "\u{1F350}", 3e4, 44e3, 10, 7, 83, 0.9),
    P("quyt", "Qu\xFDt", "trai_cay", "kg", "\u{1F34A}", 22e3, 33e3, 7, 8, 80, 1),
    // Thịt cá
    P("thit_heo", "Th\u1ECBt heo", "thit_ca", "kg", "\u{1F969}", 11e4, 14e4, 2, 17, 85, 1.3),
    P("thit_bo", "Th\u1ECBt b\xF2", "thit_ca", "kg", "\u{1F969}", 22e4, 28e4, 2, 9, 85, 1.4),
    P("thit_ga", "Th\u1ECBt g\xE0", "thit_ca", "kg", "\u{1F357}", 7e4, 95e3, 2, 13, 83, 1.2),
    P("ca_ro", "C\xE1 r\xF4", "thit_ca", "kg", "\u{1F41F}", 55e3, 72e3, 1, 6, 76, 1.3),
    P("ca_thu", "C\xE1 thu", "thit_ca", "kg", "\u{1F41F}", 9e4, 115e3, 1, 6, 78, 1.3),
    P("ca_basa", "C\xE1 basa", "thit_ca", "kg", "\u{1F41F}", 45e3, 6e4, 1, 9, 78, 1.3),
    P("tom", "T\xF4m", "thit_ca", "kg", "\u{1F990}", 15e4, 19e4, 1, 8, 78, 1.4),
    P("muc", "M\u1EF1c", "thit_ca", "kg", "\u{1F991}", 13e4, 17e4, 1, 6, 78, 1.4),
    // Trứng sữa
    P("trung_ga", "Tr\u1EE9ng g\xE0", "trung_sua", "ch\u1EE5c", "\u{1F95A}", 28e3, 35e3, 14, 15, 88, 0.9),
    P("trung_vit", "Tr\u1EE9ng v\u1ECBt", "trung_sua", "ch\u1EE5c", "\u{1F95A}", 32e3, 4e4, 14, 7, 86, 0.9),
    P("sua_tuoi", "S\u1EEFa t\u01B0\u01A1i", "trung_sua", "h\u1ED9p", "\u{1F95B}", 28e3, 34e3, 10, 14, 90, 0.8),
    P("sua_chua", "S\u1EEFa chua", "trung_sua", "h\u1ED9p", "\u{1F366}", 2e4, 26e3, 14, 10, 88, 0.9),
    P("pho_mai", "Ph\xF4 mai", "trung_sua", "h\u1ED9p", "\u{1F9C0}", 32e3, 42e3, 30, 7, 85, 1),
    // Mì/gạo
    P("gao_st25", "G\u1EA1o ST25", "mi_gao", "kg", "\u{1F35A}", 22e3, 28e3, 90, 16, 90, 0.7),
    P("gao_thom", "G\u1EA1o th\u01A1m", "mi_gao", "kg", "\u{1F35A}", 18e3, 23e3, 90, 12, 85, 0.7),
    P("mi_tom", "M\xEC t\xF4m", "mi_gao", "g\xF3i", "\u{1F35C}", 3500, 4500, 150, 18, 75, 0.8),
    P("mi_bo_ham", "M\xEC b\xF2 h\u1EA7m", "mi_gao", "g\xF3i", "\u{1F35C}", 5e3, 7e3, 150, 10, 78, 0.9),
    P("mi_chua_cay", "M\xEC chua cay", "mi_gao", "g\xF3i", "\u{1F35C}", 5e3, 7e3, 150, 10, 78, 0.9),
    P("bun_kho", "B\xFAn kh\xF4", "mi_gao", "g\xF3i", "\u{1F35C}", 1e4, 14e3, 120, 7, 78, 0.9),
    P("pho_kho", "Ph\u1EDF kh\xF4", "mi_gao", "g\xF3i", "\u{1F35C}", 12e3, 17e3, 120, 7, 78, 0.9),
    // Gia vị
    P("nuoc_mam", "N\u01B0\u1EDBc m\u1EAFm", "gia_vi", "chai", "\u{1F9F4}", 25e3, 32e3, 365, 10, 85, 0.6),
    P("nuoc_tuong", "N\u01B0\u1EDBc t\u01B0\u01A1ng", "gia_vi", "chai", "\u{1F9F4}", 15e3, 2e4, 365, 7, 82, 0.6),
    P("dau_an", "D\u1EA7u \u0103n", "gia_vi", "chai", "\u{1FAD7}", 32e3, 42e3, 270, 10, 85, 0.6),
    P("duong", "\u0110\u01B0\u1EDDng", "gia_vi", "kg", "\u{1F9C2}", 18e3, 24e3, 365, 7, 85, 0.6),
    P("muoi", "Mu\u1ED1i", "gia_vi", "g\xF3i", "\u{1F9C2}", 4e3, 6e3, 365, 6, 80, 0.5),
    P("tieu", "Ti\xEAu", "gia_vi", "g\xF3i", "\u{1F9C2}", 2e4, 28e3, 365, 4, 82, 0.5),
    P("bot_ngot", "B\u1ED9t ng\u1ECDt", "gia_vi", "g\xF3i", "\u{1F9C2}", 9e3, 13e3, 365, 8, 80, 0.6),
    // Bánh kẹo
    P("banh_quy", "B\xE1nh quy", "banh_keo", "g\xF3i", "\u{1F36A}", 1e4, 14e3, 120, 7, 80, 1.1),
    P("banh_oreos", "B\xE1nh chocolate", "banh_keo", "g\xF3i", "\u{1F36B}", 14e3, 19e3, 120, 8, 85, 1.1),
    P("keo_mut", "K\u1EB9o m\xFAt", "banh_keo", "g\xF3i", "\u{1F36D}", 8e3, 12e3, 150, 6, 80, 1.1),
    P("snack", "Snack", "banh_keo", "g\xF3i", "\u{1F35F}", 6e3, 9e3, 90, 9, 78, 1.2),
    P("banh_xop", "B\xE1nh x\u1ED1p", "banh_keo", "g\xF3i", "\u{1F9C7}", 11e3, 15e3, 100, 6, 82, 1.1),
    // Nước uống
    P("nuoc_loc", "N\u01B0\u1EDBc l\u1ECDc", "nuoc_uong", "chai", "\u{1F964}", 3500, 5e3, 180, 12, 95, 1.2),
    P("nuoc_ngot", "N\u01B0\u1EDBc ng\u1ECDt", "nuoc_uong", "chai", "\u{1F964}", 8e3, 12e3, 180, 13, 85, 1),
    P("nuoc_tang_luc", "N\u01B0\u1EDBc t\u0103ng l\u1EF1c", "nuoc_uong", "lon", "\u{1F96B}", 9e3, 13e3, 200, 7, 82, 1),
    P("tra_xanh", "Tr\xE0 xanh", "nuoc_uong", "chai", "\u{1F375}", 7e3, 11e3, 180, 9, 82, 1),
    P("nuoc_dua", "N\u01B0\u1EDBc d\u1EEBa", "nuoc_uong", "h\u1ED9p", "\u{1F965}", 1e4, 15e3, 120, 6, 82, 1.1),
    // Đông lạnh
    P("xuc_xich", "X\xFAc x\xEDch", "dong_lanh", "g\xF3i", "\u{1F32D}", 24e3, 32e3, 45, 8, 78, 1.1),
    P("ca_vien", "C\xE1 vi\xEAn", "dong_lanh", "g\xF3i", "\u{1F41F}", 26e3, 35e3, 45, 7, 78, 1.1),
    P("bo_vien", "B\xF2 vi\xEAn", "dong_lanh", "g\xF3i", "\u{1F969}", 3e4, 4e4, 45, 6, 78, 1.1),
    P("kem", "Kem", "dong_lanh", "c\xE2y", "\u{1F366}", 5e3, 8e3, 60, 10, 80, 1.3),
    // Hóa phẩm
    P("nuoc_rua_chen", "N\u01B0\u1EDBc r\u1EEDa ch\xE9n", "hoa_pham", "chai", "\u{1F9F4}", 22e3, 3e4, 365, 6, 85, 0.9),
    P("bot_giat", "B\u1ED9t gi\u1EB7t", "hoa_pham", "g\xF3i", "\u{1F9FA}", 45e3, 58e3, 365, 6, 85, 0.9),
    P("nuoc_lau_san", "N\u01B0\u1EDBc lau s\xE0n", "hoa_pham", "chai", "\u{1F9F4}", 2e4, 27e3, 365, 4, 80, 0.9),
    P("giay_ve_sinh", "Gi\u1EA5y v\u1EC7 sinh", "hoa_pham", "l\u1ED1c", "\u{1F9FB}", 28e3, 38e3, 365, 8, 82, 0.8),
    P("tui_rac", "T\xFAi r\xE1c", "hoa_pham", "cu\u1ED9n", "\u{1F5D1}\uFE0F", 1e4, 15e3, 365, 5, 80, 0.8),
    // Chăm sóc cá nhân
    P("dau_goi", "D\u1EA7u g\u1ED9i", "cham_soc_ca_nhan", "chai", "\u{1F9F4}", 48e3, 62e3, 365, 5, 85, 1),
    P("kem_danh_rang", "Kem \u0111\xE1nh r\u0103ng", "cham_soc_ca_nhan", "tu\xFDp", "\u{1FAA5}", 14e3, 19e3, 365, 6, 85, 0.9),
    P("ban_chai", "B\xE0n ch\u1EA3i", "cham_soc_ca_nhan", "c\xE1i", "\u{1FAA5}", 6e3, 1e4, 365, 4, 80, 0.9),
    P("xa_phong", "X\xE0 ph\xF2ng", "cham_soc_ca_nhan", "c\u1EE5c", "\u{1F9FC}", 7e3, 11e3, 365, 5, 80, 0.9),
    P("khan_giay", "Kh\u0103n gi\u1EA5y", "cham_soc_ca_nhan", "h\u1ED9p", "\u{1F9FB}", 9e3, 13e3, 365, 6, 80, 0.9),
    // Đồ ăn sáng
    P("banh_mi", "B\xE1nh m\xEC", "an_sang", "\u1ED5", "\u{1F956}", 5e3, 12e3, 1, 15, 75, 1.3),
    P("xoi", "X\xF4i", "an_sang", "g\xF3i", "\u{1F359}", 8e3, 15e3, 1, 10, 75, 1.2),
    P("trung_op_la", "Tr\u1EE9ng \u1ED1p la", "an_sang", "ph\u1EA7n", "\u{1F373}", 6e3, 12e3, 1, 6, 75, 1.2),
    P("cha_lua", "Ch\u1EA3 l\u1EE5a", "an_sang", "l\u1EA1ng", "\u{1F356}", 12e3, 18e3, 3, 7, 80, 1.1),
    // Văn phòng phẩm
    P("but_bi", "B\xFAt bi", "van_phong_pham", "c\xE2y", "\u{1F58A}\uFE0F", 2500, 4e3, 365, 5, 80, 0.8),
    P("vo_hoc_sinh", "V\u1EDF h\u1ECDc sinh", "van_phong_pham", "cu\u1ED1n", "\u{1F4D3}", 6e3, 9e3, 365, 6, 80, 0.8),
    P("but_chi", "B\xFAt ch\xEC", "van_phong_pham", "c\xE2y", "\u270F\uFE0F", 2e3, 3500, 365, 4, 80, 0.8),
    P("tay", "T\u1EA9y", "van_phong_pham", "c\u1EE5c", "\u{1F9FD}", 2e3, 3500, 365, 3, 80, 0.8),
    // Đồ cúng
    P("nhang", "Nhang", "do_cung", "b\xF3", "\u{1F56F}\uFE0F", 9e3, 14e3, 365, 5, 80, 0.7),
    P("nen", "N\u1EBFn", "do_cung", "c\u1EB7p", "\u{1F56F}\uFE0F", 8e3, 13e3, 365, 3, 80, 0.7),
    P("giay_tien", "Gi\u1EA5y ti\u1EC1n", "do_cung", "b\u1ED9", "\u{1F9E7}", 12e3, 18e3, 365, 4, 78, 0.7),
    P("hoa_cung", "Hoa c\xFAng", "do_cung", "b\xF3", "\u{1F490}", 15e3, 24e3, 2, 5, 78, 1.2),
    // Thú cưng
    P("thuc_an_meo", "Th\u1EE9c \u0103n m\xE8o", "thu_cung", "g\xF3i", "\u{1F431}", 18e3, 25e3, 270, 5, 82, 1),
    P("thuc_an_cho", "Th\u1EE9c \u0103n ch\xF3", "thu_cung", "g\xF3i", "\u{1F436}", 2e4, 28e3, 270, 5, 82, 1),
    P("cat_meo", "C\xE1t m\xE8o", "thu_cung", "bao", "\u{1F43E}", 35e3, 48e3, 365, 3, 80, 0.9)
  ];
  var freshCategories = ["rau_cu", "trai_cay", "trung_sua", "an_sang"];
  var frozenCategories = ["dong_lanh", "thit_ca"];

  // js/systems/MarketSystem.js
  var WEATHERS = [
    { id: "nang_dep", label: "N\u1EAFng \u0111\u1EB9p", icon: "\u2600\uFE0F", weight: 5, trafficMult: 1 },
    { id: "nang_nong", label: "N\u1EAFng n\xF3ng", icon: "\u{1F525}", weight: 2, trafficMult: 0.95 },
    { id: "mua_nho", label: "M\u01B0a nh\u1ECF", icon: "\u{1F326}\uFE0F", weight: 2, trafficMult: 0.85 },
    { id: "mua_lon", label: "M\u01B0a l\u1EDBn", icon: "\u{1F327}\uFE0F", weight: 1, trafficMult: 0.6 },
    { id: "mat_me", label: "M\xE1t m\u1EBB", icon: "\u26C5", weight: 3, trafficMult: 1.05 }
  ];
  var SEASONS = [
    { id: "xuan", label: "M\xF9a Xu\xE2n", trafficMult: 1.1 },
    { id: "ha", label: "M\xF9a H\u1EA1", trafficMult: 1 },
    { id: "thu", label: "M\xF9a Thu", trafficMult: 1 },
    { id: "dong", label: "M\xF9a \u0110\xF4ng", trafficMult: 0.95 }
  ];
  function weatherCategoryCostMult(weatherId, category) {
    if (weatherId === "mua_lon" && category === "rau_cu") return 1.15;
    if (weatherId === "nang_nong" && (category === "rau_cu" || category === "trai_cay")) return 1.08;
    return 1;
  }
  function weatherCategoryDemandMult(weatherId, category) {
    if (weatherId === "nang_nong" && (category === "nuoc_uong" || category === "dong_lanh")) return 1.35;
    if (weatherId === "mua_lon" && category === "nuoc_uong") return 0.8;
    if (weatherId === "mua_lon" && category === "mi_gao") return 1.15;
    return 1;
  }
  var MarketSystem = {
    rollWeather(state, rng) {
      state.weather = rng.weighted(WEATHERS, (w) => w.weight);
      state.season = SEASONS[Math.floor((state.day - 1) / 20) % SEASONS.length];
    },
    /** Đầu mỗi ngày: marketPrice = referencePrice * randomFactor * weatherFactor * eventFactor * seasonFactor * supplyFactor (spec §15). */
    rollDailyMarket(state, rng) {
      const ev = state.todayEventEffects || {};
      products.forEach((p) => {
        let costMult = rng.range(0.9, 1.1);
        costMult *= weatherCategoryCostMult(state.weather?.id, p.category);
        if (ev.costMultiplier?.productId === p.id) costMult *= ev.costMultiplier.mult;
        if (ev.buyDiscount) costMult *= 1 - ev.buyDiscount;
        state.market[p.id] = { buyPrice: Math.max(1, Math.round(p.cost * costMult)) };
      });
    },
    weatherCategoryDemandMult
  };

  // js/data/customers.js
  var archetypes = [
    { id: "ba_hang_xom", ageGroup: "Trung ni\xEAn", personality: "B\xE0 h\xE0ng x\xF3m", minMoney: 5e4, maxMoney: 2e5, patience: 70, priceSensitivity: 0.5, loyalty: 70, shoppingPattern: "small" },
    { id: "sinh_vien", ageGroup: "Tr\u1EBB", personality: "Sinh vi\xEAn", minMoney: 2e4, maxMoney: 8e4, patience: 45, priceSensitivity: 0.8, loyalty: 40, shoppingPattern: "small" },
    { id: "cong_nhan", ageGroup: "Trung ni\xEAn", personality: "C\xF4ng nh\xE2n", minMoney: 5e4, maxMoney: 15e4, patience: 40, priceSensitivity: 0.7, loyalty: 50, shoppingPattern: "small" },
    { id: "dan_van_phong", ageGroup: "Tr\u1EBB-trung ni\xEAn", personality: "D\xE2n v\u0103n ph\xF2ng", minMoney: 8e4, maxMoney: 3e5, patience: 50, priceSensitivity: 0.4, loyalty: 50, shoppingPattern: "specific" },
    { id: "tre_con", ageGroup: "Thi\u1EBFu nhi", personality: "Tr\u1EBB con", minMoney: 1e4, maxMoney: 3e4, patience: 30, priceSensitivity: 0.2, loyalty: 30, shoppingPattern: "impulse" },
    { id: "me_co_con_nho", ageGroup: "Trung ni\xEAn", personality: "M\u1EB9 c\xF3 con nh\u1ECF", minMoney: 1e5, maxMoney: 35e4, patience: 60, priceSensitivity: 0.5, loyalty: 60, shoppingPattern: "bulk" },
    { id: "chu_xe_om", ageGroup: "Trung ni\xEAn", personality: "Ch\xFA xe \xF4m", minMoney: 2e4, maxMoney: 6e4, patience: 55, priceSensitivity: 0.6, loyalty: 60, shoppingPattern: "small" },
    { id: "khach_quen", ageGroup: "\u0110a d\u1EA1ng", personality: "Kh\xE1ch quen", minMoney: 5e4, maxMoney: 25e4, patience: 80, priceSensitivity: 0.3, loyalty: 90, shoppingPattern: "specific" },
    { id: "khach_voi", ageGroup: "\u0110a d\u1EA1ng", personality: "Kh\xE1ch v\u1ED9i", minMoney: 3e4, maxMoney: 12e4, patience: 20, priceSensitivity: 0.5, loyalty: 30, shoppingPattern: "small" },
    { id: "khach_kho_tinh", ageGroup: "\u0110a d\u1EA1ng", personality: "Kh\xE1ch kh\xF3 t\xEDnh", minMoney: 5e4, maxMoney: 2e5, patience: 35, priceSensitivity: 0.7, loyalty: 30, shoppingPattern: "specific" },
    { id: "khach_ngheo", ageGroup: "\u0110a d\u1EA1ng", personality: "Kh\xE1ch ngh\xE8o", minMoney: 1e4, maxMoney: 5e4, patience: 60, priceSensitivity: 0.9, loyalty: 60, shoppingPattern: "small" },
    { id: "khach_giau", ageGroup: "\u0110a d\u1EA1ng", personality: "Kh\xE1ch gi\xE0u", minMoney: 3e5, maxMoney: 1e6, patience: 65, priceSensitivity: 0.1, loyalty: 40, shoppingPattern: "bulk" },
    { id: "food_reviewer", ageGroup: "Tr\u1EBB", personality: "Food reviewer", minMoney: 5e4, maxMoney: 15e4, patience: 50, priceSensitivity: 0.4, loyalty: 20, shoppingPattern: "specific", reviewBoost: 2.5 },
    { id: "vip", ageGroup: "\u0110a d\u1EA1ng", personality: "VIP", minMoney: 5e5, maxMoney: 2e6, patience: 35, priceSensitivity: 0.1, loyalty: 80, shoppingPattern: "bulk", rewardBoost: 1.5 }
  ];
  var FIRST = ["Lan", "H\xF9ng", "Minh", "Hoa", "Tu\u1EA5n", "Trang", "D\u0169ng", "Nga", "Ph\xFAc", "Mai", "T\xE2m", "Khoa", "Linh", "S\u01A1n", "Th\u1EA3o", "Huy", "Y\u1EBFn", "Qu\xE2n", "Vy", "\u0110\u1EE9c", "S\xE1u", "B\u1EA3y", "Thu", "Hi\u1EC1n"];
  var TITLE = ["Ch\u1ECB", "Anh", "C\xF4", "Ch\xFA", "B\xE1c", "Em", "Th\xEDm", "D\xEC", "B\xE0"];
  function generateVietnameseName(rng) {
    const title = rng ? rng.pick(TITLE) : TITLE[Math.floor(Math.random() * TITLE.length)];
    const first = rng ? rng.pick(FIRST) : FIRST[Math.floor(Math.random() * FIRST.length)];
    return `${title} ${first}`;
  }

  // js/systems/ReputationSystem.js
  var ReputationSystem = {
    update(state, delta) {
      state.reputation = Math.max(0, Math.min(100, state.reputation + delta));
    },
    customerMultiplier(state) {
      return 0.7 + state.reputation / 100;
    }
  };

  // js/data/equipment.js
  var equipment = [
    { id: "giay_phep", name: "Gi\u1EA5y ph\xE9p kinh doanh", icon: "\u{1F4DC}", cost: 2e6, dailyCost: 0, effect: "B\u1EAFt bu\u1ED9c \u0111\u1EC3 qua c\xE1c \u0111\u1EE3t ki\u1EC3m tra.", tags: { inspectionRequired: true } },
    { id: "binh_chua_chay", name: "B\xECnh ch\u1EEFa ch\xE1y", icon: "\u{1F9EF}", cost: 5e5, dailyCost: 0, effect: "B\u1EAFt bu\u1ED9c \u0111\u1EC3 qua c\xE1c \u0111\u1EE3t ki\u1EC3m tra.", tags: { inspectionRequired: true } },
    { id: "pos", name: "Qu\u1EA7y POS", icon: "\u{1F4B3}", cost: 4e6, dailyCost: 2e4, effect: "+ t\u1ED1c \u0111\u1ED9 thanh to\xE1n, m\u1EDF kh\xF3a self-service.", tags: { checkoutSpeedMult: 1.25, serviceQuality: 5 } },
    { id: "tu_mat", name: "T\u1EE7 m\xE1t", icon: "\u{1F9CA}", cost: 8e6, dailyCost: 3e4, effect: "+ h\u1EA1n s\u1EED d\u1EE5ng & capacity nh\xF3m h\xE0ng t\u01B0\u01A1i.", tags: { freshShelfLifeMult: 1.5, capacityBonus: 40 } },
    { id: "tu_dong", name: "T\u1EE7 \u0111\xF4ng", icon: "\u2744\uFE0F", cost: 1e7, dailyCost: 4e4, effect: "+ h\u1EA1n s\u1EED d\u1EE5ng nh\xF3m \u0111\xF4ng l\u1EA1nh/th\u1ECBt c\xE1.", tags: { frozenShelfLifeMult: 2, capacityBonus: 40 } },
    { id: "ke_hang", name: "K\u1EC7 h\xE0ng", icon: "\u{1F5C4}\uFE0F", cost: 25e5, dailyCost: 0, effect: "+ s\u1EE9c ch\u1EE9a kho.", tags: { capacityBonus: 60 } },
    { id: "may_lanh", name: "M\xE1y l\u1EA1nh", icon: "\u2744\uFE0F", cost: 12e6, dailyCost: 5e4, effect: "+ t\xE2m tr\u1EA1ng kh\xE1ch, + ch\u1EA5t l\u01B0\u1EE3ng c\u1EA3m nh\u1EADn s\u1EA3n ph\u1EA9m.", tags: { customerMoodBonus: 10, qualityPerceptionBonus: 5 } },
    { id: "wifi", name: "Wi-Fi mi\u1EC5n ph\xED", icon: "\u{1F4F6}", cost: 15e5, dailyCost: 1e4, effect: "+ ki\xEAn nh\u1EABn kh\xE1ch khi ch\u1EDD.", tags: { patienceMult: 1.1 } },
    { id: "led", name: "\u0110\xE8n LED", icon: "\u{1F4A1}", cost: 3e6, dailyCost: 15e3, effect: "+ kh\xE1ch bu\u1ED5i t\u1ED1i.", tags: { eveningCustomerMult: 1.2 } },
    { id: "camera", name: "Camera an ninh", icon: "\u{1F4F7}", cost: 5e6, dailyCost: 1e4, effect: "- nguy c\u01A1 tr\u1ED9m c\u1EAFp m\u1EA1nh.", tags: { theftReduction: 0.6 } },
    { id: "alarm", name: "Chu\xF4ng b\xE1o \u0111\u1ED9ng", icon: "\u{1F514}", cost: 2e6, dailyCost: 5e3, effect: "- nguy c\u01A1 tr\u1ED9m c\u1EAFp (c\u1ED9ng d\u1ED3n).", tags: { theftReduction: 0.2 } },
    { id: "may_phat_dien", name: "M\xE1y ph\xE1t \u0111i\u1EC7n", icon: "\u{1F50B}", cost: 15e6, dailyCost: 2e4, effect: "Gi\u1EA3m thi\u1EC7t h\u1EA1i khi m\u1EA5t \u0111i\u1EC7n.", tags: { blackoutProtected: true } }
  ];

  // js/systems/EquipmentSystem.js
  var EquipmentSystem = {
    catalog: equipment,
    buy(state, id) {
      const def = equipment.find((e) => e.id === id);
      if (!def) return { ok: false, message: "Thi\u1EBFt b\u1ECB kh\xF4ng t\u1ED3n t\u1EA1i" };
      if (state.equipment[id]) return { ok: false, message: "\u0110\xE3 s\u1EDF h\u1EEFu thi\u1EBFt b\u1ECB n\xE0y" };
      if (state.money < def.cost) return { ok: false, message: "Kh\xF4ng \u0111\u1EE7 ti\u1EC1n" };
      state.money -= def.cost;
      state.equipment[id] = { level: 1 };
      return { ok: true };
    },
    dailyUpkeep(state) {
      return Object.keys(state.equipment).reduce((sum, id) => {
        const def = equipment.find((e) => e.id === id);
        return sum + (def ? def.dailyCost : 0);
      }, 0);
    },
    /** Gộp mọi hiệu ứng thiết bị đang sở hữu thành một bộ số nhân/bonus dùng chung toàn hệ thống. */
    aggregate(state) {
      const eff = {
        checkoutSpeedMult: 1,
        freshShelfLifeMult: 1,
        frozenShelfLifeMult: 1,
        capacityBonus: 0,
        customerMoodBonus: 0,
        qualityPerceptionBonus: 0,
        patienceMult: 1,
        eveningCustomerMult: 1,
        theftReduction: 0,
        blackoutProtected: false,
        serviceQuality: 0,
        inspectionReady: {},
        ownedIds: Object.keys(state.equipment)
      };
      eff.ownedIds.forEach((id) => {
        const def = equipment.find((e) => e.id === id);
        if (!def) return;
        const t = def.tags || {};
        if (t.checkoutSpeedMult) eff.checkoutSpeedMult *= t.checkoutSpeedMult;
        if (t.freshShelfLifeMult) eff.freshShelfLifeMult = Math.max(eff.freshShelfLifeMult, t.freshShelfLifeMult);
        if (t.frozenShelfLifeMult) eff.frozenShelfLifeMult = Math.max(eff.frozenShelfLifeMult, t.frozenShelfLifeMult);
        if (t.capacityBonus) eff.capacityBonus += t.capacityBonus;
        if (t.customerMoodBonus) eff.customerMoodBonus += t.customerMoodBonus;
        if (t.qualityPerceptionBonus) eff.qualityPerceptionBonus += t.qualityPerceptionBonus;
        if (t.patienceMult) eff.patienceMult *= t.patienceMult;
        if (t.eveningCustomerMult) eff.eveningCustomerMult *= t.eveningCustomerMult;
        if (t.theftReduction) eff.theftReduction = Math.min(0.95, eff.theftReduction + t.theftReduction);
        if (t.blackoutProtected) eff.blackoutProtected = true;
        if (t.serviceQuality) eff.serviceQuality += t.serviceQuality;
        if (t.inspectionRequired) eff.inspectionReady[id] = true;
      });
      return eff;
    },
    shelfLifeFor(state, product) {
      const eff = EquipmentSystem.aggregate(state);
      let mult = 1;
      if (freshCategories.includes(product.category)) mult = eff.freshShelfLifeMult;
      if (frozenCategories.includes(product.category)) mult = Math.max(mult, eff.frozenShelfLifeMult);
      return Math.max(1, Math.round(product.shelfLife * mult));
    },
    capacity(state) {
      return 200 + EquipmentSystem.aggregate(state).capacityBonus;
    }
  };

  // js/data/staff.js
  var staffRoles = [
    { id: "cashier", name: "Thu ng\xE2n", icon: "\u{1F9FE}", desc: "+ t\u1ED1c \u0111\u1ED9 ph\u1EE5c v\u1EE5, + s\u1EE9c ch\u1EE9a h\xE0ng ch\u1EDD, gi\u1EA3m kh\xE1ch b\u1ECF \u0111i." },
    { id: "stocker", name: "Nh\xE2n vi\xEAn kho", icon: "\u{1F4E6}", desc: "T\u1EF1 b\u1ED5 sung h\xE0ng b\xE1n ch\u1EA1y m\u1ED7i s\xE1ng, gi\u1EA3m hao h\u1EE5t." },
    { id: "guard", name: "B\u1EA3o v\u1EC7", icon: "\u{1F6E1}\uFE0F", desc: "Gi\u1EA3m m\u1EA1nh nguy c\u01A1 tr\u1ED9m c\u1EAFp." },
    { id: "shipper", name: "Shipper", icon: "\u{1F6F5}", desc: "Cho ph\xE9p nh\u1EADn \u0111\u01A1n giao h\xE0ng (d\u1ECBch v\u1EE5 Giao h\xE0ng hi\u1EC7u qu\u1EA3 h\u01A1n)." }
  ];
  var NAMES = ["Nguy\u1EC5n V\u0103n An", "Tr\u1EA7n Th\u1ECB B\xEDch", "L\xEA V\u0103n C\u01B0\u1EDDng", "Ph\u1EA1m Th\u1ECB Dung", "Ho\xE0ng V\u0103n Em", "V\u0169 Th\u1ECB G\u1EA5m", "\u0110\u1EB7ng V\u0103n H\u1EA3i", "B\xF9i Th\u1ECB Hi\xEAn", "Ng\xF4 V\u0103n Khang", "\u0110\u1ED7 Th\u1ECB L\xE0i", "Phan V\u0103n Minh", "L\xFD Th\u1ECB Nhung"];
  var HAIR = ["T\xF3c ng\u1EAFn", "T\xF3c b\xFAi", "T\xF3c xo\u0103n", "T\xF3c d\xE0i th\u1EB3ng", "\u0110\u1EA7u \u0111inh"];
  var OUTFIT = ["\u0110\u1ED3ng ph\u1EE5c xanh", "\xC1o s\u01A1 mi tr\u1EAFng", "\xC1o thun ti\u1EC7m", "T\u1EA1p d\u1EC1 n\xE2u"];
  function rollCandidate(rng) {
    const role = rng.pick(staffRoles);
    return {
      id: `staff_${Math.random().toString(36).slice(2, 9)}`,
      name: rng.pick(NAMES),
      role: role.id,
      speed: rng.int(40, 95),
      accuracy: rng.int(50, 98),
      mood: rng.int(60, 90),
      skill: rng.int(40, 90),
      salary: rng.int(8e4, 22e4),
      hair: rng.pick(HAIR),
      outfit: rng.pick(OUTFIT)
    };
  }

  // js/systems/StaffSystem.js
  var StaffSystem = {
    roles: staffRoles,
    rollCandidate,
    hire(state, candidate) {
      state.staff.push({ ...candidate });
    },
    fire(state, staffId) {
      state.staff = state.staff.filter((s) => s.id !== staffId);
    },
    dailySalary(state) {
      return state.staff.reduce((sum, s) => sum + s.salary, 0);
    },
    /** Mood nhân viên trôi theo lương/khối lượng công việc — không phải buff tĩnh (spec §25). */
    updateMood(state, customersServedToday) {
      const workloadPenalty = Math.min(20, customersServedToday / Math.max(1, state.staff.length) / 3);
      state.staff.forEach((s) => {
        let delta = -workloadPenalty + 5;
        if (s.salary < 1e5) delta -= 5;
        s.mood = Math.max(0, Math.min(100, s.mood + delta));
      });
    },
    aggregate(state) {
      const eff = { checkoutSpeedMult: 1, patienceMult: 1, theftReduction: 0, restockBonus: 0, deliveryUnlocked: false, moodAvg: 70 };
      let moodSum = 0;
      state.staff.forEach((s) => {
        const moodFactor = 0.5 + s.mood / 200;
        const perf = (s.speed + s.accuracy + s.skill) / 300 * moodFactor;
        moodSum += s.mood;
        if (s.role === "cashier") {
          eff.checkoutSpeedMult *= 1 + perf * 0.5;
          eff.patienceMult *= 1 + perf * 0.3;
        }
        if (s.role === "stocker") {
          eff.restockBonus += perf * 10;
        }
        if (s.role === "guard") {
          eff.theftReduction = Math.min(0.95, eff.theftReduction + 0.35 + perf * 0.3);
        }
        if (s.role === "shipper") {
          eff.deliveryUnlocked = true;
        }
      });
      if (state.staff.length) eff.moodAvg = moodSum / state.staff.length;
      return eff;
    }
  };

  // js/data/services.js
  var services = [
    { id: "nap_the", name: "N\u1EA1p th\u1EBB \u0111i\u1EC7n tho\u1EA1i", icon: "\u{1F4F1}", unlockCost: 1e6, reputationRequirement: 0, dailyCost: 0, customerBonus: 0.05, extraRevenue: 5e4 },
    { id: "banh_mi_xoi", name: "B\xE1nh m\xEC / X\xF4i", icon: "\u{1F956}", unlockCost: 2e6, reputationRequirement: 10, dailyCost: 2e4, customerBonus: 0.1, extraRevenue: 15e4, morningBoost: 1.3 },
    { id: "ca_phe", name: "C\xE0 ph\xEA", icon: "\u2615", unlockCost: 3e6, reputationRequirement: 20, dailyCost: 3e4, customerBonus: 0.1, extraRevenue: 2e5, morningBoost: 1.2 },
    { id: "giao_hang", name: "Giao h\xE0ng", icon: "\u{1F6F5}", unlockCost: 5e6, reputationRequirement: 30, dailyCost: 5e4, customerBonus: 0.15, extraRevenue: 3e5, requiresRole: "shipper" },
    { id: "membership", name: "Membership", icon: "\u{1F4B3}", unlockCost: 4e6, reputationRequirement: 25, dailyCost: 1e4, customerBonus: 0.1, extraRevenue: 15e4, loyaltyBoost: 10 },
    { id: "so_che_thit_ca", name: "S\u01A1 ch\u1EBF th\u1ECBt c\xE1", icon: "\u{1F52A}", unlockCost: 35e5, reputationRequirement: 20, dailyCost: 2e4, customerBonus: 0.08, extraRevenue: 18e4 },
    { id: "banh_ngot", name: "B\xE1nh ng\u1ECDt", icon: "\u{1F370}", unlockCost: 25e5, reputationRequirement: 15, dailyCost: 2e4, customerBonus: 0.08, extraRevenue: 16e4 },
    { id: "com_hop", name: "C\u01A1m h\u1ED9p", icon: "\u{1F371}", unlockCost: 45e5, reputationRequirement: 35, dailyCost: 4e4, customerBonus: 0.12, extraRevenue: 25e4, noonBoost: 1.3 }
  ];

  // js/systems/ServiceSystem.js
  var ServiceSystem = {
    catalog: services,
    unlock(state, id) {
      const def = services.find((s) => s.id === id);
      if (!def) return { ok: false };
      if (state.services[id]) return { ok: false, message: "\u0110\xE3 m\u1EDF kh\xF3a" };
      if (state.reputation < def.reputationRequirement) return { ok: false, message: "Ch\u01B0a \u0111\u1EE7 uy t\xEDn" };
      if (def.requiresRole && !state.staff.some((s) => s.role === def.requiresRole)) {
        return { ok: false, message: `C\u1EA7n nh\xE2n vi\xEAn vai tr\xF2 "${def.requiresRole}"` };
      }
      if (state.money < def.unlockCost) return { ok: false, message: "Kh\xF4ng \u0111\u1EE7 ti\u1EC1n" };
      state.money -= def.unlockCost;
      state.services[id] = true;
      return { ok: true };
    },
    dailyUpkeep(state) {
      return Object.keys(state.services).filter((id) => state.services[id]).reduce((sum, id) => sum + (services.find((s) => s.id === id)?.dailyCost || 0), 0);
    },
    /** Doanh thu phụ ước tính, có trọng số theo uy tín và theo khung giờ (sáng/trưa) nếu dịch vụ có boost đó. */
    dailyRevenueEstimate(state) {
      const hour = state.time;
      return Object.keys(state.services).filter((id) => state.services[id]).reduce((sum, id) => {
        const def = services.find((s) => s.id === id);
        if (!def) return sum;
        let mult = 0.6 + state.reputation / 250;
        if (def.morningBoost && hour < 9) mult *= def.morningBoost;
        if (def.noonBoost && hour >= 11 && hour <= 13) mult *= def.noonBoost;
        return sum + def.extraRevenue * mult;
      }, 0);
    },
    aggregate(state) {
      const owned = Object.keys(state.services).filter((id) => state.services[id]);
      let customerBonus = 0, loyaltyBoost = 0;
      owned.forEach((id) => {
        const def = services.find((s) => s.id === id);
        if (def) {
          customerBonus += def.customerBonus;
          loyaltyBoost += def.loyaltyBoost || 0;
        }
      });
      return { customerBonus, loyaltyBoost, owned };
    }
  };

  // js/data/advertising.js
  var advertising = [
    { id: "to_roi", name: "T\u1EDD r\u01A1i", icon: "\u{1F4F0}", cost: 3e5, duration: 3, customerMultiplier: 1.1, reputationEffect: 0 },
    { id: "loa", name: "Loa", icon: "\u{1F4E2}", cost: 2e5, duration: 2, customerMultiplier: 1.05, reputationEffect: 0 },
    { id: "zalo", name: "Zalo", icon: "\u{1F4AC}", cost: 5e5, duration: 5, customerMultiplier: 1.15, reputationEffect: 1 },
    { id: "facebook", name: "Facebook", icon: "\u{1F4D8}", cost: 1e6, duration: 7, customerMultiplier: 1.25, reputationEffect: 1 },
    { id: "pr", name: "PR b\xE1o \u0111\u1ECBa ph\u01B0\u01A1ng", icon: "\u{1F4DD}", cost: 2e6, duration: 10, customerMultiplier: 1.3, reputationEffect: 3 },
    { id: "tiktok_kol", name: "TikTok KOL", icon: "\u{1F3A5}", cost: 3e6, duration: 2, customerMultiplier: 1.3, reputationEffect: 4 },
    { id: "tai_tro_le_hoi", name: "T\xE0i tr\u1EE3 l\u1EC5 h\u1ED9i", icon: "\u{1F3AA}", cost: 3e6, duration: 7, customerMultiplier: 1.2, reputationEffect: 8 }
  ];

  // js/systems/AdvertisingSystem.js
  var AdvertisingSystem = {
    catalog: advertising,
    launch(state, id) {
      const def = advertising.find((a) => a.id === id);
      if (!def) return { ok: false };
      if (state.money < def.cost) return { ok: false, message: "Kh\xF4ng \u0111\u1EE7 ti\u1EC1n" };
      state.money -= def.cost;
      state.ads.push({ id, daysLeft: def.duration });
      ReputationSystem.update(state, def.reputationEffect);
      return { ok: true };
    },
    tick(state) {
      state.ads = state.ads.map((a) => ({ ...a, daysLeft: a.daysLeft - 1 })).filter((a) => a.daysLeft > 0);
    },
    aggregateCustomerMult(state) {
      return state.ads.reduce((mult, a) => {
        const def = advertising.find((x) => x.id === a.id);
        return def ? mult * def.customerMultiplier : mult;
      }, 1);
    }
  };

  // js/systems/DemandSystem.js
  var DemandSystem = {
    compute(state, productId) {
      const p = state.products[productId];
      if (!p) return 0;
      const ev = state.todayEventEffects || {};
      let weatherMult = state.weather ? MarketSystem.weatherCategoryDemandMult(state.weather.id, p.category) : 1;
      let seasonMult = state.season ? state.season.trafficMult : 1;
      let eventMult = 1;
      if (ev.demandBoostAll) eventMult *= ev.demandBoostAll;
      if (ev.demandBoost && ev.demandBoost.categories?.includes(p.category)) eventMult *= ev.demandBoost.mult;
      const serviceMult = 1 + ServiceSystem.aggregate(state).customerBonus;
      const adsMult = AdvertisingSystem.aggregateCustomerMult(state);
      const reputationFactor = 0.5 + state.reputation / 100;
      const priceDef = state.prices[productId];
      const actualPrice = priceDef ? priceDef.value : p.referencePrice;
      const priceFactor = Math.pow(p.referencePrice / Math.max(1, actualPrice), p.priceElasticity);
      return p.demand * weatherMult * eventMult * serviceMult * seasonMult * reputationFactor * adsMult * priceFactor;
    },
    /** Chọn `count` sản phẩm theo shoppingPattern của khách, có trọng số theo nhu cầu hiện tại. */
    pickProducts(state, rng, shoppingPattern, count) {
      const pool = products.map((p) => ({ p, w: Math.max(0.01, DemandSystem.compute(state, p.id)) }));
      const chosen = [];
      const used = /* @__PURE__ */ new Set();
      for (let i = 0; i < count && chosen.length < pool.length; i++) {
        const candidates = pool.filter((x) => !used.has(x.p.id));
        if (!candidates.length) break;
        const pick = rng.weighted(candidates, (x) => x.w);
        used.add(pick.p.id);
        chosen.push(pick.p);
      }
      return chosen;
    }
  };

  // js/systems/InventorySystem.js
  var InventorySystem = {
    totalQty(state, productId) {
      return (state.inventory[productId] || []).reduce((s, b) => s + b.quantity, 0);
    },
    addBatch(state, productId, quantity, unitCost) {
      const product = state.products[productId];
      if (!product || quantity <= 0) return;
      if (!state.inventory[productId]) state.inventory[productId] = [];
      state.inventory[productId].push({
        batchId: uid("batch"),
        productId,
        quantity,
        cost: unitCost,
        daysLeft: EquipmentSystem.shelfLifeFor(state, product),
        quality: 100,
        purchasedDay: state.day
      });
      if (state.stats) state.stats.totalRestocked += quantity;
    },
    /** FEFO: batch gần hết hạn nhất bán trước. Trả về {taken, avgCost, avgQuality}. */
    consumeFEFO(state, productId, qty) {
      const batches = state.inventory[productId];
      if (!batches || !batches.length) return { taken: 0, avgCost: 0, avgQuality: 0 };
      batches.sort((a, b) => a.daysLeft - b.daysLeft);
      let remaining = qty, taken = 0, costSum = 0, qualitySum = 0;
      for (const b of batches) {
        if (remaining <= 0) break;
        const take = Math.min(b.quantity, remaining);
        b.quantity -= take;
        remaining -= take;
        taken += take;
        costSum += take * b.cost;
        qualitySum += take * b.quality;
      }
      state.inventory[productId] = batches.filter((b) => b.quantity > 0);
      return { taken, avgCost: taken ? costSum / taken : 0, avgQuality: taken ? qualitySum / taken : 0 };
    },
    /** Cuối ngày: daysLeft -= 1; <=0 thì hỏng, ghi dayStats.spoil; quality giảm dần khi gần hết hạn. */
    applyDailyDecay(state) {
      let spoilLoss = 0, spoiledBatches = 0, freshBatchesSold = state._freshBatchesSoldToday || 0;
      Object.keys(state.inventory).forEach((pid) => {
        const kept = [];
        (state.inventory[pid] || []).forEach((b) => {
          const nb = { ...b, daysLeft: b.daysLeft - 1 };
          if (nb.daysLeft <= 0) {
            spoilLoss += nb.quantity * nb.cost;
            spoiledBatches += 1;
          } else {
            if (nb.daysLeft <= 1) nb.quality = Math.max(10, nb.quality - 30);
            kept.push(nb);
          }
        });
        state.inventory[pid] = kept;
      });
      return { spoilLoss, spoiledBatches, freshBatchesSold };
    },
    spoilFridgePct(state, pct) {
      let loss = 0;
      [...freshCategories, ...frozenCategories].forEach((cat) => {
        Object.values(state.products).filter((p) => p.category === cat).forEach((p) => {
          (state.inventory[p.id] || []).forEach((b) => {
            const lostQty = Math.floor(b.quantity * pct);
            loss += lostQty * b.cost;
            b.quantity -= lostQty;
          });
          state.inventory[p.id] = (state.inventory[p.id] || []).filter((b) => b.quantity > 0);
        });
      });
      return loss;
    },
    isNearExpiry(state, productId) {
      return (state.inventory[productId] || []).some((b) => b.daysLeft <= 1);
    }
  };

  // js/systems/PricingSystem.js
  var PricingSystem = {
    setPrice(state, productId, value) {
      state.prices[productId] = { mode: "custom", value: Math.max(0, Math.round(value)) };
    },
    bulkAdjust(state, pct) {
      Object.values(state.products).forEach((p) => {
        state.prices[p.id] = { mode: pct === 0 ? "market" : "custom", value: Math.round(p.referencePrice * (1 + pct)) };
      });
    },
    effectivePrice(state, productId) {
      const base = state.prices[productId]?.value ?? state.products[productId]?.referencePrice ?? 0;
      if (state.settings.freshSaleEnabled && state.time >= 18 && InventorySystem.isNearExpiry(state, productId)) {
        return Math.round(base * 0.7);
      }
      return base;
    },
    isFreshSaleActive(state, productId) {
      return state.settings.freshSaleEnabled && state.time >= 18 && InventorySystem.isNearExpiry(state, productId);
    },
    calculateCartTotal(state, cart) {
      return cart.reduce((sum, line) => sum + PricingSystem.effectivePrice(state, line.productId) * line.quantity, 0);
    }
  };

  // js/systems/ReviewSystem.js
  var ReviewSystem = {
    maybeCreateReview(state, customer, fulfillRate, forced) {
      const baseChance = 0.3 * (customer.reviewBoost || 1);
      if (!forced && Math.random() > Math.min(0.9, baseChance)) return null;
      const eq = EquipmentSystem.aggregate(state);
      const staffEff = StaffSystem.aggregate(state);
      const waitRatio = customer.maxPatience ? customer.patience / customer.maxPatience : 1;
      const serviceSpeed = waitRatio * 25;
      const priceScore = customer.priceSensitivity < 0.5 ? 15 : 10;
      const stockScore = fulfillRate * 20;
      const qualityScore = Math.min(15, eq.qualityPerceptionBonus + 10);
      const staffScore = Math.min(10, staffEff.moodAvg / 10);
      const equipmentScore = Math.min(10, eq.serviceQuality);
      const serviceScoreBonus = Math.min(5, ServiceSystem.aggregate(state).owned.length);
      let score = serviceSpeed + priceScore + stockScore + qualityScore + staffScore + equipmentScore + serviceScoreBonus + Math.random() * 10;
      if (forced) score = Math.min(score, 30);
      score = Math.max(0, Math.min(100, score));
      const stars = Math.max(1, Math.min(5, Math.round(score / 20)));
      const tags = [];
      if (fulfillRate < 1) tags.push("thi\u1EBFu h\xE0ng");
      if (customer.mistakes > 0) tags.push("nh\u1EA7m m\xF3n");
      if (waitRatio < 0.5) tags.push("ch\u1EDD l\xE2u");
      if (stars >= 4) tags.push("h\xE0i l\xF2ng");
      if (stars <= 2) tags.push("kh\xF4ng h\xE0i l\xF2ng");
      const product = customer.cart.find((l) => l.fulfilled > 0);
      const text = pickFeedbackText(stars, waitRatio, customer, fulfillRate);
      const review = { id: uid("rev"), customer: customer.name, day: state.day, productId: product?.productId || null, stars, text, tags, replied: false, reply: null, viral: false };
      state.reviews.unshift(review);
      if (stars >= 5) state.stats.fiveStarReviews += 1;
      return review;
    },
    reply(state, reviewId, text) {
      const r = state.reviews.find((x) => x.id === reviewId);
      if (!r) return;
      r.reply = text;
      r.replied = true;
    }
  };
  function pickFeedbackText(stars, waitRatio, customer, fulfillRate) {
    if (fulfillRate < 1) return "Kh\xF4ng c\xF3 m\xF3n n\xE0y th\xEC th\xF4i v\u1EADy.";
    if (waitRatio < 0.4) return "\u0110\u1EE9ng \u0111\u1EE3i h\u01A1i l\xE2u.";
    if (customer.priceSensitivity > 0.7 && stars <= 3) return "Gi\xE1 h\u01A1i cao so v\u1EDBi b\xEAn kia.";
    if (stars >= 5) return "Ti\u1EC7m b\xE1n d\u1EC5 ch\u1ECBu gh\xEA, l\u1EA5y \u0111\u1ED3 c\xE1i c\xF3 li\u1EC1n, ch\u1EAFc ch\u1EAFn quay l\u1EA1i.";
    if (stars === 4) return "Ti\u1EC7m c\xF4 ch\u1EE7 d\u1EC5 th\u01B0\u01A1ng, h\xE0ng t\u01B0\u01A1i, l\u1EA5y \u0111\u1ED3 nhanh.";
    if (stars === 3) return "T\u1EA1m \u1ED5n, c\u0169ng b\xECnh th\u01B0\u1EDDng.";
    return "Nh\u1EA7m m\xF3n, ph\u1EE5c v\u1EE5 ch\u01B0a t\u1ED1t l\u1EAFm.";
  }

  // js/systems/OrderSystem.js
  var PATTERN_COUNT = {
    impulse: () => 1,
    bulk: (rng) => rng.int(3, 5),
    specific: (rng) => rng.int(1, 3),
    small: (rng) => rng.int(1, 3)
  };
  var OrderSystem = {
    /** spec §49: generateOrder(customer) — 1..5 sản phẩm theo shoppingPattern & nhu cầu hiện tại. */
    generateOrder(state, rng, customer) {
      const count = (PATTERN_COUNT[customer.shoppingPattern] || PATTERN_COUNT.small)(rng);
      const picked = DemandSystem.pickProducts(state, rng, customer.shoppingPattern, count);
      return picked.map((p) => ({
        productId: p.id,
        quantity: customer.shoppingPattern === "bulk" ? rng.int(2, 5) : rng.int(1, 2)
      }));
    },
    validate(order, cart) {
      const mismatch = order.find((line) => {
        const got = cart.find((c) => c.productId === line.productId);
        return !got || got.fulfilled < line.quantity;
      });
      return mismatch ? { valid: false, reason: `Thi\u1EBFu/sai: ${mismatch.productId}` } : { valid: true };
    },
    /** SELL_PRODUCT: lấy 1 đơn vị sản phẩm bỏ vào giỏ của khách đang phục vụ, FEFO ngay tại chỗ. */
    sellProduct(state, customerId, productId) {
      const customer = state.customers.find((c) => c.id === customerId);
      if (!customer || customer.status === "done" || customer.status === "left") return { ok: false };
      const line = customer.cart.find((l) => l.productId === productId);
      if (!line || line.fulfilled >= line.quantity) {
        customer.mistakes += 1;
        customer.mood = Math.max(0, customer.mood - 8);
        customer.patience = Math.max(0, customer.patience - customer.maxPatience * 0.06);
        return { ok: false, reason: "wrong_item" };
      }
      const result = InventorySystem.consumeFEFO(state, productId, 1);
      if (result.taken < 1) {
        customer.mood = Math.max(0, customer.mood - 5);
        return { ok: false, reason: "out_of_stock" };
      }
      line.fulfilled += 1;
      line._lastCost = result.avgCost;
      line._lastQuality = result.avgQuality;
      if (PricingSystem.isFreshSaleActive(state, productId)) state._freshBatchesSoldToday = (state._freshBatchesSoldToday || 0) + 1;
      customer.status = "shopping";
      return { ok: true };
    },
    /** RETURN_PRODUCT: bỏ món đã lấy nhầm/thừa, hoàn lại kho (batch mới, giữ nguyên hạn trung bình tạm). */
    returnProduct(state, customerId, productId) {
      const customer = state.customers.find((c) => c.id === customerId);
      if (!customer) return { ok: false };
      const line = customer.cart.find((l) => l.productId === productId);
      if (!line || line.fulfilled <= 0) return { ok: false };
      line.fulfilled -= 1;
      InventorySystem.addBatch(state, productId, 1, line._lastCost || state.market[productId]?.buyPrice || 0);
      return { ok: true };
    },
    /** spec §50 completeOrder(customer, cart) — tính tiền, cập nhật kinh tế + review + uy tín. */
    completeOrder(state, customerId) {
      const customer = state.customers.find((c) => c.id === customerId);
      if (!customer) return null;
      let revenue = 0, cogs = 0, requested = 0, fulfilled = 0;
      customer.cart.forEach((line) => {
        requested += line.quantity;
        fulfilled += line.fulfilled;
        if (line.fulfilled > 0) {
          revenue += PricingSystem.effectivePrice(state, line.productId) * line.fulfilled;
          cogs += (line._lastCost || 0) * line.fulfilled;
        }
      });
      const fulfillRate = requested ? fulfilled / requested : 0;
      const validation = OrderSystem.validate(customer.order, customer.cart);
      if (!validation.valid) {
        customer.mood = Math.max(0, customer.mood - (1 - fulfillRate) * 40);
        customer.patience = Math.max(0, customer.patience - 20);
      }
      revenue = Math.round(revenue * customer.rewardBoost);
      state.money += revenue;
      state.dayStats.revenue += revenue;
      state.dayStats.cogs += cogs;
      state.stats.totalProductsSold += fulfilled;
      state.stats.totalCustomersServed += 1;
      state.stats.totalRevenueAllTime += revenue;
      state.dayStats.productsSoldToday += fulfilled;
      if (customer.loyalty >= 80) state.stats.loyalCustomerIds[customer.id] = true;
      customer.status = fulfillRate >= 0.99 ? "done" : fulfillRate > 0 ? "done" : "left";
      if (customer.mood >= 65) state.dayStats.customersHappy += 1;
      else if (customer.mood >= 35) state.dayStats.customersNeutral += 1;
      else state.dayStats.customersAngry += 1;
      state.dayStats.customersTotal += 1;
      ReputationSystem.update(state, (customer.mood - 50) / 40);
      const review = ReviewSystem.maybeCreateReview(state, customer, fulfillRate);
      state.customers = state.customers.filter((c) => c.id !== customerId);
      return { revenue, cogs, fulfillRate, review, customer };
    },
    /** CANCEL_ORDER: khách hủy/bỏ đi — hoàn hết hàng đã lấy, không doanh thu. */
    cancelOrder(state, customerId, reason = "cancelled") {
      const customer = state.customers.find((c) => c.id === customerId);
      if (!customer) return;
      customer.cart.forEach((line) => {
        if (line.fulfilled > 0) InventorySystem.addBatch(state, line.productId, line.fulfilled, line._lastCost || 0);
      });
      customer.status = "left";
      customer.mood = Math.max(0, customer.mood - 20);
      state.dayStats.customersAngry += 1;
      state.dayStats.customersTotal += 1;
      ReputationSystem.update(state, -1);
      ReviewSystem.maybeCreateReview(state, customer, 0, true);
      state.customers = state.customers.filter((c) => c.id !== customerId);
    }
  };

  // js/systems/CustomerSystem.js
  var PEAK_WINDOWS = [[6.5, 8.5], [11, 13], [17, 20.5]];
  var QUIET_WINDOWS = [[9, 10.5], [14, 16]];
  var CustomerSystem = {
    pickArchetype(state, rng) {
      return rng.weighted(archetypes, (a) => {
        let w = 1;
        if (a.id === "khach_quen") w *= 0.6 + state.reputation / 100;
        if (a.id === "vip") w *= 0.1 + state.reputation / 180;
        if (a.id === "khach_kho_tinh") w *= 1.3 - state.reputation / 200;
        return Math.max(0.05, w);
      });
    },
    /** spawnRate = baseTraffic * timeOfDay * weather * reputation * advertising * events (spec §33). */
    spawnRatePerHour(state) {
      const inPeak = PEAK_WINDOWS.some(([a, b]) => state.time >= a && state.time <= b);
      const inQuiet = QUIET_WINDOWS.some(([a, b]) => state.time >= a && state.time <= b);
      const timeOfDayMult = inPeak ? 1.6 : inQuiet ? 0.5 : 1;
      const weatherMult = state.weather ? state.weather.trafficMult : 1;
      const seasonMult = state.season ? state.season.trafficMult : 1;
      const eventMult = state.todayEventEffects?.demandBoostAll || 1;
      const eqMult = EquipmentSystem.aggregate(state).customerMoodBonus ? 1.05 : 1;
      const eveningMult = state.time >= 18 ? EquipmentSystem.aggregate(state).eveningCustomerMult : 1;
      const svcMult = 1 + ServiceSystem.aggregate(state).customerBonus;
      const baseTraffic = 3;
      return baseTraffic * timeOfDayMult * weatherMult * seasonMult * eventMult * ReputationSystem.customerMultiplier(state) * AdvertisingSystem.aggregateCustomerMult(state) * eqMult * eveningMult * svcMult;
    },
    /** spec §48: generateCustomer() */
    spawn(state, rng) {
      const archetype = CustomerSystem.pickArchetype(state, rng);
      const eq = EquipmentSystem.aggregate(state);
      const staffEff = StaffSystem.aggregate(state);
      const maxPatience = archetype.patience * eq.patienceMult * staffEff.patienceMult;
      const customer = {
        id: uid("cust"),
        name: generateVietnameseName(rng),
        ageGroup: archetype.ageGroup,
        personality: archetype.personality,
        archetypeId: archetype.id,
        money: Math.round(rng.range(archetype.minMoney, archetype.maxMoney)),
        patience: maxPatience,
        maxPatience,
        priceSensitivity: archetype.priceSensitivity,
        loyalty: Math.round(rng.range(Math.max(0, archetype.loyalty - 20), Math.min(100, archetype.loyalty + 10))),
        mood: Math.round(rng.range(50, 100)),
        shoppingPattern: archetype.shoppingPattern,
        status: "walk_in",
        // walk_in | queue | counter | shopping | done | left
        mistakes: 0,
        spawnedAtTime: state.time,
        rewardBoost: archetype.rewardBoost || 1,
        reviewBoost: archetype.reviewBoost || 1
      };
      customer.order = OrderSystem.generateOrder(state, rng, customer);
      customer.cart = customer.order.map((line) => ({ ...line, fulfilled: 0 }));
      state.customers.push(customer);
      return customer;
    },
    orderSpeechText(state, customer) {
      const parts = customer.order.map((o) => {
        const p = state.products[o.productId];
        return `${o.quantity} ${p ? p.unit : ""} ${p ? p.name.toLowerCase() : o.productId}`;
      });
      return `${customer.personality} n\xF3i: "Cho ${parts.join(", ")} gi\xFAp em."`;
    },
    isOrderComplete(customer) {
      return customer.cart.every((l) => l.fulfilled >= l.quantity);
    }
  };

  // js/data/events.js
  var events = [
    { id: "mua_lon", title: "\u{1F327}\uFE0F M\u01B0a l\u1EDBn", description: "Tr\u1EDDi \u0111\u1ED5 m\u01B0a l\u1EDBn b\u1EA5t ch\u1EE3t, \u0111\u01B0\u1EDDng ph\u1ED1 v\u1EAFng kh\xE1ch.", choices: [
      { label: "D\u1ECDn m\xE1i che, c\u1ED1 b\xE1n d\u01B0\u1EDBi m\u01B0a", cost: 2e5, reputationEffect: 2 },
      { label: "\u0110\xF3ng c\u1EEDa s\u1EDBm h\xF4m nay", cost: 0, reputationEffect: 0, closeToday: true }
    ] },
    { id: "nang_nong", title: "\u{1F525} N\u1EAFng n\xF3ng gay g\u1EAFt", description: "Tr\u1EDDi n\u1EAFng n\xF3ng, kh\xE1ch \u0111i \u0111\u01B0\u1EDDng kh\xE1t n\u01B0\u1EDBc, th\xE8m \u0111\u1ED3 m\xE1t.", choices: [
      { label: "Khuy\u1EBFn m\xE3i n\u01B0\u1EDBc & kem h\xF4m nay", cost: 0, reputationEffect: 1, demandBoost: { categories: ["nuoc_uong", "dong_lanh"], mult: 1.4 } },
      { label: "B\xE1n gi\xE1 b\xECnh th\u01B0\u1EDDng", cost: 0, reputationEffect: 0 }
    ] },
    { id: "ngay_linh_luong", title: "\u{1F4B5} Ng\xE0y l\u0129nh l\u01B0\u01A1ng", description: "H\xF4m nay nhi\u1EC1u ng\u01B0\u1EDDi l\u0129nh l\u01B0\u01A1ng, c\xF3 th\u1EC3 mua s\u1EAFm nhi\u1EC1u h\u01A1n.", choices: [
      { label: "Chu\u1EA9n b\u1ECB th\xEAm h\xE0ng b\xE1n", cost: 3e5, reward: 5e5, reputationEffect: 1 },
      { label: "Gi\u1EEF nguy\xEAn k\u1EBF ho\u1EA1ch", cost: 0, reputationEffect: 0 }
    ], demandBoostAll: 1.25 },
    { id: "ngay_ram", title: "\u{1F56F}\uFE0F Ng\xE0y R\u1EB1m", description: "H\xF4m nay l\xE0 ng\xE0y R\u1EB1m, nhu c\u1EA7u nhang, hoa, tr\xE1i c\xE2y c\xFAng t\u0103ng m\u1EA1nh.", choices: [
      { label: "Nh\u1EADp th\xEAm nhang, hoa c\xFAng", cost: 15e4, reputationEffect: 0 },
      { label: "B\u1ECF qua", cost: 0, reputationEffect: 0 }
    ], demandBoost: { categories: ["do_cung", "trai_cay"], mult: 2.2 } },
    { id: "bao", title: "\u{1F300} B\xE3o l\u1EDBn", description: "\u0110\xE0i b\xE1o b\xE3o l\u1EDBn s\u1EAFp \u0111\u1ED5 b\u1ED9 khu v\u1EF1c.", choices: [
      { label: "\u0110\xF3ng c\u1EEDa tr\xE1nh b\xE3o", cost: 0, reputationEffect: 1, closeToday: true },
      { label: "V\u1EABn m\u1EDF c\u1EEDa b\u1EA5t ch\u1EA5p r\u1EE7i ro", cost: 0, reputationEffect: -2, delayedEffect: { days: 1, money: -8e5, note: "H\u01B0 h\u1EA1i do b\xE3o" } }
    ] },
    { id: "nha_cung_cap_xa_kho", title: "\u{1F4E6} Nh\xE0 cung c\u1EA5p x\u1EA3 kho", description: "Nh\xE0 cung c\u1EA5p x\u1EA3 kho, gi\xE1 nh\u1EADp h\xF4m nay gi\u1EA3m 20%.", choices: [
      { label: "Nh\u1EADp h\xE0ng s\u1ED1 l\u01B0\u1EE3ng l\u1EDBn", cost: 1e6, reputationEffect: 0, buyDiscount: 0.2 },
      { label: "Kh\xF4ng nh\u1EADp th\xEAm", cost: 0, reputationEffect: 0 }
    ] },
    { id: "doi_thu_khai_truong", title: "\u{1F3EA} \u0110\u1ED1i th\u1EE7 khai tr\u01B0\u01A1ng", description: "M\u1ED9t c\u1EEDa h\xE0ng t\u1EA1p h\xF3a m\u1EDBi v\u1EEBa khai tr\u01B0\u01A1ng g\u1EA7n \u0111\xF3.", choices: [
      { label: "Gi\u1EA3m gi\xE1 c\u1EA1nh tranh", cost: 0, reputationEffect: 0, priceSuggestion: -0.05 },
      { label: "Gi\u1EEF nguy\xEAn, t\u1EADp trung ch\u1EA5t l\u01B0\u1EE3ng", cost: 0, reputationEffect: 1 },
      { label: "Ch\u1EA1y ngay m\u1ED9t chi\u1EBFn d\u1ECBch qu\u1EA3ng c\xE1o", cost: 5e5, reputationEffect: 2 }
    ] },
    { id: "gia_heo_tang", title: "\u{1F4C8} Gi\xE1 heo t\u0103ng", description: "Gi\xE1 th\u1ECBt heo tr\xEAn th\u1ECB tr\u01B0\u1EDDng t\u0103ng \u0111\u1ED9t bi\u1EBFn.", choices: [
      { label: "T\u0103ng gi\xE1 b\xE1n theo th\u1ECB tr\u01B0\u1EDDng", cost: 0, reputationEffect: -1 },
      { label: "Gi\u1EEF gi\xE1 b\xE1n, ch\u1EA5p nh\u1EADn l\u1EDDi \xEDt h\u01A1n", cost: 2e5, reputationEffect: 2 }
    ], costMultiplier: { productId: "thit_heo", mult: 1.3 } },
    { id: "mat_dien", title: "\u26A1 M\u1EA5t \u0111i\u1EC7n", description: "T\u1EE7 l\u1EA1nh \u0111ang ch\u1EE9a nhi\u1EC1u h\xE0ng t\u01B0\u01A1i.", choices: [
      { label: "Mua m\xE1y ph\xE1t ngay \u2192 b\u1EA3o v\u1EC7 h\xE0ng", cost: 3e6, reputationEffect: 0, grantsEquipment: "may_phat_dien" },
      { label: "G\u1ECDi th\u1EE3 \u0111i\u1EC7n \u2192 m\u1EA5t 2 gi\u1EDD", cost: 5e5, reputationEffect: 0, delayOpen: 2 },
      { label: "Ch\u1EA5p nh\u1EADn r\u1EE7i ro", cost: 0, reputationEffect: -1, spoilFridgePct: 0.35, needsEquipmentToSkip: "may_phat_dien" }
    ] },
    { id: "khach_vip", title: "\u{1F451} Kh\xE1ch VIP gh\xE9 th\u0103m", description: "M\u1ED9t v\u1ECB kh\xE1ch VIP b\u1EA5t ng\u1EDD gh\xE9 ti\u1EC7m h\xF4m nay.", choices: [
      { label: "Ph\u1EE5c v\u1EE5 t\u1EADn t\xECnh, \u01B0u \u0111\xE3i \u0111\u1EB7c bi\u1EC7t", cost: 0, reward: 3e5, reputationEffect: 3 },
      { label: "Ph\u1EE5c v\u1EE5 nh\u01B0 kh\xE1ch th\u01B0\u1EDDng", cost: 0, reward: 1e5, reputationEffect: 1 }
    ] },
    { id: "review_viral", title: "\u{1F4F1} Review viral", description: "M\u1ED9t b\xE0i \u0111\xE1nh gi\xE1 v\u1EC1 ti\u1EC7m b\u1EA5t ng\u1EDD viral tr\xEAn m\u1EA1ng x\xE3 h\u1ED9i.", choices: [
      { label: "T\u01B0\u01A1ng t\xE1c t\xEDch c\u1EF1c, c\u1EA3m \u01A1n kh\xE1ch", cost: 0, reputationEffect: 5 },
      { label: "Ph\u1EDBt l\u1EDD, kh\xF4ng ph\u1EA3n h\u1ED3i", cost: 0, reputationEffect: 1 }
    ] },
    { id: "don_hang_lon", title: "\u{1F6D2} \u0110\u01A1n h\xE0ng s\u1EC9 l\u1EDBn", description: "M\u1ED9t kh\xE1ch mu\u1ED1n \u0111\u1EB7t \u0111\u01A1n h\xE0ng s\u1ED1 l\u01B0\u1EE3ng l\u1EDBn, gi\u1EA3m gi\xE1 10%.", choices: [
      { label: "Nh\u1EADn \u0111\u01A1n", cost: 0, reward: 15e5, reputationEffect: 2 },
      { label: "T\u1EEB ch\u1ED1i, kh\xF4ng \u0111\u1EE7 h\xE0ng", cost: 0, reward: 0, reputationEffect: -1 }
    ] },
    { id: "kiem_tra", title: "\u{1F575}\uFE0F \u0110o\xE0n ki\u1EC3m tra", description: "\u0110o\xE0n ki\u1EC3m tra an to\xE0n th\u1EF1c ph\u1EA9m gh\xE9 th\u0103m \u0111\u1ED9t xu\u1EA5t.", choices: [
      { label: "Xu\u1EA5t tr\xECnh gi\u1EA5y ph\xE9p & b\xECnh ch\u1EEFa ch\xE1y", cost: 0, reputationEffect: 2, needsAllEquipment: ["giay_phep", "binh_chua_chay"] },
      { label: "N\u1ED9p ph\u1EA1t ngay", cost: 5e5, reputationEffect: -2 }
    ] },
    { id: "trom", title: "\u{1F576}\uFE0F Nghi c\xF3 tr\u1ED9m", description: "Ph\xE1t hi\u1EC7n m\u1ED9t ng\u01B0\u1EDDi l\u1EA1 l\u1EA3ng v\u1EA3ng quanh qu\u1EA7y h\xE0ng.", choices: [
      { label: "C\u1EA3nh gi\xE1c theo d\xF5i s\xE1t", cost: 0, reputationEffect: 0 },
      { label: "Kh\xF4ng \u0111\u1EC3 \xFD", cost: 0, reputationEffect: 0, theftRisk: true }
    ] },
    { id: "hong_tu", title: "\u{1F9CA} H\u1ECFng t\u1EE7 l\u1EA1nh", description: "T\u1EE7 m\xE1t/t\u1EE7 \u0111\xF4ng trong ti\u1EC7m \u0111\u1ED9t ng\u1ED9t tr\u1EE5c tr\u1EB7c.", choices: [
      { label: "G\u1ECDi th\u1EE3 s\u1EEDa ngay", cost: 6e5, reputationEffect: 0 },
      { label: "\u0110\u1EC3 t\u1EEB t\u1EEB s\u1EEDa sau", cost: 0, reputationEffect: -1, spoilFridgePct: 0.4 }
    ] },
    { id: "vo_ong_nuoc", title: "\u{1F6B0} V\u1EE1 \u1ED1ng n\u01B0\u1EDBc", description: "\u0110\u01B0\u1EDDng \u1ED1ng n\u01B0\u1EDBc trong ti\u1EC7m b\u1ECB v\u1EE1, n\u01B0\u1EDBc tr\xE0n ra s\xE0n.", choices: [
      { label: "G\u1ECDi th\u1EE3 s\u1EEDa chuy\xEAn nghi\u1EC7p", cost: 4e5, reputationEffect: 1 },
      { label: "T\u1EF1 x\u1EED l\xFD t\u1EA1m b\u1EE3", cost: 1e5, reputationEffect: -1 }
    ] },
    { id: "khach_truot_nga", title: "\u{1F915} Kh\xE1ch tr\u01B0\u1EE3t ng\xE3", description: "M\u1ED9t kh\xE1ch b\u1ECB tr\u01B0\u1EE3t ng\xE3 do s\xE0n \u01B0\u1EDBt trong ti\u1EC7m.", choices: [
      { label: "Th\u01B0\u01A1ng l\u01B0\u1EE3ng, h\u1ED7 tr\u1EE3 vi\u1EC7n ph\xED", cost: 3e5, reputationEffect: 1 },
      { label: "T\u1EEB ch\u1ED1i tr\xE1ch nhi\u1EC7m", cost: 0, reputationEffect: -3 }
    ] },
    { id: "hang_giao_tre", title: "\u{1F69A} H\xE0ng giao tr\u1EC5", description: "L\xF4 h\xE0ng nh\u1EADp h\xF4m nay b\u1ECB nh\xE0 cung c\u1EA5p giao tr\u1EC5.", choices: [
      { label: "G\u1ECDi \u0111i\u1EC7n th\xFAc gi\u1EE5c", cost: 5e4, reputationEffect: 0 },
      { label: "Ch\u1EDD \u0111\u1EE3i, b\xE1n h\xE0ng t\u1ED3n kho", cost: 0, reputationEffect: 0 }
    ] },
    { id: "khach_xin_ghi_no", title: "\u{1F4D2} Kh\xE1ch xin ghi n\u1EE3", description: "M\u1ED9t kh\xE1ch quen xin ghi n\u1EE3 \u0111\u1EC3 mua \u0111\u1ED3 h\xF4m nay.", choices: [
      { label: "\u0110\u1ED3ng \xFD cho ghi n\u1EE3", cost: 0, reputationEffect: 2, delayedEffect: { days: 3, money: 15e4, note: "Kh\xE1ch tr\u1EA3 n\u1EE3" } },
      { label: "T\u1EEB ch\u1ED1i kh\xE9o l\xE9o", cost: 0, reputationEffect: -1 }
    ] },
    { id: "hang_gia", title: "\u{1F6AB} H\xE0ng k\xE9m ch\u1EA5t l\u01B0\u1EE3ng", description: "Ph\xE1t hi\u1EC7n m\u1ED9t l\xF4 h\xE0ng nghi l\xE0 h\xE0ng gi\u1EA3 t\u1EEB nh\xE0 cung c\u1EA5p.", choices: [
      { label: "Tr\u1EA3 l\u1EA1i nh\xE0 cung c\u1EA5p", cost: 0, reputationEffect: 1 },
      { label: "V\u1EABn b\xE1n ra (r\u1EE7i ro b\u1ECB ph\xE1t hi\u1EC7n)", cost: 0, reward: 2e5, reputationEffect: -4 }
    ] }
  ];

  // js/systems/EventSystem.js
  var EventSystem = {
    /** Lịch cố định cho 2 event theo lịch Việt + random 55% các ngày còn lại (spec §15 "Ngày Rằm", "Ngày lĩnh lương"). */
    maybeTriggerDaily(state, rng) {
      if (state.activeEvent) return null;
      let forcedId = null;
      if (state.day % 15 === 0) forcedId = "ngay_ram";
      else if (state.day % 30 === 5) forcedId = "ngay_linh_luong";
      let def;
      if (forcedId) {
        def = events.find((e) => e.id === forcedId);
      } else {
        if (!rng.chance(0.55)) {
          state.todayEventEffects = {};
          return null;
        }
        const pool = events.filter((e) => e.id !== "ngay_ram" && e.id !== "ngay_linh_luong" && !state.usedEventIds.includes(e.id));
        def = rng.pick(pool.length ? pool : events.filter((e) => e.id !== "ngay_ram" && e.id !== "ngay_linh_luong"));
      }
      state.activeEvent = { def };
      state.usedEventIds.push(def.id);
      if (state.usedEventIds.length > 12) state.usedEventIds.shift();
      state.todayEventEffects = { demandBoost: def.demandBoost, demandBoostAll: def.demandBoostAll, costMultiplier: def.costMultiplier };
      return state.activeEvent;
    },
    resolveChoice(state, choiceIndex, rng) {
      const active = state.activeEvent;
      if (!active) return null;
      const choice = active.def.choices[choiceIndex];
      const result = EventSystem.applyChoice(state, choice, active.def, rng);
      state.eventLog.unshift({ day: state.day, title: active.def.title, choice: choice.label });
      state.activeEvent = null;
      return result;
    },
    /** Dùng chung cho EventSystem (sáng) và DramaSystem (trong ngày). */
    applyChoice(state, choice, def, rng) {
      const info = { closeToday: false, delayOpenHours: 0 };
      if (choice.cost) {
        state.money -= choice.cost;
        state.dayStats.incidents += choice.cost;
      }
      if (choice.reward) {
        state.money += choice.reward;
        state.dayStats.revenue += choice.reward;
      }
      if (choice.reputationEffect) ReputationSystem.update(state, choice.reputationEffect);
      if (choice.loyaltyEffect) {
      }
      if (choice.buyDiscount) state.todayEventEffects = { ...state.todayEventEffects, buyDiscount: choice.buyDiscount };
      if (choice.priceSuggestion) info.priceSuggestion = choice.priceSuggestion;
      if (choice.grantsEquipment) state.equipment[choice.grantsEquipment] = { level: 1 };
      if (choice.needsAllEquipment) {
        const missing = choice.needsAllEquipment.some((id) => !state.equipment[id]);
        if (missing) {
          state.money -= 5e5;
          state.dayStats.incidents += 5e5;
          ReputationSystem.update(state, -2);
        }
      }
      if (choice.spoilFridgePct) {
        const eq = EquipmentSystem.aggregate(state);
        if (!(choice.needsEquipmentToSkip && eq.blackoutProtected)) {
          const loss = InventorySystem.spoilFridgePct(state, choice.spoilFridgePct);
          state.dayStats.spoil += loss;
        }
      }
      if (choice.theftRisk && rng.chance(0.5)) {
        const eq = EquipmentSystem.aggregate(state);
        if (!rng.chance(eq.theftReduction)) {
          const loss = Math.round(rng.range(1e5, 5e5));
          state.money -= loss;
          state.dayStats.theft += loss;
        }
      }
      if (choice.closeToday) info.closeToday = true;
      if (choice.delayOpen) info.delayOpenHours = choice.delayOpen;
      if (choice.delayedEffect) {
        state.pendingDelayed.push({
          executeOnDay: state.day + choice.delayedEffect.days,
          type: "EVENT",
          payload: choice.delayedEffect
        });
      }
      return info;
    },
    applyDuePending(state, rng) {
      const due = state.pendingDelayed.filter((e) => e.executeOnDay <= state.day);
      due.forEach((e) => {
        const p = e.payload;
        const failed = p.failChance && rng.chance(p.failChance);
        if (failed) {
          state.notifications = state.notifications || [];
          state.notifications.push(p.failNote || `${p.note}: kh\xF4ng x\u1EA3y ra`);
        } else {
          state.money += p.money || 0;
          if (p.reputation) ReputationSystem.update(state, p.reputation);
          state.notifications = state.notifications || [];
          state.notifications.push(`${p.note}: ${(p.money || 0) >= 0 ? "+" : ""}${p.money || 0}\u0111`);
        }
      });
      state.pendingDelayed = state.pendingDelayed.filter((e) => e.executeOnDay > state.day);
    }
  };

  // js/data/drama.js
  var drama = [
    { id: "ba_sau_xin_no", title: "B\xE0 S\xE1u xin ghi n\u1EE3", description: '"C\xF4 cho b\xE0 ghi 100 ngh\xECn t\u1EDBi cu\u1ED1i tu\u1EA7n nha."', choices: [
      { label: "Cho ghi n\u1EE3", cost: 0, reputationEffect: 3, loyaltyEffect: 10, delayedEffect: { days: 3, money: 1e5, note: "B\xE0 S\xE1u tr\u1EA3 n\u1EE3", failChance: 0.2, failNote: "B\xE0 S\xE1u qu\xEAn tr\u1EA3" } },
      { label: "Ch\u1EC9 cho ghi 50k", cost: 0, reward: 5e4, reputationEffect: 1, delayedEffect: { days: 3, money: 5e4, note: "B\xE0 S\xE1u tr\u1EA3 n\u1EE3", failChance: 0.1 } },
      { label: "T\u1EEB ch\u1ED1i", cost: 0, reputationEffect: -2, loyaltyEffect: -10 }
    ] },
    { id: "khach_quen_phat_hien_gia", title: "Kh\xE1ch quen ph\xE1t hi\u1EC7n gi\xE1 cao", description: '"\u1EE6a h\xF4m qua c\xF4 b\xE1n tui 12 ngh\xECn, sao nay 15 ngh\xECn v\u1EADy?"', choices: [
      { label: "Gi\u1EA3i th\xEDch gi\xE1 nh\u1EADp t\u0103ng", cost: 0, reputationEffect: 1 },
      { label: "Gi\u1EA3m gi\xE1 cho kh\xE1ch quen", cost: 1e4, reputationEffect: 2, loyaltyEffect: 10 },
      { label: "Gi\u1EEF gi\xE1", cost: 0, reputationEffect: -1 }
    ] },
    { id: "doi_thu_giam_gia", title: "\u0110\u1ED1i th\u1EE7 gi\u1EA3m gi\xE1", description: "Ti\u1EC7m b\xEAn c\u1EA1nh gi\u1EA3m gi\xE1 n\u01B0\u1EDBc 20%.", choices: [
      { label: "Gi\u1EA3m theo", cost: 0, reputationEffect: 0, priceSuggestion: -0.1 },
      { label: "Gi\u1EEF gi\xE1", cost: 0, reputationEffect: 0 },
      { label: "T\u0103ng qu\u1EA3ng c\xE1o", cost: 3e5, reputationEffect: 1 },
      { label: "Ch\u1EA1y khuy\u1EBFn m\xE3i ri\xEAng", cost: 15e4, reputationEffect: 2 }
    ] },
    { id: "khach_quen_dien_thoai", title: "Kh\xE1ch \u0111\u1EC3 qu\xEAn \u0111i\u1EC7n tho\u1EA1i", description: "M\u1ED9t kh\xE1ch \u0111\u1EC3 qu\xEAn \u0111i\u1EC7n tho\u1EA1i tr\xEAn qu\u1EA7y h\xE0ng r\u1ED3i r\u1EDDi \u0111i.", choices: [
      { label: "Gi\u1EEF l\u1EA1i", cost: 0, reputationEffect: 3, loyaltyEffect: 15 },
      { label: "T\xECm c\xE1ch li\xEAn h\u1EC7", cost: 0, reputationEffect: 4, loyaltyEffect: 10 }
    ] },
    { id: "tre_con_nhin_tu_kem", title: "Tr\u1EBB con \u0111\u1EE9ng nh\xECn t\u1EE7 kem", description: "M\u1ED9t \u0111\u1EE9a tr\u1EBB \u0111\u1EE9ng t\u1EA7n ng\u1EA7n tr\u01B0\u1EDBc t\u1EE7 kem m\xE3i kh\xF4ng r\u1EDDi.", choices: [
      { label: "T\u1EB7ng m\u1ED9t c\xE2y kem", cost: 8e3, reputationEffect: 2, impulsePurchase: true },
      { label: "Nh\u1EAFc nh\u1EDF ph\u1EE5 huynh", cost: 0, reputationEffect: 0 }
    ] },
    { id: "khach_dang_bai_che", title: "Kh\xE1ch \u0111\u0103ng b\xE0i ch\xEA ti\u1EC7m", description: "M\u1ED9t kh\xE1ch \u0111\u0103ng b\xE0i ch\xEA ti\u1EC7m trong nh\xF3m khu ph\u1ED1.", choices: [
      { label: "Ph\u1EA3n h\u1ED3i l\u1ECBch s\u1EF1", cost: 0, reputationEffect: 1 },
      { label: "Xin l\u1ED7i + ho\xE0n ti\u1EC1n", cost: 5e4, reputationEffect: 3, viralPositiveChance: 0.3 },
      { label: "Tranh lu\u1EADn", cost: 0, reputationEffect: -4, viralNegativeChance: 0.4 },
      { label: "Kh\xF4ng ph\u1EA3n h\u1ED3i", cost: 0, reputationEffect: -2 }
    ] },
    { id: "shipper_het_mon", title: "Shipper \u0111\u1EBFn l\u1EA5y h\xE0ng h\u1EBFt m\xF3n", description: '"Ch\u1ECB \u01A1i \u0111\u01A1n n\xE0y h\u1EBFt m\xF3n r\u1ED3i."', choices: [
      { label: "\u0110\u1ED5i s\u1EA3n ph\u1EA9m", cost: 0, reputationEffect: 1 },
      { label: "H\u1EE7y \u0111\u01A1n", cost: 0, reputationEffect: -1 },
      { label: "Ch\u1EA1y \u0111i nh\u1EADp", cost: 3e4, reputationEffect: 2, delayOpen: 0.5 }
    ] }
  ];

  // js/systems/DramaSystem.js
  var DramaSystem = {
    maybeTrigger(state, rng, dtGameMinutes) {
      if (state.activeDrama || state.activeEvent || state.phase !== "open") return null;
      const chancePerMinute = 0.012;
      if (!rng.chance(chancePerMinute * dtGameMinutes)) return null;
      const def = rng.pick(drama);
      state.activeDrama = { def };
      return state.activeDrama;
    },
    resolveChoice(state, choiceIndex, rng) {
      const active = state.activeDrama;
      if (!active) return null;
      const choice = active.def.choices[choiceIndex];
      const info = EventSystem.applyChoice(state, choice, active.def, rng);
      if (choice.viralPositiveChance && rng.chance(choice.viralPositiveChance)) {
        ReputationSystem.update(state, 6);
        info.viral = "positive";
      }
      if (choice.viralNegativeChance && rng.chance(choice.viralNegativeChance)) {
        ReputationSystem.update(state, -6);
        info.viral = "negative";
      }
      state.eventLog.unshift({ day: state.day, title: active.def.title, choice: choice.label });
      state.activeDrama = null;
      return { ...info, impulsePurchase: !!choice.impulsePurchase };
    }
  };

  // js/systems/EconomySystem.js
  var EconomySystem = {
    closeDay(state) {
      const decay = InventorySystem.applyDailyDecay(state);
      state.dayStats.spoil += decay.spoilLoss;
      state.stats.freshBatchesSoldAllTime += state._freshBatchesSoldToday || 0;
      state._freshBatchesSoldToday = 0;
      const salary = StaffSystem.dailySalary(state);
      const rent = state.settings.rent;
      const utilities = EquipmentSystem.dailyUpkeep(state) + ServiceSystem.dailyUpkeep(state);
      const serviceRevenue = Math.round(ServiceSystem.dailyRevenueEstimate(state));
      const tax = Math.round(state.dayStats.revenue * state.settings.taxRate);
      const loanInterest = Math.round((state.loan?.principal || 0) * (state.loan?.interestRate || 0));
      const netProfit = state.dayStats.revenue + serviceRevenue - state.dayStats.cogs - state.dayStats.spoil - state.dayStats.theft - state.dayStats.incidents - salary - rent - utilities - tax - loanInterest;
      const report = {
        day: state.day,
        ...state.dayStats,
        serviceRevenue,
        salary,
        rent,
        utilities,
        tax,
        loanInterest,
        netProfit: Math.round(netProfit),
        reputation: state.reputation,
        spoiledBatches: decay.spoiledBatches
      };
      state.money += serviceRevenue - salary - rent - utilities - tax - loanInterest;
      state.history.unshift(report);
      if (state.history.length > 60) state.history.pop();
      if (report.netProfit >= 0) state.stats.positiveProfitStreak += 1;
      else state.stats.positiveProfitStreak = 0;
      const anyStockout = Object.keys(state.products).some((pid) => InventorySystem.totalQty(state, pid) === 0);
      if (anyStockout) state.stats.noStockoutStreak = 0;
      else state.stats.noStockoutStreak += 1;
      state.consecutiveNegativeDays = state.money < 0 ? state.consecutiveNegativeDays + 1 : 0;
      StaffSystem.updateMood(state, report.customersTotal);
      return report;
    },
    repayLoan(state, amount) {
      const pay = Math.min(amount, state.loan.principal, state.money);
      state.money -= pay;
      state.loan.principal -= pay;
      return pay;
    },
    takeLoan(state, amount) {
      state.loan.principal += amount;
      state.money += amount;
    }
  };

  // js/data/quests.js
  var dailyQuestPool = [
    { id: "dq_sell20", title: "B\xE1n 20 s\u1EA3n ph\u1EA9m", type: "dayProductsSold", target: 20, reward: 1e5 },
    { id: "dq_serve10", title: "Ph\u1EE5c v\u1EE5 10 kh\xE1ch", type: "dayCustomersServed", target: 10, reward: 1e5 },
    { id: "dq_noangry", title: "Kh\xF4ng \u0111\u1EC3 kh\xE1ch b\u1ECF \u0111i", type: "dayNoAngryLeave", target: 1, reward: 15e4 },
    { id: "dq_fresh5", title: "B\xE1n h\u1EBFt 5 batch h\xE0ng t\u01B0\u01A1i", type: "dayFreshBatchesSold", target: 5, reward: 1e5 },
    { id: "dq_5star3", title: "C\xF3 3 review 5 sao", type: "dayFiveStarReviews", target: 3, reward: 15e4 }
  ];
  var questTemplates = [
    { id: "q_serve100", title: "Ph\u1EE5c v\u1EE5 100 kh\xE1ch", type: "totalCustomersServed", target: 100, reward: 5e5 },
    { id: "q_rep70", title: "\u0110\u1EA1t uy t\xEDn 70", type: "reputation", target: 70, reward: 5e5 },
    { id: "q_services3", title: "M\u1EDF 3 d\u1ECBch v\u1EE5", type: "servicesCount", target: 3, reward: 6e5 },
    { id: "q_staff2", title: "Thu\xEA 2 nh\xE2n vi\xEAn", type: "staffCount", target: 2, reward: 4e5 },
    { id: "q_revenue100m", title: "\u0110\u1EA1t doanh thu 100 tri\u1EC7u", type: "totalRevenue", target: 1e8, reward: 1e6 }
  ];
  var achievementTemplates = [
    { id: "a_khai_truong", title: "\u{1F3EA} Khai tr\u01B0\u01A1ng", desc: "Ph\u1EE5c v\u1EE5 kh\xE1ch \u0111\u1EA7u ti\xEAn." },
    { id: "a_khong_hong_rau", title: "\u{1F96C} Kh\xF4ng \u0111\u1EC3 rau h\u1ECFng", desc: "B\xE1n h\u1EBFt 20 batch rau tr\u01B0\u1EDBc khi h\u1ECFng." },
    { id: "a_than_thien", title: "\u2B50 Ch\u1EE7 ti\u1EC7m th\xE2n thi\u1EC7n", desc: "Uy t\xEDn \u0111\u1EA1t 80." },
    { id: "a_cua_an_cua_de", title: "\u{1F4B0} C\xF3 c\u1EE7a \u0103n c\u1EE7a \u0111\u1EC3", desc: "T\u1ED5ng t\xE0i s\u1EA3n \u0111\u1EA1t 100 tri\u1EC7u." },
    { id: "a_dai_gia", title: "\u{1F451} \u0110\u1EA1i gia khu ph\u1ED1", desc: "T\u1ED5ng t\xE0i s\u1EA3n \u0111\u1EA1t 300 tri\u1EC7u \u2014 chi\u1EBFn th\u1EAFng!" },
    { id: "a_viral", title: "\u{1F525} Viral", desc: "C\xF3 m\u1ED9t review viral." },
    { id: "a_khach_quen", title: "\u{1F91D} Kh\xE1ch quen", desc: "C\xF3 20 kh\xE1ch loyalty cao (>=80)." },
    { id: "a_ong_trum", title: "\u{1F4E6} \xD4ng tr\xF9m nh\u1EADp h\xE0ng", desc: "Nh\u1EADp t\u1ED5ng c\u1ED9ng 10.000 s\u1EA3n ph\u1EA9m." }
  ];

  // js/systems/QuestSystem.js
  function progressFor(state, type) {
    switch (type) {
      case "totalCustomersServed":
        return state.stats.totalCustomersServed;
      case "reputation":
        return state.reputation;
      case "servicesCount":
        return Object.keys(state.services).filter((k) => state.services[k]).length;
      case "staffCount":
        return state.staff.length;
      case "totalRevenue":
        return state.stats.totalRevenueAllTime;
      case "dayProductsSold":
        return state.dayStats.productsSoldToday || 0;
      case "dayCustomersServed":
        return state.dayStats.customersTotal;
      case "dayNoAngryLeave":
        return state.dayStats.customersAngry === 0 && state.dayStats.customersTotal > 0 ? 1 : 0;
      case "dayFreshBatchesSold":
        return state._freshBatchesSoldToday || 0;
      case "dayFiveStarReviews":
        return state.reviews.filter((r) => r.day === state.day && r.stars === 5).length;
      default:
        return 0;
    }
  }
  var QuestSystem = {
    initDaily(state, rng) {
      const picks = [];
      const pool = [...dailyQuestPool];
      while (picks.length < 3 && pool.length) {
        const idx = rng.int(0, pool.length - 1);
        picks.push({ ...pool.splice(idx, 1)[0], progress: 0, done: false, claimed: false });
      }
      state.dailyQuests = picks;
    },
    ensureLongTerm(state) {
      if (state.quests.length) return;
      state.quests = questTemplates.map((q) => ({ ...q, progress: 0, done: false, claimed: false }));
    },
    update(state) {
      (state.dailyQuests || []).forEach((q) => {
        q.progress = progressFor(state, q.type);
        if (!q.done && q.progress >= q.target) q.done = true;
      });
      (state.quests || []).forEach((q) => {
        q.progress = progressFor(state, q.type);
        if (!q.done && q.progress >= q.target) q.done = true;
      });
    },
    claim(state, questId, daily) {
      const list = daily ? state.dailyQuests : state.quests;
      const q = (list || []).find((x) => x.id === questId);
      if (!q || !q.done || q.claimed) return { ok: false };
      state.money += q.reward;
      q.claimed = true;
      return { ok: true };
    }
  };

  // js/systems/AchievementSystem.js
  var AchievementSystem = {
    init(state) {
      achievementTemplates.forEach((a) => {
        if (!state.achievements[a.id]) state.achievements[a.id] = { ...a, unlocked: false };
      });
    },
    update(state) {
      const unlock = (id) => {
        const a = state.achievements[id];
        if (a && !a.unlocked) {
          a.unlocked = true;
          state.notifications = state.notifications || [];
          state.notifications.push(`\u{1F3C6} ${a.title}`);
        }
      };
      if (state.stats.totalCustomersServed >= 1) unlock("a_khai_truong");
      if (state.reputation >= 80) unlock("a_than_thien");
      if (computeAssets(state, equipment) >= 1e8) unlock("a_cua_an_cua_de");
      if (computeAssets(state, equipment) >= WIN_ASSETS) unlock("a_dai_gia");
      if (state.stats.hadViralReview) unlock("a_viral");
      if (Object.keys(state.stats.loyalCustomerIds).length >= 20) unlock("a_khach_quen");
      if (state.stats.totalRestocked >= 1e4) unlock("a_ong_trum");
      if (state.stats.freshBatchesSoldAllTime >= 20) unlock("a_khong_hong_rau");
    }
  };

  // js/systems/SaveSystem.js
  var PREFIX = "tiemnhatui_save_";
  var AUTO_SLOT = "auto";
  function checksum(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = h * 31 + str.charCodeAt(i) >>> 0;
    }
    return h.toString(36);
  }
  var SaveSystem = {
    save(slot, state) {
      try {
        const body = JSON.stringify(state);
        const payload = { version: SAVE_VERSION, timestamp: Date.now(), checksum: checksum(body), state };
        localStorage.setItem(PREFIX + slot, JSON.stringify(payload));
        return true;
      } catch (e) {
        return false;
      }
    },
    load(slot) {
      try {
        const raw = localStorage.getItem(PREFIX + slot);
        if (!raw) return null;
        const payload = JSON.parse(raw);
        const body = JSON.stringify(payload.state);
        if (checksum(body) !== payload.checksum) return null;
        if (payload.version !== SAVE_VERSION) return null;
        return payload.state;
      } catch (e) {
        return null;
      }
    },
    has(slot) {
      return !!localStorage.getItem(PREFIX + slot);
    },
    info(slot) {
      try {
        const raw = localStorage.getItem(PREFIX + slot);
        if (!raw) return null;
        const payload = JSON.parse(raw);
        return { timestamp: payload.timestamp, day: payload.state?.day, storeName: payload.state?.storeName, money: payload.state?.money };
      } catch (e) {
        return null;
      }
    },
    delete(slot) {
      localStorage.removeItem(PREFIX + slot);
    },
    exportSave(state) {
      const body = JSON.stringify(state);
      return JSON.stringify({ version: SAVE_VERSION, timestamp: Date.now(), checksum: checksum(body), state });
    },
    importSave(jsonText) {
      try {
        const payload = JSON.parse(jsonText);
        const body = JSON.stringify(payload.state);
        if (checksum(body) !== payload.checksum) return { ok: false, message: "File save kh\xF4ng h\u1EE3p l\u1EC7 (sai checksum)" };
        if (payload.version !== SAVE_VERSION) return { ok: false, message: "Phi\xEAn b\u1EA3n save kh\xF4ng t\u01B0\u01A1ng th\xEDch" };
        return { ok: true, state: payload.state };
      } catch (e) {
        return { ok: false, message: "File kh\xF4ng \u0111\u1ECDc \u0111\u01B0\u1EE3c" };
      }
    }
  };

  // js/core/GameEngine.js
  var GameEngine = class {
    constructor(state, world2, bus, rng) {
      this.state = state;
      this.world = world2;
      this.bus = bus;
      this.rng = rng;
      this.activeCustomerId = null;
      AchievementSystem.init(this.state);
      QuestSystem.ensureLongTerm(this.state);
    }
    emit(evt, payload) {
      this.bus.emit(evt, payload);
    }
    /** spec §47: update loop — chỉ chạy khi cửa hàng đang OPEN. */
    update(dtSeconds) {
      const state = this.state;
      if (state.gameOver) return;
      if (state.phase !== DAY_PHASES.OPEN) {
        this.world.update(dtSeconds, state);
        this.world.syncWithState(state, this.activeCustomerId);
        this.world.syncStaff(state);
        return;
      }
      const beforeMinutes = state.time * 60;
      TimeSystem.update(state, dtSeconds);
      const dtGameMinutes = state.time * 60 - beforeMinutes;
      this._updatePatience(dtGameMinutes);
      this._maybeSpawnCustomers(dtGameMinutes);
      DramaSystem.maybeTrigger(state, this.rng, dtGameMinutes);
      this.world.update(dtSeconds, state);
      this.world.syncWithState(state, this.activeCustomerId);
      this.world.syncStaff(state);
      QuestSystem.update(state);
      AchievementSystem.update(state);
      if (TimeSystem.isClosingTime(state)) this.dispatch({ type: "CLOSE_STORE" });
    }
    _updatePatience(dtGameMinutes) {
      const state = this.state;
      [...state.customers].forEach((c) => {
        if (c.id === this.activeCustomerId) return;
        c.patience = Math.max(0, c.patience - dtGameMinutes);
        if (c.patience <= 0) {
          this.world.customerActors.find((a) => a.customerId === c.id)?.say("Th\xF4i, em mua ch\u1ED7 kh\xE1c.");
          OrderSystem.cancelOrder(state, c.id, "impatience");
          if (this.activeCustomerId === c.id) this.activeCustomerId = null;
        }
      });
    }
    _maybeSpawnCustomers(dtGameMinutes) {
      const state = this.state;
      if (state.customers.length >= 6) return;
      const perHour = CustomerSystem.spawnRatePerHour(state);
      const chance = perHour / 60 * dtGameMinutes;
      if (this.rng.chance(Math.min(0.9, chance))) {
        const c = CustomerSystem.spawn(state, this.rng);
        this.emit("customer:spawned", c);
      }
    }
    dispatch(action) {
      const state = this.state;
      switch (action.type) {
        case "START_DAY":
          this._startDay();
          break;
        case "OPEN_STORE":
          this._openStore();
          break;
        case "CLOSE_STORE":
          this._closeStore();
          break;
        case "BUY_STOCK":
          this._buyStock(action.payload);
          break;
        case "SET_PRICE":
          PricingSystem.setPrice(state, action.payload.productId, action.payload.value);
          break;
        case "SET_GROUP_PRICE":
          PricingSystem.bulkAdjust(state, action.payload.pct);
          break;
        case "TOGGLE_FRESH_SALE":
          state.settings.freshSaleEnabled = !state.settings.freshSaleEnabled;
          break;
        case "SERVE_CUSTOMER":
          this.activeCustomerId = action.payload.customerId;
          this._customerStatus(action.payload.customerId, "counter");
          break;
        case "SELL_PRODUCT": {
          const r = OrderSystem.sellProduct(state, action.payload.customerId, action.payload.productId);
          if (r.ok) {
            const p = this._customerActorXY(action.payload.customerId);
            this.world.particles.spawn(p.x, p.y - 24, "\u2713", "#3f8a4a");
          }
          this.emit("sell:result", { ...action.payload, result: r });
          break;
        }
        case "RETURN_PRODUCT":
          OrderSystem.returnProduct(state, action.payload.customerId, action.payload.productId);
          break;
        case "COMPLETE_ORDER": {
          const result = OrderSystem.completeOrder(state, action.payload.customerId);
          if (result) {
            const p = this._customerActorXY(action.payload.customerId);
            this.world.particles.spawn(p.x, p.y - 20, `+${Math.round(result.revenue).toLocaleString("vi-VN")}\u0111`, "#2e7d32");
            if (result.review?.stars >= 4) this.world.particles.spawn(p.x, p.y - 34, "\u2B50 h\xE0i l\xF2ng", "#d8a53d");
          }
          if (this.activeCustomerId === action.payload.customerId) this.activeCustomerId = null;
          this.emit("order:completed", result);
          break;
        }
        case "CANCEL_ORDER":
          OrderSystem.cancelOrder(state, action.payload.customerId, "cancelled");
          if (this.activeCustomerId === action.payload.customerId) this.activeCustomerId = null;
          break;
        case "HIRE_STAFF":
          this._hireStaff(action.payload);
          break;
        case "FIRE_STAFF":
          StaffSystem.fire(state, action.payload.staffId);
          break;
        case "BUY_EQUIPMENT":
          this.emit("action:result", { type: action.type, result: EquipmentSystem.buy(state, action.payload.id) });
          break;
        case "BUY_AD":
          this.emit("action:result", { type: action.type, result: AdvertisingSystem.launch(state, action.payload.id) });
          break;
        case "START_SERVICE":
          this.emit("action:result", { type: action.type, result: ServiceSystem.unlock(state, action.payload.id) });
          break;
        case "REPLY_REVIEW":
          ReviewSystem.reply(state, action.payload.reviewId, action.payload.text);
          break;
        case "RESOLVE_EVENT":
          this._resolveEvent(action.payload.choiceIndex);
          break;
        case "RESOLVE_DRAMA":
          this._resolveDrama(action.payload.choiceIndex);
          break;
        case "TAKE_LOAN":
          EconomySystem.takeLoan(state, action.payload.amount);
          break;
        case "REPAY_LOAN":
          EconomySystem.repayLoan(state, action.payload.amount);
          break;
        case "CLAIM_QUEST":
          this.emit("action:result", { type: action.type, result: QuestSystem.claim(state, action.payload.questId, action.payload.daily) });
          break;
        case "SET_SPEED":
          state.timeSpeed = action.payload.speed;
          break;
        case "SAVE_GAME":
          SaveSystem.save(action.payload.slot, state);
          break;
        default:
          break;
      }
      this.emit("state:changed", action.type);
    }
    _customerActorXY(customerId) {
      const a = this.world.customerActors.find((x) => x.customerId === customerId);
      return a ? { x: a.x, y: a.y } : { x: 40, y: 40 };
    }
    _customerStatus(customerId, status) {
      const c = this.state.customers.find((x) => x.id === customerId);
      if (c) c.status = status;
    }
    _startDay() {
      const state = this.state;
      state.phase = DAY_PHASES.PREP;
      state.time = OPEN_HOUR;
      state.dayStats = freshDayStats();
      state.customers = [];
      this.activeCustomerId = null;
      MarketSystem.rollWeather(state, this.rng);
      EventSystem.applyDuePending(state, this.rng);
      QuestSystem.initDaily(state, this.rng);
      const triggered = EventSystem.maybeTriggerDaily(state, this.rng);
      if (!triggered) MarketSystem.rollDailyMarket(state, this.rng);
      this.emit("day:started", state.day);
    }
    _openStore() {
      const state = this.state;
      if (state.activeEvent) return;
      state.phase = DAY_PHASES.OPEN;
      this.emit("store:opened", state.day);
    }
    _closeStore() {
      const state = this.state;
      state.phase = DAY_PHASES.REPORT;
      [...state.customers].forEach((c) => OrderSystem.cancelOrder(state, c.id, "closing"));
      this.activeCustomerId = null;
      const report = EconomySystem.closeDay(state);
      QuestSystem.update(state);
      AchievementSystem.update(state);
      state.day += 1;
      if (state.consecutiveNegativeDays >= 3) state.gameOver = "bankrupt";
      else if (computeAssets(state, equipment) >= WIN_ASSETS) state.gameOver = "win";
      AdvertisingSystem.tick(state);
      this.emit("day:report", report);
    }
    _buyStock(payload) {
      const state = this.state;
      const buyPrice = state.market[payload.productId]?.buyPrice || state.products[payload.productId]?.cost || 0;
      const totalCost = buyPrice * payload.quantity;
      if (state.money < totalCost) {
        this.emit("toast", "Kh\xF4ng \u0111\u1EE7 ti\u1EC1n nh\u1EADp h\xE0ng");
        return;
      }
      state.money -= totalCost;
      InventorySystem.addBatch(state, payload.productId, payload.quantity, buyPrice);
    }
    _hireStaff(payload) {
      const state = this.state;
      const fee = payload.candidate.salary * 3;
      if (state.money < fee) {
        this.emit("toast", "Kh\xF4ng \u0111\u1EE7 ti\u1EC1n tuy\u1EC3n d\u1EE5ng");
        return;
      }
      state.money -= fee;
      StaffSystem.hire(state, payload.candidate);
    }
    _resolveEvent(choiceIndex) {
      const state = this.state;
      const info = EventSystem.resolveChoice(state, choiceIndex, this.rng);
      if (info?.priceSuggestion) PricingSystem.bulkAdjust(state, info.priceSuggestion);
      if (info?.delayOpenHours) state.time = Math.min(CLOSE_HOUR, OPEN_HOUR + info.delayOpenHours);
      if (!state.activeEvent) MarketSystem.rollDailyMarket(state, this.rng);
      if (info?.closeToday) {
        this._closeStore();
        this.emit("event:resolved", info);
        return;
      }
      this.emit("event:resolved", info);
    }
    _resolveDrama(choiceIndex) {
      const state = this.state;
      const info = DramaSystem.resolveChoice(state, choiceIndex, this.rng);
      if (info?.priceSuggestion) PricingSystem.bulkAdjust(state, info.priceSuggestion);
      if (info?.viral) state.stats.hadViralReview = true;
      if (info?.impulsePurchase && this.activeCustomerId) {
        const c = state.customers.find((x) => x.id === this.activeCustomerId);
        if (c) c.mood = Math.min(100, c.mood + 10);
      }
      this.emit("drama:resolved", info);
    }
  };

  // js/world/Counter.js
  var Counter = class {
    constructor(worldW, worldH) {
      this.x = worldW / 2 - 70;
      this.y = worldH / 2 - 20;
      this.w = 140;
      this.h = 46;
      this.queueSpot = (index) => ({
        x: this.x + this.w / 2 - 70 - index * 26,
        y: this.y + this.h + 30 + index % 2 * 18
      });
      this.serviceSpot = { x: this.x + this.w / 2, y: this.y + this.h + 14 };
      this.doorSpot = { x: 24, y: worldH - 40 };
      this.exitSpot = { x: 24, y: worldH - 40 };
    }
  };

  // js/world/Shelf.js
  function buildShelves(worldW, worldH) {
    const cols = 5;
    const shelfW = 64, shelfH = 34, gapX = 14, gapY = 14;
    const startX = worldW - cols * (shelfW + gapX) - 20;
    const startY = 24;
    return categories.map((cat, i) => ({
      cat,
      x: startX + i % cols * (shelfW + gapX),
      y: startY + Math.floor(i / cols) * (shelfH + gapY),
      w: shelfW,
      h: shelfH
    }));
  }

  // js/world/CustomerActor.js
  var seed = 1;
  var CustomerActor = class {
    constructor(customer, doorSpot) {
      this.customerId = customer.id;
      this.x = doorSpot.x;
      this.y = doorSpot.y;
      this.targetX = doorSpot.x;
      this.targetY = doorSpot.y;
      this.state = "WALK_IN";
      this.speed = 46 + (seed = (seed * 9301 + 49297) % 233280) / 233280 * 24;
      this.body = { skin: ["#f0c99a", "#e0ab73", "#c98a55"][Math.floor(Math.random() * 3)], outfit: ["#d9622b", "#3f8a4a", "#2b6ad9", "#d8a53d", "#8a4ad8"][Math.floor(Math.random() * 5)] };
      this.animTime = 0;
      this.bubble = null;
      this.bubbleTimer = 0;
    }
    moveTo(target) {
      this.targetX = target.x;
      this.targetY = target.y;
    }
    arrived(threshold = 4) {
      return distance(this.x, this.y, this.targetX, this.targetY) < threshold;
    }
    update(dt, logicalStatus) {
      this.animTime += dt;
      const d = distance(this.x, this.y, this.targetX, this.targetY);
      if (d > 1) {
        const t = Math.min(1, this.speed * dt / d);
        this.x = lerp(this.x, this.targetX, t);
        this.y = lerp(this.y, this.targetY, t);
      }
      if (this.bubbleTimer > 0) {
        this.bubbleTimer -= dt;
        if (this.bubbleTimer <= 0) this.bubble = null;
      }
      if (logicalStatus === "shopping" && this.state !== "SHOPPING" && this.state !== "WALK_OUT") this.state = "SHOPPING";
      if (logicalStatus === "done" && this.state !== "HAPPY" && this.state !== "WALK_OUT") this.state = "PAYING";
      if (logicalStatus === "left" && this.state !== "ANGRY" && this.state !== "WALK_OUT") this.state = "ANGRY";
    }
    say(text, seconds = 2.2) {
      this.bubble = text;
      this.bubbleTimer = seconds;
    }
    isWalking() {
      return distance(this.x, this.y, this.targetX, this.targetY) > 1;
    }
  };

  // js/world/StaffActor.js
  var StaffActor = class {
    constructor(staff, spot) {
      this.staffId = staff.id;
      this.role = staff.role;
      this.x = spot.x;
      this.y = spot.y;
      this.targetX = spot.x;
      this.targetY = spot.y;
      this.animTime = 0;
      this.outfit = ["#2b6ad9", "#d9622b", "#3f8a4a", "#8a4ad8"][["cashier", "stocker", "guard", "shipper"].indexOf(staff.role) % 4];
    }
    moveTo(target) {
      this.targetX = target.x;
      this.targetY = target.y;
    }
    update(dt) {
      this.animTime += dt;
      const d = distance(this.x, this.y, this.targetX, this.targetY);
      if (d > 1) {
        const t = Math.min(1, 40 * dt / d);
        this.x = lerp(this.x, this.targetX, t);
        this.y = lerp(this.y, this.targetY, t);
      }
    }
  };

  // js/world/ParticleSystem.js
  var ParticleSystem = class {
    constructor() {
      this.particles = [];
    }
    spawn(x, y, text, color = "#2e2420") {
      this.particles.push({ x, y, text, color, life: 1.4, age: 0 });
    }
    update(dt) {
      this.particles.forEach((p) => {
        p.age += dt;
        p.y -= dt * 22;
      });
      this.particles = this.particles.filter((p) => p.age < p.life);
    }
    render(ctx) {
      ctx.save();
      ctx.font = "bold 13px Segoe UI, sans-serif";
      ctx.textAlign = "center";
      this.particles.forEach((p) => {
        const alpha = Math.max(0, 1 - p.age / p.life);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.x, p.y);
      });
      ctx.restore();
    }
  };

  // js/world/World.js
  var WORLD_W = 800;
  var WORLD_H = 420;
  var World = class {
    constructor() {
      this.counter = new Counter(WORLD_W, WORLD_H);
      this.shelves = buildShelves(WORLD_W, WORLD_H);
      this.customerActors = [];
      this.staffActors = [];
      this.particles = new ParticleSystem();
    }
    /** Đồng bộ actor hiển thị với GameState (nguồn sự thật duy nhất) — World không tự ý đổi logic nghiệp vụ. */
    syncWithState(state, activeCustomerId) {
      const liveIds = new Set(state.customers.map((c) => c.id));
      this.customerActors.forEach((a) => {
        if (!liveIds.has(a.customerId) && a.state !== "WALK_OUT") {
          a.state = "WALK_OUT";
          a.moveTo(this.counter.exitSpot);
        }
      });
      state.customers.forEach((c) => {
        if (!this.customerActors.find((a) => a.customerId === c.id)) {
          const actor = new CustomerActor(c, this.counter.doorSpot);
          this.customerActors.push(actor);
        }
      });
      let queueIndex = 0;
      this.customerActors.forEach((a) => {
        const c = state.customers.find((x) => x.id === a.customerId);
        if (!c) return;
        if (c.id === activeCustomerId) {
          a.moveTo(this.counter.serviceSpot);
          if (a.arrived(6)) a.state = a.state === "WALK_IN" || a.state === "QUEUE" ? "APPROACH_COUNTER" : a.state;
        } else {
          a.moveTo(this.counter.queueSpot(queueIndex));
          if (a.state === "WALK_IN" && a.arrived(6)) a.state = "QUEUE";
          queueIndex += 1;
        }
      });
    }
    syncStaff(state) {
      state.staff.forEach((s, i) => {
        if (!this.staffActors.find((a) => a.staffId === s.id)) {
          const spot = { x: this.counter.x + 20 + i * 18, y: this.counter.y - 16 };
          this.staffActors.push(new StaffActor(s, spot));
        }
      });
      this.staffActors = this.staffActors.filter((a) => state.staff.some((s) => s.id === a.staffId));
    }
    update(dt, state) {
      this.customerActors.forEach((a) => {
        const c = state.customers.find((x) => x.id === a.customerId);
        a.update(dt, c ? c.status : "left");
      });
      this.customerActors = this.customerActors.filter((a) => {
        if (a.state === "WALK_OUT" && a.arrived(5)) return false;
        return true;
      });
      this.staffActors.forEach((a) => a.update(dt));
      this.particles.update(dt);
    }
  };

  // js/render/WorldRenderer.js
  var WorldRenderer = {
    drawBackground(ctx, state) {
      const isEvening = state.time >= 18;
      const sky = isEvening ? ["#2b2440", "#4a3b63"] : ["#bfe3f2", "#e8f6e0"];
      const grad = ctx.createLinearGradient(0, 0, 0, WORLD_H);
      grad.addColorStop(0, sky[0]);
      grad.addColorStop(1, sky[1]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
      ctx.fillStyle = "#d7c6a8";
      ctx.fillRect(0, WORLD_H - 60, WORLD_W, 60);
      ctx.strokeStyle = "rgba(0,0,0,0.08)";
      for (let x = 0; x < WORLD_W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, WORLD_H - 60);
        ctx.lineTo(x, WORLD_H);
        ctx.stroke();
      }
      ctx.fillStyle = "#7a5230";
      ctx.fillRect(4, WORLD_H - 92, 44, 32);
      ctx.fillStyle = "#fdf6e8";
      ctx.font = "11px Segoe UI";
      ctx.fillText("C\u1EECA", 10, WORLD_H - 76);
    },
    drawCounter(ctx, counter) {
      ctx.fillStyle = "#8a5a34";
      ctx.fillRect(counter.x, counter.y, counter.w, counter.h);
      ctx.fillStyle = "#c99a66";
      ctx.fillRect(counter.x, counter.y, counter.w, 8);
      ctx.fillStyle = "#2e2420";
      ctx.font = "bold 12px Segoe UI";
      ctx.textAlign = "center";
      ctx.fillText("QU\u1EA6Y", counter.x + counter.w / 2, counter.y + counter.h / 2 + 4);
    },
    drawShelves(ctx, shelves) {
      shelves.forEach((s) => {
        ctx.fillStyle = "#efe2c9";
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.strokeStyle = "#c7a96f";
        ctx.strokeRect(s.x, s.y, s.w, s.h);
        ctx.font = "18px Segoe UI";
        ctx.textAlign = "center";
        ctx.fillText(s.cat.icon, s.x + s.w / 2, s.y + s.h / 2 + 7);
      });
    }
  };

  // js/render/CharacterRenderer.js
  var CharacterRenderer = {
    drawCustomer(ctx, actor, logicalCustomer) {
      const bounce = actor.isWalking() ? Math.sin(actor.animTime * 10) * 2 : Math.sin(actor.animTime * 2) * 1;
      const x = actor.x, y = actor.y + bounce;
      drawPerson(ctx, x, y, actor.body.skin, actor.body.outfit);
      if (logicalCustomer) {
        const ratio = logicalCustomer.maxPatience ? logicalCustomer.patience / logicalCustomer.maxPatience : 1;
        ctx.fillStyle = ratio < 0.3 ? "#c0392b" : ratio < 0.6 ? "#d8a53d" : "#3f8a4a";
        ctx.fillRect(x - 12, y - 34, 24 * Math.max(0, ratio), 3);
        ctx.strokeStyle = "rgba(0,0,0,0.3)";
        ctx.strokeRect(x - 12, y - 34, 24, 3);
        const emoji = actor.state === "ANGRY" ? "\u{1F620}" : actor.state === "HAPPY" ? "\u{1F60A}" : ratio < 0.3 ? "\u{1F620}" : ratio < 0.6 ? "\u{1F610}" : "\u{1F642}";
        ctx.font = "14px Segoe UI";
        ctx.textAlign = "center";
        ctx.fillText(emoji, x, y - 38);
      }
      if (actor.bubble) {
        ctx.font = "11px Segoe UI";
        ctx.textAlign = "center";
        const w = Math.min(160, ctx.measureText(actor.bubble).width + 16);
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.strokeStyle = "#d9622b";
        roundRect(ctx, x - w / 2, y - 64, w, 22, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#2e2420";
        ctx.fillText(actor.bubble, x, y - 49, w - 8);
      }
      ctx.font = "9px Segoe UI";
      ctx.fillStyle = "#2e2420";
      ctx.textAlign = "center";
      if (logicalCustomer) ctx.fillText(logicalCustomer.name, x, y + 16);
    },
    drawStaff(ctx, actor, staff) {
      const bounce = Math.sin(actor.animTime * 3) * 1;
      drawPerson(ctx, actor.x, actor.y + bounce, "#e0ab73", actor.outfit);
      ctx.font = "9px Segoe UI";
      ctx.fillStyle = "#2e2420";
      ctx.textAlign = "center";
      if (staff) ctx.fillText(staff.name.split(" ").pop(), actor.x, actor.y + 16);
    }
  };
  function drawPerson(ctx, x, y, skin, outfit) {
    ctx.fillStyle = outfit;
    ctx.fillRect(x - 6, y - 14, 12, 16);
    ctx.beginPath();
    ctx.arc(x, y - 20, 6, 0, Math.PI * 2);
    ctx.fillStyle = skin;
    ctx.fill();
    ctx.fillStyle = "#2e2420";
    ctx.fillRect(x - 6, y + 2, 4, 8);
    ctx.fillRect(x + 2, y + 2, 4, 8);
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // js/render/UIOverlay.js
  var UIOverlay = {
    drawDebug(ctx, info) {
      const lines = [
        `FPS: ${info.fps.toFixed(0)}`,
        `GAME TIME: Ng\xE0y ${info.day} \u2014 ${info.timeLabel}`,
        `CUSTOMERS: ${info.customers}`,
        `QUEUE: ${info.queue}`,
        `MONEY: ${info.money.toLocaleString("vi-VN")}\u0111`,
        `SPAWN RATE: ${info.spawnRate.toFixed(1)}/gi\u1EDD`,
        `EVENT: ${info.event || "-"}`
      ];
      ctx.save();
      ctx.font = "11px monospace";
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillRect(6, 6, 190, lines.length * 14 + 10);
      ctx.fillStyle = "#9CFF9C";
      lines.forEach((l, i) => ctx.fillText(l, 12, 20 + i * 14));
      ctx.restore();
    }
  };

  // js/render/Renderer.js
  var Renderer = class {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.debug = false;
      this._fps = 0;
    }
    resize() {
      const dpr = window.devicePixelRatio || 1;
      const cssW = this.canvas.clientWidth || WORLD_W;
      const scale = cssW / WORLD_W;
      this.canvas.width = WORLD_W * dpr;
      this.canvas.height = WORLD_H * dpr;
      this.canvas.style.height = `${WORLD_H * scale}px`;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    clear() {
      this.ctx.clearRect(0, 0, WORLD_W, WORLD_H);
    }
    drawWorld(state) {
      WorldRenderer.drawBackground(this.ctx, state);
    }
    drawShelves(world2) {
      WorldRenderer.drawShelves(this.ctx, world2.shelves);
      WorldRenderer.drawCounter(this.ctx, world2.counter);
    }
    drawCustomers(world2, state) {
      world2.customerActors.forEach((a) => {
        const c = state.customers.find((x) => x.id === a.customerId);
        CharacterRenderer.drawCustomer(this.ctx, a, c);
      });
      world2.staffActors.forEach((a) => {
        const s = state.staff.find((x) => x.id === a.staffId);
        CharacterRenderer.drawStaff(this.ctx, a, s);
      });
    }
    drawEffects(world2) {
      world2.particles.render(this.ctx);
    }
    drawUI(debugInfo) {
      if (this.debug && debugInfo) UIOverlay.drawDebug(this.ctx, debugInfo);
    }
    frame(world2, state, debugInfo) {
      this.clear();
      this.drawWorld(state);
      this.drawShelves(world2);
      this.drawCustomers(world2, state);
      this.drawEffects(world2);
      this.drawUI(debugInfo);
    }
  };

  // js/ui/TitleScreen.js
  var MOVERS = ["\u{1F6B6}", "\u{1F6F5}", "\u{1F475}", "\u{1F9D1}", "\u{1F467}", "\u{1F9D3}", "\u{1F6B2}"];
  function renderTitleScreen(container, handlers) {
    const hasContinue = SaveSystem.has(AUTO_SLOT);
    container.innerHTML = `
    <div class="street-scene" id="streetScene"></div>
    <div class="signboard">
      <h1>\u{1F3EA} TI\u1EC6M NH\xC0 TUI</h1>
      <p>"Bu\xF4n b\xE1n c\xF3 t\xE2m, kh\xE1ch th\u01B0\u01A1ng d\xE0i l\xE2u"</p>
    </div>
    <div class="title-buttons">
      <button class="btn" id="btnStart">\u25B6 B\u1EAET \u0110\u1EA6U CH\u01A0I</button>
      <button class="btn secondary" id="btnContinue" ${hasContinue ? "" : "disabled"}>\u25A3 CH\u01A0I TI\u1EBEP</button>
      <button class="btn secondary" id="btnSettings">\u2699 C\xC0I \u0110\u1EB6T</button>
      <button class="btn secondary" id="btnHelp">? H\u01AF\u1EDANG D\u1EAAN</button>
      <button class="btn secondary" id="btnAchievements">\u{1F3C6} TH\xC0NH T\xCDCH</button>
    </div>
  `;
    const scene = container.querySelector("#streetScene");
    for (let i = 0; i < 5; i++) {
      const el = document.createElement("div");
      el.className = "mover bob";
      el.textContent = MOVERS[i % MOVERS.length];
      el.style.left = `${i * 12}%`;
      el.style.animationDuration = `${14 + i * 3}s`;
      el.style.animationDelay = `-${i * 4}s`;
      scene.appendChild(el);
    }
    ["\u{1F333}", "\u{1F3E0}", "\u{1F3E0}", "\u{1F333}"].forEach((s, i) => {
      const el = document.createElement("div");
      el.className = s === "\u{1F333}" ? "tree" : "house";
      el.textContent = s;
      el.style.left = `${8 + i * 24}%`;
      scene.appendChild(el);
    });
    const wire = document.createElement("div");
    wire.className = "wire";
    scene.appendChild(wire);
    container.querySelector("#btnStart").onclick = handlers.onStart;
    container.querySelector("#btnContinue").onclick = handlers.onContinue;
    container.querySelector("#btnSettings").onclick = () => showSettingsModal(handlers);
    container.querySelector("#btnHelp").onclick = () => showHelpModal();
    container.querySelector("#btnAchievements").onclick = () => showAchievementsModal();
  }
  function modal(html) {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `<div class="modal-box">${html}</div>`;
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
    return overlay;
  }
  function showSettingsModal(handlers) {
    const s = handlers.getSettings ? handlers.getSettings() : { sound: true, music: true, vibration: true };
    const overlay = modal(`
    <h2>\u2699 C\xE0i \u0111\u1EB7t</h2>
    <label style="display:block;margin-bottom:8px;"><input type="checkbox" id="cfgSound" ${s.sound ? "checked" : ""}/> \xC2m thanh (SFX)</label>
    <label style="display:block;margin-bottom:8px;"><input type="checkbox" id="cfgMusic" ${s.music ? "checked" : ""}/> Nh\u1EA1c n\u1EC1n</label>
    <label style="display:block;margin-bottom:12px;"><input type="checkbox" id="cfgVibration" ${s.vibration ? "checked" : ""}/> Rung (mobile)</label>
    <button class="btn block" id="cfgClose">\u0110\xF3ng</button>
  `);
    const save = () => handlers.onSettingsChange?.({
      sound: overlay.querySelector("#cfgSound").checked,
      music: overlay.querySelector("#cfgMusic").checked,
      vibration: overlay.querySelector("#cfgVibration").checked
    });
    overlay.querySelectorAll("input").forEach((i) => i.addEventListener("change", save));
    overlay.querySelector("#cfgClose").onclick = () => overlay.remove();
  }
  function showHelpModal() {
    modal(`
    <h2>? H\u01B0\u1EDBng d\u1EABn ch\u01A1i</h2>
    <p>M\u1ED7i ng\xE0y t\u1EEB 06:30\u201321:30: nh\u1EADp h\xE0ng, \u0111\u1EB7t gi\xE1, m\u1EDF c\u1EEDa r\u1ED3i ph\u1EE5c v\u1EE5 kh\xE1ch l\u1EA7n l\u01B0\u1EE3t.</p>
    <p>Ch\u1ECDn kh\xE1ch trong h\xE0ng ch\u1EDD, l\u1EA5y \u0111\xFAng m\xF3n kh\xE1ch y\xEAu c\u1EA7u tr\u01B0\u1EDBc khi kh\xE1ch h\u1EBFt ki\xEAn nh\u1EABn, r\u1ED3i b\u1EA5m Thanh to\xE1n.</p>
    <p>H\xE0ng h\xF3a theo l\xF4 (batch) c\xF3 h\u1EA1n s\u1EED d\u1EE5ng \u2014 h\u1EC7 th\u1ED1ng lu\xF4n b\xE1n l\xF4 s\u1EAFp h\u1EBFt h\u1EA1n tr\u01B0\u1EDBc.</p>
    <p>Cu\u1ED1i ng\xE0y s\u1EBD c\xF3 b\xE1o c\xE1o l\xE3i/l\u1ED7. D\xF9ng ti\u1EC1n l\xE3i \u0111\u1EC3 thu\xEA nh\xE2n vi\xEAn, mua thi\u1EBFt b\u1ECB, m\u1EDF d\u1ECBch v\u1EE5, ch\u1EA1y qu\u1EA3ng c\xE1o.</p>
    <p>M\u1EE5c ti\xEAu: \u0111\u1EA1t t\u1ED5ng t\xE0i s\u1EA3n 300.000.000\u0111. \u0110\u1EC3 ti\u1EC1n \xE2m 3 ng\xE0y li\xEAn ti\u1EBFp s\u1EBD ph\xE1 s\u1EA3n.</p>
    <button class="btn block" id="helpClose">\u0110\xE3 hi\u1EC3u</button>
  `).querySelector("#helpClose").onclick = (e) => e.target.closest(".modal-overlay").remove();
  }
  function showAchievementsModal() {
    modal(`
    <h2>\u{1F3C6} Danh s\xE1ch th\xE0nh t\u1EF1u</h2>
    ${achievementTemplates.map((a) => `<div class="ach-card"><b>${a.title}</b><div class="muted">${a.desc}</div></div>`).join("")}
    <p class="muted">Tr\u1EA1ng th\xE1i m\u1EDF kh\xF3a hi\u1EC3n th\u1ECB trong v\xE1n ch\u01A1i c\u1EE7a b\u1EA1n, \u1EDF tab Nhi\u1EC7m v\u1EE5.</p>
    <button class="btn block" id="achClose">\u0110\xF3ng</button>
  `).querySelector("#achClose").onclick = (e) => e.target.closest(".modal-overlay").remove();
  }

  // js/ui/NewGameScreen.js
  function renderNewGameScreen(container, handlers) {
    container.innerHTML = `
    <div class="signboard" style="max-width:420px;">
      <h1 style="font-size:22px;">CH\xC0O M\u1EEANG \u0110\u1EBEN KHU PH\u1ED0</h1>
      <p style="font-style:normal;margin-top:10px;">B\u1EA1n v\u1EEBa thu\xEA \u0111\u01B0\u1EE3c m\u1ED9t m\u1EB7t b\u1EB1ng nh\u1ECF.<br/>
      V\u1ED1n kh\u1EDFi nghi\u1EC7p: <b>30.000.000\u0111</b><br/>
      M\u1EE5c ti\xEAu: <b>300.000.000\u0111</b> t\u1ED5ng t\xE0i s\u1EA3n<br/>
      H\xE3y bi\u1EBFn ti\u1EC7m nh\u1ECF th\xE0nh c\u1EEDa h\xE0ng \u0111\u01B0\u1EE3c c\u1EA3 khu ph\u1ED1 y\xEAu th\xEDch.</p>
      <div style="margin-top:16px;text-align:left;">
        <label style="font-size:13px;font-weight:700;">T\xEAn ti\u1EC7m:</label>
        <input type="text" id="storeNameInput" placeholder="VD: Ti\u1EC7m Nh\xE0 Tui" maxlength="30" style="width:100%;margin-top:6px;"/>
      </div>
      <button class="btn block" id="btnLaunch" style="margin-top:16px;">\u{1F389} KHAI TR\u01AF\u01A0NG</button>
      <button class="btn secondary block" id="btnBack" style="margin-top:8px;">\u2190 Quay l\u1EA1i</button>
    </div>
  `;
    container.querySelector("#btnLaunch").onclick = () => {
      const name = container.querySelector("#storeNameInput").value.trim() || "Ti\u1EC7m Nh\xE0 Tui";
      handlers.onConfirm(name);
    };
    container.querySelector("#btnBack").onclick = handlers.onBack;
  }

  // js/ui/CustomerUI.js
  function renderQueueStrip(container, engine2, refresh) {
    const state = engine2.state;
    if (!state.customers.length) {
      container.innerHTML = `<span class="muted" style="padding:6px;">Ch\u01B0a c\xF3 kh\xE1ch... \u0111ang ch\u1EDD kh\xE1ch gh\xE9 \u{1F642}</span>`;
      return;
    }
    container.innerHTML = state.customers.map((c) => {
      const pct = Math.round(c.patience / c.maxPatience * 100);
      const cls = pct < 30 ? "low" : pct < 60 ? "mid" : "";
      return `<div class="queue-chip ${engine2.activeCustomerId === c.id ? "active" : ""}" data-cid="${c.id}">
      <b>${c.name}</b><br/><span class="muted">${c.personality}</span>
      <div class="patience-bar ${cls}"><div style="width:${pct}%"></div></div>
    </div>`;
    }).join("");
    container.querySelectorAll(".queue-chip").forEach((el) => {
      el.onclick = () => {
        engine2.dispatch({ type: "SERVE_CUSTOMER", payload: { customerId: el.dataset.cid } });
        refresh();
      };
    });
  }
  function renderOrderPanel(container, engine2, refresh) {
    const state = engine2.state;
    const customer = state.customers.find((c) => c.id === engine2.activeCustomerId);
    if (!customer) {
      container.innerHTML = `<div class="empty-hint">Ch\u1ECDn m\u1ED9t kh\xE1ch \u1EDF h\xE0ng ch\u1EDD ph\xEDa tr\xEAn \u0111\u1EC3 b\u1EAFt \u0111\u1EA7u ph\u1EE5c v\u1EE5.</div>`;
      return;
    }
    const shelves = categories.map((cat) => {
      const items = products.filter((p) => p.category === cat.id);
      return `<div class="shelf-group"><div class="label">${cat.icon} ${cat.name}</div>${items.map((p) => {
        const qty = InventorySystem.totalQty(state, p.id);
        const price = PricingSystem.effectivePrice(state, p.id);
        const needed = customer.cart.find((l) => l.productId === p.id && l.fulfilled < l.quantity);
        return `<div class="product-chip ${qty === 0 ? "disabled" : ""} ${needed ? "needed" : ""}" data-pid="${qty === 0 ? "" : p.id}" title="${p.name}">
        <span class="ic">${p.icon}</span><span class="q">${qty === 0 ? "H\u1EBFt" : qty}</span><span>${formatMoney(price)}</span>
      </div>`;
      }).join("")}</div>`;
    }).join("");
    container.innerHTML = `
    <div class="order-box">
      <div style="margin-bottom:6px;"><b>${customer.name}</b> (${customer.personality})<br/>${CustomerSystem.orderSpeechText(state, customer)}</div>
      ${customer.cart.map((l) => {
      const p = state.products[l.productId];
      const done = l.fulfilled >= l.quantity;
      return `<div class="order-line ${done ? "complete" : ""}">${p?.icon || ""} ${p?.name || l.productId} \u2014 ${l.fulfilled}/${l.quantity}
          ${l.fulfilled > 0 ? `<button class="btn secondary small" data-return="${l.productId}">B\u1ECF m\xF3n</button>` : ""}</div>`;
    }).join("")}
      <div style="display:flex;gap:8px;margin-top:8px;">
        <button class="btn success block" id="btnComplete">\u2705 Thanh to\xE1n</button>
        <button class="btn danger block" id="btnCancel">\u2716 H\u1EE7y \u0111\u01A1n</button>
      </div>
    </div>
    <div>${shelves}</div>
  `;
    container.querySelectorAll('.product-chip[data-pid]:not([data-pid=""])').forEach((el) => {
      el.onclick = () => {
        engine2.dispatch({ type: "SELL_PRODUCT", payload: { customerId: customer.id, productId: el.dataset.pid } });
        refresh();
      };
    });
    container.querySelectorAll("[data-return]").forEach((el) => {
      el.onclick = () => {
        engine2.dispatch({ type: "RETURN_PRODUCT", payload: { customerId: customer.id, productId: el.dataset.return } });
        refresh();
      };
    });
    container.querySelector("#btnComplete").onclick = () => {
      engine2.dispatch({ type: "COMPLETE_ORDER", payload: { customerId: customer.id } });
      refresh();
    };
    container.querySelector("#btnCancel").onclick = () => {
      engine2.dispatch({ type: "CANCEL_ORDER", payload: { customerId: customer.id } });
      refresh();
    };
  }

  // js/ui/InventoryUI.js
  function renderInventoryPanel(container, engine2, refresh) {
    const state = engine2.state;
    const cap = EquipmentSystem.capacity(state);
    const rows = categories.map((cat) => {
      const items = products.filter((p) => p.category === cat.id);
      return `<h3>${cat.icon} ${cat.name}</h3>
    <table><thead><tr><th>S\u1EA3n ph\u1EA9m</th><th>T\u1ED3n kho</th><th>Gi\xE1 nh\u1EADp</th><th>SL nh\u1EADp</th><th></th><th>Gi\xE1 b\xE1n</th></tr></thead>
    <tbody>${items.map((p) => {
        const qty = InventorySystem.totalQty(state, p.id);
        const buyPrice = state.market[p.id]?.buyPrice || p.cost;
        const sellPrice = state.prices[p.id]?.value ?? p.referencePrice;
        return `<tr>
        <td>${p.icon} ${p.name} <span class="muted">(${p.unit})</span></td>
        <td>${qty}</td>
        <td>${formatMoney(buyPrice)}</td>
        <td><input type="number" min="0" value="10" style="width:64px" id="restock_${p.id}"/></td>
        <td><button class="btn small" data-buy="${p.id}">Nh\u1EADp</button></td>
        <td><input type="number" min="0" value="${sellPrice}" style="width:84px" data-price="${p.id}"/></td>
      </tr>`;
      }).join("")}</tbody></table>`;
    }).join("");
    container.innerHTML = `
    <div class="panel-card">
      <h2 style="margin-top:0;">\u{1F4E6} Kho &amp; Nh\u1EADp h\xE0ng \u2014 s\u1EE9c ch\u1EE9a ${cap}/s\u1EA3n ph\u1EA9m</h2>
      <div class="grid cols-4">
        <button class="btn secondary small" id="adjM5">-5% t\u1EA5t c\u1EA3</button>
        <button class="btn secondary small" id="adjP5">+5% t\u1EA5t c\u1EA3</button>
        <button class="btn secondary small" id="adjP10">+10% t\u1EA5t c\u1EA3</button>
        <button class="btn secondary small" id="adj0">V\u1EC1 gi\xE1 tham chi\u1EBFu</button>
      </div>
      <label style="display:block;margin:10px 0;"><input type="checkbox" id="freshToggle" ${state.settings.freshSaleEnabled ? "checked" : ""}/>
        \u{1F525} T\u1EF1 \u0111\u1ED9ng "X\u1EA3 h\xE0ng t\u01B0\u01A1i -30%" cho l\xF4 s\u1EAFp h\u1EBFt h\u1EA1n sau 18:00</label>
      ${rows}
    </div>`;
    container.querySelector("#adjM5").onclick = () => {
      engine2.dispatch({ type: "SET_GROUP_PRICE", payload: { pct: -0.05 } });
      refresh();
    };
    container.querySelector("#adjP5").onclick = () => {
      engine2.dispatch({ type: "SET_GROUP_PRICE", payload: { pct: 0.05 } });
      refresh();
    };
    container.querySelector("#adjP10").onclick = () => {
      engine2.dispatch({ type: "SET_GROUP_PRICE", payload: { pct: 0.1 } });
      refresh();
    };
    container.querySelector("#adj0").onclick = () => {
      engine2.dispatch({ type: "SET_GROUP_PRICE", payload: { pct: 0 } });
      refresh();
    };
    container.querySelector("#freshToggle").onchange = () => engine2.dispatch({ type: "TOGGLE_FRESH_SALE" });
    container.querySelectorAll("[data-buy]").forEach((btn) => {
      btn.onclick = () => {
        const qty = Math.max(0, parseInt(container.querySelector(`#restock_${btn.dataset.buy}`).value || "0", 10));
        if (qty > 0) engine2.dispatch({ type: "BUY_STOCK", payload: { productId: btn.dataset.buy, quantity: qty } });
        refresh();
      };
    });
    container.querySelectorAll("[data-price]").forEach((input) => {
      input.onchange = () => engine2.dispatch({ type: "SET_PRICE", payload: { productId: input.dataset.price, value: Number(input.value) } });
    });
  }

  // js/ui/StaffUI.js
  var hireCandidates = [];
  function renderStaffPanel(container, engine2, refresh) {
    const state = engine2.state;
    const roleInfo = (id) => staffRoles.find((r) => r.id === id) || { name: id, icon: "\u{1F464}" };
    const current = state.staff.length ? `<div class="grid cards">${state.staff.map((s) => `<div class="item-card">
        <div class="title">${roleInfo(s.role).icon} ${s.name}</div>
        <div class="desc">${roleInfo(s.role).name} \xB7 T\u1ED1c \u0111\u1ED9 ${s.speed} \xB7 Ch\xEDnh x\xE1c ${s.accuracy} \xB7 Mood ${Math.round(s.mood)}</div>
        <div class="price">L\u01B0\u01A1ng: ${formatMoney(s.salary)}/ng\xE0y</div>
        <button class="btn danger small" data-fire="${s.id}">Sa th\u1EA3i</button>
      </div>`).join("")}</div>` : `<div class="empty-hint">Ch\u01B0a c\xF3 nh\xE2n vi\xEAn n\xE0o \u2014 t\u1EF1 l\xE0m h\u1EBFt m\u1ECDi vi\u1EC7c.</div>`;
    const candidates = hireCandidates.length ? `<div class="grid cards">${hireCandidates.map((c, i) => `<div class="item-card">
        <div class="title">${roleInfo(c.role).icon} ${c.name}</div>
        <div class="desc">${roleInfo(c.role).name} \xB7 T\u1ED1c \u0111\u1ED9 ${c.speed} \xB7 Ch\xEDnh x\xE1c ${c.accuracy} \xB7 K\u1EF9 n\u0103ng ${c.skill}<br/>${c.hair}, ${c.outfit}</div>
        <div class="price">Ph\xED tuy\u1EC3n: ${formatMoney(c.salary * 3)} \xB7 L\u01B0\u01A1ng ${formatMoney(c.salary)}/ng\xE0y</div>
        <button class="btn small" data-hire="${i}">Thu\xEA</button>
      </div>`).join("")}</div>` : `<button class="btn" id="btnFind">\u{1F50D} T\xECm \u1EE9ng vi\xEAn m\u1EDBi</button>`;
    container.innerHTML = `
    <div class="panel-card"><h2 style="margin-top:0;">\u{1F465} Nh\xE2n vi\xEAn hi\u1EC7n t\u1EA1i</h2>${current}</div>
    <div class="panel-card" style="margin-top:12px;"><h2 style="margin-top:0;">Tuy\u1EC3n d\u1EE5ng</h2>${candidates}</div>
  `;
    container.querySelector("#btnFind")?.addEventListener("click", () => {
      hireCandidates = [StaffSystem.rollCandidate(engine2.rng), StaffSystem.rollCandidate(engine2.rng), StaffSystem.rollCandidate(engine2.rng)];
      refresh();
    });
    container.querySelectorAll("[data-hire]").forEach((btn) => {
      btn.onclick = () => {
        engine2.dispatch({ type: "HIRE_STAFF", payload: { candidate: hireCandidates[Number(btn.dataset.hire)] } });
        hireCandidates = [];
        refresh();
      };
    });
    container.querySelectorAll("[data-fire]").forEach((btn) => {
      btn.onclick = () => {
        engine2.dispatch({ type: "FIRE_STAFF", payload: { staffId: btn.dataset.fire } });
        refresh();
      };
    });
  }

  // js/ui/UpgradeUI.js
  function renderEquipmentPanel(container, engine2, refresh) {
    const state = engine2.state;
    container.innerHTML = `<div class="panel-card"><h2 style="margin-top:0;">\u{1F6E0}\uFE0F Thi\u1EBFt b\u1ECB</h2>
    <div class="grid cards">${equipment.map((e) => {
      const owned = !!state.equipment[e.id];
      return `<div class="item-card">
        <div class="title">${e.icon} ${e.name}</div>
        <div class="desc">${e.effect}</div>
        <div class="price">${formatMoney(e.cost)}${e.dailyCost ? " \xB7 " + formatMoney(e.dailyCost) + "/ng\xE0y" : ""}</div>
        ${owned ? '<span class="owned-tag">\u0110\xE3 s\u1EDF h\u1EEFu</span>' : `<button class="btn small" data-buy="${e.id}">Mua</button>`}
      </div>`;
    }).join("")}</div></div>`;
    container.querySelectorAll("[data-buy]").forEach((btn) => {
      btn.onclick = () => {
        engine2.dispatch({ type: "BUY_EQUIPMENT", payload: { id: btn.dataset.buy } });
        refresh();
      };
    });
  }
  function renderServicesPanel(container, engine2, refresh) {
    const state = engine2.state;
    container.innerHTML = `<div class="panel-card"><h2 style="margin-top:0;">\u{1F513} D\u1ECBch v\u1EE5</h2>
    <div class="grid cards">${services.map((s) => {
      const owned = !!state.services[s.id];
      const locked = state.reputation < s.reputationRequirement;
      return `<div class="item-card">
        <div class="title">${s.icon} ${s.name}</div>
        <div class="desc">Y\xEAu c\u1EA7u uy t\xEDn ${s.reputationRequirement} \xB7 +${Math.round(s.customerBonus * 100)}% kh\xE1ch \xB7 DT ph\u1EE5 ~${formatMoney(s.extraRevenue)}/ng\xE0y</div>
        <div class="price">${formatMoney(s.unlockCost)}${s.dailyCost ? " \xB7 " + formatMoney(s.dailyCost) + "/ng\xE0y" : ""}</div>
        ${owned ? '<span class="owned-tag">\u0110ang ho\u1EA1t \u0111\u1ED9ng</span>' : locked ? `<span class="muted">C\u1EA7n uy t\xEDn ${s.reputationRequirement}</span>` : `<button class="btn small" data-unlock="${s.id}">M\u1EDF kh\xF3a</button>`}
      </div>`;
    }).join("")}</div></div>`;
    container.querySelectorAll("[data-unlock]").forEach((btn) => {
      btn.onclick = () => {
        engine2.dispatch({ type: "START_SERVICE", payload: { id: btn.dataset.unlock } });
        refresh();
      };
    });
  }
  function renderAdsPanel(container, engine2, refresh) {
    const state = engine2.state;
    const active = state.ads.map((a) => {
      const def = advertising.find((x) => x.id === a.id);
      return def ? `<span class="stat-pill" style="color:#2e2420;background:#f1e5d2;">${def.icon} ${def.name} \xB7 c\xF2n ${a.daysLeft} ng\xE0y</span>` : "";
    }).join(" ");
    container.innerHTML = `<div class="panel-card"><h2 style="margin-top:0;">\u{1F4E3} Qu\u1EA3ng c\xE1o</h2>
    ${active ? `<p>${active}</p>` : '<p class="muted">Ch\u01B0a c\xF3 chi\u1EBFn d\u1ECBch n\xE0o \u0111ang ch\u1EA1y.</p>'}
    <div class="grid cards">${advertising.map((a) => `<div class="item-card">
        <div class="title">${a.icon} ${a.name}</div>
        <div class="desc">Th\u1EDDi l\u01B0\u1EE3ng ${a.duration} ng\xE0y \xB7 x${a.customerMultiplier} kh\xE1ch \xB7 uy t\xEDn +${a.reputationEffect}</div>
        <div class="price">${formatMoney(a.cost)}</div>
        <button class="btn small" data-ad="${a.id}">Ch\u1EA1y qu\u1EA3ng c\xE1o</button>
      </div>`).join("")}</div></div>`;
    container.querySelectorAll("[data-ad]").forEach((btn) => {
      btn.onclick = () => {
        engine2.dispatch({ type: "BUY_AD", payload: { id: btn.dataset.ad } });
        refresh();
      };
    });
  }

  // js/ui/ReviewUI.js
  function renderReviewPanel(container, engine2, refresh) {
    const state = engine2.state;
    if (!state.reviews.length) {
      container.innerHTML = `<div class="panel-card"><h2 style="margin-top:0;">\u2B50 \u0110\xE1nh gi\xE1</h2><div class="empty-hint">Ch\u01B0a c\xF3 \u0111\xE1nh gi\xE1 n\xE0o.</div></div>`;
      return;
    }
    container.innerHTML = `<div class="panel-card"><h2 style="margin-top:0;">\u2B50 \u0110\xE1nh gi\xE1 kh\xE1ch h\xE0ng (${state.reviews.length})</h2>
    ${state.reviews.slice(0, 40).map((r) => `<div class="review-card">
      <div><b>${r.customer}</b> \xB7 ng\xE0y ${r.day} \xB7 <span class="stars">${"\u2605".repeat(r.stars)}${"\u2606".repeat(5 - r.stars)}</span></div>
      <div>${r.text}</div>
      <div class="review-tags">${r.tags.map((t) => `<span>${t}</span>`).join("")}</div>
      ${r.reply ? `<div class="muted">\u21B3 Ph\u1EA3n h\u1ED3i: ${r.reply}</div>` : `<div style="margin-top:6px;display:flex;gap:6px;">
          <input type="text" placeholder="Tr\u1EA3 l\u1EDDi \u0111\xE1nh gi\xE1..." style="flex:1;" data-reply-input="${r.id}"/>
          <button class="btn small" data-reply-btn="${r.id}">G\u1EEDi</button>
        </div>`}
    </div>`).join("")}
  </div>`;
    container.querySelectorAll("[data-reply-btn]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.replyBtn;
        const input = container.querySelector(`[data-reply-input="${id}"]`);
        const text = (input?.value || "").trim();
        if (!text) return;
        engine2.dispatch({ type: "REPLY_REVIEW", payload: { reviewId: id, text } });
        refresh();
      };
    });
  }

  // js/ui/QuestUI.js
  function renderQuestPanel(container, engine2, refresh) {
    const state = engine2.state;
    const questCard = (q, daily) => {
      const pct = Math.min(100, Math.round(q.progress / q.target * 100));
      return `<div class="quest-card ${q.done ? "done" : ""}">
      <div><b>${q.title}</b></div>
      <div class="muted">${Math.min(q.progress, q.target).toLocaleString("vi-VN")} / ${q.target.toLocaleString("vi-VN")} \xB7 th\u01B0\u1EDFng ${q.reward.toLocaleString("vi-VN")}\u0111</div>
      <div class="progress-bar"><div style="width:${pct}%"></div></div>
      ${q.done && !q.claimed ? `<button class="btn small" style="margin-top:6px;" data-claim="${q.id}" data-daily="${daily ? "1" : "0"}">Nh\u1EADn th\u01B0\u1EDFng</button>` : ""}
      ${q.claimed ? '<span class="owned-tag">\u0110\xE3 nh\u1EADn</span>' : ""}
    </div>`;
    };
    const achList = Object.values(state.achievements).map((a) => `<div class="ach-card ${a.unlocked ? "unlocked" : ""}">
    <b>${a.unlocked ? "\u{1F3C6}" : "\u{1F512}"} ${a.title}</b><div class="muted">${a.desc}</div>
  </div>`).join("");
    container.innerHTML = `
    <div class="panel-card"><h2 style="margin-top:0;">\u{1F3AF} Nhi\u1EC7m v\u1EE5 h\xF4m nay</h2>${(state.dailyQuests || []).map((q) => questCard(q, true)).join("") || '<div class="empty-hint">Ch\u01B0a c\xF3.</div>'}</div>
    <div class="panel-card" style="margin-top:12px;"><h2 style="margin-top:0;">Nhi\u1EC7m v\u1EE5 d\xE0i h\u1EA1n</h2>${state.quests.map((q) => questCard(q, false)).join("")}</div>
    <div class="panel-card" style="margin-top:12px;"><h2 style="margin-top:0;">Th\xE0nh t\u1EF1u</h2>${achList}</div>
  `;
    container.querySelectorAll("[data-claim]").forEach((btn) => {
      btn.onclick = () => {
        engine2.dispatch({ type: "CLAIM_QUEST", payload: { questId: btn.dataset.claim, daily: btn.dataset.daily === "1" } });
        refresh();
      };
    });
  }

  // js/ui/EndDayUI.js
  function renderEndDayModal(root, engine2, handlers) {
    const state = engine2.state;
    if (state.phase !== "report" || !state.history.length) {
      root.innerHTML = "";
      return;
    }
    const r = state.history[0];
    root.innerHTML = `<div class="modal-overlay"><div class="modal-box">
    <h2>\u{1F4CA} B\xC1O C\xC1O NG\xC0Y ${r.day}</h2>
    <p>\u{1F465} Kh\xE1ch h\xE0ng ${r.customersTotal} \u2014 \u{1F60A} ${r.customersHappy} h\xE0i l\xF2ng \xB7 \u{1F610} ${r.customersNeutral} b\xECnh th\u01B0\u1EDDng \xB7 \u{1F621} ${r.customersAngry} b\u1ECF \u0111i</p>
    <h3 style="margin-bottom:4px;">DOANH THU</h3>
    <div class="report-row pos"><span>B\xE1n h\xE0ng</span><span>+${formatMoney(r.revenue)}</span></div>
    <div class="report-row pos"><span>D\u1ECBch v\u1EE5</span><span>+${formatMoney(r.serviceRevenue)}</span></div>
    <h3 style="margin-bottom:4px;">CHI PH\xCD</h3>
    <div class="report-row neg"><span>Gi\xE1 v\u1ED1n</span><span>-${formatMoney(r.cogs)}</span></div>
    <div class="report-row neg"><span>H\xE0ng h\u1ECFng</span><span>-${formatMoney(r.spoil)}</span></div>
    <div class="report-row neg"><span>Tr\u1ED9m c\u1EAFp</span><span>-${formatMoney(r.theft)}</span></div>
    <div class="report-row neg"><span>S\u1EF1 c\u1ED1</span><span>-${formatMoney(r.incidents)}</span></div>
    <div class="report-row neg"><span>Nh\xE2n vi\xEAn</span><span>-${formatMoney(r.salary)}</span></div>
    <div class="report-row neg"><span>Thu\xEA m\u1EB7t b\u1EB1ng</span><span>-${formatMoney(r.rent)}</span></div>
    <div class="report-row neg"><span>\u0110i\u1EC7n n\u01B0\u1EDBc</span><span>-${formatMoney(r.utilities)}</span></div>
    <div class="report-row neg"><span>Thu\u1EBF</span><span>-${formatMoney(r.tax)}</span></div>
    <div class="report-row neg"><span>L\xE3i vay</span><span>-${formatMoney(r.loanInterest)}</span></div>
    <div class="report-row total" style="color:${r.netProfit >= 0 ? "var(--green)" : "var(--red)"}"><span>L\xC3I R\xD2NG</span><span>${formatMoney(r.netProfit)}</span></div>
    <p>\u2B50 Uy t\xEDn: ${Math.round(r.reputation)} &nbsp; \u{1F4B0} Ti\u1EC1n: ${formatMoney(state.money)}</p>
    <p class="muted">T\u1ED5ng t\xE0i s\u1EA3n hi\u1EC7n t\u1EA1i: ${formatMoney(computeAssets(state, equipment))} / ${formatMoney(WIN_ASSETS)}</p>
    <button class="btn block" id="btnNextDay">\u27A1\uFE0F Sang ng\xE0y ti\u1EBFp theo</button>
  </div></div>`;
    root.querySelector("#btnNextDay").onclick = handlers.onNextDay;
  }
  function renderHistoryPanel(container, engine2) {
    const state = engine2.state;
    if (!state.history.length) {
      container.innerHTML = `<div class="panel-card"><h2 style="margin-top:0;">\u{1F4CA} B\xE1o c\xE1o</h2><div class="empty-hint">Ch\u01B0a c\xF3 d\u1EEF li\u1EC7u.</div></div>`;
      return;
    }
    container.innerHTML = `<div class="panel-card"><h2 style="margin-top:0;">\u{1F4CA} L\u1ECBch s\u1EED kinh doanh</h2>
    <table><thead><tr><th>Ng\xE0y</th><th>Doanh thu</th><th>L\xE3i r\xF2ng</th><th>Uy t\xEDn</th><th>Kh\xE1ch</th></tr></thead>
    <tbody>${state.history.slice(0, 30).map((h) => `<tr>
      <td>${h.day}</td><td>${formatMoney(h.revenue)}</td>
      <td style="color:${h.netProfit >= 0 ? "var(--green)" : "var(--red)"}">${formatMoney(h.netProfit)}</td>
      <td>${Math.round(h.reputation)}</td><td>${h.customersTotal}</td>
    </tr>`).join("")}</tbody></table>
  </div>
  <div class="panel-card" style="margin-top:12px;"><h2 style="margin-top:0;">Nh\u1EADt k\xFD s\u1EF1 ki\u1EC7n</h2>
    ${(state.eventLog || []).slice(0, 20).map((e) => `<div class="review-card"><b>Ng\xE0y ${e.day} \u2014 ${e.title}:</b> ${e.choice}</div>`).join("") || '<div class="empty-hint">Ch\u01B0a c\xF3.</div>'}
  </div>`;
  }
  function renderGameOverModal(root, engine2, handlers) {
    const state = engine2.state;
    if (!state.gameOver) return false;
    const win = state.gameOver === "win";
    root.innerHTML = `<div class="modal-overlay"><div class="modal-box gameover-box">
    <div class="big">${win ? "\u{1F389}" : "\u{1F4B8}"}</div>
    <h2>${win ? "TI\u1EC6M NH\xC0 TUI TH\xC0NH C\xD4NG!" : "PH\xC1 S\u1EA2N"}</h2>
    <p>${win ? `T\u1ED5ng t\xE0i s\u1EA3n \u0111\u1EA1t ${formatMoney(computeAssets(state, equipment))} sau ${state.day} ng\xE0y kinh doanh.` : "T\xE0i kho\u1EA3n \xE2m 3 ng\xE0y li\xEAn ti\u1EBFp. H\xE0nh tr\xECnh kh\u1EDFi nghi\u1EC7p k\u1EBFt th\xFAc t\u1EA1i \u0111\xE2y."}</p>
    ${win ? `
      <button class="btn block" id="btnContinuePlay">Ti\u1EBFp t\u1EE5c ch\u01A1i</button>
      <button class="btn secondary block" id="btnNewGamePlus" style="margin-top:8px;">New Game+</button>
    ` : `<button class="btn block" id="btnRestart">\u{1F504} Ch\u01A1i l\u1EA1i</button>`}
    <button class="btn secondary block" id="btnToTitle" style="margin-top:8px;">\u{1F3E0} V\u1EC1 m\xE0n h\xECnh ch\xEDnh</button>
  </div></div>`;
    root.querySelector("#btnContinuePlay")?.addEventListener("click", handlers.onContinuePlay);
    root.querySelector("#btnNewGamePlus")?.addEventListener("click", handlers.onNewGamePlus);
    root.querySelector("#btnRestart")?.addEventListener("click", handlers.onRestart);
    root.querySelector("#btnToTitle").onclick = handlers.onToTitle;
    return true;
  }

  // js/ui/EventModal.js
  function renderEventModal(root, engine2, refresh) {
    const state = engine2.state;
    const active = state.activeEvent || state.activeDrama;
    if (!active) {
      root.innerHTML = "";
      return;
    }
    const isDrama = !!state.activeDrama;
    const d = active.def;
    root.innerHTML = `<div class="modal-overlay"><div class="modal-box event-modal">
    <h2>${isDrama ? "\u{1F4AC}" : ""} ${d.title}</h2>
    <p>${d.description}</p>
    ${d.choices.map((c, i) => `<button class="choice-btn" data-choice="${i}">${c.label}</button>`).join("")}
  </div></div>`;
    root.querySelectorAll("[data-choice]").forEach((btn) => {
      btn.onclick = () => {
        engine2.dispatch({ type: isDrama ? "RESOLVE_DRAMA" : "RESOLVE_EVENT", payload: { choiceIndex: Number(btn.dataset.choice) } });
        refresh();
      };
    });
  }

  // js/ui/GameUI.js
  var TABS = [
    ["inventory", "\u{1F4E6} Kho & Gi\xE1"],
    ["staff", "\u{1F465} Nh\xE2n vi\xEAn"],
    ["equipment", "\u{1F6E0}\uFE0F Thi\u1EBFt b\u1ECB"],
    ["ads", "\u{1F4E3} Qu\u1EA3ng c\xE1o"],
    ["services", "\u{1F513} D\u1ECBch v\u1EE5"],
    ["reviews", "\u2B50 \u0110\xE1nh gi\xE1"],
    ["quests", "\u{1F3AF} Nhi\u1EC7m v\u1EE5"],
    ["history", "\u{1F4CA} B\xE1o c\xE1o"]
  ];
  var PANEL_RENDERERS = {
    inventory: renderInventoryPanel,
    staff: renderStaffPanel,
    equipment: renderEquipmentPanel,
    ads: renderAdsPanel,
    services: renderServicesPanel,
    reviews: renderReviewPanel,
    quests: renderQuestPanel,
    history: (c, e) => renderHistoryPanel(c, e)
  };
  function mountGameScreen(container, engine2, renderer2, world2, sfx2, handlers) {
    const uiState = { tab: "inventory", mobilePanelOpen: false };
    container.innerHTML = `
    <div id="gameTopbar">
      <div class="brand">\u{1F3EA} ${engine2.state.storeName}</div>
      <div id="headerStats"></div>
      <div class="spacer"></div>
      <button class="btn small secondary" id="btnSaveGame">\u{1F4BE} L\u01B0u</button>
      <button class="btn small secondary" id="btnToTitle2">\u{1F3E0}</button>
    </div>
    <div id="gameBody">
      <div id="sidebar">${TABS.map(([id, label]) => `<button data-tab="${id}">${label}</button>`).join("")}</div>
      <div id="worldArea">
        <div id="canvasWrap"><canvas id="gameCanvas"></canvas></div>
        <div id="queueStrip"></div>
        <div id="panelArea"></div>
      </div>
    </div>
    <div id="mobileNav">${TABS.slice(0, 4).map(([id, label]) => `<button data-tab="${id}">${label.split(" ")[0]}</button>`).join("")}</div>
    <div id="timeBar">
      <span id="timeLabel" class="stat-pill"></span>
      <div class="time-track"><div id="timeFill"></div></div>
      <div class="speed-btns" id="speedBtns">
        <button data-speed="1">1x</button><button data-speed="2">2x</button><button data-speed="4">4x</button>
      </div>
      <button class="btn small" id="btnOpenClose"></button>
    </div>
    <div id="eventModalRoot"></div>
    <div id="toastWrap" class="toast-wrap"></div>
  `;
    const canvas = container.querySelector("#gameCanvas");
    renderer2.canvas = canvas;
    renderer2.ctx = canvas.getContext("2d");
    renderer2.resize();
    window.addEventListener("resize", () => renderer2.resize());
    const panelArea = container.querySelector("#panelArea");
    const queueStrip = container.querySelector("#queueStrip");
    const eventModalRoot = container.querySelector("#eventModalRoot");
    function refreshPanel() {
      renderQueueStrip(queueStrip, engine2, refreshPanel);
      if (engine2.activeCustomerId && engine2.state.customers.some((c) => c.id === engine2.activeCustomerId)) {
        renderOrderPanel(panelArea, engine2, refreshPanel);
      } else {
        const fn = PANEL_RENDERERS[uiState.tab] || renderInventoryPanel;
        fn(panelArea, engine2, refreshPanel);
      }
      renderEventModal(eventModalRoot, engine2, () => {
        refreshPanel();
        refreshHeader();
      });
    }
    function setTab(tab) {
      uiState.tab = tab;
      container.querySelectorAll("#sidebar button, #mobileNav button").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
      uiState.mobilePanelOpen = true;
      panelArea.classList.remove("closed");
      refreshPanel();
    }
    container.querySelectorAll("#sidebar button, #mobileNav button").forEach((b) => {
      b.onclick = () => setTab(b.dataset.tab);
    });
    setTab("inventory");
    function refreshHeader() {
      const s = engine2.state;
      const phaseLabel = s.phase === DAY_PHASES.OPEN ? "\u0110ang m\u1EDF c\u1EEDa" : s.phase === DAY_PHASES.REPORT ? "\u0110\xE3 \u0111\xF3ng c\u1EEDa" : "Chu\u1EA9n b\u1ECB";
      container.querySelector("#headerStats").innerHTML = `
      <span class="stat-pill">\u{1F4C5} Ng\xE0y ${s.day}</span>
      <span class="stat-pill">\u{1F552} ${formatTimeFloat(s.time)} \xB7 ${phaseLabel}</span>
      <span class="stat-pill">\u{1F4B0} ${formatMoney(s.money)}</span>
      <span class="stat-pill">\u2B50 ${Math.round(s.reputation)}/100</span>
      <span class="stat-pill">${s.weather ? s.weather.icon + " " + s.weather.label : ""}</span>
    `;
      const pct = Math.max(0, Math.min(100, (s.time - OPEN_HOUR) / (CLOSE_HOUR - OPEN_HOUR) * 100));
      container.querySelector("#timeFill").style.width = `${pct}%`;
      container.querySelector("#timeLabel").textContent = `${formatTimeFloat(OPEN_HOUR)} \u2192 ${formatTimeFloat(CLOSE_HOUR)}`;
      container.querySelectorAll("#speedBtns button").forEach((b) => b.classList.toggle("active", Number(b.dataset.speed) === s.timeSpeed));
      const openBtn = container.querySelector("#btnOpenClose");
      if (s.phase === DAY_PHASES.OPEN) {
        openBtn.textContent = "\u0110\xF3ng c\u1EEDa ngay";
        openBtn.disabled = false;
      } else if (s.phase === DAY_PHASES.PREP) {
        openBtn.textContent = s.activeEvent ? "X\u1EED l\xFD s\u1EF1 ki\u1EC7n tr\u01B0\u1EDBc" : "M\u1EDF c\u1EEDa";
        openBtn.disabled = !!s.activeEvent;
      } else {
        openBtn.textContent = "...";
        openBtn.disabled = true;
      }
    }
    container.querySelectorAll("#speedBtns button").forEach((b) => {
      b.onclick = () => {
        engine2.dispatch({ type: "SET_SPEED", payload: { speed: Number(b.dataset.speed) } });
        refreshHeader();
      };
    });
    container.querySelector("#btnOpenClose").onclick = () => {
      if (engine2.state.phase === DAY_PHASES.OPEN) engine2.dispatch({ type: "CLOSE_STORE" });
      else engine2.dispatch({ type: "OPEN_STORE" });
      refreshHeader();
      refreshPanel();
    };
    container.querySelector("#btnSaveGame").onclick = () => {
      handlers.onSave();
      toast(container, "\u0110\xE3 l\u01B0u game");
    };
    container.querySelector("#btnToTitle2").onclick = handlers.onToTitle;
    engine2.bus.on("day:started", () => {
      refreshHeader();
      refreshPanel();
    });
    engine2.bus.on("store:opened", () => {
      refreshHeader();
      refreshPanel();
      sfx2?.play("open");
    });
    engine2.bus.on("sell:result", () => {
      refreshHeader();
    });
    engine2.bus.on("order:completed", (r) => {
      refreshHeader();
      refreshPanel();
      if (r) sfx2?.play("money");
      if (r?.review) sfx2?.play("review");
    });
    engine2.bus.on("event:resolved", () => {
      refreshHeader();
      refreshPanel();
    });
    engine2.bus.on("drama:resolved", () => {
      refreshHeader();
      refreshPanel();
    });
    engine2.bus.on("day:report", () => {
      refreshHeader();
      renderEndDayModal(eventModalRoot, engine2, {
        onNextDay: () => {
          engine2.dispatch({ type: "START_DAY" });
          eventModalRoot.innerHTML = "";
          refreshHeader();
          refreshPanel();
        }
      });
      sfx2?.play("event");
    });
    engine2.bus.on("customer:spawned", () => {
      refreshPanel();
      sfx2?.play("bell");
    });
    engine2.bus.on("action:result", ({ result }) => {
      if (result && result.ok === false && result.message) toast(container, result.message);
      else if (result?.ok) {
        toast(container, "Th\xE0nh c\xF4ng");
        sfx2?.play("upgrade");
      }
      refreshPanel();
      refreshHeader();
    });
    engine2.bus.on("toast", (msg) => toast(container, msg));
    refreshHeader();
    refreshPanel();
    let domAccumulator = 0;
    return {
      renderFrame(fps, debugOn2, dtSeconds) {
        renderer2.debug = debugOn2;
        renderer2.frame(world2, engine2.state, debugOn2 ? {
          fps,
          day: engine2.state.day,
          timeLabel: formatTimeFloat(engine2.state.time),
          customers: engine2.state.customers.length,
          queue: engine2.state.customers.length,
          money: engine2.state.money,
          spawnRate: 0,
          event: engine2.state.activeEvent?.def.title
        } : null);
        if (renderGameOverModal(eventModalRoot, engine2, handlers.gameOverHandlers)) return;
        domAccumulator += dtSeconds || 0;
        if (domAccumulator >= 0.25) {
          domAccumulator = 0;
          refreshHeader();
          if (engine2.state.phase === DAY_PHASES.OPEN) {
            renderQueueStrip(queueStrip, engine2, refreshPanel);
            if (engine2.activeCustomerId) renderOrderPanel(panelArea, engine2, refreshPanel);
          }
        }
      }
    };
  }
  function toast(container, msg) {
    const wrap = container.querySelector("#toastWrap");
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  // js/main.js
  var DEBUG = new URLSearchParams(location.search).has("debug");
  var titleEl = document.getElementById("titleScreen");
  var newGameEl = document.getElementById("newGameScreen");
  var gameEl = document.getElementById("gameScreen");
  var engine = null;
  var world = null;
  var renderer = null;
  var sfx = null;
  var gameApi = null;
  var debugOn = DEBUG;
  var rafId = null;
  var clock = new Clock();
  function showScreen(name) {
    titleEl.classList.toggle("hidden", name !== "title");
    newGameEl.classList.toggle("hidden", name !== "newgame");
    gameEl.classList.toggle("hidden", name !== "game");
  }
  function bootTitle() {
    renderTitleScreen(titleEl, {
      onStart: () => showScreen("newgame") || mountNewGame(),
      onContinue: () => {
        const saved = SaveSystem.load(AUTO_SLOT);
        if (saved) startGame(saved);
      },
      getSettings: () => engine ? engine.state.settings : { sound: true, music: true, vibration: true },
      onSettingsChange: (s) => {
        if (engine) Object.assign(engine.state.settings, s);
      }
    });
    showScreen("title");
  }
  function mountNewGame() {
    renderNewGameScreen(newGameEl, {
      onConfirm: (name) => startGame(createGameState(name, products)),
      onBack: () => {
        showScreen("title");
        bootTitle();
      }
    });
  }
  function startGame(state) {
    const bus = new EventBus();
    const rng = new RNG();
    world = new World();
    engine = new GameEngine(state, world, bus, rng);
    renderer = new Renderer(document.createElement("canvas"));
    sfx = new Sfx(() => engine.state.settings);
    showScreen("game");
    gameApi = mountGameScreen(gameEl, engine, renderer, world, sfx, {
      onSave: () => SaveSystem.save(AUTO_SLOT, engine.state),
      onToTitle: () => {
        stopLoop();
        SaveSystem.save(AUTO_SLOT, engine.state);
        showScreen("title");
        bootTitle();
      },
      gameOverHandlers: {
        onContinuePlay: () => {
          engine.state.gameOver = null;
        },
        onNewGamePlus: () => {
          stopLoop();
          showScreen("newgame");
          mountNewGame();
        },
        onRestart: () => {
          stopLoop();
          showScreen("newgame");
          mountNewGame();
        },
        onToTitle: () => {
          stopLoop();
          showScreen("title");
          bootTitle();
        }
      }
    });
    if (state.phase === DAY_PHASES.PREP && !state.history.length && state.day === 1 && !state.weather) {
      engine.dispatch({ type: "START_DAY" });
    } else if (state.phase === DAY_PHASES.REPORT && state.history.length) {
      engine.bus.emit("day:report", state.history[0]);
    }
    startLoop();
  }
  function startLoop() {
    clock.resume();
    const frame = (ts) => {
      const dt = clock.tick(ts);
      engine.update(dt);
      const fps = dt > 0 ? 1 / dt : 0;
      gameApi.renderFrame(fps, debugOn, dt);
      rafId = requestAnimationFrame(frame);
    };
    rafId = requestAnimationFrame(frame);
  }
  function stopLoop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }
  window.addEventListener("keydown", (e) => {
    if (!engine) return;
    if (e.key === "`") {
      debugOn = !debugOn;
      return;
    }
    if (!debugOn) return;
    if (e.key === "F1") {
      engine.state.day += 1;
    }
    if (e.key === "F2") {
      engine.state.money += 1e6;
    }
    if (e.key === "F3") {
      engine.state.reputation = Math.min(100, engine.state.reputation + 10);
    }
    if (e.key === "F4") {
      if (engine.state.phase === DAY_PHASES.OPEN) CustomerSystem.spawn(engine.state, engine.rng);
    }
    if (e.key === "F5") {
      engine.state.activeEvent = null;
      engine.dispatch({ type: "START_DAY" });
    }
    if (e.key === "F6") {
      engine.dispatch({ type: "CLOSE_STORE" });
    }
  });
  window.addEventListener("beforeunload", () => {
    if (engine) SaveSystem.save(AUTO_SLOT, engine.state);
  });
  bootTitle();
})();
