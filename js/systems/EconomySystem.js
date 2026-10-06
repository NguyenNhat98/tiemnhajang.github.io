import { StaffSystem } from './StaffSystem.js';
import { EquipmentSystem } from './EquipmentSystem.js';
import { ServiceSystem } from './ServiceSystem.js';
import { InventorySystem } from './InventorySystem.js';

/** spec §39-40: netProfit = revenue + serviceRevenue - COGS - spoil - theft - incident - salary - rent - utilities - tax - loanInterest. */
export const EconomySystem = {
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

    const netProfit = state.dayStats.revenue + serviceRevenue - state.dayStats.cogs - state.dayStats.spoil
      - state.dayStats.theft - state.dayStats.incidents - salary - rent - utilities - tax - loanInterest;

    const report = {
      day: state.day, ...state.dayStats, serviceRevenue, salary, rent, utilities, tax, loanInterest,
      netProfit: Math.round(netProfit), reputation: state.reputation, spoiledBatches: decay.spoiledBatches,
    };

    state.money += serviceRevenue - salary - rent - utilities - tax - loanInterest;
    state.history.unshift(report);
    if (state.history.length > 60) state.history.pop();

    if (report.netProfit >= 0) state.stats.positiveProfitStreak += 1; else state.stats.positiveProfitStreak = 0;
    const anyStockout = Object.keys(state.products).some((pid) => InventorySystem.totalQty(state, pid) === 0);
    if (anyStockout) state.stats.noStockoutStreak = 0; else state.stats.noStockoutStreak += 1;
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
  },
};
