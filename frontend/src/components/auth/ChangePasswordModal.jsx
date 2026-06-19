import { useState } from "react";
import { api } from "../../lib/api.js";
import { useApp } from "../../context/AppContext.jsx";

export default function ChangePasswordModal() {
  const { addNotification, refreshUser, signOut } = useApp();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (pw.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (pw !== pw2) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      await api.post("/api/auth/change-password", { new_password: pw });
      addNotification("Password changed successfully. Welcome!");
      await refreshUser();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
    }}>
      <div style={{
        background: "#1e293b", borderRadius: 20, padding: "2rem", width: "100%", maxWidth: 440,
        border: "1px solid #334155", boxShadow: "0 24px 64px rgba(0,0,0,0.5)"
      }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 56, height: 56, background: "linear-gradient(135deg,#f59e0b,#ef4444)",
            borderRadius: 14, marginBottom: 16
          }}>
            <span style={{ fontSize: 28 }}>🔐</span>
          </div>
          <h2 style={{ color: "#f1f5f9", fontSize: 20, fontWeight: 700 }}>Set Your Password</h2>
          <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 6 }}>
            You're using a temporary password. Please set a secure password to continue.
          </p>
        </div>

        {error && (
          <div style={{ background: "#450a0a", border: "1px solid #dc2626", borderRadius: 10, padding: "10px 14px", marginBottom: 16, color: "#fca5a5", fontSize: 13 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#94a3b8", fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>
              New Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"} value={pw}
                onChange={e => setPw(e.target.value)} required minLength={8}
                placeholder="Min. 8 characters"
                style={{ width: "100%", padding: "10px 42px 10px 14px", background: "#0f172a", border: "1px solid #334155", borderRadius: 10, color: "#f1f5f9", fontSize: 14, boxSizing: "border-box" }}
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 4 }}>
                {showPw ? "🙈" : "👁"}
              </button>
            </div>
            {pw && (
              <div style={{ marginTop: 8, display: "flex", gap: 4 }}>
                {[pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^a-zA-Z0-9]/.test(pw)].map((ok, i) => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: ok ? "#10b981" : "#334155" }} />
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", color: "#94a3b8", fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>
              Confirm Password
            </label>
            <input
              type={showPw ? "text" : "password"} value={pw2}
              onChange={e => setPw2(e.target.value)} required
              placeholder="Re-enter password"
              style={{
                width: "100%", padding: "10px 14px", background: "#0f172a",
                border: `1px solid ${pw2 && pw2 !== pw ? "#dc2626" : "#334155"}`,
                borderRadius: 10, color: "#f1f5f9", fontSize: 14, boxSizing: "border-box"
              }}
            />
          </div>

          <button type="submit" disabled={loading}
            style={{
              width: "100%", padding: 12, background: loading ? "#334155" : "linear-gradient(135deg,#3b82f6,#6366f1)",
              border: "none", borderRadius: 10, color: "white", fontSize: 15, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer", marginBottom: 12
            }}>
            {loading ? "Saving..." : "Set Password & Continue"}
          </button>

          <button type="button" onClick={signOut}
            style={{ width: "100%", padding: 10, background: "none", border: "none", color: "#64748b", fontSize: 13, cursor: "pointer" }}>
            Sign out instead
          </button>
        </form>
      </div>
    </div>
  );
}
