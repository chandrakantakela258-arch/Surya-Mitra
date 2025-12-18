import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sun, IndianRupee, Zap, TrendingDown, MapPin, BatteryCharging, Power, Check } from "lucide-react";
import { indianStates } from "@shared/schema";

const stateSubsidies: Record<string, { ratePerKw: number; label: string }> = {
  "Odisha": { ratePerKw: 20000, label: "Odisha State Subsidy" },
  "Uttar Pradesh": { ratePerKw: 10000, label: "UP State Subsidy" },
};

const systemPricing: Record<number, number> = {
  3: 225000,
  5: 350000,
};

const nonDcrPricePerKw = 55000;

interface SubsidyResult {
  capacity: number;
  totalCost: number;
  centralSubsidy: number;
  stateSubsidy: number;
  totalSubsidy: number;
  netCost: number;
  monthlyGeneration: number;
  dailyGeneration: number;
  annualSavings: number;
  monthlySavings: number;
  paybackYears: number;
  state: string;
  emiMonthly: number;
  emiTenure: number;
}

// EMI Calculation: P * r * (1+r)^n / ((1+r)^n - 1)
// Where P = principal, r = monthly interest rate, n = tenure in months
function calculateEMI(principal: number, annualRate: number = 10, tenureMonths: number = 60): number {
  if (principal <= 0) return 0;
  const monthlyRate = annualRate / 12 / 100;
  const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / 
              (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi);
}

function calculateSubsidy(capacityKW: number, state: string = "", panelType: string = "dcr"): SubsidyResult {
  let totalCost: number;
  if (panelType === "non_dcr") {
    totalCost = capacityKW * nonDcrPricePerKw;
  } else {
    totalCost = systemPricing[capacityKW] || capacityKW * 75000;
  }
  
  // No subsidy for Non-DCR panels
  let centralSubsidy = 0;
  let stateSubsidy = 0;
  
  if (panelType !== "non_dcr") {
    if (capacityKW <= 3) {
      centralSubsidy = capacityKW * 30000;
    } else if (capacityKW <= 10) {
      centralSubsidy = 3 * 30000 + (capacityKW - 3) * 18000;
    } else {
      centralSubsidy = 3 * 30000 + 7 * 18000;
    }
    centralSubsidy = Math.min(centralSubsidy, 78000);
    
    if (state && stateSubsidies[state]) {
      stateSubsidy = capacityKW * stateSubsidies[state].ratePerKw;
    }
  }
  
  const totalSubsidy = centralSubsidy + stateSubsidy;
  const netCost = Math.max(0, totalCost - totalSubsidy);
  
  // Power generation: 1 kW produces 4 units daily
  const dailyGeneration = capacityKW * 4;
  const monthlyGeneration = dailyGeneration * 30;
  
  // Power savings: Rs 7 per unit
  const unitCost = 7;
  const monthlySavings = monthlyGeneration * unitCost;
  const annualSavings = monthlySavings * 12;
  
  // Payback period
  const paybackYears = netCost > 0 ? netCost / annualSavings : 0;
  
  // EMI calculation at 10% interest for 5 years (60 months)
  const emiTenure = 60;
  const emiMonthly = calculateEMI(netCost, 10, emiTenure);
  
  return {
    capacity: capacityKW,
    totalCost,
    centralSubsidy,
    stateSubsidy,
    totalSubsidy,
    netCost,
    dailyGeneration,
    monthlyGeneration,
    monthlySavings,
    annualSavings,
    paybackYears: Math.round(paybackYears * 10) / 10,
    state,
    emiMonthly,
    emiTenure,
  };
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface SubsidyCalculatorProps {
  onCapacityChange?: (capacity: number) => void;
  onStateChange?: (state: string) => void;
  initialCapacity?: number;
  initialState?: string;
  compact?: boolean;
}

export function SubsidyCalculator({ 
  onCapacityChange, 
  onStateChange,
  initialCapacity = 3,
  initialState = "",
  compact = false 
}: SubsidyCalculatorProps) {
  const [capacity, setCapacity] = useState(initialCapacity);
  const [selectedState, setSelectedState] = useState(initialState);
  
  const result = useMemo(() => calculateSubsidy(capacity, selectedState), [capacity, selectedState]);
  
  function handleCapacityChange(value: number[]) {
    const newCapacity = value[0];
    setCapacity(newCapacity);
    onCapacityChange?.(newCapacity);
  }
  
  function handleStateChange(state: string) {
    setSelectedState(state);
    onStateChange?.(state);
  }
  
  if (compact) {
    return (
      <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-orange-500" />
            <span className="font-medium">Capacity: {capacity} kW</span>
          </div>
          <Badge variant="secondary" className="text-green-600 dark:text-green-400">
            Subsidy: {formatINR(result.totalSubsidy)}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant={capacity === 3 ? "default" : "outline"}
            onClick={() => handleCapacityChange([3])}
            data-testid="button-capacity-3kw"
          >
            3 kW
          </Button>
          <Button
            type="button"
            variant={capacity === 5 ? "default" : "outline"}
            onClick={() => handleCapacityChange([5])}
            data-testid="button-capacity-5kw"
          >
            5 kW
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">System Cost:</span>
            <p className="font-medium">{formatINR(result.totalCost)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Your Cost:</span>
            <p className="font-medium text-primary">{formatINR(result.netCost)}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <Card data-testid="card-subsidy-calculator">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sun className="h-6 w-6 text-orange-500" />
          <CardTitle>PM Surya Ghar Yojana Subsidy Calculator</CardTitle>
        </div>
        <CardDescription>
          Calculate your subsidy amount and estimated savings under the government scheme
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <Label>Solar Plant Capacity</Label>
              <Badge variant="outline" className="font-mono text-lg">
                {capacity} kW
              </Badge>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant={capacity === 3 ? "default" : "outline"}
                className="flex-1"
                onClick={() => handleCapacityChange([3])}
                data-testid="button-capacity-3kw-full"
              >
                3 kW
              </Button>
              <Button
                type="button"
                variant={capacity === 5 ? "default" : "outline"}
                className="flex-1"
                onClick={() => handleCapacityChange([5])}
                data-testid="button-capacity-5kw-full"
              >
                5 kW
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Select 3 kW or 5 kW capacity for your solar installation
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="state-select">Select State</Label>
            </div>
            <Select value={selectedState} onValueChange={handleStateChange}>
              <SelectTrigger id="state-select" data-testid="select-state">
                <SelectValue placeholder="Select your state for additional subsidies" />
              </SelectTrigger>
              <SelectContent>
                {indianStates.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state} {stateSubsidies[state] ? `(+${formatINR(stateSubsidies[state].ratePerKw)}/kW)` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedState && stateSubsidies[selectedState] && (
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                {stateSubsidies[selectedState].label}: {formatINR(stateSubsidies[selectedState].ratePerKw)}/kW
              </Badge>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <IndianRupee className="h-4 w-4" />
              <span className="text-sm">System Cost</span>
            </div>
            <p className="text-xl font-semibold font-mono">{formatINR(result.totalCost)}</p>
          </div>
          
          <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg space-y-1">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm">Central Subsidy</span>
            </div>
            <p className="text-xl font-semibold font-mono text-green-600 dark:text-green-400">
              - {formatINR(result.centralSubsidy)}
            </p>
          </div>
          
          {result.stateSubsidy > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg space-y-1">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">State Subsidy</span>
              </div>
              <p className="text-xl font-semibold font-mono text-blue-600 dark:text-blue-400">
                - {formatINR(result.stateSubsidy)}
              </p>
            </div>
          )}
          
          <div className="p-4 bg-primary/10 rounded-lg space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <IndianRupee className="h-4 w-4" />
              <span className="text-sm">Your Net Cost</span>
            </div>
            <p className="text-xl font-semibold font-mono text-primary">{formatINR(result.netCost)}</p>
          </div>
          
          <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg space-y-1">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <Zap className="h-4 w-4" />
              <span className="text-sm">Annual Savings</span>
            </div>
            <p className="text-xl font-semibold font-mono text-orange-600 dark:text-orange-400">
              {formatINR(result.annualSavings)}
            </p>
          </div>
        </div>
        
        {result.stateSubsidy > 0 && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Subsidy (Central + State)</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {formatINR(result.totalSubsidy)}
              </p>
            </div>
          </div>
        )}
        
        {/* Power Generation & Savings */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-green-700 dark:text-green-300">
              <Zap className="w-5 h-5" />
              Power Generation & Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-background rounded-lg">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{result.dailyGeneration}</p>
                <p className="text-xs text-muted-foreground">Units/Day</p>
              </div>
              <div className="p-3 bg-background rounded-lg">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{result.monthlyGeneration}</p>
                <p className="text-xs text-muted-foreground">Units/Month</p>
              </div>
              <div className="p-3 bg-background rounded-lg">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatINR(result.monthlySavings)}</p>
                <p className="text-xs text-muted-foreground">Monthly Savings</p>
              </div>
              <div className="p-3 bg-background rounded-lg">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatINR(result.annualSavings)}</p>
                <p className="text-xs text-muted-foreground">Annual Savings</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Based on 4 units/kW/day generation and Rs 7 per unit electricity cost
            </p>
          </CardContent>
        </Card>

        {/* EMI Calculator */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-blue-700 dark:text-blue-300">
              <IndianRupee className="w-5 h-5" />
              EMI Calculator (10% Interest)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Loan Amount</p>
                <p className="text-2xl font-bold font-mono text-primary">{formatINR(result.netCost)}</p>
              </div>
              <div className="p-4 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Monthly EMI</p>
                <p className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">{formatINR(result.emiMonthly)}</p>
                <p className="text-xs text-muted-foreground">for {result.emiTenure} months</p>
              </div>
              <div className="p-4 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Net Monthly Benefit</p>
                <p className="text-2xl font-bold font-mono text-green-600 dark:text-green-400">
                  {formatINR(Math.max(0, result.monthlySavings - result.emiMonthly))}
                </p>
                <p className="text-xs text-muted-foreground">Savings - EMI</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              EMI calculated at 10% annual interest rate for 5 years (60 months)
            </p>
          </CardContent>
        </Card>

        <div className="p-4 bg-muted/30 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{result.paybackYears}</p>
              <p className="text-sm text-muted-foreground">Years Payback Period</p>
            </div>
            <div>
              <p className="text-2xl font-bold">25+</p>
              <p className="text-sm text-muted-foreground">Years Panel Lifespan</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatINR(result.annualSavings * 25)}</p>
              <p className="text-sm text-muted-foreground">Lifetime Savings</p>
            </div>
          </div>
        </div>
        
        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-orange-700 dark:text-orange-300">
              <Power className="w-5 h-5" />
              3-in-1 Hybrid Inverter - Exclusive Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Works During Power Cuts</p>
                  <p className="text-xs text-muted-foreground">
                    Our solar plant works even when grid power is off. Other solar plants stop working during power cuts.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                  <BatteryCharging className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Battery Ready for Night Use</p>
                  <p className="text-xs text-muted-foreground">
                    Add a battery later to store power for night usage. Other plants cannot support battery storage.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-300 pt-2 border-t border-orange-200 dark:border-orange-800">
              <Check className="w-4 h-4" />
              <span className="font-medium">Included: 3-in-1 Hybrid Inverter with your solar plant at no extra cost</span>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p>* Central Subsidy: Up to 3 kW - Rs 30,000/kW | 3-10 kW - Rs 18,000/kW (above 3 kW) | Maximum - Rs 78,000</p>
          <p>* State Subsidies: Odisha - Rs 20,000/kW | Uttar Pradesh - Rs 10,000/kW</p>
          <p>* Calculations based on average solar generation of 4 kWh/kW/day and Rs 7/kWh electricity tariff</p>
        </div>
      </CardContent>
    </Card>
  );
}

export { calculateSubsidy, formatINR, stateSubsidies };
export type { SubsidyResult };
