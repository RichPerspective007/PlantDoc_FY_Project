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
  const [page, setPage]         = useState("landing");
  const [lang, setLang]         = useState("en");
  const [tl, setTl]             = useState("en");
  const [authMode, setAuthMode] = useState("login");
  const [user, setUser]         = useState(null); // 👈 track logged-in user

  const [an, setAn] = useState("");
  const [ap, setAp] = useState("");
  const [aw, setAw] = useState("");

  const t = T[lang] || T.en;

  const openLang = () => { setTl(lang); setPage("language"); };

  // ✅ go to protected page or redirect to auth
  const go = (route) => {
    const protectedRoutes = ["detect", "treatment", "community"];
    if (protectedRoutes.includes(route) && !user) {
      sessionStorage.setItem("redirectAfterLogin", route); // save intended route
      setPage("auth");
    } else {
      setPage(route);
    }
  };

  // ✅ handle login/signup/google
  const handleAuth = (mode) => {
    if (mode === "google") {
      setUser({ name: "Google User", phone: "" });
    } else if (mode === "login") {
      if (!ap || !aw) return alert("Please fill all fields");
      setUser({ name: an || "User", phone: ap });
    } else if (mode === "signup") {
      if (!an || !ap || !aw) return alert("Please fill all fields");
      setUser({ name: an, phone: ap });
    }

    // ✅ redirect to originally intended page
    const redirect = sessionStorage.getItem("redirectAfterLogin") || "detect";
    sessionStorage.removeItem("redirectAfterLogin");
    setPage(redirect);
  };

  return (
    <>
      {page==="landing"   && <Landing   t={t} lang={lang} go={go} openLang={openLang} user={user}/>}
      {page==="language"  && <LangPg    t={t} tl={tl} setTl={setTl} ok={()=>{setLang(tl);setPage("landing")}} back={()=>setPage("landing")}/>}
      {page==="detect" && <DetectPg t={t} lang={lang} back={()=>setPage("landing")} onLang={openLang} user={user}/>}
      {page==="treatment" && <TreatPg   t={t} back={()=>setPage("landing")}/>}
      {page==="auth"      && <AuthPg    t={t} mode={authMode} setMode={setAuthMode} an={an} setAn={setAn} ap={ap} setAp={setAp} aw={aw} setAw={setAw} ok={handleAuth} back={()=>setPage("landing")}/>}
      {page==="community" && <CommPg    t={t} lang={lang} back={()=>setPage("landing")} onLang={openLang}/>}
    </>
  );
}

export default App;