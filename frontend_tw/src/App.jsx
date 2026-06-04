import { useState } from "react";

import "./App.css";

import { Landing } from "../components/LandingPage";
import { LangPg } from "../components/LanguagePage";
import { DetectPg } from "../components/DetectPage";
import { TreatPg } from "../components/TreatmentPage";
import { AuthPg } from "../components/AuthPage";
import { CommPg } from "../components/CommunityPage";
import { useEffect } from "react";
import { T } from "../data/LangTrans";

function App() {

  const [page, setPage] = useState("landing");

  const [lang, setLang] = useState("en");
  const [tl, setTl] = useState("en");

  const [user, setUser] = useState(null);
  const [name, setName] = useState("");

  // OTP FLOW
  const [step, setStep] = useState("phone");

  const [ap, setAp] = useState("");
  const [otp, setOtp] = useState("");

  const t = T[lang] || T.en;

  // Open language page
  useEffect(() => {

    const token = localStorage.getItem("token");

    if (token) {

      fetch(
        `${import.meta.env.VITE_API_URL}/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

        .then(res => res.json())

        .then(data => {

          if (data.name) {

            setUser({
              name: data.name,
              phone: data.phone_number
            });

          }

        })

        .catch(err => {
          console.log(err);
        });

    }

  }, []);

  const openLang = () => {
    setTl(lang);
    setPage("language");
  };

  // Protected routes
  const go = (route) => {

    const protectedRoutes = [
      "detect",
      "treatment",
      "community"
    ];

    if (protectedRoutes.includes(route) && !user) {

      sessionStorage.setItem(
        "redirectAfterLogin",
        route
      );

      setPage("auth");

    } else {
      setPage(route);
    }
  };

  // LOGIN HANDLER
  const handleAuth = () => {

    const cleanPhone = ap.replace(/\D/g, "");

    if (cleanPhone.length !== 10) {
      alert("Please enter valid phone number");
      return;
    }

    // OTP validation can be added here

    setUser({
      name: name,
      phone: cleanPhone
    });

    const redirect =
      sessionStorage.getItem("redirectAfterLogin")
      || "detect";

    sessionStorage.removeItem(
      "redirectAfterLogin"
    );

    setPage(redirect);
  };
  return (
    <>

      {/* Landing */}
      {page === "landing" && (
        <Landing
          translations={t}
          lang={lang}
          go={go}
          openLang={openLang}
          user={user}
        />
      )}

      {/* Language */}
      {page === "language" && (
        <LangPg
          translations={t}
          tempLang={tl}
          setTempLang={setTl}
          onConfirm={() => {
            setLang(tl);
            setPage("landing");
          }}
          onBack={() => setPage("landing")}
        />
      )}

      {/* Detect */}
      {page === "detect" && (
        <DetectPg
          translations={t}
          lang={lang}
          onBack={() => setPage("landing")}
          onLanguageChange={openLang}
          user={user}
        />
      )}

      {/* Treatment */}
      {page === "treatment" && (
        <TreatPg
          translations={t}
          onBack={() => setPage("landing")}
          user={user}
        />
      )}

      {/* Community */}
      {page === "community" && (
        <CommPg
          translations={t}
          lang={lang}
          onBack={() => setPage("landing")}
          onLanguageChange={openLang}
          user={user}
        />
      )}

      {/* Auth */}
      {page === "auth" && (
        <AuthPg
          translations={t}
          step={step}
          name={name}
          setName={setName}
          phone={ap} 
          setPhone={setAp}
          otp={otp}
          setOtp={setOtp}
          onSuccess={(type) => {
            // STEP 1 → GET OTP
            if (type === "getOtp") {
              const cleanPhone = ap.replace(/\D/g, "");
              if (cleanPhone.length !== 10) {
                alert("Please enter a valid 10-digit phone number");
                return;
              }
              setStep("otp");
            }
            // STEP 2 → LOGIN
            if (type === "login") {
              handleAuth();
            }
          }}
          onBack={() => {
            if (step === "otp") {
              setStep("phone");
            } else {
              setPage("landing");
            }
          }}
        />
      )}

    </>
  );
}

export default App;