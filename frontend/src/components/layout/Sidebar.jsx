import { useApp } from "../../context/AppContext.jsx";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";

function useBadgeCounts(tenant) {
  const [counts, setCounts] = useState({});
  useEffect(() => {
    if (!tenant) return;
    async function load() {
      const [
        { count: lowStock },
        { count: overdueMaint },
        { count: pendingCutlist },
        { count: pendingDispatch },
      ] = await Promise.all([
        supabase.from("inventory_items").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id).eq("is_active", true).lte("current_stock", supabase.raw("reorder_level")).catch(() => ({ count: 0 })),
        supabase.from("machines").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id).eq("is_active", true).not("next_service_date", "is", null).lte("next_service_date", new Date().toISOString().split("T")[0]).catch(() => ({ count: 0 })),
        supabase.from("cut_list_revisions").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id).eq("status", "confirmed").catch(() => ({ count: 0 })),
        supabase.from("dispatch_orders").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id).in("status", ["pending","scheduled"]).catch(() => ({ count: 0 })),
      ]);
      setCounts({ inventory: lowStock || 0, maintenance: overdueMaint || 0, cutlist: pendingCutlist || 0, dispatch: pendingDispatch || 0 });
    }
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [tenant?.id]);
  return counts;
}

const NAV = [
  { section: "Overview" },
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { section: "Business" },
  { key: "clients", label: "Clients", icon: "👥" },
  { key: "projects", label: "Projects", icon: "🏗️" },
  { section: "Design" },
  { key: "cutlist", label: "Cut Lists", icon: "📐" },
  { key: "hardware", label: "Hardware", icon: "🔧" },
  { key: "quotations", label: "Quotations", icon: "📋" },
  { section: "Production" },
  { key: "production", label: "Production", icon: "⚙️" },
  { key: "dispatch", label: "Dispatch", icon: "🚚" },
  { section: "Resources" },
  { key: "inventory", label: "Inventory", icon: "📦" },
  { key: "employees", label: "Employees", icon: "👤" },
  { key: "maintenance", label: "Maintenance", icon: "🔨" },
  { section: "Finance" },
  { key: "accounting", label: "Accounting", icon: "💰" },
  { section: "Reports" },
  { key: "analytics", label: "Analytics", icon: "📈" },
  { section: "Admin" },
  { key: "settings", label: "Settings", icon: "⚙️" },
  { key: "user_mgmt", label: "User Management", icon: "🔐" },
  { key: "super_admin", label: "Super Admin", icon: "👑" },
];

const ROLE_ACCESS = {
  super_admin: null,
  tenant_admin: null,
  sales_manager: ["dashboard","clients","projects","quotations","accounting","analytics"],
  designer: ["dashboard","projects","cutlist","hardware","quotations"],
  production_manager: ["dashboard","projects","production","dispatch","inventory","maintenance","analytics"],
  stage_operator: ["dashboard","production"],
  inventory_manager: ["dashboard","inventory","production"],
  accounts: ["dashboard","clients","projects","accounting","analytics"],
  driver: ["dashboard","dispatch"],
};

export default function Sidebar() {
  const { page, navigate, sidebarOpen, setSidebarOpen, user, tenant, signOut } = useApp();
  const role = user?.role;
  const allowed = ROLE_ACCESS[role];
  const badges = useBadgeCounts(tenant);

  const BADGE_KEYS = { inventory: "inventory", maintenance: "maintenance", cutlist: "cutlist", dispatch: "dispatch" };

  const canSee = (key) => {
    if (!allowed) return true;
    return allowed.includes(key);
  };

  if (!sidebarOpen) return (
    <div style={{
      width: 56, minHeight: "100vh", background: "#0f172a", display: "flex",
      flexDirection: "column", alignItems: "center", paddingTop: 16, gap: 8,
      borderRight: "1px solid #1e293b", flexShrink: 0
    }}>
      <button onClick={() => setSidebarOpen(true)}
        style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 20, padding: 8 }}>
        ☰
      </button>
      {NAV.filter(n => n.key && canSee(n.key)).map(n => (
        <button key={n.key} onClick={() => navigate(n.key)} title={n.label}
          style={{
            background: page === n.key ? "#1e3a5f" : "none", border: "none",
            color: page === n.key ? "#60a5fa" : "#64748b", cursor: "pointer",
            padding: 10, borderRadius: 8, fontSize: 18, width: 40, textAlign: "center"
          }}>
          {n.icon}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{
      width: 230, minHeight: "100vh", background: "#0f172a", display: "flex",
      flexDirection: "column", borderRight: "1px solid #1e293b", flexShrink: 0
    }}>
      {/* Logo */}
      <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #1e293b" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16
            }}>📐</div>
            <div>
              <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13 }}>ModularPro</div>
              <div style={{ color: "#475569", fontSize: 10, marginTop: 1 }}>Factory OS</div>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)}
            style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 16, padding: 4 }}>
            ‹
          </button>
        </div>
      </div>

      {/* Tenant */}
      {tenant && (
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #1e293b", background: "#0a1628" }}>
          <div style={{ fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 }}>Workspace</div>
          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {tenant.factory_name}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
        {NAV.map((n, i) => {
          if (n.section) return (
            <div key={i} style={{
              padding: "12px 8px 4px", fontSize: 10, color: "#475569",
              textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700
            }}>{n.section}</div>
          );
          if (!canSee(n.key)) return null;
          const active = page === n.key;
          return (
            <button key={n.key} onClick={() => navigate(n.key)}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "8px 10px", borderRadius: 8, border: "none", textAlign: "left",
                background: active ? "#1e3a5f" : "transparent",
                color: active ? "#60a5fa" : "#64748b",
                cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400,
                transition: "all 0.15s", marginBottom: 1
              }}>
              <span style={{ fontSize: 15 }}>{n.icon}</span>
              {n.label}
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
                {badges[BADGE_KEYS[n.key]] > 0 && (
                  <span style={{ background: "#ef4444", color: "white", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "1px 6px", minWidth: 18, textAlign: "center" }}>
                    {badges[BADGE_KEYS[n.key]]}
                  </span>
                )}
                {active && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#3b82f6" }} />}
              </div>
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: "12px 12px", borderTop: "1px solid #1e293b" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 32, height: 32, background: "#1e3a5f", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#60a5fa", fontSize: 13, fontWeight: 700
          }}>
            {user?.name?.charAt(0) || "U"}
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.name || "User"}
            </div>
            <div style={{ fontSize: 10, color: "#475569", textTransform: "capitalize" }}>
              {user?.role?.replace("_", " ") || ""}
            </div>
          </div>
        </div>
        <button onClick={signOut}
          style={{
            width: "100%", padding: "7px", background: "#1e293b", border: "1px solid #334155",
            borderRadius: 8, color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer"
          }}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
