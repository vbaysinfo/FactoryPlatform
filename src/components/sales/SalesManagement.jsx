import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext.jsx";
import { C, KPI, Card, SHead, Badge, Tbl, TR, TD, Tabs, FormBox, FGrid, Field, inp, sel, TT } from "../common/ui.jsx";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "../../lib/supabase.js";

const CLRS = ["#00d4aa","#0099ff","#a855f7","#f59e0b","#ef4444","#22c55e"];
const SC   = { paid: C.teal, partial: C.amber, pending: C.red };
const OC   = { pending: C.amber, confirmed: C.blue, dispatched: C.teal, delivered: C.green, cancelled: C.red };
const today = new Date().toISOString().slice(0, 10);
const BLANK = { fId: "", date: today, qty: "", pl: "PL-22", p1k: "", method: "Cash", status: "pending", paid: "", notes: "" };

export default function SalesManagement() {
  const { sales, farmers, addSale, updateSale, delSale, reload } = useApp();
  const [tab,     setTab]     = useState("orders");
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [show,    setShow]    = useState(false);
  const [editId,  setEditId]  = useState(null);
  const [form,    setForm]    = useState(BLANK);
  const [filter,  setFilter]  = useState("all");
  const [saving,  setSaving]  = useState(false);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    setLoading(true);
    const { data, error } = await supabase.from("field_orders").select("*").order("date", { ascending: false });
    if (!error) setOrders(data || []);
    setLoading(false);
  }

  const getFarmer = id => farmers.find(f => f.id === id);

  // ── KPIs ─────────────────────────────────────────────────────
  const totalRev   = sales.reduce((s, x) => s + (x.total || 0), 0);
  const totalPaid  = sales.reduce((s, x) => s + (x.paid  || 0), 0);
  const totalPend  = sales.reduce((s, x) => s + (x.bal   || 0), 0);
  const totalQty   = sales.reduce((s, x) => s + (x.qty   || 0), 0);
  const pendOrders = orders.filter(o => o.status === "pending").length;
  const dispOrders = orders.filter(o => o.status === "dispatched").length;

  // ── Order actions ─────────────────────────────────────────────
  async function updateOrderStatus(id, status) {
    await supabase.from("field_orders").update({ status }).eq("id", id);
    await loadOrders();
  }

  async function markDelivered(order) {
    // 1. Update order status
    await supabase.from("field_orders").update({ status: "delivered" }).eq("id", order.id);

    // 2. Auto-create invoice in sales table
    const year    = new Date().getFullYear();
    const invNo   = "INV-" + year + "-" + String(sales.length + 1).padStart(3, "0");
    const total   = order.total   || 0;
    const paid    = order.paid_amount || 0;
    const bal     = total - paid;
    const status  = bal <= 0 ? "paid" : paid > 0 ? "partial" : "pending";

    await addSale({
      fId:    order.farmer_id,
      tId:    null,
      date:   today,
      qty:    order.order_type === "seed" ? (order.qty || 0) * 1000 : order.qty || 0,
      pl:     order.item_name || "",
      p1k:    order.price     || 0,
      total,
      paid,
      bal,
      method: "Cash",
      status,
      inv:    invNo,
    });

    await loadOrders();
  }

  async function recordOrderPayment(id, paid_amount, total) {
    const balance        = total - paid_amount;
    const payment_status = balance <= 0 ? "paid" : paid_amount > 0 ? "advance" : "pending";
    await supabase.from("field_orders").update({ paid_amount, payment_status }).eq("id", id);
    await loadOrders();
  }

  // ── Manual sale save ──────────────────────────────────────────
  const saveSale = async () => {
    if (!form.fId || !form.qty || !form.p1k) return;
    setSaving(true);
    try {
      const total = (+form.qty / 1000) * (+form.p1k);
      const bal   = total - (+form.paid || 0);
      const data  = { ...form, fId: +form.fId, qty: +form.qty, p1k: +form.p1k, total, paid: +form.paid || 0, bal };
      if (editId) {
        await updateSale(editId, { ...data, inv: sales.find(s => s.id === editId)?.inv });
      } else {
        const invNo = "INV-" + new Date().getFullYear() + "-" + String(sales.length + 1).padStart(3, "0");
        await addSale({ ...data, inv: invNo });
      }
      setShow(false); setEditId(null); setForm(BLANK);
    } catch (e) { alert("Error: " + e.message); }
    finally { setSaving(false); }
  };

  // ── Filtered orders ───────────────────────────────────────────
  const activeOrders    = orders.filter(o => ["pending","confirmed","dispatched"].includes(o.status));
  const completedOrders = orders.filter(o => ["delivered","cancelled"].includes(o.status));

  // ── Invoice filter ────────────────────────────────────────────
  const filtSales = filter === "all" ? sales : sales.filter(s => s.status === filter);

  // ── District chart ────────────────────────────────────────────
  const distData = farmers.reduce((acc, fa) => {
    const amt = sales.filter(s => s.fId === fa.id).reduce((s, x) => s + (x.total || 0), 0);
    if (amt > 0) { const ex = acc.find(a => a.name === fa.dist); if (ex) ex.v += amt; else acc.push({ name: fa.dist, v: amt }); }
    return acc;
  }, []);

  return (
    <div style={{ padding: "20px 24px" }}>
      {/* KPIs */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <KPI label="Total Revenue"    value={"₹" + (totalRev / 100000).toFixed(2) + "L"} sub="all invoices"    color={C.teal}   icon="💰"/>
        <KPI label="Collected"        value={"₹" + (totalPaid / 100000).toFixed(2) + "L"} sub="received"       color={C.green}  icon="✅"/>
        <KPI label="Balance Due"      value={"₹" + (totalPend / 1000).toFixed(0) + "K"}  sub="uncollected"     color={C.red}    icon="⚠️"/>
        <KPI label="PLs Sold"         value={(totalQty / 1000000).toFixed(2) + "M"}       sub="post larvae"    color={C.blue}   icon="🦐"/>
        <KPI label="Pending Orders"   value={pendOrders}  sub="need approval"             color={C.amber}  icon="📋"/>
        <KPI label="Out for Delivery" value={dispOrders}  sub="dispatched"                color={C.purple} icon="🚚"/>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <Tabs
          tabs={[
            { id: "orders",    label: `📋 Active Orders (${activeOrders.length})` },
            { id: "invoices",  label: `🧾 Invoices (${sales.length})` },
            { id: "history",   label: `📦 Delivered (${completedOrders.length})` },
            { id: "overview",  label: "📊 Overview" },
          ]}
          active={tab} onChange={setTab}
        />
        {tab === "invoices" && (
          <button onClick={() => { setEditId(null); setForm(BLANK); setShow(true); }}
            style={{ background: "linear-gradient(135deg,#00d4aa,#0099ff)", color: "#000", fontWeight: 700, fontSize: 13, padding: "8px 18px", borderRadius: 10, border: "none", cursor: "pointer" }}>
            + Manual Sale
          </button>
        )}
      </div>

      {/* ── ORDERS TAB ─────────────────────────────────────────── */}
      {tab === "orders" && (
        <div>
          {loading
            ? <div style={{ textAlign: "center", padding: 40, color: C.sub }}>Loading orders...</div>
            : activeOrders.length === 0
              ? <div style={{ textAlign: "center", padding: 48, color: C.sub }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
                  <div style={{ fontSize: 13, color: C.text }}>No active orders</div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>Field technicians log orders from farmer visits</div>
                </div>
              : <Card>
                  <Tbl heads={["Date","Farmer","Village","Tech","Type","Item","Qty","Unit","Price","Total","Delivery","Payment","Paid","Balance","Status","Actions"]}>
                    {activeOrders.map(o => {
                      const fm = getFarmer(o.farmer_id);
                      const tc = o.order_type === "seed" ? C.teal : o.order_type === "feed" ? C.amber : C.purple;
                      const balance = (o.total || 0) - (o.paid_amount || 0);
                      return (
                        <TR key={o.id}>
                          <TD small>{o.date}</TD>
                          <TD color={C.blue} bold>{fm?.name || "—"}</TD>
                          <TD color={C.sub} small>{fm?.village || "—"}</TD>
                          <TD color={C.sub} small>{o.tech_name || "—"}</TD>
                          <TD><Badge label={o.order_type === "seed" ? "🦐 Seed" : o.order_type === "feed" ? "🌾 Feed" : "💊 Medicine"} color={tc} /></TD>
                          <TD bold>{o.item_name}</TD>
                          <TD bold>{o.qty}</TD>
                          <TD color={C.sub} small>{o.unit}</TD>
                          <TD color={C.sub}>₹{(o.price || 0).toLocaleString("en-IN")}</TD>
                          <TD color={C.purple} bold>₹{(o.total || 0).toLocaleString("en-IN")}</TD>
                          <TD color={C.amber}>{o.delivery_date || "—"}</TD>
                          <TD><Badge label={o.payment_status || "pending"} color={o.payment_status === "paid" ? C.teal : o.payment_status === "advance" ? C.blue : C.amber} /></TD>
                          <TD color={C.teal}>₹{(o.paid_amount || 0).toLocaleString("en-IN")}</TD>
                          <TD color={balance > 0 ? C.red : C.teal} bold>₹{balance.toLocaleString("en-IN")}</TD>
                          <TD><Badge label={o.status} color={OC[o.status] || C.sub} /></TD>
                          <TD>
                            <OrderActions order={o} onStatus={updateOrderStatus} onDeliver={markDelivered} onPayment={recordOrderPayment} />
                          </TD>
                        </TR>
                      );
                    })}
                  </Tbl>
                </Card>
          }
        </div>
      )}

      {/* ── INVOICES TAB ───────────────────────────────────────── */}
      {tab === "invoices" && (
        <div>
          {/* Manual sale form */}
          {show && (
            <FormBox title={editId ? "✏️ Edit Invoice" : "🧾 Manual Sale Entry"} onClose={() => { setShow(false); setEditId(null); }} onSave={saveSale}>
              <div style={{ marginBottom: 10, padding: "8px 12px", background: C.blue + "10", borderRadius: 8, fontSize: 11, color: C.sub, border: "1px solid " + C.blue + "20" }}>
                ℹ️ Use this for direct sales not coming from a field order (walk-in, phone order paid immediately).
              </div>
              <FGrid cols={3}>
                <Field label="Sale Date"><input style={inp} type="date" value={form.date} onChange={e => f("date", e.target.value)} /></Field>
                <Field label="Farmer *">
                  <select style={sel} value={form.fId} onChange={e => f("fId", e.target.value)}>
                    <option value="">— Select Farmer —</option>
                    {farmers.map(fa => <option key={fa.id} value={fa.id}>{fa.name} — {fa.village}</option>)}
                  </select>
                </Field>
                <Field label="PL Quantity"><input style={inp} type="number" value={form.qty} onChange={e => f("qty", e.target.value)} placeholder="200000" /></Field>
                <Field label="PL Size / Item"><input style={inp} value={form.pl} onChange={e => f("pl", e.target.value)} placeholder="PL-22" /></Field>
                <Field label="Price per 1000 (₹)"><input style={inp} type="number" value={form.p1k} onChange={e => f("p1k", e.target.value)} placeholder="450" /></Field>
                <Field label="Total (₹)">
                  <input style={{ ...inp, background: C.card2, color: C.teal, fontWeight: 700 }} readOnly
                    value={form.qty && form.p1k ? "₹" + ((+form.qty / 1000) * (+form.p1k)).toLocaleString("en-IN") : "—"} />
                </Field>
                <Field label="Amount Paid (₹)"><input style={inp} type="number" value={form.paid} onChange={e => f("paid", e.target.value)} placeholder="90000" /></Field>
                <Field label="Payment Method">
                  <select style={sel} value={form.method} onChange={e => f("method", e.target.value)}>
                    <option>Cash</option><option>Bank Transfer</option><option>UPI</option><option>Cheque</option>
                  </select>
                </Field>
                <Field label="Payment Status">
                  <select style={sel} value={form.status} onChange={e => f("status", e.target.value)}>
                    <option value="paid">Paid</option><option value="partial">Partial</option><option value="pending">Pending</option>
                  </select>
                </Field>
                <Field label="Notes"><input style={inp} value={form.notes} onChange={e => f("notes", e.target.value)} /></Field>
              </FGrid>
              {saving && <div style={{ color: C.teal, fontSize: 12, marginTop: 8 }}>Saving...</div>}
            </FormBox>
          )}

          {/* Filter row */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {["all", "paid", "partial", "pending"].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                style={{ padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: filter === s ? C.teal : "rgba(255,255,255,0.06)", color: filter === s ? "#000" : C.sub }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <Card>
            <Tbl heads={["Invoice","Date","Farmer","District","PLs","Item","Amount","Paid","Balance","Method","Status","Actions"]}>
              {filtSales.length === 0
                ? <TR><TD colSpan={12} style={{ textAlign: "center", padding: 30, color: C.sub }}>No invoices yet.</TD></TR>
                : filtSales.map(s => {
                    const fa = getFarmer(s.fId);
                    const c  = SC[s.status] || C.sub;
                    return (
                      <TR key={s.id}>
                        <TD color={C.blue} bold small>{s.inv}</TD>
                        <TD small>{s.date}</TD>
                        <TD bold>{fa?.name || "—"}</TD>
                        <TD color={C.sub} small>{fa?.dist || "—"}</TD>
                        <TD small>{((s.qty || 0) / 1000).toFixed(0)}K</TD>
                        <TD color={C.teal} small>{s.pl}</TD>
                        <TD bold>₹{(s.total || 0).toLocaleString("en-IN")}</TD>
                        <TD color={C.green}>₹{(s.paid || 0).toLocaleString("en-IN")}</TD>
                        <TD color={(s.bal || 0) > 0 ? C.red : C.teal} bold>₹{(s.bal || 0).toLocaleString("en-IN")}</TD>
                        <TD color={C.sub} small>{s.method}</TD>
                        <TD><Badge label={s.status} color={c} /></TD>
                        <TD>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => { setEditId(s.id); setForm({ fId: s.fId, date: s.date, qty: s.qty, pl: s.pl, p1k: s.p1k, method: s.method, status: s.status, paid: s.paid, notes: "" }); setShow(true); }}
                              style={{ background: C.blue + "18", color: C.blue, border: "none", borderRadius: 5, padding: "3px 8px", cursor: "pointer", fontSize: 11 }}>Edit</button>
                            <button onClick={() => { if (window.confirm("Delete this invoice?")) delSale(s.id); }}
                              style={{ background: C.red + "18", color: C.red, border: "none", borderRadius: 5, padding: "3px 8px", cursor: "pointer", fontSize: 11 }}>Del</button>
                          </div>
                        </TD>
                      </TR>
                    );
                  })}
            </Tbl>
          </Card>
        </div>
      )}

      {/* ── DELIVERED / HISTORY TAB ────────────────────────────── */}
      {tab === "history" && (
        <Card>
          <Tbl heads={["Date","Farmer","Village","Tech","Type","Item","Qty","Unit","Total","Paid","Balance","Status"]}>
            {completedOrders.length === 0
              ? <TR><TD colSpan={12} style={{ textAlign: "center", padding: 30, color: C.sub }}>No delivered orders yet.</TD></TR>
              : completedOrders.map(o => {
                  const fm = getFarmer(o.farmer_id);
                  const tc = o.order_type === "seed" ? C.teal : o.order_type === "feed" ? C.amber : C.purple;
                  const balance = (o.total || 0) - (o.paid_amount || 0);
                  return (
                    <TR key={o.id}>
                      <TD small>{o.date}</TD>
                      <TD color={C.blue} bold>{fm?.name || "—"}</TD>
                      <TD color={C.sub} small>{fm?.village || "—"}</TD>
                      <TD color={C.sub} small>{o.tech_name || "—"}</TD>
                      <TD><Badge label={o.order_type} color={tc} /></TD>
                      <TD bold>{o.item_name}</TD>
                      <TD>{o.qty}</TD>
                      <TD color={C.sub} small>{o.unit}</TD>
                      <TD color={C.purple} bold>₹{(o.total || 0).toLocaleString("en-IN")}</TD>
                      <TD color={C.teal}>₹{(o.paid_amount || 0).toLocaleString("en-IN")}</TD>
                      <TD color={balance > 0 ? C.red : C.teal} bold>₹{balance.toLocaleString("en-IN")}</TD>
                      <TD><Badge label={o.status} color={OC[o.status] || C.sub} /></TD>
                    </TR>
                  );
                })}
          </Tbl>
        </Card>
      )}

      {/* ── OVERVIEW TAB ───────────────────────────────────────── */}
      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14, marginTop: 4 }}>
          <div>
            {/* Pending payments */}
            <Card accent={C.red} style={{ marginBottom: 14 }}>
              <SHead title="⚠️ Pending Payments" />
              {sales.filter(s => s.status !== "paid").length === 0
                ? <div style={{ color: C.teal, fontSize: 12, padding: "8px 0" }}>✅ All payments collected</div>
                : sales.filter(s => s.status !== "paid").map(s => {
                    const fa = getFarmer(s.fId);
                    return (
                      <div key={s.id} style={{ background: C.red + "10", borderRadius: 8, padding: "10px 14px", marginBottom: 8, border: "1px solid " + C.red + "20", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ color: C.text, fontSize: 12, fontWeight: 700 }}>{fa?.name || "—"}</div>
                          <div style={{ color: C.sub, fontSize: 10 }}>{s.inv} • {s.date}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ color: C.red, fontSize: 14, fontWeight: 800 }}>₹{(s.bal || 0).toLocaleString("en-IN")}</div>
                          <Badge label={s.status} color={SC[s.status]} />
                        </div>
                      </div>
                    );
                  })}
            </Card>

            {/* Farmer-wise sales table */}
            <Card>
              <SHead title="Farmer-wise Revenue" />
              <Tbl heads={["Farmer", "District", "Invoices", "Total PLs", "Revenue", "Collected", "Balance"]}>
                {farmers.filter(fa => sales.some(s => s.fId === fa.id)).map(fa => {
                  const fSales = sales.filter(s => s.fId === fa.id);
                  const rev  = fSales.reduce((s, x) => s + (x.total || 0), 0);
                  const paid = fSales.reduce((s, x) => s + (x.paid  || 0), 0);
                  const bal  = fSales.reduce((s, x) => s + (x.bal   || 0), 0);
                  const qty  = fSales.reduce((s, x) => s + (x.qty   || 0), 0);
                  return (
                    <TR key={fa.id}>
                      <TD color={C.blue} bold>{fa.name}</TD>
                      <TD color={C.sub} small>{fa.dist}</TD>
                      <TD>{fSales.length}</TD>
                      <TD>{(qty / 1000).toFixed(0)}K</TD>
                      <TD color={C.purple} bold>₹{(rev / 1000).toFixed(1)}K</TD>
                      <TD color={C.teal}>₹{(paid / 1000).toFixed(1)}K</TD>
                      <TD color={bal > 0 ? C.red : C.teal} bold>₹{(bal / 1000).toFixed(1)}K</TD>
                    </TR>
                  );
                })}
              </Tbl>
            </Card>
          </div>

          <div>
            <Card style={{ marginBottom: 14 }}>
              <SHead title="Sales by District" />
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={distData} cx="50%" cy="50%" outerRadius={65} dataKey="v" nameKey="name" paddingAngle={2}>
                    {distData.map((_, i) => <Cell key={i} fill={CLRS[i % CLRS.length]} />)}
                  </Pie>
                  <Tooltip {...TT} formatter={v => "₹" + (v / 1000).toFixed(0) + "K"} />
                </PieChart>
              </ResponsiveContainer>
              {distData.map((d, i) => (
                <div key={d.name} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, color: C.sub, fontSize: 11 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: CLRS[i % CLRS.length], display: "block" }} />
                    {d.name}
                  </span>
                  <span style={{ color: C.text, fontSize: 11, fontWeight: 600 }}>₹{(d.v / 1000).toFixed(0)}K</span>
                </div>
              ))}
            </Card>

            {/* Order type summary */}
            <Card>
              <SHead title="Order Types" />
              {["seed","feed","medicine"].map(type => {
                const typeOrders = orders.filter(o => o.order_type === type);
                const val = typeOrders.reduce((s,o)=>s+(o.total||0),0);
                const icon = type==="seed"?"🦐":type==="feed"?"🌾":"💊";
                const color = type==="seed"?C.teal:type==="feed"?C.amber:C.purple;
                return (
                  <div key={type} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid "+C.border }}>
                    <span style={{ color:C.sub, fontSize:12 }}>{icon} {type.charAt(0).toUpperCase()+type.slice(1)}</span>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ color, fontWeight:700, fontSize:12 }}>₹{(val/1000).toFixed(1)}K</div>
                      <div style={{ color:C.sub, fontSize:10 }}>{typeOrders.length} orders</div>
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Order Action Buttons ──────────────────────────────────────
function OrderActions({ order, onStatus, onDeliver, onPayment }) {
  const [payModal, setPayModal] = useState(false);
  const [payAmt,   setPayAmt]   = useState("");
  const [working,  setWorking]  = useState(false);

  const btn = (label, color, onClick, disabled = false) => (
    <button onClick={onClick} disabled={disabled}
      style={{ background: color + "20", color, border: "1px solid " + color + "30", borderRadius: 6, padding: "4px 10px", fontSize: 10, cursor: disabled ? "default" : "pointer", fontWeight: 700, whiteSpace: "nowrap", opacity: disabled ? 0.5 : 1 }}>
      {label}
    </button>
  );

  const act = async (fn) => { setWorking(true); await fn(); setWorking(false); };

  const savePayment = async () => {
    await onPayment(order.id, (order.paid_amount || 0) + (+payAmt), order.total);
    setPayModal(false); setPayAmt("");
  };

  const balance = (order.total || 0) - (order.paid_amount || 0);

  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
      {order.status === "pending"    && btn("✅ Approve",   C.blue,  () => act(() => onStatus(order.id, "confirmed")))}
      {order.status === "pending"    && btn("❌ Cancel",    C.red,   () => { if (window.confirm("Cancel this order?")) act(() => onStatus(order.id, "cancelled")); })}
      {order.status === "confirmed"  && btn("🚚 Dispatch",  C.teal,  () => act(() => onStatus(order.id, "dispatched")))}
      {order.status === "dispatched" && btn("📦 Delivered →\nInvoice", C.green, () => act(() => onDeliver(order)))}
      {order.status !== "cancelled"  && balance > 0 && btn("💰 Pay",  C.purple, () => setPayModal(true))}
      {working && <span style={{ color: C.sub, fontSize: 10 }}>...</span>}

      {payModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setPayModal(false)}>
          <div style={{ background: "#0c1a2e", borderRadius: 14, padding: 28, width: 340, border: "1px solid " + C.border }} onClick={e => e.stopPropagation()}>
            <div style={{ color: C.text, fontWeight: 700, fontSize: 15, marginBottom: 6 }}>💰 Record Payment</div>
            <div style={{ color: C.sub, fontSize: 12, marginBottom: 4 }}>
              Order Total: <b style={{ color: C.text }}>₹{(order.total || 0).toLocaleString("en-IN")}</b>
            </div>
            <div style={{ color: C.sub, fontSize: 12, marginBottom: 16 }}>
              Balance Due: <b style={{ color: C.red }}>₹{balance.toLocaleString("en-IN")}</b>
            </div>
            <div style={{ color: C.sub, fontSize: 11, marginBottom: 6 }}>Amount Received (₹)</div>
            <input autoFocus type="number" value={payAmt} onChange={e => setPayAmt(e.target.value)}
              placeholder={"Max: ₹" + balance.toLocaleString("en-IN")}
              style={{ width: "100%", background: "#060e1f", border: "1px solid " + C.border, borderRadius: 8, padding: "10px 14px", color: C.text, fontSize: 14, marginBottom: 16, boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={savePayment}
                style={{ flex: 1, background: "linear-gradient(135deg,#00d4aa,#0099ff)", color: "#000", fontWeight: 700, fontSize: 13, padding: 12, borderRadius: 9, border: "none", cursor: "pointer" }}>
                Save Payment
              </button>
              <button onClick={() => setPayModal(false)}
                style={{ flex: 1, background: C.card, color: C.sub, fontWeight: 600, fontSize: 13, padding: 12, borderRadius: 9, border: "1px solid " + C.border, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
