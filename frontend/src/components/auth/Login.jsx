import { useState } from "react";
import { supabase } from "../../lib/supabase.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)",
      padding: "1rem"
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 64, height: 64, background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            borderRadius: 16, marginBottom: 16, boxShadow: "0 8px 32px rgba(99,102,241,0.4)"
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/>
            </svg>
          </div>
          <h1 style={{ color: "#f8fafc", fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>ModularPro</h1>
          <p style={{ color: "#94a3b8", marginTop: 6, fontSize: 14 }}>Interior Factory Management Platform</p>
        </div>

        {/* Card */}
        <div style={{
          background: "#1e293b", borderRadius: 20, padding: "2rem",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)", border: "1px solid #334155"
        }}>
          <h2 style={{ color: "#f1f5f9", fontSize: 20, fontWeight: 600, marginBottom: 6 }}>Sign In</h2>
          <p style={{ color: "#64748b", fontSize: 13, marginBottom: 24 }}>Access your factory workspace</p>

          {error && (
            <div style={{
              background: "#450a0a", border: "1px solid #dc2626", borderRadius: 10,
              padding: "10px 14px", marginBottom: 16, color: "#fca5a5", fontSize: 13
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: "#94a3b8", fontSize: 12, fontWeight: 600,
                letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                required placeholder="you@factory.com"
                style={{
                  width: "100%", padding: "10px 14px", background: "#0f172a",
                  border: "1px solid #334155", borderRadius: 10, color: "#f1f5f9",
                  fontSize: 14, transition: "border-color 0.2s"
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", color: "#94a3b8", fontSize: 12, fontWeight: 600,
                letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)}
                  required placeholder="••••••••"
                  style={{
                    width: "100%", padding: "10px 42px 10px 14px", background: "#0f172a",
                    border: "1px solid #334155", borderRadius: 10, color: "#f1f5f9", fontSize: 14
                  }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 4
                  }}>
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{
                width: "100%", padding: "12px", background: loading
                  ? "#334155" : "linear-gradient(135deg, #3b82f6, #6366f1)",
                border: "none", borderRadius: 10, color: "white", fontSize: 15,
                fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                transition: "opacity 0.2s", boxShadow: loading ? "none" : "0 4px 16px rgba(99,102,241,0.4)"
              }}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p style={{ color: "#475569", fontSize: 12, textAlign: "center", marginTop: 20 }}>
            Trouble signing in? Contact your factory administrator.
          </p>
        </div>

        <p style={{ color: "#334155", fontSize: 12, textAlign: "center", marginTop: 16 }}>
          © 2025 ModularPro · Multi-Tenant Factory SaaS
        </p>
      </div>
    </div>
  );
}
