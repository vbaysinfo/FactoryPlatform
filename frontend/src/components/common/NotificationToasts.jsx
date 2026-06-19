import { useApp } from "../../context/AppContext.jsx";

const ICONS = { success: "✓", error: "✕", warning: "⚠", info: "ℹ" };
const COLORS = {
  success: { bg: "#052e16", border: "#16a34a", text: "#86efac", icon: "#22c55e" },
  error:   { bg: "#450a0a", border: "#dc2626", text: "#fca5a5", icon: "#ef4444" },
  warning: { bg: "#451a03", border: "#d97706", text: "#fcd34d", icon: "#f59e0b" },
  info:    { bg: "#0c1a2e", border: "#3b82f6", text: "#93c5fd", icon: "#60a5fa" },
};

export default function NotificationToasts() {
  const { notifications } = useApp();
  if (!notifications.length) return null;

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9000, display: "flex", flexDirection: "column", gap: 10 }}>
      {notifications.map(n => {
        const c = COLORS[n.type] || COLORS.info;
        return (
          <div key={n.id} style={{
            display: "flex", alignItems: "center", gap: 12,
            background: c.bg, border: `1px solid ${c.border}`, borderRadius: 12,
            padding: "12px 16px", minWidth: 280, maxWidth: 380,
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            animation: "slideIn 0.2s ease",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, background: c.icon + "22",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: c.icon, fontSize: 14, fontWeight: 700, flexShrink: 0
            }}>
              {ICONS[n.type] || ICONS.info}
            </div>
            <span style={{ color: c.text, fontSize: 13, fontWeight: 500, lineHeight: 1.4 }}>{n.msg}</span>
          </div>
        );
      })}
      <style>{`@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
    </div>
  );
}
