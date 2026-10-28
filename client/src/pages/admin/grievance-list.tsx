import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Eye, Mail, X, RefreshCw, MailOpen, Bell } from "lucide-react";

const TYPE_LABEL: Record<string,string> = {bank:"Bank",discom:"DISCOM",vendor:"Vendor",pmsg:"General"};
const TYPE_COLOR: Record<string,string> = {bank:"blue",discom:"yellow",vendor:"green",pmsg:"orange"};

export default function GrievanceList() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [reminding, setReminding] = useState<number|null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/grievance/list")
      .then(r => r.json())
      .then(d => { setItems(Array.isArray(d) ? d : []); setLoading(false); });
  };
  useEffect(load, []);

  const resend = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setResending(id);
    try {
      const res = await fetch(`/api/grievance/${id}/resend`, {method:"POST"});
      const d = await res.json();
      alert(`Emails resent to ${d.emails_sent} recipients!`);
      load();
    } catch(err) { alert("Error resending"); }
    finally { setResending(null); }
  };

  const getEmailStatus = (g: any) => {
    if (g.email_open_count > 0) return {icon: <MailOpen className="w-3 h-3 text-blue-500" />, text: `Read (${g.email_open_count}x)`, color: "text-blue-600"};
    if (g.email_sent) return {icon: <CheckCircle className="w-3 h-3 text-green-500" />, text: "Sent", color: "text-green-600"};
    return {icon: <Clock className="w-3 h-3 text-gray-400" />, text: "Pending", color: "text-gray-400"};
  };

  const parsedEmails = (g: any) => {
    try { return JSON.parse(g.emails_sent_to || "[]"); } catch { return []; }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">PM Surya Ghar Grievances</h1>
          <p className="text-sm text-gray-500 mt-1">{items.length} total grievances</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4 mr-1" />Refresh</Button>
          <Button variant="outline" size="sm" onClick={() => window.location.href="/admin/grievance-emails"}>
            <Mail className="w-4 h-4 mr-1" />Email Registry
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {["bank","discom","vendor","pmsg"].map(t => (
          <Card key={t}>
            <CardContent className="pt-4 pb-3 text-center">
              <div className="text-2xl font-black text-gray-700">{items.filter(i=>i.grievance_type===t).length}</div>
              <div className="text-xs text-gray-500 mt-1">{TYPE_LABEL[t]}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Email Status Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-3 pb-3 text-center">
            <div className="text-xl font-black text-green-700">{items.filter(i=>i.email_sent).length}</div>
            <div className="text-xs text-green-600 flex items-center justify-center gap-1 mt-1"><CheckCircle className="w-3 h-3" />Emails Sent</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-3 pb-3 text-center">
            <div className="text-xl font-black text-blue-700">{items.filter(i=>i.email_open_count>0).length}</div>
            <div className="text-xs text-blue-600 flex items-center justify-center gap-1 mt-1"><MailOpen className="w-3 h-3" />Emails Read</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-3 pb-3 text-center">
            <div className="text-xl font-black text-orange-700">{items.filter(i=>!i.email_sent).length}</div>
            <div className="text-xs text-orange-600 flex items-center justify-center gap-1 mt-1"><Clock className="w-3 h-3" />Pending</div>
          </CardContent>
        </Card>
      </div>

      {loading ? <p className="text-center text-gray-400 py-12">Loading...</p> : (
        <div className="space-y-2">
          {items.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-xl text-gray-400">No grievances submitted yet.</div>
          )}
          {items.map((g: any) => {
            const status = getEmailStatus(g);
            const emails = parsedEmails(g);
            return (
            <Card key={g.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelected(g)}>
              <CardContent className="py-3 flex items-center gap-3">
                <span className={"text-xs font-bold px-2 py-1 rounded-full shrink-0 bg-"+TYPE_COLOR[g.grievance_type]+"-100 text-"+TYPE_COLOR[g.grievance_type]+"-700"}>
                  {TYPE_LABEL[g.grievance_type]||g.grievance_type}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{g.applicant_name}</span>
                    <span className="text-xs text-gray-400 font-mono">{g.grievance_no}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {[g.bank_name||g.discom||g.vendor_name, g.district, g.state].filter(Boolean).join(" | ")}
                  </div>
                  {emails.length > 0 && (
                    <div className="text-xs text-gray-400 mt-0.5 truncate">
                      Sent to: {emails.join(", ")}
                    </div>
                  )}
                  {g.reminder_count > 0 && (
                    <div className="text-xs text-orange-600 font-semibold mt-0.5">
                      Reminders sent: {g.reminder_count} {g.last_reminder_at ? "| Last: " + new Date(g.last_reminder_at).toLocaleDateString("en-IN") : ""}
                    </div>
                  )}
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <div className={"flex items-center gap-1 text-xs "+status.color}>
                    {status.icon}<span>{status.text}</span>
                  </div>
                  {g.email_open_count > 0 && g.email_opened_at && (
                    <div className="text-xs text-blue-500">
                      Read: {new Date(g.email_opened_at).toLocaleString("en-IN")}
                    </div>
                  )}
                  <div className="text-xs text-gray-400">{new Date(g.created_at).toLocaleDateString("en-IN")}</div>
                </div>
                <Button size="sm" variant="outline" className="shrink-0 h-7 px-2"
                  onClick={(e) => sendReminder(g.id, e)}
                  disabled={reminding === g.id}>
                  {reminding === g.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
                </Button>
                <Eye className="w-4 h-4 text-gray-400 shrink-0" />
              </CardContent>
            </Card>
          )})}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <CardHeader className="sticky top-0 bg-white border-b z-10 pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span>{selected.grievance_no}</span>
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => sendReminder(selected.id, {stopPropagation:()=>{}} as any)}>
                    <Bell className="w-3 h-3 mr-1" />Send Reminder
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelected(null)}><X className="w-4 h-4" /></Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {/* Email Status Card */}
              <div className={"rounded-xl p-4 mb-4 "+(selected.email_open_count>0?"bg-blue-50 border border-blue-200":"bg-green-50 border border-green-200")}>
                <h3 className="font-bold text-sm mb-2">📧 Email Status</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Sent:</span> <span className="font-semibold">{selected.email_sent?"Yes":"No"}</span></div>
                  <div><span className="text-gray-500">Open Count:</span> <span className="font-bold text-blue-700">{selected.email_open_count||0}</span></div>
                  {selected.email_opened_at && <div className="col-span-2"><span className="text-gray-500">Last Opened:</span> <span className="font-semibold text-blue-700">{new Date(selected.email_opened_at).toLocaleString("en-IN")}</span></div>}
                  {selected.email_opened_by && <div className="col-span-2"><span className="text-gray-500">Opened By:</span> <span className="font-semibold text-blue-700 text-xs">{selected.email_opened_by}</span></div>}
                  <div className="col-span-2"><span className="text-gray-500">Sent To:</span> <span className="text-xs text-gray-700">{parsedEmails(selected).join(", ")||"None"}</span></div>
                </div>
              </div>

              {/* Applicant Details */}
              <div className="space-y-2 text-sm">
                {[
                  ["Applicant","applicant_name"],["Mobile","applicant_mobile"],["Email","applicant_email"],
                  ["Consumer No","consumer_number"],["App ID","pmsg_application_id"],["Jansamarth Ref","jansamarth_ref"],
                  ["Bank","bank_name"],["Branch","bank_branch"],["Manager","manager_name"],["Manager Mobile","manager_mobile"],
                  ["Field Staff","field_staff_name"],["Field Mobile","field_staff_mobile"],
                  ["DISCOM","discom"],["Vendor","vendor_name"],["State","state"],["District","district"],["Block","block"],
                  ["Address","address"],["Plant Capacity","plant_capacity"],["Loan Amount","loan_amount"],
                  ["Delay","delay_tenure"],["Reminders Sent","reminder_count"],["Last Reminder","last_reminder_at"],["Filing Date","pmsg_filing_date"],["Bank Visit","bank_visit_date"],
                  ["Amount Disbursed","amount_disbursed"],["Disbursement Date","disbursement_date"],
                  ["Email Open Count","email_open_count"],["Email Opened By","email_opened_by"],
                  ["Email Opened At","email_opened_at"],["Delivery Confirmed","delivery_confirmed"],
                ].map(([label, key]) => {
                  const val = (selected as any)[key];
                  if (val === null || val === undefined || val === "") return null;
                  return (
                    <div key={key} className="flex gap-3 border-b border-gray-100 pb-1.5">
                      <span className="font-semibold text-gray-500 w-36 shrink-0 text-xs">{label}</span>
                      <span className="text-gray-800 text-xs">{key==="email_opened_at" && val ? new Date(val).toLocaleString("en-IN") : key==="delivery_confirmed" ? (val?"Yes":"No") : String(val)}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
