import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { useApp } from "../../context/AppContext.jsx";
import { Card, Btn, Input, Select, Modal, Table, PageHeader, Badge, Spinner } from "../common/ui.jsx";

const ROLES = ["designer","stage_operator","inventory_manager","accounts","driver","supervisor","sales_manager","production_manager"];
const EMPTY = { name:"", employee_code:"", phone:"", email:"", role:"stage_operator", department:"", date_of_joining:"", salary_type:"monthly", basic_salary:"", address:"", emergency_contact:"" };

export default function Employees() {
  const { tenant, user, addNotification } = useApp();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("list"); // list | attendance

  useEffect(() => { if (tenant) load(); }, [tenant]);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("employees").select("*").eq("tenant_id", tenant.id).order("name");
    setEmployees(data || []);
    setLoading(false);
  }

  async function save() {
    if (!form.name) return addNotification("Name required", "error");
    setSaving(true);
    const payload = { ...form, tenant_id: tenant.id, basic_salary: parseFloat(form.basic_salary || 0) };
    const { error } = editing
      ? await supabase.from("employees").update(payload).eq("id", editing.id)
      : await supabase.from("employees").insert(payload);
    if (error) addNotification(error.message, "error");
    else { addNotification("Saved"); setModal(false); setForm(EMPTY); setEditing(null); load(); }
    setSaving(false);
  }

  async function toggleActive(emp) {
    await supabase.from("employees").update({ is_active: !emp.is_active }).eq("id", emp.id);
    load();
  }

  const f = (k) => ({ value: form[k], onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) });

  return (
    <div style={{ padding: 24 }}>
      <PageHeader title="Employee Management" subtitle={`${employees.filter(e => e.is_active).length} active employees`}
        actions={<Btn onClick={() => { setEditing(null); setForm(EMPTY); setModal(true); }}>+ Add Employee</Btn>} />

      <Card style={{ padding: 0 }}>
        {loading ? <Spinner /> : (
          <Table
            columns={[
              { key: "name", label: "Employee", render: (v, r) => (
                <div>
                  <div style={{ fontWeight: 600 }}>{v}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{r.employee_code} · {r.department}</div>
                </div>
              )},
              { key: "role", label: "Role", render: v => <Badge color="blue">{v?.replace("_"," ")}</Badge> },
              { key: "phone", label: "Phone" },
              { key: "salary_type", label: "Salary Type", render: v => <Badge color="gray">{v?.replace("_"," ")}</Badge> },
              { key: "basic_salary", label: "Salary", align: "right", render: v => v ? `₹${parseFloat(v).toLocaleString("en-IN")}` : "—" },
              { key: "is_active", label: "Status", render: v => <Badge color={v ? "green" : "gray"}>{v ? "Active" : "Inactive"}</Badge> },
              { key: "id", label: "Actions", render: (_, r) => (
                <div style={{ display: "flex", gap: 4 }}>
                  <Btn size="sm" variant="ghost" onClick={() => { setEditing(r); setForm({ ...EMPTY, ...r, basic_salary: String(r.basic_salary || "") }); setModal(true); }}>Edit</Btn>
                  <Btn size="sm" variant="ghost" onClick={() => toggleActive(r)}>{r.is_active ? "Deactivate" : "Activate"}</Btn>
                </div>
              )},
            ]}
            data={employees}
            emptyText="No employees added yet."
          />
        )}
      </Card>

      <Modal open={modal} onClose={() => { setModal(false); setEditing(null); }} title={editing ? "Edit Employee" : "Add Employee"} width={620}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <div style={{ gridColumn: "1/-1" }}><Input label="Full Name" required {...f("name")} /></div>
          <Input label="Employee Code" {...f("employee_code")} placeholder="EMP001" />
          <Input label="Phone" type="tel" {...f("phone")} />
          <Input label="Email" type="email" {...f("email")} />
          <Select label="Role" {...f("role")}>
            {ROLES.map(r => <option key={r} value={r}>{r.replace("_"," ")}</option>)}
          </Select>
          <Input label="Department" {...f("department")} placeholder="Production, Design, Accounts" />
          <Input label="Date of Joining" type="date" {...f("date_of_joining")} />
          <Select label="Salary Type" {...f("salary_type")}>
            <option value="monthly">Monthly</option>
            <option value="daily">Daily</option>
            <option value="piece_rate">Piece Rate</option>
          </Select>
          <div style={{ gridColumn: "1/-1" }}><Input label="Basic Salary (₹)" type="number" {...f("basic_salary")} /></div>
          <div style={{ gridColumn: "1/-1" }}><Input label="Address" {...f("address")} /></div>
          <div style={{ gridColumn: "1/-1" }}><Input label="Emergency Contact" {...f("emergency_contact")} /></div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn variant="ghost" onClick={() => { setModal(false); setEditing(null); }}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Add Employee"}</Btn>
        </div>
      </Modal>
    </div>
  );
}
