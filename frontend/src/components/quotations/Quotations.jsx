import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { useApp } from "../../context/AppContext.jsx";
import { Card, Btn, Input, Select, Textarea, Modal, Table, PageHeader, Badge, Spinner, statusColor } from "../common/ui.jsx";

const EMPTY = { type:"quotation", project_id:"", subtotal:"0", discount_percent:"0", gst_percent:"18", advance_percent:"30", validity_days:"30", payment_terms:"", notes:"" };

export default function Quotations() {
  const { tenant, user, addNotification, pageParams } = useApp();
  const [quotations, setQuotations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [lineItems, setLineItems] = useState([{ description:"", quantity:"1", unit_price:"0" }]);
  const [saving, setSaving] = useState(false);
  const [viewModal, setViewModal] = useState(null);

  useEffect(() => { if (tenant) { load(); loadProjects(); } }, [tenant]);
  useEffect(() => { if (pageParams?.projectId) setForm(p => ({ ...p, project_id: pageParams.projectId })); }, [pageParams]);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("quotations")
      .select("*, projects(name, clients(name)), quotation_line_items(*)")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false });
    setQuotations(data || []);
    setLoading(false);
  }

  async function loadProjects() {
    const { data } = await supabase.from("projects").select("id, name, clients(name)").eq("tenant_id", tenant.id);
    setProjects(data || []);
  }

  function calc() {
    const sub = lineItems.reduce((s, i) => s + (parseFloat(i.quantity || 0) * parseFloat(i.unit_price || 0)), 0);
    const disc = sub * parseFloat(form.discount_percent || 0) / 100;
    const taxable = sub - disc;
    const gst = taxable * parseFloat(form.gst_percent || 0) / 100;
    return { sub, disc, taxable, gst, grand: taxable + gst };
  }

  async function save() {
    if (!form.project_id) return addNotification("Select a project", "error");
    setSaving(true);
    const { sub, disc, taxable, gst, grand } = calc();
    const qNum = `QT-${Date.now().toString().slice(-6)}`;
    const validUntil = new Date(Date.now() + parseInt(form.validity_days || 30) * 86400000).toISOString().split("T")[0];

    const { data: q, error } = await supabase.from("quotations").insert({
      ...form, tenant_id: tenant.id, created_by: user.id,
      quotation_number: qNum, subtotal: sub, discount_amount: disc,
      gst_amount: gst, grand_total: grand, valid_until: validUntil,
      discount_percent: parseFloat(form.discount_percent),
      gst_percent: parseFloat(form.gst_percent)
    }).select().single();

    if (error) { addNotification(error.message, "error"); setSaving(false); return; }

    for (let i = 0; i < lineItems.length; i++) {
      const li = lineItems[i];
      if (!li.description) continue;
      const total = parseFloat(li.quantity || 1) * parseFloat(li.unit_price || 0);
      await supabase.from("quotation_line_items").insert({ quotation_id: q.id, ...li, total, sort_order: i });
    }

    addNotification("Quotation created");
    setModal(false);
    setForm(EMPTY);
    setLineItems([{ description:"", quantity:"1", unit_price:"0" }]);
    load();
    setSaving(false);
  }

  async function updateStatus(id, status) {
    await supabase.from("quotations").update({ status, ...(status === "accepted" ? { accepted_at: new Date().toISOString() } : status === "sent" ? { sent_at: new Date().toISOString() } : {}) }).eq("id", id);
    addNotification("Status updated");
    load();
  }

  const { sub, disc, gst, grand } = calc();
  const f = (k) => ({ value: form[k], onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) });

  return (
    <div style={{ padding: 24 }}>
      <PageHeader title="Quotations & Proposals" subtitle={`${quotations.length} total`}
        actions={<Btn onClick={() => { setForm(EMPTY); setModal(true); }}>+ New Quotation</Btn>} />

      <Card style={{ padding: 0 }}>
        {loading ? <Spinner /> : (
          <Table
            columns={[
              { key: "quotation_number", label: "Number", render: (v, r) => (
                <div style={{ fontWeight: 600 }}>{v} <span style={{ fontSize: 10, color: "#94a3b8" }}>v{r.version}</span></div>
              )},
              { key: "projects", label: "Project", render: v => (
                <div>
                  <div style={{ fontWeight: 600 }}>{v?.name}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{v?.clients?.name}</div>
                </div>
              )},
              { key: "type", label: "Type", render: v => <Badge color={v === "proposal" ? "purple" : "blue"}>{v}</Badge> },
              { key: "status", label: "Status", render: v => <Badge color={statusColor(v)}>{v}</Badge> },
              { key: "grand_total", label: "Amount", align: "right", render: v => `₹${(v||0).toLocaleString("en-IN")}` },
              { key: "valid_until", label: "Valid Until", render: v => v ? new Date(v).toLocaleDateString("en-IN") : "—" },
              { key: "id", label: "Actions", render: (id, r) => (
                <div style={{ display: "flex", gap: 4 }}>
                  <Btn size="sm" variant="ghost" onClick={() => setViewModal(r)}>View</Btn>
                  {r.status === "draft" && <Btn size="sm" onClick={() => updateStatus(id, "sent")}>Send</Btn>}
                  {r.status === "sent" && <Btn size="sm" variant="success" onClick={() => updateStatus(id, "accepted")}>Accept</Btn>}
                </div>
              )},
            ]}
            data={quotations}
            emptyText="No quotations yet."
          />
        )}
      </Card>

      {/* Create Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="New Quotation" width={700}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <Select label="Project" required {...f("project_id")}>
            <option value="">-- Select Project --</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name} — {p.clients?.name}</option>)}
          </Select>
          <Select label="Type" {...f("type")}>
            <option value="quotation">Quotation (with pricing)</option>
            <option value="proposal">Proposal (scope only)</option>
          </Select>
        </div>

        {/* Line Items */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", textTransform: "uppercase", letterSpacing: 0.4, display: "block", marginBottom: 8 }}>
            Line Items
          </label>
          {lineItems.map((li, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 32px", gap: 8, marginBottom: 8 }}>
              <input value={li.description} onChange={e => setLineItems(l => l.map((x,j) => j===i ? {...x,description:e.target.value} : x))}
                placeholder="Description"
                style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 7, fontSize: 13 }} />
              <input type="number" value={li.quantity} onChange={e => setLineItems(l => l.map((x,j) => j===i ? {...x,quantity:e.target.value} : x))}
                placeholder="Qty"
                style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 7, fontSize: 13 }} />
              <input type="number" value={li.unit_price} onChange={e => setLineItems(l => l.map((x,j) => j===i ? {...x,unit_price:e.target.value} : x))}
                placeholder="Price ₹"
                style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 7, fontSize: 13 }} />
              <button onClick={() => setLineItems(l => l.filter((_,j) => j!==i))}
                style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, color: "#dc2626", cursor: "pointer", fontSize: 16 }}>×</button>
            </div>
          ))}
          <Btn variant="ghost" size="sm" onClick={() => setLineItems(l => [...l, { description:"", quantity:"1", unit_price:"0" }])}>
            + Add Line
          </Btn>
        </div>

        {form.type === "quotation" && (
          <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 12px" }}>
              <Input label="Discount %" type="number" {...f("discount_percent")} />
              <Input label="GST %" type="number" {...f("gst_percent")} />
              <Input label="Advance %" type="number" {...f("advance_percent")} />
            </div>
            <div style={{ fontSize: 13, color: "#374151" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <span>Subtotal</span><span>₹{sub.toLocaleString("en-IN")}</span>
              </div>
              {disc > 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: "#dc2626" }}>
                <span>Discount</span><span>-₹{disc.toLocaleString("en-IN")}</span>
              </div>}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <span>GST ({form.gst_percent}%)</span><span>₹{gst.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontWeight: 700, borderTop: "1px solid #e2e8f0", marginTop: 4 }}>
                <span>Grand Total</span><span>₹{grand.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <Input label="Validity (days)" type="number" {...f("validity_days")} />
          <Input label="Payment Terms" {...f("payment_terms")} placeholder="e.g. 30% advance, 70% on delivery" />
        </div>
        <Textarea label="Notes" rows={2} {...f("notes")} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? "Saving..." : "Create Quotation"}</Btn>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewModal} onClose={() => setViewModal(null)} title={`Quotation ${viewModal?.quotation_number}`} width={640}>
        {viewModal && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
              {[["Project", viewModal.projects?.name], ["Client", viewModal.projects?.clients?.name],
                ["Type", viewModal.type], ["Status", viewModal.status],
                ["Valid Until", viewModal.valid_until ? new Date(viewModal.valid_until).toLocaleDateString("en-IN") : "—"],
                ["Grand Total", `₹${(viewModal.grand_total||0).toLocaleString("en-IN")}`]
              ].map(([k,v]) => (
                <div key={k} style={{ padding: "8px 12px", background: "#f8fafc", borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase" }}>{k}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{v}</div>
                </div>
              ))}
            </div>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Line Items</h4>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr style={{ background: "#f8fafc" }}>
                {["Description","Qty","Unit Price","Total"].map(h => (
                  <th key={h} style={{ padding: "6px 10px", textAlign: h==="Description" ? "left" : "right", fontWeight: 600, color: "#374151", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {viewModal.quotation_line_items?.map((li, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "6px 10px" }}>{li.description}</td>
                    <td style={{ padding: "6px 10px", textAlign: "right" }}>{li.quantity}</td>
                    <td style={{ padding: "6px 10px", textAlign: "right" }}>₹{(li.unit_price||0).toLocaleString("en-IN")}</td>
                    <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 600 }}>₹{(li.total||0).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ textAlign: "right", marginTop: 12, fontSize: 13 }}>
              <div>Subtotal: ₹{(viewModal.subtotal||0).toLocaleString("en-IN")}</div>
              {viewModal.discount_amount > 0 && <div style={{ color: "#dc2626" }}>Discount: -₹{(viewModal.discount_amount||0).toLocaleString("en-IN")}</div>}
              <div>GST ({viewModal.gst_percent}%): ₹{(viewModal.gst_amount||0).toLocaleString("en-IN")}</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 6 }}>Grand Total: ₹{(viewModal.grand_total||0).toLocaleString("en-IN")}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
