import { GIcon } from "../components/GoogleIcon";

export function AuthPg({
  t,
  step,
  name,
  setName,
  ap,
  setAp,
  otp,
  setOtp,
  ok,
  back
}) {

  // ================= GET OTP =================

  const handleGetOtp = async () => {

    try {

      const cleanedPhone = ap.replace(/\s/g, "");

      const res = await fetch(
        "http://127.0.0.1:5000/start_verification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            phone_number: `+91${cleanedPhone}`
          })
        }
      );

      const data = await res.json();

      console.log(data);

      if (data.status === "pending") {

        ok("getOtp");

      } else {

        alert("Failed to send OTP");
      }

    } catch (err) {

      console.error(err);
      alert("Server Error");
    }
  };

  // ================= LOGIN =================

  const handleLogin = async () => {

    try {

      const cleanedPhone = ap.replace(/\s/g, "");

      const res = await fetch(
        "http://127.0.0.1:5000/check-verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: name,
            phone_number: `+91${cleanedPhone}`,
            otp_code: otp
          })
        }
      );

      const data = await res.json();

      console.log(data);

      if (res.status === 200) {

        alert("Login Successful");

        // Save user data locally
        localStorage.setItem(
          "phone",
          `+91${cleanedPhone}`
        );

        localStorage.setItem(
          "name",
          name
        );

        // If backend sends JWT token
        if (data.token) {

          localStorage.setItem(
            "token",
            data.token
          );
        }

        ok("login");

      } else {

        alert("Invalid OTP");
      }

    } catch (err) {

      console.error(err);
      alert("Server Error");
    }
  };

  return (

    <div className="auth-wrap">

      <div className="auth-card">

        {/* LOGO */}

        <div className="auth-logo">

          <div className="auth-lm">
            🌿
          </div>

          <span className="auth-lt">
            PlantDoc
          </span>

        </div>

        {/* TITLE */}

        <h2 className="auth-title">
          {t.welcome}
        </h2>

        <p className="auth-sub">
          {t.communityDesc}
        </p>

        {/* ================= PHONE STEP ================= */}

        {step === "phone" && (

          <>

            {/* GOOGLE BUTTON */}

            <button
              className="g-btn"
              onClick={() => ok("google")}
            >
              <GIcon />

              {t.continueGoogle}

            </button>

            {/* DIVIDER */}

            <div className="divider">

              <div className="div-l" />

              <span className="div-t">
                {t.orContinueWith}
              </span>

              <div className="div-l" />

            </div>

            {/* NAME FIELD */}

            <div className="fg">

              <label className="fl">
                Name
              </label>

              <input
                className="fi"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
              />

            </div>

            {/* PHONE FIELD */}

            <div className="fg">

              <label className="fl">
                {t.phone}
              </label>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1.5px solid #d1d5db",
                  borderRadius: "8px",
                  overflow: "hidden"
                }}
              >

                {/* +91 */}

                <span
                  style={{
                    padding: "0 10px 0 12px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                    background: "#f3f4f6",
                    borderRight: "1.5px solid #d1d5db",
                    height: "44px",
                    display: "flex",
                    alignItems: "center",
                    userSelect: "none",
                    whiteSpace: "nowrap"
                  }}
                >
                  +91
                </span>

                {/* PHONE INPUT */}

                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="9876543210"
                  maxLength={11}
                  value={ap}
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    padding: "0 12px",
                    fontSize: "14px",
                    fontFamily: "monospace",
                    letterSpacing: "1.5px",
                    height: "44px",
                    color: "#374151",
                    background: "#f3f4f6"
                  }}
                  onChange={(e) => {

                    let raw = e.target.value.replace(/\D/g, "");

                    if (
                      raw.startsWith("91") &&
                      raw.length > 10
                    ) {
                      raw = raw.slice(2);
                    }

                    raw = raw.slice(0, 10);

                    const formatted =
                      raw.length > 5
                        ? raw.slice(0, 5) + " " + raw.slice(5)
                        : raw;

                    setAp(formatted);
                  }}
                />

              </div>

            </div>

            {/* GET OTP BUTTON */}

            <button
              className="auth-sub-btn"
              onClick={handleGetOtp}
            >
              Get OTP →
            </button>

          </>
        )}

        {/* ================= OTP STEP ================= */}

        {step === "otp" && (

          <>

            <div className="fg">

              <label className="fl">
                Enter OTP
              </label>

              <input
                className="fi"
                type="text"
                inputMode="numeric"
                placeholder="7-digit OTP"
                maxLength={7}
                value={otp}
                onChange={(e) =>
                  setOtp(
                    e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 7)
                  )
                }
              />

            </div>

            {/* LOGIN BUTTON */}

            <button
              className="auth-sub-btn"
              onClick={handleLogin}
            >
              Login →
            </button>

          </>
        )}

        {/* BACK BUTTON */}

        <button
          className="auth-back"
          onClick={back}
        >
          {t.back}
        </button>

      </div>

    </div>
  );
}