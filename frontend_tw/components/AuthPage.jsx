import { GIcon } from "./GoogleIcon"; // Adjusted path assuming it's in the same folder now
import { useState } from "react";
import { useFarmerLocation } from "../src/hooks/useFarmerLocation"; // Importing the custom hook for location

export function AuthPg({
  translations,
  step,
  name,
  setName,
  phone,
  setPhone,
  otp,
  setOtp,
  onSuccess,
  onBack
}) {
  const { error, loading, getLocation } = useFarmerLocation();
  const handleGetOtp = async () => {
    try {
      const location = await getLocation();
      console.log("Location locked:", location.latitude, location.longitude);
    } catch (err) {
        console.error("Location scan failed:", err.message);
        alert("Location access is required to check local climate risks. Please allow access.");
        // Optional: add `return;` here if you want to block OTP generation without GPS.
    }

    try {
      const cleanedPhone = phone.replace(/\s/g, "");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/start_verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: `+91${cleanedPhone}` })
      });

      const data = await res.json();
      if (data.status === "pending") {
        onSuccess("getOtp");
      } else {
        alert("Failed to send OTP");
      }
    } catch (err) {
      console.error(err);
      alert("Server Error");
    }
  };

  const handleLogin = async () => {
    try {
      const cleanedPhone = phone.replace(/\s/g, "");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/check-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          phone_number: `+91${cleanedPhone}`,
          otp_code: otp
        })
      });

      const data = await res.json();
      
      if (res.status === 200) {
        localStorage.setItem("phone", `+91${cleanedPhone}`);
        localStorage.setItem("name", name);
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
        onSuccess("login");
      } else {
        alert("Invalid OTP");
      }
    } catch (err) {
      console.error(err);
      alert("Server Error");
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden font-sans bg-emerald-950">
      
      {/* Background Effect */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-800/40 via-transparent to-transparent"></div>

      {/* Auth Card */}
      <div className="relative z-10 w-full max-w-md p-10 mx-5 bg-white shadow-2xl rounded-3xl">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center w-10 h-10 text-xl rounded-lg bg-emerald-900 text-slate-50">
            🌿
          </div>
          <span className="text-2xl font-bold tracking-wide text-slate-900 font-serif">
            PlantDoc
          </span>
        </div>

        <h2 className="mb-1 text-2xl font-bold tracking-tight text-slate-900">
          {translations.welcome}
        </h2>
        <p className="mb-8 text-sm text-slate-500">
          {translations.communityDesc}
        </p>

        {/* STEP 1: PHONE INPUT */}
        {step === "phone" && (
          <div className="flex flex-col gap-5">
            <button 
              onClick={() => onSuccess("google")}
              className="flex items-center justify-center w-full gap-3 py-3 text-sm font-semibold transition-all bg-white border-2 rounded-xl text-slate-700 border-slate-200 hover:border-blue-500 hover:bg-blue-50"
            > <div className="flex items-center justify-center w-5 h-5">
                <GIcon />
              </div>
              {translations.continueGoogle}
            </button>

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-slate-200"></div>
              <span className="text-xs font-medium text-slate-400">{translations.orContinueWith}</span>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold tracking-wide text-slate-600">NAME</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 text-sm transition-all bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold tracking-wide text-slate-600 uppercase">{translations.phone}</label>
              <div className="flex items-center overflow-hidden bg-slate-50 border-2 border-slate-200 rounded-xl focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-600/10 transition-all">
                <span className="px-4 text-sm font-bold border-r-2 text-slate-600 border-slate-200 bg-slate-100 py-3">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="98765 43210"
                  maxLength={11}
                  value={phone}
                  onChange={(e) => {
                    let raw = e.target.value.replace(/\D/g, "");
                    if (raw.startsWith("91") && raw.length > 10) raw = raw.slice(2);
                    raw = raw.slice(0, 10);
                    const formatted = raw.length > 5 ? raw.slice(0, 5) + " " + raw.slice(5) : raw;
                    setPhone(formatted);
                  }}
                  className="w-full px-4 py-3 text-sm font-mono tracking-wider outline-none bg-transparent"
                />
              </div>
            </div>

            <button
              onClick={handleGetOtp}
              className="w-full py-4 mt-2 text-sm font-bold text-white transition-all bg-emerald-950 rounded-xl hover:bg-emerald-800 hover:-translate-y-0.5 hover:shadow-lg"
            >
              Get OTP →
            </button>
          </div>
        )}

        {/* STEP 2: OTP INPUT */}
        {step === "otp" && (
          <div className="flex flex-col gap-5">
            <div className="space-y-1">
              <label className="text-xs font-bold tracking-wide text-slate-600">ENTER OTP</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="7-digit OTP"
                maxLength={7}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 7))}
                className="w-full px-4 py-3 text-lg font-mono tracking-widest text-center transition-all bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
              />
            </div>

            <button
              onClick={handleLogin}
              className="w-full py-4 mt-2 text-sm font-bold text-white transition-all bg-emerald-950 rounded-xl hover:bg-emerald-800 hover:-translate-y-0.5 hover:shadow-lg"
            >
              Login →
            </button>
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={onBack}
          className="w-full py-3 mt-4 text-sm font-semibold transition-colors border-2 bg-transparent rounded-xl text-slate-600 border-slate-200 hover:bg-slate-50"
        >
          {translations.back}
        </button>

      </div>
    </div>
  );
}