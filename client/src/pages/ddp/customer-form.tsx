import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { Loader2, ArrowLeft, Sun, IndianRupee, TrendingDown, Zap, BatteryCharging, CreditCard } from "lucide-react";
import { customerFormSchema, indianStates, roofTypes, panelTypes } from "@shared/schema";
import { calculateSubsidy, formatINR } from "@/components/subsidy-calculator";
import type { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type CustomerFormValues = z.infer<typeof customerFormSchema>;

function SubsidyEstimateCard({ capacity, panelType }: { capacity: string | null | undefined; panelType: string }) {
  const capacityNum = parseFloat(capacity || "0") || 0;
  const isNonDcr = panelType === "non_dcr";
  
  if (capacityNum <= 0) {
    return (
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <IndianRupee className="w-5 h-5 text-primary" />
            {isNonDcr ? "Cost Estimate" : "Subsidy Estimate"}
          </CardTitle>
          <CardDescription>
            Select proposed capacity above to see {isNonDcr ? "cost" : "subsidy"} calculation
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  const result = calculateSubsidy(capacityNum, "", panelType);
  
  if (isNonDcr) {
    return (
      <div className="space-y-4">
        <Card className="bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-orange-700 dark:text-orange-300">
              <IndianRupee className="w-5 h-5" />
              Cost Estimate for {capacityNum} kW Non-DCR System
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground">System Cost</p>
                <p className="text-xl font-semibold font-mono">{formatINR(result.totalCost)}</p>
                <p className="text-xs text-muted-foreground">Rs 55,000 per kW</p>
              </div>
              <div className="p-3 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground">Customer Pays</p>
                <p className="text-xl font-semibold font-mono text-primary">{formatINR(result.totalCost)}</p>
                <p className="text-xs text-muted-foreground">No government subsidy</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Power Savings */}
        <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className="p-2 bg-background rounded-lg">
                <p className="text-lg font-bold text-green-600">{result.dailyGeneration}</p>
                <p className="text-xs text-muted-foreground">Units/Day</p>
              </div>
              <div className="p-2 bg-background rounded-lg">
                <p className="text-lg font-bold text-green-600">{result.monthlyGeneration}</p>
                <p className="text-xs text-muted-foreground">Units/Month</p>
              </div>
              <div className="p-2 bg-background rounded-lg">
                <p className="text-lg font-bold text-orange-600">{formatINR(result.monthlySavings)}</p>
                <p className="text-xs text-muted-foreground">Monthly Savings</p>
              </div>
              <div className="p-2 bg-background rounded-lg">
                <p className="text-lg font-bold text-orange-600">{formatINR(result.annualSavings)}</p>
                <p className="text-xs text-muted-foreground">Annual Savings</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">4 units/kW/day at Rs 7/unit</p>
          </CardContent>
        </Card>
        
        {/* EMI with Power Saving Adjustment */}
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-2 bg-background rounded-lg">
                <p className="text-xs text-muted-foreground">Monthly EMI</p>
                <p className="text-lg font-bold text-blue-600">{formatINR(result.emiMonthly)}</p>
              </div>
              <div className="p-2 bg-background rounded-lg">
                <p className="text-xs text-muted-foreground">- Power Savings</p>
                <p className="text-lg font-bold text-green-600">- {formatINR(result.monthlySavings)}</p>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Effective Monthly Payment</p>
              <p className="text-2xl font-bold text-primary">
                {result.monthlySavings >= result.emiMonthly 
                  ? formatINR(0) + " (FREE!)"
                  : formatINR(result.emiMonthly - result.monthlySavings)}
              </p>
              <p className="text-xs text-muted-foreground">Your actual pocket expense after power savings</p>
            </div>
            <p className="text-xs text-muted-foreground text-center">10% interest for 5 years | Payback: {result.paybackYears} years</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-green-700 dark:text-green-300">
            <TrendingDown className="w-5 h-5" />
            Subsidy Estimate for {capacityNum} kW DCR System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-background rounded-lg">
              <p className="text-sm text-muted-foreground">System Cost</p>
              <p className="text-xl font-semibold font-mono">{formatINR(result.totalCost)}</p>
              <p className="text-xs text-muted-foreground">with 3-in-1 Hybrid Inverter</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">Government Subsidy</p>
              <p className="text-xl font-semibold font-mono text-green-600 dark:text-green-400">
                - {formatINR(result.centralSubsidy)}
              </p>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <p className="text-sm text-muted-foreground">Customer Pays</p>
              <p className="text-xl font-semibold font-mono text-primary">{formatINR(result.netCost)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Power Savings */}
      <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="p-2 bg-background rounded-lg">
              <p className="text-lg font-bold text-green-600">{result.dailyGeneration}</p>
              <p className="text-xs text-muted-foreground">Units/Day</p>
            </div>
            <div className="p-2 bg-background rounded-lg">
              <p className="text-lg font-bold text-green-600">{result.monthlyGeneration}</p>
              <p className="text-xs text-muted-foreground">Units/Month</p>
            </div>
            <div className="p-2 bg-background rounded-lg">
              <p className="text-lg font-bold text-orange-600">{formatINR(result.monthlySavings)}</p>
              <p className="text-xs text-muted-foreground">Monthly Savings</p>
            </div>
            <div className="p-2 bg-background rounded-lg">
              <p className="text-lg font-bold text-orange-600">{formatINR(result.annualSavings)}</p>
              <p className="text-xs text-muted-foreground">Annual Savings</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">4 units/kW/day at Rs 7/unit</p>
        </CardContent>
      </Card>
      
      {/* EMI with Power Saving Adjustment */}
      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-2 bg-background rounded-lg">
              <p className="text-xs text-muted-foreground">Monthly EMI</p>
              <p className="text-lg font-bold text-blue-600">{formatINR(result.emiMonthly)}</p>
            </div>
            <div className="p-2 bg-background rounded-lg">
              <p className="text-xs text-muted-foreground">- Power Savings</p>
              <p className="text-lg font-bold text-green-600">- {formatINR(result.monthlySavings)}</p>
            </div>
          </div>
          <div className="p-3 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Effective Monthly Payment</p>
            <p className="text-2xl font-bold text-primary">
              {result.monthlySavings >= result.emiMonthly 
                ? formatINR(0) + " (FREE!)"
                : formatINR(result.emiMonthly - result.monthlySavings)}
            </p>
            <p className="text-xs text-muted-foreground">Your actual pocket expense after power savings</p>
          </div>
          <p className="text-xs text-muted-foreground text-center">10% interest for 5 years | Payback: {result.paybackYears} years</p>
        </CardContent>
      </Card>
      
      <Card className="bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-green-600" />
              <span>Works during power cuts (others don't)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <BatteryCharging className="w-4 h-4 text-blue-600" />
              <span>Battery ready for night use (others can't)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CustomerForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      district: "",
      state: "",
      pincode: "",
      electricityBoard: "",
      consumerNumber: "",
      sanctionedLoad: "",
      avgMonthlyBill: undefined,
      roofType: "",
      roofArea: undefined,
      panelType: "dcr",
      proposedCapacity: "",
      status: "pending",
      documents: [],
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
      bankName: "",
      upiId: "",
    },
  });

  async function onSubmit(data: CustomerFormValues) {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/ddp/customers", data);
      toast({
        title: "Customer registered successfully",
        description: `${data.name} has been added for solar installation under PM Surya Ghar Yojana.`,
      });
      setLocation("/ddp/customers");
    } catch (error: any) {
      toast({
        title: "Failed to register customer",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/ddp/customers")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">Add Customer</h1>
          <p className="text-muted-foreground">Register a new customer for PM Surya Ghar Yojana</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-primary" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Customer's basic details for the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter customer's full name" 
                          data-testid="input-name"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="10-digit mobile number" 
                          data-testid="input-phone"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="customer@example.com" 
                          data-testid="input-email"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complete Address *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="House no., Street, Locality" 
                        data-testid="input-address"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-state">
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {indianStates.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>District *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="District name" 
                          data-testid="input-district"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pincode *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="6-digit pincode" 
                          maxLength={6}
                          data-testid="input-pincode"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Electricity Details */}
          <Card>
            <CardHeader>
              <CardTitle>Electricity Details</CardTitle>
              <CardDescription>
                Information about the customer's current electricity connection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="electricityBoard"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Electricity Board/DISCOM</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., BSES, MSEDCL, KSEB" 
                          data-testid="input-electricity-board"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consumerNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consumer/K Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Electricity consumer number" 
                          data-testid="input-consumer-number"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sanctionedLoad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sanctioned Load (kW)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., 3, 5, 10" 
                          data-testid="input-sanctioned-load"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="avgMonthlyBill"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Average Monthly Bill (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="e.g., 2500" 
                          data-testid="input-avg-bill"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>
                        Average of last 6 months electricity bill
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Roof & Capacity Details */}
          <Card>
            <CardHeader>
              <CardTitle>Roof & Capacity Details</CardTitle>
              <CardDescription>
                Information about the rooftop for solar panel installation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="roofType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Roof Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger data-testid="select-roof-type">
                            <SelectValue placeholder="Select roof type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roofTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="roofArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Available Roof Area (sq ft)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="e.g., 300" 
                          data-testid="input-roof-area"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>
                        Shadow-free area available for panels
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="panelType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Panel Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "dcr"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-panel-type">
                            <SelectValue placeholder="Select panel type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {panelTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        DCR panels are eligible for government subsidy
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="proposedCapacity"
                  render={({ field }) => {
                    const panelType = form.watch("panelType") || "dcr";
                    const isDcr = panelType === "dcr";
                    
                    return (
                      <FormItem>
                        <FormLabel>Proposed Capacity (kW)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-proposed-capacity">
                              <SelectValue placeholder="Select capacity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isDcr ? (
                              <>
                                <SelectItem value="3">3 kW</SelectItem>
                                <SelectItem value="5">5 kW</SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem value="6">6 kW</SelectItem>
                                <SelectItem value="7">7 kW</SelectItem>
                                <SelectItem value="8">8 kW</SelectItem>
                                <SelectItem value="9">9 kW</SelectItem>
                                <SelectItem value="10">10 kW</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {isDcr 
                            ? "DCR panels: Choose 3 kW or 5 kW (government subsidy eligible)" 
                            : "Non-DCR panels: 6-10 kW options at Rs 55,000/kW"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Subsidy Estimate */}
          <SubsidyEstimateCard capacity={form.watch("proposedCapacity")} panelType={form.watch("panelType") || "dcr"} />

          {/* Bank Account Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Payment Details
              </CardTitle>
              <CardDescription>
                Customer's bank account or UPI for receiving any payouts via Razorpay
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="accountHolderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Holder Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Name as per bank account" 
                          data-testid="input-account-holder"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., State Bank of India" 
                          data-testid="input-bank-name"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Bank account number" 
                          data-testid="input-account-number"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ifscCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IFSC Code</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., SBIN0001234" 
                          data-testid="input-ifsc-code"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="upiId"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>UPI ID (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., customer@upi or 9876543210@paytm" 
                          data-testid="input-upi-id"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide either bank details or UPI ID for payments
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/ddp/customers")}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              data-testid="button-submit"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Register Customer"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
