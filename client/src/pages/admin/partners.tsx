import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Users, Building2, Check, X, Search, Phone, Mail, MapPin, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { indianStates } from "@shared/schema";

export default function AdminPartners() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deletePartnerId, setDeletePartnerId] = useState<string | null>(null);
  const [newPartner, setNewPartner] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    phone: "",
    role: "ddp",
    state: "",
    district: "",
  });

  const { data: partners, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/partners"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/admin/partners/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Partner status updated" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update status", description: error.message, variant: "destructive" });
    },
  });

  const createPartnerMutation = useMutation({
    mutationFn: async (data: typeof newPartner) => {
      return apiRequest("POST", "/api/admin/partners", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Partner created successfully" });
      setShowAddDialog(false);
      setNewPartner({ username: "", password: "", name: "", email: "", phone: "", role: "ddp", state: "", district: "" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create partner", description: error.message, variant: "destructive" });
    },
  });

  const deletePartnerMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/partners/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Partner deleted successfully" });
      setDeletePartnerId(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete partner", description: error.message, variant: "destructive" });
    },
  });

  const handleCreatePartner = () => {
    if (!newPartner.username || !newPartner.password || !newPartner.name || !newPartner.phone) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    createPartnerMutation.mutate(newPartner);
  };

  const filteredPartners = partners?.filter((partner) => {
    const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.phone.includes(searchTerm);
    const matchesRole = roleFilter === "all" || partner.role === roleFilter;
    const matchesStatus = statusFilter === "all" || partner.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
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

  const pendingCount = partners?.filter(p => p.status === "pending").length || 0;
  const bdpCount = partners?.filter(p => p.role === "bdp").length || 0;
  const ddpCount = partners?.filter(p => p.role === "ddp").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Partner Management</h1>
          <p className="text-muted-foreground">Manage BDPs and DDPs</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-partner">
              <Plus className="w-4 h-4 mr-2" /> Add Partner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Partner</DialogTitle>
              <DialogDescription>Create a new BDP or DDP partner account.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select value={newPartner.role} onValueChange={(v) => setNewPartner({ ...newPartner, role: v })}>
                  <SelectTrigger data-testid="select-new-role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bdp">BDP (Business Development Partner)</SelectItem>
                    <SelectItem value="ddp">DDP (District Development Partner)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  value={newPartner.name}
                  onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                  placeholder="Enter full name"
                  data-testid="input-new-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Username *</Label>
                <Input
                  value={newPartner.username}
                  onChange={(e) => setNewPartner({ ...newPartner, username: e.target.value })}
                  placeholder="Enter username"
                  data-testid="input-new-username"
                />
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input
                  type="password"
                  value={newPartner.password}
                  onChange={(e) => setNewPartner({ ...newPartner, password: e.target.value })}
                  placeholder="Enter password"
                  data-testid="input-new-password"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input
                  value={newPartner.phone}
                  onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
                  placeholder="Enter phone number"
                  data-testid="input-new-phone"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newPartner.email}
                  onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })}
                  placeholder="Enter email"
                  data-testid="input-new-email"
                />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Select value={newPartner.state} onValueChange={(v) => setNewPartner({ ...newPartner, state: v })}>
                  <SelectTrigger data-testid="select-new-state">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {indianStates.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>District</Label>
                <Input
                  value={newPartner.district}
                  onChange={(e) => setNewPartner({ ...newPartner, district: e.target.value })}
                  placeholder="Enter district"
                  data-testid="input-new-district"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button onClick={handleCreatePartner} disabled={createPartnerMutation.isPending} data-testid="button-create-partner">
                {createPartnerMutation.isPending ? "Creating..." : "Create Partner"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{bdpCount}</p>
                <p className="text-sm text-muted-foreground">BDPs</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{ddpCount}</p>
                <p className="text-sm text-muted-foreground">DDPs</p>
              </div>
              <Users className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
              </div>
              <Badge variant="secondary" className="text-yellow-600">{pendingCount}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Partners</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search partners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-partners"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[140px]" data-testid="select-role-filter">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="bdp">BDP</SelectItem>
                <SelectItem value="ddp">DDP</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredPartners && filteredPartners.length > 0 ? (
              filteredPartners.map((partner) => (
                <div
                  key={partner.id}
                  className="p-4 border rounded-lg bg-card"
                  data-testid={`card-partner-${partner.id}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{partner.name}</h3>
                        <Badge variant={partner.role === "bdp" ? "default" : "secondary"}>
                          {partner.role.toUpperCase()}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            partner.status === "approved"
                              ? "border-green-500 text-green-600"
                              : partner.status === "rejected"
                              ? "border-red-500 text-red-600"
                              : "border-yellow-500 text-yellow-600"
                          }
                        >
                          {partner.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {partner.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {partner.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {partner.district}, {partner.state}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {partner.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ id: partner.id, status: "approved" })}
                            disabled={updateStatusMutation.isPending}
                            data-testid={`button-approve-${partner.id}`}
                          >
                            <Check className="w-4 h-4 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatusMutation.mutate({ id: partner.id, status: "rejected" })}
                            disabled={updateStatusMutation.isPending}
                            data-testid={`button-reject-${partner.id}`}
                          >
                            <X className="w-4 h-4 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeletePartnerId(partner.id)}
                        data-testid={`button-delete-${partner.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No partners found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletePartnerId} onOpenChange={(open) => !open && setDeletePartnerId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Partner</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this partner? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePartnerId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deletePartnerId && deletePartnerMutation.mutate(deletePartnerId)}
              disabled={deletePartnerMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deletePartnerMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
