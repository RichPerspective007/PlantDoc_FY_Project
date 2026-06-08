import { GIcon } from "./GoogleIcon";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../src/context/AppContext";
import { useFarmerLocation } from "../src/hooks/useFarmerLocation";

export function AuthPg() {
  // Global tools replacing the old props
  const { translations, login } = useAppContext();
  const navigate = useNavigate();
  const { getLocation } = useFarmerLocation();

  // Local state replacing the old props
  const [step, setStep] = useState("phone");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [existingUser, setExistingUser] = useState(false); // To track if user already exists after OTP request
  
  // Internal loading/error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGetOtp = async () => {
    if (phone.replace(/\s/g, "").length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Force GPS Lock before allowing registration
      await getLocation();

      const cleanedPhone = phone.replace(/\s/g, "");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/start_verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: `+91${cleanedPhone}`, channel: "sms" })
      });

      const data = await res.json();
      if (res.ok || data.status === "pending") {
        if (data.existing_user) {
          setName(data.name); // Pre-fill name if user already exists
          setExistingUser(true);
        }
        setStep("otp");
      } else {
        throw new Error("Failed to send OTP");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.message === "Geolocation is not supported by your browser." || err.message.includes("allow location")
          ? "Location access is strictly required to secure your local outbreak data."
          : "Server error during OTP request."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!otp) return;
    setLoading(true);
    setError(null);

    try {
      const cleanedPhone = phone.replace(/\s/g, "");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/check-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          phone_number: `+91${cleanedPhone}`,
          otp_code: otp
        }),
        credentials: "include"
      });

      const data = await res.json();
      
      if (res.status === 200) {
        //localStorage.setItem("phone_number", `+91${cleanedPhone}`);
        localStorage.setItem("name", name);
        /*if (data.token) {
          localStorage.setItem("token", data.token);
        } else {
          localStorage.setItem("token", "verified_session_active");
        }*/
        
        // 2. Push to Global Context
        login({ name, phone_number: `+91${cleanedPhone}` });

        // 3. Navigate to Detect Page (replaces 'onSuccess("login")')
        navigate("/detect", { replace: true });
      } else {
        throw new Error("Invalid OTP. Please check and try again.");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Server Error");
    } finally {
      setLoading(false);
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
        <p className="mb-6 text-sm text-slate-500">
          {translations.communityDesc}
        </p>

        {/* Error Display */}
        {error && (
          <div className="p-3 mb-6 text-sm font-medium text-red-700 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
            {error}
          </div>
        )}

        {/* STEP 1: PHONE INPUT */}
        {step === "phone" && (
          <div className="flex flex-col gap-5">
            <button 
              onClick={() => alert("Google Auth not yet wired up!")}
              className="flex items-center justify-center w-full gap-3 py-3 text-sm font-semibold transition-all bg-white border-2 rounded-xl text-slate-700 border-slate-200 hover:border-blue-500 hover:bg-blue-50"
            > 
              <div className="flex items-center justify-center w-5 h-5">
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
              disabled={loading}
              className={`w-full py-4 mt-2 text-sm font-bold text-white transition-all rounded-xl ${
                loading ? "bg-emerald-700 cursor-not-allowed" : "bg-emerald-950 hover:bg-emerald-800 hover:-translate-y-0.5 hover:shadow-lg"
              }`}
            >
              {loading ? "Sending..." : "Get OTP →"}
            </button>
          </div>
        )}

        {/* STEP 2: OTP INPUT */}
        {step === "otp" && (
          
          <div className="flex flex-col gap-5">
            <div className="space-y-1">
              <label className="text-xs font-bold tracking-wide text-slate-600">NAME</label>
              <input
                type="text"
                placeholder={existingUser ? name : "Enter your name"}
                disabled={existingUser} // Disable if user already exists
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 text-sm transition-all bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
              />
            </div>

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
              disabled={loading}
              className={`w-full py-4 mt-2 text-sm font-bold text-white transition-all rounded-xl flex items-center justify-center gap-2 ${
                loading ? "bg-emerald-700 cursor-not-allowed" : "bg-emerald-950 hover:bg-emerald-800 hover:-translate-y-0.5 hover:shadow-lg"
              }`}
            >
              {loading ? <span className="animate-spin">⏳</span> : "Login →"}
            </button>
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="w-full py-3 mt-4 text-sm font-semibold transition-colors border-2 bg-transparent rounded-xl text-slate-600 border-slate-200 hover:bg-slate-50"
        >
          {translations.back}
        </button>

      </div>
    </div>
  );
}