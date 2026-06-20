import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase.js";
import { useApp } from "../../context/AppContext.jsx";
import { Btn, Badge, Spinner, statusColor } from "../common/ui.jsx";

// ── Unit conversion helpers ─────────────────────────────────
function mmToFtIn(mm) {
  if (!mm) return "";
  const totalInches = mm / 25.4;
  const ft = Math.floor(totalInches / 12);
  const inc = (totalInches % 12).toFixed(2).replace(/\.?0+$/, "");
  return `${ft}'-${inc}"`;
}
function mmToCm(mm) { return mm ? (mm / 10).toFixed(1) : ""; }
function parseToMm(val, unit) {
  const s = String(val || "").trim();
  if (!s) return "";
  if (unit === "mm") return parseFloat(s) || "";
  if (unit === "cm") return Math.round((parseFloat(s) || 0) * 10);
  if (unit === "ftin") {
    const m = s.match(/^(\d+)['\-](\d+(?:\.\d+)?)(?:"|'')?$/);
    if (m) return Math.round((parseInt(m[1]) * 12 + parseFloat(m[2])) * 25.4);
    const ft = parseFloat(s);
    return isNaN(ft) ? "" : Math.round(ft * 304.8);
  }
  return parseFloat(s) || "";
}
function displayVal(mm, unit) {
  if (!mm) return "";
  if (unit === "mm") return mm;
  if (unit === "cm") return mmToCm(mm);
  if (unit === "ftin") return mmToFtIn(mm);
  return mm;
}
function unitLabel(unit) {
  if (unit === "mm") return "mm";
  if (unit === "cm") return "cm";
  if (unit === "ftin") return "ft-in";
}

// ── Constants ───────────────────────────────────────────────
const MATERIALS = [
  "18mm MDF", "12mm MDF", "9mm MDF", "6mm MDF", "3mm MDF",
  "18mm HDF", "18mm BWR Ply", "18mm Marine Ply", "12mm Ply", "6mm Ply",
  "25mm MDF", "Particle Board 18mm", "Solid Wood 18mm",
];
const FINISHES = ["Laminate", "PU Paint", "Veneer", "Acrylic", "Membrane", "HPL", "Melamine", "None"];
const EDGE_TYPES = ["0.4mm PVC", "1mm PVC", "2mm PVC", "0.4mm ABS", "1mm ABS", "Wood Edge", "None"];
const EMPTY = {
  panel_label: "", category: "carcass",
  length_mm: "", width_mm: "", thickness_mm: "18",
  material: "18mm MDF", finish: "Laminate",
  grain_direction: "length", quantity: "1",
  edge_band_top: false, edge_band_bottom: false,
  edge_band_left: false, edge_band_right: false,
  edge_band_type: "0.4mm PVC", notes: ""
};
const CATEGORIES = ["carcass", "shutter", "drawer", "back panel", "shelf", "top", "side", "bottom", "other"];

// ── Small helpers ───────────────────────────────────────────
const col = { padding: "9px 10px" };
const th = { ...col, fontWeight: 700, fontSize: 11, color: "#475569", background: "#f8fafc", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", textTransform: "uppercase" };
const tdStyle = (highlight) => ({ ...col, fontSize: 12, color: "#1e293b", background: highlight ? "#f0fdf4" : "", borderBottom: "1px solid #f1f5f9" });

function catColor(c) {
  const m = { carcass: "#3b82f6", shutter: "#8b5cf6", drawer: "#f59e0b", shelf: "#10b981", top: "#06b6d4", side: "#6366f1", bottom: "#ec4899", "back panel": "#94a3b8", other: "#64748b" };
  return m[c] || "#94a3b8";
}

function SummaryCard({ icon, label, value, color }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px", minWidth: 120 }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: color || "#1e293b" }}>{value}</div>
      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function UnitToggle({ unit, setUnit }) {
  return (
    <div style={{ display: "flex", gap: 2, background: "#f1f5f9", borderRadius: 8, padding: 3 }}>
      {["mm", "cm", "ftin"].map(u => (
        <button key={u} onClick={() => setUnit(u)}
          style={{
            padding: "4px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
            background: unit === u ? "#fff" : "transparent",
            color: unit === u ? "#1e293b" : "#64748b",
            boxShadow: unit === u ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
          }}>{u === "ftin" ? "ft-in" : u}</button>
      ))}
    </div>
  );
}

export default function CutListEditor({ room, project, onBack }) {
  const { user, addNotification } = useApp();
  const [revisions, setRevisions] = useState([]);
  const [activeRev, setActiveRev] = useState(null);
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unit, setUnit] = useState("mm");
  const [showForm, setShowForm] = useState(false);
  const [panel, setPanel] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const formRef = useRef(null);

  useEffect(() => { load(); }, [room?.id]);

  async function load() {
    setLoading(true);
    const { data: revs } = await supabase.from("cut_list_revisions")
      .select("*").eq("room_id", room.id).order("revision_number");
    setRevisions(revs || []);
    const latest = revs?.[revs.length - 1];
    if (latest) { setActiveRev(latest); await loadPanels(latest.id); }
    setLoading(false);
  }

  async function loadPanels(revId) {
    const { data } = await supabase.from("cut_list_panels").select("*").eq("revision_id", revId).order("sort_order");
    setPanels(data || []);
  }

  async function createRevision() {
    setSaving(true);
    const num = (revisions.length || 0) + 1;
    const { data, error } = await supabase.from("cut_list_revisions").insert({
      room_id: room.id, tenant_id: room.tenant_id || project?.tenant_id,
      revision_number: num, status: "draft"
    }).select().single();
    if (error) { addNotification(error.message, "error"); setSaving(false); return; }
    await supabase.from("rooms").update({ status: "cut_list_draft" }).eq("id", room.id);
    setActiveRev(data); setRevisions(r => [...r, data]); setPanels([]);
    setSaving(false); addNotification(`Revision ${num} created`);
  }

  function openAdd() { setEditingId(null); setPanel(EMPTY); setShowForm(true); setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 100); }
  function openEdit(p) { setEditingId(p.id); setPanel({ ...EMPTY, ...p, length_mm: String(p.length_mm || ""), width_mm: String(p.width_mm || ""), thickness_mm: String(p.thickness_mm || "18"), quantity: String(p.quantity || 1) }); setShowForm(true); setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 100); }
  function cancelForm() { setShowForm(false); setEditingId(null); setPanel(EMPTY); }

  async function duplicate(p) {
    const { id, created_at, updated_at, sort_order, ...rest } = p;
    const label = `${p.panel_label}-COPY`;
    await supabase.from("cut_list_panels").insert({ ...rest, panel_label: label, sort_order: panels.length });
    loadPanels(activeRev.id); addNotification("Panel duplicated");
  }

  async function savePanel() {
    if (!panel.panel_label) return addNotification("Panel label is required", "error");
    if (!panel.length_mm || !panel.width_mm) return addNotification("Length and Width are required", "error");
    setSaving(true);
    const lmm = parseFloat(panel.length_mm);
    const wmm = parseFloat(panel.width_mm);
    const tmm = parseFloat(panel.thickness_mm) || 18;
    const payload = {
      ...panel,
      revision_id: activeRev.id,
      tenant_id: room.tenant_id || project?.tenant_id,
      length_mm: lmm, width_mm: wmm, thickness_mm: tmm,
      quantity: parseInt(panel.quantity) || 1,
      sort_order: editingId ? (panels.find(p => p.id === editingId)?.sort_order ?? panels.length) : panels.length,
    };
    delete payload.id; delete payload.created_at; delete payload.updated_at;
    const { error } = editingId
      ? await supabase.from("cut_list_panels").update(payload).eq("id", editingId)
      : await supabase.from("cut_list_panels").insert(payload);
    if (error) addNotification(error.message, "error");
    else { addNotification(editingId ? "Panel updated" : "Panel added"); cancelForm(); loadPanels(activeRev.id); }
    setSaving(false);
  }

  async function deletePanel(id) {
    if (!confirm("Delete this panel?")) return;
    await supabase.from("cut_list_panels").delete().eq("id", id);
    loadPanels(activeRev.id);
  }

  async function confirmRevision() {
    if (!panels.length) return addNotification("Add panels first", "error");
    await supabase.from("cut_list_revisions").update({ status: "confirmed" }).eq("id", activeRev.id);
    await supabase.from("rooms").update({ status: "designer_confirmed" }).eq("id", room.id);
    addNotification("Cut list confirmed ✓"); load();
  }

  async function validateRevision(pass) {
    await supabase.from("cut_list_revisions").update({ status: pass ? "validated" : "rejected" }).eq("id", activeRev.id);
    await supabase.from("rooms").update({ status: pass ? "validated" : "cut_list_draft" }).eq("id", room.id);
    addNotification(pass ? "Validated ✓" : "Flagged for correction"); load();
  }

  function printCutList() {
    const rows = filtered.map((p, i) =>
      `<tr style="background:${i%2?"#f8fafc":"#fff"}">
        <td>${i+1}</td><td><b>${p.panel_label}</b></td><td>${p.category||""}</td>
        <td>${p.length_mm}</td><td>${p.width_mm}</td><td>${p.thickness_mm}</td>
        <td>${mmToCm(p.length_mm)} × ${mmToCm(p.width_mm)}</td>
        <td>${mmToFtIn(p.length_mm)} × ${mmToFtIn(p.width_mm)}</td>
        <td>${p.material}</td><td>${p.finish||""}</td><td>${p.grain_direction||""}</td>
        <td>${[p.edge_band_top&&"T",p.edge_band_bottom&&"B",p.edge_band_left&&"L",p.edge_band_right&&"R"].filter(Boolean).join(" ")||"—"}</td>
        <td>${p.edge_band_type||""}</td><td style="text-align:center;font-weight:700">${p.quantity}</td>
        <td>${p.notes||""}</td>
      </tr>`
    ).join("");
    const w = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html><html><head><title>Cut List - ${room.room_name}</title>
    <style>body{font-family:Arial,sans-serif;font-size:11px;padding:20px}h2{margin:0}table{width:100%;border-collapse:collapse;margin-top:14px}th{background:#1e293b;color:#fff;padding:7px 8px;text-align:left;font-size:10px}td{padding:6px 8px;border-bottom:1px solid #e2e8f0}.summary{display:flex;gap:20px;margin:10px 0;font-size:12px}</style>
    </head><body>
    <h2>Cut List — ${room.room_name}</h2>
    <p><b>Project:</b> ${project?.name || ""} &nbsp; <b>Client:</b> ${project?.clients?.name || ""} &nbsp; <b>Rev:</b> ${activeRev?.revision_number} &nbsp; <b>Date:</b> ${new Date().toLocaleDateString()}</p>
    <div class="summary">
      <span><b>Total Panels:</b> ${filtered.length}</span>
      <span><b>Total Pcs:</b> ${filtered.reduce((s,p)=>s+(p.quantity||1),0)}</span>
      <span><b>Total Area:</b> ${(filtered.reduce((s,p)=>s+((p.length_mm||0)*(p.width_mm||0)*(p.quantity||1)),0)/1000000).toFixed(3)} m²</span>
    </div>
    <table><thead><tr><th>#</th><th>Label</th><th>Category</th><th>L(mm)</th><th>W(mm)</th><th>T(mm)</th><th>cm</th><th>ft-in</th><th>Material</th><th>Finish</th><th>Grain</th><th>EB</th><th>EB Type</th><th>Qty</th><th>Notes</th></tr></thead>
    <tbody>${rows}</tbody></table>
    </body></html>`);
    w.document.close(); w.print();
  }

  // ── Computed values ────────────────────────────────────────
  const filtered = panels.filter(p => {
    const matchCat = filter === "all" || p.category === filter;
    const matchSearch = !search || p.panel_label?.toLowerCase().includes(search.toLowerCase()) || p.material?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalPcs = filtered.reduce((s, p) => s + (p.quantity || 1), 0);
  const totalAreaM2 = filtered.reduce((s, p) => s + ((p.length_mm || 0) * (p.width_mm || 0) * (p.quantity || 1)), 0) / 1000000;

  const materialSummary = {};
  panels.forEach(p => {
    const m = p.material || "Unknown";
    if (!materialSummary[m]) materialSummary[m] = { panels: 0, pcs: 0, area: 0 };
    materialSummary[m].panels++;
    materialSummary[m].pcs += p.quantity || 1;
    materialSummary[m].area += (p.length_mm || 0) * (p.width_mm || 0) * (p.quantity || 1) / 1000000;
  });

  const isLocked = activeRev?.status === "confirmed" || activeRev?.status === "validated";

  const inputStyle = { width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#1e293b", boxSizing: "border-box" };
  const labelStyle = { display: "block", fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 };

  if (loading) return <Spinner />;

  return (
    <div style={{ padding: 24, maxWidth: 1300 }}>
      {/* ── Header ────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>← Back</button>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>✂️ {room?.room_name}</h1>
            <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>{project?.clients?.name} — {project?.name} · {room?.room_type}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <UnitToggle unit={unit} setUnit={setUnit} />
          {activeRev && panels.length > 0 && (
            <Btn size="sm" variant="ghost" onClick={printCutList}>🖨️ Print</Btn>
          )}
          {!activeRev && <Btn onClick={createRevision} disabled={saving}>+ Create Cut List</Btn>}
          {activeRev?.status === "draft" && panels.length > 0 && <Btn variant="success" onClick={confirmRevision}>✓ Confirm</Btn>}
          {activeRev?.status === "confirmed" && (
            <>
              <Btn variant="success" onClick={() => validateRevision(true)}>✓ Validate</Btn>
              <Btn variant="danger" onClick={() => validateRevision(false)}>✗ Flag</Btn>
            </>
          )}
          {activeRev?.status === "validated" && <Btn size="sm" onClick={createRevision}>+ New Revision</Btn>}
        </div>
      </div>

      {/* ── Revision Tabs ─────────────────────────────────── */}
      {revisions.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {revisions.map(r => (
            <button key={r.id} onClick={() => { setActiveRev(r); loadPanels(r.id); setShowForm(false); }}
              style={{
                padding: "5px 14px", borderRadius: 8, border: `1px solid ${activeRev?.id === r.id ? "#3b82f6" : "#e2e8f0"}`,
                background: activeRev?.id === r.id ? "#eff6ff" : "#fff",
                color: activeRev?.id === r.id ? "#1d4ed8" : "#374151",
                fontSize: 12, fontWeight: 600, cursor: "pointer"
              }}>
              Rev {r.revision_number} · <span style={{ opacity: 0.7 }}>{r.status}</span>
            </button>
          ))}
        </div>
      )}

      {!activeRev ? (
        <div style={{ textAlign: "center", padding: 80, background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📐</div>
          <p style={{ color: "#64748b", marginBottom: 16, fontSize: 14 }}>No cut list created for this room yet.</p>
          <Btn onClick={createRevision} disabled={saving}>Create Cut List</Btn>
        </div>
      ) : (
        <>
          {/* ── Summary Cards ───────────────────────────────── */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <SummaryCard icon="📋" label="Total Panels" value={panels.length} color="#3b82f6" />
            <SummaryCard icon="🔢" label="Total Pieces" value={totalPcs} color="#6366f1" />
            <SummaryCard icon="📐" label="Total Area" value={`${totalAreaM2.toFixed(2)} m²`} color="#10b981" />
            <SummaryCard icon="🪵" label="Materials" value={Object.keys(materialSummary).length} color="#f59e0b" />
            <div style={{ flex: 1 }} />
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 8, textTransform: "uppercase" }}>Revision Status</div>
              <Badge color={statusColor(activeRev.status)} style={{ fontSize: 13, padding: "4px 12px" }}>{activeRev.status}</Badge>
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 6 }}>Rev {activeRev.revision_number} · {new Date(activeRev.created_at).toLocaleDateString()}</div>
            </div>
          </div>

          {/* ── Material Summary ────────────────────────────── */}
          {Object.keys(materialSummary).length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10, textTransform: "uppercase" }}>Material Breakdown</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Object.entries(materialSummary).map(([mat, d]) => (
                  <div key={mat} style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 14px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>{mat}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{d.pcs} pcs · {d.area.toFixed(3)} m²</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Toolbar ─────────────────────────────────────── */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search panels..." style={{ padding: "7px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, width: 180 }} />
            <select value={filter} onChange={e => setFilter(e.target.value)}
              style={{ padding: "7px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 }}>
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>Showing {filtered.length} of {panels.length}</span>
            <div style={{ flex: 1 }} />
            {!isLocked && !showForm && <Btn onClick={openAdd}>+ Add Panel</Btn>}
          </div>

          {/* ── Panel Table ─────────────────────────────────── */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 60, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                {panels.length === 0 ? "No panels yet. Click \"+ Add Panel\" to start." : "No panels match your filter."}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr>
                      {["#", "Label", "Category", `L (${unitLabel(unit)})`, `W (${unitLabel(unit)})`, `T (mm)`, "mm (L×W)", "ft-in", "Area (m²)", "Qty", "Material", "Finish", "Grain", "Edge Banding", "Notes", ""].map(h => (
                        <th key={h} style={th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p, i) => {
                      const eb = [p.edge_band_top && "Top", p.edge_band_bottom && "Bot", p.edge_band_left && "Left", p.edge_band_right && "Right"].filter(Boolean);
                      const area = ((p.length_mm || 0) * (p.width_mm || 0) * (p.quantity || 1) / 1000000).toFixed(3);
                      return (
                        <tr key={p.id} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = ""}>
                          <td style={tdStyle()}>{i + 1}</td>
                          <td style={{ ...tdStyle(), fontWeight: 700, color: "#1e293b" }}>{p.panel_label}</td>
                          <td style={tdStyle()}>
                            <span style={{ background: catColor(p.category) + "20", color: catColor(p.category), padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>
                              {p.category || "—"}
                            </span>
                          </td>
                          <td style={{ ...tdStyle(), fontWeight: 600 }}>{displayVal(p.length_mm, unit)}</td>
                          <td style={{ ...tdStyle(), fontWeight: 600 }}>{displayVal(p.width_mm, unit)}</td>
                          <td style={tdStyle()}>{p.thickness_mm}</td>
                          <td style={{ ...tdStyle(), color: "#64748b" }}>{p.length_mm} × {p.width_mm}</td>
                          <td style={{ ...tdStyle(), color: "#64748b", whiteSpace: "nowrap" }}>{mmToFtIn(p.length_mm)} × {mmToFtIn(p.width_mm)}</td>
                          <td style={{ ...tdStyle(), color: "#10b981", fontWeight: 600 }}>{area}</td>
                          <td style={{ ...tdStyle(), fontWeight: 800, color: "#6366f1", textAlign: "center" }}>{p.quantity}</td>
                          <td style={tdStyle()}>{p.material}</td>
                          <td style={tdStyle()}>{p.finish || "—"}</td>
                          <td style={tdStyle()}>{p.grain_direction || "—"}</td>
                          <td style={tdStyle()}>
                            {eb.length > 0 ? (
                              <div>
                                <div style={{ fontWeight: 600 }}>{eb.join(", ")}</div>
                                {p.edge_band_type && <div style={{ fontSize: 10, color: "#94a3b8" }}>{p.edge_band_type}</div>}
                              </div>
                            ) : "—"}
                          </td>
                          <td style={{ ...tdStyle(), maxWidth: 140, color: "#64748b" }}>{p.notes || "—"}</td>
                          <td style={tdStyle()}>
                            {!isLocked && (
                              <div style={{ display: "flex", gap: 4 }}>
                                <button onClick={() => openEdit(p)} style={{ padding: "3px 8px", background: "#eff6ff", color: "#3b82f6", border: "none", borderRadius: 6, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>Edit</button>
                                <button onClick={() => duplicate(p)} style={{ padding: "3px 8px", background: "#f0fdf4", color: "#10b981", border: "none", borderRadius: 6, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>Copy</button>
                                <button onClick={() => deletePanel(p.id)} style={{ padding: "3px 8px", background: "#fef2f2", color: "#ef4444", border: "none", borderRadius: 6, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>Del</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Totals row */}
                  <tfoot>
                    <tr style={{ background: "#f8fafc", fontWeight: 700, fontSize: 12 }}>
                      <td colSpan={8} style={{ padding: "10px", textAlign: "right", color: "#374151" }}>Totals →</td>
                      <td style={{ padding: "10px", color: "#10b981" }}>{totalAreaM2.toFixed(3)} m²</td>
                      <td style={{ padding: "10px", color: "#6366f1" }}>{totalPcs}</td>
                      <td colSpan={6} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* ── Add/Edit Panel Form ──────────────────────────── */}
          {showForm && (
            <div ref={formRef} style={{ background: "#fff", border: "2px solid #3b82f6", borderRadius: 16, padding: 24, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1e293b", margin: 0 }}>
                  {editingId ? "✏️ Edit Panel" : "➕ Add New Panel"}
                </h3>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#64748b" }}>Input unit:</span>
                  <UnitToggle unit={unit} setUnit={setUnit} />
                </div>
              </div>

              {/* Row 1: Label + Category + Quantity */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Panel Label *</label>
                  <input style={inputStyle} placeholder="e.g. LEFT-SIDE, TOP-SHELF, DOOR-1"
                    value={panel.panel_label} onChange={e => setPanel(p => ({ ...p, panel_label: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select style={inputStyle} value={panel.category} onChange={e => setPanel(p => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Quantity</label>
                  <input style={inputStyle} type="number" min="1" value={panel.quantity}
                    onChange={e => setPanel(p => ({ ...p, quantity: e.target.value }))} />
                </div>
              </div>

              {/* Row 2: Dimensions */}
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 12, textTransform: "uppercase" }}>📏 Dimensions ({unitLabel(unit)})</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Length ({unitLabel(unit)}) *</label>
                    <input style={inputStyle} type={unit === "ftin" ? "text" : "number"} min="0"
                      placeholder={unit === "ftin" ? "e.g. 2'-6\"" : unit === "cm" ? "e.g. 60.5" : "e.g. 600"}
                      value={panel.length_mm}
                      onChange={e => {
                        const raw = e.target.value;
                        const mm = parseToMm(raw, unit);
                        setPanel(p => ({ ...p, length_mm: unit === "mm" ? raw : mm }));
                      }} />
                    {panel.length_mm && unit !== "mm" && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 3 }}>= {panel.length_mm} mm · {mmToFtIn(panel.length_mm)}</div>}
                    {panel.length_mm && unit === "mm" && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 3 }}>{mmToCm(panel.length_mm)} cm · {mmToFtIn(panel.length_mm)}</div>}
                  </div>
                  <div>
                    <label style={labelStyle}>Width ({unitLabel(unit)}) *</label>
                    <input style={inputStyle} type={unit === "ftin" ? "text" : "number"} min="0"
                      placeholder={unit === "ftin" ? "e.g. 1'-2\"" : unit === "cm" ? "e.g. 30.0" : "e.g. 300"}
                      value={panel.width_mm}
                      onChange={e => {
                        const raw = e.target.value;
                        const mm = parseToMm(raw, unit);
                        setPanel(p => ({ ...p, width_mm: unit === "mm" ? raw : mm }));
                      }} />
                    {panel.width_mm && unit !== "mm" && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 3 }}>= {panel.width_mm} mm · {mmToFtIn(panel.width_mm)}</div>}
                    {panel.width_mm && unit === "mm" && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 3 }}>{mmToCm(panel.width_mm)} cm · {mmToFtIn(panel.width_mm)}</div>}
                  </div>
                  <div>
                    <label style={labelStyle}>Thickness (mm)</label>
                    <select style={inputStyle} value={panel.thickness_mm} onChange={e => setPanel(p => ({ ...p, thickness_mm: e.target.value }))}>
                      {["3","6","9","12","18","25","32"].map(t => <option key={t} value={t}>{t} mm</option>)}
                    </select>
                  </div>
                </div>
                {panel.length_mm && panel.width_mm && (
                  <div style={{ marginTop: 10, padding: "8px 12px", background: "#eff6ff", borderRadius: 8, fontSize: 12, color: "#1d4ed8", fontWeight: 600 }}>
                    📐 Area per piece: {((panel.length_mm * panel.width_mm) / 1000000).toFixed(4)} m²
                    &nbsp;·&nbsp; Total ({panel.quantity || 1} pcs): {((panel.length_mm * panel.width_mm * (panel.quantity || 1)) / 1000000).toFixed(4)} m²
                  </div>
                )}
              </div>

              {/* Row 3: Material + Finish + Grain */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Material</label>
                  <select style={inputStyle} value={panel.material} onChange={e => setPanel(p => ({ ...p, material: e.target.value }))}>
                    {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Finish</label>
                  <select style={inputStyle} value={panel.finish} onChange={e => setPanel(p => ({ ...p, finish: e.target.value }))}>
                    {FINISHES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Grain Direction</label>
                  <select style={inputStyle} value={panel.grain_direction} onChange={e => setPanel(p => ({ ...p, grain_direction: e.target.value }))}>
                    <option value="length">Along Length</option>
                    <option value="width">Along Width</option>
                    <option value="none">No Grain</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Edge Banding */}
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10, textTransform: "uppercase" }}>🔲 Edge Banding</div>
                <div style={{ display: "flex", gap: 24, marginBottom: 10, flexWrap: "wrap" }}>
                  {[["Top", "edge_band_top"], ["Bottom", "edge_band_bottom"], ["Left", "edge_band_left"], ["Right", "edge_band_right"]].map(([lbl, key]) => (
                    <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                      <input type="checkbox" style={{ width: 16, height: 16 }} checked={panel[key]}
                        onChange={e => setPanel(p => ({ ...p, [key]: e.target.checked }))} />
                      {lbl}
                    </label>
                  ))}
                </div>
                {(panel.edge_band_top || panel.edge_band_bottom || panel.edge_band_left || panel.edge_band_right) && (
                  <div>
                    <label style={labelStyle}>Edge Band Type</label>
                    <select style={inputStyle} value={panel.edge_band_type} onChange={e => setPanel(p => ({ ...p, edge_band_type: e.target.value }))}>
                      {EDGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Notes / Instructions</label>
                <textarea style={{ ...inputStyle, height: 60, resize: "vertical" }}
                  placeholder="Optional: special instructions, mismatch notes, etc."
                  value={panel.notes} onChange={e => setPanel(p => ({ ...p, notes: e.target.value }))} />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={cancelForm} style={{ padding: "9px 20px", background: "#f1f5f9", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#374151" }}>Cancel</button>
                <button onClick={savePanel} disabled={saving} style={{ padding: "9px 24px", background: saving ? "#94a3b8" : "#3b82f6", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", color: "#fff" }}>
                  {saving ? "Saving..." : editingId ? "Update Panel" : "Add Panel"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
