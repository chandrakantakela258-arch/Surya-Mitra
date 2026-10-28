import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle, FileText, Upload } from "lucide-react";

const GRIEVANCE_TYPES = [
  { value: "bank", label: "PM Surya Ghar Bank Grievance" },
  { value: "discom", label: "PM Surya Ghar Discom Grievance" },
  { value: "vendor", label: "PM Surya Ghar Vendor Complaint" },
  { value: "pmsg", label: "PM Surya Ghar General Grievance" },
];
const DISCOMS = ["NBPDCL - North Bihar Power Distribution Company Limited","SBPDCL - South Bihar Power Distribution Company Limited","PVVNL - Paschimanchal Vidyut Vitran Nigam Limited (Western UP)","DVVNL - Dakshinanchal Vidyut Vitran Nigam Limited (Southern UP)","PUVVNL - Purvanchal Vidyut Vitran Nigam Limited (Eastern UP)","MVVNL - Madhyanchal Vidyut Vitran Nigam Limited (Central UP)","JBVNL - Jharkhand Bijli Vitran Nigam Limited","WBSEDCL - West Bengal State Electricity Distribution Company Limited","CESC - Calcutta Electric Supply Corporation Limited","JVVNL - Jaipur Vidyut Vitran Nigam Limited","AVVNL - Ajmer Vidyut Vitran Nigam Limited","JdVVNL - Jodhpur Vidyut Vitran Nigam Limited","MPEZ - MP Poorv Kshetra Vidyut Vitran Company Limited (East MP)","MPPKVVCL - MP Paschim Kshetra Vidyut Vitran Company Limited (West MP)","MPMKVVCL - MP Madhya Kshetra Vidyut Vitran Company Limited (Central MP)","MSEDCL - Maharashtra State Electricity Distribution Company Limited","BEST - Brihanmumbai Electric Supply and Transport","AEML - Adani Electricity Mumbai Limited","DGVCL - Dakshin Gujarat Vij Company Limited","MGVCL - Madhya Gujarat Vij Company Limited","PGVCL - Paschim Gujarat Vij Company Limited","UGVCL - Uttar Gujarat Vij Company Limited","BESCOM - Bangalore Electricity Supply Company Limited","HESCOM - Hubli Electricity Supply Company Limited","GESCOM - Gulbarga Electricity Supply Company Limited","MESCOM - Mangalore Electricity Supply Company Limited","CESC Karnataka - Chamundeshwari Electricity Supply Corporation Limited","TANGEDCO - Tamil Nadu Generation and Distribution Corporation Limited","KSEB - Kerala State Electricity Board Limited","APSPDCL - AP Southern Power Distribution Company Limited","APEPDCL - AP Eastern Power Distribution Company Limited","TSSPDCL - Telangana State Southern Power Distribution Company Limited","TSNPDCL - Telangana State Northern Power Distribution Company Limited","TPCODL - TP Central Odisha Distribution Limited","TPWODL - TP Western Odisha Distribution Limited","TPSODL - TP Southern Odisha Distribution Limited","TPNODL - TP Northern Odisha Distribution Limited","DHBVN - Dakshin Haryana Bijli Vitran Nigam Limited","UHBVN - Uttar Haryana Bijli Vitran Nigam Limited","PSPCL - Punjab State Power Corporation Limited","HPSEBL - Himachal Pradesh State Electricity Board Limited","UPCL - Uttarakhand Power Corporation Limited","BSES Rajdhani Power Limited - Delhi South & West","BSES Yamuna Power Limited - Delhi East","TPDDL - Tata Power Delhi Distribution Limited - Delhi North","CSPDCL - Chhattisgarh State Power Distribution Company Limited","APDCL - Assam Power Distribution Company Limited","Other - Not Listed"];
const BANKS = ["Paisalo Digital Limited","Solfin Sustainable Finance Private Limited","Metafin Cleantech Finance Private Limited","Ecofy Finance Private Limited","Annapurna Finance Private Limited","State Bank of India","Bank of India","Punjab National Bank","Canara Bank","Union Bank of India","HDFC Bank","ICICI Bank","Axis Bank","Bank of Baroda","Central Bank of India","Indian Bank","UCO Bank","Bank of Maharashtra","Indian Overseas Bank","Punjab & Sind Bank","Bihar Gramin Bank","Aryavart Bank","Prathama UP Gramin Bank","Jharkhand Rajya Gramin Bank","Bangiya Gramin Vikash Bank","Paschim Banga Gramin Bank","Rajasthan Marudhara Gramin Bank","Rajasthan Gramin Bank","Madhya Pradesh Gramin Bank","Maharashtra Gramin Bank","Tamil Nadu Grama Bank","Karnataka Grameena Bank","Bandhan Bank","City Union Bank","CSB Bank","Federal Bank","IDBI Bank","IndusInd Bank","Jammu & Kashmir Bank","Karnataka Bank","Karur Vysya Bank","Kotak Mahindra Bank","RBL Bank","South Indian Bank","Yes Bank","AU Small Finance Bank","Capital Small Finance Bank","Equitas Small Finance Bank","Suryoday Small Finance Bank","Ujjivan Small Finance Bank","Other"];
const DELAY_TENURES = ["Less than 30 days","30-60 days","60-90 days","90-120 days","More than 120 days","More than 6 months"];
const STATES = ["Andhra Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Odisha","Punjab","Rajasthan","Tamil Nadu","Telangana","Uttar Pradesh","Uttarakhand","West Bengal"];

export default function GrievanceForm() {
  const [gType, setGType] = useState("");
  const [form, setForm] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<any>(null);
  const [matchedEmails, setMatchedEmails] = useState<any[]>([]);

  const set = (k: string, v: any) => setForm((p: any) => ({...p, [k]: v}));
  const [discomSearch, setDiscomSearch] = useState("");

  useEffect(() => {
    const org = form.bank_name || form.discom || form.vendor_name;
    const cat = form.bank_name ? "bank" : form.discom ? "discom" : form.vendor_name ? "vendor" : null;
    if (!org || !cat) { setMatchedEmails([]); return; }
    fetch("/api/grievance/emails/lookup?category=" + cat + "&org_name=" + encodeURIComponent(org))
      .then(r => r.json()).then(setMatchedEmails).catch(() => setMatchedEmails([]));
  }, [form.bank_name, form.discom, form.vendor_name]);

  const handleSubmit = async () => {
    if (!form.applicant_name) { alert("Applicant name required"); return; }
    if (!gType) { alert("Please select grievance type"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/grievance/submit", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({...form, grievance_type: gType})
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setSubmitted(d);
    } catch(e: any) { alert("Error: " + e.message); }
    finally { setSubmitting(false); }
  };

  if (submitted) return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full border-green-300">
        <CardContent className="pt-8 text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold text-green-700">Grievance Submitted!</h2>
          <div className="bg-green-100 rounded-xl p-4">
            <p className="text-sm text-green-800 font-semibold">Grievance Number</p>
            <p className="text-2xl font-black text-green-700">{submitted.grievance_no}</p>
          </div>
          <p className="text-sm text-gray-600">Your grievance has been recorded. Complaint emails will be sent to the concerned authorities.</p>
          <Button onClick={() => { setSubmitted(null); setForm({}); setGType(""); }} className="bg-green-600 hover:bg-green-700 text-white">Submit Another</Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8" />
            <h1 className="text-2xl font-black">PM Surya Ghar Grievance Portal</h1>
          </div>
          <p className="text-orange-100 text-sm">Submit your complaint regarding Bank, DISCOM, or Vendor delays</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto p-4 space-y-6 py-8">
        <Card className="border-2 border-orange-200">
          <CardHeader><CardTitle className="text-orange-700">Select Grievance Type</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GRIEVANCE_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => setGType(t.value)}
                  className={"p-4 rounded-xl border-2 text-left transition-all font-semibold " + (gType===t.value ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-200 bg-white text-gray-600 hover:border-orange-300")}>
                  {t.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {gType && (<>
          <Card>
            <CardHeader><CardTitle>Applicant Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Applicant Name *</Label><Input value={form.applicant_name||""} onChange={e=>set("applicant_name",e.target.value)} placeholder="Full name" /></div>
              <div><Label>Mobile (Registered on PM Surya Ghar)</Label><Input value={form.applicant_mobile||""} onChange={e=>set("applicant_mobile",e.target.value)} /></div>
              <div><Label>Email (Registered on PM Surya Ghar)</Label><Input value={form.applicant_email||""} onChange={e=>set("applicant_email",e.target.value)} /></div>
              <div><Label>Electricity Consumer Number</Label><Input value={form.consumer_number||""} onChange={e=>set("consumer_number",e.target.value)} /></div>
              <div><Label>PM Surya Ghar Application ID</Label><Input value={form.pmsg_application_id||""} onChange={e=>set("pmsg_application_id",e.target.value)} /></div>
              <div><Label>Jansamarth Loan Reference Number</Label><Input value={form.jansamarth_ref||""} onChange={e=>set("jansamarth_ref",e.target.value)} /></div>
              <div><Label>Customer Bank Name</Label><Input value={form.customer_bank_name||""} onChange={e=>set("customer_bank_name",e.target.value)} placeholder="Your bank where subsidy credited" /></div>
              <div><Label>Customer Bank Account Number</Label><Input value={form.customer_bank_account||""} onChange={e=>set("customer_bank_account",e.target.value)} placeholder="Account number for subsidy" /></div>
              <div><Label>Customer Bank IFSC Code</Label><Input value={form.customer_bank_ifsc||""} onChange={e=>set("customer_bank_ifsc",e.target.value.toUpperCase())} placeholder="e.g. SBIN0001234" className="uppercase" /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Location Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>State</Label>
                <Select value={form.state||""} onValueChange={v=>set("state",v)}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>{STATES.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>District</Label><Input value={form.district||""} onChange={e=>set("district",e.target.value)} /></div>
              <div><Label>Block / Tehsil</Label><Input value={form.block||""} onChange={e=>set("block",e.target.value)} /></div>
              <div className="sm:col-span-2"><Label>Full Address</Label><Textarea rows={2} value={form.address||""} onChange={e=>set("address",e.target.value)} /></div>
            </CardContent>
          </Card>

          {(gType==="discom"||gType==="pmsg") && (
          <Card>
            <CardHeader><CardTitle>DISCOM Details</CardTitle></CardHeader>
            <CardContent>
              <Label>DISCOM</Label>
              <Select value={form.discom||""} onValueChange={v=>set("discom",v)}>
                <SelectTrigger><SelectValue placeholder="Select DISCOM" /></SelectTrigger>
                <SelectContent><><div className="sticky top-0 bg-white px-2 py-2 border-b z-10"><input className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md outline-none focus:border-orange-400" placeholder="🔍 Search DISCOM..." value={discomSearch} onChange={e=>setDiscomSearch(e.target.value)} onKeyDown={e=>e.stopPropagation()} /></div>{DISCOMS.filter(d=>d.toLowerCase().includes(discomSearch.toLowerCase())).map(d=><SelectItem key={d} value={d}>{d}</SelectItem>)}</></SelectContent>
              </Select>
            </CardContent>
          </Card>)}

          {(gType==="bank"||gType==="pmsg") && (
          <Card>
            <CardHeader><CardTitle>Bank / NBFC Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>DISCOM</Label>
                <Select value={form.discom||""} onValueChange={v=>set("discom",v)}>
                  <SelectTrigger><SelectValue placeholder="Select DISCOM" /></SelectTrigger>
                  <SelectContent><><div className="sticky top-0 bg-white px-2 py-2 border-b z-10"><input className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md outline-none focus:border-orange-400" placeholder="🔍 Search DISCOM..." value={discomSearch} onChange={e=>setDiscomSearch(e.target.value)} onKeyDown={e=>e.stopPropagation()} /></div>{DISCOMS.filter(d=>d.toLowerCase().includes(discomSearch.toLowerCase())).map(d=><SelectItem key={d} value={d}>{d}</SelectItem>)}</></SelectContent>
                </Select>
              </div>
              <div><Label>Bank / NBFC Name</Label>
                <Select value={form.bank_name||""} onValueChange={v=>set("bank_name",v)}>
                  <SelectTrigger><SelectValue placeholder="Select bank" /></SelectTrigger>
                  <SelectContent>{BANKS.map(b=><SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Bank Branch Name</Label><Input value={form.bank_branch||""} onChange={e=>set("bank_branch",e.target.value)} /></div>
              <div><Label>Vendor Name</Label><Input value={form.vendor_name||""} onChange={e=>set("vendor_name",e.target.value)} placeholder="Your solar vendor/installer" /></div>
              <div><Label>Vendor Email ID</Label><Input type="email" value={form.vendor_email||""} onChange={e=>set("vendor_email",e.target.value)} placeholder="vendor@email.com" /></div>
              <div><Label>Bank IFSC Code</Label><Input value={form.bank_ifsc||""} onChange={e=>set("bank_ifsc",e.target.value.toUpperCase())} placeholder="e.g. SBIN0001234" maxLength={11} className="uppercase" /></div>
              <div><Label>Manager Name</Label><Input value={form.manager_name||""} onChange={e=>set("manager_name",e.target.value)} /></div>
              <div><Label>Manager Mobile</Label><Input value={form.manager_mobile||""} onChange={e=>set("manager_mobile",e.target.value)} /></div>
              <div><Label>Bank Field Staff Name</Label><Input value={form.field_staff_name||""} onChange={e=>set("field_staff_name",e.target.value)} /></div>
              <div><Label>Bank Field Staff Mobile</Label><Input value={form.field_staff_mobile||""} onChange={e=>set("field_staff_mobile",e.target.value)} /></div>
              <div><Label>Date of PM Surya Ghar Filing</Label><Input type="date" value={form.pmsg_filing_date||""} onChange={e=>set("pmsg_filing_date",e.target.value)} /></div>
              <div><Label>Date of Bank Field Staff Visit</Label><Input type="date" value={form.bank_visit_date||""} onChange={e=>set("bank_visit_date",e.target.value)} /></div>
              <div><Label>Loan Amount Approved (Rs.)</Label><Input type="number" value={form.loan_amount||""} onChange={e=>set("loan_amount",e.target.value)} /></div>
              <div><Label>Plant Capacity Applied (kW)</Label><Input value={form.plant_capacity||""} onChange={e=>set("plant_capacity",e.target.value)} /></div>
              <div><Label>Roof Space Available (sq ft)</Label><Input value={form.roof_space||""} onChange={e=>set("roof_space",e.target.value)} /></div>
              <div><Label>Delay Tenure</Label>
                <Select value={form.delay_tenure||""} onValueChange={v=>set("delay_tenure",v)}>
                  <SelectTrigger><SelectValue placeholder="Select delay" /></SelectTrigger>
                  <SelectContent>{DELAY_TENURES.map(d=><SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>)}

          {(gType==="vendor"||gType==="pmsg") && (
          <Card>
            <CardHeader><CardTitle>Vendor Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Vendor Name</Label><Input value={form.vendor_name||""} onChange={e=>set("vendor_name",e.target.value)} placeholder="Solar vendor/installer name" /></div>
              <div><Label>Vendor Email ID</Label><Input type="email" value={form.vendor_email||""} onChange={e=>set("vendor_email",e.target.value)} placeholder="vendor@email.com" /></div>
              <div><Label>DISCOM</Label>
                <Select value={form.discom||""} onValueChange={v=>set("discom",v)}>
                  <SelectTrigger><SelectValue placeholder="Select DISCOM" /></SelectTrigger>
                  <SelectContent><><div className="sticky top-0 bg-white px-2 py-2 border-b z-10"><input className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md outline-none focus:border-orange-400" placeholder="🔍 Search DISCOM..." value={discomSearch} onChange={e=>setDiscomSearch(e.target.value)} onKeyDown={e=>e.stopPropagation()} /></div>{DISCOMS.filter(d=>d.toLowerCase().includes(discomSearch.toLowerCase())).map(d=><SelectItem key={d} value={d}>{d}</SelectItem>)}</></SelectContent>
                </Select>
              </div>
              <div><Label>Bank / NBFC Name</Label>
                <Select value={form.bank_name||""} onValueChange={v=>set("bank_name",v)}>
                  <SelectTrigger><SelectValue placeholder="Select bank" /></SelectTrigger>
                  <SelectContent>{BANKS.map(b=><SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Loan Amount Approved (Rs.)</Label><Input type="number" value={form.loan_amount||""} onChange={e=>set("loan_amount",e.target.value)} /></div>
              <div><Label>Amount Disbursed (Rs.)</Label><Input type="number" value={form.amount_disbursed||""} onChange={e=>set("amount_disbursed",e.target.value)} placeholder="Amount actually disbursed" /></div>
              <div><Label>Date of Disbursement</Label><Input type="date" value={form.disbursement_date||""} onChange={e=>set("disbursement_date",e.target.value)} /></div>
              <div><Label>Plant Capacity Applied (kW)</Label><Input value={form.plant_capacity||""} onChange={e=>set("plant_capacity",e.target.value)} /></div>
              <div><Label>PM Surya Ghar Filing Date</Label><Input type="date" value={form.pmsg_filing_date||""} onChange={e=>set("pmsg_filing_date",e.target.value)} /></div>
              <div><Label>Delay Tenure</Label>
                <Select value={form.delay_tenure||""} onValueChange={v=>set("delay_tenure",v)}>
                  <SelectTrigger><SelectValue placeholder="Select delay" /></SelectTrigger>
                  <SelectContent>{DELAY_TENURES.map(d=><SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2"><Label>Full Address</Label><Textarea rows={2} value={form.address||""} onChange={e=>set("address",e.target.value)} /></div>
            </CardContent>
          </Card>)}

          <Card>
            <CardHeader><CardTitle>Documents Upload</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {["Digital Approval Document","RTS Site Feasibility Report for Bank","Acknowledgement for Submission of Rooftop Solar Application"].map(doc => (
                <div key={doc} className="flex items-center gap-3 p-3 border border-dashed border-gray-300 rounded-lg">
                  <Upload className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-600 flex-1">{doc}</span>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="text-xs" />
                </div>
              ))}
            </CardContent>
          </Card>

          {matchedEmails.length > 0 && (
          <Card className="border-2 border-green-400 bg-gradient-to-br from-green-50 to-blue-50 shadow-md">
            <CardHeader className="pb-2 border-b border-green-200">
              <CardTitle className="text-green-700 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Complaint emails will be auto-sent to these registered IDs:
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2">
              {matchedEmails.map((e:any, idx:number) => {
                const toEmails = [e.email, ...(e.extra_to||"").split(",").filter(Boolean)];
                const ccEmails = (e.cc_emails||"").split(",").filter(Boolean);
                return (
                <div key={e.id} className="rounded-xl border-2 border-green-300 bg-white p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-black bg-green-600 text-white px-2 py-0.5 rounded-full">{e.org_name}</span>
                    {e.branch_name && <span className="text-xs text-gray-500">{e.branch_name}</span>}
                  </div>
                  <div className="space-y-1.5">
                    {toEmails.filter(Boolean).map((email:string, i:number) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded shrink-0">TO</span>
                        <span className="text-sm font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{email.trim()}</span>
                      </div>
                    ))}
                    {ccEmails.filter(Boolean).map((email:string, i:number) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs font-bold bg-gray-500 text-white px-1.5 py-0.5 rounded shrink-0">CC</span>
                        <span className="text-sm text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">{email.trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )})}
              <p className="text-xs text-green-700 font-semibold text-center mt-2">
                ✅ {matchedEmails.reduce((n,e)=>n+1+(e.extra_to||"").split(",").filter(Boolean).length, 0)} TO + {matchedEmails.reduce((n,e)=>n+(e.cc_emails||"").split(",").filter(Boolean).length, 0)} CC recipients will be notified
              </p>
            </CardContent>
          </Card>)}

          {matchedEmails.length === 0 && (form.bank_name || form.discom || form.vendor_name) && (
          <div className="flex items-center gap-2 text-amber-700 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
            <AlertCircle className="w-4 h-4" />
            <span>No email IDs registered for this organization. Admin needs to add emails in the registry.</span>
          </div>)}

          <Button onClick={handleSubmit} disabled={submitting}
            className="w-full h-12 text-base font-bold bg-orange-600 hover:bg-orange-700 text-white">
            {submitting ? "Submitting..." : "Submit Grievance"}
          </Button>
        </>)}
      </div>
    </div>
  );
}