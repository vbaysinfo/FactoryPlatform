import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { useApp } from "../../context/AppContext.jsx";
import { Card, Btn, Input, Select, Modal, Badge, Spinner, Textarea, statusColor } from "../common/ui.jsx";

const UNIT_TYPES = ["Wardrobe","Kitchen Cabinet","TV Unit","Shoe Rack","Loft","Study Table","Bookshelf","Dresser","Bedside Cabinet","Crockery Unit","Pooja Unit","Custom"];
const FIN_MM = (ft, inch, frac = 0) => Math.round((ft * 304.8) + (inch * 25.4) + (frac * 25.4 / 8));
const MM_FT = (mm) => { const totalIn = mm / 25.4; const ft = Math.floor(totalIn / 12); const inch = Math.round(totalIn % 12); return ft > 0 ? `${ft}' ${inch}"` : `${inch}"`; };

function UnitRow({ unit, onDelete }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "#f8fafc", borderRadius: 8, marginBottom: 6 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{unit.unit_name}</div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
          {unit.unit_type} · {MM_FT(unit.width_mm)} W × {MM_FT(unit.height_mm)} H × {MM_FT(unit.depth_mm)} D
          {unit.finish ? ` · ${unit.finish}` : ""}
        </div>
      </div>
      <Badge color="gray">{unit.quantity} pcs</Badge>
      <button onClick={() => onDelete(unit.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16, padding: 4 }}>✕</button>
    </div>
  );
}

function UnitsPanel({ roomId, tenantId }) {
  const { addNotification } = useApp();
  const [units, setUnits] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ unit_name: "", unit_type: "", width_ft: "", width_in: "", height_ft: "", height_in: "", depth_ft: "", depth_in: "", finish: "", material: "", quantity: 1, notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [roomId]);

  async function load() {
    const { data } = await supabase.from("units").select("*").eq("room_id", roomId).order("created_at");
    setUnits(data || []);
  }

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  async function save() {
    if (!form.unit_name) { addNotification("Unit name required", "error"); return; }
    setSaving(true);
    const width_mm = FIN_MM(+form.width_ft || 0, +form.width_in || 0);
    const height_mm = FIN_MM(+form.height_ft || 0, +form.height_in || 0);
    const depth_mm = FIN_MM(+form.depth_ft || 0, +form.depth_in || 0);
    const { error } = await supabase.from("units").insert({ ...form, width_mm, height_mm, depth_mm, room_id: roomId, tenant_id: tenantId, quantity: +form.quantity || 1 });
    if (error) addNotification(error.message, "error");
    else { addNotification("Unit added"); setModal(false); setForm({ unit_name: "", unit_type: "", width_ft: "", width_in: "", height_ft: "", height_in: "", depth_ft: "", depth_in: "", finish: "", material: "", quantity: 1, notes: "" }); load(); }
    setSaving(false);
  }

  async function deleteUnit(id) {
    await supabase.from("units").delete().eq("id", id);
    load();
  }

  const dimInput = (label, ftKey, inKey) => (
    <div>
      <label style={{ display: "block", fontSize: 12, color: "#374151", fontWeight: 600, marginBottom: 6 }}>{label}</label>
      <div style={{ display: "flex", gap: 8 }}>
        <input type="number" min="0" value={form[ftKey]} onChange={e => set(ftKey, e.target.value)} placeholder="ft"
          style={{ flex: 1, padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13 }} />
        <input type="number" min="0" max="11" value={form[inKey]} onChange={e => set(inKey, e.target.value)} placeholder="in"
          style={{ flex: 1, padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13 }} />
      </div>
    </div>
  );

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Units / Modules <Badge color="gray">{units.length}</Badge></span>
        <Btn size="sm" variant="outline" onClick={() => setModal(true)}>+ Add Unit</Btn>
      </div>
      {units.map(u => <UnitRow key={u.id} unit={u} onDelete={deleteUnit} />)}
      {units.length === 0 && <div style={{ fontSize: 12, color: "#94a3b8", padding: "10px 0" }}>No units added yet.</div>}

      <Modal open={modal} onClose={() => setModal(false)} title="Add Unit / Module">
        <Input label="Unit Name *" value={form.unit_name} onChange={e => set("unit_name", e.target.value)} placeholder="e.g. Master Bedroom Wardrobe" />
        <Select label="Unit Type" value={form.unit_type} onChange={e => set("unit_type", e.target.value)}>
          <option value="">-- Select Type --</option>
          {UNIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </Select>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {dimInput("Width (ft / in)", "width_ft", "width_in")}
          {dimInput("Height (ft / in)", "height_ft", "height_in")}
          {dimInput("Depth (ft / in)", "depth_ft", "depth_in")}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="Material" value={form.material} onChange={e => set("material", e.target.value)} placeholder="e.g. 18mm BWR Ply" />
          <Input label="Finish" value={form.finish} onChange={e => set("finish", e.target.value)} placeholder="e.g. Acrylic White" />
        </div>
        <Input label="Quantity" type="number" min="1" value={form.quantity} onChange={e => set("quantity", e.target.value)} />
        <Textarea label="Notes" value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? "Saving..." : "Add Unit"}</Btn>
        </div>
      </Modal>
    </div>
  );
}

const HOME_ROOM_TYPES = [
  "Master Bedroom","Children's Bedroom","Guest Room","Living Room","Kitchen",
  "Theater Room","Study Room","Utility Room","Dining Room","Pooja Room","Custom"
];
const OFFICE_ROOM_TYPES = [
  "Reception","Workstation","Conference Room","Director Cabin","Manager Cabin",
  "Pantry","Server Room","Storage","Custom"
];

const ROOM_STATUS_FLOW = [
  "design","cut_list_draft","designer_confirmed","validated","hardware_confirmed",
  "released","in_production","completed","dispatched"
];

export default function ProjectDetail({ projectId, onBack, onRefresh }) {
  const { tenant, user, addNotification, navigate } = useApp();
  // tenant used by UnitsPanel sub-component
  const [project, setProject] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomModal, setRoomModal] = useState(false);
  const [roomForm, setRoomForm] = useState({ room_type: "", room_name: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => { load(); }, [projectId]);

  async function load() {
    setLoading(true);
    const [{ data: proj }, { data: rm }] = await Promise.all([
      supabase.from("projects").select("*, clients(name, phone, email, address)").eq("id", projectId).single(),
      supabase.from("rooms").select("*, units(id), cut_list_revisions(id, status)").eq("project_id", projectId).order("sort_order")
    ]);
    setProject(proj);
    setRooms(rm || []);
    setLoading(false);
  }

  async function addRoom() {
    if (!roomForm.room_name) return addNotification("Room name required", "error");
    setSaving(true);
    const { error } = await supabase.from("rooms").insert({
      ...roomForm, project_id: projectId, tenant_id: tenant.id, sort_order: rooms.length
    });
    if (error) addNotification(error.message, "error");
    else { addNotification("Room added"); setRoomModal(false); setRoomForm({ room_type: "", room_name: "", notes: "" }); load(); }
    setSaving(false);
  }

  async function updateStatus() {
    await supabase.from("projects").update({ status: newStatus }).eq("id", projectId);
    addNotification("Project status updated");
    setStatusModal(false);
    load();
    onRefresh?.();
  }

  const roomTypes = project?.project_type === "office" ? OFFICE_ROOM_TYPES : HOME_ROOM_TYPES;

  if (loading) return <Spinner />;
  if (!project) return <div style={{ padding: 24 }}>Project not found</div>;

  return (
    <div style={{ padding: 24 }}>
      {/* Back + Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Btn variant="ghost" size="sm" onClick={onBack}>← Back</Btn>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b" }}>{project.name}</h1>
          <p style={{ fontSize: 12, color: "#64748b" }}>{project.clients?.name} · {project.project_type}</p>
        </div>
        <Badge color={statusColor(project.status)}>{project.status?.replace(/_/g," ")}</Badge>
        <Btn size="sm" variant="outline" onClick={() => { setNewStatus(project.status); setStatusModal(true); }}>
          Update Status
        </Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
        {/* Rooms */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
              Rooms / Areas <Badge color="gray">{rooms.length}</Badge>
            </h3>
            <Btn size="sm" onClick={() => setRoomModal(true)}>+ Add Room</Btn>
          </div>

          {rooms.length === 0 ? (
            <Card style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
              No rooms added. Start by adding rooms to this project.
            </Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {rooms.map(r => {
                const latestRevision = r.cut_list_revisions?.[r.cut_list_revisions.length - 1];
                return (
                  <Card key={r.id} style={{ padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>{r.room_name}</div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                          {r.room_type}
                          {latestRevision && ` · Rev ${r.cut_list_revisions.length}`}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Badge color={statusColor(r.status)}>{r.status?.replace(/_/g," ")}</Badge>
                        <Btn size="sm" onClick={() => navigate("cutlist", { roomId: r.id, projectId })}>
                          Cut List
                        </Btn>
                      </div>
                    </div>
                    <UnitsPanel roomId={r.id} tenantId={tenant?.id} />
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Project Info */}
        <div>
          <Card style={{ padding: 16, marginBottom: 12 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>Project Details</h4>
            {[
              ["Type", project.project_type],
              ["Status", project.status?.replace(/_/g," ")],
              ["Start", project.start_date ? new Date(project.start_date).toLocaleDateString("en-IN") : "—"],
              ["Due", project.expected_completion ? new Date(project.expected_completion).toLocaleDateString("en-IN") : "—"],
              ["Site", project.site_address || "—"],
            ].map(([k,v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f8fafc", fontSize: 12 }}>
                <span style={{ color: "#6b7280", fontWeight: 500 }}>{k}</span>
                <span style={{ color: "#374151", fontWeight: 600, textAlign: "right", maxWidth: 160 }}>{v}</span>
              </div>
            ))}
          </Card>

          <Card style={{ padding: 16 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>Client Info</h4>
            {[
              ["Name", project.clients?.name],
              ["Phone", project.clients?.phone || "—"],
              ["Email", project.clients?.email || "—"],
            ].map(([k,v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f8fafc", fontSize: 12 }}>
                <span style={{ color: "#6b7280" }}>{k}</span>
                <span style={{ color: "#374151", fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </Card>

          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <Btn variant="outline" style={{ width: "100%", justifyContent: "center" }} onClick={() => navigate("quotations", { projectId })}>
              📋 Quotations
            </Btn>
            <Btn variant="outline" style={{ width: "100%", justifyContent: "center" }} onClick={() => navigate("production", { projectId })}>
              ⚙️ Production
            </Btn>
            <Btn variant="outline" style={{ width: "100%", justifyContent: "center" }} onClick={() => navigate("dispatch", { projectId })}>
              🚚 Dispatch
            </Btn>
            <Btn variant="outline" style={{ width: "100%", justifyContent: "center" }} onClick={() => navigate("accounting", { projectId })}>
              💰 Invoices
            </Btn>
          </div>
        </div>
      </div>

      {/* Add Room Modal */}
      <Modal open={roomModal} onClose={() => setRoomModal(false)} title="Add Room / Area">
        <Select label="Room Type" required value={roomForm.room_type} onChange={e => setRoomForm(p => ({ ...p, room_type: e.target.value, room_name: e.target.value !== "Custom" ? e.target.value : p.room_name }))}>
          <option value="">-- Select Type --</option>
          {roomTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </Select>
        <Input label="Room Name" required value={roomForm.room_name}
          onChange={e => setRoomForm(p => ({ ...p, room_name: e.target.value }))}
          placeholder="e.g. Master Bedroom" />
        <Input label="Notes" value={roomForm.notes}
          onChange={e => setRoomForm(p => ({ ...p, notes: e.target.value }))} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn variant="ghost" onClick={() => setRoomModal(false)}>Cancel</Btn>
          <Btn onClick={addRoom} disabled={saving}>{saving ? "Adding..." : "Add Room"}</Btn>
        </div>
      </Modal>

      {/* Status Modal */}
      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Update Project Status">
        <Select label="New Status" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
          {["inquiry","quotation_sent","client_accepted","advance_received","in_production","dispatch_logged","final_invoice","payment_received","closed","on_hold","cancelled"]
            .map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
        </Select>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn variant="ghost" onClick={() => setStatusModal(false)}>Cancel</Btn>
          <Btn onClick={updateStatus}>Update</Btn>
        </div>
      </Modal>
    </div>
  );
}
