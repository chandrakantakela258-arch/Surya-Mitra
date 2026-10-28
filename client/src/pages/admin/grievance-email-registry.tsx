import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit2, Save, X, Mail, Eye } from "lucide-react";

const CATEGORIES = [
  {v:"bank", label:"Bank / NBFC"},
  {v:"discom", label:"DISCOM"},
  {v:"vendor", label:"Vendor"},
  {v:"nodal", label:"Nodal Agency"},
  {v:"cpgram", label:"CPGRAM / Government"},
];

const ORGS: Record<string,string[]> = {
  bank: ["Paisalo Digital Limited","Solfin Sustainable Finance Private Limited","Metafin Cleantech Finance Private Limited","Ecofy Finance Private Limited","Annapurna Finance Private Limited","State Bank of India","Bank of India","Punjab National Bank","Canara Bank","Union Bank of India","HDFC Bank","ICICI Bank","Axis Bank","Bank of Baroda","Central Bank of India","Indian Bank","UCO Bank","Bank of Maharashtra","Indian Overseas Bank","Punjab & Sind Bank","Bihar Gramin Bank","Aryavart Bank","Prathama UP Gramin Bank","Jharkhand Rajya Gramin Bank","Bangiya Gramin Vikash Bank","Paschim Banga Gramin Bank","Rajasthan Marudhara Gramin Bank","Rajasthan Gramin Bank","Madhya Pradesh Gramin Bank","Maharashtra Gramin Bank","Tamil Nadu Grama Bank","Karnataka Grameena Bank","Bandhan Bank","City Union Bank","CSB Bank","Federal Bank","IDBI Bank","IndusInd Bank","Jammu & Kashmir Bank","Karnataka Bank","Karur Vysya Bank","Kotak Mahindra Bank","RBL Bank","South Indian Bank","Yes Bank","AU Small Finance Bank","Capital Small Finance Bank","Equitas Small Finance Bank","Suryoday Small Finance Bank","Ujjivan Small Finance Bank","Other"],
  discom: ["NBPDCL - North Bihar Power Distribution Company Limited","SBPDCL - South Bihar Power Distribution Company Limited","PVVNL - Paschimanchal Vidyut Vitran Nigam Limited (Western UP)","DVVNL - Dakshinanchal Vidyut Vitran Nigam Limited (Southern UP)","PUVVNL - Purvanchal Vidyut Vitran Nigam Limited (Eastern UP)","MVVNL - Madhyanchal Vidyut Vitran Nigam Limited (Central UP)","JBVNL - Jharkhand Bijli Vitran Nigam Limited","WBSEDCL - West Bengal State Electricity Distribution Company Limited","CESC - Calcutta Electric Supply Corporation Limited","JVVNL - Jaipur Vidyut Vitran Nigam Limited","AVVNL - Ajmer Vidyut Vitran Nigam Limited","JdVVNL - Jodhpur Vidyut Vitran Nigam Limited","MPEZ - MP Poorv Kshetra Vidyut Vitran Company Limited","MPPKVVCL - MP Paschim Kshetra Vidyut Vitran Company Limited","MPMKVVCL - MP Madhya Kshetra Vidyut Vitran Company Limited","MSEDCL - Maharashtra State Electricity Distribution Company Limited","BEST - Brihanmumbai Electric Supply and Transport","AEML - Adani Electricity Mumbai Limited","DGVCL - Dakshin Gujarat Vij Company Limited","MGVCL - Madhya Gujarat Vij Company Limited","PGVCL - Paschim Gujarat Vij Company Limited","UGVCL - Uttar Gujarat Vij Company Limited","BESCOM - Bangalore Electricity Supply Company Limited","HESCOM - Hubli Electricity Supply Company Limited","GESCOM - Gulbarga Electricity Supply Company Limited","MESCOM - Mangalore Electricity Supply Company Limited","CESC Karnataka - Chamundeshwari Electricity Supply Corporation Limited","TANGEDCO - Tamil Nadu Generation and Distribution Corporation Limited","KSEB - Kerala State Electricity Board Limited","APSPDCL - AP Southern Power Distribution Company Limited","APEPDCL - AP Eastern Power Distribution Company Limited","TSSPDCL - Telangana State Southern Power Distribution Company Limited","TSNPDCL - Telangana State Northern Power Distribution Company Limited","TPCODL - TP Central Odisha Distribution Limited","TPWODL - TP Western Odisha Distribution Limited","TPSODL - TP Southern Odisha Distribution Limited","TPNODL - TP Northern Odisha Distribution Limited","DHBVN - Dakshin Haryana Bijli Vitran Nigam Limited","UHBVN - Uttar Haryana Bijli Vitran Nigam Limited","PSPCL - Punjab State Power Corporation Limited","HPSEBL - Himachal Pradesh State Electricity Board Limited","UPCL - Uttarakhand Power Corporation Limited","BSES Rajdhani Power Limited - Delhi South & West","BSES Yamuna Power Limited - Delhi East","TPDDL - Tata Power Delhi Distribution Limited - Delhi North","CSPDCL - Chhattisgarh State Power Distribution Company Limited","APDCL - Assam Power Distribution Company Limited","Other - Not Listed"],
  vendor: [],
  nodal: ["MNRE (Ministry of New and Renewable Energy)","SECI","NTPC","State Nodal Agency Bihar","State Nodal Agency UP","Other"],
  cpgram: ["CPGRAM Portal","PM Surya Ghar Grievance Cell","Other"],
};

const DEFAULT_SUBJECTS: Record<string,string> = {
  bank: "Grievance Regarding Unnecessary Delay in Processing and Approval of Loan Application under PM Surya Ghar Scheme — {applicant_name} — {grievance_no}",
  discom: "Complaint Regarding Unnecessary Delay in Processing of Rooftop Solar Application under PM Surya Ghar Scheme — {applicant_name} — {grievance_no}",
  vendor: "Complaint Against Vendor Regarding Delay/Non-compliance in PM Surya Ghar Rooftop Solar Project — {applicant_name} — {grievance_no}",
  nodal: "PM Surya Ghar Grievance Escalation — {applicant_name} — {grievance_no}",
  cpgram: "PM Surya Ghar Scheme Grievance — {applicant_name} — {grievance_no}",
};

const DEFAULT_TEMPLATES: Record<string,string> = {
  bank: `To,
The Branch Manager / Nodal Officer
{org_name}
{branch_name}

Date: {date}

Subject: Grievance Regarding Unnecessary Delay in Processing and Approval of Loan Application

Respected Sir/Madam,

I, {applicant_name}, am writing to express my concern regarding the undue delay in processing and approving my loan application under the PM Surya Ghar Scheme.

Application Details:
- Applicant Name: {applicant_name}
- Mobile: {applicant_mobile}
- PM Surya Ghar Application No.: {pmsg_application_id}
- Jansamarth Reference No.: {jansamarth_ref}
- Consumer Number: {consumer_number}
- Bank Branch: {bank_branch}
- Branch Manager: {manager_name} ({manager_mobile})
- Field Staff: {field_staff_name} ({field_staff_mobile})
- Loan Amount Approved: Rs. {loan_amount}
- Plant Capacity: {plant_capacity}
- Filing Date: {pmsg_filing_date}
- Bank Visit Date: {bank_visit_date}
- Delay Period: {delay_tenure}
- Address: {address}, {block}, {district}, {state}

I request you to:
1. Provide the current status of my loan application immediately.
2. Inform me of any pending requirements.
3. Expedite the processing and approval.
4. Provide written explanation for the delay.

In case this remains unresolved, I will be compelled to escalate to RBI Ombudsman, MNRE, CPGRAM and PMO Grievance Portal.

Thanking you,
Yours faithfully,
{applicant_name}
Mobile: {applicant_mobile}
PM Surya Ghar App No.: {pmsg_application_id}
Address: {address}, {block}, {district}, {state}

Enclosures:
1. Copy of Loan Application
2. Acknowledgement Receipt
3. Digital Approval Document
4. RTS Site Feasibility Report`,

  discom: `To,
The Concerned Authority
{org_name}
{state}

Date: {date}

Subject: Complaint Regarding Unnecessary Delay in Processing of Rooftop Solar Application under PM Surya Ghar Scheme

Respected Sir/Madam,

I, {applicant_name}, resident of {address}, {block}, {district}, {state}, wish to lodge a grievance regarding the undue delay in processing of my rooftop solar project application under PM Surya Ghar Scheme.

Application Details:
- Applicant Name: {applicant_name}
- Mobile: {applicant_mobile}
- Consumer Account No.: {consumer_number}
- DISCOM: {discom}
- PM Surya Ghar Application No.: {pmsg_application_id}
- Jansamarth Reference: {jansamarth_ref}
- Plant Capacity Applied: {plant_capacity}
- Filing Date: {pmsg_filing_date}
- Delay Period: {delay_tenure}
- District: {district}, Block: {block}, State: {state}

I request your office to:
1. Review my application on priority.
2. Provide current status of the application.
3. Inform of any deficiency or pending requirement.
4. Expedite approval and processing at earliest.
5. Provide written explanation for delay since application date.

Thanking you,
Yours faithfully,
{applicant_name}
Mobile: {applicant_mobile}
CA Number: {consumer_number}
Address: {address}, {block}, {district}, {state}

Enclosures:
1. Copy of Application ({pmsg_application_id})
2. RTS Site Feasibility Report
3. Consumer Electricity Bill / CA Details
4. Digital Approval Document`,

  vendor: `To,
The Concerned Authority / State Nodal Agency

Date: {date}

Subject: Complaint Against Vendor Regarding Delay in PM Surya Ghar Rooftop Solar Project

Respected Sir/Madam,

I, {applicant_name}, wish to register a complaint against the vendor {vendor_name} regarding undue delay and non-compliance in completing my PM Surya Ghar rooftop solar installation.

Details:
- Applicant Name: {applicant_name}
- Mobile: {applicant_mobile}
- PM Surya Ghar Application No.: {pmsg_application_id}
- Vendor Name: {vendor_name}
- DISCOM: {discom}
- Plant Capacity: {plant_capacity}
- Filing Date: {pmsg_filing_date}
- Delay Period: {delay_tenure}
- Address: {address}, {block}, {district}, {state}

I request your office to:
1. Take strict action against the vendor for undue delay.
2. Direct the vendor to complete installation immediately.
3. Ensure quality installation as per MNRE guidelines.
4. Provide timeline for resolution.

Thanking you,
{applicant_name}
Mobile: {applicant_mobile}`,
};

const emptyForm = () => ({
  category: "bank", org_name: "", branch_name: "", state: "",
  to_email_1: "", to_email_2: "", to_email_3: "",
  to_name_1: "", to_name_2: "", to_name_3: "",
  cc_1: "", cc_2: "", cc_3: "", cc_4: "", cc_5: "", cc_6: "", cc_7: "", cc_8: "",
  email_subject: DEFAULT_SUBJECTS["bank"],
  email_template: DEFAULT_TEMPLATES["bank"],
  template_type: "bank", is_active: true,
  contact_person: "", designation: "",
});

export default function GrievanceEmailRegistry() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [form, setForm] = useState<any>(emptyForm());
  const [filter, setFilter] = useState("all");
  const [previewMode, setPreviewMode] = useState(false);
  const [orgSearch, setOrgSearch] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/grievance/emails").then(r=>r.json()).then(d=>{setEntries(Array.isArray(d)?d:[]);setLoading(false);});
  };
  useEffect(load, []);

  const set = (k:string, v:any) => setForm((p:any)=>({...p,[k]:v}));

  const onCategoryChange = (cat: string) => {
    set("category", cat);
    set("template_type", cat);
    set("email_subject", DEFAULT_SUBJECTS[cat] || "");
    set("email_template", DEFAULT_TEMPLATES[cat] || "");
  };

  const save = async () => {
    if (!form.to_email_1 || !form.org_name) { alert("Organization and at least one To email required"); return; }
    // Combine to emails and cc emails for backend
    const toEmails = [form.to_email_1, form.to_email_2, form.to_email_3].filter(Boolean);
    const ccEmails = [form.cc_1, form.cc_2, form.cc_3, form.cc_4, form.cc_5, form.cc_6, form.cc_7, form.cc_8].filter(Boolean);
    const payload = {
      ...form,
      email: form.to_email_1,
      contact_person: [form.to_name_1, form.to_name_2, form.to_name_3].filter(Boolean).join(", "),
      cc_emails: ccEmails.join(","),
      extra_to: [form.to_email_2, form.to_email_3].filter(Boolean).join(","),
    };
    const url = editId ? "/api/grievance/emails/"+editId : "/api/grievance/emails";
    const method = editId ? "PATCH" : "POST";
    const res = await fetch(url, {method, headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload)});
    if (res.ok) { setShowForm(false); setEditId(null); setForm(emptyForm()); load(); }
    else alert("Error saving");
  };

  const del = async (id:number) => {
    if (!confirm("Delete this email entry?")) return;
    await fetch("/api/grievance/emails/"+id, {method:"DELETE"});
    load();
  };

  const startEdit = (e:any) => {
    const toEmails = (e.extra_to||"").split(",").map((s:string)=>s.trim()).filter(Boolean);
    const ccList = (e.cc_emails||"").split(",").map((s:string)=>s.trim()).filter(Boolean);
    const contactNames = (e.contact_person||"").split(",").map((s:string)=>s.trim()).filter(Boolean);
    setForm({
      category: e.category||"bank",
      org_name: e.org_name||"",
      branch_name: e.branch_name||"",
      state: e.state||"",
      to_email_1: e.email||"",
      to_email_2: toEmails[0]||"",
      to_email_3: toEmails[1]||"",
      to_name_1: contactNames[0]||"",
      to_name_2: contactNames[1]||"",
      to_name_3: contactNames[2]||"",
      cc_1: ccList[0]||"",
      cc_2: ccList[1]||"",
      cc_3: ccList[2]||"",
      cc_4: ccList[3]||"",
      cc_5: ccList[4]||"",
      cc_6: ccList[5]||"",
      cc_7: ccList[6]||"",
      cc_8: ccList[7]||"",
      email_subject: e.email_subject||DEFAULT_SUBJECTS[e.category]||"",
      email_template: e.email_template||DEFAULT_TEMPLATES[e.category]||"",
      template_type: e.template_type||e.category,
      is_active: e.is_active!==false,
      contact_person: e.contact_person||"",
      designation: e.designation||"",
    });
    setEditId(e.id);
    setShowForm(true);
    setPreviewMode(false);
    window.scrollTo(0,0);
  };

  const filtered = filter==="all" ? entries : entries.filter(e=>e.category===filter);
  const catColor:Record<string,string> = {bank:"blue",discom:"yellow",vendor:"green",nodal:"purple",cpgram:"red"};

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Grievance Email Registry</h1>
          <p className="text-sm text-gray-500 mt-1">Manage To/CC email addresses and templates for each organization</p>
        </div>
        <Button onClick={()=>{setShowForm(true);setEditId(null);setForm(emptyForm());}} className="bg-orange-600 hover:bg-orange-700 text-white">
          <Plus className="w-4 h-4 mr-2" />Add Entry
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {[{v:"all",label:"All"},...CATEGORIES].map(c=>(
          <button key={c.v} onClick={()=>setFilter(c.v)}
            className={"px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all "+(filter===c.v?"border-orange-500 bg-orange-50 text-orange-700":"border-gray-200 bg-white text-gray-600")}>
            {c.label} ({c.v==="all"?entries.length:entries.filter(e=>e.category===c.v).length})
          </button>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
      <Card className="mb-6 border-2 border-orange-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-orange-700">{editId?"Edit":"Add"} Email Entry</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={()=>setPreviewMode(!previewMode)}>
                <Eye className="w-3 h-3 mr-1" />{previewMode?"Edit":"Preview"}
              </Button>
              <Button size="sm" variant="ghost" onClick={()=>{setShowForm(false);setEditId(null);}}><X className="w-4 h-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {!previewMode ? (<>
          {/* Organization Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-bold text-gray-600 uppercase">Category *</Label>
              <Select value={form.category} onValueChange={onCategoryChange}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c=><SelectItem key={c.v} value={c.v}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-bold text-gray-600 uppercase">Organization *</Label>
              {ORGS[form.category]?.length > 0 ? (
                <Select value={form.org_name} onValueChange={v=>set("org_name",v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select org" /></SelectTrigger>
                  <SelectContent className="max-h-80"><div className="sticky top-0 bg-white px-2 py-2 border-b z-10"><input className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md outline-none focus:border-orange-400" placeholder="🔍 Search DISCOM / Organization..." value={orgSearch} onChange={e=>setOrgSearch(e.target.value)} onKeyDown={e=>e.stopPropagation()} autoFocus /></div>{(ORGS[form.category]||[]).filter((o:string)=>o.toLowerCase().includes(orgSearch.toLowerCase())).map((o:string)=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              ) : <Input className="mt-1" value={form.org_name} onChange={e=>set("org_name",e.target.value)} placeholder="Organization name" />}
            </div>
            <div>
              <Label className="text-xs font-bold text-gray-600 uppercase">Branch / Office</Label>
              <Input className="mt-1" value={form.branch_name} onChange={e=>set("branch_name",e.target.value)} placeholder="Branch or Head Office" />
            </div>
          </div>

          {/* TO Emails */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2"><Mail className="w-4 h-4" />TO Email Addresses (Primary Recipients)</h3>
            <div className="space-y-2">
              {[1,2,3].map(n=>(
                <div key={n} className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-500">To Email {n} {n===1?"*":""}</Label>
                    <Input type="email" className="mt-0.5 h-8 text-sm" value={form["to_email_"+n]||""} onChange={e=>set("to_email_"+n,e.target.value)} placeholder={`email${n}@example.com`} />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Contact Name {n}</Label>
                    <Input className="mt-0.5 h-8 text-sm" value={form["to_name_"+n]||""} onChange={e=>set("to_name_"+n,e.target.value)} placeholder="Officer name / designation" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CC Emails */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h3 className="text-sm font-bold text-green-800 mb-3">CC Email Addresses (Copy Recipients)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {[1,2,3,4,5,6,7,8].map(n=>(
                <div key={n}>
                  <Label className="text-xs text-gray-500">CC {n}</Label>
                  <Input type="email" className="mt-0.5 h-8 text-sm" value={form["cc_"+n]||""} onChange={e=>set("cc_"+n,e.target.value)} placeholder={`cc${n}@example.com`} />
                </div>
              ))}
            </div>
          </div>

          {/* Email Subject */}
          <div>
            <Label className="text-xs font-bold text-gray-600 uppercase">Email Subject</Label>
            <Input className="mt-1" value={form.email_subject} onChange={e=>set("email_subject",e.target.value)} placeholder="Email subject line" />
            <p className="text-xs text-gray-400 mt-1">Variables: {"{applicant_name}"} {"{grievance_no}"} {"{org_name}"} {"{date}"}</p>
          </div>

          {/* Email Template */}
          <div>
            <Label className="text-xs font-bold text-gray-600 uppercase">Email Template</Label>
            <Textarea className="mt-1 font-mono text-xs" rows={20} value={form.email_template} onChange={e=>set("email_template",e.target.value)} placeholder="Email body template..." />
            <p className="text-xs text-gray-400 mt-1 leading-relaxed"><strong>Variables:</strong> {"{applicant_name}"} {"{applicant_mobile}"} {"{applicant_email}"} {"{consumer_number}"} {"{pmsg_application_id}"} {"{jansamarth_ref}"} {"{customer_bank_name}"} {"{customer_bank_account}"} {"{customer_bank_ifsc}"} {"{bank_name}"} {"{bank_branch}"} {"{bank_ifsc}"} {"{manager_name}"} {"{manager_mobile}"} {"{field_staff_name}"} {"{field_staff_mobile}"} {"{loan_amount}"} {"{plant_capacity}"} {"{pmsg_filing_date}"} {"{bank_visit_date}"} {"{delay_tenure}"} {"{discom}"} {"{vendor_name}"} {"{vendor_email}"} {"{address}"} {"{block}"} {"{district}"} {"{state}"} {"{date}"} {"{grievance_no}"} {"{org_name}"} {"{branch_name}"}</p>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_active} onChange={e=>set("is_active",e.target.checked)} className="w-4 h-4" id="active" />
            <Label htmlFor="active">Active</Label>
          </div>

          <div className="flex gap-3">
            <Button onClick={save} className="bg-orange-600 hover:bg-orange-700 text-white"><Save className="w-4 h-4 mr-2" />Save Entry</Button>
            <Button variant="outline" onClick={()=>{setShowForm(false);setEditId(null);}}>Cancel</Button>
          </div>
          </>) : (
          /* Preview Mode */
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-bold text-gray-700 mb-2">Subject Preview:</h3>
            <p className="text-sm bg-gray-50 p-2 rounded mb-4">{form.email_subject}</p>
            <h3 className="font-bold text-gray-700 mb-2">Email Body Preview:</h3>
            <pre className="text-xs bg-gray-50 p-3 rounded whitespace-pre-wrap font-mono">{form.email_template}</pre>
          </div>
          )}
        </CardContent>
      </Card>)}

      {/* Entries List */}
      {loading ? <p className="text-center text-gray-400 py-8">Loading...</p> : (
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl text-gray-400">
            No email entries found. Click "Add Entry" to create one.
          </div>
        )}
        {filtered.map((e:any) => {
          const ccList = (e.cc_emails||"").split(",").filter(Boolean);
          const extraTo = (e.extra_to||"").split(",").filter(Boolean);
          return (
          <Card key={e.id} className={"border-l-4 "+(e.is_active?"":"opacity-60")+" border-l-"+catColor[e.category]+"-400"}>
            <CardContent className="py-3 px-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={"text-xs font-bold px-2 py-0.5 rounded-full bg-"+catColor[e.category]+"-100 text-"+catColor[e.category]+"-700"}>
                      {CATEGORIES.find(c=>c.v===e.category)?.label}
                    </span>
                    <span className="font-semibold text-sm">{e.org_name}</span>
                    {e.branch_name && <span className="text-xs text-gray-400">— {e.branch_name}</span>}
                    {!e.is_active && <span className="text-xs text-red-500 font-bold">INACTIVE</span>}
                  </div>
                  <div className="mt-1.5 space-y-0.5">
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-blue-600 font-semibold">TO:</span>
                      <span className="text-blue-700 font-mono">{e.email}</span>
                      {extraTo.map((t:string,i:number)=><span key={i} className="text-blue-600 font-mono">, {t}</span>)}
                    </div>
                    {ccList.length > 0 && (
                      <div className="flex items-center gap-1 text-xs flex-wrap">
                        <span className="text-green-600 font-semibold">CC:</span>
                        {ccList.map((c:string,i:number)=><span key={i} className="text-green-600 font-mono">{i>0?", ":""}{c}</span>)}
                      </div>
                    )}
                    {e.email_subject && (
                      <div className="text-xs text-gray-500 truncate">
                        <span className="font-semibold">Subject:</span> {e.email_subject.substring(0,80)}...
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button size="sm" variant="outline" onClick={()=>startEdit(e)}><Edit2 className="w-3 h-3" /></Button>
                  <Button size="sm" variant="outline" className="text-red-500" onClick={()=>del(e.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )})}
      </div>)}
    </div>
  );
}
