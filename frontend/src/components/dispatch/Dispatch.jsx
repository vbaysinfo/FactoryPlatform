import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { useApp } from "../../context/AppContext.jsx";
import { Card, Btn, Input, Select, Modal, Table, PageHeader, Badge, Spinner, statusColor } from "../common/ui.jsx";

const EMPTY = { project_id:"", scheduled_date:"", vehicle_type:"", vehicle_number:"", driver_contact:"", destination_address:"", delivery_notes:"" };
const STATUS_FLOW = ["pending","scheduled","dispatched","in_transit","delivered","installation_pending"];

export default function Dispatch() {
  const { tenant, user, addNotification } = useApp();
  const [orders, setOrders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [viewModal, setViewModal] = useState(null);

  useEffect(() => { if (tenant) { load(); loadProjects(); loadDrivers(); } }, [tenant]);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("dispatch_orders")
      .select("*, projects(name, clients(name)), dispatch_items(*)")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }

  async function loadProjects() {
    const { data } = await supabase.from("projects").select("id, name, clients(name)").eq("tenant_id", tenant.id);
    setProjects(data || []);
  }

  async function loadDrivers() {
    const { data } = await supabase.from("employees").select("id, name").eq("tenant_id", tenant.id).eq("role", "driver");
    setDrivers(data || []);
  }

  async function save() {
    if (!form.project_id) return addNotification("Select a project", "error");
    setSaving(true);
    const dNum = `DS-${Date.now().toString().slice(-6)}`;
    const { error } = await supabase.from("dispatch_orders").insert({
      ...form, tenant_id: tenant.id, created_by: user.id,
      dispatch_number: dNum, status: "pending"
    });
    if (error) addNotification(error.message, "error");
    else { addNotification("Dispatch order created"); setModal(false); setForm(EMPTY); load(); }
    setSaving(false);
  }

  async function updateStatus(id, status) {
    const updates = { status };
    if (status === "dispatched") updates.actual_dispatch_date = new Date().toISOString().split("T")[0];
    await supabase.from("dispatch_orders").update(updates).eq("id", id);
    addNotification("Status updated");
    load();
  }

  const f = (k) => ({ value: form[k], onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) });

  return (
    <div style={{ padding: 24 }}>
      <PageHeader title="Dispatch & Transport" subtitle={`${orders.length} dispatch orders`}
        actions={<Btn onClick={() => { setForm(EMPTY); setModal(true); }}>+ New Dispatch</Btn>} />

      <Card style={{ padding: 0 }}>
        {loading ? <Spinner /> : (
          <Table
            columns={[
              { key: "dispatch_number", label: "Dispatch #", render: (v, r) => (
                <div>
                  <div style={{ fontWeight: 600 }}>{v}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{r.projects?.clients?.name}</div>
                </div>
              )},
              { key: "projects", label: "Project", render: v => v?.name },
              { key: "status", label: "Status", render: v => <Badge color={statusColor(v)}>{v?.replace("_"," ")}</Badge> },
              { key: "scheduled_date", label: "Scheduled", render: v => v ? new Date(v).toLocaleDateString("en-IN") : "—" },
              { key: "vehicle_number", label: "Vehicle" },
              { key: "driver_contact", label: "Driver" },
              { key: "dispatch_items", label: "Items", align: "center", render: v => v?.length || 0 },
              { key: "id", label: "Actions", render: (id, r) => (
                <div style={{ display: "flex", gap: 4 }}>
                  <Btn size="sm" variant="ghost" onClick={() => setViewModal(r)}>View</Btn>
                  {r.status === "pending" && <Btn size="sm" onClick={() => updateStatus(id, "dispatched")}>Dispatch</Btn>}
                  {r.status === "dispatched" && <Btn size="sm" variant="success" onClick={() => updateStatus(id, "delivered")}>Delivered</Btn>}
                </div>
              )},
            ]}
            data={orders}
            emptyText="No dispatch orders yet."
          />
        )}
      </Card>

      {/* Status flow visual */}
      <Card style={{ padding: 16, marginTop: 16 }}>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10 }}>Dispatch Status Flow</h4>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {STATUS_FLOW.map((s, i) => (
            <>
              <Badge key={s} color={["delivered","installation_pending"].includes(s) ? "green" : "blue"}>{s.replace(/_/g," ")}</Badge>
              {i < STATUS_FLOW.length - 1 && <span style={{ color: "#94a3b8" }}>→</span>}
            </>
          ))}
        </div>
      </Card>

      {/* Create Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="New Dispatch Order" width={560}>
        <Select label="Project" required {...f("project_id")}>
          <option value="">-- Select Project --</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name} — {p.clients?.name}</option>)}
        </Select>
        <Input label="Scheduled Date" type="date" {...f("scheduled_date")} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
          <Input label="Vehicle Type" {...f("vehicle_type")} placeholder="Truck, Tempo, Van" />
          <Input label="Vehicle Number" {...f("vehicle_number")} placeholder="TN 01 AB 1234" />
        </div>
        <Select label="Driver" value={form.driver_id || ""} onChange={e => setForm(p => ({ ...p, driver_id: e.target.value }))}>
          <option value="">-- Select Driver --</option>
          {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
        <Input label="Driver Contact" {...f("driver_contact")} />
        <Input label="Delivery Address" {...f("destination_address")} />
        <Input label="Notes" {...f("delivery_notes")} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? "Saving..." : "Create Order"}</Btn>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewModal} onClose={() => setViewModal(null)} title={`Dispatch: ${viewModal?.dispatch_number}`} width={500}>
        {viewModal && (
          <div>
            {[
              ["Project", viewModal.projects?.name],
              ["Client", viewModal.projects?.clients?.name],
              ["Status", viewModal.status?.replace(/_/g," ")],
              ["Scheduled", viewModal.scheduled_date ? new Date(viewModal.scheduled_date).toLocaleDateString("en-IN") : "—"],
              ["Vehicle", `${viewModal.vehicle_type || ""} ${viewModal.vehicle_number || ""}`.trim() || "—"],
              ["Driver", viewModal.driver_contact || "—"],
              ["Destination", viewModal.destination_address || "—"],
            ].map(([k,v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
                <span style={{ color: "#6b7280" }}>{k}</span>
                <span style={{ color: "#1e293b", fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
