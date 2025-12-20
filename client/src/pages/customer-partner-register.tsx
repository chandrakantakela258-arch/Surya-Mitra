import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Loader2, Sun, Award, IndianRupee, Users } from "lucide-react";
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

const customerPartnerRegisterSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type CustomerPartnerRegisterFormValues = z.infer<typeof customerPartnerRegisterSchema>;

export default function CustomerPartnerRegisterPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CustomerPartnerRegisterFormValues>({
    resolver: zodResolver(customerPartnerRegisterSchema),
    defaultValues: {
      phone: "",
      password: "",
      confirmPassword: "",
      email: "",
    },
  });

  async function onSubmit(data: CustomerPartnerRegisterFormValues) {
    setIsLoading(true);
    try {
      const result = await apiRequest("POST", "/api/customer-partner/register", {
        phone: data.phone,
        password: data.password,
        email: data.email,
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
      setIsLoading(false);
    }
  }

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
              <h1 className="text-3xl font-bold mb-2">Become a Customer Partner</h1>
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
              <CardTitle>Register as Customer Partner</CardTitle>
              <CardDescription>
                Enter the phone number you used during your solar registration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your registered phone number" 
                            {...field} 
                            data-testid="input-phone"
                          />
                        </FormControl>
                        <FormDescription>
                          Use the same phone number from your solar installation registration
                        </FormDescription>
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
                          <Input 
                            type="email" 
                            placeholder="your@email.com" 
                            {...field} 
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
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
                    control={form.control}
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

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={isLoading}
                    data-testid="button-register"
                  >
                    {isLoading ? (
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
                </form>
              </Form>

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
