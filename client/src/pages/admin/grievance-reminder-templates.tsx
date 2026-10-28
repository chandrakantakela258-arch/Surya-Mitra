import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit2, Save, X, Eye, Bell, ArrowUp, ArrowDown } from "lucide-react";

const CATEGORIES = [{v:"bank",label:"Bank / NBFC"},{v:"discom",label:"DISCOM"},{v:"vendor",label:"Vendor"},{v:"nodal",label:"Nodal Agency"}];

const VARS = "{grievance_no} {applicant_name} {applicant_mobile} {pmsg_application_id} {jansamarth_ref} {bank_name} {bank_branch} {manager_name} {manager_mobile} {field_staff_name} {field_staff_mobile} {loan_amount} {plant_capacity} {delay_tenure} {discom} {vendor_name} {address} {district} {state} {days_since} {reminder_no} {date} {filed_date} {org_name}";

const emptyForm = () => ({category:"bank", reminder_no:1, subject:"", body:"", send_after_days:5, is_active:true, to_email_1:"", to_email_2:"", to_email_3:"", cc_1:"", cc_2:"", cc_3:"", cc_4:"", cc_5:"", cc_6:""});

export default function GrievanceReminderTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [form, setForm] = useState<any>(emptyForm());
  const [preview, setPreview] = useState(false);
  const [filter, setFilter] = useState("bank");

  const load = () => {
    setLoading(true);
    fetch("/api/grievance-reminder-templates").then(r=>r.json()).then(d=>{setTemplates(Array.isArray(d)?d:[]);setLoading(false);});
  };
  useEffect(load, []);

  const set = (k:string, v:any) => setForm((p:any)=>({...p,[k]:v}));

  const save = async () => {
    if (!form.subject || !form.body) { alert("Subject and body required"); return; }
    const toEmails = [form.to_email_1, form.to_email_2, form.to_email_3].filter(Boolean).join(",");
    const ccEmails = [form.cc_1, form.cc_2, form.cc_3, form.cc_4, form.cc_5, form.cc_6].filter(Boolean).join(",");
    const saveForm = {...form, to_emails: toEmails, cc_emails: ccEmails};
    const url = editId ? "/api/grievance-reminder-templates/"+editId : "/api/grievance-reminder-templates";
    const method = editId ? "PATCH" : "POST";
    await fetch(url, {method, headers:{"Content-Type":"application/json"}, body:JSON.stringify(saveForm)});
    setShowForm(false); setEditId(null); setForm(emptyForm()); load();
  };

  const del = async (id:number) => {
    if (!confirm("Delete this template?")) return;
    await fetch("/api/grievance-reminder-templates/"+id, {method:"DELETE"});
    load();
  };

  const startEdit = (t:any) => {
    const toList = (t.to_emails||"").split(",").filter(Boolean);
    const ccList = (t.cc_emails||"").split(",").filter(Boolean);
    setForm({...t,
      to_email_1: toList[0]||"", to_email_2: toList[1]||"", to_email_3: toList[2]||"",
      cc_1: ccList[0]||"", cc_2: ccList[1]||"", cc_3: ccList[2]||"",
      cc_4: ccList[3]||"", cc_5: ccList[4]||"", cc_6: ccList[5]||"",
    });
    setEditId(t.id); setShowForm(true); setPreview(false);
    window.scrollTo(0,0);
  };

  const filtered = templates.filter(t => t.category === filter).sort((a,b) => a.reminder_no - b.reminder_no);

  const sampleVars: Record<string,string> = {
    "{grievance_no}":"GRV/2026/123456","{applicant_name}":"Ramesh Kumar",
    "{applicant_mobile}":"9801005212","{pmsg_application_id}":"NP-BRSPD26-10629739",
    "{jansamarth_ref}":"JS-2026-789456","{bank_name}":"State Bank of India",
    "{bank_branch}":"Naubatpur","{manager_name}":"Mr. Suresh Singh",
    "{manager_mobile}":"9876543210","{field_staff_name}":"Mr. Rahul Gupta",
    "{field_staff_mobile}":"9765432109","{loan_amount}":"1,50,000",
    "{plant_capacity}":"3kW","{delay_tenure}":"60-90 days",
    "{days_since}":"45","{reminder_no}":"1",
    "{date}":"7 June 2026","{filed_date}":"23 April 2026",
    "{org_name}":"State Bank of India","{district}":"Patna","{state}":"Bihar",
    "{discom}":"SBPDCL","{vendor_name}":"Divyanshi Solar",
    "{address}":"Vill-Piprawan, Block-Naubatpur, Patna, Bihar"
  };

  const renderPreview = (text: string) => {
    let out = text;
    Object.entries(sampleVars).forEach(([k,v]) => { out = out.replace(new RegExp(k.replace(/[{}]/g,"\\$&"), "g"), v); });
    return out;
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Bell className="w-6 h-6 text-orange-600" />Reminder Email Templates
          </h1>
          <p className="text-sm text-gray-500 mt-1">Configure escalation sequence — templates are sent in order based on days since grievance filing</p>
        </div>
        <Button onClick={()=>{setShowForm(true);setEditId(null);setForm(emptyForm());}} className="bg-orange-600 hover:bg-orange-700 text-white">
          <Plus className="w-4 h-4 mr-2" />Add Template
        </Button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {CATEGORIES.map(c=>(
          <button key={c.v} onClick={()=>setFilter(c.v)}
            className={"px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all "+(filter===c.v?"border-orange-500 bg-orange-50 text-orange-700":"border-gray-200 bg-white text-gray-600")}>
            {c.label} ({templates.filter(t=>t.category===c.v).length})
          </button>
        ))}
      </div>

      {/* Sequence info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
        <strong>How it works:</strong> When you click "Send Reminder" on a grievance, the system automatically picks the next template in sequence based on how many reminders have already been sent. Reminder 1 is sent first, then Reminder 2, then Reminder 3 (Final Escalation). Each template has a recommended "Send After X Days" setting.
      </div>

      {/* Add/Edit Form */}
      {showForm && (
      <Card className="mb-6 border-2 border-orange-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-orange-700">{editId?"Edit":"Add"} Reminder Template</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={()=>setPreview(!preview)}>
                <Eye className="w-3 h-3 mr-1" />{preview?"Edit":"Preview"}
              </Button>
              <Button size="sm" variant="ghost" onClick={()=>{setShowForm(false);setEditId(null);}}><X className="w-4 h-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!preview ? (<>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-bold text-gray-600 uppercase">Category *</Label>
              <Select value={form.category} onValueChange={v=>set("category",v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c=><SelectItem key={c.v} value={c.v}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-bold text-gray-600 uppercase">Reminder No. *</Label>
              <Select value={String(form.reminder_no)} onValueChange={v=>set("reminder_no",Number(v))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 — First Reminder</SelectItem>
                  <SelectItem value="2">2 — Second Reminder / Escalation</SelectItem>
                  <SelectItem value="3">3 — Final Escalation</SelectItem>
                  <SelectItem value="4">4 — Legal Notice</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-bold text-gray-600 uppercase">Send After (Days)</Label>
              <Input type="number" min={1} max={90} className="mt-1" value={form.send_after_days}
                onChange={e=>set("send_after_days",Number(e.target.value))}
                placeholder="Days after grievance filing" />
              <p className="text-xs text-gray-400 mt-1">Recommended: R1=5d, R2=10d, R3=15d</p>
            </div>
          </div>
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-orange-800">Escalation Email Addresses <span className="text-xs font-normal text-orange-600">(overrides registry emails for this reminder)</span></h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
              <p className="text-xs font-bold text-blue-700">TO — Primary Escalation Recipients</p>
              {[1,2,3].map(n=>(
                <div key={n} className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded shrink-0">TO {n}</span>
                  <Input type="email" className="h-8 text-sm" value={(form as any)["to_email_"+n]||""} onChange={e=>set("to_email_"+n,e.target.value)} placeholder={"Escalation TO email "+n} />
                </div>
              ))}
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
              <p className="text-xs font-bold text-gray-600">CC — Additional Copy Recipients</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[1,2,3,4,5,6].map(n=>(
                  <div key={n} className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-gray-500 text-white px-2 py-0.5 rounded shrink-0">CC {n}</span>
                    <Input type="email" className="h-8 text-sm" value={(form as any)["cc_"+n]||""} onChange={e=>set("cc_"+n,e.target.value)} placeholder={"CC email "+n} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <Label className="text-xs font-bold text-gray-600 uppercase">Email Subject *</Label>
            <Input className="mt-1" value={form.subject} onChange={e=>set("subject",e.target.value)} placeholder="Subject line..." />
          </div>
          <div>
            <Label className="text-xs font-bold text-gray-600 uppercase">Email Body *</Label>
            <Textarea className="mt-1 font-mono text-xs" rows={22} value={form.body}
              onChange={e=>set("body",e.target.value)} placeholder="Email body..." />
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">Variables: {VARS}</p>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_active} onChange={e=>set("is_active",e.target.checked)} className="w-4 h-4" />
            <Label>Active</Label>
          </div>
          <div className="flex gap-3">
            <Button onClick={save} className="bg-orange-600 hover:bg-orange-700 text-white"><Save className="w-4 h-4 mr-2" />Save Template</Button>
            <Button variant="outline" onClick={()=>{setShowForm(false);setEditId(null);}}>Cancel</Button>
          </div>
          </>) : (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Subject Preview:</p>
              <p className="text-sm font-medium">{renderPreview(form.subject)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Body Preview:</p>
              <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed">{renderPreview(form.body)}</pre>
            </div>
          </div>
          )}
        </CardContent>
      </Card>)}

      {/* Templates List */}
      {loading ? <p className="text-center text-gray-400 py-8">Loading...</p> : (
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl text-gray-400">No templates for this category. Add one above.</div>
        )}
        {filtered.map((t:any, idx:number) => (
          <Card key={t.id} className={"border-l-4 "+(t.is_active?"border-l-orange-400":"border-l-gray-300 opacity-60")}>
            <CardContent className="py-4 px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={"text-sm font-black px-3 py-1 rounded-full "+(t.reminder_no===1?"bg-yellow-100 text-yellow-700":t.reminder_no===2?"bg-orange-100 text-orange-700":"bg-red-100 text-red-700")}>
                      Reminder {t.reminder_no}
                    </span>
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-semibold">
                      Send after {t.send_after_days} days
                    </span>
                    {!t.is_active && <span className="text-xs text-red-500 font-bold">INACTIVE</span>}
                  </div>
                  <p className="text-sm font-semibold text-gray-800 mt-2 truncate">{t.subject}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.body?.substring(0,150)}...</p>
                  {t.to_emails && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded">ESCALATION TO</span>
                      {t.to_emails.split(",").filter(Boolean).map((e:string,i:number)=>(
                        <span key={i} className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">{e.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button size="sm" variant="outline" onClick={()=>startEdit(t)}><Edit2 className="w-3 h-3" /></Button>
                  <Button size="sm" variant="outline" className="text-red-500" onClick={()=>del(t.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>)}
    </div>
  );
}
