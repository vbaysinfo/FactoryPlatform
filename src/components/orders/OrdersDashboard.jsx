import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext.jsx";
import { C, KPI, Card, Badge, Tbl, TR, TD, Tabs, inp, sel } from "../common/ui.jsx";
import { supabase } from "../../lib/supabase.js";

const today = new Date().toISOString().slice(0, 10);

const ORDER_TYPE_COLOR = { seed: C.teal, feed: C.amber, medicine: C.purple };
const ORDER_TYPE_ICON  = { seed: "🦐", feed: "🌾", medicine: "💊" };
const STATUS_COLOR = {
  pending:   C.amber,
  confirmed: C.blue,
  approved:  C.purple,
  dispatched: C.teal,
  delivered: C.green,
  cancelled: C.red,
};

export default function OrdersDashboard() {
  const { farmers } = useApp();
  const [orders,  setOrders]  = useState([]);
  const [tab,     setTab]     = useState("pending");
  const [loading, setLoading] = useState(true);
  const [fType,   setFType]   = useState("all");
  const [search,  setSearch]  = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("field_orders")
      .select("*")
      .order("date", { ascending: false });
    if (!error) setOrders(data || []);
    setLoading(false);
  }

  const getFarmer = id => farmers.find(f => f.id === id);

  // KPI counts
  const pending    = orders.filter(o => o.status === "pending");
  const confirmed  = orders.filter(o => o.status === "confirmed");
  const approved   = orders.filter(o => o.status === "approved");
  const dispatched = orders.filter(o => o.status === "dispatched");
  const delivered  = orders.filter(o => o.status === "delivered");
  const todayOrders = orders.filter(o => o.date === today);
  const totalValue  = orders.reduce((s, o) => s + (o.total || 0), 0);
  const pendingValue = pending.reduce((s, o) => s + ((o.total || 0) - (o.paid_amount || 0)), 0);

  // Tab filter
  const TAB_STATUS = {
    pending:    ["pending"],
    confirmed:  ["confirmed", "approved"],
    dispatched: ["dispatched"],
    delivered:  ["delivered"],
    all:        ["pending","confirmed","approved","dispatched","delivered","cancelled"],
  };

  const filtered = orders.filter(o => {
    const matchTab    = TAB_STATUS[tab]?.includes(o.status);
    const matchType   = fType === "all" || o.order_type === fType;
    const fm          = getFarmer(o.farmer_id);
    const matchSearch = !search || fm?.name?.toLowerCase().includes(search.toLowerCase()) ||
                        o.item_name?.toLowerCase().includes(search.toLowerCase()) ||
                        o.tech_name?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchType && matchSearch;
  });

  // Status action buttons
  async function updateStatus(id, status) {
    await supabase.from("field_orders").update({ status }).eq("id", id);
    await load();
  }

  async function updatePayment(id, paid_amount, total) {
    const balance = total - paid_amount;
    const payment_status = balance <= 0 ? "paid" : paid_amount > 0 ? "advance" : "pending";
    await supabase.from("field_orders").update({ paid_amount, payment_status }).eq("id", id);
    await load();
  }

  return (
    <div style={{ padding: "20px 24px" }}>
      {/* KPIs */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <KPI label="Pending Approval" value={pending.length}    sub="waiting action"     color={C.amber}  icon="⏳"/>
        <KPI label="Confirmed"        value={confirmed.length}  sub="ready to dispatch"  color={C.blue}   icon="✅"/>
        <KPI label="Dispatched"       value={dispatched.length} sub="on the way"         color={C.teal}   icon="🚚"/>
        <KPI label="Delivered Today"  value={todayOrders.filter(o=>o.status==="delivered").length} sub="today" color={C.green} icon="📦"/>
        <KPI label="Total Order Value" value={"₹"+(totalValue/1000).toFixed(1)+"K"}  sub="all orders" color={C.purple} icon="💰"/>
        <KPI label="Payment Pending"  value={"₹"+(pendingValue/1000).toFixed(1)+"K"} sub="to collect"  color={C.red}    icon="⚠️"/>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 18 }}>
        {["seed","feed","medicine"].map(type => {
          const typeOrders = orders.filter(o => o.order_type === type);
          const val = typeOrders.reduce((s,o)=>s+(o.total||0),0);
          const pend = typeOrders.filter(o=>o.status==="pending").length;
          return (
            <div key={type} style={{ background: C.card, borderRadius: 12, padding: "16px 20px", border: "1px solid " + ORDER_TYPE_COLOR[type] + "30" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 22 }}>{ORDER_TYPE_ICON[type]}</span>
                  <span style={{ color: C.text, fontWeight: 700, fontSize: 13, textTransform: "capitalize" }}>{type === "seed" ? "Seed (PL)" : type === "feed" ? "Feed" : "Medicine"} Orders</span>
                </div>
                {pend > 0 && <span style={{ background: C.amber + "20", color: C.amber, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99 }}>{pend} pending</span>}
              </div>
              <div style={{ display: "flex", gap: 20 }}>
                <div><div style={{ color: ORDER_TYPE_COLOR[type], fontSize: 22, fontWeight: 800 }}>{typeOrders.length}</div><div style={{ color: C.sub, fontSize: 10 }}>Total Orders</div></div>
                <div><div style={{ color: C.teal, fontSize: 22, fontWeight: 800 }}>₹{(val/1000).toFixed(1)}K</div><div style={{ color: C.sub, fontSize: 10 }}>Total Value</div></div>
                <div><div style={{ color: C.green, fontSize: 22, fontWeight: 800 }}>{typeOrders.filter(o=>o.status==="delivered").length}</div><div style={{ color: C.sub, fontSize: 10 }}>Delivered</div></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters + Tabs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
        <Tabs
          tabs={[
            { id: "pending",    label: `⏳ Pending (${pending.length})` },
            { id: "confirmed",  label: `✅ Confirmed (${confirmed.length + approved.length})` },
            { id: "dispatched", label: `🚚 Dispatched (${dispatched.length})` },
            { id: "delivered",  label: `📦 Delivered (${delivered.length})` },
            { id: "all",        label: "All Orders" },
          ]}
          active={tab} onChange={setTab}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <select style={{ ...sel, width: "auto", fontSize: 12, padding: "6px 10px" }} value={fType} onChange={e => setFType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="seed">🦐 Seed</option>
            <option value="feed">🌾 Feed</option>
            <option value="medicine">💊 Medicine</option>
          </select>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search farmer / item..." style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 8, padding: "6px 12px", color: C.text, fontSize: 12, width: 200 }} />
        </div>
      </div>

      {/* Orders Table */}
      <Card>
        {loading
          ? <div style={{ textAlign: "center", padding: 40, color: C.sub }}>Loading orders...</div>
          : filtered.length === 0
            ? <div style={{ textAlign: "center", padding: 40, color: C.sub }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
                <div style={{ fontSize: 13 }}>No orders in this category</div>
              </div>
            : <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Date","Farmer","Village","Tech","Type","Item","Qty","Unit","Price","Total","Delivery","Payment","Paid","Balance","Status","Actions"].map(h => (
                        <th key={h} style={{ padding: "10px 12px", fontSize: 10, fontWeight: 700, color: C.sub, textAlign: "left", borderBottom: "1px solid " + C.border, whiteSpace: "nowrap", background: C.card }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(o => {
                      const fm = getFarmer(o.farmer_id);
                      const tc = ORDER_TYPE_COLOR[o.order_type] || C.sub;
                      const sc = STATUS_COLOR[o.status] || C.sub;
                      const balance = (o.total || 0) - (o.paid_amount || 0);
                      return (
                        <tr key={o.id} style={{ borderBottom: "1px solid " + C.border + "60" }}>
                          <td style={{ padding: "9px 12px", fontSize: 11, color: C.sub, whiteSpace: "nowrap" }}>{o.date}</td>
                          <td style={{ padding: "9px 12px", fontSize: 12, color: C.blue, fontWeight: 700, whiteSpace: "nowrap" }}>{fm?.name || "—"}</td>
                          <td style={{ padding: "9px 12px", fontSize: 11, color: C.sub }}>{fm?.village || "—"}</td>
                          <td style={{ padding: "9px 12px", fontSize: 11, color: C.sub, whiteSpace: "nowrap" }}>{o.tech_name || "—"}</td>
                          <td style={{ padding: "9px 12px" }}><Badge label={ORDER_TYPE_ICON[o.order_type] + " " + o.order_type} color={tc} /></td>
                          <td style={{ padding: "9px 12px", fontSize: 12, color: C.text, fontWeight: 600, whiteSpace: "nowrap" }}>{o.item_name}</td>
                          <td style={{ padding: "9px 12px", fontSize: 12, color: C.text, fontWeight: 700 }}>{o.qty}</td>
                          <td style={{ padding: "9px 12px", fontSize: 11, color: C.sub }}>{o.unit}</td>
                          <td style={{ padding: "9px 12px", fontSize: 11, color: C.sub }}>₹{(o.price || 0).toLocaleString("en-IN")}</td>
                          <td style={{ padding: "9px 12px", fontSize: 12, color: C.purple, fontWeight: 700 }}>₹{(o.total || 0).toLocaleString("en-IN")}</td>
                          <td style={{ padding: "9px 12px", fontSize: 11, color: C.amber, whiteSpace: "nowrap" }}>{o.delivery_date || "—"}</td>
                          <td style={{ padding: "9px 12px" }}><Badge label={o.payment_status || "pending"} color={o.payment_status === "paid" ? C.teal : o.payment_status === "advance" ? C.blue : C.amber} /></td>
                          <td style={{ padding: "9px 12px", fontSize: 11, color: C.teal }}>₹{(o.paid_amount || 0).toLocaleString("en-IN")}</td>
                          <td style={{ padding: "9px 12px", fontSize: 12, color: balance > 0 ? C.red : C.teal, fontWeight: 700 }}>₹{balance.toLocaleString("en-IN")}</td>
                          <td style={{ padding: "9px 12px" }}><Badge label={o.status} color={sc} /></td>
                          <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>
                            <ActionButtons order={o} onUpdate={updateStatus} onPayment={updatePayment} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
        }
      </Card>
    </div>
  );
}

// ── Action Buttons per order status ──────────────────────────
function ActionButtons({ order, onUpdate, onPayment }) {
  const [payModal, setPayModal] = useState(false);
  const [payAmt, setPayAmt]     = useState("");

  const btn = (label, color, onClick) => (
    <button onClick={onClick} style={{ background: color + "20", color, border: "1px solid " + color + "40", borderRadius: 6, padding: "4px 10px", fontSize: 10, cursor: "pointer", fontWeight: 700, marginRight: 4, whiteSpace: "nowrap" }}>
      {label}
    </button>
  );

  const savePayment = async () => {
    await onPayment(order.id, +payAmt, order.total);
    setPayModal(false);
    setPayAmt("");
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
      {order.status === "pending"    && btn("✅ Approve",   C.blue,  () => onUpdate(order.id, "confirmed"))}
      {order.status === "pending"    && btn("❌ Cancel",    C.red,   () => { if(window.confirm("Cancel this order?")) onUpdate(order.id, "cancelled"); })}
      {order.status === "confirmed"  && btn("🚚 Dispatch",  C.teal,  () => onUpdate(order.id, "dispatched"))}
      {order.status === "approved"   && btn("🚚 Dispatch",  C.teal,  () => onUpdate(order.id, "dispatched"))}
      {order.status === "dispatched" && btn("📦 Delivered", C.green, () => onUpdate(order.id, "delivered"))}
      {order.status !== "cancelled"  && order.payment_status !== "paid" && btn("💰 Payment", C.purple, () => setPayModal(true))}

      {payModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setPayModal(false)}>
          <div style={{ background: "#0c1a2e", borderRadius: 14, padding: 24, width: 320, border: "1px solid " + C.border }}
            onClick={e => e.stopPropagation()}>
            <div style={{ color: C.text, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>💰 Record Payment</div>
            <div style={{ color: C.sub, fontSize: 11, marginBottom: 16 }}>
              Order Total: ₹{(order.total || 0).toLocaleString("en-IN")} &nbsp;|&nbsp;
              Already Paid: ₹{(order.paid_amount || 0).toLocaleString("en-IN")}
            </div>
            <div style={{ color: C.sub, fontSize: 11, marginBottom: 6 }}>Amount Received (₹)</div>
            <input
              autoFocus
              type="number"
              value={payAmt}
              onChange={e => setPayAmt(e.target.value)}
              placeholder={"Balance: ₹" + ((order.total || 0) - (order.paid_amount || 0)).toLocaleString("en-IN")}
              style={{ width: "100%", background: "#060e1f", border: "1px solid " + C.border, borderRadius: 8, padding: "10px 14px", color: C.text, fontSize: 13, marginBottom: 16, boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={savePayment} style={{ flex: 1, background: "linear-gradient(135deg,#00d4aa,#0099ff)", color: "#000", fontWeight: 700, fontSize: 13, padding: "10px", borderRadius: 9, border: "none", cursor: "pointer" }}>Save Payment</button>
              <button onClick={() => setPayModal(false)} style={{ flex: 1, background: C.card, color: C.sub, fontWeight: 600, fontSize: 13, padding: "10px", borderRadius: 9, border: "1px solid " + C.border, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
