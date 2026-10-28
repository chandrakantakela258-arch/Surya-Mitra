import { useState } from "react";

const W: any = { minHeight: "100vh", background: "#f1f5fb", padding: 18, fontFamily: "system-ui, sans-serif" };
const CARD: any = { background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 14px rgba(10,42,105,.10)", marginBottom: 16 };
const INP: any = { width: "100%", padding: "13px 14px", fontSize: 16, border: "2px solid #dbe3f0", borderRadius: 10, outline: "none", boxSizing: "border-box" };
const LBL: any = { display: "block", fontSize: 13, fontWeight: 700, color: "#0a2a69", marginBottom: 6, marginTop: 16 };
const BTN: any = { width: "100%", padding: "15px 18px", fontSize: 17, fontWeight: 800, color: "#fff", background: "#0a2a69", border: "none", borderRadius: 12, cursor: "pointer" };

export default function ShopAddCustomer() {
  const [mode, setMode] = useState<"add" | "dash">("add");
  const [dName, setDName] = useState("");
  const [dOwner, setDOwner] = useState("");
  const [dErr, setDErr] = useState("");
  const [dBusy, setDBusy] = useState(false);
  const [shopName, setShopName] = useState("");
  const [owner, setOwner] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [acc, setAcc] = useState<number | null>(null);
  const [geoMsg, setGeoMsg] = useState("");
  const [geoBusy, setGeoBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [out, setOut] = useState<any>(null);

  function askLocation() {
    if (!navigator.geolocation) { setGeoMsg("इस फ़ोन में location उपलब्ध नहीं है"); return; }
    setGeoBusy(true); setGeoMsg("");
    navigator.geolocation.getCurrentPosition(
      p => { setLat(Number(p.coords.latitude.toFixed(6))); setLng(Number(p.coords.longitude.toFixed(6)));
             setAcc(Math.round(p.coords.accuracy)); setGeoMsg("✓ Shop की location दर्ज हो गई"); setGeoBusy(false); },
      () => { setGeoMsg("Location नहीं मिली — आप आगे बढ़ सकते हैं"); setGeoBusy(false); },
      { enableHighAccuracy: true, timeout: 10000 });
  }

  async function openDash() {
    if (!dName.trim() || !dOwner.trim()) { setDErr("Shop का नाम और मालिक का नाम भरें"); return; }
    setDBusy(true); setDErr("");
    try {
      const r = await fetch("/api/public/shop-lookup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop_name: dName.trim(), shop_owner: dOwner.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Shop नहीं मिली");
      window.location.href = "/shop/" + d.token;
    } catch (e: any) { setDErr(e.message); }
    finally { setDBusy(false); }
  }

  async function submit() {
    const p = custPhone.replace(/\D/g, "").slice(-10);
    if (!shopName.trim()) { setErr("Shop का नाम भरें"); return; }
    if (!owner.trim()) { setErr("Shop मालिक का नाम भरें"); return; }
    if (p.length !== 10) { setErr("Customer का 10 अंकों का WhatsApp नंबर भरें"); return; }
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/public/shop-add-customer", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop_name: shopName.trim(), shop_owner: owner.trim(),
          customer_phone: p, shop_lat: lat, shop_lng: lng, shop_accuracy: acc }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Submit failed");
      setOut(d);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  if (out) {
    const link = window.location.origin + "/c/" + out.invite_token;
    const dash = window.location.origin + "/shop/" + out.shop_token;
    const msg = "नमस्ते! Divyanshi Solar — Surya Urja Kranti\n\nPM सूर्य घर सोलर प्लांट के लिए अपनी जानकारी इस लिंक पर भरें:\n" + link + "\n\nफ्री सोलर बचत जांच व साइट विज़िट — Divyanshi Solar";
    return (
      <div style={W}><div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ ...CARD, textAlign: "center" }}>
          <div style={{ fontSize: 46 }}>✅</div>
          <h2 style={{ color: "#0a2a69", margin: "6px 0" }}>Customer जोड़ दिया गया</h2>
          <p style={{ color: "#44506b", fontSize: 15 }}>
            {out.already ? "यह customer पहले से आपकी list में है।" : "अब नीचे का बटन दबाकर customer को उनका लिंक भेजें।"}
          </p>
          <p style={{ fontSize: 14, color: "#17243d", fontWeight: 700, marginTop: 6 }}>{out.customer_phone}</p>

          <a href={"https://wa.me/91" + out.customer_phone + "?text=" + encodeURIComponent(msg)}
             target="_blank" rel="noreferrer"
             style={{ ...BTN, display: "block", background: "#1f7a3d", textDecoration: "none", marginTop: 16 }}>
            WhatsApp पर लिंक भेजें
          </a>

          <div style={{ marginTop: 14, padding: 12, background: "#f1f5fb", borderRadius: 10, fontSize: 12,
                        color: "#44506b", wordBreak: "break-all", textAlign: "left" }}>
            <b>Customer link:</b><br />{link}
          </div>

          <a href={dash} style={{ ...BTN, display: "block", background: "#E8600F", textDecoration: "none", marginTop: 14 }}>
            मेरा Shop Dashboard देखें
          </a>
          <p style={{ fontSize: 12, color: "#8a97b1", marginTop: 8 }}>
            इस dashboard लिंक को bookmark कर लें — आपके सभी customers यहीं दिखेंगे
          </p>

          <button onClick={() => { setOut(null); setCustPhone(""); setErr(""); }}
                  style={{ ...BTN, background: "#fff", color: "#0a2a69", border: "2px solid #0a2a69", marginTop: 14 }}>
            + एक और customer जोड़ें
          </button>
        </div>
      </div></div>
    );
  }

  return (
    <div style={W}><div style={{ maxWidth: 520, margin: "0 auto" }}>
      <div style={{ textAlign: "center", padding: "18px 0 10px" }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#0a2a69", letterSpacing: 1 }}>DIVYANSHI SOLAR</div>
        <div style={{ fontSize: 13, color: "#c0392b", fontWeight: 700 }}>सूर्य ऊर्जा क्रांति — Shop Partner</div>
      </div>
      <div style={CARD}>
        <h3 style={{ margin: "0 0 4px", color: "#0a2a69", fontSize: 18 }}>Customer जोड़ें</h3>
        <p style={{ color: "#6b7a99", fontSize: 13, margin: 0 }}>
          अपनी shop की जानकारी और customer का WhatsApp नंबर भरें — customer को उनका लिंक चला जाएगा
        </p>

        <label style={LBL}>Shop का नाम *</label>
        <input style={INP} value={shopName} onChange={e => setShopName(e.target.value)} placeholder="जैसे कृष्णा इलेक्ट्रॉनिक्स" />

        <label style={LBL}>Shop मालिक का नाम *</label>
        <input style={INP} value={owner} onChange={e => setOwner(e.target.value)} placeholder="मालिक का नाम" />

        <label style={LBL}>Customer का WhatsApp नंबर *</label>
        <input style={INP} value={custPhone} onChange={e => setCustPhone(e.target.value)}
               inputMode="numeric" maxLength={13} placeholder="10 अंकों का नंबर" />

        <label style={LBL}>📍 Shop की Google location</label>
        <button onClick={askLocation} disabled={geoBusy}
          style={{ ...BTN, background: lat ? "#1f7a3d" : "#44506b", fontSize: 15, padding: "13px 16px" }}>
          {geoBusy ? "Location ली जा रही है…" : lat ? "✓ Location दर्ज हो गई" : "Shop location भेजें"}
        </button>
        {geoMsg && <div style={{ fontSize: 13, color: lat ? "#1f7a3d" : "#b4552a", marginTop: 6 }}>{geoMsg}</div>}
        {lat && lng && <div style={{ fontSize: 12, color: "#7b88a5", marginTop: 4 }}>{lat}, {lng}{acc ? " · ±" + acc + " m" : ""}</div>}

        {err && <div style={{ color: "#c0392b", fontSize: 14, marginTop: 12 }}>{err}</div>}
        <div style={{ marginTop: 18 }}>
          <button style={BTN} onClick={submit} disabled={busy}>{busy ? "भेजा जा रहा है…" : "Customer जोड़ें →"}</button>
        </div>
      </div>

      <div style={CARD}>
        {mode === "add" ? (
          <button onClick={() => { setMode("dash"); setDName(shopName); setDOwner(owner); }}
            style={{ ...BTN, background: "#fff", color: "#0a2a69", border: "2px solid #0a2a69" }}>
            मेरा Shop Dashboard देखें
          </button>
        ) : (
          <div>
            <h3 style={{ margin: "0 0 4px", color: "#0a2a69", fontSize: 17 }}>मेरा Shop Dashboard</h3>
            <p style={{ color: "#6b7a99", fontSize: 13, margin: 0 }}>
              वही shop नाम और मालिक का नाम भरें जो पहले दर्ज किया था
            </p>
            <label style={LBL}>Shop का नाम</label>
            <input style={INP} value={dName} onChange={e => setDName(e.target.value)} placeholder="Shop का नाम" />
            <label style={LBL}>Shop मालिक का नाम</label>
            <input style={INP} value={dOwner} onChange={e => setDOwner(e.target.value)} placeholder="मालिक का नाम" />
            {dErr && <div style={{ color: "#c0392b", fontSize: 14, marginTop: 12 }}>{dErr}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => { setMode("add"); setDErr(""); }}
                style={{ ...BTN, flex: "0 0 34%", background: "#fff", color: "#0a2a69", border: "2px solid #0a2a69" }}>← पीछे</button>
              <button onClick={openDash} disabled={dBusy} style={{ ...BTN, flex: 1, background: "#E8600F" }}>
                {dBusy ? "खोल रहे हैं…" : "Dashboard खोलें"}
              </button>
            </div>
          </div>
        )}
      </div>
      <p style={{ textAlign: "center", fontSize: 12, color: "#8a97b1" }}>
        Divyanshi Digital Services Pvt Ltd · www.divyanshisolar.in
      </p>
    </div></div>
  );
}
