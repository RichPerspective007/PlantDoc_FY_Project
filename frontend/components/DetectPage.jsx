import { useState, useRef, useEffect, useMemo } from "react";
import { LANGUAGES } from "../data/LangTrans";

export function DetectPg({ t, lang, back, onLang, user }) {

  const [img, setImg]             = useState(null);
  const [file, setFile]           = useState(null);
  const [drag, setDrag]           = useState(false);
  const [busy, setBusy]           = useState(false);
  const [res, setRes]             = useState(null);
  const [msgs, setMsgs]           = useState([{ r: "b", txt: t.chatBotResponses.default }]);
  const [inp, setInp]             = useState("");
  const [sessions, setSessions]   = useState([]);
  const [activeSession, setActive]= useState(null);
  const [loadingHist, setLoadingHist] = useState(false);

  const endRef   = useRef();
  const fRef     = useRef();
  const sessionId = useRef(crypto.randomUUID());

  const c = useMemo(() => LANGUAGES.find(l => l.code === lang), [lang]);

  // scroll to bottom on new message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

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

  // load a past session when clicked in sidebar
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
      sessionId.current = sid; // continue chatting in same session
    } catch (err) {
      console.error(err);
    }
  };

  // start a brand new session
  const newSession = () => {
    setActive(null);
    sessionId.current = crypto.randomUUID();
    setMsgs([{ r: "b", txt: t.chatBotResponses.default }]);
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

  const send = async () => {
    const m = inp.trim();
    if (!m) return;

    setInp("");
    setMsgs(prev => [...prev, { r: "u", txt: m }]);

    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: m,
          disease: res?.d || null,
          user_name: user?.name || "Guest",
          session_id: sessionId.current ,
          language : lang
        })
      });

      const data = await response.json();

      // after first message, add this session to sidebar if it's new
      if (!sessions.includes(sessionId.current)) {
        setSessions(prev => [sessionId.current, ...prev]);
        setActive(sessionId.current);
      }

      setMsgs(prev => [...prev, { r: "b", txt: data.reply || "No response from server" }]);
    } catch (err) {
      console.error(err);
      setMsgs(prev => [...prev, { r: "b", txt: "Server error" }]);
    }
  };

  return (
    <div className="shell">

      <div className="shell-head">
        <button className="ghost" onClick={back}>{t.back}</button>
        <span className="shell-title">🔬 {t.detectTitle}</span>
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
            {busy ? (
              <><span className="spin">⏳</span> {t.analyzing}</>
            ) : (
              `🧬 ${t.analyze}`
            )}
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
            <div ref={endRef} />
          </div>
          <div className="chat-bar">
            <input
              className="chat-in"
              placeholder={t.chatPlaceholder}
              value={inp}
              onChange={e => setInp(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
            />
            <button className="chat-go" onClick={send}>↑</button>
          </div>
        </div>

      </div>
    </div>
  );
}