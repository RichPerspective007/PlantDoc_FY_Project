import { LANGUAGES } from "../data/LangTrans";

export function Landing({t,lang,go,openLang}){
  const c=LANGUAGES.find(l=>l.code===lang);
  return(
    <div className="land">
      <div className="land-noise"/>
      <nav className="land-nav">
        <div className="logo"><div className="logo-m">🌿</div><span className="logo-t">{t.appName}</span></div>
        <button className="nav-lang" onClick={openLang}>{c?.flag} {c?.native}</button>
      </nav>
      <div className="land-hero">
        <div className="eyebrow">{t.tagline}</div>
        <h1 className="hero-h1">{t.heroTitle.split('\n')[0]}<br/><em>{t.heroTitle.split('\n')[1]}</em></h1>
        <p className="hero-p">{t.heroSub}</p>
        <div className="hero-ctas">
          <button className="cta-p" onClick={()=>go("detect")}>🔬 {t.detectBtn}</button>
          <button className="cta-o" onClick={()=>go("auth")}>👥 {t.communityBtn}</button>
          <button className="cta-o" onClick={()=>go("treatment")}>📋 {t.treatmentBtn}</button>
        </div>
      </div>
    </div>
  );
}