// ─────────────────────────────────────────────────────────────────
//  AuthScreen — Login + Signup
//  Uses EXACT same design tokens as App.jsx. No new styles added.
//  Props: onAuth(user) — called on successful login or signup
// ─────────────────────────────────────────────────────────────────
import { useState, useRef, useEffect } from "react";
import { login, signup } from "./services/storage.js";

// Same tokens as App.jsx (copied so this file is self-contained)
const AC      = "#C8F535";
const AC_DIM  = "#6FA81A";
const AC_GLOW = "#C8F53518";
const BG      = "#060606";
const CARD    = "#0e0e0e";
const CARD2   = "#131313";
const BORDER  = "#1c1c1c";
const BORDER2 = "#252525";
const TEXT     = "#e8e8e8";
const MUTED    = "#454545";
const MUTED2   = "#686868";
const RED      = "#f87171";

function IcoEye({ size = 16, open }) {
  return open ? (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function IcoUser({ size = 18 }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function FormField({ label, type = "text", value, onChange, placeholder, rightSlot, error }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{
        fontSize: 10, fontFamily: "'DM Mono',monospace",
        letterSpacing: "0.12em", textTransform: "uppercase", color: MUTED2,
      }}>
        {label}
      </label>
      <div style={{
        display: "flex", alignItems: "center",
        background: CARD2, border: `1px solid ${error ? RED + "66" : BORDER}`,
        borderRadius: 10, overflow: "hidden",
        transition: "border-color 0.2s",
      }}>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={type === "password" ? "current-password" : type === "email" ? "email" : "name"}
          style={{
            flex: 1, background: "transparent", border: "none",
            padding: "11px 14px", color: TEXT, fontSize: 13,
            fontFamily: "'DM Sans',sans-serif",
          }}
        />
        {rightSlot}
      </div>
      {error && (
        <p style={{ fontSize: 11, color: RED, margin: 0, fontFamily: "'DM Sans',sans-serif" }}>{error}</p>
      )}
    </div>
  );
}

export default function AuthScreen({ onAuth }) {
  const [mode,    setMode]    = useState("login"); // "login" | "signup"
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [pass,    setPass]    = useState("");
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [fieldErr, setFieldErr] = useState({});
  const firstRef = useRef(null);

  useEffect(() => { firstRef.current?.focus(); }, [mode]);

  const switchMode = () => {
    setMode((m) => (m === "login" ? "signup" : "login"));
    setError(""); setFieldErr({});
    setName(""); setEmail(""); setPass("");
  };

  const validate = () => {
    const errs = {};
    if (mode === "signup" && !name.trim()) errs.name = "Name is required.";
    if (!email.trim()) errs.email = "Email is required.";
    else if (!email.includes("@")) errs.email = "Enter a valid email.";
    if (!pass.trim()) errs.password = "Password is required.";
    else if (mode === "signup" && pass.length < 6) errs.password = "Min 6 characters.";
    setFieldErr(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    setError("");
    if (!validate()) return;
    setLoading(true);

    // Tiny delay to show loading state (simulates async)
    setTimeout(() => {
      const result = mode === "login" ? login(email, pass) : signup(name, email, pass);
      setLoading(false);
      if (result.ok) {
        onAuth(result.user);
      } else {
        setError(result.error);
      }
    }, 300);
  };

  const handleKey = (e) => { if (e.key === "Enter") handleSubmit(); };

  return (
    <div style={{
      minHeight: "100vh", background: BG,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", fontFamily: "'DM Sans',sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { color-scheme: dark; }
        body { background: #060606; -webkit-font-smoothing: antialiased; }
        input { outline: none; }
        button { font-family: inherit; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .auth-card { animation: fadeUp 0.32s cubic-bezier(0.4,0,0.2,1); }
      `}</style>

      <div className="auth-card" style={{
        width: "100%", maxWidth: 420,
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 18,
        padding: "36px 32px",
        boxShadow: `0 0 60px ${AC_GLOW}`,
      }}>

        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{
            fontFamily: "'Cormorant Garamond',serif", fontWeight: 700,
            fontSize: 36, color: AC, letterSpacing: "0.02em", margin: 0,
          }}>
            ✦ ELEVATE
          </h1>
          <p style={{
            fontSize: 10, color: MUTED2, fontFamily: "'DM Mono',monospace",
            letterSpacing: "0.14em", marginTop: 4,
          }}>
            SELF-IMPROVEMENT TRACKER
          </p>
        </div>

        {/* Mode label */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{
            fontSize: 20, fontFamily: "'Cormorant Garamond',serif",
            fontWeight: 700, color: TEXT, margin: 0,
          }}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p style={{ fontSize: 12, color: MUTED2, marginTop: 4 }}>
            {mode === "login"
              ? "Sign in to continue your journey"
              : "Start your self-improvement journey"}
          </p>
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }} onKeyDown={handleKey}>

          {mode === "signup" && (
            <FormField
              label="Full Name"
              value={name}
              onChange={setName}
              placeholder="Your name"
              error={fieldErr.name}
            />
          )}

          <FormField
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            error={fieldErr.email}
          />

          <FormField
            label="Password"
            type={showPw ? "text" : "password"}
            value={pass}
            onChange={setPass}
            placeholder={mode === "signup" ? "Min 6 characters" : "Your password"}
            error={fieldErr.password}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: MUTED2, padding: "0 12px", display: "flex", alignItems: "center",
                  transition: "color 0.2s",
                }}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                <IcoEye size={15} open={showPw}/>
              </button>
            }
          />
        </div>

        {/* Global error */}
        {error && (
          <div style={{
            marginTop: 14, padding: "10px 14px",
            background: RED + "12", border: `1px solid ${RED}33`,
            borderRadius: 8, fontSize: 12, color: RED,
          }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%", marginTop: 22,
            background: loading ? AC_DIM : AC,
            color: "#000", border: "none", borderRadius: 10,
            padding: "13px", cursor: loading ? "wait" : "pointer",
            fontSize: 13, fontWeight: 700,
            fontFamily: "'DM Mono',monospace",
            letterSpacing: "0.08em", textTransform: "uppercase",
            transition: "background 0.2s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {loading ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                style={{ animation: "spin 0.8s linear infinite" }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              {mode === "login" ? "Signing in…" : "Creating account…"}
            </>
          ) : (
            <>
              <IcoUser size={14}/>
              {mode === "login" ? "Sign In" : "Create Account"}
            </>
          )}
        </button>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        {/* Switch mode */}
        <p style={{ textAlign: "center", fontSize: 12, color: MUTED2, marginTop: 20 }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={switchMode}
            style={{
              background: "none", border: "none", color: AC,
              cursor: "pointer", fontSize: 12, fontWeight: 600,
              padding: 0, textDecoration: "underline", textUnderlineOffset: 3,
            }}
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>

        {/* Demo hint */}
        <div style={{
          marginTop: 24, padding: "10px 14px",
          background: CARD2, border: `1px solid ${BORDER2}`,
          borderRadius: 8,
        }}>
          <p style={{ fontSize: 10, color: MUTED2, fontFamily: "'DM Mono',monospace",
            letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
            Quick start
          </p>
          <p style={{ fontSize: 11, color: MUTED2 }}>
            Sign up with any email — no verification needed.
            All data stays in your browser (localStorage).
          </p>
        </div>
      </div>
    </div>
  );
}
