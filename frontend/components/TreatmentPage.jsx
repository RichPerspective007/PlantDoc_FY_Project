import "../styles/Treatment.css";
import "../styles/Profile.css";
import "../styles/Shell.css";

const isHigh = s => ["High", "उच्च", "উচ্চ", "అధిక", "அதிகம்", "जास्त"].includes(s);

export function TreatPg({ t, back, user }) {
  return (
    <div className="shell">
      <div className="shell-head"><button className="ghost" onClick={back}>{t.back}</button><span className="shell-title">📋 {t.treatment}</span>
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
      </div>
      <div className="treat-body">
        <div className="treat-grid">
          {t.treatments.map((tr, i) => (
            <div key={i} className="tc">
              <div className="tc-row"><span className="tc-n">{tr.name}</span><span className={`sev ${isHigh(tr.severity) ? "sh" : "sm"}`}>{tr.severity}</span></div>
              <div className="tc-p">🌱 {tr.plant}</div>
              <div className="tc-c">💊 {tr.cure}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}