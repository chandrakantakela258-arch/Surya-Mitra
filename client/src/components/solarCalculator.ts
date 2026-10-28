/**
 * Solar Calculator Engine — DivyanshiSolar
 *
 * Two independent capacity estimates:
 *   1. Roof-based:  net usable area ÷ 80 ft²/kW  (TopCon bifacial)
 *   2. Consumption:  (monthly_units / 30) / (sun_hours × 0.8)
 *
 * Recommended kW = MIN(roof_capacity, consumption_capacity)
 */

const SQFT_PER_KW = 80;
const DEFAULT_SUN_HOURS = 5.0;
const DERATE = 0.8;

export interface RoofInputs {
  length: number;          // ft
  width: number;           // ft
  tankArea: number;        // sq ft
  staircaseArea: number;
  walkwayArea: number;
  shadowArea: number;
  safetyMarginArea: number;
  cleaningGapArea: number;
}

export interface ConsumptionInputs {
  monthlyUnits: number;    // kWh
  sunHours?: number;
}

export interface SolarSizingResult {
  grossRoofArea: number;
  totalDeductions: number;
  netUsableArea: number;
  roofCapacityKw: number;
  consumptionCapacityKw: number;
  recommendedKw: number;
  commercialKw: number;
  estimatedAnnualGen: number;
  estimatedMonthlyGen: number;
  panelCount580W: number;
  panelCount600W: number;
}

function ceilHalf(n: number): number {
  return Math.ceil(n * 2) / 2;
}

export function calculateSolarSystem(
  roof: RoofInputs,
  consumption: ConsumptionInputs
): SolarSizingResult {
  const sun = consumption.sunHours ?? DEFAULT_SUN_HOURS;

  const grossRoofArea = roof.length * roof.width;
  const totalDeductions =
    roof.tankArea + roof.staircaseArea + roof.walkwayArea +
    roof.shadowArea + roof.safetyMarginArea + roof.cleaningGapArea;
  const netUsableArea = Math.max(0, grossRoofArea - totalDeductions);
  const roofCapacityKw = netUsableArea / SQFT_PER_KW;

  const daily = consumption.monthlyUnits / 30;
  const consumptionCapacityKw =
    consumption.monthlyUnits > 0 ? daily / (sun * DERATE) : Infinity;

  const recommendedKw = Math.min(roofCapacityKw, consumptionCapacityKw);
  const commercialKw = ceilHalf(recommendedKw);

  const estimatedAnnualGen = Math.round(commercialKw * sun * DERATE * 365);

  return {
    grossRoofArea,
    totalDeductions,
    netUsableArea,
    roofCapacityKw:         Math.round(roofCapacityKw * 100) / 100,
    consumptionCapacityKw:  consumptionCapacityKw === Infinity ? 999 : Math.round(consumptionCapacityKw * 100) / 100,
    recommendedKw:          Math.round(recommendedKw * 100) / 100,
    commercialKw,
    estimatedAnnualGen,
    estimatedMonthlyGen:    Math.round(estimatedAnnualGen / 12),
    panelCount580W:         Math.ceil((commercialKw * 1000) / 580),
    panelCount600W:         Math.ceil((commercialKw * 1000) / 600),
  };
}

export function kwFromMonthlyUnits(monthlyUnits: number, sunHours = DEFAULT_SUN_HOURS): number {
  if (monthlyUnits <= 0) return 0;
  return ceilHalf((monthlyUnits / 30) / (sunHours * DERATE));
}
