import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  ChevronRight, 
  Users, 
  Building2, 
  User, 
  Phone, 
  Search,
  MapPin,
  IdCard
, Trash2 } from "lucide-react";
import type { User as UserType, Customer } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ExpandableSiteProgress } from "@/components/customer-journey-tracker";

export default function AdminPartnerHierarchy() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedBDPs, setExpandedBDPs] = useState<Set<string>>(new Set());
  const [expandedDDPs, setExpandedDDPs] = useState<Set<string>>(new Set());
  const [expandedSDPs, setExpandedSDPs] = useState<Set<string>>(new Set());

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/partners/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Partner deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
    },
    onError: (e: any) => {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    },
  });

  const handleDelete = (id: string, name: string, role: string) => {
    const childCount = role === 'bdp' 
      ? (partners?.filter(p => p.role === 'ddp' && p.parentId === id) || []).length
      : 0;
    const warning = childCount > 0 
      ? `\n\nWARNING: This BDP has ${childCount} DDP partner(s) mapped under them. Deleting will orphan those partners.`
      : '';
    if (confirm(`Are you sure you want to delete ${name} (${role.toUpperCase()})?${warning}\n\nThis action cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const { data: partners, isLoading: partnersLoading } = useQuery<UserType[]>({
    queryKey: ["/api/admin/partners"],
  });

  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers"],
  });

  const isLoading = partnersLoading || customersLoading;

  const toggleBDP = (id: string) => {
    setExpandedBDPs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSDP = (id: string) => {
    setExpandedSDPs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleDDP = (id: string) => {
    setExpandedDDPs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  const bdps = partners?.filter(p => p.role === "bdp") || [];
  const sdps = partners?.filter(p => p.role === "sdp") || [];
  const ddps = partners?.filter(p => p.role === "ddp") || [];

  const getSDPsForBDP = (bdpId: string) => {
    return sdps.filter(sdp => sdp.parentId === bdpId);
  };
  const getDDPsForSDP = (sdpId: string) => {
    return ddps.filter(ddp => ddp.parentId === sdpId);
  };
  const getDDPsForBDP = (bdpId: string) => {
    return ddps.filter(ddp => ddp.parentId === bdpId);
  };

  const getCustomersForDDP = (ddpId: string) => {
    return customers?.filter(c => c.ddpId === ddpId) || [];
  };

  const getBDPForDDP = (ddp: UserType) => {
    return bdps.find(bdp => bdp.id === ddp.parentId);
  };

  const getDDPForCustomer = (customer: Customer) => {
    return ddps.find(ddp => ddp.id === customer.ddpId);
  };

  const filteredBDPs = bdps.filter(bdp => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    if (bdp.name.toLowerCase().includes(term) || bdp.phone.includes(term)) return true;
    const bdpDDPs = getDDPsForBDP(bdp.id);
    for (const ddp of bdpDDPs) {
      if (ddp.name.toLowerCase().includes(term) || ddp.phone.includes(term)) return true;
      const ddpCustomers = getCustomersForDDP(ddp.id);
      for (const customer of ddpCustomers) {
        if (customer.name.toLowerCase().includes(term) || customer.phone.includes(term)) return true;
      }
    }
    return false;
  });

  const totalDDPs = ddps.length;
  const totalCustomers = customers?.length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Partner Hierarchy</h1>
        <p className="text-muted-foreground">View BDP → SDP → DDP → Customer relationships</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-bdp-count">{bdps.length}</p>
                <p className="text-sm text-muted-foreground">BDPs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Building2 className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sdps.length}</p>
                <p className="text-sm text-muted-foreground">SDPs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-ddp-count">{totalDDPs}</p>
                <p className="text-sm text-muted-foreground">DDPs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <User className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-customer-count">{totalCustomers}</p>
                <p className="text-sm text-muted-foreground">Customers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search BDPs, DDPs, or customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="input-search"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Partner Network
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredBDPs.length > 0 ? (
            filteredBDPs.map((bdp) => {
              const bdpDDPs = getDDPsForBDP(bdp.id);
              const isBDPExpanded = expandedBDPs.has(bdp.id);
              
              return (
                <div key={bdp.id} className="border rounded-lg" data-testid={`card-bdp-${bdp.id}`}>
                  <Collapsible open={isBDPExpanded} onOpenChange={() => toggleBDP(bdp.id)}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-4 hover-elevate rounded-lg">
                        <div className="flex items-center gap-3">
                          {isBDPExpanded ? (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          )}
                          <div className="p-2 bg-primary/10 rounded-full">
                            <Building2 className="w-4 h-4 text-primary" />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold">{bdp.name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                              <Phone className="w-3 h-3" />
                              <span>{bdp.phone}</span>
                              {bdp.partnerCode && (
                                <>
                                  <IdCard className="w-3 h-3 ml-2" />
                                  <span className="font-mono text-primary">{bdp.partnerCode}</span>
                                </>
                              )}
                              {bdp.state && (
                                <>
                                  <MapPin className="w-3 h-3 ml-2" />
                                  <span>{bdp.state}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{getSDPsForBDP(bdp.id).length} SDPs</Badge>
                          <Badge variant="secondary">{bdpDDPs.length} DDPs</Badge>
                          <Badge className="bg-primary/10 text-primary border-0">BDP</Badge>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="pl-8 pr-4 pb-4 space-y-2">
                        {/* SDPs under this BDP */}
                        {getSDPsForBDP(bdp.id).map((sdp) => {
                          const sdpDDPs = getDDPsForSDP(sdp.id);
                          const isSDPExpanded = expandedSDPs.has(sdp.id);
                          return (
                            <div key={sdp.id} className="border rounded-lg bg-purple-50/30 dark:bg-purple-950/10">
                              <Collapsible open={isSDPExpanded} onOpenChange={() => toggleSDP(sdp.id)}>
                                <CollapsibleTrigger className="w-full">
                                  <div className="flex items-center justify-between p-3 hover-elevate rounded-lg">
                                    <div className="flex items-center gap-3">
                                      {isSDPExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                      <div className="p-1.5 bg-purple-500/10 rounded-full"><Building2 className="w-3 h-3 text-purple-500" /></div>
                                      <div className="text-left">
                                        <p className="font-medium">{sdp.name}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                          <Phone className="w-3 h-3" /><span>{sdp.phone}</span>
                                          {sdp.partnerCode && (<><IdCard className="w-3 h-3 ml-1" /><span className="font-mono text-purple-600 dark:text-purple-400">{sdp.partnerCode}</span></>)}
                                          {sdp.state && (<><MapPin className="w-3 h-3 ml-1" /><span>{sdp.state}</span></>)}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleDelete(sdp.id, sdp.name, 'sdp'); }} title="Delete SDP"><Trash2 className="h-3.5 w-3.5" /></Button>
                                      <Badge variant="secondary" className="text-xs">{sdpDDPs.length} DDPs</Badge>
                                      <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-0 text-xs">SDP</Badge>
                                    </div>
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="pl-10 pr-3 pb-3 space-y-2">
                                    {sdpDDPs.length > 0 ? sdpDDPs.map((ddp) => {
                                      const ddpCustomers = getCustomersForDDP(ddp.id);
                                      const isDDPExpanded = expandedDDPs.has(ddp.id);
                                      return (
                                        <div key={ddp.id} className="border rounded-lg bg-muted/30">
                                          <Collapsible open={isDDPExpanded} onOpenChange={() => toggleDDP(ddp.id)}>
                                            <CollapsibleTrigger className="w-full">
                                              <div className="flex items-center justify-between p-3 hover-elevate rounded-lg">
                                                <div className="flex items-center gap-3">
                                                  {isDDPExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                                  <div className="p-1.5 bg-blue-500/10 rounded-full"><Users className="w-3 h-3 text-blue-500" /></div>
                                                  <div className="text-left">
                                                    <p className="font-medium">{ddp.name}</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                                      <Phone className="w-3 h-3" /><span>{ddp.phone}</span>
                                                      {ddp.partnerCode && (<><IdCard className="w-3 h-3 ml-1" /><span className="font-mono text-blue-600 dark:text-blue-400">{ddp.partnerCode}</span></>)}
                                                    </div>
                                                  </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleDelete(ddp.id, ddp.name, 'ddp'); }} title="Delete DDP"><Trash2 className="h-3.5 w-3.5" /></Button>
                                                  <Badge variant="outline" className="text-xs">{ddpCustomers.length} Customers</Badge>
                                                  <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0 text-xs">DDP</Badge>
                                                </div>
                                              </div>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                              <div className="pl-10 pr-3 pb-3 space-y-1">
                                                {ddpCustomers.length > 0 ? ddpCustomers.map((customer) => (
                                                  <div key={customer.id} className="p-2 bg-background rounded-md border space-y-2">
                                                    <div className="flex items-center justify-between gap-2">
                                                      <div className="flex items-center gap-2">
                                                        <div className="p-1 bg-green-500/10 rounded-full"><User className="w-3 h-3 text-green-500" /></div>
                                                        <div>
                                                          <p className="text-sm font-medium">{customer.name}</p>
                                                          <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="w-3 h-3" /><span>{customer.phone}</span></div>
                                                        </div>
                                                      </div>
                                                      <Badge variant="outline" className="text-xs">{customer.status}</Badge>
                                                    </div>
                                                  </div>
                                                )) : <p className="text-xs text-muted-foreground py-2">No customers yet</p>}
                                              </div>
                                            </CollapsibleContent>
                                          </Collapsible>
                                        </div>
                                      );
                                    }) : <p className="text-xs text-muted-foreground py-2">No DDPs under this SDP</p>}
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            </div>
                          );
                        })}
                        {bdpDDPs.length > 0 ? (
                          bdpDDPs.map((ddp) => {
                            const ddpCustomers = getCustomersForDDP(ddp.id);
                            const isDDPExpanded = expandedDDPs.has(ddp.id);
                            
                            return (
                              <div key={ddp.id} className="border rounded-lg bg-muted/30" data-testid={`card-ddp-${ddp.id}`}>
                                <Collapsible open={isDDPExpanded} onOpenChange={() => toggleDDP(ddp.id)}>
                                  <CollapsibleTrigger className="w-full">
                                    <div className="flex items-center justify-between p-3 hover-elevate rounded-lg">
                                      <div className="flex items-center gap-3">
                                        {isDDPExpanded ? (
                                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                        ) : (
                                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                        )}
                                        <div className="p-1.5 bg-blue-500/10 rounded-full">
                                          <Users className="w-3 h-3 text-blue-500" />
                                        </div>
                                        <div className="text-left">
                                          <p className="font-medium">{ddp.name}</p>
                                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                            <Phone className="w-3 h-3" />
                                            <span>{ddp.phone}</span>
                                            {ddp.partnerCode && (
                                              <>
                                                <IdCard className="w-3 h-3 ml-1" />
                                                <span className="font-mono text-blue-600 dark:text-blue-400">{ddp.partnerCode}</span>
                                              </>
                                            )}
                                            {ddp.district && (
                                              <>
                                                <MapPin className="w-3 h-3 ml-1" />
                                                <span>{ddp.district}</span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">{ddpCustomers.length} Customers</Badge>
                                        <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0 text-xs">DDP</Badge>
                                      </div>
                                    </div>
                                  </CollapsibleTrigger>
                                  
                                  <CollapsibleContent>
                                    <div className="pl-10 pr-3 pb-3 space-y-1">
                                      {ddpCustomers.length > 0 ? (
                                        ddpCustomers.map((customer) => (
                                          <div 
                                            key={customer.id} 
                                            className="p-2 bg-background rounded-md border space-y-2"
                                            data-testid={`card-customer-${customer.id}`}
                                          >
                                            <div className="flex items-center justify-between gap-2">
                                              <div className="flex items-center gap-2">
                                                <div className="p-1 bg-green-500/10 rounded-full">
                                                  <User className="w-3 h-3 text-green-500" />
                                                </div>
                                                <div>
                                                  <p className="text-sm font-medium">{customer.name}</p>
                                                  <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
                                                    <Phone className="w-3 h-3" />
                                                    <span>{customer.phone}</span>
                                                    {customer.customerCode && (
                                                      <>
                                                        <IdCard className="w-3 h-3 ml-1" />
                                                        <span className="font-mono text-green-600 dark:text-green-400">{customer.customerCode}</span>
                                                      </>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="text-right">
                                                <Badge 
                                                  variant="outline" 
                                                  className={cn(
                                                    "text-xs",
                                                    customer.status === "completed" && "bg-green-500/10 text-green-600 border-green-200",
                                                    customer.status === "pending" && "bg-yellow-500/10 text-yellow-600 border-yellow-200"
                                                  )}
                                                >
                                                  {customer.status}
                                                </Badge>
                                                <p className="text-xs text-muted-foreground mt-1">{customer.proposedCapacity || "N/A"} kW</p>
                                              </div>
                                            </div>
                                            <div className="ml-6">
                                              <ExpandableSiteProgress 
                                                customerId={customer.id}
                                                customerName={customer.name}
                                                showActions={true}
                                              />
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-xs text-muted-foreground py-2">No customers yet</p>
                                      )}
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-sm text-muted-foreground py-2">No partners under this BDP</p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              );
            })
          ) : (
            <p className="text-center text-muted-foreground py-8">No partners found</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            All Customers with Partner Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {customers && customers.length > 0 ? (
              customers
                .filter(c => {
                  if (!searchTerm) return true;
                  const term = searchTerm.toLowerCase();
                  return c.name.toLowerCase().includes(term) || c.phone.includes(term);
                })
                .map((customer) => {
                  const ddp = getDDPForCustomer(customer);
                  const bdp = ddp ? getBDPForDDP(ddp) : null;
                  
                  return (
                    <div 
                      key={customer.id} 
                      className="p-4 border rounded-lg"
                      data-testid={`row-customer-detail-${customer.id}`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-500/10 rounded-full">
                            <User className="w-4 h-4 text-green-500" />
                          </div>
                          <div>
                            <p className="font-semibold">{customer.name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                              <Phone className="w-3 h-3" />
                              <span>{customer.phone}</span>
                              {customer.customerCode && (
                                <>
                                  <IdCard className="w-3 h-3 ml-1" />
                                  <span className="font-mono text-green-600 dark:text-green-400">{customer.customerCode}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-4 md:items-center">
                          <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded-md">
                            <p className="text-xs text-muted-foreground">DDP (Onboarded by)</p>
                            <p className="font-medium text-sm">{ddp?.name || "Unknown"}</p>
                            {ddp && (
                              <>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Phone className="w-3 h-3" />
                                  <span>{ddp.phone}</span>
                                </div>
                                {ddp.partnerCode && (
                                  <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    <IdCard className="w-3 h-3" />
                                    <span className="font-mono">{ddp.partnerCode}</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          
                          <div className="bg-primary/5 p-2 rounded-md">
                            <p className="text-xs text-muted-foreground">BDP</p>
                            <p className="font-medium text-sm">{bdp?.name || "Unknown"}</p>
                            {bdp && (
                              <>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Phone className="w-3 h-3" />
                                  <span>{bdp.phone}</span>
                                </div>
                                {bdp.partnerCode && (
                                  <div className="flex items-center gap-1 text-xs text-primary mt-1">
                                    <IdCard className="w-3 h-3" />
                                    <span className="font-mono">{bdp.partnerCode}</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          
                          <Badge 
                            variant="outline"
                            className={cn(
                              customer.status === "completed" && "bg-green-500/10 text-green-600 border-green-200",
                              customer.status === "pending" && "bg-yellow-500/10 text-yellow-600 border-yellow-200"
                            )}
                          >
                            {customer.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-3 max-w-[280px]">
                        <ExpandableSiteProgress 
                          customerId={customer.id}
                          customerName={customer.name}
                          showActions={true}
                        />
                      </div>
                    </div>
                  );
                })
            ) : (
              <p className="text-center text-muted-foreground py-8">No customers found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
