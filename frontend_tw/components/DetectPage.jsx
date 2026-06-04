import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { LANGUAGES } from "../data/LangTrans";

export function DetectPg({ translations, lang, onBack, onLanguageChange, user }) {
  // ── STATES ──
  const [coords, setCoords] = useState({ latitude: null, longitude: null });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [img, setImg] = useState(null);
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(null);
  const [msgs, setMsgs] = useState([{ r: "b", txt: translations.chatBotResponses.default }]);
  const [inp, setInp] = useState("");
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActive] = useState(null);
  const [loadingHist, setLoadingHist] = useState(false);
  const [typing, setTyping] = useState(false);
  const [locOutbreak, setLocOutbreak] = useState(null);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [camOpen, setCamOpen] = useState(false);
  const [camReady, setCamReady] = useState(false);
  const [camError, setCamError] = useState(null);
  const [flashActive, setFlashActive] = useState(false);

  // ── REFS ──
  const endRef = useRef();
  const fRef = useRef();
  const sessionId = useRef(crypto.randomUUID());
  const recognRef = useRef(null);
  const videoRef = useRef();
  const canvasRef = useRef();
  const streamRef = useRef(null);

  const currentLanguage = useMemo(() => LANGUAGES.find(l => l.code === lang), [lang]);

  // ── EFFECTS ──
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(!!SR);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  useEffect(() => {
    if (!user?.name) return;
    setLoadingHist(true);
    fetch(`http://localhost:5000/showconvolist?user_name=${user.name}`)
      .then(r => r.json())
      .then(ids => setSessions(ids))
      .catch(console.error)
      .finally(() => setLoadingHist(false));
  }, [user]);

  useEffect(() => {
    const getFarmerLocation = async () => {
      if (!navigator.geolocation) {
        setError("Geolocation is not supported by your browser.");
        return;
      }
      setLoading(true);
      setError(null);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
          setLoading(false);
        },
        (err) => {
          setLoading(false);
          const errorMessages = {
            [err.PERMISSION_DENIED]: "Please allow location access to check local climate risks.",
            [err.POSITION_UNAVAILABLE]: "Location information is unavailable.",
            [err.TIMEOUT]: "The request to get user location timed out."
          };
          setError(errorMessages[err.code] || "An unknown error occurred.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    };
    getFarmerLocation();
  }, [user]);

  useEffect(() => {
    if (coords.latitude && coords.longitude) {
      fetch(`http://localhost:5000/local-pulse?lat=${coords.latitude}&lon=${coords.longitude}`)
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

  useEffect(() => {
    return () => stopStream();
  }, []);

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

  const loadSession = async (sid) => {
    setActive(sid);
    try {
      const r = await fetch(`http://localhost:5000/internalconvo?user_name=${user.name}&session_id=${sid}`);
      const data = await r.json();
      setMsgs(data.map(m => ({ r: m.role === "human" ? "u" : "b", txt: m.text })));
      sessionId.current = sid;
    } catch (err) {
      console.error(err);
    }
  };

  const newSession = () => {
    setActive(null);
    sessionId.current = crypto.randomUUID();
    setMsgs([{ r: "b", txt: translations.chatBotResponses.default }]);
    setImg(null);
    setFile(null);
    setRes(null);
  };

  const analyze = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("latitude", coords.latitude);
      formData.append("longitude", coords.longitude);
      
      const response = await fetch("http://localhost:5000/predict", {
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
      
      setMsgs(p => [...p, { r: "b", txt: `🔬 ${data.prediction} (${(data.confidence * 100).toFixed(2)}%)` }]);
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    const m = inp.trim();
    if (!m) return;
    setInp("");
    setMsgs(prev => [...prev, { r: "u", txt: m }]);
    setTyping(true);
    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: m,
          disease: res?.d || null,
          user_name: user?.name || "Guest",
          session_id: sessionId.current,
          language: lang
        })
      });
      const data = await response.json();
      setTyping(false);
      
      if (!sessions.includes(sessionId.current)) {
        setSessions(prev => [sessionId.current, ...prev]);
        setActive(sessionId.current);
      }
      setMsgs(prev => [...prev, { r: "b", txt: data.reply || "No response from server" }]);
    } catch (err) {
      console.error(err);
      setTyping(false);
      setMsgs(prev => [...prev, { r: "b", txt: "Server error" }]);
    }
  };

  const startVoice = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    const locales = { hi: "hi-IN", bn: "bn-IN", te: "te-IN", ta: "ta-IN", mr: "mr-IN" };
    recognition.lang = locales[lang] || "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInp(prev => prev ? prev + " " + transcript : transcript);
    };
    recognRef.current = recognition;
    recognition.start();
  }, [lang]);

  const stopVoice = useCallback(() => {
    recognRef.current?.stop();
    setListening(false);
  }, []);

  const toggleVoice = () => listening ? stopVoice() : startVoice();

  // ── CAMERA HANDLERS ──
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const openCamera = async () => {
    setCamError(null);
    setCamOpen(true);
    setCamReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setCamReady(true);
      }
    } catch (err) {
      setCamError("Camera access denied. Please allow camera permission and try again.");
      console.error(err);
    }
  };

  const closeCamera = () => {
    stopStream();
    setCamOpen(false);
    setCamReady(false);
    setCamError(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      load(new File([blob], "camera-capture.jpg", { type: "image/jpeg" }));
      closeCamera();
    }, "image/jpeg", 0.92);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans bg-slate-50 text-slate-900">
      
      {/* ── TOP NAV SHELL ── */}
      <div className="flex items-center gap-4 px-6 py-4 bg-emerald-950">
        <button onClick={onBack} className="px-4 py-2 text-sm font-medium transition-colors border rounded-lg bg-white/10 border-white/20 text-white/80 hover:bg-white/20">
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
            onLanguageChange(LANGUAGES[(i + 1) % LANGUAGES.length].code);
          }}
          className="px-4 py-2 text-xs font-bold transition-colors border rounded-full bg-emerald-900/50 text-emerald-100 border-emerald-700 hover:bg-emerald-800"
        >
          {currentLanguage?.flag} {currentLanguage?.native}
        </button>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: HISTORY SIDEBAR */}
        <div className="flex flex-col w-64 bg-white border-r border-slate-200 shrink-0">
          <div className="px-4 py-3 text-xs font-bold tracking-wider text-slate-400 uppercase border-b border-slate-100">
            Past Sessions
          </div>
          <button onClick={newSession} className="mx-3 my-3 px-4 py-2.5 text-sm font-bold text-white transition-transform bg-emerald-600 rounded-lg hover:bg-emerald-500 active:scale-95 shadow-sm">
            + New session
          </button>
          
          <div className="flex-1 px-2 pb-4 overflow-y-auto">
            {loadingHist ? (
              <div className="p-4 text-sm text-center text-slate-400">Loading...</div>
            ) : sessions.length === 0 ? (
              <div className="p-4 text-sm text-center text-slate-400">No sessions yet</div>
            ) : (
              sessions.map(sid => (
                <div 
                  key={sid} 
                  onClick={() => loadSession(sid)}
                  className={`p-3 mb-1 text-sm rounded-lg cursor-pointer transition-colors border ${
                    activeSession === sid 
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold" 
                      : "border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-200"
                  }`}
                >
                  <div className="truncate">{sid.slice(0, 8)}...</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CENTER: DETECT ENGINE */}
        <div className="flex flex-col flex-1 p-6 overflow-y-auto bg-slate-50/50 gap-6">
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
              <div onClick={openCamera} className="flex flex-col items-center justify-center flex-1 p-12 text-center transition-all bg-white border-2 border-dashed cursor-pointer border-blue-300 rounded-2xl hover:border-blue-400 hover:bg-blue-50">
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

        {/* RIGHT: AGRIBOT CHAT */}
        <div className="flex flex-col w-80 bg-white border-l border-slate-200 shrink-0">
          <div className="flex items-center gap-2 px-4 py-3 text-sm font-bold border-b text-emerald-800 border-slate-100 bg-slate-50/50">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            AgriBot 🤖
          </div>

          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-slate-50/30">
            {msgs.map((m, i) => (
              <div key={i} className={`flex w-full ${m.r === 'u' ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] p-3 text-sm rounded-2xl whitespace-pre-wrap break-words ${
                  m.r === 'u' 
                    ? "bg-emerald-600 text-white rounded-br-sm shadow-sm" 
                    : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm"
                }`}>
                  {m.txt}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start w-full">
                <div className="flex items-center gap-1.5 p-4 bg-white border border-slate-200 rounded-2xl rounded-bl-sm shadow-sm">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="flex items-center gap-2 p-3 bg-white border-t border-slate-100">
            <input
              className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-full outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              placeholder={listening ? "🎙️ Listening..." : translations.chatPlaceholder}
              value={inp}
              onChange={e => setInp(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
            />
            {voiceSupported && (
              <button
                onClick={toggleVoice}
                title={listening ? "Stop" : "Speak"}
                className={`flex items-center justify-center w-10 h-10 rounded-full border transition-all shrink-0 ${
                  listening ? "bg-red-50 border-red-200 animate-pulse" : "bg-slate-50 border-slate-200 hover:bg-emerald-50 hover:border-emerald-200"
                }`}
              >
                {listening ? "⏹" : "🎙️"}
              </button>
            )}
            <button 
              onClick={send}
              className="flex items-center justify-center w-10 h-10 text-white transition-transform bg-emerald-600 rounded-full hover:bg-emerald-500 active:scale-95 shrink-0 shadow-sm"
            >
              ↑
            </button>
          </div>
        </div>
      </div>

      {/* ── CAMERA MODAL PORTAL ── */}
      {camOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && closeCamera()}>
          <div className="flex flex-col w-full max-w-lg overflow-hidden bg-slate-900 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between px-5 py-3 border-b bg-slate-800/50 border-white/10">
              <span className="text-sm font-bold text-white">📷 Camera</span>
              <button onClick={closeCamera} className="flex items-center justify-center w-8 h-8 text-sm transition-colors rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white">✕</button>
            </div>

            <div className="relative flex items-center justify-center min-h-[300px] bg-black">
              {camError ? (
                <div className="flex flex-col items-center gap-3 p-8 text-center text-slate-300">
                  <div className="text-4xl">🚫</div>
                  <p className="text-sm">{camError}</p>
                  <button onClick={openCamera} className="px-5 py-2 mt-2 text-sm text-white transition-colors border rounded-full bg-white/10 border-white/20 hover:bg-white/20">Retry</button>
                </div>
              ) : (
                <>
                  {flashActive && <div className="absolute inset-0 z-10 bg-white opacity-90 animate-out fade-out" />}
                  {!camReady && (
                    <div className="flex flex-col items-center gap-3 text-sm text-slate-400">
                      <div className="w-8 h-8 border-4 rounded-full border-white/20 border-t-white/80 animate-spin" />
                      <p>Starting camera...</p>
                    </div>
                  )}
                  <video ref={videoRef} autoPlay playsInline muted className={`w-full max-h-[450px] object-cover ${camReady ? "block" : "hidden"}`} />
                  
                  {camReady && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-white/80 rounded-tl-sm" />
                      <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-white/80 rounded-tr-sm" />
                      <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-white/80 rounded-bl-sm" />
                      <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-white/80 rounded-br-sm" />
                    </div>
                  )}
                </>
              )}
            </div>

            {camReady && !camError && (
              <div className="flex flex-col items-center gap-3 px-6 py-5 border-t bg-slate-800/50 border-white/5">
                <p className="text-xs tracking-wider text-slate-400">Point at the leaf and capture</p>
                <button onClick={capturePhoto} className="flex items-center justify-center w-16 h-16 transition-transform border-4 border-white/70 rounded-full hover:border-white active:scale-95 group">
                  <div className="w-12 h-12 transition-colors bg-white rounded-full group-hover:bg-slate-200" />
                </button>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}

    </div>
  );
}