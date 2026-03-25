import { useState, useRef, useEffect } from "react";
import "./App.css";
import "../styles/Detect.css";
import "../styles/Profile.css";
import "../styles/Shell.css";
import "../styles/Landing.css";
import "../styles/Community.css";
import "../styles/Profile.css";
import "../styles/Treatment.css";
import "../styles/Auth.css";
import { Landing } from "../components/LandingPage";
import { LangPg } from "../components/LanguagePage";
import { DetectPg } from "../components/DetectPage";
import { TreatPg } from "../components/TreatmentPage";
import { AuthPg } from "../components/AuthPage";
import { CommPg } from "../components/CommunityPage";
import { T } from "../data/LangTrans";

function App() {
  const [page, setPage] = useState("landing");
  const [lang, setLang] = useState("en");
  const [tl, setTl] = useState("en");
  const [authMode, setAuthMode] = useState("login");
  const [an, setAn] = useState(""); const [ap, setAp] = useState(""); const [aw, setAw] = useState("");
  const t = T[lang] || T.en;
  const openLang = () => { setTl(lang); setPage("language"); };
  return (
    <>
      {/*<style>{css}</style>*/}
      {page==="landing"   && <Landing t={t} lang={lang} go={setPage} openLang={openLang}/>}
      {page==="language"  && <LangPg t={t} tl={tl} setTl={setTl} ok={()=>{setLang(tl);setPage("landing")}} back={()=>setPage("landing")}/>}
      {page==="detect"    && <DetectPg t={t} lang={lang} back={()=>setPage("landing")} onLang={openLang}/>}
      {page==="treatment" && <TreatPg t={t} back={()=>setPage("landing")}/>}
      {page==="auth"      && <AuthPg t={t} mode={authMode} setMode={setAuthMode} an={an} setAn={setAn} ap={ap} setAp={setAp} aw={aw} setAw={setAw} ok={()=>setPage("community")} back={()=>setPage("landing")}/>}
      {page==="community" && <CommPg t={t} lang={lang} back={()=>setPage("landing")} onLang={openLang}/>}
    </>
  );
}

export default App;