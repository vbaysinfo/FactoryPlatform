import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { useApp } from "../../context/AppContext.jsx";
import { Card, Spinner, Badge, statusColor } from "../common/ui.jsx";

function fmt(n) {
  if (!n) return "₹0";
  if (n >= 10000000) return "₹" + (n / 10000000).toFixed(1) + "Cr";
  if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L";
  if (n >= 1000) return "₹" + (n / 1000).toFixed(1) + "K";
  return "₹" + Math.round(n);
}

function StatCard({ label, value, icon, color, sub }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14, padding: "18px 20px",
      border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{sub}</div>}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 20, background: color + "18"
        }}>{icon}</div>
      </div>
    </div>
  );
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
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Revenue — Last 6 Months</h3>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 110 }}>
        {data.map(d => (
          <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: "100%", flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 2 }}>
              <div title={`Received: ${fmt(d.received)}`} style={{ width: "100%", height: `${(d.received / max) * 100}%`, minHeight: d.received > 0 ? 4 : 0, background: "#10b981", borderRadius: "4px 4px 0 0" }} />
              <div title={`Pending: ${fmt(d.invoiced - d.received)}`} style={{ width: "100%", height: `${((d.invoiced - d.received) / max) * 100}%`, minHeight: (d.invoiced - d.received) > 0 ? 4 : 0, background: "#3b82f640", borderRadius: "4px 4px 0 0" }} />
            </div>
            <span style={{ fontSize: 10, color: "#94a3b8" }}>{d.month.slice(5)}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
        {[["#10b981", "Received"], ["#3b82f6", "Pending"]].map(([color, label]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748b" }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />{label}
          </div>
        ))}
      </div>
    </Card>
  );
}

function ProductionPipeline({ jobs }) {
  const stages = [
    { key: "pending", label: "Pending", color: "#94a3b8", icon: "⏳" },
    { key: "in_progress", label: "In Progress", color: "#f59e0b", icon: "⚙️" },
    { key: "on_hold", label: "On Hold", color: "#ef4444", icon: "🚫" },
    { key: "completed", label: "Completed", color: "#10b981", icon: "✅" },
  ];
  const counts = {};
  stages.forEach(s => { counts[s.key] = (jobs || []).filter(j => j.status === s.key).length; });
  const total = (jobs || []).length || 1;

  return (
    <Card style={{ padding: 20 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Production Pipeline</h3>
      <div style={{ display: "flex", gap: 4, borderRadius: 8, overflow: "hidden", height: 12, marginBottom: 16 }}>
        {stages.map(s => counts[s.key] > 0 && (
          <div key={s.key} title={`${s.label}: ${counts[s.key]}`}
            style={{ flex: counts[s.key] / total, background: s.color, transition: "flex 0.3s" }} />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {stages.map(s => (
          <div key={s.key} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
            background: "#f8fafc", borderRadius: 10, border: "1px solid #f1f5f9"
          }}>
            <span style={{ fontSize: 18 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{counts[s.key]}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ProjectStatusBreakdown({ projects }) {
  const statuses = [
    { key: "active", label: "Active", color: "#3b82f6" },
    { key: "completed", label: "Completed", color: "#10b981" },
    { key: "on_hold", label: "On Hold", color: "#f59e0b" },
    { key: "cancelled", label: "Cancelled", color: "#ef4444" },
  ];
  const counts = {};
  statuses.forEach(s => { counts[s.key] = (projects || []).filter(p => p.status === s.key).length; });

  return (
    <Card style={{ padding: 20 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Project Status</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {statuses.map(s => {
          const pct = Math.round((counts[s.key] / ((projects || []).length || 1)) * 100);
          return (
            <div key={s.key}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>{s.label}</span>
                <span style={{ fontSize: 12, color: "#64748b" }}>{counts[s.key]} ({pct}%)</span>
              </div>
              <div style={{ height: 6, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: s.color, borderRadius: 4, transition: "width 0.5s" }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function TopClients({ clients }) {
  if (!clients?.length) return null;
  return (
    <Card style={{ padding: 0 }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9" }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Top Clients by Projects</h3>
      </div>
      {clients.slice(0, 5).map((c, i) => (
        <div key={c.id} style={{
          padding: "12px 20px", borderBottom: "1px solid #f8fafc",
          display: "flex", alignItems: "center", gap: 12
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: ["#3b82f6","#6366f1","#10b981","#f59e0b","#ef4444"][i] + "20",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: ["#3b82f6","#6366f1","#10b981","#f59e0b","#ef4444"][i]
          }}>
            {c.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{c.name}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{c.project_count} project{c.project_count !== 1 ? "s" : ""}</div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#10b981" }}>{fmt(c.total_value)}</div>
        </div>
      ))}
    </Card>
  );
}

function RecentActivity({ projects, jobs }) {
  const items = [
    ...(projects || []).slice(0, 3).map(p => ({
      id: "p" + p.id, icon: "🏗️", text: `Project "${p.name}" — ${p.status?.replace(/_/g, " ")}`,
      sub: p.clients?.name, date: p.created_at, color: "#6366f1"
    })),
    ...(jobs || []).filter(j => j.status === "completed").slice(0, 3).map(j => ({
      id: "j" + j.id, icon: "✅", text: `Job "${j.title}" completed`,
      sub: j.projects?.name, date: j.updated_at || j.created_at, color: "#10b981"
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  return (
    <Card style={{ padding: 0 }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9" }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Recent Activity</h3>
      </div>
      {items.length === 0 ? (
        <div style={{ padding: 30, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No recent activity</div>
      ) : items.map(item => (
        <div key={item.id} style={{ padding: "12px 20px", borderBottom: "1px solid #f8fafc", display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: item.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{item.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{item.text}</div>
            {item.sub && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{item.sub}</div>}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>
            {new Date(item.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </div>
        </div>
      ))}
    </Card>
  );
}

export default function Dashboard() {
  const { tenant, navigate } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => { if (tenant) load(); }, [tenant]);

  async function load() {
    setLoading(true);
    try {
      const [
        { count: clientCount },
        { count: projectCount },
        { data: allProjects },
        { data: allJobs },
        { data: invoices },
        { data: dispatches },
        { data: lowStock },
        { data: overdueMachines },
        { data: cutlistPending },
      ] = await Promise.all([
        supabase.from("clients").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id).eq("is_active", true),
        supabase.from("projects").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id),
        supabase.from("projects").select("*, clients(name)").eq("tenant_id", tenant.id).order("created_at", { ascending: false }),
        supabase.from("production_jobs").select("*, projects(name)").eq("tenant_id", tenant.id).order("created_at", { ascending: false }),
        supabase.from("invoices").select("grand_total, amount_paid, amount_due, invoice_date").eq("tenant_id", tenant.id),
        supabase.from("dispatch_orders").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id).eq("status", "pending"),
        supabase.from("inventory_items").select("name, stock_qty, min_stock").eq("tenant_id", tenant.id),
        supabase.from("machines").select("name, next_service_date").eq("tenant_id", tenant.id).not("next_service_date", "is", null).lte("next_service_date", new Date().toISOString().split("T")[0]),
        supabase.from("cut_list_revisions").select("id").eq("tenant_id", tenant.id).eq("status", "confirmed"),
      ]);

      const totalInvoiced = (invoices || []).reduce((s, i) => s + (i.grand_total || 0), 0);
      const totalReceived = (invoices || []).reduce((s, i) => s + (i.amount_paid || 0), 0);
      const totalDue = (invoices || []).reduce((s, i) => s + (i.amount_due || 0), 0);
      const activeJobs = (allJobs || []).filter(j => j.status === "in_progress").length;
      const pendingDispatch = dispatches?.count || 0;

      // Revenue chart
      const monthMap = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthMap[key] = { month: key, invoiced: 0, received: 0 };
      }
      (invoices || []).forEach(inv => {
        const key = (inv.invoice_date || "").slice(0, 7);
        if (monthMap[key]) { monthMap[key].invoiced += inv.grand_total || 0; monthMap[key].received += inv.amount_paid || 0; }
      });

      // Top clients
      const clientMap = {};
      (allProjects || []).forEach(p => {
        const cid = p.clients?.name;
        if (!cid) return;
        if (!clientMap[cid]) clientMap[cid] = { id: cid, name: cid, project_count: 0, total_value: 0 };
        clientMap[cid].project_count++;
        clientMap[cid].total_value += p.total_value || 0;
      });
      const topClients = Object.values(clientMap).sort((a, b) => b.project_count - a.project_count);

      // Alerts
      const newAlerts = [];
      const lowStockItems = (lowStock || []).filter(i => (i.stock_qty || 0) <= (i.min_stock || 0));
      if (lowStockItems.length) newAlerts.push({ type: "warning", message: `${lowStockItems.length} inventory item${lowStockItems.length > 1 ? "s" : ""} below reorder level: ${lowStockItems.slice(0, 2).map(i => i.name).join(", ")}${lowStockItems.length > 2 ? "..." : ""}` });
      if ((overdueMachines || []).length) newAlerts.push({ type: "error", message: `${overdueMachines.length} machine${overdueMachines.length > 1 ? "s" : ""} overdue for service: ${overdueMachines.slice(0, 2).map(m => m.name).join(", ")}` });
      if ((cutlistPending || []).length) newAlerts.push({ type: "warning", message: `${cutlistPending.length} cut list${cutlistPending.length > 1 ? "s" : ""} awaiting factory validation` });

      setAlerts(newAlerts);
      setData({ clientCount, projectCount, activeJobs, pendingDispatch, totalInvoiced, totalReceived, totalDue, allProjects: allProjects || [], allJobs: allJobs || [], revenue: Object.values(monthMap), topClients });
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ padding: "24px", maxWidth: 1280 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>Factory Overview</h1>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
          {tenant?.factory_name} · {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <AlertBanner alerts={alerts} />

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Clients" value={data?.clientCount ?? 0} icon="👥" color="#3b82f6" />
        <StatCard label="Total Projects" value={data?.projectCount ?? 0} icon="🏗️" color="#6366f1" />
        <StatCard label="Active Jobs" value={data?.activeJobs ?? 0} icon="⚙️" color="#f59e0b" sub="In production" />
        <StatCard label="Pending Dispatch" value={data?.pendingDispatch ?? 0} icon="🚚" color="#10b981" />
        <StatCard label="Total Invoiced" value={fmt(data?.totalInvoiced ?? 0)} icon="📄" color="#8b5cf6" />
        <StatCard label="Amount Received" value={fmt(data?.totalReceived ?? 0)} icon="💰" color="#10b981" />
        <StatCard label="Amount Due" value={fmt(data?.totalDue ?? 0)} icon="⏳" color="#ef4444" />
      </div>

      {/* Row 2: Revenue + Production Pipeline */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <RevenueChart data={data?.revenue} />
        <ProductionPipeline jobs={data?.allJobs} />
      </div>

      {/* Row 3: Project Status + Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <ProjectStatusBreakdown projects={data?.allProjects} />

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
              <button key={q.page} onClick={() => navigate(q.page)} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10,
                cursor: "pointer", textAlign: "left", transition: "all 0.15s"
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = q.color; e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = `0 0 0 3px ${q.color}15`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.boxShadow = "none"; }}>
                <span style={{ fontSize: 20 }}>{q.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{q.label}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Row 4: Top Clients + Recent Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <TopClients clients={data?.topClients} />
        <RecentActivity projects={data?.allProjects} jobs={data?.allJobs} />
      </div>
    </div>
  );
}
