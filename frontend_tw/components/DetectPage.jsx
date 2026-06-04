import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { LANGUAGES } from "../data/LangTrans";
import { useFarmerLocation } from "../src/hooks/useFarmerLocation"; // Importing the custom hook for location
import { useAppContext } from "../src/context/AppContext";
import { useNavigate } from "react-router-dom";
import { CameraModal } from "./CameraModal";
import { AgriBotChat } from "./AgriBotChat";


export function DetectPg() {
  // ── STATES ──
  const { coords, error, loading, getLocation } = useFarmerLocation();
  const { translations, lang, setLang, user } = useAppContext();
  const navigate = useNavigate();
  const [img, setImg] = useState(null);
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(null);
  const [locOutbreak, setLocOutbreak] = useState(null);
  const [camOpen, setCamOpen] = useState(false);

  // ── REFS ──
  const fRef = useRef();

  const currentLanguage = useMemo(() => LANGUAGES.find(l => l.code === lang), [lang]);

  // ── EFFECTS ──
  useEffect(() => {
    getLocation().catch(
      err => console.log("Initial location fetch failed:", err.message)
    );
  }, [getLocation, user]);

  useEffect(() => {
    if (coords.latitude && coords.longitude) {
      fetch(`${import.meta.env.VITE_API_URL}/local-pulse?lat=${coords.latitude}&lon=${coords.longitude}`)
        .then(r => r.json())
        .then(data => setLocOutbreak({
          total_local_scans: data.total_local_scans,
          top_threat: data.top_threat,
          threat_count: data.threat_count
        }))
        .catch(console.error);
    } else {
      console.log("Waiting for GPS lock to fetch local outbreak info...");
    }
  }, [coords.latitude, coords.longitude]);

  // ── HANDLERS ──
  const load = (f) => {
    if (!f) return;
    setFile(f);
    setImg(URL.createObjectURL(f));
    setRes(null);
  };

  const drop = (e) => {
    e.preventDefault();
    setDrag(false);
    load(e.dataTransfer.files[0]);
  };

  const analyze = async () => {
    if (!file) return;
    setBusy(true);
    
    try {
      // Smart location check: use existing coords, or aggressively fetch them now
      let finalCoords = coords;
      if (!finalCoords.latitude) {
        finalCoords = await getLocation();
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("latitude", finalCoords.latitude);
      formData.append("longitude", finalCoords.longitude);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/predict`, {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      
      setRes({
        d: data.prediction,
        c: (data.confidence * 100).toFixed(2) + "%",
        desc: data.description,
        steps: data.steps
      });
    } catch (err) {
      console.error(err);
      alert(err.message === "Geolocation is not supported by your browser." || err.message.includes("allow location")
        ? err.message 
        : "Server error during analysis");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans bg-slate-50 text-slate-900">
      
      {/* ── TOP NAV SHELL ── */}
      <div className="flex items-center gap-4 px-6 py-4 bg-emerald-950">
        <button onClick={() => navigate("/")} className="px-4 py-2 text-sm font-medium transition-colors border rounded-lg bg-white/10 border-white/20 text-white/80 hover:bg-white/20">
          {translations.back}
        </button>
        <span className="flex-1 text-lg font-bold text-slate-50">🔬 {translations.detectTitle}</span>
        
        {user && (
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
            👤 {user.name}
          </div>
        )}
        <button
          onClick={() => {
            const i = LANGUAGES.findIndex(l => l.code === lang);
            setLang(LANGUAGES[(i + 1) % LANGUAGES.length].code);
          }}
          className="px-4 py-2 text-xs font-bold transition-colors border rounded-full bg-emerald-900/50 text-emerald-100 border-emerald-700 hover:bg-emerald-800"
        >
          {currentLanguage?.flag} {currentLanguage?.native}
        </button>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Drops the History sidebar (left) and Chat sidebar (right) into the UI */}
        <AgriBotChat diseaseResult={res?.d} />

        {/* CENTER: DETECT ENGINE */}
        <div className="flex flex-col flex-1 p-6 pr-[340px] overflow-y-auto bg-slate-50/50 gap-6">
          {!img ? (
            <div className="flex flex-col gap-4 md:flex-row">
              {/* Dropzone */}
              <div
                className={`flex-1 flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                  drag ? "border-emerald-500 bg-emerald-50" : "border-slate-300 bg-white hover:border-emerald-400 hover:bg-slate-50"
                }`}
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={drop}
                onClick={() => fRef.current.click()}
              >
                <span className="mb-4 text-5xl animate-bounce">🍃</span>
                <div className="text-base font-bold text-emerald-800">{translations.uploadPrompt}</div>
                <div className="mt-1 text-sm text-slate-500">{translations.uploadSub}</div>
                <input ref={fRef} type="file" accept="image/*" className="hidden" onChange={e => load(e.target.files[0])} />
              </div>

              {/* Camera Card */}
              <div onClick={() => setCamOpen(true)} className="flex flex-col items-center justify-center flex-1 p-12 text-center transition-all bg-white border-2 border-dashed cursor-pointer border-blue-300 rounded-2xl hover:border-blue-400 hover:bg-blue-50">
                <span className="mb-4 text-5xl animate-bounce">📷</span>
                <div className="text-base font-bold text-blue-800">Use Camera</div>
                <div className="mt-1 text-sm text-slate-500">Capture live photo</div>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden bg-black rounded-2xl shadow-md w-full max-w-2xl mx-auto">
              <img src={img} alt="leaf" className="w-full max-h-[400px] object-contain" />
              <button 
                onClick={() => { setImg(null); setFile(null); setRes(null); }}
                className="absolute px-4 py-2 text-sm font-bold bg-white/90 text-red-600 rounded-full top-3 right-3 shadow-sm hover:bg-white transition-transform hover:scale-105"
              >
                ❌ Remove
              </button>
            </div>
          )}

          {/* ── ACTION BUTTON: ANALYZE OR RESET ── */}
          {!res ? (
            <button 
              onClick={analyze} 
              disabled={!file || busy}
              className={`w-full max-w-2xl mx-auto py-4 text-base font-bold text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm ${
                !file || busy ? "bg-slate-300 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-500 hover:-translate-y-0.5 hover:shadow-md active:scale-95"
              }`}
            >
              {busy ? (
                <><span className="animate-spin">⏳</span> {translations.analyzing}</>
              ) : (
                `🧬 ${translations.analyze}`
              )}
            </button>
          ) : (
            <button
              onClick={() => { setImg(null); setFile(null); setRes(null); }}
              className="flex items-center justify-center w-full max-w-2xl gap-2 py-4 mx-auto text-base font-bold transition-all border-2 shadow-sm text-emerald-800 bg-emerald-50 border-emerald-200 rounded-xl hover:bg-emerald-100 hover:-translate-y-0.5 active:scale-95"
            >
              🔄 Scan Another Leaf
            </button>
          )}

          {/* Results Output */}
          {res && (
            <div className="w-full max-w-2xl mx-auto p-6 bg-white border-l-4 border-red-500 rounded-xl shadow-sm animate-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl font-bold text-red-700">⚠️ {res.d}</span>
                <span className="px-3 py-1 text-xs font-bold text-emerald-800 bg-emerald-100 rounded-full border border-emerald-200">{res.c}</span>
              </div>
              <p className="mb-5 text-sm leading-relaxed text-slate-600">{res.desc}</p>
              <ul className="flex flex-col gap-3">
                {res.steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 p-3 text-sm bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-emerald-500 rounded-full shrink-0">{i + 1}</span>
                    <span className="text-slate-700 mt-0.5">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {locOutbreak && (
            <div className="w-full max-w-2xl mx-auto p-5 bg-amber-50 border border-amber-200 rounded-xl shadow-sm">
              <p className="text-sm font-medium text-amber-900 leading-relaxed">
                In your area, there have been <span className="font-bold">{locOutbreak.threat_count} scans</span> of <span className="font-bold">{locOutbreak.top_threat}</span> recently. Stay vigilant and consider preventive measures.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── CAMERA MODAL PORTAL ── */}
      {camOpen && (
        <CameraModal 
          isOpen={camOpen} 
          onClose={() => setCamOpen(false)} 
          onCapture={(capturedFile) => load(capturedFile)} 
        />
      )}
    </div>
  );
}