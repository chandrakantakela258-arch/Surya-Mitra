import { useState, useEffect } from "react";
import { useRoute } from "wouter";

const W: any = { minHeight: "100vh", background: "#f1f5fb", padding: 16, fontFamily: "system-ui, sans-serif" };
const CARD: any = { background: "#fff", borderRadius: 14, padding: 16, boxShadow: "0 2px 12px rgba(10,42,105,.08)", marginBottom: 14 };

const STAGES: { k: string; hi: string }[] = [
  { k: "logged_in", hi: "PM सूर्य घर पोर्टल पर लॉगिन हुआ" },
  { k: "loan_processed", hi: "लोन प्रोसेस हुआ" },
  { k: "loan_disbursed", hi: "लोन डिस्बर्स हुआ" },
  { k: "installed", hi: "प्लांट लग गया" },
  { k: "subsidy_received", hi: "सब्सिडी मिल गई" },
];
const stageHi = (k: string | null) => STAGES.find(s => s.k === k)?.hi || "";
const stageIdx = (k: string | null) => STAGES.findIndex(s => s.k === k);

export default function ShopDashboard() {
  const [, params] = useRoute("/shop/:token");
  const token = (params as any)?.token || "";
  const [data, setData] = useState<any>(null);
  const [bad, setBad] = useState("");
  const [copied, setCopied] = useState(false);

  function load() {
    fetch("/api/public/shop/" + token).then(async r => {
      const d = await r.json();
      if (!r.ok) { setBad(d.error || "Not found"); return; }
      setData(d);
    }).catch(() => setBad("Dashboard खोलने में समस्या हुई"));
  }
  useEffect(() => { if (token) load(); }, [token]);

  const d = (s: string) => s ? new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—";

  if (bad) return <div style={W}><div style={{ maxWidth: 560, margin: "40px auto", ...CARD, textAlign: "center" }}>
    <h3 style={{ color: "#0a2a69" }}>लिंक मान्य नहीं है</h3><p style={{ color: "#6b7a99" }}>{bad}</p></div></div>;
  if (!data) return <div style={W}><div style={{ maxWidth: 560, margin: "40px auto", ...CARD, textAlign: "center", color: "#6b7a99" }}>लोड हो रहा है…</div></div>;

  const cs = data.customers || [];
  const shopLink = window.location.origin + "/s/" + data.shop.token;
  const remindMsg = (nm: string | null) =>
    "नमस्ते" + (nm ? " " + nm : "") + " जी,\n\nPM सूर्य घर योजना में सोलर सब्सिडी सीमित अवधि और सीमित लक्ष्य तक ही उपलब्ध है — " +
    "आवेदन जल्दी करने पर प्रक्रिया आसान रहती है।\n\nआवेदन में सहायता के लिए संपर्क करें:\nसंजय कुमार — 8777684575\n\n" +
    "— " + data.shop.name + " · Divyanshi Solar";
  const shareMsg = "नमस्ते! Divyanshi Solar — सूर्य ऊर्जा क्रांति\n\nPM सूर्य घर योजना में सोलर प्लांट लगवाने के लिए अपनी जानकारी इस लिंक पर भरें:\n" + shopLink + "\n\nफ्री सोलर बचत जांच · सब्सिडी · आसान EMI\n— " + data.shop.name;
  const filled = cs.filter((c: any) => c.status === "filled").length;

  return (
    <div style={W}><div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ textAlign: "center", padding: "14px 0 10px" }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: "#0a2a69", letterSpacing: 1 }}>DIVYANSHI SOLAR</div>
        <div style={{ fontSize: 12, color: "#c0392b", fontWeight: 700 }}>Shop Partner Dashboard</div>
      </div>

      <div style={{ ...CARD, textAlign: "center" }}>
        <div style={{ fontSize: 19, fontWeight: 900, color: "#17243d" }}>{data.shop.name}</div>
        <div style={{ fontSize: 13, color: "#6b7a99" }}>{data.shop.owner}</div>
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          {[{ l: "कुल Customer", v: cs.length }, { l: "जानकारी भरी", v: filled },
            { l: "बाकी", v: cs.length - filled }].map((x, i) => (
            <div key={i} style={{ flex: 1, background: "#f1f5fb", borderRadius: 10, padding: "10px 6px" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#0a2a69" }}>{x.v}</div>
              <div style={{ fontSize: 11, color: "#6b7a99" }}>{x.l}</div>
            </div>
          ))}
        </div>
        <a href="/solar" style={{ display: "block", marginTop: 14, padding: "13px 16px", borderRadius: 11,
           background: "#E8600F", color: "#fff", fontWeight: 800, fontSize: 15, textDecoration: "none" }}>
          + नया Customer जोड़ें
        </a>
      </div>

      <div style={CARD}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#c0392b", letterSpacing: 1, marginBottom: 6 }}>
          आपका Shop लिंक — सबको भेजें
        </div>
        <p style={{ color: "#6b7a99", fontSize: 13, margin: "0 0 10px" }}>
          यह एक लिंक अपने दोस्तों, रिश्तेदारों और ग्राहकों को भेजें। जो भी फॉर्म भरेगा, वह आपके नाम से यहीं दिखेगा।
        </p>
        <div style={{ padding: 11, background: "#f1f5fb", borderRadius: 9, fontSize: 12, color: "#44506b",
                      wordBreak: "break-all", marginBottom: 10 }}>{shopLink}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <a href={"https://wa.me/?text=" + encodeURIComponent(shareMsg)} target="_blank" rel="noreferrer"
             style={{ flex: 1, textAlign: "center", padding: "12px 10px", borderRadius: 10, background: "#1f7a3d",
                      color: "#fff", fontWeight: 800, fontSize: 14, textDecoration: "none" }}>
            WhatsApp पर भेजें
          </a>
          <button onClick={() => { navigator.clipboard?.writeText(shopLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
             style={{ flex: "0 0 38%", padding: "12px 10px", borderRadius: 10, background: "#fff", color: "#0a2a69",
                      border: "2px solid #0a2a69", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
            {copied ? "✓ Copy हुआ" : "Link Copy करें"}
          </button>
        </div>
      </div>

      {cs.length === 0 && <div style={{ ...CARD, textAlign: "center", color: "#8a97b1", fontSize: 14 }}>
        अभी कोई customer नहीं जोड़ा गया</div>}

      {cs.map((c: any) => {
        const link = window.location.origin + "/c/" + c.token;
        const msg = "नमस्ते! Divyanshi Solar — Surya Urja Kranti\n\nPM सूर्य घर सोलर प्लांट के लिए अपनी जानकारी इस लिंक पर भरें:\n" + link;
        const ok = c.status === "filled";
        return (
          <div key={c.token} style={CARD}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div>
                <div style={{ fontWeight: 800, color: "#17243d", fontSize: 16 }}>{c.customer_name || "नाम बाकी"}</div>
                <div style={{ fontSize: 13, color: "#6b7a99" }}>{c.customer_phone}</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, padding: "5px 9px", borderRadius: 20, whiteSpace: "nowrap",
                            background: ok ? "#e6f6ec" : "#fff4e5", color: ok ? "#1f7a3d" : "#b4552a", height: 22 }}>
                {ok ? "✓ जानकारी भरी" : "⏳ बाकी"}
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#8a97b1", marginTop: 6 }}>
              जोड़ा: {d(c.created_at)}{ok && c.filled_at ? " · भरा: " + d(c.filled_at) : ""}
            </div>
            {ok && (
              <div style={{ fontSize: 13, color: "#44506b", marginTop: 8, lineHeight: 1.5 }}>
                {c.consumer_number && <div>उपभोक्ता सं.: {c.consumer_number}</div>}
                {c.address && <div>पता: {c.address}</div>}
                {c.cust_lat && c.cust_lng && (
                  <a href={"https://www.google.com/maps?q=" + c.cust_lat + "," + c.cust_lng}
                     target="_blank" rel="noreferrer" style={{ color: "#1565C0" }}>📍 घर की location देखें</a>
                )}
              </div>
            )}
            {ok && (
              <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 10, background: "#f7f9fd", border: "1px solid #e6ecf6" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#6b7a99", letterSpacing: .5, marginBottom: 6 }}>
                  आवेदन की स्थिति
                </div>
                {c.progress ? (
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#1f7a3d" }}>✓ {stageHi(c.progress)}</div>
                ) : (
                  <div style={{ fontSize: 13, color: "#b4552a", fontWeight: 700 }}>जानकारी मिल गई — आगे की प्रक्रिया बाकी</div>
                )}
                <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                  {STAGES.map((s, i) => (
                    <div key={s.k} title={s.hi} style={{ flex: 1, height: 6, borderRadius: 4,
                      background: i <= stageIdx(c.progress) ? "#1f7a3d" : "#dde5f1" }} />
                  ))}
                </div>
              </div>
            )}
            {!ok && (
              <a href={"https://wa.me/91" + c.customer_phone + "?text=" + encodeURIComponent(msg)}
                 target="_blank" rel="noreferrer"
                 style={{ display: "block", textAlign: "center", marginTop: 10, padding: "11px 14px", borderRadius: 10,
                          background: "#1f7a3d", color: "#fff", fontWeight: 800, fontSize: 14, textDecoration: "none" }}>
                WhatsApp पर लिंक फिर भेजें
              </a>
            )}
            {ok && c.progress !== "subsidy_received" && (
              <a href={"https://wa.me/91" + c.customer_phone + "?text=" + encodeURIComponent(remindMsg(c.customer_name))}
                 target="_blank" rel="noreferrer"
                 style={{ display: "block", textAlign: "center", marginTop: 8, padding: "11px 14px", borderRadius: 10,
                          background: "#E8600F", color: "#fff", fontWeight: 800, fontSize: 14, textDecoration: "none" }}>
                PM सूर्य घर आवेदन का reminder भेजें
              </a>
            )}
          </div>
        );
      })}
      <p style={{ textAlign: "center", fontSize: 12, color: "#8a97b1" }}>
        Divyanshi Digital Services Pvt Ltd · www.divyanshisolar.in
      </p>
    </div></div>
  );
}
