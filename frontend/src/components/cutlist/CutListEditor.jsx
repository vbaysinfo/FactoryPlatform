import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { useApp } from "../../context/AppContext.jsx";
import { Card, Btn, Input, Select, Modal, Badge, Spinner, statusColor } from "../common/ui.jsx";

const MATERIALS = ["18mm MDF","18mm HDF","12mm MDF","9mm MDF","18mm Ply","12mm Ply","6mm MDF Back","BWR Ply","Marine Ply","Particle Board"];
const FINISHES = ["Laminate","PU Paint","Veneer","Acrylic","Membrane","HPL","None"];
const EMPTY_PANEL = {
  panel_label:"", length_mm:"", width_mm:"", thickness_mm:"18", material:"18mm MDF",
  finish:"Laminate", grain_direction:"length", quantity:"1",
  edge_band_top:false, edge_band_bottom:false, edge_band_left:false, edge_band_right:false,
  edge_band_type:"0.4mm PVC", mismatch_notes:""
};

// mm ↔ ft/in helpers
function mmToFtIn(mm) {
  if (!mm) return "";
  const totalInches = mm / 25.4;
  const ft = Math.floor(totalInches / 12);
  const inc = (totalInches % 12).toFixed(1);
  return `${ft}'-${inc}"`;
}
function ftInToMm(val) {
  // Accept: 2500 (pure mm) or "2'6" or "2-6" or "2.5ft"
  if (!val) return null;
  const str = String(val).trim();
  const feetMatch = str.match(/^(\d+)['-](\d+(?:\.\d+)?)(?:"|'')?$/);
  if (feetMatch) return Math.round((parseInt(feetMatch[1]) * 12 + parseFloat(feetMatch[2])) * 25.4);
  const num = parseFloat(str);
  if (!isNaN(num)) return num > 100 ? num : Math.round(num * 12 * 25.4); // assume mm if > 100
  return null;
}

export default function CutListEditor({ roomId, onBack }) {
  const { tenant, user, addNotification } = useApp();
  const [room, setRoom] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const [activeRev, setActiveRev] = useState(null);
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [panel, setPanel] = useState(EMPTY_PANEL);
  const [editingPanel, setEditingPanel] = useState(null);
  const [inputMode, setInputMode] = useState("mm"); // "mm" or "ftin"

  useEffect(() => { load(); }, [roomId]);

  async function load() {
    setLoading(true);
    const [{ data: rm }, { data: revs }] = await Promise.all([
      supabase.from("rooms").select("*, projects(name, project_type, clients(name))").eq("id", roomId).single(),
      supabase.from("cut_list_revisions").select("*").eq("room_id", roomId).order("revision_number")
    ]);
    setRoom(rm);
    setRevisions(revs || []);
    const latest = revs?.[revs.length - 1];
    if (latest) { setActiveRev(latest); loadPanels(latest.id); }
    else setLoading(false);
  }

  async function loadPanels(revId) {
    const { data } = await supabase.from("cut_list_panels").select("*").eq("revision_id", revId).order("sort_order");
    setPanels(data || []);
    setLoading(false);
  }

  async function createRevision() {
    setSaving(true);
    const revNum = (revisions.length || 0) + 1;
    const { data, error } = await supabase.from("cut_list_revisions").insert({
      room_id: roomId, tenant_id: tenant.id, revision_number: revNum,
      status: "draft", created_by: user.id
    }).select().single();
    if (error) { addNotification(error.message, "error"); setSaving(false); return; }
    // Update room status
    await supabase.from("rooms").update({ status: "cut_list_draft" }).eq("id", roomId);
    setActiveRev(data);
    setRevisions(r => [...r, data]);
    setPanels([]);
    setSaving(false);
    addNotification(`Revision ${revNum} created`);
  }

  async function savePanel() {
    if (!panel.panel_label || !panel.length_mm || !panel.width_mm) {
      return addNotification("Label, Length and Width are required", "error");
    }
    setSaving(true);
    const payload = {
      ...panel,
      revision_id: activeRev.id, tenant_id: tenant.id,
      length_mm: parseFloat(panel.length_mm),
      width_mm: parseFloat(panel.width_mm),
      thickness_mm: parseFloat(panel.thickness_mm),
      quantity: parseInt(panel.quantity),
      sort_order: editingPanel ? editingPanel.sort_order : panels.length
    };
    const { error } = editingPanel
      ? await supabase.from("cut_list_panels").update(payload).eq("id", editingPanel.id)
      : await supabase.from("cut_list_panels").insert(payload);
    if (error) addNotification(error.message, "error");
    else { addNotification("Panel saved"); setAddModal(false); setPanel(EMPTY_PANEL); setEditingPanel(null); loadPanels(activeRev.id); }
    setSaving(false);
  }

  async function deletePanel(id) {
    if (!confirm("Delete this panel?")) return;
    await supabase.from("cut_list_panels").delete().eq("id", id);
    loadPanels(activeRev.id);
  }

  async function confirmRevision() {
    if (panels.length === 0) return addNotification("Add panels first", "error");
    await supabase.from("cut_list_revisions").update({ status: "confirmed", confirmed_by: user.id, confirmed_at: new Date().toISOString() }).eq("id", activeRev.id);
    await supabase.from("rooms").update({ status: "designer_confirmed" }).eq("id", roomId);
    addNotification("Cut list confirmed by designer");
    load();
  }

  async function validateRevision(pass) {
    const status = pass ? "validated" : "rejected";
    await supabase.from("cut_list_revisions").update({ status, validated_by: user.id, validated_at: new Date().toISOString() }).eq("id", activeRev.id);
    await supabase.from("rooms").update({ status: pass ? "validated" : "cut_list_draft" }).eq("id", roomId);
    addNotification(pass ? "Cut list validated ✓" : "Cut list flagged for correction");
    load();
  }

  function openEdit(p) { setEditingPanel(p); setPanel({ ...EMPTY_PANEL, ...p }); setAddModal(true); }

  const isLocked = activeRev?.status === "confirmed" || activeRev?.status === "validated";
  const canConfirm = activeRev?.status === "draft";
  const canValidate = activeRev?.status === "confirmed";

  const totalPanels = panels.reduce((s, p) => s + (p.quantity || 1), 0);

  if (loading) return <Spinner />;

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
        <Btn variant="ghost" size="sm" onClick={onBack}>← Back</Btn>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>Cut List: {room?.room_name}</h1>
          <p style={{ fontSize: 12, color: "#64748b" }}>{room?.projects?.clients?.name} — {room?.projects?.name}</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {!activeRev && <Btn onClick={createRevision} disabled={saving}>+ Create Cut List</Btn>}
          {canConfirm && panels.length > 0 && <Btn variant="success" onClick={confirmRevision}>✓ Designer Confirm</Btn>}
          {canValidate && (
            <>
              <Btn variant="success" onClick={() => validateRevision(true)}>✓ Validate</Btn>
              <Btn variant="danger" onClick={() => validateRevision(false)}>✗ Flag Correction</Btn>
            </>
          )}
          {activeRev?.status === "validated" && (
            <Btn onClick={createRevision}>+ New Revision</Btn>
          )}
        </div>
      </div>

      {/* Revision tabs */}
      {revisions.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {revisions.map(r => (
            <button key={r.id} onClick={() => { setActiveRev(r); loadPanels(r.id); }}
              style={{
                padding: "5px 12px", borderRadius: 8, border: `1px solid ${activeRev?.id === r.id ? "#3b82f6" : "#e2e8f0"}`,
                background: activeRev?.id === r.id ? "#eff6ff" : "#fff",
                color: activeRev?.id === r.id ? "#1d4ed8" : "#374151",
                fontSize: 12, fontWeight: 600, cursor: "pointer"
              }}>
              Rev {r.revision_number}
              <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}>{r.status}</span>
            </button>
          ))}
        </div>
      )}

      {activeRev ? (
        <Card style={{ padding: 0 }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Revision {activeRev.revision_number}</span>
              <Badge color={statusColor(activeRev.status)}>{activeRev.status}</Badge>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{panels.length} panels · {totalPanels} pcs total</span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <label style={{ fontSize: 11, color: "#64748b" }}>Input:</label>
              <select value={inputMode} onChange={e => setInputMode(e.target.value)}
                style={{ padding: "4px 8px", fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 6 }}>
                <option value="mm">mm</option>
                <option value="ftin">ft/in</option>
              </select>
              {!isLocked && <Btn size="sm" onClick={() => { setEditingPanel(null); setPanel(EMPTY_PANEL); setAddModal(true); }}>+ Add Panel</Btn>}
            </div>
          </div>

          {panels.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>
              No panels yet. Add panels to build the cut list.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Label","L (mm)","W (mm)","T (mm)","Material","Finish","Grain","EB","Qty","Verified","Actions"].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 11, borderBottom: "2px solid #e2e8f0", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {panels.map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9", background: p.is_verified ? "#f0fdf4" : "" }}>
                      <td style={{ padding: "8px 10px", fontWeight: 600, color: "#1e293b" }}>{p.panel_label}</td>
                      <td style={{ padding: "8px 10px" }}>{p.length_mm}</td>
                      <td style={{ padding: "8px 10px" }}>{p.width_mm}</td>
                      <td style={{ padding: "8px 10px" }}>{p.thickness_mm}</td>
                      <td style={{ padding: "8px 10px" }}>{p.material}</td>
                      <td style={{ padding: "8px 10px" }}>{p.finish || "—"}</td>
                      <td style={{ padding: "8px 10px" }}>{p.grain_direction || "—"}</td>
                      <td style={{ padding: "8px 10px" }}>
                        <span style={{ fontSize: 10 }}>
                          {[p.edge_band_top&&"T",p.edge_band_bottom&&"B",p.edge_band_left&&"L",p.edge_band_right&&"R"].filter(Boolean).join("") || "—"}
                        </span>
                      </td>
                      <td style={{ padding: "8px 10px", fontWeight: 600 }}>{p.quantity}</td>
                      <td style={{ padding: "8px 10px" }}>
                        {p.is_verified ? <Badge color="green">✓</Badge> : <Badge color="gray">—</Badge>}
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        {!isLocked && (
                          <div style={{ display: "flex", gap: 4 }}>
                            <Btn size="sm" variant="ghost" onClick={() => openEdit(p)}>Edit</Btn>
                            <Btn size="sm" variant="ghost" onClick={() => deletePanel(p.id)}>Del</Btn>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (
        <Card style={{ padding: 60, textAlign: "center" }}>
          <p style={{ color: "#94a3b8", marginBottom: 16 }}>No cut list created for this room yet.</p>
          <Btn onClick={createRevision} disabled={saving}>Create Cut List</Btn>
        </Card>
      )}

      {/* Add/Edit Panel Modal */}
      <Modal open={addModal} onClose={() => { setAddModal(false); setEditingPanel(null); setPanel(EMPTY_PANEL); }}
        title={editingPanel ? "Edit Panel" : "Add Panel"} width={640}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 12px" }}>
          <div style={{ gridColumn: "1/-1" }}>
            <Input label="Panel Label" required value={panel.panel_label}
              onChange={e => setPanel(p => ({ ...p, panel_label: e.target.value }))}
              placeholder="e.g. LEFT-SIDE, TOP, DOOR-1" />
          </div>
          <Input label={`Length (mm)`} required type="number" value={panel.length_mm}
            onChange={e => setPanel(p => ({ ...p, length_mm: e.target.value }))} />
          <Input label={`Width (mm)`} required type="number" value={panel.width_mm}
            onChange={e => setPanel(p => ({ ...p, width_mm: e.target.value }))} />
          <Input label="Thickness (mm)" type="number" value={panel.thickness_mm}
            onChange={e => setPanel(p => ({ ...p, thickness_mm: e.target.value }))} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
          <Select label="Material" value={panel.material} onChange={e => setPanel(p => ({ ...p, material: e.target.value }))}>
            {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
          </Select>
          <Select label="Finish" value={panel.finish} onChange={e => setPanel(p => ({ ...p, finish: e.target.value }))}>
            {FINISHES.map(f => <option key={f} value={f}>{f}</option>)}
          </Select>
          <Select label="Grain Direction" value={panel.grain_direction} onChange={e => setPanel(p => ({ ...p, grain_direction: e.target.value }))}>
            <option value="length">Length</option>
            <option value="width">Width</option>
            <option value="none">None</option>
          </Select>
          <Input label="Quantity" type="number" value={panel.quantity}
            onChange={e => setPanel(p => ({ ...p, quantity: e.target.value }))} />
        </div>

        {/* Edge banding */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>Edge Banding</label>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 8 }}>
            {[["Top","edge_band_top"],["Bottom","edge_band_bottom"],["Left","edge_band_left"],["Right","edge_band_right"]].map(([label, key]) => (
              <label key={key} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
                <input type="checkbox" checked={panel[key]} onChange={e => setPanel(p => ({ ...p, [key]: e.target.checked }))} />
                {label}
              </label>
            ))}
          </div>
          {(panel.edge_band_top || panel.edge_band_bottom || panel.edge_band_left || panel.edge_band_right) && (
            <Input label="Edge Band Type" value={panel.edge_band_type}
              onChange={e => setPanel(p => ({ ...p, edge_band_type: e.target.value }))}
              placeholder="e.g. 0.4mm PVC White" />
          )}
        </div>

        <Input label="Mismatch Notes (if any)" value={panel.mismatch_notes}
          onChange={e => setPanel(p => ({ ...p, mismatch_notes: e.target.value }))}
          placeholder="Optional: describe any discrepancies" />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn variant="ghost" onClick={() => { setAddModal(false); setEditingPanel(null); setPanel(EMPTY_PANEL); }}>Cancel</Btn>
          <Btn onClick={savePanel} disabled={saving}>{saving ? "Saving..." : editingPanel ? "Update" : "Add Panel"}</Btn>
        </div>
      </Modal>
    </div>
  );
}
