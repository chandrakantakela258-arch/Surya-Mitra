import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminWhatsAppTemplates() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"templates"|"limits">("templates");
  const [form, setForm] = useState({ templateId: "", templateName: "", category: "Marketing", language: "en", description: "", sampleParams: "", targetRole: "all" });
  const [editLimit, setEditLimit] = useState<Record<string, any>>({});

  const { data: templates = [], refetch } = useQuery<any[]>({ queryKey: ["/api/admin/whatsapp-templates"] });
  const { data: partners = [] } = useQuery<any[]>({ queryKey: ["/api/admin/partner-whatsapp-limits"] });

  const addTemplate = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/whatsapp-templates", data),
    onSuccess: () => { toast({ title: "Template added!" }); queryClient.invalidateQueries({ queryKey: ["/api/admin/whatsapp-templates"] }); setForm({ templateId: "", templateName: "", category: "Marketing", language: "en", description: "", sampleParams: "" }); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteTemplate = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/whatsapp-templates/${id}`),
    onSuccess: () => { toast({ title: "Template deleted" }); queryClient.invalidateQueries({ queryKey: ["/api/admin/whatsapp-templates"] }); },
  });

  const updateLimit = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/partner-whatsapp-limits", data),
    onSuccess: () => { toast({ title: "Limit updated!" }); queryClient.invalidateQueries({ queryKey: ["/api/admin/partner-whatsapp-limits"] }); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-green-100"><Settings className="w-6 h-6 text-green-600" /></div>
        <div>
          <h1 className="text-2xl font-bold">WhatsApp Settings</h1>
          <p className="text-sm text-muted-foreground">Manage approved templates and partner sending limits</p>
        </div>
      </div>

      <div className="flex gap-2 border-b">
        {(["templates","limits"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={"px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors " + (tab===t?"border-green-600 text-green-600":"border-transparent text-muted-foreground")}>
            {t==="templates" ? `Approved Templates (${(templates as any[]).length})` : `Partner Limits (${(partners as any[]).length})`}
          </button>
        ))}
      </div>

      {tab === "templates" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Add approved template</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Template ID (from Meta)</label>
                <Input value={form.templateId} onChange={e => setForm({...form, templateId: e.target.value})} placeholder="e.g. partner_daily_update" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Display Name</label>
                <Input value={form.templateName} onChange={e => setForm({...form, templateName: e.target.value})} placeholder="e.g. Partner Daily Update" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full border rounded-md px-3 py-2 text-sm bg-background">
                    <option>Marketing</option>
                    <option>Utility</option>
                    <option>Authentication</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Language</label>
                  <select value={form.language} onChange={e => setForm({...form, language: e.target.value})} className="w-full border rounded-md px-3 py-2 text-sm bg-background">
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="en_IN">English (India)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Description (shown to partners)</label>
                <Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Brief description of what this template does" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Sample params (comma separated)</label>
                <Input value={form.sampleParams} onChange={e => setForm({...form, sampleParams: e.target.value})} placeholder="e.g. Partner Name, Date" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Visible to</label>
                <select value={form.targetRole} onChange={e => setForm({...form, targetRole: e.target.value})} className="w-full border rounded-md px-3 py-2 text-sm bg-background">
                  <option value="all">Everyone (Admin + Partners)</option>
                  <option value="admin">Admin Only</option>
                  <option value="partner">Partners Only</option>
                </select>
              </div>
              <Button onClick={() => addTemplate.mutate(form)} disabled={addTemplate.isPending || !form.templateId || !form.templateName} className="w-full bg-green-600 hover:bg-green-700 text-white">
                <Plus className="w-4 h-4 mr-2" /> Add Template
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Active templates</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {(templates as any[]).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No templates added yet</p>}
              {(templates as any[]).map((t: any) => (
                <div key={t.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{t.template_name}</span>
                      <Badge className="text-xs bg-blue-100 text-blue-700">{t.category}</Badge>
                    </div>
                    <div className="text-xs font-mono text-muted-foreground">{t.template_id}</div>
                    <div className="flex gap-1 mt-1">
                      {t.description && <div className="text-xs text-muted-foreground">{t.description}</div>}
                    </div>
                    <div className="mt-1">
                      <span className={"text-xs px-2 py-0.5 rounded-full font-medium " + (t.target_role==="partner"?"bg-green-100 text-green-700":t.target_role==="admin"?"bg-purple-100 text-purple-700":"bg-gray-100 text-gray-700")}>
                        {t.target_role==="partner"?"Partners only":t.target_role==="admin"?"Admin only":"Everyone"}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => deleteTemplate.mutate(t.id)} className="text-muted-foreground hover:text-red-500 flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "limits" && (
        <Card>
          <CardHeader><CardTitle className="text-base">Partner sending limits</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Partner</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Role</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Code</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Sent Today</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Daily Limit</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Enabled</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Save</th>
                </tr></thead>
                <tbody>
                  {(partners as any[]).map((p: any) => {
                    const cur = editLimit[p.id] || { daily_limit: p.daily_limit, is_enabled: p.is_enabled };
                    return (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-2 px-3 font-medium">{p.name}</td>
                        <td className="py-2 px-3"><Badge className={"text-xs " + (p.role==="bdp"?"bg-blue-100 text-blue-700":"bg-purple-100 text-purple-700")}>{p.role.toUpperCase()}</Badge></td>
                        <td className="py-2 px-3 font-mono text-xs text-muted-foreground">{p.partner_code||"—"}</td>
                        <td className="py-2 px-3 text-muted-foreground">{p.messages_sent_today}</td>
                        <td className="py-2 px-3">
                          <Input type="number" value={cur.daily_limit} onChange={e => setEditLimit({...editLimit, [p.id]: {...cur, daily_limit: Number(e.target.value)}})} className="w-20 h-7 text-xs" />
                        </td>
                        <td className="py-2 px-3">
                          <input type="checkbox" checked={cur.is_enabled} onChange={e => setEditLimit({...editLimit, [p.id]: {...cur, is_enabled: e.target.checked}})} className="w-4 h-4 accent-green-600" />
                        </td>
                        <td className="py-2 px-3">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateLimit.mutate({ partnerId: p.id, dailyLimit: cur.daily_limit, isEnabled: cur.is_enabled })}>
                            Save
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
