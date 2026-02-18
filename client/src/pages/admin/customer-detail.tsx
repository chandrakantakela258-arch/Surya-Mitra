import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, User, MapPin, Zap, Home, Phone, Mail, FileText, CheckCircle, Clock, Camera, Video, Image, Play, X, CreditCard, Landmark, Hash, Globe, SunMedium, BatteryCharging, Building2, Factory, Smartphone, Pencil, IndianRupee, Calendar, ShieldOff } from "lucide-react";
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
import { StatusBadge } from "@/components/status-badge";
import { calculateSubsidy, formatINR } from "@/components/subsidy-calculator";
import { CustomerJourneyTracker } from "@/components/customer-journey-tracker";
import { DocumentManager } from "@/components/document-manager";
import type { Customer } from "@shared/schema";

interface PartnerInfo {
  ddpName?: string | null;
  ddpPhone?: string | null;
  ddpPartnerCode?: string | null;
  bdpName?: string | null;
  bdpPhone?: string | null;
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
  const [editAadhar, setEditAadhar] = useState("");
  const [editPan, setEditPan] = useState("");
  const [editAccountHolder, setEditAccountHolder] = useState("");
  const [editAccountNumber, setEditAccountNumber] = useState("");
  const [editIfsc, setEditIfsc] = useState("");
  const [editBankName, setEditBankName] = useState("");
  const [editUpi, setEditUpi] = useState("");

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
                <FileText className="w-5 h-5 text-primary" />
                Customer Journey
              </CardTitle>
              <CardDescription>Track installation progress and milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerJourneyTracker customerId={customer.id} customerName={customer.name} showActions={false} />
            </CardContent>
          </Card>

          {(sitePictures.length > 0 || customer.siteVideo) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" />
                  Site Media
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

          {customer.stateEmailSentAt && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  State Email Forwarding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Sent To</dt>
                    <dd className="font-medium" data-testid="text-state-email">{customer.stateEmailSentTo}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Sent At</dt>
                    <dd className="font-medium" data-testid="text-state-email-date">
                      {new Date(customer.stateEmailSentAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          )}

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
