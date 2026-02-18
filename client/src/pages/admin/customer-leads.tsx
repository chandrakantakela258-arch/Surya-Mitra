import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, Phone, Mail, MapPin, Sun, Search, Filter, IndianRupee, Calendar, FileText, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import type { ProposalLead } from "@shared/schema";

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string | Date | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  contacted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  converted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const sourceLabels: Record<string, string> = {
  calculator: "Calculator",
  pdf_download: "PDF Download",
  whatsapp_share: "WhatsApp Share",
  email_proposal: "Email Proposal",
  landing_page: "Landing Page",
};

export default function AdminCustomerLeads() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingLead, setEditingLead] = useState<ProposalLead | null>(null);
  const [editStatus, setEditStatus] = useState("new");
  const [editNotes, setEditNotes] = useState("");

  const { data: leads, isLoading } = useQuery<ProposalLead[]>({
    queryKey: ["/api/admin/proposal-leads"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      return await apiRequest("PATCH", `/api/admin/proposal-leads/${id}`, { status, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/proposal-leads"] });
      toast({ title: "Lead Updated", description: "Lead status has been updated successfully" });
      setEditingLead(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredLeads = leads?.filter((lead) => {
    const matchesSearch =
      !searchTerm ||
      lead.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: leads?.length || 0,
    new: leads?.filter((l) => l.status === "new").length || 0,
    contacted: leads?.filter((l) => l.status === "contacted").length || 0,
    converted: leads?.filter((l) => l.status === "converted").length || 0,
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
          <UserPlus className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Customer Leads</h1>
          <p className="text-muted-foreground">Leads from proposal generation</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
            <UserPlus className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" data-testid="text-total-leads">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New</CardTitle>
            <Sun className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600" data-testid="text-new-leads">{stats.new}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contacted</CardTitle>
            <Phone className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600" data-testid="text-contacted-leads">{stats.contacted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Converted</CardTitle>
            <IndianRupee className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600" data-testid="text-converted-leads">{stats.converted}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-leads"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!filteredLeads?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserPlus className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No leads found</p>
            <p className="text-sm text-muted-foreground mt-1">Leads will appear when customers generate proposals</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredLeads.map((lead) => (
            <Card key={lead.id} className="hover-elevate" data-testid={`card-lead-${lead.id}`}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-lg" data-testid={`text-lead-name-${lead.id}`}>{lead.customerName}</h3>
                      <Badge className={statusColors[lead.status] || ""} data-testid={`badge-lead-status-${lead.id}`}>
                        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                      </Badge>
                      <Badge variant="outline" data-testid={`badge-lead-source-${lead.id}`}>
                        {sourceLabels[lead.source || "calculator"] || lead.source}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        <span data-testid={`text-lead-phone-${lead.id}`}>{lead.phone}</span>
                      </div>
                      {lead.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-3.5 h-3.5" />
                          <span data-testid={`text-lead-email-${lead.id}`}>{lead.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Sun className="w-3.5 h-3.5" />
                        <span data-testid={`text-lead-capacity-${lead.id}`}>
                          {lead.plantCapacity} kW | {lead.plantType === "dcr" ? "DCR" : "Non-DCR"} | {lead.inverterType === "hybrid" ? "3-in-1 Hybrid" : "Ongrid"}
                        </span>
                      </div>
                      {lead.address && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          <span data-testid={`text-lead-address-${lead.id}`}>{lead.address}</span>
                        </div>
                      )}
                      {lead.netCost && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <IndianRupee className="w-3.5 h-3.5" />
                          <span data-testid={`text-lead-cost-${lead.id}`}>Net Cost: {formatINR(lead.netCost)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span data-testid={`text-lead-date-${lead.id}`}>{formatDate(lead.createdAt)}</span>
                      </div>
                    </div>

                    {lead.notes && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground mt-1">
                        <MessageSquare className="w-3.5 h-3.5 mt-0.5" />
                        <span>{lead.notes}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingLead(lead);
                        setEditStatus(lead.status);
                        setEditNotes(lead.notes || "");
                      }}
                      data-testid={`button-edit-lead-${lead.id}`}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Update
                    </Button>
                    <a href={`tel:${lead.phone}`}>
                      <Button variant="outline" size="sm" data-testid={`button-call-lead-${lead.id}`}>
                        <Phone className="w-4 h-4 mr-1" />
                        Call
                      </Button>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editingLead} onOpenChange={(open) => { if (!open) setEditingLead(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Lead - {editingLead?.customerName}</DialogTitle>
            <DialogDescription>Update the status and add notes for this lead</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger data-testid="select-edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add notes about this lead..."
                data-testid="textarea-edit-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLead(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (editingLead) {
                  updateMutation.mutate({ id: editingLead.id, status: editStatus, notes: editNotes });
                }
              }}
              disabled={updateMutation.isPending}
              data-testid="button-save-lead"
            >
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
