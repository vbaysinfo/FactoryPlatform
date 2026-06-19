import { useState, useEffect } from "react";
import { api } from "../../lib/api.js";
import { useApp } from "../../context/AppContext.jsx";
import { Card, Btn, Input, Select, Modal, Table, PageHeader, Badge, Spinner, StatCard } from "../common/ui.jsx";

export default function SuperAdmin() {
  const { addNotification } = useApp();
  const [tab, setTab] = useState("tenants");
  const [tenants, setTenants] = useState([]);
  const [platform, setPlatform] = useState(null);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({ factory_name:"", owner_name:"", owner_email:"", owner_phone:"", address:"", gst_number:"", plan:"basic", trial_days:"14" });
  const [saving, setSaving] = useState(false);
  const [volumeModal, setVolumeModal] = useState(null);
  const [volume, setVolume] = useState(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [t, p] = await Promise.all([
        api.get("/api/admin/overview"),
        api.get("/api/admin/platform-analytics")
      ]);
      setTenants(t || []);
      setPlatform(p);
    } catch (e) { addNotification(e.message, "error"); }
    setLoading(false);
  }

  async function createTenant() {
    if (!form.factory_name || !form.owner_email) return addNotification("Factory name and email required", "error");
    setSaving(true);
    try {
      const result = await api.post("/api/admin/tenants", form);
      addNotification(`Tenant created! Temp pw: ${result.tempPassword}`);
      setCreateModal(false);
      loadAll();
    } catch (e) { addNotification(e.message, "error"); }
    setSaving(false);
  }

  async function toggleTenant(id, suspended) {
    if (suspended) { await api.patch(`/api/admin/tenants/${id}/activate`, {}); addNotification("Activated"); }
    else { if (!confirm("Suspend this tenant?")) return; await api.patch(`/api/admin/tenants/${id}/suspend`, {}); addNotification("Suspended"); }
    loadAll();
  }

  async function loadVolume(tenant) {
    setVolumeModal(tenant); setVolume(null);
    const v = await api.get(`/api/admin/tenants/${tenant.id}/volume`);
    setVolume(v);
  }

  const f = (k) => ({ value: form[k], onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) });

  if (loading) return <div style={{ padding: 24 }}><Spinner /></div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b" }}>Super Admin Panel</h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Platform management - Tenant provisioning - Business monitoring</p>
        </div>
        <Btn onClick={() => setCreateModal(true)}>+ New Tenant</Btn>
      </div>

      {platform && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16, marginBottom: 24 }}>
          <StatCard label="Total Tenants" value={platform.totalTenants || 0} icon="F" color="#3b82f6" />
          <StatCard label="Active" value={platform.activeTenants || 0} icon="A" color="#10b981" />
          <StatCard label="On Trial" value={platform.trialTenants || 0} icon="T" color="#f59e0b" />
          {Object.entries(platform.planDistribution || {}).map(([plan, count]) => (
            <StatCard key={plan} label={`${plan} plan`} value={count} icon="P" color="#6366f1" />
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {["tenants","analytics"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "6px 16px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: tab === t ? "#3b82f6" : "#fff", color: tab === t ? "#fff" : "#374151" }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "tenants" && (
        <Card style={{ padding: 0 }}>
          <Table
            columns={[
              { key: "factory_name", label: "Factory", render: (v, r) => (
                <div>
                  <div style={{ fontWeight: 600 }}>{v}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{r.owner_name} - {r.owner_email}</div>
                </div>
              )},
              { key: "plan", label: "Plan", render: v => <Badge color="purple">{v}</Badge> },
              { key: "subscription_status", label: "Status", render: v => <Badge color={v==="active"?"green":v==="trial"?"yellow":v==="suspended"?"red":"gray"}>{v}</Badge> },
              { key: "trial_end", label: "Trial End", render: v => v ? new Date(v).toLocaleDateString("en-IN") : "-" },
              { key: "stats", label: "Projects", align: "center", render: v => v?.projects ?? "-" },
              { key: "stats", label: "Clients", align: "center", render: v => v?.clients ?? "-" },
              { key: "lastActivity", label: "Last Active", render: v => v ? new Date(v).toLocaleDateString("en-IN") : "Never" },
              { key: "id", label: "Actions", render: (id, r) => (
                <div style={{ display: "flex", gap: 4 }}>
                  <Btn size="sm" variant="ghost" onClick={() => loadVolume(r)}>Volume</Btn>
                  <Btn size="sm" variant="ghost" onClick={() => toggleTenant(id, r.subscription_status === "suspended")}>
                    {r.subscription_status === "suspended" ? "Activate" : "Suspend"}
                  </Btn>
                </div>
              )},
            ]}
            data={tenants}
            emptyText="No tenants yet."
          />
        </Card>
      )}

      {tab === "analytics" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <Card style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Plan Distribution</h3>
            {Object.entries(platform?.planDistribution || {}).map(([plan, count]) => (
              <div key={plan} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f8fafc", fontSize: 13 }}>
                <span style={{ textTransform: "capitalize" }}>{plan}</span>
                <Badge color="blue">{count} tenants</Badge>
              </div>
            ))}
          </Card>
          <Card style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Platform Health</h3>
            {[
              ["Total Tenants", platform?.totalTenants || 0, "#3b82f6"],
              ["Active Subscriptions", platform?.activeTenants || 0, "#10b981"],
              ["On Trial", platform?.trialTenants || 0, "#f59e0b"],
            ].map(([label, val, color]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f8fafc" }}>
                <span style={{ fontSize: 13, color: "#374151" }}>{label}</span>
                <span style={{ fontSize: 18, fontWeight: 700, color }}>{val}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create New Tenant" width={600}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <div style={{ gridColumn: "1/-1" }}><Input label="Factory Name" required {...f("factory_name")} /></div>
          <Input label="Owner Name" {...f("owner_name")} />
          <Input label="Owner Email" required type="email" {...f("owner_email")} />
          <Input label="Owner Phone" {...f("owner_phone")} />
          <Select label="Plan" {...f("plan")}>
            <option value="basic">Basic</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
          </Select>
          <Input label="Trial Days" type="number" {...f("trial_days")} />
          <div style={{ gridColumn: "1/-1" }}><Input label="GST Number" {...f("gst_number")} /></div>
        </div>
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 14px", margin: "8px 0 16px", fontSize: 12, color: "#1d4ed8" }}>
          A temporary password will be auto-generated and emailed to the owner.
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn variant="ghost" onClick={() => setCreateModal(false)}>Cancel</Btn>
          <Btn onClick={createTenant} disabled={saving}>{saving ? "Creating..." : "Create Tenant"}</Btn>
        </div>
      </Modal>

      <Modal open={!!volumeModal} onClose={() => { setVolumeModal(null); setVolume(null); }} title={`Volume - ${volumeModal?.factory_name}`}>
        {!volume ? <Spinner /> : (
          <div>
            <p style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>This month - aggregated totals only</p>
            {[["Projects Created", volume.ordersCreated], ["Total Invoiced", `Rs.${(volume.totalInvoiced||0).toLocaleString("en-IN")}`], ["Total Received", `Rs.${(volume.totalReceived||0).toLocaleString("en-IN")}`], ["Jobs Completed", volume.jobsCompleted], ["Active Jobs", volume.activeJobs]].map(([l,v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
                <span style={{ color: "#6b7280" }}>{l}</span>
                <span style={{ fontWeight: 700, color: "#1e293b" }}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
