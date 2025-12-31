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
  aadharNumber: z.string().length(12, "Aadhaar must be 12 digits").regex(/^\d{12}$/, "Aadhaar must contain only digits"),
  panNumber: z.string().length(10, "PAN must be 10 characters").regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN format (e.g., ABCDE1234F)"),
  latitude: z.string().optional().or(z.literal("")),
  longitude: z.string().optional().or(z.literal("")),
  customerType: z.enum(customerTypes).default("residential"),
  unitType: z.string().optional().or(z.literal("")),
  commercialUnitDescription: z.string().optional().or(z.literal("")),
  industrialUnitDescription: z.string().optional().or(z.literal("")),
  roofType: z.enum(roofTypes),
  panelType: z.enum(panelTypes),
  proposedCapacity: z.string().min(1, "Capacity is required"),
  monthlyBill: z.string().optional(),
  referralCode: z.string().optional(),
}).refine((data) => {
  if (data.customerType === "commercial" && (!data.commercialUnitDescription || data.commercialUnitDescription.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Commercial Unit Description is required for commercial installations",
  path: ["commercialUnitDescription"],
}).refine((data) => {
  if (data.customerType === "industrial" && (!data.industrialUnitDescription || data.industrialUnitDescription.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Industrial Unit Description is required for industrial installations",
  path: ["industrialUnitDescription"],
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
      latitude: "",
      longitude: "",
      customerType: "residential",
      commercialUnitDescription: "",
      industrialUnitDescription: "",
      roofType: "rcc",
      panelType: "dcr_hybrid",
      proposedCapacity: "3",
      monthlyBill: "",
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
                        <FormLabel>Aadhaar Number *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="12-digit Aadhaar number" 
                            maxLength={12}
                            {...field} 
                            data-testid="input-aadhar"
                          />
                        </FormControl>
                        <FormDescription>Required for subsidy application</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="panNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PAN Number *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="ABCDE1234F" 
                            maxLength={10}
                            {...field} 
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            data-testid="input-pan"
                          />
                        </FormControl>
                        <FormDescription>Required for subsidy and tax purposes</FormDescription>
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
                        <FormLabel>Latitude</FormLabel>
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
                        <FormLabel>Longitude</FormLabel>
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
                          <SelectItem value="commercial">Commercial (10 kW to 100 kW)</SelectItem>
                          <SelectItem value="industrial">Industrial (50 kW to 1000 kW)</SelectItem>
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
                          <FormLabel>Commercial Unit Description *</FormLabel>
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
                  render={({ field }) => {
                    const customerType = watchCustomerType || "residential";
                    const isResidential = customerType === "residential";
                    const isCommercial = customerType === "commercial";
                    
                    const capacityOptions = isResidential 
                      ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                      : isCommercial 
                        ? [10, 15, 20, 25, 30, 40, 50, 60, 75, 100]
                        : [50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000];

                    return (
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
                              <SelectItem key={cap} value={cap.toString()}>{cap} kW</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {isResidential 
                            ? "Subsidy available up to 3 kW for residential installations"
                            : isCommercial
                              ? "Commercial: 10-100 kW (no subsidy)"
                              : "Industrial: 50-1000 kW (no subsidy)"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
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
