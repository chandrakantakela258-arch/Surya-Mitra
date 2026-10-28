import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Users, Building2, User, Phone, MapPin, IdCard } from "lucide-react";
import type { User as UserType, Customer } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

export default function BDPPartnerHierarchy() {
  const { user } = useAuth();
  const [expandedSDPs, setExpandedSDPs] = useState<Set<string>>(new Set());
  const [expandedDDPs, setExpandedDDPs] = useState<Set<string>>(new Set());

  const { data: partners, isLoading } = useQuery<UserType[]>({
    queryKey: ["/api/bdp/partners"],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/bdp/customers"],
  });

  const sdps = partners?.filter(p => p.role === "sdp") || [];
  const ddps = partners?.filter(p => p.role === "ddp") || [];

  const getDDPsForSDP = (sdpId: string) => ddps.filter(d => d.parentId === sdpId);
  const getDirectDDPs = () => ddps.filter(d => d.parentId === user?.id);
  const getCustomersForPartner = (partnerId: string) => customers?.filter(c => (c as any).partnerId === partnerId) || [];

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-48 w-full" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Partner Hierarchy</h1>
        <p className="text-muted-foreground">Your complete network: SDPs, DDPs, and Customers</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {user?.name}
            <Badge>BDP</Badge>
            {user?.partnerCode && <Badge variant="outline" className="font-mono">{user.partnerCode}</Badge>}
            <Badge variant="outline" className={user?.teamStructure === "marketing_team" ? "border-blue-500 text-blue-600" : "border-gray-400"}>
              {user?.teamStructure === "marketing_team" ? "SDP+DDP Structure" : "DDP Only Structure"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>SDPs: {sdps.length}</span>
            <span>DDPs: {ddps.length}</span>
            <span>Customers: {customers?.length || 0}</span>
          </div>

          {/* State Partners */}
          {sdps.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">State Partners (SDP)</h3>
              {sdps.map(sdp => (
                <Collapsible key={sdp.id} open={expandedSDPs.has(sdp.id)} onOpenChange={() => {
                  setExpandedSDPs(prev => { const n = new Set(prev); n.has(sdp.id) ? n.delete(sdp.id) : n.add(sdp.id); return n; });
                }}>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center gap-2 p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors">
                      {expandedSDPs.has(sdp.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <User className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">{sdp.name}</span>
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">SDP</Badge>
                      {sdp.partnerCode && <Badge variant="outline" className="font-mono text-xs">{sdp.partnerCode}</Badge>}
                      <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1"><Phone className="h-3 w-3" />{sdp.phone}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{sdp.district}, {sdp.state}</span>
                      <Badge variant="secondary" className="text-xs">{getDDPsForSDP(sdp.id).length} DDPs</Badge>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-6 mt-2 space-y-2">
                      {getDDPsForSDP(sdp.id).map(ddp => (
                        <Collapsible key={ddp.id} open={expandedDDPs.has(ddp.id)} onOpenChange={() => {
                          setExpandedDDPs(prev => { const n = new Set(prev); n.has(ddp.id) ? n.delete(ddp.id) : n.add(ddp.id); return n; });
                        }}>
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center gap-2 p-2 rounded-lg border bg-green-50 dark:bg-green-950/20 hover:bg-green-100 transition-colors">
                              {expandedDDPs.has(ddp.id) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                              <User className="h-3 w-3 text-green-600" />
                              <span className="text-sm font-medium">{ddp.name}</span>
                              <Badge className="bg-green-100 text-green-700 text-xs">DDP</Badge>
                              {ddp.partnerCode && <Badge variant="outline" className="font-mono text-xs">{ddp.partnerCode}</Badge>}
                              <span className="text-xs text-muted-foreground ml-auto">{ddp.phone}</span>
                              <Badge variant="secondary" className="text-xs">{getCustomersForPartner(ddp.id).length} Customers</Badge>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="ml-6 mt-1 space-y-1">
                              {getCustomersForPartner(ddp.id).map(c => (
                                <div key={c.id} className="flex items-center gap-2 p-2 rounded border bg-orange-50 dark:bg-orange-950/20 text-sm">
                                  <Users className="h-3 w-3 text-orange-500" />
                                  <span>{c.name}</span>
                                  <span className="text-xs text-muted-foreground">{c.phone}</span>
                                  <span className="text-xs text-muted-foreground">{c.district}</span>
                                  <Badge variant="outline" className="text-xs ml-auto">{c.status}</Badge>
                                </div>
                              ))}
                              {getCustomersForPartner(ddp.id).length === 0 && (
                                <p className="text-xs text-muted-foreground p-2">No customers yet</p>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                      {getDDPsForSDP(sdp.id).length === 0 && (
                        <p className="text-xs text-muted-foreground p-2 ml-2">No DDPs under this SDP yet</p>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}

          {/* Direct DDPs */}
          {getDirectDDPs().length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Direct DDPs</h3>
              {getDirectDDPs().map(ddp => (
                <Collapsible key={ddp.id} open={expandedDDPs.has(ddp.id)} onOpenChange={() => {
                  setExpandedDDPs(prev => { const n = new Set(prev); n.has(ddp.id) ? n.delete(ddp.id) : n.add(ddp.id); return n; });
                }}>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center gap-2 p-2 rounded-lg border bg-green-50 dark:bg-green-950/20 hover:bg-green-100 transition-colors">
                      {expandedDDPs.has(ddp.id) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      <User className="h-3 w-3 text-green-600" />
                      <span className="font-medium">{ddp.name}</span>
                      <Badge className="bg-green-100 text-green-700 text-xs">DDP</Badge>
                      {ddp.partnerCode && <Badge variant="outline" className="font-mono text-xs">{ddp.partnerCode}</Badge>}
                      <span className="text-xs text-muted-foreground ml-auto">{ddp.phone}</span>
                      <Badge variant="secondary" className="text-xs">{getCustomersForPartner(ddp.id).length} Customers</Badge>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-6 mt-1 space-y-1">
                      {getCustomersForPartner(ddp.id).map(c => (
                        <div key={c.id} className="flex items-center gap-2 p-2 rounded border bg-orange-50 dark:bg-orange-950/20 text-sm">
                          <Users className="h-3 w-3 text-orange-500" />
                          <span>{c.name}</span>
                          <span className="text-xs text-muted-foreground">{c.phone}</span>
                          <Badge variant="outline" className="text-xs ml-auto">{c.status}</Badge>
                        </div>
                      ))}
                      {getCustomersForPartner(ddp.id).length === 0 && (
                        <p className="text-xs text-muted-foreground p-2">No customers yet</p>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}

          {sdps.length === 0 && getDirectDDPs().length === 0 && (
            <p className="text-center text-muted-foreground py-8">No partners in your network yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
