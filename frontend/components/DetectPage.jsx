import { useState, useRef, useEffect, useMemo } from "react";
import { LANGUAGES } from "../data/LangTrans";

export function DetectPg({ t, lang, back, onLang }) {

  const [img, setImg] = useState(null);
  const [file, setFile] = useState(null); 
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(null);

  const [msgs, setMsgs] = useState([
    { r: "b", txt: t.chatBotResponses.default }
  ]);
  const [inp, setInp] = useState("");

  const endRef = useRef();
  const fRef = useRef();

  const c = useMemo(
    () => LANGUAGES.find(l => l.code === lang),
    [lang]
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  // load file + preview
  const load = (f) => {
    if (!f) return;

    setFile(f);
    setImg(URL.createObjectURL(f));
    setRes(null);
  };

  const drop = (e) => {
    e.preventDefault();
    setDrag(false);

    const f = e.dataTransfer.files[0];
    load(f);
  };

  // backend connected fully working for the model(dissease_prediction model)
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
        desc: "Detected by AI model",
        steps: ["Use proper pesticide", "Remove infected leaves"]
      });

      setMsgs(p => [
        ...p,
        {
          r: "b",
          txt: `🔬 ${data.prediction} (${(data.confidence * 100).toFixed(2)}%)`
        }
      ]);

    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setBusy(false);
    }
  };

  // chatbot (same as yours)
  const send = () => {
    const m = inp.trim();
    if (!m) return;

    setInp("");

    const lo = m.toLowerCase();
    let rep = t.chatBotResponses.default;

    if (lo.includes("blight") || lo.includes("झुलसा"))
      rep = t.chatBotResponses.blight;
    else if (lo.includes("mildew") || lo.includes("भुरी"))
      rep = t.chatBotResponses.mildew;
    else if (lo.includes("yellow") || lo.includes("पीली"))
      rep = t.chatBotResponses.yellowing;

    setMsgs(p => [...p, { r: "u", txt: m }]);

    setTimeout(() => {
      setMsgs(p => [...p, { r: "b", txt: rep }]);
    }, 700);
  };

  return (
    <div className="shell">

      <div className="shell-head">
        <button className="ghost" onClick={back}>{t.back}</button>

        <span className="shell-title">🔬 {t.detectTitle}</span>

        {/* ✅ language switch FIXED */}
        <button
          className="chip"
          onClick={() => {
            const i = LANGUAGES.findIndex(l => l.code === lang);
            const next = LANGUAGES[(i + 1) % LANGUAGES.length];
            onLang(next.code);
          }}
        >
          {c?.flag} {c?.native}
        </button>
      </div>

      <div className="det-wrap">

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

              {/* ✅ fixed remove */}
              <button
                className="remove-btn"
                onClick={() => {
                  setImg(null);
                  setFile(null);
                  setRes(null);
                }}
              >
                ❌ Remove
              </button>
            </div>
          )}

          <button
            className="ana-btn"
            onClick={analyze}
            disabled={!file || busy}
          >
            {busy ? (
              <>
                <span className="spin">⏳</span> {t.analyzing}
              </>
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