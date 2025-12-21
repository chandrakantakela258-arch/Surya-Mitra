import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Sun, 
  Phone, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Calendar, 
  Battery, 
  Zap,
  FileText,
  LogOut,
  Loader2,
  Home,
  User,
  Shield
} from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { ThemeToggle } from "@/components/theme-toggle";

interface CustomerData {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string;
  district: string;
  state: string;
  pincode: string;
  capacity: string;
  panelType: string;
  customerType: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  subsidyAmount: number;
  createdAt: string;
  portalStatus: string;
}

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  status: string;
  completedAt: string | null;
  visibleToCustomer: boolean;
  documents: string[] | null;
}

interface InstallationProgress {
  customer: CustomerData;
  milestones: Milestone[];
  currentStep: number;
  totalSteps: number;
  percentComplete: number;
}

const statusLabels: Record<string, string> = {
  pending: "Application Pending",
  documents_verified: "Documents Verified",
  site_survey_scheduled: "Site Survey Scheduled",
  site_survey_completed: "Site Survey Completed",
  portal_submitted: "Portal Submitted",
  feasibility_approved: "Feasibility Approved",
  vendor_assigned: "Vendor Assigned",
  installation_scheduled: "Installation Scheduled",
  installation_in_progress: "Installation In Progress",
  installation_completed: "Installation Completed",
  inspection_scheduled: "Inspection Scheduled",
  inspection_completed: "Inspection Completed",
  net_meter_installed: "Net Meter Installed",
  subsidy_disbursed: "Subsidy Disbursed",
  completed: "Completed",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  documents_verified: "bg-blue-500",
  site_survey_scheduled: "bg-purple-500",
  site_survey_completed: "bg-purple-600",
  portal_submitted: "bg-indigo-500",
  feasibility_approved: "bg-green-500",
  vendor_assigned: "bg-teal-500",
  installation_scheduled: "bg-orange-500",
  installation_in_progress: "bg-orange-600",
  installation_completed: "bg-green-600",
  inspection_scheduled: "bg-cyan-500",
  inspection_completed: "bg-cyan-600",
  net_meter_installed: "bg-emerald-500",
  subsidy_disbursed: "bg-emerald-600",
  completed: "bg-green-700",
};

export default function CustomerDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [step, setStep] = useState<"phone" | "otp" | "dashboard">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<InstallationProgress | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("customerSessionToken");
    if (token) {
      setSessionToken(token);
      fetchProgress(token);
    }
  }, []);

  const fetchProgress = async (token: string) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/customer-portal/progress", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.status === 401) {
        localStorage.removeItem("customerSessionToken");
        setSessionToken(null);
        setStep("phone");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch progress");
      }

      const data = await response.json();
      setProgress(data);
      setStep("dashboard");
    } catch {
      localStorage.removeItem("customerSessionToken");
      setSessionToken(null);
      setStep("phone");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!phone || phone.length < 10) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/customer-portal/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send OTP");
      }

      toast({
        title: "OTP Sent",
        description: "A verification code has been sent to your phone",
      });
      setStep("otp");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit verification code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/customer-portal/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Invalid OTP");
      }

      const { sessionToken: token } = await response.json();
      localStorage.setItem("customerSessionToken", token);
      setSessionToken(token);
      
      toast({
        title: "Login Successful",
        description: "Welcome to your installation dashboard",
      });

      fetchProgress(token);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to verify OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (sessionToken) {
      try {
        await fetch("/api/customer-portal/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        });
      } catch {
        // Ignore logout errors
      }
    }
    localStorage.removeItem("customerSessionToken");
    setSessionToken(null);
    setProgress(null);
    setStep("phone");
    setPhone("");
    setOtp("");
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
  };

  if (isLoading && step === "phone") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sun className="h-6 w-6 text-primary" />
            <span className="font-semibold">DivyanshiSolar</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {step === "dashboard" && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/")}
              data-testid="button-home"
            >
              <Home className="h-4 w-4 mr-1" />
              Home
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {step === "phone" && (
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
                  <Sun className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Track Your Installation</CardTitle>
                <CardDescription>
                  Enter your registered phone number to view your solar installation progress
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 bg-muted rounded-md border">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="ml-2 text-sm">+91</span>
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter 10-digit number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      data-testid="input-phone"
                    />
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleRequestOtp}
                  disabled={isLoading || phone.length !== 10}
                  data-testid="button-request-otp"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Get OTP
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  An OTP will be sent to your registered mobile number for verification
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "otp" && (
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Verify OTP</CardTitle>
                <CardDescription>
                  Enter the 6-digit code sent to +91 {phone}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    data-testid="input-otp"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otp.length !== 6}
                  data-testid="button-verify-otp"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Verify & Continue
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setStep("phone");
                    setOtp("");
                  }}
                  data-testid="button-change-phone"
                >
                  Change Phone Number
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "dashboard" && progress && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <User className="h-6 w-6" />
                  Welcome, {progress.customer.name}
                </h1>
                <p className="text-muted-foreground">
                  Track your solar installation progress
                </p>
              </div>
              <Badge className={`${statusColors[progress.customer.status]} text-white`}>
                {statusLabels[progress.customer.status] || progress.customer.status}
              </Badge>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Installation Progress
                </CardTitle>
                <CardDescription>
                  Step {progress.currentStep} of {progress.totalSteps}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span className="font-medium">{progress.percentComplete}%</span>
                  </div>
                  <Progress value={progress.percentComplete} className="h-3" />
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Battery className="h-5 w-5" />
                    System Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Capacity</span>
                    <span className="font-medium">{progress.customer.capacity} kW</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Panel Type</span>
                    <span className="font-medium capitalize">{progress.customer.panelType}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer Type</span>
                    <span className="font-medium capitalize">{progress.customer.customerType}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subsidy Amount</span>
                    <span className="font-medium text-green-600">
                      {progress.customer.subsidyAmount > 0 
                        ? `Rs ${progress.customer.subsidyAmount.toLocaleString()}`
                        : "Not Applicable"
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Installation Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <p className="font-medium">{progress.customer.address}</p>
                    <p className="text-muted-foreground">
                      {progress.customer.district}, {progress.customer.state}
                    </p>
                    <p className="text-muted-foreground">
                      PIN: {progress.customer.pincode}
                    </p>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Applied on {new Date(progress.customer.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {progress.milestones.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Installation Milestones
                  </CardTitle>
                  <CardDescription>
                    Track each step of your solar installation journey
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                    <div className="space-y-6">
                      {progress.milestones.map((milestone, index) => (
                        <div key={milestone.id} className="relative pl-10">
                          <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            milestone.status === "completed" 
                              ? "bg-green-500 text-white" 
                              : milestone.status === "in_progress"
                              ? "bg-primary text-white"
                              : "bg-muted"
                          }`}>
                            {milestone.status === "completed" ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : milestone.status === "in_progress" ? (
                              <Clock className="h-4 w-4" />
                            ) : (
                              <span className="text-sm font-medium">{index + 1}</span>
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium">{milestone.title}</h4>
                            {milestone.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {milestone.description}
                              </p>
                            )}
                            {milestone.completedAt && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Completed on {new Date(milestone.completedAt).toLocaleDateString("en-IN")}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Need Help?</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Contact our support team for any queries about your installation
                    </p>
                    <div className="flex flex-wrap gap-3 mt-3">
                      <a 
                        href="tel:+919801005212" 
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        +91 9801005212
                      </a>
                      <a 
                        href="tel:+918777684575" 
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        +91 8777684575
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
