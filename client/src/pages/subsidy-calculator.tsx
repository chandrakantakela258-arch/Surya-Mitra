import { useState } from "react";
import { Link as WouterLink } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sun, Calculator, ArrowLeft, IndianRupee, Zap, Home, CheckCircle2 } from "lucide-react";

const states = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir"
];

const capacityOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function calculateSubsidy(capacityKw: number, state: string): { centralSubsidy: number; stateSubsidy: number; totalSubsidy: number } {
  let centralSubsidy = 0;
  
  if (capacityKw <= 2) {
    centralSubsidy = capacityKw * 30000;
  } else if (capacityKw === 3) {
    centralSubsidy = (2 * 30000) + (1 * 18000);
  } else {
    centralSubsidy = 78000;
  }

  let stateSubsidy = 0;
  if (capacityKw <= 3) {
    if (state === "Odisha") {
      stateSubsidy = capacityKw * 20000;
    } else if (state === "Uttar Pradesh") {
      stateSubsidy = capacityKw * 10000;
    }
  }

  return {
    centralSubsidy,
    stateSubsidy,
    totalSubsidy: centralSubsidy + stateSubsidy
  };
}

function calculateSystemCost(capacityKw: number, panelType: string): number {
  if (panelType === "dcr_hybrid") {
    return capacityKw * 75000;
  } else if (panelType === "dcr_ongrid") {
    return capacityKw * 66000;
  } else {
    return capacityKw * 55000;
  }
}

export default function SubsidyCalculatorPage() {
  const [capacity, setCapacity] = useState<number>(3);
  const [state, setState] = useState<string>("Delhi");
  const [panelType, setPanelType] = useState<string>("dcr_hybrid");

  const subsidy = calculateSubsidy(capacity, state);
  const systemCost = calculateSystemCost(capacity, panelType);
  const netCost = Math.max(0, systemCost - subsidy.totalSubsidy);
  const annualSavings = capacity * 1500 * 12 * 6;
  const paybackYears = netCost > 0 ? Math.round(netCost / annualSavings * 10) / 10 : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <WouterLink href="/">
              <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </WouterLink>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Sun className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold hidden sm:block">DivyanshiSolar</span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <WouterLink href="/login">
                <Button variant="ghost" size="sm" data-testid="button-login">
                  Login
                </Button>
              </WouterLink>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Calculator className="w-4 h-4" />
            PM Surya Ghar Yojana
          </div>
          <h1 className="text-3xl font-bold mb-3">Solar Subsidy Calculator</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Calculate your estimated subsidy, system cost, and savings under the PM Surya Ghar Muft Bijli Yojana
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                System Configuration
              </CardTitle>
              <CardDescription>
                Select your requirements to calculate subsidy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="capacity">System Capacity (kW)</Label>
                <Select value={capacity.toString()} onValueChange={(v) => setCapacity(parseInt(v))}>
                  <SelectTrigger id="capacity" data-testid="select-capacity">
                    <SelectValue placeholder="Select capacity" />
                  </SelectTrigger>
                  <SelectContent>
                    {capacityOptions.map((c) => (
                      <SelectItem key={c} value={c.toString()}>
                        {c} kW {c <= 3 ? "(Subsidy Eligible)" : "(Beyond Subsidy Limit)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Central subsidy available up to 3 kW capacity
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger id="state" data-testid="select-state">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s} {s === "Odisha" ? "(+Rs 20,000/kW)" : s === "Uttar Pradesh" ? "(+Rs 10,000/kW)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(state === "Odisha" || state === "Uttar Pradesh") && (
                  <p className="text-xs text-primary">
                    Additional state subsidy available in {state}!
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="panelType">Panel & Inverter Type</Label>
                <Select value={panelType} onValueChange={setPanelType}>
                  <SelectTrigger id="panelType" data-testid="select-panel-type">
                    <SelectValue placeholder="Select panel type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dcr_hybrid">
                      DCR Panel + 3-in-1 Hybrid Inverter (Rs 75/W)
                    </SelectItem>
                    <SelectItem value="dcr_ongrid">
                      DCR Panel + Ongrid Inverter (Rs 66/W)
                    </SelectItem>
                    <SelectItem value="non_dcr">
                      Non-DCR Panel (Rs 55/W) - No Subsidy
                    </SelectItem>
                  </SelectContent>
                </Select>
                {panelType === "non_dcr" && (
                  <p className="text-xs text-destructive">
                    Non-DCR panels are not eligible for government subsidy
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results Card */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-primary" />
                Your Estimated Savings
              </CardTitle>
              <CardDescription>
                Based on your selected configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {panelType !== "non_dcr" && (
                <>
                  <div className="p-4 bg-background rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Central Subsidy</span>
                      <span className="font-semibold text-primary">Rs {subsidy.centralSubsidy.toLocaleString()}</span>
                    </div>
                    {subsidy.stateSubsidy > 0 && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">State Subsidy ({state})</span>
                        <span className="font-semibold text-primary">Rs {subsidy.stateSubsidy.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-medium">Total Subsidy</span>
                      <span className="font-bold text-xl text-primary">Rs {subsidy.totalSubsidy.toLocaleString()}</span>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">System Cost</span>
                  <span className="font-medium">Rs {systemCost.toLocaleString()}</span>
                </div>
                {panelType !== "non_dcr" && (
                  <div className="flex justify-between items-center text-primary">
                    <span>Less: Subsidy</span>
                    <span>- Rs {subsidy.totalSubsidy.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-medium">Net Cost to You</span>
                  <span className="font-bold text-xl">Rs {netCost.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-4 bg-background rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Est. Annual Savings</span>
                  <span className="font-semibold">Rs {annualSavings.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Payback Period</span>
                  <span className="font-semibold text-primary">{paybackYears} years</span>
                </div>
              </div>

              {capacity <= 3 && panelType !== "non_dcr" && (
                <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg text-sm">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Great choice!</strong> Your {capacity} kW system qualifies for the maximum subsidy rate. 
                    You'll enjoy nearly free electricity for 25+ years.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <Card className="mt-8">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg">Ready to go solar?</h3>
              <p className="text-muted-foreground">Contact our partner network for installation</p>
            </div>
            <div className="flex gap-3">
              <WouterLink href="/register">
                <Button data-testid="button-become-partner">Become a Partner</Button>
              </WouterLink>
              <WouterLink href="/">
                <Button variant="outline" data-testid="button-learn-more">Learn More</Button>
              </WouterLink>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
