import "../styles/Language.css";
import { LANGUAGES } from "../data/LangTrans";
export function LangPg({t,tl,setTl,ok,back}){
  return(
    <div className="lp">
      <div className="lp-top">
        <div className="logo"><div className="logo-m">🌿</div><span className="logo-t" style={{color:"var(--cream)"}}>PlantDoc</span></div>
        <button className="ghost" onClick={back}>{t.back}</button>
      </div>
      <div className="lp-body">
        <h1 className="lp-h">{t.chooseLanguage}</h1>
        <p className="lp-s">{t.langSub}</p>
        <div className="lp-grid">
          {LANGUAGES.map(l=>(
            <div key={l.code} className={`lp-card${tl===l.code?" sel":""}`} onClick={()=>setTl(l.code)}>
              <div className="lp-flag">{l.flag}</div>
              <div className="lp-nat">{l.native}</div>
              <div className="lp-en">{l.label}</div>
            </div>
          ))}
        </div>
        <button className="lp-go" onClick={ok}>{t.continue}</button>
      </div>
    </div>
  );
}