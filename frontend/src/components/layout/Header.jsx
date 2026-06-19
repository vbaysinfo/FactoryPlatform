import { useApp } from "../../context/AppContext.jsx";

const PAGE_TITLES = {
  dashboard: "Dashboard",
  clients: "Client Management",
  projects: "Projects",
  cutlist: "Cut Lists",
  hardware: "Hardware Management",
  quotations: "Quotations & Proposals",
  production: "Production Workflow",
  inventory: "Inventory",
  employees: "Employee Management",
  maintenance: "Maintenance",
  dispatch: "Dispatch & Transport",
  accounting: "Accounting & Billing",
  analytics: "Analytics",
  settings: "Settings",
  user_mgmt: "User Management",
};

export default function Header() {
  const { page, notifications, user, tenant } = useApp();

  return (
    <>
      <div style={{
        background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "10px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100
      }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
            {PAGE_TITLES[page] || page}
          </h2>
          {tenant && <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{tenant.factory_name}</p>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            fontSize: 11, color: "#64748b", background: "#f8fafc",
            border: "1px solid #e2e8f0", borderRadius: 6, padding: "4px 10px"
          }}>
            {user?.role?.replace(/_/g, " ")}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
        {notifications.map(n => (
          <div key={n.id} style={{
            padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 500,
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)", minWidth: 240, maxWidth: 360,
            background: n.type === "error" ? "#fef2f2" : n.type === "warn" ? "#fefce8" : "#f0fdf4",
            color: n.type === "error" ? "#dc2626" : n.type === "warn" ? "#a16207" : "#15803d",
            border: `1px solid ${n.type === "error" ? "#fecaca" : n.type === "warn" ? "#fde68a" : "#bbf7d0"}`,
            animation: "slideIn 0.3s ease"
          }}>
            {n.msg}
          </div>
        ))}
      </div>
      <style>{`@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
    </>
  );
}
