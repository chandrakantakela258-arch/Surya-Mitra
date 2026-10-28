import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2, ArrowLeft, Building2, Phone, User, Lock, Mail, MapPin } from "lucide-react";
import { indianStatesData, getDistrictsForState } from "@shared/india-data";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";

export default function BDPAddSDP() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    username: "",
    password: "",
    state: "",
    district: "",
    address: "",
  });

  const districts = form.state ? getDistrictsForState(form.state) : [];

  useEffect(() => {
    setForm(f => ({ ...f, district: "" }));
  }, [form.state]);

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.username || !form.password) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (form.phone.replace(/\D/g, "").length < 10) {
      toast({ title: "Please enter a valid 10-digit phone number", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const data: any = await apiRequest("POST", "/api/bdp/add-sdp", {
        name: form.name,
        phone: form.phone,
        email: form.email,
        username: form.username,
        password: form.password,
        state: form.state,
        district: form.district,
        address: form.address,
        role: "sdp",
      });
      toast({
        title: "State Partner Added Successfully!",
        description: `${form.name} registered as SDP with code ${data?.partnerCode || data?.partner_code || ""}`,
      });
      setLocation("/bdp/partners");
    } catch (error: any) {
      toast({
        title: "Failed to add partner",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <Button variant="ghost" className="mb-4 gap-2" onClick={() => setLocation("/bdp/partners")}>
        <ArrowLeft className="h-4 w-4" /> Back to Partners
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-purple-600" />
            </div>
            Add State Development Partner
          </CardTitle>
          <CardDescription>
            Register a new SDP under your network. They will be mapped under you ({user?.name}) automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><User className="h-3.5 w-3.5" />Full Name *</Label>
              <Input placeholder="Partner's full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />Phone Number *</Label>
              <Input placeholder="10-digit phone number" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Username *</Label>
              <Input placeholder="Login username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Lock className="h-3.5 w-3.5" />Password *</Label>
              <Input type="password" placeholder="Min 6 characters" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />Email (optional)</Label>
            <Input placeholder="partner@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />State</Label>
              <Select value={form.state} onValueChange={v => setForm(f => ({ ...f, state: v, district: "" }))}>
                <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                <SelectContent>
                  {indianStatesData.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>District</Label>
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
            <Label>Address (optional)</Label>
            <Input placeholder="Full address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          </div>

          <div className="rounded-lg bg-purple-50 dark:bg-purple-950/30 p-3 text-sm text-muted-foreground">
            <strong>Partner Code:</strong> Will be auto-generated as <span className="font-mono font-bold">DSSDP{user?.partnerCode?.slice(5) || "XXX"}XXX</span>
          </div>

          <Button onClick={handleSubmit} disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-700">
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : <><Building2 className="mr-2 h-4 w-4" />Add State Partner</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
