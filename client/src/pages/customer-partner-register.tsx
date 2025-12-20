import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Loader2, Sun, Award, IndianRupee, Users, CheckCircle, Phone, User, MapPin, Zap } from "lucide-react";
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

const phoneVerifySchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

const registerSchema = z.object({
  username: z.string().min(4, "Username must be at least 4 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PhoneVerifyFormValues = z.infer<typeof phoneVerifySchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

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

export default function CustomerPartnerRegisterPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [step, setStep] = useState<"verify" | "register">("verify");
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [verifiedPhone, setVerifiedPhone] = useState("");

  const phoneForm = useForm<PhoneVerifyFormValues>({
    resolver: zodResolver(phoneVerifySchema),
    defaultValues: { phone: "" },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", password: "", confirmPassword: "" },
  });

  async function onVerifyPhone(data: PhoneVerifyFormValues) {
    setIsVerifying(true);
    try {
      const result = await apiRequest("POST", "/api/customer-partner/lookup", {
        phone: data.phone,
      });
      
      if (result.eligible && result.customer) {
        setCustomerData(result.customer);
        setVerifiedPhone(data.phone);
        setStep("register");
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
      setIsVerifying(false);
    }
  }

  async function onRegister(data: RegisterFormValues) {
    if (!customerData) return;
    
    setIsRegistering(true);
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
      setIsRegistering(false);
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

  const benefits = [
    { icon: IndianRupee, title: "Earn Rs 10,000", description: "For every successful 3kW+ referral" },
    { icon: Users, title: "Help Others", description: "Share solar benefits with friends and family" },
    { icon: Award, title: "Exclusive Access", description: "Partner dashboard and tracking tools" },
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
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Sun className="w-4 h-4" />
                Customer Partner Program
              </div>
              <h1 className="text-3xl font-bold mb-2">Join Our Partner Network</h1>
              <p className="text-muted-foreground">
                You've experienced the benefits of solar energy. Now help others save on electricity 
                and earn rewards for every successful referral.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Partner Benefits</h3>
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-card border">
                  <div className="p-2 rounded-md bg-primary/10">
                    <benefit.icon className="w-5 h-5 text-primary" />
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
                <Badge variant={step === "verify" ? "default" : "secondary"} className="text-xs">
                  Step 1
                </Badge>
                <span className="text-muted-foreground">-</span>
                <Badge variant={step === "register" ? "default" : "secondary"} className="text-xs">
                  Step 2
                </Badge>
              </div>
              <CardTitle>
                {step === "verify" ? "Verify Your Phone" : "Create Your Account"}
              </CardTitle>
              <CardDescription>
                {step === "verify" 
                  ? "Enter the phone number you used during your solar registration"
                  : "Your details have been verified. Create your login credentials."
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === "verify" ? (
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
                      disabled={isVerifying}
                      data-testid="button-verify"
                    >
                      {isVerifying ? (
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

                      <Form {...registerForm}>
                        <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                          <FormField
                            control={registerForm.control}
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
                            control={registerForm.control}
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
                            control={registerForm.control}
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
                                setStep("verify");
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
                              disabled={isRegistering}
                              data-testid="button-register"
                            >
                              {isRegistering ? (
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
      </div>
    </div>
  );
}
