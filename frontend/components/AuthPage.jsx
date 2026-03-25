import { GIcon } from "../components/GoogleIcon";


export function AuthPg({t,mode,setMode,an,setAn,ap,setAp,aw,setAw,ok,back}){
  return(
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo"><div className="auth-lm">🌿</div><span className="auth-lt">PlantDoc</span></div>
        <h2 className="auth-title">{mode==="login"?t.welcome:t.joinCommunity}</h2>
        <p className="auth-sub">{t.communityDesc}</p>
        <button className="g-btn" onClick={ok}><GIcon/>{t.continueGoogle}</button>
        <div className="divider"><div className="div-l"/><span className="div-t">{t.orContinueWith}</span><div className="div-l"/></div>
        {mode==="signup"&&<div className="fg"><label className="fl">{t.name}</label><input className="fi" placeholder={t.name} value={an} onChange={e=>setAn(e.target.value)}/></div>}
        <div className="fg"><label className="fl">{t.phone}</label><input className="fi" placeholder="+91 98765 43210" value={ap} onChange={e=>setAp(e.target.value)}/></div>
        <div className="fg"><label className="fl">{t.password}</label><input className="fi" type="password" placeholder="••••••••" value={aw} onChange={e=>setAw(e.target.value)}/></div>
        <button className="auth-sub-btn" onClick={ok}>{mode==="login"?t.login:t.signup} →</button>
        <button className="auth-back" onClick={back}>{t.back}</button>
        <div className="auth-toggle">{mode==="login"?<>{t.newMember} <a onClick={()=>setMode("signup")}>{t.signup}</a></>:<>{t.alreadyMember} <a onClick={()=>setMode("login")}>{t.login}</a></>}</div>
      </div>
    </div>
  );
}