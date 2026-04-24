import { GIcon } from "../components/GoogleIcon";

export function AuthPg({ t, mode, setMode, an, setAn, ap, setAp, aw, setAw, ok, back }) {
  
  const handleSubmit = () => {
    ok(mode); // 👈 pass mode so parent knows if it's login or signup
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-lm">🌿</div>
          <span className="auth-lt">PlantDoc</span>
        </div>
        <h2 className="auth-title">{mode === "login" ? t.welcome : t.joinCommunity}</h2>
        <p className="auth-sub">{t.communityDesc}</p>

        <button className="g-btn" onClick={() => ok("google")}>
          <GIcon />{t.continueGoogle}
        </button>

        <div className="divider">
          <div className="div-l"/>
          <span className="div-t">{t.orContinueWith}</span>
          <div className="div-l"/>
        </div>

        {mode === "signup" && (
          <div className="fg">
            <label className="fl">{t.name}</label>
            <input className="fi" placeholder={t.name} value={an} onChange={e => setAn(e.target.value)} />
          </div>
        )}

        <div className="fg">
          <label className="fl">{t.phone}</label>

          <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #d1d5db",   borderRadius: "8px", overflow: "hidden" }} onFocus={e => e.currentTarget.style.boxShadow = "0 0 0 3px rgba(26,51,32,0.12)"}onBlur={e => e.currentTarget.style.boxShadow = "none"}
          >
            <span style={{
              padding: "0 10px 0 12px",
              fontSize: "14px",
              fontWeight: "600",
              color: "#374151",
              background: "#f3f4f6",
              borderRight: "1.5px solid #d1d5db",
              height: "44px",
              display: "flex",
              alignItems: "center",
              userSelect: "none",
              whiteSpace: "nowrap",
              letterSpacing: "0.3px"
            }}>
              +91
            </span>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="98765 43210"
              maxLength={11}
              value={ap}
              style={{ flex: 1, border: "none", outline: "none", padding: "0 12px", fontSize: "14px", fontFamily: "monospace", letterSpacing: "1.5px", height: "44px", background: "#ffffff", color: "#111827", caretColor: "#111827" }}
              onChange={(e) => {
                let raw = e.target.value.replace(/\D/g, "");
                if (raw.startsWith("91") && raw.length > 10) raw = raw.slice(2);
                raw = raw.slice(0, 10);
                const formatted = raw.length > 5 ? raw.slice(0, 5) + " " + raw.slice(5) : raw;
                setAp(formatted);
              }}
              onKeyDown={(e) => {
                const allowed = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"];
                if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) e.preventDefault();
              }}
              onPaste={(e) => {
                e.preventDefault();
                let pasted = e.clipboardData.getData("text").replace(/\D/g, "");
                if (pasted.startsWith("91") && pasted.length > 10) pasted = pasted.slice(2);
                pasted = pasted.slice(0, 10);
                setAp(pasted.length > 5 ? pasted.slice(0, 5) + " " + pasted.slice(5) : pasted);
              }}
            />
          </div>
        </div>

        <div className="fg">
          <label className="fl">{t.password}</label>
          <input className="fi" type="password" placeholder="••••••••" value={aw} onChange={e => setAw(e.target.value)} />
        </div>

        <button className="auth-sub-btn" onClick={handleSubmit}>
          {mode === "login" ? t.login : t.signup} →
        </button>

        <button className="auth-back" onClick={back}>{t.back}</button>

        <div className="auth-toggle">
          {mode === "login"
            ? <>{t.newMember} <a onClick={() => setMode("signup")}>{t.signup}</a></>
            : <>{t.alreadyMember} <a onClick={() => setMode("login")}>{t.login}</a></>
          }
        </div>
      </div>
    </div>
  );
}