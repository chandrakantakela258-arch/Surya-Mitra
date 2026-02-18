import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Search, Phone, MapPin, Zap, Calendar, MoreVertical, CheckCircle, Clock, FileCheck, Truck, PartyPopper, Eye, Camera, Video, Play, X, Image, Smartphone, ShieldOff, Settings, Mail, Trash2, Plus, Pencil, Check, CreditCard, Landmark, User } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CustomerJourneyMini, ExpandableSiteProgress } from "@/components/customer-journey-tracker";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CustomerJourneyTracker } from "@/components/customer-journey-tracker";
import { indianStates, type CustomerWithPartnerInfo } from "@shared/schema";

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface StateEmail {
  state: string;
  email: string;
  updatedAt?: string;
}

export default function AdminCustomers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [panelFilter, setPanelFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithPartnerInfo | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState(false);
  const [showEmailSettings, setShowEmailSettings] = useState(false);
  const [newState, setNewState] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [editingState, setEditingState] = useState<string | null>(null);
  const [editingEmail, setEditingEmail] = useState("");
  const [editDetailsCustomer, setEditDetailsCustomer] = useState<CustomerWithPartnerInfo | null>(null);
  const [editAadhar, setEditAadhar] = useState("");
  const [editPan, setEditPan] = useState("");
  const [editAccountHolder, setEditAccountHolder] = useState("");
  const [editAccountNumber, setEditAccountNumber] = useState("");
  const [editIfsc, setEditIfsc] = useState("");
  const [editBankName, setEditBankName] = useState("");
  const [editUpi, setEditUpi] = useState("");
  const { toast } = useToast();

  const { data: customers, isLoading } = useQuery<CustomerWithPartnerInfo[]>({
    queryKey: ["/api/admin/customers"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/admin/customers/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ddp/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bdp/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/commissions"] });
      toast({
        title: "Status Updated",
        description: "Customer status has been updated and notifications sent.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update customer status.",
        variant: "destructive",
      });
    },
  });

  const { data: stateEmails } = useQuery<StateEmail[]>({
    queryKey: ["/api/admin/state-emails"],
  });

  const addStateEmailMutation = useMutation({
    mutationFn: async ({ state, email }: { state: string; email: string }) => {
      return apiRequest("POST", "/api/admin/state-emails", { state, email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/state-emails"] });
      setNewState("");
      setNewEmail("");
      toast({ title: "Email Saved", description: "State forwarding email has been saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteStateEmailMutation = useMutation({
    mutationFn: async (state: string) => {
      return apiRequest("DELETE", `/api/admin/state-emails/${encodeURIComponent(state)}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/state-emails"] });
      toast({ title: "Removed", description: "State forwarding email has been removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateDetailsMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, string> }) => {
      return apiRequest("PATCH", `/api/admin/customers/${id}/details`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      setEditDetailsCustomer(null);
      toast({ title: "Details Updated", description: "Customer Aadhaar/PAN/Bank details have been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update customer details.", variant: "destructive" });
    },
  });

  const openEditDetails = (customer: CustomerWithPartnerInfo) => {
    setEditDetailsCustomer(customer);
    setEditAadhar(customer.aadharNumber || "");
    setEditPan(customer.panNumber || "");
    setEditAccountHolder(customer.accountHolderName || "");
    setEditAccountNumber(customer.accountNumber || "");
    setEditIfsc(customer.ifscCode || "");
    setEditBankName(customer.bankName || "");
    setEditUpi(customer.upiId || "");
  };

  const togglePortalMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      return apiRequest("PATCH", `/api/admin/customers/${id}/portal`, { portalEnabled: enabled });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      toast({
        title: variables.enabled ? "Portal Enabled" : "Portal Disabled",
        description: variables.enabled 
          ? "Customer can now track their installation via OTP login."
          : "Customer portal access has been disabled.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update portal access.",
        variant: "destructive",
      });
    },
  });

  const filteredCustomers = customers?.filter((customer) => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.district?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
    const matchesPanel = panelFilter === "all" || customer.panelType === panelFilter;
    const matchesSource = sourceFilter === "all" || 
      (sourceFilter === "independent" && customer.source === "website_direct") ||
      (sourceFilter === "referred" && customer.source === "website_referral") ||
      (sourceFilter === "partner" && (!customer.source || (customer.source !== "website_direct" && customer.source !== "website_referral")));
    return matchesSearch && matchesStatus && matchesPanel && matchesSource;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const totalCapacity = customers?.reduce((sum, c) => sum + (parseInt(c.proposedCapacity || "0") || 0), 0) || 0;
  const completedCount = customers?.filter(c => c.status === "completed").length || 0;
  const dcrCount = customers?.filter(c => c.panelType === "dcr").length || 0;
  const nonDcrCount = customers?.filter(c => c.panelType === "non_dcr").length || 0;
  const independentCount = customers?.filter(c => c.source === "website_direct").length || 0;
  const referredCount = customers?.filter(c => c.source === "website_referral").length || 0;

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
    verified: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    approved: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
    installation_scheduled: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
    completed: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">All Customers</h1>
          <p className="text-muted-foreground">View all solar applications across the platform</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowEmailSettings(true)}
          data-testid="button-email-settings"
        >
          <Settings className="w-4 h-4 mr-2" />
          Email Forwarding
          {stateEmails && stateEmails.length > 0 && (
            <Badge variant="secondary" className="ml-2">{stateEmails.length}</Badge>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{customers?.length || 0}</p>
            <p className="text-sm text-muted-foreground">Total Customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-orange-600">{totalCapacity} kW</p>
            <p className="text-sm text-muted-foreground">Total Capacity</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex gap-2">
              <Badge variant="default">{dcrCount} DCR</Badge>
              <Badge variant="secondary">{nonDcrCount} Non-DCR</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Panel Types</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex gap-2">
              <Badge variant="outline">{independentCount} Independent</Badge>
              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30">{referredCount} Referred</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Website Registrations</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-customers"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="installation_scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={panelFilter} onValueChange={setPanelFilter}>
              <SelectTrigger className="w-[140px]" data-testid="select-panel-filter">
                <SelectValue placeholder="Panel Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Panels</SelectItem>
                <SelectItem value="dcr">DCR</SelectItem>
                <SelectItem value="non_dcr">Non-DCR</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[160px]" data-testid="select-source-filter">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="independent">Independent</SelectItem>
                <SelectItem value="referred">Referred</SelectItem>
                <SelectItem value="partner">Partner Added</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredCustomers && filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="p-4 border rounded-lg bg-card"
                  data-testid={`card-customer-${customer.id}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{customer.name}</h3>
                        {customer.source === "website_direct" && (
                          <Badge variant="outline" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600">
                            Independent
                          </Badge>
                        )}
                        {customer.source === "website_referral" && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                            Referred
                          </Badge>
                        )}
                        <Badge variant={customer.panelType === "dcr" ? "default" : "secondary"}>
                          {customer.panelType === "dcr" ? "DCR" : "Non-DCR"}
                        </Badge>
                        <span className={`text-xs px-2 py-1 rounded ${statusColors[customer.status] || statusColors.pending}`}>
                          {customer.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {customer.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {customer.district}, {customer.state}
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" /> {customer.proposedCapacity} kW
                        </span>
                        {customer.createdAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(customer.createdAt).toLocaleDateString("en-IN")}
                          </span>
                        )}
                      </div>
                      {/* DDP & BDP Partner Info */}
                      <div className="flex flex-wrap gap-4 text-sm mt-1">
                        {customer.ddpName && (
                          <span className="text-muted-foreground">
                            <span className="font-medium text-foreground">DDP:</span> {customer.ddpName} ({customer.ddpPhone})
                          </span>
                        )}
                        {customer.bdpName && (
                          <span className="text-muted-foreground">
                            <span className="font-medium text-foreground">BDP:</span> {customer.bdpName} ({customer.bdpPhone})
                          </span>
                        )}
                      </div>
                      {(customer.aadharNumber || customer.panNumber) && (
                        <div className="flex flex-wrap gap-4 text-sm mt-1">
                          {customer.aadharNumber && (
                            <span className="text-muted-foreground flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              <span className="font-medium text-foreground">Aadhaar:</span> {customer.aadharNumber}
                            </span>
                          )}
                          {customer.panNumber && (
                            <span className="text-muted-foreground flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              <span className="font-medium text-foreground">PAN:</span> {customer.panNumber}
                            </span>
                          )}
                        </div>
                      )}
                      {(customer.bankName || customer.accountNumber) && (
                        <div className="flex flex-wrap gap-4 text-sm mt-1">
                          {customer.bankName && (
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Landmark className="w-3 h-3" />
                              <span className="font-medium text-foreground">Bank:</span> {customer.bankName}
                            </span>
                          )}
                          {customer.accountNumber && (
                            <span className="text-muted-foreground flex items-center gap-1">
                              <span className="font-medium text-foreground">A/C:</span> {customer.accountNumber}
                            </span>
                          )}
                          {customer.ifscCode && (
                            <span className="text-muted-foreground">
                              <span className="font-medium text-foreground">IFSC:</span> {customer.ifscCode}
                            </span>
                          )}
                          {customer.accountHolderName && (
                            <span className="text-muted-foreground flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {customer.accountHolderName}
                            </span>
                          )}
                        </div>
                      )}
                      {customer.stateEmailSentAt && (
                        <div className="flex items-center gap-2 mt-1" data-testid={`state-email-status-${customer.id}`}>
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-700">
                            <Mail className="w-3 h-3 mr-1" />
                            Email sent to {customer.stateEmailSentTo}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(customer.stateEmailSentAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} at {new Date(customer.stateEmailSentAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                          </span>
                        </div>
                      )}
                      <div className="mt-2 max-w-[250px]">
                        <ExpandableSiteProgress 
                          customerId={customer.id} 
                          customerName={customer.name}
                          showActions={true}
                        />
                      </div>
                      {((customer.sitePictures && customer.sitePictures.length > 0) || customer.siteVideo) && (
                        <div className="flex items-center gap-2 mt-2">
                          {customer.sitePictures && customer.sitePictures.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <Camera className="w-3 h-3 mr-1" />
                              {customer.sitePictures.length} pics
                            </Badge>
                          )}
                          {customer.siteVideo && (
                            <Badge variant="outline" className="text-xs">
                              <Video className="w-3 h-3 mr-1" />
                              Video
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Avg Bill</p>
                        <p className="font-medium">{customer.avgMonthlyBill ? formatINR(customer.avgMonthlyBill) : "-"}</p>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-actions-${customer.id}`}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem disabled className="font-semibold text-muted-foreground">
                            Change Status
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => updateStatusMutation.mutate({ id: customer.id, status: "verified" })}
                            disabled={customer.status !== "pending" || updateStatusMutation.isPending}
                            data-testid={`button-verify-${customer.id}`}
                          >
                            <CheckCircle className="w-4 h-4 mr-2 text-blue-500" />
                            Mark as Verified
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateStatusMutation.mutate({ id: customer.id, status: "approved" })}
                            disabled={customer.status !== "verified" || updateStatusMutation.isPending}
                            data-testid={`button-approve-${customer.id}`}
                          >
                            <FileCheck className="w-4 h-4 mr-2 text-purple-500" />
                            Mark as Approved
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateStatusMutation.mutate({ id: customer.id, status: "installation_scheduled" })}
                            disabled={customer.status !== "approved" || updateStatusMutation.isPending}
                            data-testid={`button-schedule-${customer.id}`}
                          >
                            <Truck className="w-4 h-4 mr-2 text-orange-500" />
                            Schedule Installation
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateStatusMutation.mutate({ id: customer.id, status: "completed" })}
                            disabled={customer.status !== "installation_scheduled" || updateStatusMutation.isPending}
                            data-testid={`button-complete-${customer.id}`}
                          >
                            <PartyPopper className="w-4 h-4 mr-2 text-green-500" />
                            Mark as Completed
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setSelectedCustomer(customer)}
                            data-testid={`button-view-journey-${customer.id}`}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Journey
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => togglePortalMutation.mutate({ 
                              id: customer.id, 
                              enabled: !customer.portalEnabled 
                            })}
                            disabled={togglePortalMutation.isPending}
                            data-testid={`button-toggle-portal-${customer.id}`}
                          >
                            {customer.portalEnabled ? (
                              <>
                                <ShieldOff className="w-4 h-4 mr-2 text-red-500" />
                                Disable Portal Access
                              </>
                            ) : (
                              <>
                                <Smartphone className="w-4 h-4 mr-2 text-green-500" />
                                Enable Portal Access
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openEditDetails(customer)}
                            data-testid={`button-edit-details-${customer.id}`}
                          >
                            <Pencil className="w-4 h-4 mr-2 text-blue-500" />
                            Edit Aadhaar/PAN/Bank
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No customers found</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Customer Details</SheetTitle>
            <SheetDescription>
              View installation progress, milestones, and site media
            </SheetDescription>
          </SheetHeader>
          {selectedCustomer && (
            <div className="mt-6 space-y-6">
              <CustomerJourneyTracker 
                customerId={selectedCustomer.id} 
                customerName={selectedCustomer.name}
                showActions={false}
              />
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Site Media
                </h3>
                
                {selectedCustomer.sitePictures && selectedCustomer.sitePictures.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Image className="w-3 h-3" />
                      {selectedCustomer.sitePictures.length}/6 Site Pictures
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedCustomer.sitePictures.map((url, index) => (
                        <div 
                          key={index} 
                          className="aspect-square rounded-md overflow-hidden cursor-pointer hover-elevate"
                          onClick={() => setPreviewImage(url)}
                        >
                          <img 
                            src={url} 
                            alt={`Site picture ${index + 1}`}
                            className="w-full h-full object-cover"
                            data-testid={`img-admin-site-picture-${index}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No site pictures uploaded</p>
                )}
                
                {selectedCustomer.siteVideo ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Video className="w-3 h-3" />
                      Highlight Video
                    </p>
                    <div 
                      className="relative aspect-[9/16] max-w-[150px] bg-muted rounded-md overflow-hidden cursor-pointer"
                      onClick={() => setPreviewVideo(true)}
                    >
                      <video 
                        src={selectedCustomer.siteVideo} 
                        className="w-full h-full object-cover"
                        data-testid="video-admin-site"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {selectedCustomer.proposedCapacity || "?"} kW - {selectedCustomer.district}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No site video uploaded</p>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
      
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Site Picture</DialogTitle>
            <DialogDescription>
              {selectedCustomer?.name} - {selectedCustomer?.address}, {selectedCustomer?.district}
            </DialogDescription>
          </DialogHeader>
          {previewImage && (
            <img src={previewImage} alt="Site preview" className="w-full rounded-md" />
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={previewVideo} onOpenChange={setPreviewVideo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Site Highlight Video</DialogTitle>
            <DialogDescription>
              {selectedCustomer?.name} - {selectedCustomer?.proposedCapacity} kW - {selectedCustomer?.address}, {selectedCustomer?.district}
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer?.siteVideo && (
            <video 
              src={selectedCustomer.siteVideo} 
              controls 
              autoPlay 
              className="w-full aspect-[9/16] rounded-md"
              data-testid="video-admin-preview"
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEmailSettings} onOpenChange={setShowEmailSettings}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              State Email Forwarding
            </DialogTitle>
            <DialogDescription>
              Set an email address for each state. When a customer from that state is marked as "Verified", their details will be automatically sent to the assigned email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={newState} onValueChange={setNewState}>
                <SelectTrigger className="flex-1" data-testid="select-new-state">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {indianStates
                    .filter(s => !stateEmails?.some(se => se.state === s))
                    .map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Input
                type="email"
                placeholder="Email address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="flex-1"
                data-testid="input-new-state-email"
              />
              <Button
                onClick={() => {
                  if (newState && newEmail) {
                    addStateEmailMutation.mutate({ state: newState, email: newEmail });
                  }
                }}
                disabled={!newState || !newEmail || addStateEmailMutation.isPending}
                data-testid="button-add-state-email"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>

            {stateEmails && stateEmails.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {stateEmails.map((se) => (
                  <div key={se.state} className="flex items-center justify-between gap-3 p-3 rounded-md border" data-testid={`row-state-email-${se.state}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" data-testid={`badge-state-${se.state}`}>{se.state}</Badge>
                        {editingState === se.state ? (
                          <Input
                            type="email"
                            value={editingEmail}
                            onChange={(e) => setEditingEmail(e.target.value)}
                            className="flex-1 min-w-[180px]"
                            data-testid={`input-edit-email-${se.state}`}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && editingEmail) {
                                addStateEmailMutation.mutate({ state: se.state, email: editingEmail }, {
                                  onSuccess: () => setEditingState(null),
                                });
                              }
                              if (e.key === "Escape") setEditingState(null);
                            }}
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground truncate" data-testid={`text-email-${se.state}`}>{se.email}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {editingState === se.state ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (editingEmail) {
                                addStateEmailMutation.mutate({ state: se.state, email: editingEmail }, {
                                  onSuccess: () => setEditingState(null),
                                });
                              }
                            }}
                            disabled={!editingEmail || addStateEmailMutation.isPending}
                            data-testid={`button-save-email-${se.state}`}
                          >
                            <Check className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingState(null)}
                            data-testid={`button-cancel-edit-${se.state}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setEditingState(se.state); setEditingEmail(se.email); }}
                          data-testid={`button-edit-state-email-${se.state}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteStateEmailMutation.mutate(se.state)}
                        disabled={deleteStateEmailMutation.isPending}
                        data-testid={`button-delete-state-email-${se.state}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No state emails configured yet.</p>
                <p className="text-xs mt-1">Add a state and email above to start forwarding customer details automatically.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailSettings(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editDetailsCustomer} onOpenChange={(open) => !open && setEditDetailsCustomer(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Customer Details</DialogTitle>
            <DialogDescription>
              Update Aadhaar, PAN, and Bank details for {editDetailsCustomer?.name}
            </DialogDescription>
          </DialogHeader>
          {editDetailsCustomer && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-orange-600 dark:text-orange-400 font-semibold">Aadhaar Number</Label>
                <Input
                  placeholder="12-digit Aadhaar number"
                  maxLength={12}
                  value={editAadhar}
                  onChange={(e) => setEditAadhar(e.target.value.replace(/\D/g, ''))}
                  data-testid="input-edit-aadhar"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-orange-600 dark:text-orange-400 font-semibold">PAN Number</Label>
                <Input
                  placeholder="e.g., ABCDE1234F"
                  maxLength={10}
                  value={editPan}
                  onChange={(e) => setEditPan(e.target.value.toUpperCase())}
                  data-testid="input-edit-pan"
                />
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
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDetailsCustomer(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (editDetailsCustomer) {
                  updateDetailsMutation.mutate({
                    id: editDetailsCustomer.id,
                    data: {
                      aadharNumber: editAadhar,
                      panNumber: editPan,
                      accountHolderName: editAccountHolder,
                      accountNumber: editAccountNumber,
                      ifscCode: editIfsc,
                      bankName: editBankName,
                      upiId: editUpi,
                    },
                  });
                }
              }}
              disabled={updateDetailsMutation.isPending}
              data-testid="button-save-customer-details"
            >
              {updateDetailsMutation.isPending ? "Saving..." : "Save Details"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
