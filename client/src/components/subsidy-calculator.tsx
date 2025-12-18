import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sun, IndianRupee, Zap, TrendingDown, MapPin, BatteryCharging, Power, Check, Users } from "lucide-react";
import { indianStates } from "@shared/schema";

const stateSubsidies: Record<string, { ratePerKw: number; maxSubsidy: number; label: string }> = {
  "Odisha": { ratePerKw: 20000, maxSubsidy: 60000, label: "Odisha State Subsidy" },
  "Uttar Pradesh": { ratePerKw: 10000, maxSubsidy: 30000, label: "UP State Subsidy" },
};

const CUSTOMER_RATE_PER_WATT = 55;
const CUSTOMER_RATE_PER_KW = CUSTOMER_RATE_PER_WATT * 1000;

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
  panelType: string;
}

interface CommissionResult {
  ddpCommission: number;
  bdpCommission: number;
  totalCommission: number;
}

function calculateEMI(principal: number, annualRate: number = 10, tenureMonths: number = 60): number {
  if (principal <= 0) return 0;
  const monthlyRate = annualRate / 12 / 100;
  const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / 
              (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi);
}

function calculateCommission(capacityKW: number, panelType: string): CommissionResult {
  let ddpCommission = 0;
  let bdpCommission = 0;

  if (panelType === "dcr") {
    if (capacityKW === 3) {
      ddpCommission = 20000;
      bdpCommission = 10000;
    } else if (capacityKW === 5) {
      ddpCommission = 35000;
      bdpCommission = 15000;
    } else if (capacityKW >= 6 && capacityKW <= 10) {
      ddpCommission = capacityKW * 6000;
      bdpCommission = capacityKW * 3000;
    } else if (capacityKW > 10) {
      ddpCommission = capacityKW * 6000;
      bdpCommission = capacityKW * 3000;
    } else {
      ddpCommission = capacityKW * 6000;
      bdpCommission = capacityKW * 3000;
    }
  } else {
    ddpCommission = capacityKW * 4000;
    bdpCommission = capacityKW * 2000;
  }

  return {
    ddpCommission,
    bdpCommission,
    totalCommission: ddpCommission + bdpCommission,
  };
}

function calculateSubsidy(capacityKW: number, state: string = "", panelType: string = "dcr"): SubsidyResult {
  const totalCost = capacityKW * CUSTOMER_RATE_PER_KW;
  
  let centralSubsidy = 0;
  let stateSubsidy = 0;
  
  if (panelType === "dcr") {
    if (capacityKW <= 2) {
      centralSubsidy = capacityKW * 30000;
    } else if (capacityKW <= 3) {
      centralSubsidy = 2 * 30000 + (capacityKW - 2) * 18000;
    } else {
      centralSubsidy = 78000;
    }
    
    if (state && stateSubsidies[state]) {
      const calculatedStateSubsidy = capacityKW * stateSubsidies[state].ratePerKw;
      stateSubsidy = Math.min(calculatedStateSubsidy, stateSubsidies[state].maxSubsidy);
    }
  }
  
  const totalSubsidy = centralSubsidy + stateSubsidy;
  const netCost = Math.max(0, totalCost - totalSubsidy);
  
  const dailyGeneration = capacityKW * 4;
  const monthlyGeneration = dailyGeneration * 30;
  
  const unitCost = 7;
  const monthlySavings = monthlyGeneration * unitCost;
  const annualSavings = monthlySavings * 12;
  
  const paybackYears = netCost > 0 ? netCost / annualSavings : 0;
  
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
    panelType,
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
  initialCapacity = 5,
  initialState = "",
  compact = false 
}: SubsidyCalculatorProps) {
  const [capacity, setCapacity] = useState(initialCapacity);
  const [selectedState, setSelectedState] = useState(initialState);
  const [panelType, setPanelType] = useState<"dcr" | "non_dcr">("dcr");
  const [customCapacity, setCustomCapacity] = useState(initialCapacity.toString());
  
  const result = useMemo(() => calculateSubsidy(capacity, selectedState, panelType), [capacity, selectedState, panelType]);
  const commission = useMemo(() => calculateCommission(capacity, panelType), [capacity, panelType]);
  
  function handleCapacityChange(value: number) {
    const clampedValue = Math.max(1, Math.min(100, value));
    setCapacity(clampedValue);
    setCustomCapacity(clampedValue.toString());
    onCapacityChange?.(clampedValue);
  }
  
  function handleCustomCapacityChange(value: string) {
    setCustomCapacity(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 100) {
      setCapacity(numValue);
      onCapacityChange?.(numValue);
    }
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
        
        <div className="flex gap-2 flex-wrap">
          {[3, 5, 10, 25, 50, 100].map((kw) => (
            <Button
              key={kw}
              type="button"
              variant={capacity === kw ? "default" : "outline"}
              size="sm"
              onClick={() => handleCapacityChange(kw)}
              data-testid={`button-capacity-${kw}kw`}
            >
              {kw} kW
            </Button>
          ))}
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
          Calculate your subsidy amount, estimated savings, and partner commission under the government scheme
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Label>Panel Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={panelType === "dcr" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setPanelType("dcr")}
                data-testid="button-panel-dcr"
              >
                DCR
              </Button>
              <Button
                type="button"
                variant={panelType === "non_dcr" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setPanelType("non_dcr")}
                data-testid="button-panel-non-dcr"
              >
                Non-DCR
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {panelType === "dcr" 
                ? "DCR panels are eligible for government subsidy" 
                : "Non-DCR panels have no subsidy but higher capacity options"}
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <Label>Solar Plant Capacity</Label>
              <Badge variant="outline" className="font-mono text-lg">
                {capacity} kW
              </Badge>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[3, 5, 10, 25, 50, 100].map((kw) => (
                <Button
                  key={kw}
                  type="button"
                  variant={capacity === kw ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCapacityChange(kw)}
                  data-testid={`button-capacity-${kw}kw-full`}
                >
                  {kw} kW
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="100"
                value={customCapacity}
                onChange={(e) => handleCustomCapacityChange(e.target.value)}
                placeholder="Custom kW"
                className="w-full"
                data-testid="input-custom-capacity"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">kW</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Enter capacity from 1 kW to 100 kW (Rs {CUSTOMER_RATE_PER_WATT}/Watt)
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
            {selectedState && stateSubsidies[selectedState] && panelType === "dcr" && (
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                {stateSubsidies[selectedState].label}: {formatINR(stateSubsidies[selectedState].ratePerKw)}/kW (Max {formatINR(stateSubsidies[selectedState].maxSubsidy)})
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
            <p className="text-xs text-muted-foreground">Rs {CUSTOMER_RATE_PER_WATT}/Watt</p>
          </div>
          
          {panelType === "dcr" && (
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg space-y-1">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <TrendingDown className="h-4 w-4" />
                <span className="text-sm">Central Subsidy</span>
              </div>
              <p className="text-xl font-semibold font-mono text-green-600 dark:text-green-400">
                - {formatINR(result.centralSubsidy)}
              </p>
              {capacity > 3 && (
                <p className="text-xs text-muted-foreground">Capped at Rs 78,000</p>
              )}
            </div>
          )}
          
          {panelType === "dcr" && result.stateSubsidy > 0 && (
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
        
        {panelType === "dcr" && result.totalSubsidy > 0 && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Subsidy (Central + State)</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {formatINR(result.totalSubsidy)}
              </p>
            </div>
          </div>
        )}

        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-purple-700 dark:text-purple-300">
              <Users className="w-5 h-5" />
              Partner Commission Structure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">DDP Commission</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatINR(commission.ddpCommission)}</p>
                <p className="text-xs text-muted-foreground">
                  {panelType === "dcr" 
                    ? (capacity === 3 ? "Rs 20,000 fixed" : capacity === 5 ? "Rs 35,000 fixed" : "Rs 6,000/kW")
                    : "Rs 4,000/kW"}
                </p>
              </div>
              <div className="p-4 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">BDP Commission</p>
                <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">{formatINR(commission.bdpCommission)}</p>
                <p className="text-xs text-muted-foreground">
                  {panelType === "dcr" 
                    ? (capacity === 3 ? "Rs 10,000 fixed" : capacity === 5 ? "Rs 15,000 fixed" : "Rs 3,000/kW")
                    : "Rs 2,000/kW"}
                </p>
              </div>
              <div className="p-4 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Total Commission</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{formatINR(commission.totalCommission)}</p>
                <p className="text-xs text-muted-foreground">DDP + BDP</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground text-center">
                <strong>{panelType === "dcr" ? "DCR Commission:" : "Non-DCR Commission:"}</strong>{" "}
                {panelType === "dcr" 
                  ? "3 kW (DDP Rs 20k, BDP Rs 10k) | 5 kW (DDP Rs 35k, BDP Rs 15k) | 6+ kW (DDP Rs 6k/kW, BDP Rs 3k/kW)"
                  : "All capacities: DDP Rs 4,000/kW | BDP Rs 2,000/kW"}
              </p>
            </div>
          </CardContent>
        </Card>
        
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

        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-blue-700 dark:text-blue-300">
              <IndianRupee className="w-5 h-5" />
              EMI After Power Savings Adjustment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Loan Amount (After Subsidy)</p>
                <p className="text-2xl font-bold font-mono text-primary">{formatINR(result.netCost)}</p>
              </div>
              <div className="p-4 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Monthly EMI</p>
                <p className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">{formatINR(result.emiMonthly)}</p>
                <p className="text-xs text-muted-foreground">10% interest for {result.emiTenure} months</p>
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly EMI</p>
                  <p className="text-xl font-bold font-mono">{formatINR(result.emiMonthly)}</p>
                </div>
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400">- Monthly Power Savings</p>
                  <p className="text-xl font-bold font-mono text-green-600 dark:text-green-400">- {formatINR(result.monthlySavings)}</p>
                </div>
                <div className="p-3 bg-background rounded-lg">
                  <p className="text-sm font-medium text-primary">Effective Monthly Payment</p>
                  <p className="text-2xl font-bold font-mono text-primary">
                    {result.monthlySavings >= result.emiMonthly 
                      ? formatINR(0) + " (FREE!)"
                      : formatINR(result.emiMonthly - result.monthlySavings)}
                  </p>
                  <p className="text-xs text-muted-foreground">Your actual pocket expense</p>
                </div>
              </div>
            </div>
            
            {result.monthlySavings >= result.emiMonthly && (
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg text-center">
                <p className="text-green-700 dark:text-green-300 font-medium">
                  Your power savings cover the entire EMI! Solar pays for itself from Day 1!
                </p>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground text-center">
              Power savings based on 4 units/kW/day generation at Rs 7/unit electricity cost
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
          <p>* Customer Rate: Rs {CUSTOMER_RATE_PER_WATT}/Watt (Rs {formatINR(CUSTOMER_RATE_PER_KW)}/kW) for all capacities</p>
          <p>* Central Subsidy (DCR only): Up to 2 kW - Rs 30,000/kW | 2-3 kW - Rs 18,000/kW | Above 3 kW - Capped at Rs 78,000</p>
          <p>* State Subsidies (DCR only): Odisha - Rs 20,000/kW (Max Rs 60,000) | UP - Rs 10,000/kW (Max Rs 30,000)</p>
          <p>* DCR Commission: 3kW (DDP Rs 20k, BDP Rs 10k) | 5kW (DDP Rs 35k, BDP Rs 15k) | 6+ kW (DDP Rs 6k/kW, BDP Rs 3k/kW)</p>
          <p>* Non-DCR Commission: DDP Rs 4,000/kW | BDP Rs 2,000/kW</p>
          <p>* Calculations based on average solar generation of 4 kWh/kW/day and Rs 7/kWh electricity tariff</p>
        </div>
      </CardContent>
    </Card>
  );
}

export { calculateSubsidy, calculateCommission, formatINR, stateSubsidies, CUSTOMER_RATE_PER_KW, CUSTOMER_RATE_PER_WATT };
export type { SubsidyResult, CommissionResult };
