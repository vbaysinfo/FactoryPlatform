// ============================================================
// AquaNursery Pro — Business Calculations Engine
// ============================================================

/**
 * Calculate Days of Culture from start date to today (or a given date)
 */
export function calcDOC(startDate, toDate = new Date()) {
  const start = new Date(startDate);
  const to    = new Date(toDate);
  const diff  = Math.floor((to - start) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

/**
 * Calculate estimated harvest date
 * @param {string} startDate
 * @param {number} targetDOC  - target days of culture (default 25)
 */
export function calcHarvestDate(startDate, targetDOC = 25) {
  const start = new Date(startDate);
  start.setDate(start.getDate() + targetDOC);
  return start.toISOString().split("T")[0];
}

/**
 * Calculate Biomass
 * biomass (kg) = (initial_count × survival_rate/100 × avg_weight_g) / 1000
 * @param {number} initialCount    - PL count stocked
 * @param {number} survivalRate    - % survival (0-100)
 * @param {number} avgWeightG      - average body weight in grams
 */
export function calcBiomass(initialCount, survivalRate, avgWeightG) {
  if (!initialCount || !survivalRate || !avgWeightG) return 0;
  return parseFloat(((initialCount * (survivalRate / 100) * avgWeightG) / 1000).toFixed(3));
}

/**
 * Calculate Feed Conversion Ratio
 * FCR = total feed used (kg) / total biomass gained (kg)
 */
export function calcFCR(totalFeedKg, biomassKg) {
  if (!totalFeedKg || !biomassKg || biomassKg === 0) return 0;
  return parseFloat((totalFeedKg / biomassKg).toFixed(2));
}

/**
 * Calculate Survival Rate from sampling
 * @param {number} sampledCount    - count from sampling
 * @param {number} sampledVolume   - volume sampled (L)
 * @param {number} totalVolume     - total tank volume (L)
 * @param {number} initialCount    - initial stocking count
 */
export function calcSurvivalRate(sampledCount, sampledVolume, totalVolume, initialCount) {
  if (!sampledCount || !sampledVolume || !totalVolume || !initialCount) return 0;
  const estimatedTotal = (sampledCount / sampledVolume) * totalVolume;
  return parseFloat(Math.min(100, (estimatedTotal / initialCount) * 100).toFixed(1));
}

/**
 * Calculate Average Daily Feed Rate
 * @param {number[]} feedAmounts - array of daily feed amounts (grams)
 */
export function calcAvgDailyFeed(feedAmounts) {
  if (!feedAmounts?.length) return 0;
  const total = feedAmounts.reduce((a, b) => a + b, 0);
  return parseFloat((total / feedAmounts.length).toFixed(0));
}

/**
 * Estimate remaining culture days to harvest
 */
export function calcDaysToHarvest(startDate, targetDOC = 25) {
  const doc = calcDOC(startDate);
  return Math.max(0, targetDOC - doc);
}

/**
 * Calculate batch profitability
 */
export function calcBatchPnL({ seedCost, feedCost, medCost, laborCost, powerShare, saleAmount }) {
  const totalCost = (seedCost || 0) + (feedCost || 0) + (medCost || 0) + (laborCost || 0) + (powerShare || 0);
  const revenue   = saleAmount || 0;
  const profit    = revenue - totalCost;
  const margin    = revenue > 0 ? parseFloat(((profit / revenue) * 100).toFixed(1)) : 0;
  return { totalCost, revenue, profit, margin };
}

/**
 * Calculate monthly P&L from sales and costs
 */
export function calcMonthlyPnL(sales, batches, powerBills, staff) {
  const revenue    = sales.reduce((a, s) => a + (s.total || 0), 0);
  const seedCost   = batches.reduce((a, b) => a + (b.total_cost || 0), 0);
  const feedCost   = 0; // sum from feed_logs
  const powerCost  = powerBills.reduce((a, p) => a + (p.amount || 0), 0);
  const salaryCost = staff.reduce((a, s) => a + (s.salary || 0), 0);
  const totalCost  = seedCost + feedCost + powerCost + salaryCost;
  const profit     = revenue - totalCost;
  return { revenue, totalCost, profit, seedCost, powerCost, salaryCost };
}

// ── Water Quality Thresholds ───────────────────────────────

export const WATER_THRESHOLDS = {
  temp:     { min: 26,   max: 32,    unit: "°C",  label: "Temperature" },
  ph:       { min: 7.5,  max: 8.5,   unit: "",    label: "pH" },
  do_value: { min: 5.0,  max: null,  unit: "mg/L",label: "Dissolved Oxygen" },
  salinity: { min: 5,    max: 25,    unit: "ppt", label: "Salinity" },
  ammonia:  { min: null, max: 0.1,   unit: "mg/L",label: "Ammonia" },
  nitrite:  { min: null, max: 0.5,   unit: "mg/L",label: "Nitrite" },
  alkalinity:{ min: 100, max: 200,   unit: "mg/L",label: "Alkalinity" },
};

/**
 * Check water quality reading against thresholds
 * Returns array of violations
 */
export function checkWaterQuality(reading) {
  const violations = [];
  for (const [param, limits] of Object.entries(WATER_THRESHOLDS)) {
    const value = reading[param];
    if (value == null) continue;
    if (limits.min != null && value < limits.min) {
      violations.push({ param: limits.label, value, limit: `min ${limits.min}${limits.unit}`, severity: "warning" });
    }
    if (limits.max != null && value > limits.max) {
      violations.push({ param: limits.label, value, limit: `max ${limits.max}${limits.unit}`, severity: value > limits.max * 1.2 ? "critical" : "warning" });
    }
  }
  return violations;
}

/**
 * Estimate cost per kg of shrimp produced
 */
export function calcCostPerKg(totalCost, biomassKg) {
  if (!biomassKg || biomassKg === 0) return 0;
  return parseFloat((totalCost / biomassKg).toFixed(2));
}

/**
 * Calculate expected revenue from a batch
 */
export function calcExpectedRevenue(biomassKg, pricePerKg) {
  return parseFloat((biomassKg * pricePerKg).toFixed(2));
}
