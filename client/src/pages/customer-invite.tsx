import { useState, useEffect } from "react";
import { useRoute } from "wouter";

const W: any = { minHeight: "100vh", background: "#f1f5fb", padding: 18, fontFamily: "system-ui, sans-serif" };
const CARD: any = { background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 14px rgba(10,42,105,.10)", marginBottom: 16 };
const INP: any = { width: "100%", padding: "13px 14px", fontSize: 16, border: "2px solid #dbe3f0", borderRadius: 10, outline: "none", boxSizing: "border-box" };
const LBL: any = { display: "block", fontSize: 13, fontWeight: 700, color: "#0a2a69", marginBottom: 6, marginTop: 16 };
const BTN: any = { width: "100%", padding: "15px 18px", fontSize: 17, fontWeight: 800, color: "#fff", background: "#0a2a69", border: "none", borderRadius: 12, cursor: "pointer" };

export default function CustomerInvite() {
  const [, params] = useRoute("/c/:token");
  const token = (params as any)?.token || "";
  const [inv, setInv] = useState<any>(null);
  const [bad, setBad] = useState("");
  const [name, setName] = useState("");
  const [consumerNo, setConsumerNo] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [acc, setAcc] = useState<number | null>(null);
  const [geoMsg, setGeoMsg] = useState("");
  const [geoBusy, setGeoBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch("/api/public/invite/" + token).then(async r => {
      const d = await r.json();
      if (!r.ok) { setBad(d.error || "Link not valid"); return; }
      setInv(d);
      if (d.customer_name) setName(d.customer_name);
      if (d.consumer_number) setConsumerNo(d.consumer_number);
      if (d.address) setAddress(d.address);
      if (d.status === "filled") setDone(true);
    }).catch(() => setBad("Link खोलने में समस्या हुई"));
  }, [token]);

  function askLocation() {
    if (!navigator.geolocation) { setGeoMsg("इस फ़ोन में location उपलब्ध नहीं है"); return; }
    setGeoBusy(true); setGeoMsg("");
    navigator.geolocation.getCurrentPosition(
      p => { setLat(Number(p.coords.latitude.toFixed(6))); setLng(Number(p.coords.longitude.toFixed(6)));
             setAcc(Math.round(p.coords.accuracy)); setGeoMsg("✓ आपके घर की location दर्ज हो गई"); setGeoBusy(false); },
      () => { setGeoMsg("Location नहीं मिली — आप आगे बढ़ सकते हैं"); setGeoBusy(false); },
      { enableHighAccuracy: true, timeout: 10000 });
  }

  async function submit() {
    if (!name.trim()) { setErr("अपना नाम भरें"); return; }
    if (!address.trim()) { setErr("विज़िट के लिए घर का पता भरें"); return; }
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/public/invite/" + token, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), consumer_number: consumerNo.trim(),
          address: address.trim(), cust_lat: lat, cust_lng: lng, cust_accuracy: acc }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Submit failed");
      setDone(true);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  if (bad) return (
    <div style={W}><div style={{ maxWidth: 520, margin: "40px auto", ...CARD, textAlign: "center" }}>
      <div style={{ fontSize: 44 }}>⚠️</div>
      <h3 style={{ color: "#0a2a69" }}>लिंक मान्य नहीं है</h3>
      <p style={{ color: "#6b7a99", fontSize: 14 }}>{bad}</p>
      <p style={{ color: "#6b7a99", fontSize: 14 }}>कृपया shop से नया लिंक लें।</p>
    </div></div>
  );

  if (done) return (
    <div style={W}><div style={{ maxWidth: 520, margin: "30px auto", ...CARD, textAlign: "center" }}>
      <div style={{ fontSize: 54 }}>☀️</div>
      <h2 style={{ color: "#0a2a69", margin: "8px 0" }}>धन्यवाद!</h2>
      <p style={{ color: "#44506b", fontSize: 16, lineHeight: 1.6 }}>
        आपकी जानकारी मिल गई है। हमारी टीम जल्द ही संपर्क करके<br />
        <b>फ्री सोलर बचत जांच</b> और साइट विज़िट तय करेगी।
      </p>
      <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: "#f1f5fb", border: "2px solid #dbe3f0", textAlign: "left" }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#c0392b", letterSpacing: 1, marginBottom: 8 }}>
          PM सूर्य घर आवेदन के लिए संपर्क करें
        </div>
        <div style={{ fontSize: 19, fontWeight: 900, color: "#0a2a69" }}>संजय कुमार</div>
        <div style={{ fontSize: 13, color: "#6b7a99", marginBottom: 12 }}>PM Surya Ghar Application — Divyanshi Solar</div>
        <div style={{ display: "flex", gap: 10 }}>
          <a href="tel:+918777684575" style={{ flex: 1, textAlign: "center", padding: "13px 10px", borderRadius: 10,
             background: "#E8600F", color: "#fff", fontWeight: 800, fontSize: 15, textDecoration: "none" }}>📞 8777684575</a>
          <a href="https://wa.me/918777684575?text=PM%20Surya%20Ghar%20application%20ke%20liye%20jaankari%20chahiye"
             target="_blank" rel="noreferrer"
             style={{ flex: 1, textAlign: "center", padding: "13px 10px", borderRadius: 10,
             background: "#1f7a3d", color: "#fff", fontWeight: 800, fontSize: 15, textDecoration: "none" }}>WhatsApp</a>
        </div>
      </div>
      <p style={{ color: "#6b7a99", fontSize: 14, marginTop: 16 }}>Divyanshi Solar — Powering Every Home</p>
    </div></div>
  );

  if (!inv) return <div style={W}><div style={{ maxWidth: 520, margin: "40px auto", ...CARD, textAlign: "center",
    color: "#6b7a99" }}>लोड हो रहा है…</div></div>;

  return (
    <div style={W}><div style={{ maxWidth: 520, margin: "0 auto" }}>
      <div style={{ textAlign: "center", padding: "18px 0 10px" }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#0a2a69", letterSpacing: 1 }}>DIVYANSHI SOLAR</div>
        <div style={{ fontSize: 13, color: "#c0392b", fontWeight: 700 }}>सूर्य ऊर्जा क्रांति</div>
      </div>
      <div style={CARD}>
        <h3 style={{ margin: "0 0 4px", color: "#0a2a69", fontSize: 18 }}>अपनी जानकारी भरें</h3>
        <p style={{ color: "#6b7a99", fontSize: 13, margin: 0 }}>
          Shop: <b>{inv.shop_name}</b>{inv.shop_owner ? " (" + inv.shop_owner + ")" : ""}
        </p>

        <label style={LBL}>पूरा नाम *</label>
        <input style={INP} value={name} onChange={e => setName(e.target.value)} placeholder="आपका नाम" />

        <label style={LBL}>WhatsApp नंबर</label>
        <input style={{ ...INP, background: "#f1f5fb", color: "#44506b" }} value={inv.customer_phone} readOnly />

        <label style={LBL}>उपभोक्ता संख्या / Consumer No.</label>
        <input style={INP} value={consumerNo} onChange={e => setConsumerNo(e.target.value)}
               placeholder="बिजली बिल पर लिखा नंबर" />

        <label style={LBL}>घर का पता — विज़िट के लिए *</label>
        <textarea style={{ ...INP, minHeight: 92, resize: "vertical" }} value={address}
                  onChange={e => setAddress(e.target.value)} placeholder="गाँव / मोहल्ला, ब्लॉक, जिला, पिन" />

        <label style={LBL}>📍 अपने घर की Google location</label>
        <button onClick={askLocation} disabled={geoBusy}
          style={{ ...BTN, background: lat ? "#1f7a3d" : "#44506b", fontSize: 15, padding: "13px 16px" }}>
          {geoBusy ? "Location ली जा रही है…" : lat ? "✓ Location दर्ज हो गई" : "घर की location भेजें"}
        </button>
        <p style={{ fontSize: 12, color: "#8a97b1", margin: "8px 0 0" }}>घर पर रहते हुए दबाएँ — इससे साइट विज़िट आसान होगी</p>
        {geoMsg && <div style={{ fontSize: 13, color: lat ? "#1f7a3d" : "#b4552a", marginTop: 6 }}>{geoMsg}</div>}
        {lat && lng && <div style={{ fontSize: 12, color: "#7b88a5", marginTop: 4 }}>{lat}, {lng}{acc ? " · ±" + acc + " m" : ""}</div>}

        {err && <div style={{ color: "#c0392b", fontSize: 14, marginTop: 12 }}>{err}</div>}
        <div style={{ marginTop: 18 }}>
          <button style={BTN} onClick={submit} disabled={busy}>{busy ? "भेजा जा रहा है…" : "विज़िट बुक करें"}</button>
        </div>
      </div>
    </div></div>
  );
}
