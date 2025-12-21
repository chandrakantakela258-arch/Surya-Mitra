import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Loader2, Phone, KeyRound, ArrowLeft, CheckCircle } from "lucide-react";
import logoImage from "@assets/88720521_logo_1766219255006.png";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";

type Step = "phone" | "otp" | "reset" | "success";

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userName, setUserName] = useState("");

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiRequest("POST", "/api/auth/forgot-password/send-otp", { phone });
      setUserName(result.userName || "");
      toast({
        title: "OTP Sent",
        description: "A verification code has been sent to your phone",
      });
      setStep("otp");
    } catch (error: any) {
      toast({
        title: "Failed to send OTP",
        description: error.message || "Phone number not found in our system",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the verification code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiRequest("POST", "/api/auth/forgot-password/verify-otp", { phone, otp });
      setResetToken(result.resetToken);
      toast({
        title: "OTP Verified",
        description: "Please set your new password",
      });
      setStep("reset");
    } catch (error: any) {
      toast({
        title: "Invalid OTP",
        description: error.message || "The verification code is incorrect or expired",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Weak password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/forgot-password/reset", { 
        phone, 
        resetToken, 
        newPassword 
      });
      toast({
        title: "Password Reset Successful",
        description: "You can now login with your new password",
      });
      setStep("success");
    } catch (error: any) {
      toast({
        title: "Failed to reset password",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between p-4 border-b">
        <Link href="/">
          <img 
            src={logoImage} 
            alt="Divyanshi Solar" 
            className="h-10 w-auto object-contain"
          />
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {step === "success" ? "Password Reset" : "Forgot Password"}
            </CardTitle>
            <CardDescription>
              {step === "phone" && "Enter your registered phone number to receive OTP"}
              {step === "otp" && `Enter the verification code sent to ${phone}`}
              {step === "reset" && "Create a new password for your account"}
              {step === "success" && "Your password has been reset successfully"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "phone" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your 10-digit phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="pl-10"
                      data-testid="input-phone"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleSendOtp}
                  className="w-full" 
                  disabled={isLoading || phone.length < 10}
                  data-testid="button-send-otp"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </div>
            )}

            {step === "otp" && (
              <div className="space-y-4">
                {userName && (
                  <div className="p-3 bg-muted rounded-md text-sm text-center">
                    Account found for: <span className="font-medium">{userName}</span>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="pl-10 text-center text-lg tracking-widest"
                      data-testid="input-otp"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleVerifyOtp}
                  className="w-full" 
                  disabled={isLoading || otp.length < 4}
                  data-testid="button-verify-otp"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify OTP"
                  )}
                </Button>

                <Button 
                  variant="ghost" 
                  onClick={() => setStep("phone")}
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Change Phone Number
                </Button>
              </div>
            )}

            {step === "reset" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      data-testid="input-new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    data-testid="input-confirm-password"
                  />
                </div>

                <Button 
                  onClick={handleResetPassword}
                  className="w-full" 
                  disabled={isLoading || !newPassword || !confirmPassword}
                  data-testid="button-reset-password"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </div>
            )}

            {step === "success" && (
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <p className="text-muted-foreground">
                  Your password has been reset successfully. You can now login with your new password.
                </p>
                <Button 
                  onClick={() => setLocation("/login")}
                  className="w-full"
                  data-testid="button-go-to-login"
                >
                  Go to Login
                </Button>
              </div>
            )}

            {step !== "success" && (
              <div className="mt-6 text-center">
                <Link 
                  href="/login" 
                  className="text-sm text-primary hover:underline"
                  data-testid="link-back-to-login"
                >
                  <ArrowLeft className="inline h-4 w-4 mr-1" />
                  Back to Login
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="border-t p-4 text-center text-sm text-muted-foreground">
        <p>PM Surya Ghar Yojana Partner Portal</p>
      </footer>
    </div>
  );
}
