import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Loader2, MapPin, Phone, User, Lock, Mail, Building2, Sun } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { indianStatesData, getDistrictsForState } from "@shared/india-data";
import logoImage from "@assets/88720521_logo_1766219255006.png";

export default function JoinBDP() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "", username: "", phone: "", email: "",
    state: "", district: "", address: "",
    password: "", confirmPassword: "",
  });

  const districts = form.state ? getDistrictsForState(form.state) : [];

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.username || !form.password) {
      toast({ title: "Please fill all required fields", variant: "destructive" }); return;
    }
    if (form.password !== form.confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" }); return;
    }
    if (form.password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" }); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role: "bdp", status: "pending" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      setSuccess(data);
    } catch (e: any) {
      toast({ title: "Registration failed", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-8 pb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Registration Submitted!</h2>
          <div className="space-y-3 mt-4 text-left bg-muted/50 p-4 rounded-lg text-sm">
            <div><span className="text-muted-foreground">Name:</span> <strong>{form.name}</strong></div>
            <div><span className="text-muted-foreground">Phone:</span> <strong>{form.phone}</strong></div>
            <div><span className="text-muted-foreground">Role:</span> <strong>Business Development Partner (BDP)</strong></div>
          </div>
          <p className="text-sm text-muted-foreground mt-4 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
            Your account is <strong>pending admin approval</strong>. You will be notified once approved.
          </p>
          <Button className="mt-4 w-full" onClick={() => setLocation("/login")}>Go to Login</Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <img src={logoImage} alt="Divyanshi Digital Services Pvt Ltd" className="h-14 mx-auto mb-3" />
          <h1 className="text-2xl font-bold">Business Development Partner</h1>
          <p className="text-muted-foreground text-sm mt-1">Register to build and manage a network of District Partners</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {["Manage DDPs", "Earn Commissions", "Analytics Dashboard"].map((b) => (
            <div key={b} className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center shadow-sm">
              <Sun className="w-5 h-5 text-orange-500 mx-auto mb-1" />
              <p className="text-xs font-medium">{b}</p>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              BDP Registration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><User className="h-3.5 w-3.5" />Full Name *</Label>
                <Input placeholder="Your full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><User className="h-3.5 w-3.5" />Username *</Label>
                <Input placeholder="Choose username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />Phone *</Label>
                <Input placeholder="10-digit number" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />Email</Label>
                <Input placeholder="Optional" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />State *</Label>
                <Select value={form.state} onValueChange={v => setForm(f => ({ ...f, state: v, district: "" }))}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>{indianStatesData.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />District *</Label>
                {districts.length > 0 ? (
                  <Select value={form.district} onValueChange={v => setForm(f => ({ ...f, district: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                    <SelectContent>{districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                ) : (
                  <Input placeholder="Enter district" value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input placeholder="Your address (optional)" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Lock className="h-3.5 w-3.5" />Password *</Label>
                <Input type={showPassword ? "text" : "password"} placeholder="Min 6 characters" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Lock className="h-3.5 w-3.5" />Confirm Password *</Label>
                <Input type={showPassword ? "text" : "password"} placeholder="Re-enter password" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} />
              </div>
            </div>
            <button type="button" className="text-xs text-muted-foreground underline" onClick={() => setShowPassword(p => !p)}>
              {showPassword ? "Hide" : "Show"} password
            </button>
            <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 mt-2">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Registering...</> : <><Building2 className="mr-2 h-4 w-4" />Register as BDP</>}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button onClick={() => setLocation("/login")} className="text-primary font-medium hover:underline">Login here</button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
