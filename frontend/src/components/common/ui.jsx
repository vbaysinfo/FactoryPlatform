// Shared UI primitives

export function Card({ children, style = {}, className = "" }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)", ...style
    }} className={className}>
      {children}
    </div>
  );
}

export function Badge({ children, color = "blue" }) {
  const colors = {
    blue: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
    green: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
    red: { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
    yellow: { bg: "#fefce8", text: "#a16207", border: "#fde68a" },
    purple: { bg: "#faf5ff", text: "#7c3aed", border: "#e9d5ff" },
    gray: { bg: "#f8fafc", text: "#475569", border: "#e2e8f0" },
    orange: { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa" },
  };
  const c = colors[color] || colors.blue;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "2px 8px",
      borderRadius: 6, fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`
    }}>
      {children}
    </span>
  );
}

export function Btn({ children, onClick, variant = "primary", size = "md", disabled = false, type = "button", style = {} }) {
  const variants = {
    primary: { bg: "#3b82f6", color: "#fff", border: "#3b82f6", hoverBg: "#2563eb" },
    success: { bg: "#10b981", color: "#fff", border: "#10b981" },
    danger: { bg: "#ef4444", color: "#fff", border: "#ef4444" },
    ghost: { bg: "transparent", color: "#475569", border: "#e2e8f0" },
    outline: { bg: "#fff", color: "#374151", border: "#d1d5db" },
  };
  const sizes = { sm: "6px 12px", md: "8px 16px", lg: "10px 20px" };
  const v = variants[variant] || variants.primary;
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{
        padding: sizes[size], background: disabled ? "#e2e8f0" : v.bg,
        color: disabled ? "#94a3b8" : v.color,
        border: `1px solid ${disabled ? "#e2e8f0" : v.border}`,
        borderRadius: 8, fontSize: size === "sm" ? 12 : 13, fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.15s",
        display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", ...style
      }}>
      {children}
    </button>
  );
}

export function Input({ label, value, onChange, type = "text", placeholder, required, style = {}, hint, ...rest }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}{required && <span style={{ color: "#ef4444" }}> *</span>}</label>}
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
        style={{
          width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8,
          fontSize: 13, color: "#1e293b", background: "#fff", transition: "border-color 0.2s", ...style
        }}
        {...rest}
      />
      {hint && <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

export function Select({ label, value, onChange, children, required, style = {} }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}{required && <span style={{ color: "#ef4444" }}> *</span>}</label>}
      <select value={value} onChange={onChange} required={required}
        style={{
          width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8,
          fontSize: 13, color: "#1e293b", background: "#fff", cursor: "pointer", ...style
        }}>
        {children}
      </select>
    </div>
  );
}

export function Textarea({ label, value, onChange, placeholder, rows = 3, required, style = {} }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}{required && <span style={{ color: "#ef4444" }}> *</span>}</label>}
      <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} required={required}
        style={{
          width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8,
          fontSize: 13, color: "#1e293b", background: "#fff", resize: "vertical", ...style
        }}
      />
    </div>
  );
}

export function Modal({ open, onClose, title, children, width = 520 }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#fff", borderRadius: 16, width: "100%", maxWidth: width,
        maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.2)"
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid #e2e8f0"
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>{title}</h3>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "#94a3b8", cursor: "pointer",
            fontSize: 20, lineHeight: 1, padding: 4, borderRadius: 6
          }}>×</button>
        </div>
        <div style={{ padding: "20px" }}>{children}</div>
      </div>
    </div>
  );
}

export function Table({ columns, data, emptyText = "No records found" }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            {columns.map((col, i) => (
              <th key={i} style={{
                padding: "10px 14px", textAlign: col.align || "left", fontWeight: 600,
                color: "#374151", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4,
                borderBottom: "2px solid #e2e8f0", whiteSpace: "nowrap"
              }}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                {emptyText}
              </td>
            </tr>
          ) : data.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: "1px solid #f1f5f9" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
              onMouseLeave={e => e.currentTarget.style.background = ""}>
              {columns.map((col, ci) => (
                <td key={ci} style={{
                  padding: "10px 14px", color: "#374151", verticalAlign: "middle",
                  textAlign: col.align || "left"
                }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatCard({ label, value, icon, color = "#3b82f6", sub }) {
  return (
    <Card style={{ padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</p>
          <p style={{ fontSize: 26, fontWeight: 700, color: "#1e293b", marginTop: 4 }}>{value}</p>
          {sub && <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{sub}</p>}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center",
          justifyContent: "center", background: color + "1a", fontSize: 22
        }}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b" }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: "flex", gap: 8 }}>{actions}</div>}
    </div>
  );
}

export function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 40 }}>
      <div style={{
        width: 32, height: 32, border: "3px solid #e2e8f0",
        borderTop: "3px solid #3b82f6", borderRadius: "50%",
        animation: "spin 0.7s linear infinite"
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export function statusColor(status) {
  const map = {
    draft: "gray", active: "green", pending: "yellow", completed: "green",
    in_progress: "blue", on_hold: "yellow", cancelled: "red", rejected: "red",
    confirmed: "blue", validated: "green", released: "purple",
    sent: "blue", accepted: "green", paid: "green", partial: "yellow",
    overdue: "red", dispatched: "purple", delivered: "green",
    inquiry: "gray", quotation_sent: "blue", client_accepted: "green",
    advance_received: "purple", in_production: "blue", closed: "green",
  };
  return map[status] || "gray";
}
