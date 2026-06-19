import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { useApp } from "../../context/AppContext.jsx";
import { Card, Btn, Input, Select, Modal, Table, PageHeader, Badge } from "../common/ui.jsx";

const ROLES = ["tenant_admin","sales_manager","designer","production_manager","stage_operator","inventory_manager","accounts","driver"];
const EMPTY = { name:"", email:"", role:"stage_operator", phone:"" };

export default function UserManagement() {
  const { tenant, addNotification } = useApp();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (tenant) load(); }, [tenant]);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("users").select("*").eq("tenant_id", tenant.id).order("name");
    setUsers(data || []);
    setLoading(false);
  }

  async function invite() {
    if (!form.email || !form.name) return addNotification("Name and email required", "error");
    setSaving(true);
    const tempPw = Math.random().toString(36).slice(-8) + "A1!";

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: form.email, password: tempPw, email_confirm: true
    });

    if (authError) {
      // If admin API not available, create placeholder user record
      const { error } = await supabase.from("users").insert({
        ...form, tenant_id: tenant.id, must_change_password: true, is_active: true
      });
      if (error) addNotification(error.message, "error");
      else addNotification(`User record created. Share credentials manually: ${form.email} / ${tempPw}`);
    } else {
      await supabase.from("users").insert({
        ...form, tenant_id: tenant.id, auth_user_id: authData.user.id,
        must_change_password: true, is_active: true
      });
      addNotification(`User invited: ${form.email} · Temp password: ${tempPw}`);
    }

    setModal(false);
    setForm(EMPTY);
    load();
    setSaving(false);
  }

  async function toggleActive(u) {
    await supabase.from("users").update({ is_active: !u.is_active }).eq("id", u.id);
    load();
  }

  const f = (k) => ({ value: form[k], onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) });

  return (
    <div style={{ padding: 24 }}>
      <PageHeader title="User Management" subtitle="Manage workspace users and roles"
        actions={<Btn onClick={() => { setForm(EMPTY); setModal(true); }}>+ Invite User</Btn>} />

      <Card style={{ padding: 0 }}>
        <Table
          columns={[
            { key: "name", label: "Name", render: (v, r) => (
              <div>
                <div style={{ fontWeight: 600 }}>{v}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{r.email}</div>
              </div>
            )},
            { key: "role", label: "Role", render: v => <Badge color="blue">{v?.replace(/_/g," ")}</Badge> },
            { key: "phone", label: "Phone" },
            { key: "is_active", label: "Status", render: v => <Badge color={v ? "green" : "gray"}>{v ? "Active" : "Inactive"}</Badge> },
            { key: "must_change_password", label: "First Login", render: v => v ? <Badge color="yellow">Pending</Badge> : <Badge color="green">Done</Badge> },
            { key: "created_at", label: "Added", render: v => new Date(v).toLocaleDateString("en-IN") },
            { key: "id", label: "Actions", render: (_, r) => (
              <div style={{ display: "flex", gap: 4 }}>
                <Btn size="sm" variant="ghost" onClick={() => toggleActive(r)}>{r.is_active ? "Deactivate" : "Activate"}</Btn>
              </div>
            )},
          ]}
          data={users}
          emptyText="No users yet."
        />
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Invite New User">
        <Input label="Full Name" required {...f("name")} />
        <Input label="Email" required type="email" {...f("email")} />
        <Input label="Phone" type="tel" {...f("phone")} />
        <Select label="Role" required {...f("role")}>
          {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g," ")}</option>)}
        </Select>
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#92400e" }}>
          ℹ️ A temporary password will be generated. Share it with the user for first login.
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
          <Btn onClick={invite} disabled={saving}>{saving ? "Inviting..." : "Create User"}</Btn>
        </div>
      </Modal>
    </div>
  );
}
