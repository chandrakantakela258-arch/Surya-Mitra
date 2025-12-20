import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link as WouterLink, useLocation } from "wouter";
import { Loader2, ArrowLeft, Sun, IndianRupee, TrendingDown, CheckCircle2, Home, User, Phone, Mail, MapPin, Zap } from "lucide-react";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import logoImage from "@assets/88720521_logo_1766219255006.png";

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry", "Chandigarh",
  "Andaman and Nicobar Islands", "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep"
];

const roofTypes = ["rcc", "sheet", "tiles", "asbestos", "other"] as const;
const panelTypes = ["dcr_hybrid", "dcr_ongrid", "non_dcr"] as const;
const capacityOptions = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

const publicCustomerFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().min(5, "Address must be at least 5 characters"),
  district: z.string().min(2, "District is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().min(6, "Pincode must be 6 digits").max(6, "Pincode must be 6 digits"),
  roofType: z.enum(roofTypes),
  panelType: z.enum(panelTypes),
  proposedCapacity: z.string().min(1, "Capacity is required"),
  monthlyBill: z.string().optional(),
  referralCode: z.string().optional(),
});

type PublicCustomerFormValues = z.infer<typeof publicCustomerFormSchema>;

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function calculateSubsidy(capacityKw: number, panelType: string) {
  let centralSubsidy = 0;
  let totalCost = 0;
  
  if (panelType === "dcr_hybrid") {
    totalCost = capacityKw * 75000;
    if (capacityKw <= 2) {
      centralSubsidy = capacityKw * 30000;
    } else if (capacityKw === 3) {
      centralSubsidy = 78000;
    } else {
      centralSubsidy = 78000;
    }
  } else if (panelType === "dcr_ongrid") {
    totalCost = capacityKw * 66000;
    if (capacityKw <= 2) {
      centralSubsidy = capacityKw * 30000;
    } else if (capacityKw === 3) {
      centralSubsidy = 78000;
    } else {
      centralSubsidy = 78000;
    }
  } else {
    totalCost = capacityKw * 55000;
    centralSubsidy = 0;
  }
  
  const netCost = Math.max(0, totalCost - centralSubsidy);
  const dailyGeneration = capacityKw * 4;
  const monthlyGeneration = dailyGeneration * 30;
  const monthlySavings = monthlyGeneration * 7;
  const annualSavings = monthlySavings * 12;
  
  return { centralSubsidy, totalCost, netCost, dailyGeneration, monthlyGeneration, monthlySavings, annualSavings };
}

function SubsidyPreview({ capacity, panelType }: { capacity: string; panelType: string }) {
  const capacityNum = parseFloat(capacity || "0") || 0;
  const isNonDcr = panelType === "non_dcr";
  
  if (capacityNum <= 0) {
    return null;
  }
  
  const result = calculateSubsidy(capacityNum, panelType);
  
  return (
    <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="p-2 bg-background rounded-lg">
            <p className="text-sm text-muted-foreground">System Cost</p>
            <p className="text-lg font-bold">{formatINR(result.totalCost)}</p>
          </div>
          {!isNonDcr && (
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">Subsidy</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                - {formatINR(result.centralSubsidy)}
              </p>
            </div>
          )}
          <div className="p-2 bg-background rounded-lg">
            <p className="text-sm text-muted-foreground">You Pay</p>
            <p className="text-lg font-bold text-primary">{formatINR(isNonDcr ? result.totalCost : result.netCost)}</p>
          </div>
          <div className="p-2 bg-background rounded-lg">
            <p className="text-sm text-muted-foreground">Monthly Savings</p>
            <p className="text-lg font-bold text-orange-600">{formatINR(result.monthlySavings)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CustomerRegistration() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<PublicCustomerFormValues>({
    resolver: zodResolver(publicCustomerFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      district: "",
      state: "",
      pincode: "",
      roofType: "rcc",
      panelType: "dcr_hybrid",
      proposedCapacity: "3",
      monthlyBill: "",
      referralCode: "",
    },
  });

  const watchCapacity = form.watch("proposedCapacity");
  const watchPanelType = form.watch("panelType");

  async function onSubmit(data: PublicCustomerFormValues) {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/public/customer-registration", data);
      setIsSuccess(true);
      toast({
        title: "Registration Successful",
        description: "Thank you for your interest! Our partner will contact you soon.",
      });
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4 h-16">
              <WouterLink href="/">
                <img src={logoImage} alt="Divyanshi Solar" className="h-12 w-auto object-contain" />
              </WouterLink>
              <ThemeToggle />
            </div>
          </div>
        </header>
        
        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-green-50 dark:bg-green-950/30 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-4" data-testid="text-success-title">Registration Successful!</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Thank you for your interest in solar energy. Our partner will contact you within 24-48 hours to discuss your requirements and schedule a site visit.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <WouterLink href="/">
              <Button variant="outline" className="gap-2" data-testid="button-back-home">
                <Home className="w-4 h-4" />
                Back to Home
              </Button>
            </WouterLink>
            <WouterLink href="/subsidy-calculator">
              <Button className="gap-2" data-testid="button-calculator">
                <IndianRupee className="w-4 h-4" />
                Calculate Subsidy
              </Button>
            </WouterLink>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <WouterLink href="/">
              <img src={logoImage} alt="Divyanshi Solar" className="h-12 w-auto object-contain cursor-pointer" />
            </WouterLink>
            <div className="flex items-center gap-2">
              <WouterLink href="/login">
                <Button variant="ghost" size="sm" data-testid="button-login">Partner Login</Button>
              </WouterLink>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WouterLink href="/">
          <Button variant="ghost" className="mb-6 gap-2" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </WouterLink>

        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Sun className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Register for Solar Installation</h1>
          <p className="text-muted-foreground">
            Fill out the form below to get started with PM Surya Ghar Yojana. Our partner will contact you shortly.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="10-digit mobile number" {...field} data-testid="input-phone" />
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
                        <FormLabel>Email (Optional)</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your@email.com" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Address Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Address *</FormLabel>
                      <FormControl>
                        <Input placeholder="House/Building, Street, Area" {...field} data-testid="input-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>District *</FormLabel>
                        <FormControl>
                          <Input placeholder="District" {...field} data-testid="input-district" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-state">
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {indianStates.map((state) => (
                              <SelectItem key={state} value={state}>{state}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                          <Input placeholder="6-digit pincode" maxLength={6} {...field} data-testid="input-pincode" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Solar System Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="roofType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roof Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-roof-type">
                              <SelectValue placeholder="Select roof type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="rcc">RCC (Concrete)</SelectItem>
                            <SelectItem value="sheet">Metal Sheet</SelectItem>
                            <SelectItem value="tiles">Tiles</SelectItem>
                            <SelectItem value="asbestos">Asbestos</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="monthlyBill"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Electricity Bill (Rs)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 2000" {...field} data-testid="input-monthly-bill" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="panelType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Panel Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-panel-type">
                            <SelectValue placeholder="Select panel type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="dcr_hybrid">DCR with 3-in-1 Hybrid Inverter (Rs 75/W) - Subsidy Eligible</SelectItem>
                          <SelectItem value="dcr_ongrid">DCR with Ongrid Inverter (Rs 66/W) - Subsidy Eligible</SelectItem>
                          <SelectItem value="non_dcr">Non-DCR Panels (Rs 55/W) - No Subsidy</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        DCR panels are eligible for government subsidy under PM Surya Ghar Yojana
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="proposedCapacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proposed Capacity (kW) *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-capacity">
                            <SelectValue placeholder="Select capacity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {capacityOptions.map((cap) => (
                            <SelectItem key={cap} value={cap}>{cap} kW</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Subsidy available up to 3 kW for residential installations
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {watchCapacity && watchPanelType && (
                  <SubsidyPreview capacity={watchCapacity} panelType={watchPanelType} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Referral Code (Optional)</CardTitle>
                <CardDescription>
                  If you were referred by a partner, enter their referral code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="referralCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Enter referral code" {...field} data-testid="input-referral-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                type="submit" 
                className="flex-1 gap-2" 
                disabled={isSubmitting}
                data-testid="button-submit"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4" />
                    Submit Registration
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>By submitting this form, you agree to our{" "}
            <WouterLink href="/terms-and-conditions">
              <span className="text-primary hover:underline cursor-pointer">Terms & Conditions</span>
            </WouterLink>
            {" "}and{" "}
            <WouterLink href="/privacy-policy">
              <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>
            </WouterLink>
          </p>
        </div>
      </main>
    </div>
  );
}
