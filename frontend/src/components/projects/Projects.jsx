import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { useApp } from "../../context/AppContext.jsx";
import { Card, Btn, Input, Select, Textarea, Modal, Table, PageHeader, Badge, Spinner, statusColor } from "../common/ui.jsx";
import ProjectDetail from "./ProjectDetail.jsx";

const EMPTY = {
  name:"", client_id:"", project_type:"home", status:"inquiry",
  site_address:"", start_date:"", expected_completion:"", notes:""
};

const PROJECT_STATUS = [
  "inquiry","quotation_sent","client_accepted","advance_received",
  "in_production","dispatch_logged","final_invoice","payment_received","closed","on_hold","cancelled"
];

export default function Projects() {
  const { tenant, user, addNotification, pageParams } = useApp();
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState(pageParams?.projectId || null);

  useEffect(() => { load(); loadClients(); }, []);
  useEffect(() => { if (pageParams?.projectId) setDetail(pageParams.projectId); }, [pageParams]);

  async function load() {
    setLoading(true);
    let q = supabase.from("projects").select("*, clients(name, phone), rooms(id)").order("created_at", { ascending: false });
    if (tenant?.id) q = q.eq("tenant_id", tenant.id);
    const { data } = await q;
    setProjects(data || []);
    setLoading(false);
  }

  async function loadClients() {
    let q = supabase.from("clients").select("id, name").eq("is_active", true);
    if (tenant?.id) q = q.eq("tenant_id", tenant.id);
    const { data } = await q;
    setClients(data || []);
  }

  async function save() {
    if (!form.name || !form.client_id) return addNotification("Name and Client are required", "error");
    setSaving(true);
    const payload = { ...form };
    if (tenant?.id) payload.tenant_id = tenant.id;
    const { error } = await supabase.from("projects").insert(payload);
    if (error) addNotification(error.message, "error");
    else { addNotification("Project created"); setModal(false); setForm(EMPTY); load(); }
    setSaving(false);
  }

  const f = (k) => ({ value: form[k], onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) });

  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || p.clients?.name?.toLowerCase().includes(q);
    const matchStatus = !filterStatus || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (detail) return <ProjectDetail projectId={detail} onBack={() => setDetail(null)} onRefresh={load} />;

  return (
    <div style={{ padding: 24 }}>
      <PageHeader title="Projects" subtitle={`${projects.length} total`}
        actions={<Btn onClick={() => { setForm(EMPTY); setModal(true); }}>+ New Project</Btn>} />

      <Card style={{ padding: 0 }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search projects or clients..."
            style={{ flex: 1, minWidth: 200, padding: "7px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 }} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: "7px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 }}>
            <option value="">All Status</option>
            {PROJECT_STATUS.map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
          </select>
        </div>

        {loading ? <Spinner /> : (
          <Table
            columns={[
              { key: "name", label: "Project", render: (v, r) => (
                <div>
                  <div style={{ fontWeight: 600, color: "#1e293b" }}>{v}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{r.clients?.name}</div>
                </div>
              )},
              { key: "project_type", label: "Type", render: v => <Badge color={v === "office" ? "blue" : "purple"}>{v}</Badge> },
              { key: "status", label: "Status", render: v => <Badge color={statusColor(v)}>{v?.replace(/_/g," ")}</Badge> },
              { key: "rooms", label: "Rooms", align: "center", render: v => <Badge color="gray">{v?.length || 0}</Badge> },
              { key: "start_date", label: "Start", render: v => v ? new Date(v).toLocaleDateString("en-IN") : "—" },
              { key: "expected_completion", label: "Due", render: v => v ? new Date(v).toLocaleDateString("en-IN") : "—" },
              { key: "id", label: "Actions", render: (_, r) => (
                <Btn size="sm" onClick={() => setDetail(r.id)}>Open →</Btn>
              )},
            ]}
            data={filtered}
            emptyText="No projects yet. Create your first project!"
          />
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="New Project" width={560}>
        <Input label="Project Name" required {...f("name")} placeholder="e.g. Kumar Residence - Full Home" />
        <Select label="Client" required {...f("client_id")}>
          <option value="">-- Select Client --</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select label="Project Type" required {...f("project_type")}>
          <option value="home">Home</option>
          <option value="office">Office</option>
        </Select>
        <Select label="Initial Status" {...f("status")}>
          {PROJECT_STATUS.map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
        </Select>
        <Input label="Site Address" {...f("site_address")} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <Input label="Start Date" type="date" {...f("start_date")} />
          <Input label="Expected Completion" type="date" {...f("expected_completion")} />
        </div>
        <Textarea label="Notes" rows={2} {...f("notes")} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? "Saving..." : "Create Project"}</Btn>
        </div>
      </Modal>
    </div>
  );
}
