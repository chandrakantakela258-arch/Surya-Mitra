import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link as WouterLink, useLocation } from "wouter";
import { Loader2, ArrowLeft, Sun, IndianRupee, TrendingDown, CheckCircle2, Home, User, Phone, Mail, MapPin, Zap, Navigation, CreditCard, FileText } from "lucide-react";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
const customerTypes = ["residential", "commercial", "industrial"] as const;

// Unit types for commercial and industrial installations
const commercialUnitTypes = [
  { value: "hospital", label: "Hospital / Clinic" },
  { value: "school", label: "School / College / University" },
  { value: "hotel", label: "Hotel / Resort" },
  { value: "mall", label: "Shopping Mall / Complex" },
  { value: "office", label: "Office Building" },
  { value: "shop", label: "Shop / Retail Store" },
  { value: "restaurant", label: "Restaurant / Cafe" },
  { value: "bank", label: "Bank / Financial Institution" },
  { value: "petrol_pump", label: "Petrol Pump" },
  { value: "other_commercial", label: "Other Commercial" },
] as const;

const industrialUnitTypes = [
  { value: "flour_mill", label: "Flour / Atta Mill" },
  { value: "rice_mill", label: "Rice Mill" },
  { value: "oil_mill", label: "Oil Mill" },
  { value: "dal_mill", label: "Dal / Pulse Mill" },
  { value: "cold_storage", label: "Cold Storage" },
  { value: "warehouse", label: "Warehouse / Godown" },
  { value: "factory", label: "Factory / Manufacturing Plant" },
  { value: "processing_unit", label: "Food Processing Unit" },
  { value: "textile", label: "Textile / Garment Factory" },
  { value: "steel_plant", label: "Steel / Iron Works" },
  { value: "packaging", label: "Packaging Unit" },
  { value: "other_industrial", label: "Other Industrial" },
] as const;

const publicCustomerFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().min(5, "Address must be at least 5 characters"),
  district: z.string().min(2, "District is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().min(6, "Pincode must be 6 digits").max(6, "Pincode must be 6 digits"),
  aadharNumber: z.string().optional().or(z.literal("")).refine(val => !val || /^\d{12}$/.test(val), { message: "Aadhaar must be 12 digits" }),
  panNumber: z.string().optional().or(z.literal("")).refine(val => !val || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(val), { message: "Invalid PAN format (e.g., ABCDE1234F)" }),
  // Electricity Details - Required
  electricityBoard: z.string().min(2, "Electricity board is required"),
  consumerNumber: z.string().min(3, "Consumer number is required"),
  sanctionedLoad: z.string().min(1, "Sanctioned load is required"),
  avgMonthlyBill: z.preprocess(
    (val) => (val === "" || val === null || val === undefined) ? undefined : Number(val),
    z.number({ required_error: "Monthly bill is required" }).min(1, "Monthly bill must be greater than 0")
  ),
  // Location - Required
  latitude: z.string().min(1, "Latitude is required - please capture your GPS location"),
  longitude: z.string().min(1, "Longitude is required - please capture your GPS location"),
  // Customer Type
  customerType: z.enum(customerTypes).default("residential"),
  unitType: z.string().optional().or(z.literal("")),
  commercialUnitDescription: z.string().optional().or(z.literal("")),
  industrialUnitDescription: z.string().optional().or(z.literal("")),
  // Roof Details - Required
  roofType: z.enum(roofTypes),
  roofArea: z.preprocess(
    (val) => (val === "" || val === null || val === undefined) ? undefined : Number(val),
    z.number({ required_error: "Roof area is required" }).min(1, "Roof area must be greater than 0")
  ),
  // Panel and Capacity - Required
  panelType: z.enum(panelTypes),
  proposedCapacity: z.string().min(1, "Capacity is required"),
  // Payment Details - Required
  accountHolderName: z.string().optional().or(z.literal("")),
  accountNumber: z.string().optional().or(z.literal("")),
  ifscCode: z.string().optional().or(z.literal("")).refine(val => !val || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(val), { message: "Invalid IFSC format" }),
  bankName: z.string().optional().or(z.literal("")),
  upiId: z.string().optional().or(z.literal("")),
  // Documents - Optional
  documents: z.array(z.string()).optional().default([]),
  // Optional
  referralCode: z.string().optional(),
}).refine((data) => {
  if (data.customerType === "commercial" && (!data.unitType || data.unitType.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Unit type is required for commercial installations",
  path: ["unitType"],
}).refine((data) => {
  if (data.customerType === "industrial" && (!data.unitType || data.unitType.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Unit type is required for industrial installations",
  path: ["unitType"],
});

type PublicCustomerFormValues = z.infer<typeof publicCustomerFormSchema>;

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

const registrationStateSubsidies: Record<string, { ratePerKw: number; maxSubsidy: number; label: string }> = {
  "Odisha": { ratePerKw: 20000, maxSubsidy: 60000, label: "Odisha State Subsidy" },
  "Uttar Pradesh": { ratePerKw: 10000, maxSubsidy: 30000, label: "UP State Subsidy" },
  "Chhattisgarh": { ratePerKw: 10000, maxSubsidy: 30000, label: "Chhattisgarh State Subsidy" },
};

function calculateSubsidy(capacityKw: number, panelType: string, customerType: string = "residential", state: string = "") {
  let centralSubsidy = 0;
  let stateSubsidy = 0;
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
    const ratePerKw = (customerType === "commercial" || customerType === "industrial") ? 45000 : 55000;
    totalCost = capacityKw * ratePerKw;
    centralSubsidy = 0;
  }

  const isSubsidyEligible = customerType === "residential" && panelType !== "non_dcr";
  if (isSubsidyEligible && state && registrationStateSubsidies[state]) {
    const stateInfo = registrationStateSubsidies[state];
    const calculated = Math.min(capacityKw, 3) * stateInfo.ratePerKw;
    stateSubsidy = Math.min(calculated, stateInfo.maxSubsidy);
  }

  const totalSubsidy = centralSubsidy + stateSubsidy;
  const netCost = Math.max(0, totalCost - totalSubsidy);
  const dailyGeneration = capacityKw * 4;
  const monthlyGeneration = dailyGeneration * 30;
  const electricityRate = customerType === "industrial" ? 9 : customerType === "commercial" ? 8 : 7;
  const monthlySavings = monthlyGeneration * electricityRate;
  const annualSavings = monthlySavings * 12;
  const stateSubsidyLabel = state && registrationStateSubsidies[state] ? registrationStateSubsidies[state].label : "";
  
  return { centralSubsidy, stateSubsidy, stateSubsidyLabel, totalSubsidy, totalCost, netCost, dailyGeneration, monthlyGeneration, monthlySavings, annualSavings };
}

function SubsidyPreview({ capacity, panelType, customerType = "residential", state = "" }: { capacity: string; panelType: string; customerType?: string; state?: string }) {
  const capacityNum = parseFloat(capacity || "0") || 0;
  const isNonDcr = panelType === "non_dcr";
  
  if (capacityNum <= 0) {
    return null;
  }
  
  const result = calculateSubsidy(capacityNum, panelType, customerType, state);
  const ratePerWatt = isNonDcr ? ((customerType === "commercial" || customerType === "industrial") ? 45 : 55) : (panelType === "dcr_hybrid" ? 75 : 66);
  
  return (
    <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="p-2 bg-background rounded-lg">
            <p className="text-sm text-muted-foreground">System Cost</p>
            <p className="text-lg font-bold">{formatINR(result.totalCost)}</p>
            <p className="text-xs text-muted-foreground">Rs {ratePerWatt}/Watt</p>
          </div>
          {!isNonDcr && customerType === "residential" && (
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">Central Subsidy</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                - {formatINR(result.centralSubsidy)}
              </p>
            </div>
          )}
          {result.stateSubsidy > 0 && (
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400">{result.stateSubsidyLabel || "State Subsidy"}</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                - {formatINR(result.stateSubsidy)}
              </p>
            </div>
          )}
          <div className="p-2 bg-background rounded-lg">
            <p className="text-sm text-muted-foreground">You Pay</p>
            <p className="text-lg font-bold text-primary">{formatINR(result.netCost)}</p>
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

  const [isGettingLocation, setIsGettingLocation] = useState(false);

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
      aadharNumber: "",
      panNumber: "",
      // Electricity Details
      electricityBoard: "",
      consumerNumber: "",
      sanctionedLoad: "",
      avgMonthlyBill: undefined,
      // Location
      latitude: "",
      longitude: "",
      // Customer Type
      customerType: "residential",
      unitType: "",
      commercialUnitDescription: "",
      industrialUnitDescription: "",
      // Roof Details
      roofType: "rcc",
      roofArea: undefined,
      // Panel and Capacity
      panelType: "dcr_hybrid",
      proposedCapacity: "3",
      // Payment Details
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
      bankName: "",
      upiId: "",
      // Documents
      documents: [],
      // Optional
      referralCode: "",
    },
  });

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
      return;
    }
    
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValue("latitude", position.coords.latitude.toFixed(6));
        form.setValue("longitude", position.coords.longitude.toFixed(6));
        setIsGettingLocation(false);
        toast({
          title: "Location captured",
          description: "GPS coordinates have been filled in",
        });
      },
      (error) => {
        setIsGettingLocation(false);
        toast({
          title: "Location error",
          description: error.message || "Failed to get location",
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const watchCapacity = form.watch("proposedCapacity");
  const watchPanelType = form.watch("panelType");
  const watchCustomerType = form.watch("customerType");
  const watchState = form.watch("state");

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="aadharNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-orange-600 dark:text-orange-400 font-semibold">Aadhaar Number (Important)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="12-digit Aadhaar number" 
                            maxLength={12}
                            className="border-orange-300 dark:border-orange-700 focus:border-orange-500"
                            {...field} 
                            data-testid="input-aadhar"
                          />
                        </FormControl>
                        <p className="text-xs text-orange-600 dark:text-orange-400">Required for subsidy application</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="panNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-orange-600 dark:text-orange-400 font-semibold">PAN Number (Important)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="ABCDE1234F" 
                            maxLength={10}
                            className="border-orange-300 dark:border-orange-700 focus:border-orange-500"
                            {...field} 
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            data-testid="input-pan"
                          />
                        </FormControl>
                        <p className="text-xs text-orange-600 dark:text-orange-400">Required for subsidy and tax purposes</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., 28.6139" 
                            {...field} 
                            value={field.value || ""}
                            data-testid="input-latitude"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., 77.2090" 
                            {...field} 
                            value={field.value || ""}
                            data-testid="input-longitude"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleGetLocation}
                    disabled={isGettingLocation}
                    className="gap-2"
                    data-testid="button-capture-gps"
                  >
                    {isGettingLocation ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Navigation className="w-4 h-4" />
                    )}
                    {isGettingLocation ? "Getting Location..." : "Capture GPS Location"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Electricity Details Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Electricity Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="electricityBoard"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Electricity Board *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., UPPCL, MSEDCL" {...field} data-testid="input-electricity-board" />
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
                        <FormLabel>Consumer Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="Electricity consumer number" {...field} data-testid="input-consumer-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sanctionedLoad"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sanctioned Load (kW) *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 3" {...field} data-testid="input-sanctioned-load" />
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
                        <FormLabel>Average Monthly Bill (Rs) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="e.g., 2000" 
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                            data-testid="input-monthly-bill" 
                          />
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
                  <Home className="w-5 h-5" />
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
                    name="roofArea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Available Roof Area (sq ft) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="e.g., 500" 
                            {...field} 
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                            data-testid="input-roof-area" 
                          />
                        </FormControl>
                        <FormDescription>Approximate roof space available for solar panels</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="customerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Installation Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "residential"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-customer-type">
                            <SelectValue placeholder="Select customer type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="residential">Residential (1 kW to 10 kW)</SelectItem>
                          <SelectItem value="commercial">Commercial (3 kW to 500 kW)</SelectItem>
                          <SelectItem value="industrial">Industrial (5 kW to 1000 kW)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Only residential DCR installations qualify for government subsidy
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("customerType") === "commercial" && (
                  <>
                    <FormField
                      control={form.control}
                      name="unitType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type of Commercial Unit *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger data-testid="select-commercial-unit-type">
                                <SelectValue placeholder="Select unit type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {commercialUnitTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the type of commercial establishment
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="commercialUnitDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commercial Unit Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Provide additional details about the commercial establishment" 
                              data-testid="input-commercial-description"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Additional details about the commercial property for installation
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {form.watch("customerType") === "industrial" && (
                  <>
                    <FormField
                      control={form.control}
                      name="unitType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type of Industrial Unit *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger data-testid="select-industrial-unit-type">
                                <SelectValue placeholder="Select unit type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {industrialUnitTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the type of industrial facility
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="industrialUnitDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industrial Unit Description *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Provide additional details about the industrial facility" 
                              data-testid="input-industrial-description"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Additional details about the industrial facility for installation
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                
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
                          <SelectItem value="non_dcr">Non-DCR Panels - No Subsidy</SelectItem>
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
                  render={({ field }) => {
                    const customerType = watchCustomerType || "residential";
                    const isResidential = customerType === "residential";
                    const isCommercial = customerType === "commercial";
                    const isIndustrial = customerType === "industrial";
                    
                    const capacityOptions = isResidential 
                      ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                      : isCommercial 
                        ? [3, 5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 150, 200, 250, 300, 400, 500]
                        : [5, 10, 15, 20, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000];

                    const [useCustomCapacity, setUseCustomCapacity] = useState(false);

                    return (
                      <FormItem>
                        <FormLabel>Proposed Capacity (kW) *</FormLabel>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={useCustomCapacity}
                              onCheckedChange={setUseCustomCapacity}
                              data-testid="switch-custom-capacity"
                            />
                            <span className="text-sm text-muted-foreground">
                              {useCustomCapacity ? "Custom value" : "Select from list"}
                            </span>
                          </div>
                          {useCustomCapacity ? (
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter capacity in kW"
                                data-testid="input-custom-capacity"
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value)}
                                min={isResidential ? 1 : isCommercial ? 3 : 5}
                                max={isResidential ? 10 : isCommercial ? 500 : 1000}
                              />
                            </FormControl>
                          ) : (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-capacity">
                                  <SelectValue placeholder="Select capacity" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {capacityOptions.map((cap) => (
                                  <SelectItem key={cap} value={cap.toString()}>{cap} kW</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                        <FormDescription>
                          {isResidential 
                            ? "Subsidy available up to 3 kW for residential installations"
                            : isCommercial
                              ? "Commercial: 3-500 kW (no subsidy)"
                              : "Industrial: 5-1000 kW (no subsidy)"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                
                {watchCapacity && watchPanelType && (
                  <SubsidyPreview capacity={watchCapacity} panelType={watchPanelType} customerType={watchCustomerType || "residential"} state={watchState || ""} />
                )}
              </CardContent>
            </Card>

            {/* Payment Details Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Details
                </CardTitle>
                <CardDescription>
                  Bank account details for subsidy disbursement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="accountHolderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Holder Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Name as per bank records" {...field} data-testid="input-account-holder" />
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
                        <FormLabel>Bank Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., State Bank of India" {...field} data-testid="input-bank-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="Bank account number" {...field} data-testid="input-account-number" />
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
                        <FormLabel>IFSC Code *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., SBIN0001234" 
                            maxLength={11}
                            {...field} 
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            data-testid="input-ifsc-code" 
                          />
                        </FormControl>
                        <FormDescription>11-character bank branch code</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="upiId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UPI ID (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., name@upi" 
                          {...field} 
                          value={field.value || ""}
                          data-testid="input-upi-id" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Documents Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documents Upload (Optional)
                </CardTitle>
                <CardDescription>
                  Upload documents if available (Aadhaar, PAN, Electricity Bill, Photo)
                </CardDescription>
                <p className="text-sm font-bold text-red-600 mt-2">
                  Please upload Bank Proof (Bank Passbook or Bank Cancel Cheque) - Optional
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="documents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upload Documents</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input
                            type="file"
                            multiple
                            accept="image/*,.pdf"
                            onChange={async (e) => {
                              const files = e.target.files;
                              if (files && files.length > 0) {
                                const formData = new FormData();
                                Array.from(files).forEach(file => formData.append("documents", file));
                                
                                try {
                                  const response = await fetch("/api/uploads/documents", {
                                    method: "POST",
                                    body: formData,
                                  });
                                  
                                  if (response.ok) {
                                    const result = await response.json();
                                    field.onChange([...field.value, ...(result.urls || [])]);
                                  }
                                } catch (error) {
                                  console.error("Upload failed:", error);
                                }
                              }
                            }}
                            data-testid="input-documents"
                          />
                          {field.value && field.value.length > 0 && (
                            <div className="text-sm text-muted-foreground">
                              {field.value.length} document(s) uploaded
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Upload Aadhaar Card, PAN Card, Recent Electricity Bill, and a Photo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
