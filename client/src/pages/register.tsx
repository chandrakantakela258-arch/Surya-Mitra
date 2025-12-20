import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Loader2, Sun, Award, IndianRupee, Users, CheckCircle, Phone, User, MapPin, Zap, Building2, Briefcase, UserCheck } from "lucide-react";
import { z } from "zod";
import logoImage from "@assets/88720521_logo_1766219255006.png";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const bdpDdpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(4, "Username must be at least 4 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  state: z.string().min(1, "Please select a state"),
  district: z.string().min(1, "Please enter district"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const phoneVerifySchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

const customerPartnerRegisterSchema = z.object({
  username: z.string().min(4, "Username must be at least 4 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type BdpDdpFormValues = z.infer<typeof bdpDdpSchema>;
type PhoneVerifyFormValues = z.infer<typeof phoneVerifySchema>;
type CustomerPartnerRegisterFormValues = z.infer<typeof customerPartnerRegisterSchema>;

interface CustomerData {
  name: string;
  phone: string;
  email: string;
  address: string;
  district: string;
  state: string;
  proposedCapacity: string;
  panelType: string;
  completedAt: string;
}

type PartnerType = "bdp" | "ddp" | "customer_partner" | null;

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPartnerType, setSelectedPartnerType] = useState<PartnerType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [cpStep, setCpStep] = useState<"verify" | "register">("verify");
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [verifiedPhone, setVerifiedPhone] = useState("");

  const bdpDdpForm = useForm<BdpDdpFormValues>({
    resolver: zodResolver(bdpDdpSchema),
    defaultValues: { 
      name: "", 
      username: "", 
      phone: "", 
      email: "", 
      state: "", 
      district: "", 
      password: "", 
      confirmPassword: "" 
    },
  });

  const phoneForm = useForm<PhoneVerifyFormValues>({
    resolver: zodResolver(phoneVerifySchema),
    defaultValues: { phone: "" },
  });

  const cpRegisterForm = useForm<CustomerPartnerRegisterFormValues>({
    resolver: zodResolver(customerPartnerRegisterSchema),
    defaultValues: { username: "", password: "", confirmPassword: "" },
  });

  async function onBdpDdpSubmit(data: BdpDdpFormValues) {
    if (!selectedPartnerType || (selectedPartnerType !== "bdp" && selectedPartnerType !== "ddp")) return;
    
    setIsSubmitting(true);
    try {
      const result = await apiRequest("POST", "/api/auth/register", {
        ...data,
        role: selectedPartnerType,
      });
      
      login(result.user);
      toast({
        title: "Registration Successful",
        description: `Welcome to the ${selectedPartnerType === "bdp" ? "Business Development" : "District Development"} Partner program!`,
      });
      
      setLocation(selectedPartnerType === "bdp" ? "/bdp/dashboard" : "/ddp/dashboard");
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Could not complete registration",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onVerifyPhone(data: PhoneVerifyFormValues) {
    setIsSubmitting(true);
    try {
      const result = await apiRequest("POST", "/api/customer-partner/lookup", {
        phone: data.phone,
      });
      
      if (result.eligible && result.customer) {
        setCustomerData(result.customer);
        setVerifiedPhone(data.phone);
        setCpStep("register");
        toast({
          title: "Phone verified!",
          description: "Your installation details have been found.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Could not verify your phone number",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onCustomerPartnerRegister(data: CustomerPartnerRegisterFormValues) {
    if (!customerData) return;
    
    setIsSubmitting(true);
    try {
      const result = await apiRequest("POST", "/api/customer-partner/register", {
        phone: verifiedPhone,
        password: data.password,
        email: customerData.email,
        username: data.username,
      });
      
      login(result.user);
      toast({
        title: "Welcome, Customer Partner!",
        description: "You can now start referring customers and earn commissions.",
      });
      
      setLocation("/customer-partner/dashboard");
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Could not register as Customer Partner",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const getPanelTypeLabel = (type: string) => {
    switch (type) {
      case "dcr_hybrid": return "DCR with 3-in-1 Hybrid Inverter";
      case "dcr_ongrid": return "DCR with Ongrid Inverter";
      case "non_dcr": return "Non-DCR Panel";
      default: return type;
    }
  };

  const partnerTypes = [
    {
      type: "bdp" as PartnerType,
      title: "Business Development Partner",
      shortTitle: "BDP",
      icon: Building2,
      description: "Build and manage a network of District Partners",
      benefits: [
        "Manage multiple DDPs under you",
        "Earn commissions on your team's installations",
        "Access to business analytics dashboard",
      ],
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      type: "ddp" as PartnerType,
      title: "District Development Partner",
      shortTitle: "DDP",
      icon: Briefcase,
      description: "Handle customer onboarding and installations in your district",
      benefits: [
        "Direct customer management",
        "Higher per-installation commissions",
        "Access to store and marketing materials",
      ],
      color: "bg-green-500/10 text-green-600 dark:text-green-400",
    },
    {
      type: "customer_partner" as PartnerType,
      title: "Customer Partner Program",
      shortTitle: "Customer Partner",
      icon: UserCheck,
      description: "For existing solar customers who want to refer others",
      benefits: [
        "Earn Rs 10,000 per successful 3kW+ referral",
        "Simple referral tracking dashboard",
        "No investment required",
      ],
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      eligibility: "Must have completed 3kW+ installation",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <header className="p-4 flex items-center justify-between">
        <Link href="/">
          <img 
            src={logoImage} 
            alt="Divyanshi Solar" 
            className="h-10 w-auto object-contain cursor-pointer"
          />
        </Link>
        <ThemeToggle />
      </header>

      <div className="container max-w-6xl mx-auto px-4 py-8">
        {!selectedPartnerType ? (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Sun className="w-4 h-4" />
                PM Surya Ghar Yojana Partner Network
              </div>
              <h1 className="text-3xl font-bold mb-2">Join Our Partner Network</h1>
              <p className="text-muted-foreground">
                Choose the partnership type that best suits your goals and start earning with solar energy.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {partnerTypes.map((partner) => (
                <Card 
                  key={partner.type}
                  className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
                  onClick={() => setSelectedPartnerType(partner.type)}
                  data-testid={`card-partner-${partner.type}`}
                >
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${partner.color} flex items-center justify-center mb-2`}>
                      <partner.icon className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-lg">{partner.title}</CardTitle>
                    <CardDescription>{partner.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2 text-sm">
                      {partner.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    {partner.eligibility && (
                      <Badge variant="secondary" className="text-xs">
                        {partner.eligibility}
                      </Badge>
                    )}
                    <Button className="w-full" data-testid={`button-select-${partner.type}`}>
                      Select {partner.shortTitle}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Login here
                </Link>
              </p>
            </div>
          </div>
        ) : selectedPartnerType === "customer_partner" ? (
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setSelectedPartnerType(null);
                  setCpStep("verify");
                  setCustomerData(null);
                }}
                className="mb-4"
                data-testid="button-back-to-selection"
              >
                Back to Partner Selection
              </Button>
              
              <div>
                <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
                  <UserCheck className="w-4 h-4" />
                  Customer Partner Program
                </div>
                <h1 className="text-3xl font-bold mb-2">Become a Customer Partner</h1>
                <p className="text-muted-foreground">
                  You've experienced the benefits of solar energy. Now help others save on electricity 
                  and earn rewards for every successful referral.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Partner Benefits</h3>
                {[
                  { icon: IndianRupee, title: "Earn Rs 10,000", description: "For every successful 3kW+ referral" },
                  { icon: Users, title: "Help Others", description: "Share solar benefits with friends and family" },
                  { icon: Award, title: "Exclusive Access", description: "Partner dashboard and tracking tools" },
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-card border">
                    <div className="p-2 rounded-md bg-amber-500/10">
                      <benefit.icon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="font-medium">{benefit.title}</p>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-amber-800 dark:text-amber-200">Eligibility Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-amber-700 dark:text-amber-300">
                  <p>To become a Customer Partner, you must:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Have registered independently (without a referral code)</li>
                    <li>Have completed your solar installation</li>
                    <li>Have a system capacity of 3kW or above</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={cpStep === "verify" ? "default" : "secondary"} className="text-xs">
                    Step 1
                  </Badge>
                  <span className="text-muted-foreground">-</span>
                  <Badge variant={cpStep === "register" ? "default" : "secondary"} className="text-xs">
                    Step 2
                  </Badge>
                </div>
                <CardTitle>
                  {cpStep === "verify" ? "Verify Your Phone" : "Create Your Account"}
                </CardTitle>
                <CardDescription>
                  {cpStep === "verify" 
                    ? "Enter the phone number you used during your solar registration"
                    : "Your details have been verified. Create your login credentials."
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cpStep === "verify" ? (
                  <Form {...phoneForm}>
                    <form onSubmit={phoneForm.handleSubmit(onVerifyPhone)} className="space-y-4">
                      <FormField
                        control={phoneForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input 
                                  placeholder="Enter your registered phone number" 
                                  className="pl-10"
                                  {...field} 
                                  data-testid="input-phone"
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Use the same phone number from your solar installation registration
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full" 
                        size="lg"
                        disabled={isSubmitting}
                        data-testid="button-verify"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Verify Phone Number
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                ) : (
                  <div className="space-y-6">
                    {customerData && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="font-medium text-green-700 dark:text-green-300">Installation Verified</span>
                          </div>
                          <div className="grid gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Name:</span>
                              <span className="font-medium">{customerData.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Phone:</span>
                              <span className="font-medium">{customerData.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Location:</span>
                              <span className="font-medium">{customerData.district}, {customerData.state}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Zap className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">System:</span>
                              <span className="font-medium">{customerData.proposedCapacity} kW - {getPanelTypeLabel(customerData.panelType)}</span>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <Form {...cpRegisterForm}>
                          <form onSubmit={cpRegisterForm.handleSubmit(onCustomerPartnerRegister)} className="space-y-4">
                            <FormField
                              control={cpRegisterForm.control}
                              name="username"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Username</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Choose a username" 
                                      {...field} 
                                      data-testid="input-username"
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    This will be used to login to your partner account
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={cpRegisterForm.control}
                              name="password"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Create Password</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Input 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="Create a password" 
                                        {...field} 
                                        data-testid="input-password"
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0"
                                        onClick={() => setShowPassword(!showPassword)}
                                        data-testid="button-toggle-password"
                                      >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                      </Button>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={cpRegisterForm.control}
                              name="confirmPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Confirm Password</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type={showPassword ? "text" : "password"} 
                                      placeholder="Confirm your password" 
                                      {...field} 
                                      data-testid="input-confirm-password"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="flex gap-2">
                              <Button 
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setCpStep("verify");
                                  setCustomerData(null);
                                }}
                                data-testid="button-back"
                              >
                                Back
                              </Button>
                              <Button 
                                type="submit" 
                                className="flex-1" 
                                size="lg"
                                disabled={isSubmitting}
                                data-testid="button-register"
                              >
                                {isSubmitting ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Registering...
                                  </>
                                ) : (
                                  <>
                                    <Award className="mr-2 h-4 w-4" />
                                    Become a Customer Partner
                                  </>
                                )}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Already registered as a partner?{" "}
                    <Link href="/login" className="text-primary font-medium hover:underline">
                      Login here
                    </Link>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Not a customer yet?{" "}
                    <Link href="/customer-registration" className="text-primary font-medium hover:underline">
                      Register for solar
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedPartnerType(null)}
              className="mb-4"
              data-testid="button-back-to-selection"
            >
              Back to Partner Selection
            </Button>

            <Card className="shadow-lg">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${selectedPartnerType === "bdp" ? "bg-blue-500/10" : "bg-green-500/10"} flex items-center justify-center mb-2`}>
                  {selectedPartnerType === "bdp" ? (
                    <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Briefcase className="w-6 h-6 text-green-600 dark:text-green-400" />
                  )}
                </div>
                <CardTitle>
                  {selectedPartnerType === "bdp" ? "Business Development Partner" : "District Development Partner"} Registration
                </CardTitle>
                <CardDescription>
                  {selectedPartnerType === "bdp" 
                    ? "Register to build and manage a network of District Partners"
                    : "Register to handle customer onboarding and installations in your district"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...bdpDdpForm}>
                  <form onSubmit={bdpDdpForm.handleSubmit(onBdpDdpSubmit)} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={bdpDdpForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your full name" {...field} data-testid="input-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={bdpDdpForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Choose a username" {...field} data-testid="input-username" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={bdpDdpForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter phone number" {...field} data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={bdpDdpForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter email address" {...field} data-testid="input-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={bdpDdpForm.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-state">
                                  <SelectValue placeholder="Select state" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {INDIAN_STATES.map((state) => (
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
                        control={bdpDdpForm.control}
                        name="district"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>District</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter district" {...field} data-testid="input-district" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={bdpDdpForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showPassword ? "text" : "password"} 
                                  placeholder="Create password" 
                                  {...field} 
                                  data-testid="input-password"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={bdpDdpForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Confirm password" 
                                {...field} 
                                data-testid="input-confirm-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg"
                      disabled={isSubmitting}
                      data-testid="button-register"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Complete Registration
                        </>
                      )}
                    </Button>
                  </form>
                </Form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary font-medium hover:underline">
                      Login here
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
