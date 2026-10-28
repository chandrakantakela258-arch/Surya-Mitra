import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Users, User, Phone, MapPin, IdCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import type { User as UserType, Customer } from "@shared/schema";

export default function SDPPartnerHierarchy() {
  const { user } = useAuth();
  const [expandedDDPs, setExpandedDDPs] = useState<Set<string>>(new Set());

  const { data: ddps, isLoading } = useQuery<UserType[]>({
    queryKey: ["/api/sdp/ddps"],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/sdp/customers"],
  });

  const getCustomersForDDP = (ddpId: string) => customers?.filter(c => c.ddpId === ddpId) || [];

  const toggleDDP = (id: string) => {
    setExpandedDDPs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-48 w-full" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Partner Hierarchy</h1>
        <p className="text-muted-foreground">Your District Partners and their customers</p>
      </div>

      {/* SDP Header */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-lg">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.district}, {user?.state}</p>
            </div>
            <Badge className="bg-blue-600">SDP</Badge>
            {user?.partnerCode && <Badge variant="outline" className="font-mono">{user.partnerCode}</Badge>}
            <div className="ml-auto flex gap-4 text-center">
              <div><p className="text-2xl font-bold text-blue-600">{ddps?.length || 0}</p><p className="text-xs text-muted-foreground">DDPs</p></div>
              <div><p className="text-2xl font-bold text-green-600">{customers?.length || 0}</p><p className="text-xs text-muted-foreground">Customers</p></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DDPs */}
      {!ddps?.length ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No District Partners yet. Share your link to add DDPs.</CardContent></Card>
      ) : (
        <div className="space-y-3 ml-6 border-l-2 border-blue-200 pl-4">
          {ddps.map(ddp => {
            const ddpCustomers = getCustomersForDDP(ddp.id);
            const isOpen = expandedDDPs.has(ddp.id);
            return (
              <Collapsible key={ddp.id} open={isOpen} onOpenChange={() => toggleDDP(ddp.id)}>
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="p-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-bold">
                          {ddp.name?.charAt(0)}
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">{ddp.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{ddp.phone}</p>
                        </div>
                        <Badge className="bg-green-600">DDP</Badge>
                        {ddp.partnerCode && <Badge variant="outline" className="font-mono text-xs">{ddp.partnerCode}</Badge>}
                        <Badge variant={ddp.status === "approved" ? "default" : "secondary"} className="ml-auto">{ddp.status}</Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground"><Users className="h-4 w-4" />{ddpCustomers.length}</div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 px-4 pb-4">
                      {ddp.district && <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3"><MapPin className="h-3 w-3" />{ddp.district}, {ddp.state}</p>}
                      {ddpCustomers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No customers yet</p>
                      ) : (
                        <div className="space-y-2 ml-4 border-l border-green-200 pl-3">
                          {ddpCustomers.map(c => (
                            <div key={c.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded text-sm">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">{c.name}</span>
                              <span className="text-muted-foreground">{c.phone}</span>
                              <Badge variant="outline" className="text-xs ml-auto">{c.proposedCapacity} kW</Badge>
                              <Badge variant={c.status === "completed" ? "default" : "secondary"} className="text-xs">{c.status}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
}
