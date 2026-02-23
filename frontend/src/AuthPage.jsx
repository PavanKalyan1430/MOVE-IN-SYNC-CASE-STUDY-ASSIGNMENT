// AuthPage.jsx — complete file, ready to use as-is
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = "http://localhost:3000";

// ── Design tokens — same dark/green palette as the map popup ─────────────────
const T = {
  bg:          "#060d0d",
  surface:     "rgba(15,23,18,0.95)",
  border:      "rgba(16,185,129,0.18)",
  green:       "#10b981",
  greenGlow:   "rgba(16,185,129,0.25)",
  greenDim:    "rgba(16,185,129,0.12)",
  textPrimary: "#e2faf2",
  textMuted:   "#5a7a6a",
  error:       "#f87171",
  errorDim:    "rgba(248,113,113,0.1)",
};

export default function AuthPage() {
  const navigate = useNavigate();

  // "login" | "register"
  const [mode,     setMode]     = useState("login");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [success,  setSuccess]  = useState(null);

  // form fields
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");

  const isLogin = mode === "login";

  // ── Switch tabs, reset everything ────────────────────────────────────────
  const switchMode = (m) => {
    setMode(m);
    setError(null);
    setSuccess(null);
    setName("");
    setEmail("");
    setPassword("");
  };

  // ── Form submit ───────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (isLogin) {
        // LOGIN — POST /auth/login
        const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
        const { token, user } = res.data.data;

        // Persist JWT so VehicleMap and other routes can send it
        localStorage.setItem("token", token);
        localStorage.setItem("user",  JSON.stringify(user));

        setSuccess(`Welcome back, ${user.name}!`);

        // Short delay so the user sees the success banner, then redirect
        setTimeout(() => navigate("/map"), 800);

      } else {
        // REGISTER — POST /auth/register
        await axios.post(`${API_BASE}/auth/register`, { name, email, password });
        setSuccess("Account created! Redirecting to login…");

        // Auto-switch to login tab after registration
        setTimeout(() => switchMode("login"), 1800);
      }
    } catch (err) {
      // Show the server's error message (e.g. "Invalid email or password")
      setError(err.response?.data?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: ${T.bg};
          font-family: 'DM Mono', monospace;
          color: ${T.textPrimary};
          min-height: 100vh;
        }

        @keyframes fadeUp   { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
        @keyframes gridMove { from { background-position:0 0 } to { background-position:40px 40px } }
        @keyframes spin     { to { transform:rotate(360deg) } }

        .auth-input {
          width: 100%;
          background: rgba(16,185,129,0.05);
          border: 1px solid ${T.border};
          border-radius: 10px;
          padding: 13px 16px;
          color: ${T.textPrimary};
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .auth-input::placeholder { color: ${T.textMuted}; }
        .auth-input:focus {
          border-color: ${T.green};
          box-shadow: 0 0 0 3px ${T.greenDim};
        }

        .auth-btn {
          width: 100%;
          padding: 14px;
          background: ${T.green};
          color: #fff;
          border: none;
          border-radius: 10px;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 1px;
          cursor: pointer;
          transition: opacity 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 20px ${T.greenGlow};
        }
        .auth-btn:hover:not(:disabled) { opacity: 0.88; box-shadow: 0 6px 28px ${T.greenGlow}; }
        .auth-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .tab-btn {
          flex: 1;
          padding: 10px 0;
          background: none;
          border: none;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          letter-spacing: 1.5px;
          cursor: pointer;
          transition: color 0.2s;
          text-transform: uppercase;
        }
      `}</style>

      {/* ── Animated grid background ─────────────────────────────────────── */}
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backgroundImage: `
          linear-gradient(rgba(16,185,129,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(16,185,129,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
        animation: "gridMove 8s linear infinite",
      }}>

        {/* ── Card ──────────────────────────────────────────────────────── */}
        <div style={{
          width: "100%",
          maxWidth: 400,
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 20,
          padding: "36px 32px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
          animation: "fadeUp 0.4s ease both",
          backdropFilter: "blur(20px)",
        }}>

          {/* Brand */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: T.greenDim,
              border: `1.5px solid ${T.green}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 14px",
              fontSize: 24,
              boxShadow: `0 0 20px ${T.greenGlow}`,
            }}>
              🚗
            </div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>
              MoveInSync
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4, letterSpacing: 2 }}>
              FLEET TRACKING PORTAL
            </div>
          </div>

          {/* ── Tab switcher ────────────────────────────────────────────── */}
          <div style={{
            display: "flex",
            background: "rgba(0,0,0,0.3)",
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            padding: 4,
            marginBottom: 28,
            position: "relative",
          }}>
            {/* Sliding green pill */}
            <div style={{
              position: "absolute",
              top: 4, bottom: 4,
              left: isLogin ? 4 : "calc(50%)",
              width: "calc(50% - 4px)",
              background: T.greenDim,
              border: `1px solid ${T.border}`,
              borderRadius: 7,
              transition: "left 0.25s cubic-bezier(0.4,0,0.2,1)",
              pointerEvents: "none",
            }} />
            <button className="tab-btn" onClick={() => switchMode("login")}
              style={{ color: isLogin ? T.green : T.textMuted, zIndex: 1 }}>
              Login
            </button>
            <button className="tab-btn" onClick={() => switchMode("register")}
              style={{ color: !isLogin ? T.green : T.textMuted, zIndex: 1 }}>
              Register
            </button>
          </div>

          {/* ── Form ────────────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Name — only shown on register tab */}
            {!isLogin && (
              <Field label="Full Name">
                <input className="auth-input" type="text" placeholder="John Doe"
                  value={name} onChange={e => setName(e.target.value)}
                  required autoComplete="name" />
              </Field>
            )}

            <Field label="Email Address">
              <input className="auth-input" type="email" placeholder="you@company.com"
                value={email} onChange={e => setEmail(e.target.value)}
                required autoComplete="email" />
            </Field>

            <Field label="Password">
              <input className="auth-input" type="password"
                placeholder={isLogin ? "Enter your password" : "Min. 6 characters"}
                value={password} onChange={e => setPassword(e.target.value)}
                required minLength={isLogin ? undefined : 6}
                autoComplete={isLogin ? "current-password" : "new-password"} />
            </Field>

            {/* Error banner */}
            {error && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 14px",
                background: T.errorDim,
                border: "1px solid rgba(248,113,113,0.25)",
                borderRadius: 8, fontSize: 12, color: T.error,
              }}>
                <span>⚠</span> {error}
              </div>
            )}

            {/* Success banner */}
            {success && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 14px",
                background: T.greenDim,
                border: `1px solid ${T.border}`,
                borderRadius: 8, fontSize: 12, color: T.green,
              }}>
                <span>✓</span> {success}
              </div>
            )}

            {/* Submit */}
            <button className="auth-btn" type="submit" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? <Spinner /> : isLogin ? "SIGN IN →" : "CREATE ACCOUNT →"}
            </button>
          </form>

          {/* Bottom switch link */}
          <div style={{ textAlign: "center", marginTop: 22, fontSize: 12, color: T.textMuted }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => switchMode(isLogin ? "register" : "login")} style={{
              background: "none", border: "none", color: T.green, cursor: "pointer",
              fontFamily: "'DM Mono', monospace", fontSize: 12,
              textDecoration: "underline", textUnderlineOffset: 3,
            }}>
              {isLogin ? "Register here" : "Sign in"}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, letterSpacing: 1.5, color: T.textMuted, textTransform: "uppercase" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <span style={{
      display: "inline-block", width: 14, height: 14,
      border: "2px solid rgba(255,255,255,0.3)",
      borderTopColor: "#fff", borderRadius: "50%",
      animation: "spin 0.7s linear infinite", verticalAlign: "middle",
    }} />
  );
}