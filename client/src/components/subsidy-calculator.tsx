import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sun, IndianRupee, Zap, TrendingDown } from "lucide-react";

interface SubsidyResult {
  capacity: number;
  totalCost: number;
  subsidyAmount: number;
  netCost: number;
  monthlyGeneration: number;
  annualSavings: number;
  paybackYears: number;
}

function calculateSubsidy(capacityKW: number): SubsidyResult {
  const costPerKW = 60000;
  const totalCost = capacityKW * costPerKW;
  
  let subsidyAmount = 0;
  if (capacityKW <= 3) {
    subsidyAmount = capacityKW * 30000;
  } else if (capacityKW <= 10) {
    subsidyAmount = 3 * 30000 + (capacityKW - 3) * 18000;
  } else {
    subsidyAmount = 3 * 30000 + 7 * 18000;
  }
  subsidyAmount = Math.min(subsidyAmount, 78000);
  
  const netCost = totalCost - subsidyAmount;
  const monthlyGeneration = capacityKW * 120;
  const avgTariff = 7;
  const annualSavings = monthlyGeneration * 12 * avgTariff;
  const paybackYears = netCost / annualSavings;
  
  return {
    capacity: capacityKW,
    totalCost,
    subsidyAmount,
    netCost,
    monthlyGeneration,
    annualSavings,
    paybackYears: Math.round(paybackYears * 10) / 10,
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
  initialCapacity?: number;
  compact?: boolean;
}

export function SubsidyCalculator({ 
  onCapacityChange, 
  initialCapacity = 3,
  compact = false 
}: SubsidyCalculatorProps) {
  const [capacity, setCapacity] = useState(initialCapacity);
  
  const result = useMemo(() => calculateSubsidy(capacity), [capacity]);
  
  function handleCapacityChange(value: number[]) {
    const newCapacity = value[0];
    setCapacity(newCapacity);
    onCapacityChange?.(newCapacity);
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
            Subsidy: {formatINR(result.subsidyAmount)}
          </Badge>
        </div>
        
        <Slider
          value={[capacity]}
          onValueChange={handleCapacityChange}
          min={1}
          max={10}
          step={0.5}
          data-testid="slider-capacity"
        />
        
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
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Label htmlFor="capacity-slider">Solar Plant Capacity</Label>
            <Badge variant="outline" className="font-mono text-lg">
              {capacity} kW
            </Badge>
          </div>
          <Slider
            id="capacity-slider"
            value={[capacity]}
            onValueChange={handleCapacityChange}
            min={1}
            max={10}
            step={0.5}
            data-testid="slider-capacity-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 kW</span>
            <span>5 kW</span>
            <span>10 kW</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <span className="text-sm">Government Subsidy</span>
            </div>
            <p className="text-xl font-semibold font-mono text-green-600 dark:text-green-400">
              - {formatINR(result.subsidyAmount)}
            </p>
          </div>
          
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
          <p>* Subsidy rates: Up to 3 kW - Rs 30,000/kW | 3-10 kW - Rs 18,000/kW (above 3 kW) | Maximum subsidy - Rs 78,000</p>
          <p>* Calculations based on average solar generation of 4 kWh/kW/day and Rs 7/kWh electricity tariff</p>
        </div>
      </CardContent>
    </Card>
  );
}

export { calculateSubsidy, formatINR };
export type { SubsidyResult };
