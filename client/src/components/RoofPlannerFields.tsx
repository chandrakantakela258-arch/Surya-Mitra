/**
 * RoofPlannerFields.tsx
 *
 * Drop-in React component that collects:
 *   - Roof dimensions (length × width)
 *   - Deduction areas (tank, staircase, walkway, shadow, safety margin, cleaning gap)
 *   - Monthly electricity consumption (kWh)
 *
 * Emits the calculated SolarSizingResult via onChange.
 *
 * Integration into subsidy-calculator.tsx:
 *   <RoofPlannerFields
 *     onChange={(result) => {
 *       setSystemSize(result.commercialKw);
 *       setRoofCalcResult(result);
 *     }}
 *   />
 */

import { useState, useEffect, useCallback } from "react";
import {
  calculateSolarSystem,
  type RoofInputs,
  type ConsumptionInputs,
  type SolarSizingResult,
} from "./solarCalculator";

interface Props {
  onChange?: (result: SolarSizingResult) => void;
  initialMonthlyUnits?: number;
  sunHours?: number;
}

const S = {
  section: {
    background: "#f8fafc", border: "1px solid #e2e8f0",
    borderRadius: "12px", padding: "20px", marginBottom: "16px",
  } as React.CSSProperties,
  grid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "12px",
  } as React.CSSProperties,
  label: {
    display: "block", fontSize: "13px", fontWeight: 500, color: "#475569", marginBottom: "4px",
  } as React.CSSProperties,
  input: {
    width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1",
    borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" as const,
  } as React.CSSProperties,
  result: {
    background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)",
    border: "1px solid #86efac", borderRadius: "12px", padding: "16px 20px", marginTop: "12px",
  } as React.CSSProperties,
  heading: {
    fontSize: "16px", fontWeight: 600, color: "#1e293b", marginBottom: "12px",
  } as React.CSSProperties,
};

export default function RoofPlannerFields({
  onChange,
  initialMonthlyUnits = 0,
  sunHours = 5.0,
}: Props) {
  const [length, setLength]                   = useState(0);
  const [width, setWidth]                     = useState(0);
  const [tankArea, setTankArea]               = useState(0);
  const [staircaseArea, setStaircaseArea]     = useState(0);
  const [walkwayArea, setWalkwayArea]         = useState(0);
  const [shadowArea, setShadowArea]           = useState(0);
  const [safetyMarginArea, setSafetyMarginArea] = useState(0);
  const [cleaningGapArea, setCleaningGapArea] = useState(0);
  const [monthlyUnits, setMonthlyUnits]       = useState(initialMonthlyUnits);
  const [result, setResult]                   = useState<SolarSizingResult | null>(null);

  const recalculate = useCallback(() => {
    if (length <= 0 || width <= 0) { setResult(null); return; }
    const r: RoofInputs = { length, width, tankArea, staircaseArea, walkwayArea, shadowArea, safetyMarginArea, cleaningGapArea };
    const c: ConsumptionInputs = { monthlyUnits, sunHours };
    const calc = calculateSolarSystem(r, c);
    setResult(calc);
    onChange?.(calc);
  }, [length, width, tankArea, staircaseArea, walkwayArea, shadowArea, safetyMarginArea, cleaningGapArea, monthlyUnits, sunHours, onChange]);

  useEffect(() => { recalculate(); }, [recalculate]);

  const num = (label: string, value: number, setter: (v: number) => void, unit = "sq ft") => (
    <div>
      <label style={S.label}>{label} <span style={{ color: "#94a3b8", fontWeight: 400 }}>({unit})</span></label>
      <input
        type="number" min={0} value={value || ""}
        onChange={(e) => setter(Number(e.target.value) || 0)}
        style={S.input}
      />
    </div>
  );

  return (
    <div style={{ marginBottom: "20px" }}>
      {/* Roof Dimensions */}
      <div style={S.section}>
        <div style={S.heading}>📐 Roof Dimensions</div>
        <div style={S.grid}>
          {num("Length", length, setLength, "ft")}
          {num("Width", width, setWidth, "ft")}
        </div>
        {length > 0 && width > 0 && (
          <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#64748b" }}>
            Total roof area: <strong>{length * width} sq ft</strong>
          </p>
        )}
      </div>

      {/* Deductions */}
      <div style={S.section}>
        <div style={S.heading}>🏗️ Area Deductions</div>
        <div style={S.grid}>
          {num("Water Tank", tankArea, setTankArea)}
          {num("Staircase / Mumty", staircaseArea, setStaircaseArea)}
          {num("Walkway / Passage", walkwayArea, setWalkwayArea)}
          {num("Shadow Area", shadowArea, setShadowArea)}
          {num("Safety Margin", safetyMarginArea, setSafetyMarginArea)}
          {num("Cleaning Gap", cleaningGapArea, setCleaningGapArea)}
        </div>
      </div>

      {/* Monthly Consumption */}
      <div style={S.section}>
        <div style={S.heading}>⚡ Monthly Electricity Consumption</div>
        <div style={{ maxWidth: "240px" }}>
          {num("Monthly Units", monthlyUnits, setMonthlyUnits, "kWh")}
        </div>
      </div>

      {/* Calculated Results */}
      {result && (
        <div style={S.result}>
          <div style={{ ...S.heading, color: "#166534" }}>☀️ Recommended System Size</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "14px" }}>
            <div><span style={{ color: "#64748b" }}>Net usable roof:</span> <strong>{result.netUsableArea} sq ft</strong></div>
            <div><span style={{ color: "#64748b" }}>Roof capacity:</span> <strong>{result.roofCapacityKw} kW</strong></div>
            <div><span style={{ color: "#64748b" }}>Consumption need:</span> <strong>{result.consumptionCapacityKw >= 999 ? "—" : `${result.consumptionCapacityKw} kW`}</strong></div>
            <div style={{ color: "#166534", fontSize: "16px" }}>✅ Recommended: <strong>{result.commercialKw} kW</strong></div>
            <div><span style={{ color: "#64748b" }}>Panels (580W):</span> <strong>{result.panelCount580W}</strong></div>
            <div><span style={{ color: "#64748b" }}>Panels (600W):</span> <strong>{result.panelCount600W}</strong></div>
            <div><span style={{ color: "#64748b" }}>Est. monthly gen:</span> <strong>{result.estimatedMonthlyGen} kWh</strong></div>
            <div><span style={{ color: "#64748b" }}>Est. annual gen:</span> <strong>{result.estimatedAnnualGen} kWh</strong></div>
          </div>
        </div>
      )}
    </div>
  );
}
