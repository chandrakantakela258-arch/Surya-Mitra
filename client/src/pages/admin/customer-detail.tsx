import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, User, MapPin, Zap, Home, Phone, Mail, FileText, CheckCircle, Clock, Camera, Video, Image, Play, X, CreditCard, Landmark, Hash, Globe, SunMedium, BatteryCharging, Building2, Factory, Smartphone, Pencil, IndianRupee, CalendarIcon, ShieldOff, RefreshCw, Send, ScrollText, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parse } from "date-fns";
import { calculateSubsidy, formatINR, DCR_HYBRID_RATE_PER_WATT, DCR_ONGRID_RATE_PER_WATT, NON_DCR_ONGRID_RATE_PER_WATT, NON_DCR_HYBRID_RATE_PER_WATT } from "@/components/subsidy-calculator";

const HYBRID_RATE_PER_KW = 75000;
const ONGRID_RATE_PER_KW = 66000;
import { CustomerJourneyTracker } from "@/components/customer-journey-tracker";
import { DocumentManager } from "@/components/document-manager";
import type { Customer } from "@shared/schema";

interface PartnerInfo {
  ddpName?: string | null;
  ddpPhone?: string | null;
  ddpEmail?: string | null;
  ddpPartnerCode?: string | null;
  bdpName?: string | null;
  bdpPhone?: string | null;
  bdpEmail?: string | null;
  bdpPartnerCode?: string | null;
}

export default function AdminCustomerDetail() {
  const [, params] = useRoute("/admin/customers/:id");
  const [, setLocation] = useLocation();
  const customerId = params?.id;
  const { toast } = useToast();

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState(false);
  const [showEditDetails, setShowEditDetails] = useState(false);
  const [editingStateEmail, setEditingStateEmail] = useState(false);
  const [stateEmailInput, setStateEmailInput] = useState("");
  const [editAadhar, setEditAadhar] = useState("");
  const [editPan, setEditPan] = useState("");
  const [editAccountHolder, setEditAccountHolder] = useState("");
  const [editAccountNumber, setEditAccountNumber] = useState("");
  const [editIfsc, setEditIfsc] = useState("");
  const [editBankName, setEditBankName] = useState("");
  const [editUpi, setEditUpi] = useState("");
  const [showAgreementForm, setShowAgreementForm] = useState(false);
  const [agreementData, setAgreementData] = useState({
    dateOfAgreement: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
    customerName: "",
    consumerNumber: "",
    customerAddress: "",
    vendorName: "",
    vendorAddress: "",
    plantCapacity: "",
    solarModuleMake: "",
    solarModuleModel: "",
    solarInverterMake: "",
    solarInverterModel: "",
    plantCost: "",
    advancePayment: "",
    performaInvoice: "",
    finalPayment: "",
  });
  const [advancePercent, setAdvancePercent] = useState(10);
  const FINAL_PAYMENT_PERCENT = 5;
  const [sendToCustomer, setSendToCustomer] = useState(true);
  const [sendToDDP, setSendToDDP] = useState(true);
  const [generatedPdfFile, setGeneratedPdfFile] = useState<string | null>(null);

  const { data: customer, isLoading } = useQuery<Customer>({
    queryKey: ["/api/customers", customerId],
    enabled: !!customerId,
  });

  const { data: partnerInfo } = useQuery<PartnerInfo>({
    queryKey: ["/api/admin/customers", customerId, "partner-info"],
    enabled: !!customerId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      return apiRequest("PATCH", `/api/admin/customers/${customerId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId] });
      toast({ title: "Status Updated" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const togglePortalMutation = useMutation({
    mutationFn: async ({ enabled }: { enabled: boolean }) => {
      return apiRequest("PATCH", `/api/admin/customers/${customerId}/portal`, { portalEnabled: enabled });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId] });
      toast({ title: variables.enabled ? "Portal Access Enabled" : "Portal Access Disabled" });
    },
  });

  const resendEmailMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/admin/customers/${customerId}/resend-state-email`);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/state-emails"] });
      toast({ title: "Email Sent", description: `Email sent successfully to ${data?.sentTo || "configured address"}.` });
    },
    onError: (error: any) => {
      toast({ title: "Failed to send email", description: error.message || "Something went wrong", variant: "destructive" });
    },
  });

  const stateEmailQuery = useQuery<{ state: string; email: string }[]>({
    queryKey: ["/api/admin/state-emails"],
  });

  const { data: equipmentOptions } = useQuery<{ moduleMakes: { make: string; models: string[] }[]; inverterMakes: { make: string; models: string[] }[] }>({
    queryKey: ["/api/admin/equipment-options"],
  });

  const { data: vendorList = [] } = useQuery<{ id: string; name: string; address: string }[]>({
    queryKey: ["/api/admin/vendors"],
  });

  const currentStateEmail = customer?.state
    ? stateEmailQuery.data?.find(s => s.state === customer.state.trim())?.email || ""
    : "";

  const updateStateEmailMutation = useMutation({
    mutationFn: async ({ state, email }: { state: string; email: string }) => {
      return apiRequest("POST", "/api/admin/state-emails", { state, email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/state-emails"] });
      setEditingStateEmail(false);
      toast({ title: "Email Updated", description: "State forwarding email has been updated." });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update email", description: error.message || "Something went wrong", variant: "destructive" });
    },
  });

  const updateDetailsMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      return apiRequest("PATCH", `/api/admin/customers/${customerId}/details`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId] });
      setShowEditDetails(false);
      toast({ title: "Details Updated" });
    },
    onError: () => {
      toast({ title: "Failed to update details", variant: "destructive" });
    },
  });

  const generateAgreementMutation = useMutation({
    mutationFn: async (data: typeof agreementData) => {
      return apiRequest("POST", `/api/admin/customers/${customerId}/generate-agreement`, data);
    },
    onSuccess: (data: any) => {
      setGeneratedPdfFile(data.fileName);
      toast({ title: "Agreement Generated", description: "PDF draft agreement has been generated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Failed to generate agreement", description: error.message, variant: "destructive" });
    },
  });

  const sendAgreementMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/admin/customers/${customerId}/send-agreement`, {
        ...agreementData,
        sendToCustomer,
        sendToDDP,
        customerEmail: customer?.email || "",
        ddpEmail: partnerInfo?.ddpEmail || "",
      });
    },
    onSuccess: (data: any) => {
      setGeneratedPdfFile(data.fileName);
      toast({ title: "Agreement Sent", description: data.message });
    },
    onError: (error: any) => {
      toast({ title: "Failed to send agreement", description: error.message, variant: "destructive" });
    },
  });

  function formatRupees(amount: number): string {
    return `Rs ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(amount))}`;
  }

  function parseRupeeAmount(str: string): number {
    const cleaned = str.replace(/[^0-9.]/g, "");
    return parseFloat(cleaned) || 0;
  }

  function calculatePayments(costStr: string, advPct: number) {
    const cost = parseRupeeAmount(costStr);
    if (cost <= 0) return { advancePayment: "", performaInvoice: "", finalPayment: "" };
    const advance = Math.round(cost * advPct / 100);
    const finalPay = Math.round(cost * FINAL_PAYMENT_PERCENT / 100);
    const performa = Math.round(cost - advance - finalPay);
    return {
      advancePayment: formatRupees(advance),
      performaInvoice: formatRupees(performa),
      finalPayment: formatRupees(finalPay),
    };
  }

  const [moaInverterType, setMoaInverterType] = useState<"hybrid" | "ongrid">("hybrid");

  function getPlantCostForMOA(capacityKw: number, invType: "hybrid" | "ongrid"): number {
    const ratePerKw = invType === "hybrid" ? HYBRID_RATE_PER_KW : ONGRID_RATE_PER_KW;
    return capacityKw * ratePerKw;
  }

  function openAgreementForm() {
    if (!customer) return;
    const capacityNum = parseFloat(customer.proposedCapacity || "0") || 0;
    const invType = (customer.inverterType === "ongrid" || customer.inverterType === "on-grid") ? "ongrid" : "hybrid";
    setMoaInverterType(invType);
    const totalCost = getPlantCostForMOA(capacityNum, invType);
    const costStr = totalCost > 0 ? formatRupees(totalCost) : "";
    const defaultAdvPct = 10;
    setAdvancePercent(defaultAdvPct);
    const payments = calculatePayments(costStr, defaultAdvPct);
    setAgreementData({
      dateOfAgreement: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
      customerName: customer.name || "",
      consumerNumber: customer.consumerNumber || "",
      customerAddress: `${customer.address || ""}, ${customer.district || ""}, ${customer.state || ""} - ${customer.pincode || ""}`,
      vendorName: vendorList.length > 0 ? vendorList[0].name : "",
      vendorAddress: vendorList.length > 0 ? vendorList[0].address : "",
      plantCapacity: capacityNum > 0 ? `${capacityNum} kW` : "",
      solarModuleMake: "",
      solarModuleModel: "",
      solarInverterMake: "",
      solarInverterModel: "",
      plantCost: costStr,
      ...payments,
    });
    setGeneratedPdfFile(null);
    setSendToCustomer(true);
    setSendToDDP(true);
    setShowAgreementForm(true);
  }

  function openEditDetails() {
    if (!customer) return;
    setEditAadhar(customer.aadharNumber || "");
    setEditPan(customer.panNumber || "");
    setEditAccountHolder(customer.accountHolderName || "");
    setEditAccountNumber(customer.accountNumber || "");
    setEditIfsc(customer.ifscCode || "");
    setEditBankName(customer.bankName || "");
    setEditUpi(customer.upiId || "");
    setShowEditDetails(true);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Customer not found</p>
        <Button variant="ghost" onClick={() => setLocation("/admin/customers")} data-testid="button-back-not-found">
          Back to customers
        </Button>
      </div>
    );
  }

  const capacityNum = parseFloat(customer.proposedCapacity || "0") || 0;
  const subsidyInfo = capacityNum > 0 ? calculateSubsidy(Math.min(capacityNum, 10)) : null;
  const sitePictures = customer.sitePictures || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/admin/customers")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold" data-testid="text-customer-name">{customer.name}</h1>
            <StatusBadge status={customer.status} />
            {customer.customerCode && (
              <Badge variant="outline" className="font-mono" data-testid="badge-customer-code">{customer.customerCode}</Badge>
            )}
          </div>
          <p className="text-muted-foreground">{customer.district}, {customer.state} - {customer.pincode}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={openEditDetails} data-testid="button-edit-details">
            <Pencil className="w-4 h-4 mr-2" />
            Edit Details
          </Button>
          <Button variant="outline" size="sm" onClick={openAgreementForm} data-testid="button-send-agreement" className="text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20">
            <ScrollText className="w-4 h-4 mr-2" />
            Draft Agreement
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => togglePortalMutation.mutate({ enabled: !customer.portalEnabled })}
            disabled={togglePortalMutation.isPending}
            data-testid="button-toggle-portal"
          >
            {customer.portalEnabled ? (
              <><ShieldOff className="w-4 h-4 mr-2" />Disable Portal</>
            ) : (
              <><Smartphone className="w-4 h-4 mr-2" />Enable Portal</>
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Change Status:</span>
        <Button size="sm" variant={customer.status === "pending" ? "default" : "outline"} disabled={customer.status !== "pending" || updateStatusMutation.isPending} onClick={() => updateStatusMutation.mutate({ status: "verified" })} data-testid="button-verify">
          <CheckCircle className="w-4 h-4 mr-1" />Verify
        </Button>
        <Button size="sm" variant={customer.status === "verified" ? "default" : "outline"} disabled={customer.status !== "verified" || updateStatusMutation.isPending} onClick={() => updateStatusMutation.mutate({ status: "approved" })} data-testid="button-approve">
          <FileText className="w-4 h-4 mr-1" />Approve
        </Button>
        <Button size="sm" variant={customer.status === "approved" ? "default" : "outline"} disabled={customer.status !== "approved" || updateStatusMutation.isPending} onClick={() => updateStatusMutation.mutate({ status: "installation_scheduled" })} data-testid="button-schedule">
          <Clock className="w-4 h-4 mr-1" />Schedule
        </Button>
        <Button size="sm" variant={customer.status === "installation_scheduled" ? "default" : "outline"} disabled={customer.status !== "installation_scheduled" || updateStatusMutation.isPending} onClick={() => updateStatusMutation.mutate({ status: "completed" })} data-testid="button-complete">
          <CheckCircle className="w-4 h-4 mr-1" />Complete
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="font-mono" data-testid="text-phone">{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span data-testid="text-email">{customer.email}</span>
                </div>
              )}
              <Separator />
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <p data-testid="text-address">{customer.address}</p>
                  <p className="text-muted-foreground">
                    {customer.district}, {customer.state} - {customer.pincode}
                  </p>
                </div>
              </div>
              {customer.latitude && customer.longitude && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-mono">
                      {parseFloat(customer.latitude).toFixed(5)}, {parseFloat(customer.longitude).toFixed(5)}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => window.open(`https://www.google.com/maps?q=${customer.latitude},${customer.longitude}`, "_blank")} data-testid="button-view-map">
                      View Map
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Identity Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Aadhaar Number</dt>
                  <dd className={`font-medium font-mono ${!customer.aadharNumber ? "text-orange-500 italic" : ""}`} data-testid="text-aadhar">
                    {customer.aadharNumber || "Not provided"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">PAN Number</dt>
                  <dd className={`font-medium font-mono ${!customer.panNumber ? "text-orange-500 italic" : ""}`} data-testid="text-pan">
                    {customer.panNumber || "Not provided"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Electricity Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">DISCOM</dt>
                  <dd className="font-medium" data-testid="text-discom">{customer.electricityBoard || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Consumer No.</dt>
                  <dd className="font-medium font-mono" data-testid="text-consumer-no">{customer.consumerNumber || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Sanctioned Load</dt>
                  <dd className="font-medium" data-testid="text-load">{customer.sanctionedLoad ? `${customer.sanctionedLoad} kW` : "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Avg. Monthly Bill</dt>
                  <dd className="font-medium" data-testid="text-bill">{customer.avgMonthlyBill ? formatINR(customer.avgMonthlyBill) : "—"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5 text-primary" />
                Roof & Installation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Roof Type</dt>
                  <dd className="font-medium" data-testid="text-roof-type">{customer.roofType || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Roof Area</dt>
                  <dd className="font-medium" data-testid="text-roof-area">{customer.roofArea ? `${customer.roofArea} sq ft` : "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Panel Type</dt>
                  <dd className="font-medium" data-testid="text-panel-type">
                    {customer.panelType === "dcr" ? "DCR" : customer.panelType === "non_dcr" ? "Non-DCR" : customer.panelType || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Customer Type</dt>
                  <dd className="font-medium" data-testid="text-customer-type">
                    {customer.customerType ? customer.customerType.charAt(0).toUpperCase() + customer.customerType.slice(1) : "—"}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Proposed Capacity</dt>
                  <dd className="text-2xl font-bold text-primary" data-testid="text-capacity">{customer.proposedCapacity || "—"} kW</dd>
                </div>
              </dl>

              {subsidyInfo && (
                <>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">System Cost</p>
                      <p className="font-semibold font-mono">{formatINR(subsidyInfo.totalCost)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-green-600 dark:text-green-400">Subsidy</p>
                      <p className="font-semibold font-mono text-green-600 dark:text-green-400">-{formatINR(subsidyInfo.totalSubsidy)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Net Cost</p>
                      <p className="font-semibold font-mono text-primary">{formatINR(subsidyInfo.netCost)}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-primary" />
                Bank Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Account Holder</dt>
                  <dd className="font-medium" data-testid="text-account-holder">{customer.accountHolderName || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Bank Name</dt>
                  <dd className="font-medium" data-testid="text-bank-name">{customer.bankName || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Account Number</dt>
                  <dd className="font-medium font-mono" data-testid="text-account-number">{customer.accountNumber || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">IFSC Code</dt>
                  <dd className="font-medium font-mono" data-testid="text-ifsc">{customer.ifscCode || "—"}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-muted-foreground">UPI ID</dt>
                  <dd className="font-medium" data-testid="text-upi">{customer.upiId || "—"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Partner Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">DDP (District Development Partner)</p>
                <p className="font-medium" data-testid="text-ddp-name">{partnerInfo?.ddpName || "—"}</p>
                {partnerInfo?.ddpPhone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" /> {partnerInfo.ddpPhone}
                  </p>
                )}
                {partnerInfo?.ddpPartnerCode && (
                  <Badge variant="outline" className="font-mono mt-1">{partnerInfo.ddpPartnerCode}</Badge>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">BDP (Business Development Partner)</p>
                <p className="font-medium" data-testid="text-bdp-name">{partnerInfo?.bdpName || "—"}</p>
                {partnerInfo?.bdpPhone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" /> {partnerInfo.bdpPhone}
                  </p>
                )}
                {partnerInfo?.bdpPartnerCode && (
                  <Badge variant="outline" className="font-mono mt-1">{partnerInfo.bdpPartnerCode}</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                State Email Forwarding
              </CardTitle>
              {customer.stateEmailSentAt && (
                <CardDescription>
                  Last sent on {new Date(customer.stateEmailSentAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} at {new Date(customer.stateEmailSentAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Forwarding Emails for {customer.state || "—"} <span className="normal-case">(up to 3)</span></p>
                {editingStateEmail ? (
                  <div className="space-y-2">
                    {stateEmailInput.split(',').map((e) => e.trim()).filter(Boolean).concat(['']).slice(0, 3).map((emailVal, idx, arr) => {
                      const existingEmails = stateEmailInput.split(',').map((e) => e.trim()).filter(Boolean);
                      const isAddRow = idx === existingEmails.length && existingEmails.length < 3;
                      const isExistingRow = idx < existingEmails.length;
                      if (!isAddRow && !isExistingRow) return null;
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <Input
                            type="email"
                            value={isExistingRow ? emailVal : ""}
                            onChange={(e) => {
                              const parts = stateEmailInput.split(',').map((p) => p.trim()).filter(Boolean);
                              if (isExistingRow) {
                                parts[idx] = e.target.value;
                              } else {
                                parts.push(e.target.value);
                              }
                              setStateEmailInput(parts.join(', '));
                            }}
                            placeholder={isAddRow ? "Add another email" : `Email ${idx + 1}`}
                            className="flex-1"
                            data-testid={`input-state-email-${idx}`}
                          />
                          {isExistingRow && existingEmails.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              data-testid={`button-remove-email-${idx}`}
                              onClick={() => {
                                const parts = stateEmailInput.split(',').map((p) => p.trim()).filter(Boolean);
                                parts.splice(idx, 1);
                                setStateEmailInput(parts.join(', '));
                              }}
                            >
                              <X className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        disabled={!stateEmailInput.trim() || updateStateEmailMutation.isPending}
                        data-testid="button-save-state-email"
                        onClick={() => {
                          if (customer.state && stateEmailInput.trim()) {
                            updateStateEmailMutation.mutate({ state: customer.state.trim(), email: stateEmailInput.trim() });
                          }
                        }}
                      >
                        {updateStateEmailMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Save"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingStateEmail(false)}
                        data-testid="button-cancel-state-email"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 flex-wrap">
                    <div className="flex-1 min-w-0" data-testid="text-configured-state-email">
                      {currentStateEmail ? (
                        <div className="space-y-1">
                          {currentStateEmail.split(',').map((e, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="font-medium text-sm truncate">{e.trim()}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not configured</span>
                      )}
                    </div>
                    {customer.state && (
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid="button-edit-state-email"
                        onClick={() => {
                          setStateEmailInput(currentStateEmail);
                          setEditingStateEmail(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {customer.stateEmailSentAt && (
                <>
                  <Separator />
                  <div className="text-sm">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Last Sent</p>
                    <p className="font-medium" data-testid="text-state-email">{customer.stateEmailSentTo}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(customer.stateEmailSentAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} at {new Date(customer.stateEmailSentAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                    </p>
                  </div>
                </>
              )}

              <Separator />
              <div className="flex items-center gap-3 flex-wrap">
                {customer.state && (
                  <Button
                    variant={customer.stateEmailSentAt ? "outline" : "default"}
                    size="sm"
                    data-testid="button-resend-state-email"
                    disabled={resendEmailMutation.isPending || updateStateEmailMutation.isPending || !currentStateEmail}
                    onClick={() => resendEmailMutation.mutate()}
                  >
                    {resendEmailMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : customer.stateEmailSentAt ? (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    {customer.stateEmailSentAt ? "Resend Email" : "Send Email Now"}
                  </Button>
                )}
                <span className="text-xs text-muted-foreground">
                  {!currentStateEmail ? "Configure email above first" : "Send with latest customer data and attachments"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Customer Journey
              </CardTitle>
              <CardDescription>Track installation progress and milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerJourneyTracker customerId={customer.id} customerName={customer.name} showActions={false} />
            </CardContent>
          </Card>

          {(sitePictures.length > 0 || customer.siteVideo || (customer.documents && customer.documents.length > 0)) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" />
                  Site Media & Uploaded Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sitePictures.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Image className="w-3 h-3" />
                      {sitePictures.length} Site Pictures
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {sitePictures.map((url, index) => (
                        <div key={index} className="aspect-square rounded-md overflow-hidden cursor-pointer hover-elevate" onClick={() => setPreviewImage(url)}>
                          <img src={url} alt={`Site ${index + 1}`} className="w-full h-full object-cover" data-testid={`img-site-picture-${index}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {customer.documents && customer.documents.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {customer.documents.length} Uploaded Document{customer.documents.length !== 1 ? "s" : ""}
                    </p>
                    <div className="space-y-1">
                      {customer.documents.map((url: string, index: number) => {
                        const fileName = url.split('/').pop() || `Document ${index + 1}`;
                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                        return isImage ? (
                          <div key={index} className="aspect-square max-w-[120px] rounded-md overflow-hidden cursor-pointer hover-elevate" onClick={() => setPreviewImage(url)}>
                            <img src={url} alt={`Doc ${index + 1}`} className="w-full h-full object-cover" data-testid={`img-customer-doc-${index}`} />
                          </div>
                        ) : (
                          <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-md border text-sm hover-elevate" data-testid={`link-customer-doc-${index}`}>
                            <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
                            <span className="truncate">{decodeURIComponent(fileName)}</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
                {customer.siteVideo && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Video className="w-3 h-3" />
                      Highlight Video
                    </p>
                    <div className="relative aspect-[9/16] max-w-[150px] bg-muted rounded-md overflow-hidden cursor-pointer" onClick={() => setPreviewVideo(true)}>
                      <video src={customer.siteVideo} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <DocumentManager customerId={customer.id} title="Customer Documents" showUpload={false} canVerify={true} />

          {customer.leadScore !== null && customer.leadScore !== undefined && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SunMedium className="w-5 h-5 text-primary" />
                  AI Lead Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold" data-testid="text-lead-score">{customer.leadScore}/100</div>
                  <Badge variant={customer.leadScore >= 70 ? "default" : customer.leadScore >= 40 ? "secondary" : "outline"}>
                    {customer.leadScore >= 70 ? "Hot" : customer.leadScore >= 40 ? "Warm" : "Cold"}
                  </Badge>
                </div>
                {customer.leadScoreUpdatedAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Last scored: {new Date(customer.leadScoreUpdatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Site Picture</DialogTitle>
            <DialogDescription>{customer.name} - {customer.address}, {customer.district}</DialogDescription>
          </DialogHeader>
          {previewImage && <img src={previewImage} alt="Site preview" className="w-full rounded-md" />}
        </DialogContent>
      </Dialog>

      <Dialog open={previewVideo} onOpenChange={setPreviewVideo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Site Highlight Video</DialogTitle>
            <DialogDescription>{customer.name} - {customer.proposedCapacity} kW</DialogDescription>
          </DialogHeader>
          {customer.siteVideo && (
            <video src={customer.siteVideo} controls autoPlay className="w-full aspect-[9/16] rounded-md" data-testid="video-preview" />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showAgreementForm} onOpenChange={setShowAgreementForm}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-orange-600" />
              Draft MOA Agreement
            </DialogTitle>
            <DialogDescription>
              Fill in agreement details. Customer data is pre-filled from registration. This will be printed on Rs 50 Stamp Paper.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
              <p className="text-xs text-orange-700 dark:text-orange-300 font-medium">PM Surya Ghar: Muft Bijli Yojana - Memorandum of Agreement (MOA)</p>
            </div>

            <Separator />
            <p className="text-sm font-semibold text-muted-foreground">Agreement Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Date of Agreement</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      data-testid="button-moa-date-picker"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {agreementData.dateOfAgreement || "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={(() => {
                        try {
                          return parse(agreementData.dateOfAgreement, "dd MMMM yyyy", new Date());
                        } catch {
                          return new Date();
                        }
                      })()}
                      onSelect={(date) => {
                        if (date) {
                          setAgreementData(d => ({ ...d, dateOfAgreement: format(date, "dd MMMM yyyy") }));
                        }
                      }}
                      initialFocus
                      data-testid="calendar-moa-date"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Plant Capacity</Label>
                <Select
                  value={agreementData.plantCapacity || undefined}
                  onValueChange={(val) => {
                    const kw = parseFloat(val) || 0;
                    const newCost = getPlantCostForMOA(kw, moaInverterType);
                    const costStr = newCost > 0 ? formatRupees(newCost) : "";
                    const payments = calculatePayments(costStr, advancePercent);
                    setAgreementData(d => ({ ...d, plantCapacity: val, plantCost: costStr, ...payments }));
                  }}
                >
                  <SelectTrigger data-testid="select-moa-capacity">
                    <SelectValue placeholder="Select capacity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1 kW">1 kW</SelectItem>
                    <SelectItem value="2 kW">2 kW</SelectItem>
                    <SelectItem value="3 kW">3 kW</SelectItem>
                    <SelectItem value="4 kW">4 kW</SelectItem>
                    <SelectItem value="5 kW">5 kW</SelectItem>
                    <SelectItem value="6 kW">6 kW</SelectItem>
                    <SelectItem value="7 kW">7 kW</SelectItem>
                    <SelectItem value="8 kW">8 kW</SelectItem>
                    <SelectItem value="9 kW">9 kW</SelectItem>
                    <SelectItem value="10 kW">10 kW</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Inverter Type (Rate: Hybrid Rs 75,000/kW | Ongrid Rs 66,000/kW)</Label>
                <Select
                  value={moaInverterType}
                  onValueChange={(val: "hybrid" | "ongrid") => {
                    setMoaInverterType(val);
                    const kw = parseFloat(agreementData.plantCapacity) || 0;
                    const newCost = getPlantCostForMOA(kw, val);
                    const costStr = newCost > 0 ? formatRupees(newCost) : "";
                    const payments = calculatePayments(costStr, advancePercent);
                    setAgreementData(d => ({ ...d, plantCost: costStr, ...payments }));
                  }}
                >
                  <SelectTrigger data-testid="select-moa-inverter-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hybrid">3-in-1 Hybrid (Rs 75,000/kW)</SelectItem>
                    <SelectItem value="ongrid">Ongrid (Rs 66,000/kW)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />
            <p className="text-sm font-semibold text-muted-foreground">Customer Details (Pre-filled)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Customer Name</Label>
                <Input
                  value={agreementData.customerName}
                  onChange={(e) => setAgreementData(d => ({ ...d, customerName: e.target.value }))}
                  data-testid="input-moa-customer-name"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Consumer Number</Label>
                <Input
                  value={agreementData.consumerNumber}
                  onChange={(e) => setAgreementData(d => ({ ...d, consumerNumber: e.target.value }))}
                  data-testid="input-moa-consumer-number"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Customer Address</Label>
              <Textarea
                value={agreementData.customerAddress}
                onChange={(e) => setAgreementData(d => ({ ...d, customerAddress: e.target.value }))}
                rows={2}
                data-testid="input-moa-customer-address"
              />
            </div>

            <Separator />
            <p className="text-sm font-semibold text-muted-foreground">Vendor Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {vendorList.length > 0 ? (
                <div className="space-y-1">
                  <Label className="text-xs">Select Vendor</Label>
                  <Select
                    value={vendorList.find(v => v.name === agreementData.vendorName)?.id || undefined}
                    onValueChange={(val) => {
                      const vendor = vendorList.find(v => v.id === val);
                      if (vendor) {
                        setAgreementData(d => ({ ...d, vendorName: vendor.name, vendorAddress: vendor.address }));
                      }
                    }}
                  >
                    <SelectTrigger data-testid="select-moa-vendor">
                      <SelectValue placeholder="Select a vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendorList.map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-1">
                  <Label className="text-xs">Vendor Name</Label>
                  <Input
                    value={agreementData.vendorName}
                    onChange={(e) => setAgreementData(d => ({ ...d, vendorName: e.target.value }))}
                    data-testid="input-moa-vendor-name"
                  />
                </div>
              )}
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Vendor Address (auto-filled)</Label>
                <Textarea
                  value={agreementData.vendorAddress}
                  onChange={(e) => setAgreementData(d => ({ ...d, vendorAddress: e.target.value }))}
                  rows={2}
                  data-testid="input-moa-vendor-address"
                />
              </div>
            </div>

            <Separator />
            <p className="text-sm font-semibold text-muted-foreground">Solar Equipment</p>
            {(equipmentOptions?.moduleMakes?.length ?? 0) === 0 && (equipmentOptions?.inverterMakes?.length ?? 0) === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">No equipment options configured yet. Go to Equipment Settings to add solar module and inverter makes/models for dropdown selection, or type manually below.</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Solar Module Make</Label>
                {(equipmentOptions?.moduleMakes?.length ?? 0) > 0 ? (
                  <Select
                    value={agreementData.solarModuleMake || undefined}
                    onValueChange={(val) => setAgreementData(d => ({ ...d, solarModuleMake: val, solarModuleModel: "" }))}
                  >
                    <SelectTrigger data-testid="select-moa-module-make">
                      <SelectValue placeholder="Select module make" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentOptions!.moduleMakes.map(m => (
                        <SelectItem key={m.make} value={m.make}>{m.make}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={agreementData.solarModuleMake}
                    onChange={(e) => setAgreementData(d => ({ ...d, solarModuleMake: e.target.value }))}
                    placeholder="e.g., IB Solar"
                    data-testid="input-moa-module-make"
                  />
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Solar Module Model</Label>
                {(() => {
                  const selectedMake = equipmentOptions?.moduleMakes?.find(m => m.make === agreementData.solarModuleMake);
                  const models = selectedMake?.models || [];
                  return models.length > 0 ? (
                    <Select
                      value={agreementData.solarModuleModel || undefined}
                      onValueChange={(val) => setAgreementData(d => ({ ...d, solarModuleModel: val }))}
                    >
                      <SelectTrigger data-testid="select-moa-module-model">
                        <SelectValue placeholder="Select module model" />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map(model => (
                          <SelectItem key={model} value={model}>{model}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={agreementData.solarModuleModel}
                      onChange={(e) => setAgreementData(d => ({ ...d, solarModuleModel: e.target.value }))}
                      placeholder="e.g., IB Solar 545W Mono PERC"
                      data-testid="input-moa-module-model"
                    />
                  );
                })()}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Solar Inverter Make</Label>
                {(equipmentOptions?.inverterMakes?.length ?? 0) > 0 ? (
                  <Select
                    value={agreementData.solarInverterMake || undefined}
                    onValueChange={(val) => setAgreementData(d => ({ ...d, solarInverterMake: val, solarInverterModel: "" }))}
                  >
                    <SelectTrigger data-testid="select-moa-inverter-make">
                      <SelectValue placeholder="Select inverter make" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentOptions!.inverterMakes.map(m => (
                        <SelectItem key={m.make} value={m.make}>{m.make}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={agreementData.solarInverterMake}
                    onChange={(e) => setAgreementData(d => ({ ...d, solarInverterMake: e.target.value }))}
                    placeholder="e.g., SunPunch"
                    data-testid="input-moa-inverter-make"
                  />
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Solar Inverter Model</Label>
                {(() => {
                  const selectedMake = equipmentOptions?.inverterMakes?.find(m => m.make === agreementData.solarInverterMake);
                  const models = selectedMake?.models || [];
                  return models.length > 0 ? (
                    <Select
                      value={agreementData.solarInverterModel || undefined}
                      onValueChange={(val) => setAgreementData(d => ({ ...d, solarInverterModel: val }))}
                    >
                      <SelectTrigger data-testid="select-moa-inverter-model">
                        <SelectValue placeholder="Select inverter model" />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map(model => (
                          <SelectItem key={model} value={model}>{model}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={agreementData.solarInverterModel}
                      onChange={(e) => setAgreementData(d => ({ ...d, solarInverterModel: e.target.value }))}
                      placeholder="e.g., SunPunch 3kW On-Grid"
                      data-testid="input-moa-inverter-model"
                    />
                  );
                })()}
              </div>
            </div>

            <Separator />
            <p className="text-sm font-semibold text-muted-foreground">Payment Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Total Plant Cost (Pre-filled from Ongrid rate - adjust if Hybrid)</Label>
                <Input
                  value={agreementData.plantCost}
                  onChange={(e) => {
                    const newCost = e.target.value;
                    const payments = calculatePayments(newCost, advancePercent);
                    setAgreementData(d => ({ ...d, plantCost: newCost, ...payments }));
                  }}
                  placeholder="e.g., Rs 1,98,000"
                  data-testid="input-moa-plant-cost"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Advance Payment %</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={advancePercent}
                    onChange={(e) => {
                      const pct = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                      setAdvancePercent(pct);
                      const payments = calculatePayments(agreementData.plantCost, pct);
                      setAgreementData(d => ({ ...d, ...payments }));
                    }}
                    className="w-20"
                    data-testid="input-moa-advance-percent"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                  <Input
                    value={agreementData.advancePayment}
                    readOnly
                    className="flex-1 bg-muted"
                    data-testid="input-moa-advance"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Final Payment (Fixed {FINAL_PAYMENT_PERCENT}%)</Label>
                <Input
                  value={agreementData.finalPayment}
                  readOnly
                  className="bg-muted"
                  data-testid="input-moa-final"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Performa Invoice (Remaining: 100% - {advancePercent}% - {FINAL_PAYMENT_PERCENT}% = {100 - advancePercent - FINAL_PAYMENT_PERCENT}%)</Label>
                <Input
                  value={agreementData.performaInvoice}
                  readOnly
                  className="bg-muted"
                  data-testid="input-moa-performa"
                />
              </div>
            </div>

            <Separator />
            <p className="text-sm font-semibold text-muted-foreground">Send Agreement via Email</p>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="send-customer"
                  checked={sendToCustomer}
                  onCheckedChange={(checked) => setSendToCustomer(!!checked)}
                  data-testid="checkbox-send-customer"
                />
                <Label htmlFor="send-customer" className="text-sm cursor-pointer">
                  Send to Customer {customer.email ? `(${customer.email})` : "(no email)"}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="send-ddp"
                  checked={sendToDDP}
                  onCheckedChange={(checked) => setSendToDDP(!!checked)}
                  data-testid="checkbox-send-ddp"
                />
                <Label htmlFor="send-ddp" className="text-sm cursor-pointer">
                  Send to DDP {partnerInfo?.ddpName ? `(${partnerInfo.ddpName})` : ""}
                </Label>
              </div>
            </div>

            {generatedPdfFile && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-300 flex-1">Agreement PDF ready</span>
                <Button size="sm" variant="outline" asChild data-testid="button-preview-agreement">
                  <a href={`/api/agreements/${generatedPdfFile}`} target="_blank" rel="noopener noreferrer">
                    <Eye className="w-3 h-3 mr-1" /> Preview
                  </a>
                </Button>
                <Button size="sm" variant="outline" asChild data-testid="button-download-agreement">
                  <a href={`/api/agreements/${generatedPdfFile}`} download>
                    <Download className="w-3 h-3 mr-1" /> Download
                  </a>
                </Button>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setShowAgreementForm(false)} data-testid="button-cancel-agreement">
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => generateAgreementMutation.mutate(agreementData)}
              disabled={generateAgreementMutation.isPending}
              data-testid="button-generate-agreement"
            >
              {generateAgreementMutation.isPending ? "Generating..." : (
                <><Eye className="w-4 h-4 mr-2" />Preview PDF</>
              )}
            </Button>
            <Button
              onClick={() => sendAgreementMutation.mutate()}
              disabled={sendAgreementMutation.isPending || (!sendToCustomer && !sendToDDP)}
              className="bg-orange-600 hover:bg-orange-700"
              data-testid="button-send-agreement-email"
            >
              {sendAgreementMutation.isPending ? "Sending..." : (
                <><Send className="w-4 h-4 mr-2" />Generate & Send</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDetails} onOpenChange={setShowEditDetails}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Customer Details</DialogTitle>
            <DialogDescription>Update Aadhaar, PAN, and Bank details for {customer.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-orange-600 dark:text-orange-400 font-semibold">Aadhaar Number</Label>
              <Input placeholder="12-digit Aadhaar number" maxLength={12} value={editAadhar} onChange={(e) => setEditAadhar(e.target.value.replace(/\D/g, ''))} data-testid="input-edit-aadhar" />
            </div>
            <div className="space-y-2">
              <Label className="text-orange-600 dark:text-orange-400 font-semibold">PAN Number</Label>
              <Input placeholder="e.g., ABCDE1234F" maxLength={10} value={editPan} onChange={(e) => setEditPan(e.target.value.toUpperCase())} data-testid="input-edit-pan" />
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Account Holder</Label>
                <Input placeholder="Account holder name" value={editAccountHolder} onChange={(e) => setEditAccountHolder(e.target.value)} data-testid="input-edit-account-holder" />
              </div>
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input placeholder="Bank name" value={editBankName} onChange={(e) => setEditBankName(e.target.value)} data-testid="input-edit-bank-name" />
              </div>
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input placeholder="Account number" value={editAccountNumber} onChange={(e) => setEditAccountNumber(e.target.value)} data-testid="input-edit-account-number" />
              </div>
              <div className="space-y-2">
                <Label>IFSC Code</Label>
                <Input placeholder="e.g., SBIN0001234" maxLength={11} value={editIfsc} onChange={(e) => setEditIfsc(e.target.value.toUpperCase())} data-testid="input-edit-ifsc" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>UPI ID</Label>
              <Input placeholder="e.g., name@upi" value={editUpi} onChange={(e) => setEditUpi(e.target.value)} data-testid="input-edit-upi" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDetails(false)}>Cancel</Button>
            <Button
              onClick={() => updateDetailsMutation.mutate({
                aadharNumber: editAadhar,
                panNumber: editPan,
                accountHolderName: editAccountHolder,
                accountNumber: editAccountNumber,
                ifscCode: editIfsc,
                bankName: editBankName,
                upiId: editUpi,
              })}
              disabled={updateDetailsMutation.isPending}
              data-testid="button-save-details"
            >
              {updateDetailsMutation.isPending ? "Saving..." : "Save Details"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
