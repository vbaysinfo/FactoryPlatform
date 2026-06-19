import { useState } from "react";
import { supabase } from "../../lib/supabase.js";

export default function Login() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [mode,     setMode]     = useState("login"); // "login" | "register" | "reset"

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "register") {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setError("Check your email for a confirmation link.");
      } else if (mode === "reset") {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email);
        if (err) throw err;
        setError("Password reset email sent.");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  const isReset = mode === "reset";

  return (
    <div style={{
      minHeight:"100vh", background:"#060e1f",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"'Inter',sans-serif",
    }}>
      <div style={{
        background:"#0d1b2e", border:"1px solid #1e3a5f",
        borderRadius:16, padding:"40px 48px", width:400, maxWidth:"90vw",
        boxShadow:"0 20px 60px rgba(0,0,0,0.6)",
      }}>
        {/* Logo / Title */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{
            width:56, height:56, borderRadius:14,
            background:"linear-gradient(135deg,#00d4aa,#0099ff)",
            display:"flex", alignItems:"center", justifyContent:"center",
            margin:"0 auto 16px", fontSize:28,
          }}>🦐</div>
          <h1 style={{ color:"#fff", margin:0, fontSize:22, fontWeight:700 }}>
            AquaNursery Pro
          </h1>
          <p style={{ color:"#6b8299", margin:"6px 0 0", fontSize:13 }}>
            Aqua Nursery Management System
          </p>
        </div>

        {/* Mode tabs */}
        <div style={{ display:"flex", gap:4, marginBottom:28, background:"#0a1628", borderRadius:8, padding:4 }}>
          {["login","register"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); }}
              style={{
                flex:1, padding:"8px 0", border:"none", borderRadius:6, cursor:"pointer",
                fontSize:13, fontWeight:600, transition:"all .2s",
                background: mode === m ? "linear-gradient(135deg,#00d4aa,#0099ff)" : "transparent",
                color: mode === m ? "#fff" : "#6b8299",
              }}>
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:"block", color:"#8fafc2", fontSize:12, fontWeight:600, marginBottom:6, letterSpacing:.5, textTransform:"uppercase" }}>
              Email Address
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required placeholder="your@email.com"
              style={{
                width:"100%", padding:"10px 14px", boxSizing:"border-box",
                background:"#0a1628", border:"1px solid #1e3a5f", borderRadius:8,
                color:"#fff", fontSize:14, outline:"none",
              }}
            />
          </div>

          {/* Password */}
          {!isReset && (
            <div style={{ marginBottom:8 }}>
              <label style={{ display:"block", color:"#8fafc2", fontSize:12, fontWeight:600, marginBottom:6, letterSpacing:.5, textTransform:"uppercase" }}>
                Password
              </label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                required={!isReset} placeholder="••••••••" minLength={6}
                style={{
                  width:"100%", padding:"10px 14px", boxSizing:"border-box",
                  background:"#0a1628", border:"1px solid #1e3a5f", borderRadius:8,
                  color:"#fff", fontSize:14, outline:"none",
                }}
              />
            </div>
          )}

          {/* Forgot password link */}
          {mode === "login" && (
            <div style={{ textAlign:"right", marginBottom:20 }}>
              <button type="button" onClick={() => { setMode("reset"); setError(""); }}
                style={{ background:"none", border:"none", color:"#00d4aa", fontSize:12, cursor:"pointer", padding:0 }}>
                Forgot password?
              </button>
            </div>
          )}

          {/* Error / info message */}
          {error && (
            <div style={{
              background: error.includes("sent") || error.includes("Check") ? "#0a2e1a" : "#2e0a0a",
              border: `1px solid ${error.includes("sent") || error.includes("Check") ? "#00d4aa" : "#e74c3c"}`,
              borderRadius:8, padding:"10px 14px", marginBottom:16,
              color: error.includes("sent") || error.includes("Check") ? "#00d4aa" : "#e74c3c",
              fontSize:13,
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading} style={{
            width:"100%", padding:"12px", border:"none", borderRadius:8, cursor:"pointer",
            background:"linear-gradient(135deg,#00d4aa,#0099ff)", color:"#fff",
            fontSize:15, fontWeight:700, letterSpacing:.3,
            opacity: loading ? .7 : 1, transition:"opacity .2s",
          }}>
            {loading ? "Please wait…" : mode === "login" ? "Sign In" : mode === "register" ? "Create Account" : "Send Reset Link"}
          </button>

          {mode === "reset" && (
            <button type="button" onClick={() => { setMode("login"); setError(""); }}
              style={{ width:"100%", marginTop:10, padding:"10px", border:"1px solid #1e3a5f", borderRadius:8, cursor:"pointer", background:"transparent", color:"#8fafc2", fontSize:13 }}>
              Back to Sign In
            </button>
          )}
        </form>

        <p style={{ textAlign:"center", color:"#3a5a7a", fontSize:12, margin:"24px 0 0" }}>
          © 2024 AquaNursery Pro · Secure Login
        </p>
      </div>
    </div>
  );
}
