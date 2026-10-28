import { useEffect, useRef, useState } from "react";

type Shop = { shop_code: string; shop_name: string; district: string | null; state: string | null };

export default function ShopScan() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Shop | null>(null);
  const [typed, setTyped] = useState("");
  const [openList, setOpenList] = useState(false);
  const [c, setC] = useState({ name: "", phone: "", district: "", monthlyBill: "", plantInterest: "" });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const first = useRef(true);
  const set = (k: string) => (e: any) => setC({ ...c, [k]: e.target.value });

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      p => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }), () => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const u = new URLSearchParams();
        if (q.trim()) u.set("q", q.trim());
        if (coords) { u.set("lat", String(coords.lat)); u.set("lng", String(coords.lng)); }
        const r = await fetch(`/api/shop/public/list?${u}`);
        if (r.ok) setShops(await r.json());
      } catch {}
    }, first.current ? 0 : 300);
    first.current = false;
    return () => clearTimeout(t);
  }, [q, coords]);

  const submit = async (e: any) => {
    e.preventDefault(); setErr("");
    if (!picked && !typed.trim()) return setErr("कृपया अपनी दुकान चुनें या दुकान का नाम लिखें।");
    setBusy(true);
    try {
      const r = await fetch("/api/shop/lead", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...c, shopCode: picked?.shop_code, shopNameEntered: picked ? null : typed.trim(),
          latitude: coords?.lat, longitude: coords?.lng }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
      setDone(true);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  const L = "block text-sm font-bold text-slate-800 mb-1.5";
  const I = "w-full rounded-xl border-2 border-slate-200 px-4 py-3.5 text-base outline-none focus:border-blue-700 bg-white text-slate-900 font-bold placeholder:font-normal placeholder:text-slate-400";

  if (done) return (
    <div className="flex min-h-screen items-center justify-center bg-blue-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">✓</div>
        <h1 className="mt-4 text-xl font-bold text-slate-900">धन्यवाद!</h1>
        <p className="mt-2 text-sm text-slate-600">
          आपकी जानकारी मिल गई है। Divyanshi Solar की टीम जल्द ही आपसे संपर्क करेगी।
        </p>
        <p className="mt-4 text-xs text-slate-400">{picked?.shop_name || typed}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-blue-50 px-4 py-6">
      <div className="mx-auto w-full max-w-sm">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-blue-900">DIVYANSHI SOLAR</h1>
          <p className="text-sm font-bold text-orange-600">सूर्य ऊर्जा क्रांति</p>
        </div>

        <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">मुफ्त सोलर जानकारी पाएं</h2>
          <p className="mt-1 text-sm text-slate-600">
            अपनी दुकान चुनें और नंबर भरें। हमारी टीम आपको सब्सिडी और EMI की जानकारी देगी।
          </p>

          <form onSubmit={submit} className="mt-5 space-y-4">
            <div>
              <label className={L}>आप किस दुकान पर हैं? *</label>
              {picked ? (
                <div className="flex items-center justify-between rounded-xl border-2 border-blue-700 bg-blue-50 px-4 py-3">
                  <div>
                    <p className="font-bold text-blue-900">{picked.shop_name}</p>
                    <p className="text-xs text-blue-700">{[picked.district, picked.state].filter(Boolean).join(", ")}</p>
                  </div>
                  <button type="button" onClick={() => { setPicked(null); setOpenList(true); }}
                    className="text-sm font-bold text-blue-700">बदलें</button>
                </div>
              ) : (
                <>
                  <input className={I} value={q} onFocus={() => setOpenList(true)}
                    onChange={e => { setQ(e.target.value); setOpenList(true); }}
                    placeholder="दुकान का नाम खोजें..." />
                  {openList && (
                    <div className="mt-1 max-h-60 overflow-y-auto rounded-xl border-2 border-slate-200">
                      {shops.length === 0 && (
                        <p className="p-3 text-sm text-slate-500">कोई दुकान नहीं मिली</p>
                      )}
                      {shops.map(s => (
                        <button type="button" key={s.shop_code}
                          onClick={() => { setPicked(s); setOpenList(false); setTyped(""); }}
                          className="block w-full border-b px-4 py-3 text-left last:border-0 hover:bg-blue-50">
                          <span className="block font-semibold text-slate-900">{s.shop_name}</span>
                          <span className="block text-xs text-slate-500">
                            {[s.district, s.state].filter(Boolean).join(", ")}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 rounded-xl bg-amber-50 p-3">
                    <label className="mb-1 block text-xs font-bold text-amber-900">
                      दुकान सूची में नहीं है? यहाँ नाम लिखें
                    </label>
                    <input className="w-full rounded-lg border border-amber-300 px-3 py-2.5 text-base outline-none bg-white text-slate-900 font-bold placeholder:font-normal placeholder:text-slate-400"
                      value={typed} onChange={e => setTyped(e.target.value)} placeholder="दुकान का नाम" maxLength={200} />
                  </div>
                </>
              )}
            </div>

            <div><label className={L}>आपका नाम *</label>
              <input className={I} value={c.name} onChange={set("name")} required maxLength={150} /></div>

            <div><label className={L}>WhatsApp नंबर *</label>
              <input className={I} value={c.phone} onChange={set("phone")} required inputMode="numeric"
                placeholder="10 अंकों का नंबर" /></div>

            <div><label className={L}>महीने का बिजली बिल</label>
              <select className={I} value={c.monthlyBill} onChange={set("monthlyBill")}>
                <option value="">चुनें</option>
                <option>₹1,000 तक</option><option>₹1,000 - ₹2,000</option>
                <option>₹2,000 - ₹3,000</option><option>₹3,000 - ₹5,000</option>
                <option>₹5,000 से ज्यादा</option>
              </select></div>

            <div><label className={L}>जिला</label>
              <input className={I} value={c.district} onChange={set("district")} maxLength={100} /></div>

            {err && <div className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{err}</div>}

            <button disabled={busy}
              className="w-full rounded-xl bg-blue-800 px-4 py-4 text-base font-bold text-white disabled:opacity-60">
              {busy ? "भेजा जा रहा है..." : "मुफ्त जानकारी पाएं"}
            </button>
            <p className="text-center text-xs text-slate-500">
              केवल ₹12,000 देकर 3 kW on-grid solar plant लगाएं
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
