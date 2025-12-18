import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sun, IndianRupee, Zap, TrendingDown, MapPin } from "lucide-react";
import { indianStates } from "@shared/schema";

const stateSubsidies: Record<string, { ratePerKw: number; label: string }> = {
  "Odisha": { ratePerKw: 20000, label: "Odisha State Subsidy" },
  "Uttar Pradesh": { ratePerKw: 10000, label: "UP State Subsidy" },
};

interface SubsidyResult {
  capacity: number;
  totalCost: number;
  centralSubsidy: number;
  stateSubsidy: number;
  totalSubsidy: number;
  netCost: number;
  monthlyGeneration: number;
  annualSavings: number;
  paybackYears: number;
  state: string;
}

function calculateSubsidy(capacityKW: number, state: string = ""): SubsidyResult {
  const costPerKW = 60000;
  const totalCost = capacityKW * costPerKW;
  
  let centralSubsidy = 0;
  if (capacityKW <= 3) {
    centralSubsidy = capacityKW * 30000;
  } else if (capacityKW <= 10) {
    centralSubsidy = 3 * 30000 + (capacityKW - 3) * 18000;
  } else {
    centralSubsidy = 3 * 30000 + 7 * 18000;
  }
  centralSubsidy = Math.min(centralSubsidy, 78000);
  
  let stateSubsidy = 0;
  if (state && stateSubsidies[state]) {
    stateSubsidy = capacityKW * stateSubsidies[state].ratePerKw;
  }
  
  const totalSubsidy = centralSubsidy + stateSubsidy;
  const netCost = Math.max(0, totalCost - totalSubsidy);
  const monthlyGeneration = capacityKW * 120;
  const avgTariff = 7;
  const annualSavings = monthlyGeneration * 12 * avgTariff;
  const paybackYears = netCost > 0 ? netCost / annualSavings : 0;
  
  return {
    capacity: capacityKW,
    totalCost,
    centralSubsidy,
    stateSubsidy,
    totalSubsidy,
    netCost,
    monthlyGeneration,
    annualSavings,
    paybackYears: Math.round(paybackYears * 10) / 10,
    state,
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
        
        <div className="p-4 bg-muted/30 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{result.monthlyGeneration}</p>
              <p className="text-sm text-muted-foreground">kWh/month generation</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{result.paybackYears}</p>
              <p className="text-sm text-muted-foreground">years payback period</p>
            </div>
            <div>
              <p className="text-2xl font-bold">25+</p>
              <p className="text-sm text-muted-foreground">years panel lifespan</p>
            </div>
          </div>
        </div>
        
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
