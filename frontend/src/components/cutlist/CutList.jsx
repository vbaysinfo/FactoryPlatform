import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { useApp } from "../../context/AppContext.jsx";
import { Card, Btn, Spinner, Badge, statusColor } from "../common/ui.jsx";
import CutListEditor from "./CutListEditor.jsx";

export default function CutList() {
  const { addNotification } = useApp();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({ room_name: "", room_type: "bedroom", notes: "" });
  const [saving, setSaving] = useState(false);

  const ROOM_TYPES = ["bedroom","living room","kitchen","bathroom","study","dining","wardrobe","office","other"];

  useEffect(() => { loadProjects(); }, []);

  async function loadProjects() {
    setLoading(true);
    const { data } = await supabase.from("projects").select("*, clients(name)").order("created_at", { ascending: false });
    setProjects(data || []);
    setLoading(false);
  }

  async function loadRooms(projectId) {
    setLoading(true);
    const { data } = await supabase.from("rooms")
      .select("*, cut_list_revisions(id, revision_number, status, created_at)")
      .eq("project_id", projectId).order("created_at");
    setRooms(data || []);
    setLoading(false);
  }

  async function addRoom() {
    if (!newRoom.room_name) return addNotification("Room name is required", "error");
    setSaving(true);
    const { error } = await supabase.from("rooms").insert({
      project_id: selectedProject.id,
      tenant_id: selectedProject.tenant_id,
      room_name: newRoom.room_name,
      room_type: newRoom.room_type,
      notes: newRoom.notes,
      status: "pending"
    });
    if (error) addNotification(error.message, "error");
    else { addNotification("Room added"); setShowAddRoom(false); setNewRoom({ room_name: "", room_type: "bedroom", notes: "" }); loadRooms(selectedProject.id); }
    setSaving(false);
  }

  if (selectedRoom) return (
    <CutListEditor
      room={selectedRoom}
      project={selectedProject}
      onBack={() => { setSelectedRoom(null); loadRooms(selectedProject.id); }}
    />
  );

  const inputStyle = { width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#1e293b", background: "#fff", boxSizing: "border-box" };
  const labelStyle = { display: "block", fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 };

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>Cut Lists</h1>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>Manage panel cut lists by project and room</p>
      </div>

      {/* Step 1: Select Project */}
      {!selectedProject ? (
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 14 }}>Select a Project</h2>
          {loading ? <Spinner /> : projects.length === 0 ? (
            <Card style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>No projects found. Create a project first.</Card>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
              {projects.map(p => (
                <div key={p.id} onClick={() => { setSelectedProject(p); loadRooms(p.id); }}
                  style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 20px", cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.boxShadow = "0 0 0 3px #3b82f615"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{p.clients?.name}</div>
                  {p.site_address && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>📍 {p.site_address}</div>}
                  <div style={{ marginTop: 10 }}>
                    <Badge color={statusColor(p.status)}>{p.status?.replace(/_/g, " ")}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Step 2: Show Rooms */
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <button onClick={() => { setSelectedProject(null); setRooms([]); }}
              style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              ← Back to Projects
            </button>
            <span style={{ color: "#e2e8f0" }}>|</span>
            <div>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{selectedProject.name}</span>
              <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>{selectedProject.clients?.name}</span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#374151" }}>Rooms ({rooms.length})</h2>
            <Btn size="sm" onClick={() => setShowAddRoom(true)}>+ Add Room</Btn>
          </div>

          {showAddRoom && (
            <Card style={{ padding: 20, marginBottom: 16, background: "#f8fafc" }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 14 }}>Add New Room</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Room Name *</label>
                  <input style={inputStyle} placeholder="e.g. Master Bedroom" value={newRoom.room_name}
                    onChange={e => setNewRoom(r => ({ ...r, room_name: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Room Type</label>
                  <select style={inputStyle} value={newRoom.room_type} onChange={e => setNewRoom(r => ({ ...r, room_type: e.target.value }))}>
                    {ROOM_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Notes</label>
                  <input style={inputStyle} placeholder="Optional notes" value={newRoom.notes}
                    onChange={e => setNewRoom(r => ({ ...r, notes: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <Btn onClick={addRoom} disabled={saving}>{saving ? "Adding..." : "Add Room"}</Btn>
                <Btn variant="ghost" onClick={() => setShowAddRoom(false)}>Cancel</Btn>
              </div>
            </Card>
          )}

          {loading ? <Spinner /> : rooms.length === 0 ? (
            <Card style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>
              No rooms yet. Add rooms to start creating cut lists.
            </Card>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
              {rooms.map(r => {
                const latest = r.cut_list_revisions?.slice(-1)[0];
                const panelCount = 0;
                return (
                  <div key={r.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 20px", cursor: "pointer", transition: "all 0.15s" }}
                    onClick={() => setSelectedRoom(r)}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.boxShadow = "0 0 0 3px #6366f115"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{r.room_name}</div>
                      <Badge color={statusColor(r.status || "pending")}>{(r.status || "pending").replace(/_/g, " ")}</Badge>
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10, textTransform: "capitalize" }}>🏠 {r.room_type || "Room"}</div>
                    {r.notes && <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 10 }}>{r.notes}</div>}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{r.cut_list_revisions?.length || 0} revision{r.cut_list_revisions?.length !== 1 ? "s" : ""}</span>
                      {latest ? <Badge color={statusColor(latest.status)}>{latest.status}</Badge> : <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600 }}>No cut list</span>}
                    </div>
                    <div style={{ marginTop: 10, fontSize: 12, color: "#3b82f6", fontWeight: 600 }}>Open Editor →</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
