export default function Home() {
  const endpoints = [
    { method: "GET",  path: "/api/dashboard/summary",        desc: "Real-time dashboard stats" },
    { method: "POST", path: "/api/batches/calculate",        desc: "Recalculate FCR, biomass, DOC for all active batches" },
    { method: "GET",  path: "/api/batches/calculate?batchId=1", desc: "Get calculated stats for one batch" },
    { method: "POST", path: "/api/batches/doc-update",       desc: "Update Days of Culture for all active batches" },
    { method: "POST", path: "/api/water/check",              desc: "Check water quality & send SMS alerts" },
    { method: "POST", path: "/api/alerts/harvest",           desc: "Send harvest-ready SMS alerts" },
    { method: "POST", path: "/api/alerts/stock",             desc: "Check low stock & send SMS alerts" },
    { method: "POST", path: "/api/alerts/payment",           desc: "Send payment reminder SMS to farmers" },
    { method: "GET",  path: "/api/finance/report?month=2024-06", desc: "Monthly P&L report" },
    { method: "GET",  path: "/api/finance/batch?batchId=1",  desc: "Batch-level P&L breakdown" },
    { method: "POST", path: "/api/sms/send",                 desc: "Send custom SMS" },
    { method: "GET",  path: "/api/cron/daily",               desc: "Daily cron: DOC update + harvest alerts + summary SMS" },
    { method: "GET",  path: "/api/cron/water-check",         desc: "Water quality cron (every 6 hrs)" },
  ];

  const colors = { GET: "#00d4aa", POST: "#0099ff" };

  return (
    <div style={{ minHeight: "100vh", background: "#060e1f", fontFamily: "monospace", padding: "40px 48px", color: "#fff" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
          <span style={{ fontSize: 40 }}>🦐</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#00d4aa" }}>AquaNursery Pro — Backend API</h1>
            <p style={{ margin: 0, color: "#6b8299", fontSize: 13 }}>Next.js API Server · Supabase · MSG91 SMS</p>
          </div>
        </div>

        <div style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, padding: "12px 20px", marginBottom: 32, marginTop: 24 }}>
          <span style={{ color: "#00d4aa", fontSize: 13 }}>✅ Server running</span>
          <span style={{ color: "#3a5a7a", fontSize: 13, marginLeft: 16 }}>Configure .env.local to connect Supabase + MSG91</span>
        </div>

        <h2 style={{ color: "#8fafc2", fontSize: 14, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>API Endpoints</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {endpoints.map((e, i) => (
            <div key={i} style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ background: `${colors[e.method]}20`, color: colors[e.method], border: `1px solid ${colors[e.method]}40`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700, minWidth: 44, textAlign: "center" }}>
                {e.method}
              </span>
              <code style={{ color: "#fff", fontSize: 13, flex: 1 }}>{e.path}</code>
              <span style={{ color: "#6b8299", fontSize: 12 }}>{e.desc}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 32, background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, padding: "20px 24px" }}>
          <h3 style={{ color: "#f59e0b", margin: "0 0 12px", fontSize: 14 }}>⚙️ Setup Required</h3>
          <ol style={{ color: "#8fafc2", fontSize: 13, lineHeight: 2, margin: 0, paddingLeft: 20 }}>
            <li>Copy <code style={{ color: "#00d4aa" }}>.env.local.example</code> → <code style={{ color: "#00d4aa" }}>.env.local</code></li>
            <li>Add your Supabase <strong>Service Role Key</strong> (Dashboard → Settings → API)</li>
            <li>Add your <strong>MSG91 API Key</strong> from msg91.com</li>
            <li>Set <strong>MANAGER_PHONE</strong> and <strong>OWNER_PHONE</strong> (with country code)</li>
            <li>Run <code style={{ color: "#00d4aa" }}>npm run dev</code></li>
          </ol>
        </div>
      </div>
    </div>
  );
}
