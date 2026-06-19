import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { api } from "../../lib/api.js";
import { useApp } from "../../context/AppContext.jsx";
import { Card, StatCard, Spinner, Badge, statusColor } from "../common/ui.jsx";

function fmt(n) {
  if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L";
  if (n >= 1000) return "₹" + (n / 1000).toFixed(1) + "K";
  return "₹" + Math.round(n);
}

function AlertBanner({ alerts }) {
  if (!alerts.length) return null;
  return (
    <div style={{ marginBottom: 20 }}>
      {alerts.map((a, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
          background: a.type === "error" ? "#fef2f2" : "#fffbeb",
          border: `1px solid ${a.type === "error" ? "#fecaca" : "#fde68a"}`,
          borderRadius: 10, marginBottom: 8, fontSize: 13,
          color: a.type === "error" ? "#dc2626" : "#92400e"
        }}>
          <span>{a.type === "error" ? "🔴" : "⚠️"}</span>
          <span style={{ fontWeight: 500 }}>{a.message}</span>
        </div>
      ))}
    </div>
  );
}

function RevenueChart({ data }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.invoiced), 1);
  return (
    <Card style={{ padding: 20 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Revenue (Last 6 Months)</h3>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 120 }}>
        {data.map(d => (
          <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: "100%", position: "relative", flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 2 }}>
              <div style={{ width: "100%", height: `${(d.received / max) * 100}%`, minHeight: d.received > 0 ? 4 : 0, background: "#10b981", borderRadius: "4px 4px 0 0" }} title={`Received: ${fmt(d.received)}`} />
              <div style={{ width: "100%", height: `${((d.invoiced - d.received) / max) * 100}%`, minHeight: (d.invoiced - d.received) > 0 ? 4 : 0, background: "#3b82f6", borderRadius: "4px 4px 0 0", opacity: 0.4 }} title={`Invoiced: ${fmt(d.invoiced)}`} />
            </div>
            <span style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap" }}>
              {d.month.slice(5)}
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
        {[["#10b981","Received"],["#3b82f6","Invoiced (pending)"]].map(([color, label]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748b" }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />{label}
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { tenant, navigate } = useApp();
  const [stats, setStats] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant) return;
    loadDashboard();
  }, [tenant]);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [
        { count: clientCount },
        { count: projectCount },
        { count: activeJobs },
        { count: pendingDispatch },
        { data: projects },
        { data: invoiceData },
        { data: lowStock },
        { data: overdueMaint },
        { data: pendingValidation },
      ] = await Promise.all([
        supabase.from("clients").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id).eq("is_active", true),
        supabase.from("projects").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id),
        supabase.from("production_jobs").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id).eq("status", "in_progress"),
        supabase.from("dispatch_orders").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id).in("status", ["pending","scheduled"]),
        supabase.from("projects").select("*, clients(name)").eq("tenant_id", tenant.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("invoices").select("grand_total, amount_paid, amount_due, invoice_date").eq("tenant_id", tenant.id),
        supabase.from("inventory_items").select("name, current_stock, reorder_level").eq("tenant_id", tenant.id).eq("is_active", true),
        supabase.from("machines").select("name, next_service_date").eq("tenant_id", tenant.id).eq("is_active", true).not("next_service_date", "is", null).lte("next_service_date", new Date().toISOString().split("T")[0]),
        supabase.from("cut_list_revisions").select("id").eq("tenant_id", tenant.id).eq("status", "confirmed"),
      ]);

      const totalInvoiced = (invoiceData || []).reduce((s, i) => s + (i.grand_total || 0), 0);
      const totalReceived = (invoiceData || []).reduce((s, i) => s + (i.amount_paid || 0), 0);
      const totalDue = (invoiceData || []).reduce((s, i) => s + (i.amount_due || 0), 0);
      setStats({ clientCount, projectCount, activeJobs, pendingDispatch, totalInvoiced, totalReceived, totalDue });
      setRecentProjects(projects || []);

      // Build revenue chart
      const monthMap = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthMap[key] = { month: key, invoiced: 0, received: 0 };
      }
      (invoiceData || []).forEach(inv => {
        if (!inv.invoice_date) return;
        const key = inv.invoice_date.slice(0, 7);
        if (monthMap[key]) { monthMap[key].invoiced += inv.grand_total || 0; monthMap[key].received += inv.amount_paid || 0; }
      });
      setRevenue(Object.values(monthMap));

      // Build alerts
      const newAlerts = [];
      const lowStockItems = (lowStock || []).filter(i => i.current_stock <= i.reorder_level);
      if (lowStockItems.length > 0) newAlerts.push({ type: "warning", message: `${lowStockItems.length} inventory item${lowStockItems.length > 1 ? "s" : ""} below reorder level: ${lowStockItems.slice(0,2).map(i => i.name).join(", ")}${lowStockItems.length > 2 ? "..." : ""}` });
      if ((overdueMaint || []).length > 0) newAlerts.push({ type: "error", message: `${overdueMaint.length} machine${overdueMaint.length > 1 ? "s" : ""} overdue for maintenance: ${overdueMaint.slice(0,2).map(m => m.name).join(", ")}` });
      if ((pendingValidation || []).length > 0) newAlerts.push({ type: "warning", message: `${pendingValidation.length} cut list${pendingValidation.length > 1 ? "s" : ""} awaiting validation` });
      setAlerts(newAlerts);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  if (loading) return <Spinner />;

  const statusBadge = (s) => <Badge color={statusColor(s)}>{s?.replace(/_/g," ")}</Badge>;

  return (
    <div style={{ padding: "24px", maxWidth: 1200 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b" }}>Welcome back! 👋</h1>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
          {tenant?.factory_name} · {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <AlertBanner alerts={alerts} />

      {/* KPI Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
        <StatCard label="Total Clients" value={stats?.clientCount ?? 0} icon="👥" color="#3b82f6" />
        <StatCard label="Total Projects" value={stats?.projectCount ?? 0} icon="🏗️" color="#6366f1" />
        <StatCard label="Active Jobs" value={stats?.activeJobs ?? 0} icon="⚙️" color="#f59e0b" />
        <StatCard label="Pending Dispatch" value={stats?.pendingDispatch ?? 0} icon="🚚" color="#10b981" />
        <StatCard label="Total Invoiced" value={fmt(stats?.totalInvoiced ?? 0)} icon="📄" color="#8b5cf6" />
        <StatCard label="Amount Received" value={fmt(stats?.totalReceived ?? 0)} icon="💰" color="#10b981" />
        <StatCard label="Amount Due" value={fmt(stats?.totalDue ?? 0)} icon="⏳" color="#ef4444" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <RevenueChart data={revenue} />

        {/* Quick Actions */}
        <Card style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Quick Actions</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "New Client", icon: "➕", page: "clients", color: "#3b82f6" },
              { label: "New Project", icon: "🏗️", page: "projects", color: "#6366f1" },
              { label: "Cut List", icon: "📐", page: "cutlist", color: "#8b5cf6" },
              { label: "Quotation", icon: "📋", page: "quotations", color: "#f59e0b" },
              { label: "Production", icon: "⚙️", page: "production", color: "#10b981" },
              { label: "Inventory", icon: "📦", page: "inventory", color: "#ef4444" },
            ].map(q => (
              <button key={q.page} onClick={() => navigate(q.page)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                  background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10,
                  cursor: "pointer", transition: "all 0.15s", textAlign: "left"
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = q.color; e.currentTarget.style.background = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#f8fafc"; }}>
                <span style={{ fontSize: 20 }}>{q.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{q.label}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card style={{ padding: 0 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Recent Projects</h3>
          <button onClick={() => navigate("projects")} style={{ fontSize: 12, color: "#3b82f6", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
            View all →
          </button>
        </div>
        {recentProjects.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No projects yet. Create your first project!</div>
        ) : (
          recentProjects.map(p => (
            <div key={p.id} onClick={() => navigate("projects", { projectId: p.id })}
              style={{ padding: "12px 20px", borderBottom: "1px solid #f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
              onMouseLeave={e => e.currentTarget.style.background = ""}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{p.clients?.name} · {p.project_type}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {statusBadge(p.status)}
                <span style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(p.created_at).toLocaleDateString("en-IN")}</span>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
