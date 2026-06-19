import { useState } from "react";
import { supabase } from "../../lib/supabase.js";
import { useApp } from "../../context/AppContext.jsx";
import { Card, Btn, Input, PageHeader } from "../common/ui.jsx";

export default function Settings() {
  const { tenant, user, addNotification, refreshUser } = useApp();
  const [form, setForm] = useState({
    factory_name: tenant?.factory_name || "",
    owner_name: tenant?.owner_name || "",
    owner_phone: tenant?.owner_phone || "",
    address: tenant?.address || "",
    gst_number: tenant?.gst_number || "",
  });
  const [pwForm, setPwForm] = useState({ current:"", newPw:"", confirm:"" });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const f = (k) => ({ value: form[k], onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) });

  async function saveTenant() {
    setSaving(true);
    const { error } = await supabase.from("tenants").update(form).eq("id", tenant.id);
    if (error) addNotification(error.message, "error");
    else { addNotification("Settings saved"); refreshUser?.(); }
    setSaving(false);
  }

  async function changePassword() {
    if (!pwForm.newPw || pwForm.newPw !== pwForm.confirm) {
      return addNotification("Passwords don't match", "error");
    }
    if (pwForm.newPw.length < 6) return addNotification("Password must be at least 6 characters", "error");
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPw });
    if (error) addNotification(error.message, "error");
    else { addNotification("Password changed successfully"); setPwForm({ current:"", newPw:"", confirm:"" }); }
    setSavingPw(false);
  }

  return (
    <div style={{ padding: 24 }}>
      <PageHeader title="Settings" subtitle="Factory & account settings" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Factory Settings */}
        <Card style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Factory Information</h3>
          <Input label="Factory Name" {...f("factory_name")} />
          <Input label="Owner Name" {...f("owner_name")} />
          <Input label="Owner Phone" {...f("owner_phone")} />
          <Input label="Address" {...f("address")} />
          <Input label="GST Number" {...f("gst_number")} />
          <Btn onClick={saveTenant} disabled={saving}>{saving ? "Saving..." : "Save Settings"}</Btn>
        </Card>

        {/* Account Info */}
        <div>
          <Card style={{ padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Account Info</h3>
            {[["Name", user?.name], ["Email", user?.email], ["Role", user?.role?.replace(/_/g," ")],
              ["Tenant", tenant?.factory_name], ["Plan", tenant?.plan], ["Status", tenant?.subscription_status]
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f8fafc", fontSize: 13 }}>
                <span style={{ color: "#6b7280" }}>{k}</span>
                <span style={{ color: "#1e293b", fontWeight: 600 }}>{v || "—"}</span>
              </div>
            ))}
          </Card>

          <Card style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Change Password</h3>
            <Input label="New Password" type="password" value={pwForm.newPw} onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))} placeholder="Min 6 characters" />
            <Input label="Confirm Password" type="password" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} />
            <Btn onClick={changePassword} disabled={savingPw}>{savingPw ? "Changing..." : "Change Password"}</Btn>
          </Card>
        </div>
      </div>
    </div>
  );
}
