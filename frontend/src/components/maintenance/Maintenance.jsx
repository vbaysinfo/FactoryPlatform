import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { useApp } from "../../context/AppContext.jsx";
import { Card, Btn, Input, Select, Modal, Table, PageHeader, Badge, Spinner, statusColor } from "../common/ui.jsx";

const EMPTY_MACHINE = { name:"", machine_code:"", type:"", brand:"", model:"", serial_number:"", purchase_date:"", location:"", service_interval_days:"90" };
const EMPTY_LOG = { type:"preventive", description:"", vendor:"", cost:"0", downtime_hours:"0", started_at:"", notes:"" };

export default function Maintenance() {
  const { tenant, addNotification } = useApp();
  const [machines, setMachines] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("machines");
  const [machineModal, setMachineModal] = useState(false);
  const [logModal, setLogModal] = useState(null);
  const [machineForm, setMachineForm] = useState(EMPTY_MACHINE);
  const [logForm, setLogForm] = useState(EMPTY_LOG);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (tenant) { loadMachines(); loadLogs(); } }, [tenant]);

  async function loadMachines() {
    setLoading(true);
    const { data } = await supabase.from("machines").select("*").eq("tenant_id", tenant.id).order("name");
    setMachines(data || []);
    setLoading(false);
  }

  async function loadLogs() {
    const { data } = await supabase.from("maintenance_logs")
      .select("*, machines(name)")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setLogs(data || []);
  }

  async function saveMachine() {
    if (!machineForm.name) return addNotification("Machine name required", "error");
    setSaving(true);
    const payload = { ...machineForm, tenant_id: tenant.id };
    const { error } = editing
      ? await supabase.from("machines").update(payload).eq("id", editing.id)
      : await supabase.from("machines").insert(payload);
    if (error) addNotification(error.message, "error");
    else { addNotification("Saved"); setMachineModal(false); setMachineForm(EMPTY_MACHINE); setEditing(null); loadMachines(); }
    setSaving(false);
  }

  async function saveLog() {
    if (!logForm.description) return addNotification("Description required", "error");
    setSaving(true);
    await supabase.from("maintenance_logs").insert({
      ...logForm, machine_id: logModal.id, tenant_id: tenant.id,
      cost: parseFloat(logForm.cost), downtime_hours: parseFloat(logForm.downtime_hours)
    });
    addNotification("Maintenance log recorded");
    setLogModal(null);
    setLogForm(EMPTY_LOG);
    loadLogs();
    setSaving(false);
  }

  const mf = (k) => ({ value: machineForm[k], onChange: e => setMachineForm(p => ({ ...p, [k]: e.target.value })) });
  const lf = (k) => ({ value: logForm[k], onChange: e => setLogForm(p => ({ ...p, [k]: e.target.value })) });

  const overdueService = machines.filter(m => m.next_service_date && new Date(m.next_service_date) < new Date());

  return (
    <div style={{ padding: 24 }}>
      <PageHeader title="Maintenance Management" subtitle="Machines & maintenance logs"
        actions={<Btn onClick={() => { setEditing(null); setMachineForm(EMPTY_MACHINE); setMachineModal(true); }}>+ Add Machine</Btn>} />

      {overdueService.length > 0 && (
        <div style={{ background: "#fefce8", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#a16207" }}>
          ⚠️ {overdueService.length} machine(s) have overdue service: {overdueService.map(m => m.name).join(", ")}
        </div>
      )}

      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {["machines","logs"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "6px 16px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: tab === t ? "#3b82f6" : "#fff", color: tab === t ? "#fff" : "#374151" }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "machines" && (
        <Card style={{ padding: 0 }}>
          {loading ? <Spinner /> : (
            <Table
              columns={[
                { key: "name", label: "Machine", render: (v, r) => (
                  <div>
                    <div style={{ fontWeight: 600 }}>{v}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{r.brand} {r.model} · {r.machine_code}</div>
                  </div>
                )},
                { key: "type", label: "Type" },
                { key: "location", label: "Location" },
                { key: "status", label: "Status", render: v => <Badge color={v==="operational"?"green":v==="breakdown"?"red":"yellow"}>{v}</Badge> },
                { key: "last_service_date", label: "Last Service", render: v => v ? new Date(v).toLocaleDateString("en-IN") : "—" },
                { key: "next_service_date", label: "Next Service", render: v => {
                  if (!v) return "—";
                  const overdue = new Date(v) < new Date();
                  return <span style={{ color: overdue ? "#dc2626" : "#374151", fontWeight: overdue ? 700 : 400 }}>{new Date(v).toLocaleDateString("en-IN")}</span>;
                }},
                { key: "id", label: "Actions", render: (_, r) => (
                  <div style={{ display: "flex", gap: 4 }}>
                    <Btn size="sm" variant="ghost" onClick={() => { setEditing(r); setMachineForm({ ...EMPTY_MACHINE, ...r }); setMachineModal(true); }}>Edit</Btn>
                    <Btn size="sm" onClick={() => setLogModal(r)}>Log</Btn>
                  </div>
                )},
              ]}
              data={machines}
              emptyText="No machines added yet."
            />
          )}
        </Card>
      )}

      {tab === "logs" && (
        <Card style={{ padding: 0 }}>
          <Table
            columns={[
              { key: "machines", label: "Machine", render: v => <span style={{ fontWeight: 600 }}>{v?.name}</span> },
              { key: "type", label: "Type", render: v => <Badge color={v==="breakdown"?"red":v==="repair"?"orange":"blue"}>{v}</Badge> },
              { key: "description", label: "Description" },
              { key: "vendor", label: "Vendor" },
              { key: "cost", label: "Cost", align: "right", render: v => `₹${(v||0).toLocaleString("en-IN")}` },
              { key: "downtime_hours", label: "Downtime (hrs)", align: "center" },
              { key: "created_at", label: "Date", render: v => new Date(v).toLocaleDateString("en-IN") },
            ]}
            data={logs}
            emptyText="No maintenance logs yet."
          />
        </Card>
      )}

      {/* Machine Modal */}
      <Modal open={machineModal} onClose={() => { setMachineModal(false); setEditing(null); }} title={editing ? "Edit Machine" : "Add Machine"} width={600}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <div style={{ gridColumn: "1/-1" }}><Input label="Machine Name" required {...mf("name")} /></div>
          <Input label="Machine Code" {...mf("machine_code")} />
          <Input label="Type" {...mf("type")} placeholder="Panel Saw, Edge Bander, CNC" />
          <Input label="Brand" {...mf("brand")} />
          <Input label="Model" {...mf("model")} />
          <Input label="Serial Number" {...mf("serial_number")} />
          <Input label="Location" {...mf("location")} />
          <Input label="Purchase Date" type="date" {...mf("purchase_date")} />
          <Input label="Service Interval (days)" type="number" {...mf("service_interval_days")} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn variant="ghost" onClick={() => { setMachineModal(false); setEditing(null); }}>Cancel</Btn>
          <Btn onClick={saveMachine} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Add Machine"}</Btn>
        </div>
      </Modal>

      {/* Log Modal */}
      <Modal open={!!logModal} onClose={() => setLogModal(null)} title={`Maintenance Log: ${logModal?.name}`}>
        <Select label="Type" {...lf("type")}>
          <option value="preventive">Preventive</option>
          <option value="breakdown">Breakdown</option>
          <option value="repair">Repair</option>
          <option value="inspection">Inspection</option>
        </Select>
        <Input label="Description" required {...lf("description")} />
        <Input label="Vendor / Technician" {...lf("vendor")} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
          <Input label="Cost (₹)" type="number" {...lf("cost")} />
          <Input label="Downtime (hours)" type="number" {...lf("downtime_hours")} />
        </div>
        <Input label="Started At" type="datetime-local" {...lf("started_at")} />
        <Input label="Notes" {...lf("notes")} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn variant="ghost" onClick={() => setLogModal(null)}>Cancel</Btn>
          <Btn onClick={saveLog} disabled={saving}>{saving ? "Saving..." : "Record Log"}</Btn>
        </div>
      </Modal>
    </div>
  );
}
