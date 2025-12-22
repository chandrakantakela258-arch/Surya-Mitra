import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  MapPin
} from "lucide-react";
import type { User as UserType, Customer } from "@shared/schema";
import { cn } from "@/lib/utils";

export default function AdminPartnerHierarchy() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedBDPs, setExpandedBDPs] = useState<Set<string>>(new Set());
  const [expandedDDPs, setExpandedDDPs] = useState<Set<string>>(new Set());

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
  const ddps = partners?.filter(p => p.role === "ddp") || [];

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
        <p className="text-muted-foreground">View BDP → DDP → Customer relationships</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="w-3 h-3" />
                              <span>{bdp.phone}</span>
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
                          <Badge variant="secondary">{bdpDDPs.length} DDPs</Badge>
                          <Badge className="bg-primary/10 text-primary border-0">BDP</Badge>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="pl-8 pr-4 pb-4 space-y-2">
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
                                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Phone className="w-3 h-3" />
                                            <span>{ddp.phone}</span>
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
                                            className="flex items-center justify-between p-2 bg-background rounded-md border"
                                            data-testid={`card-customer-${customer.id}`}
                                          >
                                            <div className="flex items-center gap-2">
                                              <div className="p-1 bg-green-500/10 rounded-full">
                                                <User className="w-3 h-3 text-green-500" />
                                              </div>
                                              <div>
                                                <p className="text-sm font-medium">{customer.name}</p>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                  <Phone className="w-3 h-3" />
                                                  <span>{customer.phone}</span>
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
                          <p className="text-sm text-muted-foreground py-2">No DDPs under this BDP</p>
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
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="w-3 h-3" />
                              <span>{customer.phone}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-4 md:items-center">
                          <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded-md">
                            <p className="text-xs text-muted-foreground">DDP (Onboarded by)</p>
                            <p className="font-medium text-sm">{ddp?.name || "Unknown"}</p>
                            {ddp && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                <span>{ddp.phone}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="bg-primary/5 p-2 rounded-md">
                            <p className="text-xs text-muted-foreground">BDP</p>
                            <p className="font-medium text-sm">{bdp?.name || "Unknown"}</p>
                            {bdp && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                <span>{bdp.phone}</span>
                              </div>
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
