import { DAY_PHASES, OPEN_HOUR, CLOSE_HOUR, WIN_ASSETS, computeAssets, freshDayStats } from './GameState.js';
import { TimeSystem } from '../systems/TimeSystem.js';
import { MarketSystem } from '../systems/MarketSystem.js';
import { CustomerSystem } from '../systems/CustomerSystem.js';
import { OrderSystem } from '../systems/OrderSystem.js';
import { InventorySystem } from '../systems/InventorySystem.js';
import { PricingSystem } from '../systems/PricingSystem.js';
import { ReviewSystem } from '../systems/ReviewSystem.js';
import { ReputationSystem } from '../systems/ReputationSystem.js';
import { StaffSystem } from '../systems/StaffSystem.js';
import { EquipmentSystem } from '../systems/EquipmentSystem.js';
import { ServiceSystem } from '../systems/ServiceSystem.js';
import { AdvertisingSystem } from '../systems/AdvertisingSystem.js';
import { EventSystem } from '../systems/EventSystem.js';
import { DramaSystem } from '../systems/DramaSystem.js';
import { EconomySystem } from '../systems/EconomySystem.js';
import { QuestSystem } from '../systems/QuestSystem.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { equipment as equipmentCatalog } from '../data/equipment.js';

export class GameEngine {
  constructor(state, world, bus, rng) {
    this.state = state;
    this.world = world;
    this.bus = bus;
    this.rng = rng;
    this.activeCustomerId = null;
    AchievementSystem.init(this.state);
    QuestSystem.ensureLongTerm(this.state);
  }

  emit(evt, payload) { this.bus.emit(evt, payload); }

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

    if (TimeSystem.isClosingTime(state)) this.dispatch({ type: 'CLOSE_STORE' });
  }

  _updatePatience(dtGameMinutes) {
    const state = this.state;
    [...state.customers].forEach((c) => {
      if (c.id === this.activeCustomerId) return; // đang được phục vụ trực tiếp thì không tính mất kiên nhẫn gắt
      c.patience = Math.max(0, c.patience - dtGameMinutes);
      if (c.patience <= 0) {
        this.world.customerActors.find((a) => a.customerId === c.id)?.say('Thôi, em mua chỗ khác.');
        OrderSystem.cancelOrder(state, c.id, 'impatience');
        if (this.activeCustomerId === c.id) this.activeCustomerId = null;
      }
    });
  }

  _maybeSpawnCustomers(dtGameMinutes) {
    const state = this.state;
    if (state.customers.length >= 6) return;
    const perHour = CustomerSystem.spawnRatePerHour(state);
    const chance = (perHour / 60) * dtGameMinutes;
    if (this.rng.chance(Math.min(0.9, chance))) {
      const c = CustomerSystem.spawn(state, this.rng);
      this.emit('customer:spawned', c);
    }
  }

  dispatch(action) {
    const state = this.state;
    switch (action.type) {
      case 'START_DAY': this._startDay(); break;
      case 'OPEN_STORE': this._openStore(); break;
      case 'CLOSE_STORE': this._closeStore(); break;

      case 'BUY_STOCK': this._buyStock(action.payload); break;
      case 'SET_PRICE': PricingSystem.setPrice(state, action.payload.productId, action.payload.value); break;
      case 'SET_GROUP_PRICE': PricingSystem.bulkAdjust(state, action.payload.pct); break;
      case 'TOGGLE_FRESH_SALE': state.settings.freshSaleEnabled = !state.settings.freshSaleEnabled; break;

      case 'SERVE_CUSTOMER': this.activeCustomerId = action.payload.customerId; this._customerStatus(action.payload.customerId, 'counter'); break;
      case 'SELL_PRODUCT': {
        const r = OrderSystem.sellProduct(state, action.payload.customerId, action.payload.productId);
        if (r.ok) { const p = this._customerActorXY(action.payload.customerId); this.world.particles.spawn(p.x, p.y - 24, '✓', '#3f8a4a'); }
        this.emit('sell:result', { ...action.payload, result: r });
        break;
      }
      case 'RETURN_PRODUCT': OrderSystem.returnProduct(state, action.payload.customerId, action.payload.productId); break;
      case 'COMPLETE_ORDER': {
        const result = OrderSystem.completeOrder(state, action.payload.customerId);
        if (result) {
          const p = this._customerActorXY(action.payload.customerId);
          this.world.particles.spawn(p.x, p.y - 20, `+${Math.round(result.revenue).toLocaleString('vi-VN')}đ`, '#2e7d32');
          if (result.review?.stars >= 4) this.world.particles.spawn(p.x, p.y - 34, '⭐ hài lòng', '#d8a53d');
        }
        if (this.activeCustomerId === action.payload.customerId) this.activeCustomerId = null;
        this.emit('order:completed', result);
        break;
      }
      case 'CANCEL_ORDER':
        OrderSystem.cancelOrder(state, action.payload.customerId, 'cancelled');
        if (this.activeCustomerId === action.payload.customerId) this.activeCustomerId = null;
        break;

      case 'HIRE_STAFF': this._hireStaff(action.payload); break;
      case 'FIRE_STAFF': StaffSystem.fire(state, action.payload.staffId); break;
      case 'BUY_EQUIPMENT': this.emit('action:result', { type: action.type, result: EquipmentSystem.buy(state, action.payload.id) }); break;
      case 'BUY_AD': this.emit('action:result', { type: action.type, result: AdvertisingSystem.launch(state, action.payload.id) }); break;
      case 'START_SERVICE': this.emit('action:result', { type: action.type, result: ServiceSystem.unlock(state, action.payload.id) }); break;

      case 'REPLY_REVIEW': ReviewSystem.reply(state, action.payload.reviewId, action.payload.text); break;

      case 'RESOLVE_EVENT': this._resolveEvent(action.payload.choiceIndex); break;
      case 'RESOLVE_DRAMA': this._resolveDrama(action.payload.choiceIndex); break;

      case 'TAKE_LOAN': EconomySystem.takeLoan(state, action.payload.amount); break;
      case 'REPAY_LOAN': EconomySystem.repayLoan(state, action.payload.amount); break;

      case 'CLAIM_QUEST': this.emit('action:result', { type: action.type, result: QuestSystem.claim(state, action.payload.questId, action.payload.daily) }); break;
      case 'SET_SPEED': state.timeSpeed = action.payload.speed; break;

      case 'SAVE_GAME': SaveSystem.save(action.payload.slot, state); break;
      default: break;
    }
    this.emit('state:changed', action.type);
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
    this.emit('day:started', state.day);
  }

  _openStore() {
    const state = this.state;
    if (state.activeEvent) return; // phải xử lý sự kiện sáng trước khi mở cửa
    state.phase = DAY_PHASES.OPEN;
    this.emit('store:opened', state.day);
  }

  _closeStore() {
    const state = this.state;
    state.phase = DAY_PHASES.REPORT;
    [...state.customers].forEach((c) => OrderSystem.cancelOrder(state, c.id, 'closing'));
    this.activeCustomerId = null;
    const report = EconomySystem.closeDay(state);
    QuestSystem.update(state);
    AchievementSystem.update(state);

    state.day += 1;
    if (state.consecutiveNegativeDays >= 3) state.gameOver = 'bankrupt';
    else if (computeAssets(state, equipmentCatalog) >= WIN_ASSETS) state.gameOver = 'win';

    AdvertisingSystem.tick(state);
    this.emit('day:report', report);
  }

  _buyStock(payload) {
    const state = this.state;
    const buyPrice = state.market[payload.productId]?.buyPrice || state.products[payload.productId]?.cost || 0;
    const totalCost = buyPrice * payload.quantity;
    if (state.money < totalCost) { this.emit('toast', 'Không đủ tiền nhập hàng'); return; }
    state.money -= totalCost;
    InventorySystem.addBatch(state, payload.productId, payload.quantity, buyPrice);
  }

  _hireStaff(payload) {
    const state = this.state;
    const fee = payload.candidate.salary * 3;
    if (state.money < fee) { this.emit('toast', 'Không đủ tiền tuyển dụng'); return; }
    state.money -= fee;
    StaffSystem.hire(state, payload.candidate);
  }

  _resolveEvent(choiceIndex) {
    const state = this.state;
    const info = EventSystem.resolveChoice(state, choiceIndex, this.rng);
    if (info?.priceSuggestion) PricingSystem.bulkAdjust(state, info.priceSuggestion);
    if (info?.delayOpenHours) state.time = Math.min(CLOSE_HOUR, OPEN_HOUR + info.delayOpenHours);
    if (!state.activeEvent) MarketSystem.rollDailyMarket(state, this.rng);
    if (info?.closeToday) { this._closeStore(); this.emit('event:resolved', info); return; }
    this.emit('event:resolved', info);
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
    this.emit('drama:resolved', info);
  }
}
