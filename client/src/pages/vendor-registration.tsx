import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Sun, Wrench, MapPin, Building2, Phone, User, Users, FileText, CheckCircle, ArrowLeft, Briefcase, Award, Truck, CreditCard, Zap, Landmark, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { vendorServices, vendorStates, vendorSpecializations, vendorCertifications, vendorEquipment, companyTypes, vendorQuotationConfig } from "@shared/schema";
import { Link } from "wouter";

const vendorTypes = [
  // Service Vendors
  { value: "logistic", label: "Logistic Vendor", icon: Truck, description: "Transportation and logistics services", category: "service" },
  { value: "bank_loan_liaison", label: "Bank Loan Liaison Service", icon: Landmark, description: "Bank loan processing and documentation", category: "service" },
  { value: "discom_net_metering", label: "Discom Net Metering Liaison", icon: Zap, description: "DISCOM net metering installation liaison", category: "service" },
  { value: "electrical", label: "Electrical Vendor", icon: Zap, description: "Electrical work and wiring", category: "service" },
  { value: "solar_installation", label: "Solar Plant Installation & Erection", icon: Sun, description: "Solar panel installation and erection", category: "service" },
  // Supplier Vendors
  { value: "solar_panel_supplier", label: "Solar Panel Supplier", icon: Sun, description: "Solar panels and modules supply", category: "supplier" },
  { value: "inverter_supplier", label: "Inverter Supplier", icon: Zap, description: "Solar inverters and power electronics", category: "supplier" },
  { value: "solar_mounting_supplier", label: "Solar Mounting Supplier", icon: Package, description: "Mounting structures and frames", category: "supplier" },
  { value: "electrical_supplier", label: "ACDB/DCDB & Electrical Supplier", icon: Zap, description: "Cables, wires, and electrical components", category: "supplier" },
  { value: "civil_material_supplier", label: "Civil Material Supplier", icon: Building2, description: "Cement, sand, and construction materials", category: "supplier" },
  { value: "accessories_supplier", label: "Other Accessories Supplier", icon: Package, description: "Miscellaneous solar accessories", category: "supplier" },
  { value: "lithium_battery_supplier", label: "Lithium Ion Battery Supplier", icon: Zap, description: "Lithium ion storage batteries", category: "supplier" },
  { value: "tubular_battery_supplier", label: "Tubular/Gel Battery Supplier", icon: Zap, description: "Tubular and gel storage batteries", category: "supplier" },
];

const formSchema = z.object({
  vendorType: z.string().min(1, "Select vendor type"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  fatherName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  phone: z.string().min(10, "Enter valid phone number").max(10, "Enter valid 10-digit phone number"),
  alternatePhone: z.string().optional(),
  email: z.string().email("Enter valid email").optional().or(z.literal("")),
  companyName: z.string().optional(),
  companyType: z.string().optional(),
  state: z.string().min(1, "Select a state"),
  district: z.string().min(2, "Enter district name"),
  address: z.string().min(10, "Enter complete address"),
  pincode: z.string().length(6, "Enter valid 6-digit pincode"),
  services: z.array(z.string()).optional(),
  experienceYears: z.string().optional(),
  totalInstallations: z.number().optional(),
  previousCompanies: z.string().optional(),
  projectsCompleted: z.string().optional(),
  specializations: z.array(z.string()).optional(),
  teamSize: z.number().optional(),
  supervisorCount: z.number().optional(),
  helperCount: z.number().optional(),
  equipmentOwned: z.array(z.string()).optional(),
  hasTransportation: z.boolean().optional(),
  vehicleDetails: z.string().optional(),
  certifications: z.array(z.string()).optional(),
  trainingDetails: z.string().optional(),
  aadharNumber: z.string().optional(),
  panNumber: z.string().optional(),
  gstNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfsc: z.string().optional(),
  bankName: z.string().optional(),
  upiId: z.string().optional(),
  bestPriceQuotation: z.string().optional(),
  quotationUnit: z.string().optional(),
  quotationDescription: z.string().optional(),
  // Vendor-type-specific quotation fields
  logisticRatePerKm: z.string().optional(),
  bankLoanApprovalRate: z.string().optional(),
  gridConnectionRate: z.string().optional(),
  solarPanelRatePerWatt: z.string().optional(),
  ongridInverterRate: z.string().optional(),
  hybridInverter3in1Rate: z.string().optional(),
  acdbRate: z.string().optional(),
  dcdbRate: z.string().optional(),
  electricalWireRates: z.string().optional(),
  solarMountingRatePerWatt: z.string().optional(),
  siteErectionRatePerWatt: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const districtsByState: Record<string, string[]> = {
  "Bihar": ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Purnia", "Darbhanga", "Munger", "Begusarai", "Samastipur", "Vaishali", "Saran", "Nalanda", "Aurangabad", "Rohtas", "Katihar", "Madhubani", "Saharsa", "Sitamarhi", "Chapra", "Arrah"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh", "Deoghar", "Giridih", "Dumka", "Ramgarh", "Chatra", "Gumla", "Pakur", "Godda", "Koderma", "Lohardaga", "Palamu", "Latehar", "Khunti"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Prayagraj", "Meerut", "Ghaziabad", "Noida", "Gorakhpur", "Bareilly", "Aligarh", "Moradabad", "Saharanpur", "Jhansi", "Mathura", "Firozabad", "Azamgarh", "Sultanpur", "Faizabad", "Mirzapur"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore", "Baripada", "Bhadrak", "Jharsuguda", "Jeypore", "Angul", "Dhenkanal", "Kendrapara", "Koraput", "Rayagada", "Bolangir", "Bargarh"],
};

export default function VendorRegistration() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedVendorType, setSelectedVendorType] = useState<string>("");
  
  const selectedVendorInfo = vendorTypes.find(v => v.value === selectedVendorType);
  const isSupplier = selectedVendorInfo?.category === "supplier";
  const showSpecializationAndExperience = selectedVendorType === "electrical" || selectedVendorType === "solar_installation";
  
  const serviceVendors = vendorTypes.filter(v => v.category === "service");
  const supplierVendors = vendorTypes.filter(v => v.category === "supplier");
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vendorType: "",
      name: "",
      fatherName: "",
      dateOfBirth: "",
      phone: "",
      alternatePhone: "",
      email: "",
      companyName: "",
      companyType: "",
      state: "",
      district: "",
      address: "",
      pincode: "",
      services: [],
      experienceYears: "",
      totalInstallations: undefined,
      previousCompanies: "",
      projectsCompleted: "",
      specializations: [],
      teamSize: undefined,
      supervisorCount: undefined,
      helperCount: undefined,
      equipmentOwned: [],
      hasTransportation: false,
      vehicleDetails: "",
      certifications: [],
      trainingDetails: "",
      aadharNumber: "",
      panNumber: "",
      gstNumber: "",
      bankAccountName: "",
      bankAccountNumber: "",
      bankIfsc: "",
      bankName: "",
      upiId: "",
      bestPriceQuotation: "",
      quotationUnit: "",
      quotationDescription: "",
      logisticRatePerKm: "",
      bankLoanApprovalRate: "",
      gridConnectionRate: "",
      solarPanelRatePerWatt: "",
      ongridInverterRate: "",
      hybridInverter3in1Rate: "",
      acdbRate: "",
      dcdbRate: "",
      electricalWireRates: "",
      solarMountingRatePerWatt: "",
      siteErectionRatePerWatt: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("POST", "/api/public/vendors/register", data);
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Registration Successful",
        description: "We will review your application and contact you soon.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    registerMutation.mutate(data);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Registration Submitted!</h1>
            <p className="text-muted-foreground mb-8">
              Thank you for registering as a site installation vendor. Our team will review your application and contact you within 2-3 business days.
            </p>
            <Button asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sun className="w-8 h-8 text-orange-500" />
              <h1 className="text-2xl font-bold">Divyanshi Solar</h1>
            </div>
            <h2 className="text-xl font-semibold mb-2">Site Installation Vendor Registration</h2>
            <p className="text-muted-foreground">
              Join our network of trusted installation vendors for PM Surya Ghar Yojana
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {vendorStates.map((state) => (
                <span key={state.value} className="px-3 py-1 text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full">
                  {state.label}
                </span>
              ))}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Vendor Category *
                  </CardTitle>
                  <CardDescription>
                    Select the type of vendor service you provide
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="vendorType"
                    render={({ field }) => (
                      <FormItem>
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                              <Wrench className="w-4 h-4" />
                              Service Vendors
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {serviceVendors.map((type) => {
                                const IconComponent = type.icon;
                                const isSelected = field.value === type.value;
                                return (
                                  <div
                                    key={type.value}
                                    onClick={() => {
                                      field.onChange(type.value);
                                      setSelectedVendorType(type.value);
                                    }}
                                    className={`cursor-pointer p-3 rounded-md border-2 transition-all ${
                                      isSelected 
                                        ? "border-primary bg-primary/5" 
                                        : "border-border hover-elevate"
                                    }`}
                                    data-testid={`card-vendor-type-${type.value}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-md ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                                        <IconComponent className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="font-medium text-sm">{type.label}</p>
                                        <p className="text-xs text-muted-foreground">{type.description}</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                              <Package className="w-4 h-4" />
                              Material Suppliers
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                              {supplierVendors.map((type) => {
                                const IconComponent = type.icon;
                                const isSelected = field.value === type.value;
                                return (
                                  <div
                                    key={type.value}
                                    onClick={() => {
                                      field.onChange(type.value);
                                      setSelectedVendorType(type.value);
                                    }}
                                    className={`cursor-pointer p-3 rounded-md border-2 transition-all ${
                                      isSelected 
                                        ? "border-primary bg-primary/5" 
                                        : "border-border hover-elevate"
                                    }`}
                                    data-testid={`card-vendor-type-${type.value}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-md ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                                        <IconComponent className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className="font-medium text-sm">{type.label}</p>
                                        <p className="text-xs text-muted-foreground">{type.description}</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Details
                  </CardTitle>
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
                            <Input placeholder="Enter your full name" {...field} data-testid="input-vendor-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fatherName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Father's Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter father's name" {...field} data-testid="input-vendor-father" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-vendor-dob" />
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
                            <div className="flex">
                              <span className="inline-flex items-center px-3 text-sm border border-r-0 rounded-l-md bg-muted text-muted-foreground">
                                +91
                              </span>
                              <Input 
                                placeholder="9876543210" 
                                className="rounded-l-none" 
                                {...field} 
                                data-testid="input-vendor-phone"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="alternatePhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alternate Phone</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <span className="inline-flex items-center px-3 text-sm border border-r-0 rounded-l-md bg-muted text-muted-foreground">
                                +91
                              </span>
                              <Input 
                                placeholder="9876543210" 
                                className="rounded-l-none" 
                                {...field} 
                                data-testid="input-vendor-alt-phone"
                              />
                            </div>
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
                            <Input type="email" placeholder="email@example.com" {...field} data-testid="input-vendor-email" />
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
                    <Building2 className="w-5 h-5" />
                    Company Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company/Firm Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your company name (if any)" {...field} data-testid="input-vendor-company" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-vendor-company-type">
                                <SelectValue placeholder="Select company type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {companyTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                    Location Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State *</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedState(value);
                              form.setValue("district", "");
                            }} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-vendor-state">
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {vendorStates.map((state) => (
                                <SelectItem key={state.value} value={state.value}>
                                  {state.label}
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
                          <Select onValueChange={field.onChange} value={field.value} disabled={!selectedState}>
                            <FormControl>
                              <SelectTrigger data-testid="select-vendor-district">
                                <SelectValue placeholder={selectedState ? "Select district" : "Select state first"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {selectedState && districtsByState[selectedState]?.map((district) => (
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

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Full Address *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter your complete address" 
                              {...field} 
                              data-testid="input-vendor-address"
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
                            <Input placeholder="123456" maxLength={6} {...field} data-testid="input-vendor-pincode" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {showSpecializationAndExperience && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="w-5 h-5" />
                      Services & Specializations
                    </CardTitle>
                    <CardDescription>
                      Select the services you can provide and your areas of expertise
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="services"
                      render={() => (
                        <FormItem>
                          <FormLabel>Services You Can Provide</FormLabel>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                            {vendorServices.map((service) => (
                              <FormField
                                key={service.value}
                                control={form.control}
                                name="services"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(service.value)}
                                        onCheckedChange={(checked) => {
                                          const newValue = checked
                                            ? [...(field.value || []), service.value]
                                            : field.value?.filter((v) => v !== service.value) || [];
                                          field.onChange(newValue);
                                        }}
                                        data-testid={`checkbox-service-${service.value}`}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                      {service.label}
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specializations"
                      render={() => (
                        <FormItem>
                          <FormLabel>Specializations</FormLabel>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                            {vendorSpecializations.map((spec) => (
                              <FormField
                                key={spec.value}
                                control={form.control}
                                name="specializations"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(spec.value)}
                                        onCheckedChange={(checked) => {
                                          const newValue = checked
                                            ? [...(field.value || []), spec.value]
                                            : field.value?.filter((v) => v !== spec.value) || [];
                                          field.onChange(newValue);
                                        }}
                                        data-testid={`checkbox-spec-${spec.value}`}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                      {spec.label}
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}

              {showSpecializationAndExperience && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      Experience Details
                    </CardTitle>
                    <CardDescription>
                      Tell us about your experience in the solar industry
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="experienceYears"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Years of Experience</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-vendor-experience">
                                  <SelectValue placeholder="Select experience" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="0-1">Less than 1 year</SelectItem>
                                <SelectItem value="1-3">1-3 years</SelectItem>
                                <SelectItem value="3-5">3-5 years</SelectItem>
                                <SelectItem value="5-10">5-10 years</SelectItem>
                                <SelectItem value="10+">10+ years</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="totalInstallations"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Installations Completed</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Number of installations"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                value={field.value || ""}
                                data-testid="input-vendor-installations"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="previousCompanies"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Previous Companies Worked With</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="List companies you have worked with for solar installations (e.g., Tata Power Solar, Adani Solar, Vikram Solar, etc.)"
                                {...field} 
                                data-testid="input-vendor-prev-companies"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="projectsCompleted"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Major Projects Completed</FormLabel>
                            <FormControl>
                            <Textarea 
                              placeholder="Describe major projects you have completed (location, capacity, type of installation, etc.)"
                              {...field} 
                              data-testid="input-vendor-projects"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    </div>
                  </CardContent>
                </Card>
              )}

              {showSpecializationAndExperience && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Team Details
                    </CardTitle>
                  </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="teamSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Team Size</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Total members"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              value={field.value || ""}
                              data-testid="input-vendor-team-size"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="supervisorCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supervisors/Technicians</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Skilled workers"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              value={field.value || ""}
                              data-testid="input-vendor-supervisors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="helperCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Helpers</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Helper count"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              value={field.value || ""}
                              data-testid="input-vendor-helpers"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
              )}

              {showSpecializationAndExperience && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="w-5 h-5" />
                    Equipment & Transportation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="equipmentOwned"
                    render={() => (
                      <FormItem>
                        <FormLabel>Equipment & Tools Owned</FormLabel>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                          {vendorEquipment.map((equip) => (
                            <FormField
                              key={equip.value}
                              control={form.control}
                              name="equipmentOwned"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(equip.value)}
                                      onCheckedChange={(checked) => {
                                        const newValue = checked
                                          ? [...(field.value || []), equip.value]
                                          : field.value?.filter((v) => v !== equip.value) || [];
                                        field.onChange(newValue);
                                      }}
                                      data-testid={`checkbox-equip-${equip.value}`}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {equip.label}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <FormField
                      control={form.control}
                      name="hasTransportation"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Own Transportation</FormLabel>
                            <FormDescription>
                              Do you have your own vehicle for transporting equipment?
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-vendor-transport"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vehicleDetails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehicle Details</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Tata Ace, Mahindra Bolero" 
                              {...field} 
                              data-testid="input-vendor-vehicle"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
              )}

              {showSpecializationAndExperience && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Certifications & Training
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="certifications"
                    render={() => (
                      <FormItem>
                        <FormLabel>Certifications</FormLabel>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                          {vendorCertifications.map((cert) => (
                            <FormField
                              key={cert.value}
                              control={form.control}
                              name="certifications"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(cert.value)}
                                      onCheckedChange={(checked) => {
                                        const newValue = checked
                                          ? [...(field.value || []), cert.value]
                                          : field.value?.filter((v) => v !== cert.value) || [];
                                        field.onChange(newValue);
                                      }}
                                      data-testid={`checkbox-cert-${cert.value}`}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {cert.label}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="trainingDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Training Details</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe any solar-related training you have received"
                            {...field} 
                            data-testid="input-vendor-training"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="aadharNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aadhar Number</FormLabel>
                          <FormControl>
                            <Input placeholder="1234 5678 9012" maxLength={14} {...field} data-testid="input-vendor-aadhar" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="panNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PAN Number</FormLabel>
                          <FormControl>
                            <Input placeholder="AAAAA1234A" {...field} data-testid="input-vendor-pan" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gstNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GST Number</FormLabel>
                          <FormControl>
                            <Input placeholder="22AAAAA0000A1Z5" {...field} data-testid="input-vendor-gst" />
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
                    <CreditCard className="w-5 h-5" />
                    Bank Details (For Payment)
                  </CardTitle>
                  <CardDescription>
                    Your payment will be processed to this account after work completion
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bankAccountName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Holder Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Name as per bank account" {...field} data-testid="input-vendor-bank-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bankAccountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter account number" {...field} data-testid="input-vendor-bank-acc" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bankIfsc"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>IFSC Code</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., SBIN0001234" {...field} data-testid="input-vendor-bank-ifsc" />
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
                            <Input placeholder="e.g., State Bank of India" {...field} data-testid="input-vendor-bank-branch" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="upiId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UPI ID (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="yourname@upi" {...field} data-testid="input-vendor-upi" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {selectedVendorType && vendorQuotationConfig[selectedVendorType] && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-orange-500" />
                      Best Price Quotation
                    </CardTitle>
                    <CardDescription>
                      {vendorQuotationConfig[selectedVendorType].description}. This will be auto-populated to work orders when approved.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {vendorQuotationConfig[selectedVendorType].fields.map((fieldConfig) => (
                        <FormField
                          key={fieldConfig.key}
                          control={form.control}
                          name={fieldConfig.key as keyof FormData}
                          render={({ field }) => (
                            <FormItem className={fieldConfig.key === 'electricalWireRates' ? 'md:col-span-2' : ''}>
                              <FormLabel>{fieldConfig.label} (Rs)</FormLabel>
                              <FormControl>
                                {fieldConfig.key === 'electricalWireRates' ? (
                                  <Textarea 
                                    placeholder={fieldConfig.placeholder}
                                    {...field}
                                    value={field.value as string || ''}
                                    data-testid={`input-vendor-${fieldConfig.key}`}
                                  />
                                ) : (
                                  <Input 
                                    type="number" 
                                    placeholder={fieldConfig.placeholder}
                                    {...field}
                                    value={field.value as string || ''}
                                    data-testid={`input-vendor-${fieldConfig.key}`}
                                  />
                                )}
                              </FormControl>
                              <FormDescription>{fieldConfig.unit}</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>

                    <FormField
                      control={form.control}
                      name="quotationDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Quotation Details (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe what's included in your rate (e.g., materials, labor, etc.)" 
                              {...field} 
                              data-testid="input-vendor-quotation-description" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}

              {selectedVendorType && !vendorQuotationConfig[selectedVendorType] && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-orange-500" />
                      Best Price Quotation
                    </CardTitle>
                    <CardDescription>
                      Enter your best price for services. This will be auto-populated to work orders when approved.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="bestPriceQuotation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Best Price (Rs)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Enter your best rate" {...field} data-testid="input-vendor-best-price" />
                            </FormControl>
                            <FormDescription>Your competitive rate for services</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="quotationUnit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price Unit</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-quotation-unit">
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="per_kw">Per kW</SelectItem>
                                <SelectItem value="per_watt">Per Watt</SelectItem>
                                <SelectItem value="per_trip">Per Trip</SelectItem>
                                <SelectItem value="per_unit">Per Unit</SelectItem>
                                <SelectItem value="lumpsum">Lumpsum</SelectItem>
                                <SelectItem value="percentage">Percentage</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="quotationDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quotation Details (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe what's included in your rate (e.g., materials, labor, etc.)" 
                              {...field} 
                              data-testid="input-vendor-quotation-description" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button type="submit" className="flex-1" disabled={registerMutation.isPending} data-testid="button-submit-vendor">
                  {registerMutation.isPending ? "Submitting..." : "Submit Registration"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/">Cancel</Link>
                </Button>
              </div>
            </form>
          </Form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              By registering, you agree to work with Divyanshi Solar for solar panel installations under PM Surya Ghar Yojana.
            </p>
            <p className="mt-2">
              For queries, contact us at{" "}
              <a href="tel:+919801005212" className="text-orange-600 hover:underline">
                +91 9801005212
              </a>
              {", "}
              <a href="tel:+918777684575" className="text-orange-600 hover:underline">
                8777684575
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
