import { useState, useMemo, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { Loader2, ArrowLeft, Sun, IndianRupee, Zap, CreditCard, FileText, Upload, X, File, MapPin, Navigation, Camera } from "lucide-react";
import { customerFormSchema, roofTypes } from "@shared/schema";
import { indianStatesData, getDistrictsForState, getCitiesForDistrict, getDiscomsForState } from "@shared/india-data";

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
  { value: "bike_car_tractor", label: "Bike / Car / Tractor Agency" },
  { value: "other_commercial", label: "Other Commercial" },
] as const;

const industrialUnitTypes = [
  { value: "flour_mill", label: "Flour / Atta Mill" },
  { value: "rice_mill", label: "Rice Mill" },
  { value: "oil_mill", label: "Oil Mill" },
  { value: "dal_mill", label: "Dal / Pulse Mill" },
  { value: "chura_mill", label: "Chura Mill" },
  { value: "masala_mill", label: "Masala Mill" },
  { value: "ro_plant", label: "RO Plant" },
  { value: "cold_storage", label: "Cold Storage" },
  { value: "warehouse", label: "Warehouse / Godown" },
  { value: "factory", label: "Factory / Manufacturing Plant" },
  { value: "processing_unit", label: "Food Processing Unit" },
  { value: "textile", label: "Textile / Garment Factory" },
  { value: "steel_plant", label: "Steel / Iron Works" },
  { value: "packaging", label: "Packaging Unit" },
  { value: "other_industrial", label: "Other Industrial" },
] as const;
import { formatINR } from "@/components/subsidy-calculator";
import type { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

type CustomerFormValues = z.infer<typeof customerFormSchema>;

const registrationStateSubsidies: Record<string, { ratePerKw: number; maxSubsidy: number; label: string }> = {
  "Odisha": { ratePerKw: 20000, maxSubsidy: 60000, label: "Odisha State Subsidy" },
  "Uttar Pradesh": { ratePerKw: 10000, maxSubsidy: 30000, label: "UP State Subsidy" },
  "Chhattisgarh": { ratePerKw: 10000, maxSubsidy: 30000, label: "Chhattisgarh State Subsidy" },
};

function localCalculateSubsidy(capacityKw: number, panelType: string, inverterType: string = "hybrid", customerType: string = "residential", state: string = "") {
  let centralSubsidy = 0;
  let stateSubsidy = 0;
  let totalCost = 0;
  let ratePerKw = 0;

  if (panelType === "dcr") {
    if (inverterType === "hybrid") {
      ratePerKw = 75000;
    } else {
      ratePerKw = 66000;
    }
    totalCost = capacityKw * ratePerKw;
    if (customerType === "residential") {
      if (capacityKw <= 2) {
        centralSubsidy = capacityKw * 30000;
      } else if (capacityKw <= 3) {
        centralSubsidy = 78000;
      } else {
        centralSubsidy = 78000;
      }
    }
  } else {
    if (inverterType === "hybrid") {
      ratePerKw = 55000;
    } else {
      ratePerKw = 45000;
    }
    totalCost = capacityKw * ratePerKw;
    centralSubsidy = 0;
  }

  const isSubsidyEligible = customerType === "residential" && panelType === "dcr";
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
  const ratePerWatt = ratePerKw / 1000;
  
  return { centralSubsidy, stateSubsidy, stateSubsidyLabel, totalSubsidy, totalCost, netCost, dailyGeneration, monthlyGeneration, monthlySavings, annualSavings, ratePerWatt };
}

function SubsidyPreview({ capacity, panelType, inverterType = "hybrid", customerType = "residential", state = "" }: { capacity: string; panelType: string; inverterType?: string; customerType?: string; state?: string }) {
  const capacityNum = parseFloat(capacity || "0") || 0;
  const isNonDcr = panelType === "non_dcr";
  
  if (capacityNum <= 0) {
    return null;
  }
  
  const result = localCalculateSubsidy(capacityNum, panelType, inverterType, customerType, state);
  
  return (
    <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="p-2 bg-background rounded-lg">
            <p className="text-sm text-muted-foreground">System Cost</p>
            <p className="text-lg font-bold">{formatINR(result.totalCost)}</p>
            <p className="text-xs text-muted-foreground">Rs {result.ratePerWatt}/Watt</p>
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
            <p className="text-sm text-muted-foreground">Customer Pays</p>
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

export default function CustomerForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [isUploadingDocs, setIsUploadingDocs] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const newFiles = Array.from(e.target.files);
    if (documentFiles.length + newFiles.length > 10) {
      toast({ title: "Error", description: "Maximum 10 documents allowed", variant: "destructive" });
      return;
    }
    setDocumentFiles(prev => [...prev, ...newFiles]);
    if (documentInputRef.current) documentInputRef.current.value = "";
  };

  const removeDocument = (index: number) => {
    setDocumentFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Error", description: "Geolocation is not supported by your browser", variant: "destructive" });
      return;
    }
    
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValue("latitude", position.coords.latitude.toFixed(6));
        form.setValue("longitude", position.coords.longitude.toFixed(6));
        setIsGettingLocation(false);
        toast({ title: "Location captured", description: "GPS coordinates have been added to the form" });
      },
      (error) => {
        setIsGettingLocation(false);
        toast({ title: "Error", description: "Failed to get location: " + error.message, variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      aadharNumber: "",
      panNumber: "",
      address: "",
      district: "",
      state: "",
      pincode: "",
      latitude: "",
      longitude: "",
      electricityBoard: "",
      consumerNumber: "",
      sanctionedLoad: "",
      avgMonthlyBill: undefined,
      roofType: "",
      roofArea: undefined,
      panelType: "dcr",
      inverterType: "hybrid",
      proposedCapacity: "",
      customerType: "residential",
      status: "pending",
      documents: [],
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
      bankName: "",
      upiId: "",
    },
  });

  const watchedPanelType = form.watch("panelType");
  const watchedInverterType = form.watch("inverterType");
  const watchedCustomerType = form.watch("customerType");
  const watchedCapacity = form.watch("proposedCapacity");
  const watchedState = form.watch("state");
  const watchedDistrict = form.watch("district");
  const [selectedCity, setSelectedCity] = useState("");

  const availableDistricts = useMemo(() => watchedState ? getDistrictsForState(watchedState) : [], [watchedState]);
  const availableCities = useMemo(() => watchedDistrict ? getCitiesForDistrict(watchedDistrict) : [], [watchedDistrict]);
  const availableDiscoms = useMemo(() => watchedState ? getDiscomsForState(watchedState) : [], [watchedState]);

  useEffect(() => {
    form.setValue("district", "");
    setSelectedCity("");
    form.setValue("electricityBoard", "");
  }, [watchedState]);

  useEffect(() => {
    setSelectedCity("");
  }, [watchedDistrict]);

  useEffect(() => {
    if (watchedCustomerType !== "residential") return;
    const currentCapacity = parseFloat(form.getValues("proposedCapacity") || "0");
    
    if (watchedInverterType === "hybrid") {
      if (![3, 5, 6].includes(currentCapacity)) {
        form.setValue("proposedCapacity", "3");
      }
    } else if (watchedPanelType === "non_dcr" && watchedInverterType === "ongrid") {
      if (currentCapacity < 8) {
        form.setValue("proposedCapacity", "8");
      }
    } else if (watchedPanelType === "dcr" && watchedInverterType === "ongrid") {
      if (currentCapacity < 3) {
        form.setValue("proposedCapacity", "3");
      }
    }
  }, [watchedPanelType, watchedInverterType, watchedCustomerType]);

  async function onSubmit(data: CustomerFormValues) {
    setIsLoading(true);
    try {
      let uploadedDocuments: string[] = [];
      
      if (documentFiles.length > 0) {
        setIsUploadingDocs(true);
        const formData = new FormData();
        documentFiles.forEach(file => formData.append("documents", file));
        
        const uploadResponse = await fetch("/api/uploads/documents", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        
        if (!uploadResponse.ok) {
          throw new Error("Failed to upload documents");
        }
        
        const uploadResult = await uploadResponse.json();
        uploadedDocuments = uploadResult.urls || [];
        setIsUploadingDocs(false);
      }
      
      await apiRequest("POST", "/api/ddp/customers", {
        ...data,
        documents: uploadedDocuments,
      });
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
      setIsUploadingDocs(false);
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
                          data-testid="input-aadhar"
                          className="border-orange-300 dark:border-orange-700 focus:border-orange-500"
                          {...field}
                          value={field.value || ""}
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
                          placeholder="e.g., ABCDE1234F" 
                          maxLength={10}
                          data-testid="input-pan"
                          className="border-orange-300 dark:border-orange-700 focus:border-orange-500"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <p className="text-xs text-orange-600 dark:text-orange-400">Required for subsidy and tax purposes</p>
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
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-state">
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {indianStatesData.map((state) => (
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
                      <Select onValueChange={field.onChange} value={field.value || ""} disabled={!watchedState}>
                        <FormControl>
                          <SelectTrigger data-testid="select-district">
                            <SelectValue placeholder={watchedState ? "Select district" : "Select state first"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableDistricts.map((district) => (
                            <SelectItem key={district} value={district}>
                              {district}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <label className="text-sm font-medium">City</label>
                  <Select onValueChange={setSelectedCity} value={selectedCity} disabled={!watchedDistrict}>
                    <SelectTrigger data-testid="select-city">
                      <SelectValue placeholder={watchedDistrict ? "Select city" : "Select district first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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

              <Separator />

              {/* GPS Location */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">GPS Location</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    data-testid="button-get-location"
                  >
                    {isGettingLocation ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Getting Location...
                      </>
                    ) : (
                      <>
                        <Navigation className="mr-2 h-4 w-4" />
                        Capture GPS
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., 28.613939" 
                            data-testid="input-latitude"
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
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., 77.209023" 
                            data-testid="input-longitude"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
                      <FormLabel>Electricity Board/DISCOM *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""} disabled={!watchedState}>
                        <FormControl>
                          <SelectTrigger data-testid="select-electricity-board">
                            <SelectValue placeholder={watchedState ? "Select DISCOM" : "Select state first"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableDiscoms.map((discom) => (
                            <SelectItem key={discom} value={discom}>
                              {discom}
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
                  name="consumerNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consumer/K Number *</FormLabel>
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
                      <FormLabel>Sanctioned Load (kW) *</FormLabel>
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
                      <FormLabel>Average Monthly Bill (₹) *</FormLabel>
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
                      <FormLabel>Roof Type *</FormLabel>
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
                      <FormLabel>Available Roof Area (sq ft) *</FormLabel>
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
                  </>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="panelType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Panel Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "dcr"}>
                          <FormControl>
                            <SelectTrigger data-testid="select-panel-type">
                              <SelectValue placeholder="Select panel type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="dcr">DCR Panel - Subsidy Eligible</SelectItem>
                            <SelectItem value="non_dcr">Non-DCR Panel - No Subsidy</SelectItem>
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
                    name="inverterType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inverter Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "hybrid"}>
                          <FormControl>
                            <SelectTrigger data-testid="select-inverter-type">
                              <SelectValue placeholder="Select inverter type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="hybrid">3-in-1 Hybrid Inverter (3, 5, 6 kW)</SelectItem>
                            <SelectItem value="ongrid">Ongrid Inverter</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {watchedPanelType === "dcr" 
                            ? (watchedInverterType === "hybrid" ? "Rs 75/Watt (3, 5, 6 kW only)" : "Rs 66/Watt (3-10 kW)")
                            : (watchedInverterType === "hybrid" ? "Rs 55/Watt (3, 5, 6 kW only)" : "Rs 45/Watt (above 8 kW)")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="proposedCapacity"
                  render={({ field }) => {
                    const customerType = watchedCustomerType || "residential";
                    const isResidential = customerType === "residential";
                    const isCommercial = customerType === "commercial";
                    const isIndustrial = customerType === "industrial";
                    const pType = watchedPanelType || "dcr";
                    const iType = watchedInverterType || "hybrid";
                    
                    let capacityOptions: number[];
                    let capacityNote = "";
                    
                    if (iType === "hybrid") {
                      capacityOptions = [3, 5, 6];
                      capacityNote = "3-in-1 Hybrid Inverter available only in 3, 5, 6 kW";
                    } else if (pType === "dcr" && iType === "ongrid") {
                      capacityOptions = isResidential 
                        ? [3, 4, 5, 6, 7, 8, 9, 10]
                        : isCommercial 
                          ? [3, 5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 150, 200, 250, 300, 400, 500]
                          : [5, 10, 15, 20, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000];
                      capacityNote = isResidential 
                        ? "DCR Ongrid: 3-10 kW. Subsidy available up to 3 kW"
                        : isCommercial ? "Commercial: 3-500 kW (no subsidy)" : "Industrial: 5-1000 kW (no subsidy)";
                    } else {
                      const allOptions = isResidential 
                        ? [8, 9, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100]
                        : isCommercial 
                          ? [8, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 150, 200, 250, 300, 400, 500]
                          : [8, 10, 15, 20, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000];
                      capacityOptions = allOptions;
                      capacityNote = "Non-DCR Ongrid: 8-100 kW";
                    }

                    const [useCustom, setUseCustom] = useState(false);

                    return (
                      <FormItem>
                        <FormLabel>Proposed Capacity (kW) *</FormLabel>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={useCustom}
                              onCheckedChange={setUseCustom}
                              data-testid="switch-custom-capacity"
                            />
                            <span className="text-sm text-muted-foreground">
                              {useCustom ? "Custom value" : "Select from list"}
                            </span>
                          </div>
                          {useCustom ? (
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter capacity in kW"
                                data-testid="input-custom-capacity"
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value)}
                                min={iType === "hybrid" ? 3 : (pType === "non_dcr" && iType === "ongrid") ? 8 : 3}
                                max={isResidential ? (pType === "non_dcr" && iType === "ongrid" ? 100 : 10) : isCommercial ? 500 : 1000}
                              />
                            </FormControl>
                          ) : (
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger data-testid="select-proposed-capacity">
                                  <SelectValue placeholder="Select capacity" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {capacityOptions.map((cap) => (
                                  <SelectItem key={cap} value={cap.toString()}>
                                    {cap} kW
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                        <FormDescription>{capacityNote}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                
                {watchedCapacity && watchedPanelType && (
                  <SubsidyPreview 
                    capacity={watchedCapacity} 
                    panelType={watchedPanelType} 
                    inverterType={watchedInverterType || "hybrid"}
                    customerType={watchedCustomerType || "residential"}
                    state={form.watch("state") || ""}
                  />
                )}
              </div>
            </CardContent>
          </Card>

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
                      <FormLabel>Account Holder Name *</FormLabel>
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
                      <FormLabel>Bank Name *</FormLabel>
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
                      <FormLabel>Account Number *</FormLabel>
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
                      <FormLabel>IFSC Code *</FormLabel>
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

          {/* Document Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Documents Upload (Optional)
              </CardTitle>
              <CardDescription>
                Upload documents if available (Electricity Bill, Aadhaar, PAN Card, Property documents, etc.)
              </CardDescription>
              <p className="text-sm font-bold text-red-600 mt-2">
                Please upload Bank Proof (Bank Passbook or Bank Cancel Cheque) - Optional
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary/50"
                onClick={() => documentInputRef.current?.click()}
                data-testid="upload-documents-area"
              >
                <input
                  ref={documentInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  multiple
                  className="hidden"
                  onChange={handleDocumentUpload}
                  data-testid="input-documents"
                />
                <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload documents</p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, JPG, PNG, DOC (Max 10 files, 5MB each)
                </p>
              </div>

              {documentFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Selected Documents ({documentFiles.length}/10)</p>
                  <div className="space-y-2">
                    {documentFiles.map((file, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                        data-testid={`document-item-${index}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <File className="w-4 h-4 shrink-0 text-primary" />
                          <span className="text-sm truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDocument(index)}
                          data-testid={`button-remove-document-${index}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Errors Display */}
          {Object.keys(form.formState.errors).length > 0 && (
            <Card className="border-destructive bg-destructive/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-destructive text-base">Please fix the following errors:</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm text-destructive">
                  {Object.entries(form.formState.errors).map(([field, error]) => (
                    <li key={field}>
                      <span className="font-medium capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</span>: {(error as any)?.message || 'Invalid value'}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

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
              disabled={isLoading || isUploadingDocs}
              data-testid="button-submit"
              onClick={() => {
                if (Object.keys(form.formState.errors).length > 0) {
                  toast({
                    title: "Form has errors",
                    description: "Please scroll up and fix the highlighted fields",
                    variant: "destructive",
                  });
                }
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploadingDocs ? "Uploading Documents..." : "Registering..."}
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
