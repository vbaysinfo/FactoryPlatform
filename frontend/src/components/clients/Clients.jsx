import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { useApp } from "../../context/AppContext.jsx";
import { Card, Btn, Input, Textarea, Modal, Table, PageHeader, Badge, Spinner } from "../common/ui.jsx";

const EMPTY = { name:"", contact_person:"", phone:"", email:"", address:"", city:"", state:"", pincode:"", gst_number:"", pan_number:"", notes:"" };

export default function Clients() {
  const { tenant, user, addNotification } = useApp();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    let query = supabase.from("clients").select("*, projects(id)").order("created_at", { ascending: false });
    if (tenant?.id) query = query.eq("tenant_id", tenant.id);
    const { data, error } = await query;
    if (error) addNotification(error.message, "error");
    setClients(data || []);
    setLoading(false);
  }

  function openNew() { setEditing(null); setForm(EMPTY); setModal(true); }
  function openEdit(c) { setEditing(c); setForm({ ...EMPTY, ...c }); setModal(true); }

  async function save() {
    if (!form.name.trim()) return addNotification("Client name is required", "error");
    setSaving(true);
    const { id, created_at, updated_at, projects, ...formData } = form;
    const payload = { ...formData };
    if (tenant?.id) payload.tenant_id = tenant.id;
    if (user?.id) payload.created_by = user.id;
    const { error } = editing
      ? await supabase.from("clients").update(payload).eq("id", editing.id)
      : await supabase.from("clients").insert(payload);
    if (error) { addNotification(error.message, "error"); }
    else { addNotification(editing ? "Client updated" : "Client created"); setModal(false); load(); }
    setSaving(false);
  }

  async function toggleActive(c) {
    await supabase.from("clients").update({ is_active: !c.is_active }).eq("id", c.id);
    load();
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || "").includes(search) ||
    (c.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const f = (k) => ({ value: form[k], onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) });

  return (
    <div style={{ padding: 24 }}>
      <PageHeader title="Clients" subtitle={`${clients.length} total clients`}
        actions={<Btn onClick={openNew}>+ New Client</Btn>} />

      <Card style={{ padding: 0 }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, phone, email..."
            style={{ width: "100%", maxWidth: 340, padding: "7px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 }} />
        </div>

        {loading ? <Spinner /> : (
          <Table
            columns={[
              { key: "name", label: "Client Name", render: (v, r) => (
                <div>
                  <div style={{ fontWeight: 600, color: "#1e293b" }}>{v}</div>
                  {r.contact_person && <div style={{ fontSize: 11, color: "#64748b" }}>{r.contact_person}</div>}
                </div>
              )},
              { key: "phone", label: "Phone" },
              { key: "email", label: "Email" },
              { key: "city", label: "City" },
              { key: "gst_number", label: "GST No." },
              { key: "projects", label: "Projects", align: "center", render: (v) => <Badge color="blue">{v?.length || 0}</Badge> },
              { key: "is_active", label: "Status", render: (v) => <Badge color={v ? "green" : "gray"}>{v ? "Active" : "Inactive"}</Badge> },
              { key: "id", label: "Actions", render: (_, r) => (
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn size="sm" variant="ghost" onClick={() => openEdit(r)}>Edit</Btn>
                  <Btn size="sm" variant="ghost" onClick={() => toggleActive(r)}>{r.is_active ? "Deactivate" : "Activate"}</Btn>
                </div>
              )},
            ]}
            data={filtered}
            emptyText="No clients found. Add your first client!"
          />
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Client" : "New Client"} width={620}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <div style={{ gridColumn: "1 / -1" }}><Input label="Client Name" required {...f("name")} /></div>
          <Input label="Contact Person" {...f("contact_person")} />
          <Input label="Phone" type="tel" {...f("phone")} />
          <Input label="Email" type="email" {...f("email")} />
          <Input label="Address" {...f("address")} />
          <Input label="City" {...f("city")} />
          <Input label="State" {...f("state")} />
          <Input label="Pincode" {...f("pincode")} />
          <Input label="GST Number" {...f("gst_number")} />
          <Input label="PAN Number" {...f("pan_number")} />
          <div style={{ gridColumn: "1 / -1" }}><Textarea label="Notes" rows={2} {...f("notes")} /></div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
          <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create Client"}</Btn>
        </div>
      </Modal>
    </div>
  );
}
