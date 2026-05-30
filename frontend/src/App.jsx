import { useState } from "react";

import "./App.css";
import "../styles/Detect.css";
import "../styles/Profile.css";
import "../styles/Shell.css";
import "../styles/Landing.css";
import "../styles/Community.css";
import "../styles/Treatment.css";
import "../styles/Auth.css";

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
        "http://127.0.0.1:5000/profile",
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
          t={t}
          lang={lang}
          go={go}
          openLang={openLang}
          user={user}
        />
      )}

      {/* Language */}
      {page === "language" && (
        <LangPg
          t={t}
          tl={tl}
          setTl={setTl}
          ok={() => {
            setLang(tl);
            setPage("landing");
          }}
          back={() => setPage("landing")}
        />
      )}

      {/* Detect */}
      {page === "detect" && (
        <DetectPg
          t={t}
          lang={lang}
          back={() => setPage("landing")}
          onLang={openLang}
          user={user}
        />
      )}

      {/* Treatment */}
      {page === "treatment" && (
        <TreatPg
          t={t}
          back={() => setPage("landing")}
          user={user}
        />
      )}

      {/* Community */}
      {page === "community" && (
        <CommPg
          t={t}
          lang={lang}
          back={() => setPage("landing")}
          onLang={openLang}
          user={user}
        />
      )}

      {/* Auth */}
      {page === "auth" && (
        <AuthPg
          t={t}

          step={step}
          name={name}
          setName={setName}

          ap={ap}
          setAp={setAp}

          otp={otp}
          setOtp={setOtp}

          ok={(type) => {

            // STEP 1 → GET OTP
            if (type === "getOtp") {

              const cleanPhone =
                ap.replace(/\D/g, "");

              if (cleanPhone.length !== 10) {
                alert(
                  "Please enter a valid 10-digit phone number"
                );
                return;
              }

              setStep("otp");
            }

            // STEP 2 → LOGIN
            if (type === "login") {

              // OTP validation here if needed

              handleAuth();
            }
          }}

          back={() => {

            // Back from OTP page
            if (step === "otp") {
              setStep("phone");
            }

            // Back from auth page
            else {
              setPage("landing");
            }
          }}
        />
      )}

    </>
  );
}

export default App;