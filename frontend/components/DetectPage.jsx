import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { LANGUAGES } from "../data/LangTrans";

export function DetectPg({ t, lang, back, onLang, user }) {
  const [coords, setCoords] = useState({ latitude: null, longitude: null });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const getFarmerLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLoading(false);
        
        // Trigger your FastAPI weather/outbreak endpoints right here:
        // fetchWeatherData(position.coords.latitude, position.coords.longitude);
      },
      (err) => {
        setLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Please allow location access to check local climate risks.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location information is unavailable.");
            break;
          case err.TIMEOUT:
            setError("The request to get user location timed out.");
            break;
          default:
            setError("An unknown error occurred.");
            break;
        }
      },
      {
        enableHighAccuracy: true, // Forces GPS usage on mobile devices instead of rough IP mapping
        timeout: 10000,           // Give up after 10 seconds
        maximumAge: 60000         // Accept a cached location if it's less than 1 minute old
      }
    );
  };

  const [img, setImg] = useState(null);
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(null);
  const [msgs, setMsgs] = useState([{ r: "b", txt: t.chatBotResponses.default }]);
  const [inp, setInp] = useState("");
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActive] = useState(null);
  const [loadingHist, setLoadingHist] = useState(false);
  const [typing, setTyping] = useState(false);
  const [locOutbreak, setLocOutbreak] = useState(null);

  // voice states
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  // camera states
  const [camOpen, setCamOpen] = useState(false);
  const [camReady, setCamReady] = useState(false);
  const [camError, setCamError] = useState(null);
  const [flashActive, setFlashActive] = useState(false);

  const endRef = useRef();
  const fRef = useRef();
  const sessionId = useRef(crypto.randomUUID());
  const recognRef = useRef(null);
  const videoRef = useRef();
  const canvasRef = useRef();
  const streamRef = useRef(null);

  const c = useMemo(() => LANGUAGES.find(l => l.code === lang), [lang]);

  // check voice support on mount
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(!!SR);
  }, []);

  // scroll to bottom on new message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  // fetch session list on mount
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
    // This will print initially, which is completely normal. 
    // It will disappear once the GPS locks on and Phase 2 runs again.
    console.log("Waiting for GPS lock to fetch local outbreak info...");
  }
}, [coords.latitude, coords.longitude]);
  // cleanup camera stream on unmount
  useEffect(() => {
    return () => stopStream();
  }, []);

  // ── FILE LOAD ──
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

  // ── SESSION MANAGEMENT ──
  const loadSession = async (sid) => {
    setActive(sid);
    try {
      const r = await fetch(
        `http://localhost:5000/internalconvo?user_name=${user.name}&session_id=${sid}`
      );
      const data = await r.json();
      setMsgs(data.map(m => ({
        r: m.role === "human" ? "u" : "b",
        txt: m.text
      })));
      sessionId.current = sid;
    } catch (err) {
      console.error(err);
    }
  };

  const newSession = () => {
    setActive(null);
    sessionId.current = crypto.randomUUID();
    setMsgs([{ r: "b", txt: t.chatBotResponses.default }]);
    setImg(null);
    setFile(null);
    setRes(null);
  };

  // ── ANALYZE ──
  const analyze = async () => {
    if (!file) return;
    setBusy(true);
    /*try {
      await getFarmerLocation();
      console.log("Location scan initiated");
      console.log(coords.latitude, coords.longitude);
    }
    catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setBusy(false);
    }*/
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
      setMsgs(p => [
        ...p,
        { r: "b", txt: `🔬 ${data.prediction} (${(data.confidence * 100).toFixed(2)}%)` }
      ]);
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setBusy(false);
    }
  };

  // ── CHAT SEND ──
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

  // ── VOICE INPUT ──
  const startVoice = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    // map app language to BCP-47 locale for recognition
    recognition.lang = lang === "hi" ? "hi-IN"
      : lang === "bn" ? "bn-IN"
        : lang === "te" ? "te-IN"
          : lang === "ta" ? "ta-IN"
            : lang === "mr" ? "mr-IN"
              : "en-US";
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

  const toggleVoice = () => {
    if (listening) stopVoice();
    else startVoice();
  };

  // ── CAMERA ──
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
        video: {
          facingMode: "environment",  // rear camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
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
    // flash animation
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const capturedFile = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
      load(capturedFile);
      closeCamera();
    }, "image/jpeg", 0.92);
  };

  return (
    <div className="shell">

      <div className="shell-head">
        <button className="ghost" onClick={back}>{t.back}</button>
        <span className="shell-title">🔬 {t.detectTitle}</span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "11px",
            fontWeight: "600",
            color: "#14532d",
            background: "#dcfce7",
            padding: "3px 8px",
            borderRadius: "999px"
          }}
        >
          👤 {user?.name}
        </div>
        <button
          className="chip"
          onClick={() => {
            const i = LANGUAGES.findIndex(l => l.code === lang);
            onLang(LANGUAGES[(i + 1) % LANGUAGES.length].code);
          }}
        >
          {c?.flag} {c?.native}
        </button>
      </div>

      <div className="det-wrap">

        {/* ── history sidebar ── */}
        <div className="history-panel">
          <div className="history-head">Past sessions</div>
          <button className="hist-new" onClick={newSession}>+ New session</button>
          <div className="history-list">
            {loadingHist ? (
              <div className="hist-empty">Loading...</div>
            ) : sessions.length === 0 ? (
              <div className="hist-empty">No sessions yet</div>
            ) : (
              sessions.map(sid => (
                <div
                  key={sid}
                  className={`hist-item ${activeSession === sid ? "active" : ""}`}
                  onClick={() => loadSession(sid)}
                >
                  <div className="h-id">{sid.slice(0, 8)}...</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── main detect area ── */}
        <div className="det-main">

          {!img ? (
            <div className="upload-row">
              {/* file upload card */}
              <div
                className={`dropzone${drag ? " over" : ""}`}
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={drop}
                onClick={() => fRef.current.click()}
              >
                <span className="dz-icon">🍃</span>
                <div className="dz-t">{t.uploadPrompt}</div>
                <div className="dz-s">{t.uploadSub}</div>
                <input
                  ref={fRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={e => load(e.target.files[0])}
                />
              </div>

              {/* camera card */}
              <div className="cam-card" onClick={openCamera}>
                <span className="dz-icon">📷</span>
                <div className="dz-t">Use Camera</div>
                <div className="dz-s">Capture live photo</div>
              </div>
            </div>
          ) : (
            <div className="img-wrap">
              <img src={img} alt="leaf" className="leaf-img" />
              <button
                className="remove-btn"
                onClick={() => { setImg(null); setFile(null); setRes(null); }}
              >
                ❌ Remove
              </button>
            </div>
          )}

          <button className="ana-btn" onClick={analyze} disabled={!file || busy}>
            {busy
              ? <><span className="spin">⏳</span> {t.analyzing}</>
              : `🧬 ${t.analyze}`
            }
          </button>

          {res && (
            <div className="res-box">
              <div className="res-row">
                <span className="res-name">⚠️ {res.d}</span>
                <span className="conf">{res.c}</span>
              </div>
              <p className="res-desc">{res.desc}</p>
              <ul className="steps">
                {res.steps.map((s, i) => (
                  <li key={i} className="step">
                    <span className="step-n">{i + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {locOutbreak && (
            <div className="res-box">
              <p className="res-desc">In your area, there have been {locOutbreak.threat_count} scans of {locOutbreak.top_threat} recently. Stay vigilant and consider preventive measures.</p>
            </div>
          )}
          
        </div>

        {/* ── agribot chat ── */}
        <div className="det-aside">
          <div className="aside-head">
            <div className="dot" />
            AgriBot 🤖
          </div>

          <div className="chat-msgs">
            {msgs.map((m, i) => (
              <div key={i} className={`cm ${m.r}`}>
                <div className="cb">{m.txt}</div>
              </div>
            ))}
            {typing && (
              <div className="cm b">
                <div className="cb typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="chat-bar">
            <input
              className="chat-in"
              placeholder={listening ? "🎙️ Listening..." : t.chatPlaceholder}
              value={inp}
              onChange={e => setInp(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
            />
            {voiceSupported && (
              <button
                className={`voice-btn${listening ? " listening" : ""}`}
                onClick={toggleVoice}
                title={listening ? "Stop" : "Speak"}
              >
                {listening ? "⏹" : "🎙️"}
              </button>
            )}
            <button className="chat-go" onClick={send}>↑</button>
          </div>
        </div>

      </div>

      {/* ── CAMERA MODAL ── */}
      {camOpen && (
        <div className="cam-overlay" onClick={e => e.target === e.currentTarget && closeCamera()}>
          <div className="cam-modal">

            <div className="cam-header">
              <span className="cam-title">📷 Camera</span>
              <button className="cam-close" onClick={closeCamera}>✕</button>
            </div>

            <div className="cam-body">
              {camError ? (
                <div className="cam-error">
                  <div className="cam-error-icon">🚫</div>
                  <p>{camError}</p>
                  <button className="cam-retry" onClick={openCamera}>Retry</button>
                </div>
              ) : (
                <>
                  {flashActive && <div className="cam-flash" />}
                  {!camReady && (
                    <div className="cam-loading">
                      <div className="cam-spinner" />
                      <p>Starting camera...</p>
                    </div>
                  )}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="cam-video"
                    style={{ display: camReady ? "block" : "none" }}
                  />
                  {camReady && (
                    <div className="cam-viewfinder">
                      <div className="vf-corner tl" />
                      <div className="vf-corner tr" />
                      <div className="vf-corner bl" />
                      <div className="vf-corner br" />
                    </div>
                  )}
                </>
              )}
            </div>

            {camReady && !camError && (
              <div className="cam-footer">
                <p className="cam-hint">Point at the leaf and capture</p>
                <button className="cam-capture" onClick={capturePhoto}>
                  <span className="cam-btn-ring">
                    <span className="cam-btn-inner" />
                  </span>
                </button>
              </div>
            )}

            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>
        </div>
      )}

    </div>
  );
}