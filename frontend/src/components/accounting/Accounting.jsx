import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { useApp } from "../../context/AppContext.jsx";
import { Card, Btn, Input, Select, Modal, Table, PageHeader, Badge, Spinner, StatCard, statusColor } from "../common/ui.jsx";

export default function Accounting() {
  const { tenant, user, addNotification } = useApp();
  const [tab, setTab] = useState("invoices");
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(null);
  const [expenseModal, setExpenseModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [invForm, setInvForm] = useState({ project_id:"", invoice_type:"advance", subtotal:"0", discount_amount:"0", gst_percent:"18", due_date:"", payment_terms:"", notes:"" });
  const [payForm, setPayForm] = useState({ amount:"", payment_date:"", payment_mode:"bank_transfer", reference_number:"", notes:"" });
  const [expForm, setExpForm] = useState({ category:"material", description:"", amount:"", expense_date:"", vendor_name:"", invoice_number:"", payment_mode:"bank_transfer", notes:"" });

  useEffect(() => { if (tenant) loadAll(); }, [tenant]);

  async function loadAll() {
    setLoading(true);
    const [{ data: inv }, { data: pay }, { data: exp }, { data: proj }, { data: cli }] = await Promise.all([
      supabase.from("invoices").select("*, projects(name), clients(name)").eq("tenant_id", tenant.id).order("created_at", { ascending: false }),
      supabase.from("payments").select("*, invoices(invoice_number), clients(name)").eq("tenant_id", tenant.id).order("payment_date", { ascending: false }).limit(50),
      supabase.from("expenses").select("*").eq("tenant_id", tenant.id).order("expense_date", { ascending: false }).limit(50),
      supabase.from("projects").select("id, name, client_id, clients(name)").eq("tenant_id", tenant.id),
      supabase.from("clients").select("id, name").eq("tenant_id", tenant.id),
    ]);
    setInvoices(inv || []);
    setPayments(pay || []);
    setExpenses(exp || []);
    setProjects(proj || []);
    setClients(cli || []);
    setLoading(false);
  }

  async function createInvoice() {
    if (!invForm.project_id) return addNotification("Select project", "error");
    setSaving(true);
    const proj = projects.find(p => p.id === invForm.project_id);
    const sub = parseFloat(invForm.subtotal);
    const disc = parseFloat(invForm.discount_amount);
    const gst = (sub - disc) * parseFloat(invForm.gst_percent) / 100;
    const grand = sub - disc + gst;
    const invNum = `INV-${Date.now().toString().slice(-6)}`;
    const { error } = await supabase.from("invoices").insert({
      ...invForm, tenant_id: tenant.id, client_id: proj?.client_id,
      created_by: user.id, invoice_number: invNum, invoice_date: new Date().toISOString().split("T")[0],
      subtotal: sub, gst_amount: gst, grand_total: grand, amount_due: grand,
      gst_percent: parseFloat(invForm.gst_percent), discount_amount: disc
    });
    if (error) addNotification(error.message, "error");
    else { addNotification("Invoice created"); setInvoiceModal(false); loadAll(); }
    setSaving(false);
  }

  async function recordPayment() {
    if (!payForm.amount) return addNotification("Amount required", "error");
    setSaving(true);
    const amt = parseFloat(payForm.amount);
    await supabase.from("payments").insert({
      ...payForm, tenant_id: tenant.id, invoice_id: paymentModal.id,
      client_id: paymentModal.client_id, project_id: paymentModal.project_id,
      amount: amt, received_by: user.id
    });
    const newPaid = (paymentModal.amount_paid || 0) + amt;
    const due = (paymentModal.grand_total || 0) - newPaid;
    await supabase.from("invoices").update({
      amount_paid: newPaid, amount_due: due < 0 ? 0 : due,
      status: due <= 0 ? "paid" : "partial"
    }).eq("id", paymentModal.id);
    addNotification("Payment recorded");
    setPaymentModal(null);
    setPayForm({ amount:"", payment_date:"", payment_mode:"bank_transfer", reference_number:"", notes:"" });
    loadAll();
    setSaving(false);
  }

  async function createExpense() {
    if (!expForm.description || !expForm.amount) return addNotification("Description and amount required", "error");
    setSaving(true);
    await supabase.from("expenses").insert({
      ...expForm, tenant_id: tenant.id, created_by: user.id,
      amount: parseFloat(expForm.amount)
    });
    addNotification("Expense recorded");
    setExpenseModal(false);
    loadAll();
    setSaving(false);
  }

  const totalInvoiced = invoices.reduce((s, i) => s + (i.grand_total || 0), 0);
  const totalReceived = invoices.reduce((s, i) => s + (i.amount_paid || 0), 0);
  const totalDue = invoices.reduce((s, i) => s + (i.amount_due || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div style={{ padding: 24 }}>
      <PageHeader title="Accounting & Billing" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginBottom: 20 }}>
        <StatCard label="Total Invoiced" value={`Rs.${(totalInvoiced/1000).toFixed(0)}K`} icon="D" color="#3b82f6" />
        <StatCard label="Received" value={`Rs.${(totalReceived/1000).toFixed(0)}K`} icon="C" color="#10b981" />
        <StatCard label="Outstanding" value={`Rs.${(totalDue/1000).toFixed(0)}K`} icon="T" color="#f59e0b" />
        <StatCard label="Expenses" value={`Rs.${(totalExpenses/1000).toFixed(0)}K`} icon="E" color="#ef4444" />
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {["invoices","payments","expenses"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "6px 16px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: tab === t ? "#3b82f6" : "#fff", color: tab === t ? "#fff" : "#374151" }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <div style={{ marginLeft: "auto" }}>
          {tab === "invoices" && <Btn size="sm" onClick={() => setInvoiceModal(true)}>+ New Invoice</Btn>}
          {tab === "expenses" && <Btn size="sm" onClick={() => setExpenseModal(true)}>+ Record Expense</Btn>}
        </div>
      </div>

      <Card style={{ padding: 0 }}>
        {loading ? <Spinner /> : (
          <>
            {tab === "invoices" && (
              <Table
                columns={[
                  { key: "invoice_number", label: "Invoice #", render: (v, r) => (
                    <div>
                      <div style={{ fontWeight: 600 }}>{v}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{r.invoice_type}</div>
                    </div>
                  )},
                  { key: "projects", label: "Project", render: v => v?.name },
                  { key: "clients", label: "Client", render: v => v?.name },
                  { key: "invoice_date", label: "Date", render: v => v ? new Date(v).toLocaleDateString("en-IN") : "-" },
                  { key: "grand_total", label: "Total", align: "right", render: v => `Rs.${(v||0).toLocaleString("en-IN")}` },
                  { key: "amount_paid", label: "Paid", align: "right", render: v => `Rs.${(v||0).toLocaleString("en-IN")}` },
                  { key: "amount_due", label: "Due", align: "right", render: v => <span style={{ color: v > 0 ? "#dc2626" : "#10b981", fontWeight: 600 }}>Rs.{(v||0).toLocaleString("en-IN")}</span> },
                  { key: "status", label: "Status", render: v => <Badge color={v==="paid"?"green":v==="partial"?"yellow":v==="overdue"?"red":"blue"}>{v}</Badge> },
                  { key: "id", label: "Actions", render: (_, r) => (
                    r.status !== "paid" && <Btn size="sm" onClick={() => { setPaymentModal(r); setPayForm(p => ({ ...p, payment_date: new Date().toISOString().split("T")[0] })); }}>Record Payment</Btn>
                  )},
                ]}
                data={invoices}
                emptyText="No invoices yet."
              />
            )}
            {tab === "payments" && (
              <Table
                columns={[
                  { key: "invoices", label: "Invoice", render: v => v?.invoice_number || "-" },
                  { key: "clients", label: "Client", render: v => v?.name },
                  { key: "amount", label: "Amount", align: "right", render: v => <span style={{ fontWeight: 700, color: "#10b981" }}>Rs.{(v||0).toLocaleString("en-IN")}</span> },
                  { key: "payment_mode", label: "Mode", render: v => <Badge color="blue">{v?.replace("_"," ")}</Badge> },
                  { key: "reference_number", label: "Reference" },
                  { key: "payment_date", label: "Date", render: v => v ? new Date(v).toLocaleDateString("en-IN") : "-" },
                  { key: "notes", label: "Notes" },
                ]}
                data={payments}
                emptyText="No payments recorded yet."
              />
            )}
            {tab === "expenses" && (
              <Table
                columns={[
                  { key: "description", label: "Description", render: (v, r) => (
                    <div>
                      <div style={{ fontWeight: 600 }}>{v}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{r.vendor_name}</div>
                    </div>
                  )},
                  { key: "category", label: "Category", render: v => <Badge color="purple">{v}</Badge> },
                  { key: "amount", label: "Amount", align: "right", render: v => <span style={{ fontWeight: 700, color: "#ef4444" }}>Rs.{(v||0).toLocaleString("en-IN")}</span> },
                  { key: "payment_mode", label: "Mode" },
                  { key: "invoice_number", label: "Bill #" },
                  { key: "expense_date", label: "Date", render: v => v ? new Date(v).toLocaleDateString("en-IN") : "-" },
                ]}
                data={expenses}
                emptyText="No expenses recorded yet."
              />
            )}
          </>
        )}
      </Card>

      <Modal open={invoiceModal} onClose={() => setInvoiceModal(false)} title="New Invoice" width={560}>
        <Select label="Project" required value={invForm.project_id} onChange={e => setInvForm(p => ({ ...p, project_id: e.target.value }))}>
          <option value="">-- Select Project --</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name} - {p.clients?.name}</option>)}
        </Select>
        <Select label="Invoice Type" value={invForm.invoice_type} onChange={e => setInvForm(p => ({ ...p, invoice_type: e.target.value }))}>
          <option value="advance">Advance Invoice</option>
          <option value="milestone">Milestone Invoice</option>
          <option value="final">Final Invoice</option>
          <option value="job_work">Job-Work Invoice</option>
        </Select>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 12px" }}>
          <Input label="Subtotal (Rs.)" type="number" value={invForm.subtotal} onChange={e => setInvForm(p => ({ ...p, subtotal: e.target.value }))} />
          <Input label="Discount (Rs.)" type="number" value={invForm.discount_amount} onChange={e => setInvForm(p => ({ ...p, discount_amount: e.target.value }))} />
          <Input label="GST %" type="number" value={invForm.gst_percent} onChange={e => setInvForm(p => ({ ...p, gst_percent: e.target.value }))} />
        </div>
        {invForm.subtotal && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 13 }}>
            Grand Total: <strong>Rs.{((parseFloat(invForm.subtotal)-parseFloat(invForm.discount_amount||0)) * (1 + parseFloat(invForm.gst_percent||0)/100)).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong>
          </div>
        )}
        <Input label="Due Date" type="date" value={invForm.due_date} onChange={e => setInvForm(p => ({ ...p, due_date: e.target.value }))} />
        <Input label="Notes" value={invForm.notes} onChange={e => setInvForm(p => ({ ...p, notes: e.target.value }))} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn variant="ghost" onClick={() => setInvoiceModal(false)}>Cancel</Btn>
          <Btn onClick={createInvoice} disabled={saving}>{saving ? "Saving..." : "Create Invoice"}</Btn>
        </div>
      </Modal>

      <Modal open={!!paymentModal} onClose={() => setPaymentModal(null)} title={`Record Payment - ${paymentModal?.invoice_number}`}>
        {paymentModal && (
          <div style={{ background: "#f8fafc", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
            <div>Total: <strong>Rs.{(paymentModal.grand_total||0).toLocaleString("en-IN")}</strong></div>
            <div>Paid: Rs.{(paymentModal.amount_paid||0).toLocaleString("en-IN")}</div>
            <div style={{ color: "#dc2626", fontWeight: 600 }}>Outstanding: Rs.{(paymentModal.amount_due||0).toLocaleString("en-IN")}</div>
          </div>
        )}
        <Input label="Amount (Rs.)" required type="number" value={payForm.amount} onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))} />
        <Input label="Payment Date" type="date" value={payForm.payment_date} onChange={e => setPayForm(p => ({ ...p, payment_date: e.target.value }))} />
        <Select label="Payment Mode" value={payForm.payment_mode} onChange={e => setPayForm(p => ({ ...p, payment_mode: e.target.value }))}>
          <option value="cash">Cash</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="upi">UPI</option>
          <option value="cheque">Cheque</option>
          <option value="neft">NEFT</option>
          <option value="rtgs">RTGS</option>
        </Select>
        <Input label="Reference Number" value={payForm.reference_number} onChange={e => setPayForm(p => ({ ...p, reference_number: e.target.value }))} placeholder="UTR / Cheque no." />
        <Input label="Notes" value={payForm.notes} onChange={e => setPayForm(p => ({ ...p, notes: e.target.value }))} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn variant="ghost" onClick={() => setPaymentModal(null)}>Cancel</Btn>
          <Btn variant="success" onClick={recordPayment} disabled={saving}>{saving ? "Saving..." : "Record Payment"}</Btn>
        </div>
      </Modal>

      <Modal open={expenseModal} onClose={() => setExpenseModal(false)} title="Record Expense">
        <Select label="Category" value={expForm.category} onChange={e => setExpForm(p => ({ ...p, category: e.target.value }))}>
          {["material","labor","maintenance","transport","utilities","rent","salary","other"].map(c => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </Select>
        <Input label="Description" required value={expForm.description} onChange={e => setExpForm(p => ({ ...p, description: e.target.value }))} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
          <Input label="Amount (Rs.)" required type="number" value={expForm.amount} onChange={e => setExpForm(p => ({ ...p, amount: e.target.value }))} />
          <Input label="Expense Date" type="date" value={expForm.expense_date} onChange={e => setExpForm(p => ({ ...p, expense_date: e.target.value }))} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
          <Input label="Vendor Name" value={expForm.vendor_name} onChange={e => setExpForm(p => ({ ...p, vendor_name: e.target.value }))} />
          <Input label="Invoice / Bill #" value={expForm.invoice_number} onChange={e => setExpForm(p => ({ ...p, invoice_number: e.target.value }))} />
        </div>
        <Select label="Payment Mode" value={expForm.payment_mode} onChange={e => setExpForm(p => ({ ...p, payment_mode: e.target.value }))}>
          <option value="cash">Cash</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="upi">UPI</option>
          <option value="cheque">Cheque</option>
        </Select>
        <Input label="Notes" value={expForm.notes} onChange={e => setExpForm(p => ({ ...p, notes: e.target.value }))} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn variant="ghost" onClick={() => setExpenseModal(false)}>Cancel</Btn>
          <Btn onClick={createExpense} disabled={saving}>{saving ? "Saving..." : "Record Expense"}</Btn>
        </div>
      </Modal>
    </div>
  );
}
