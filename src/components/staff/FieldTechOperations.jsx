import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext.jsx";
import { C, KPI, Card, Badge, Tbl, TR, TD, Tabs, FormBox, FGrid, Field, Alert, inp, sel } from "../common/ui.jsx";
import { supabase } from "../../lib/supabase.js";

const today = new Date().toISOString().slice(0, 10);

// ── SQL Setup Note ────────────────────────────────────────────
const SETUP_SQL = `
CREATE TABLE IF NOT EXISTS field_visits (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  farmer_id INTEGER REFERENCES farmers(id),
  tech_name TEXT DEFAULT '',
  pond_no TEXT DEFAULT '',
  doc INTEGER DEFAULT 0,
  purpose TEXT DEFAULT '',
  water_temp NUMERIC, water_sal NUMERIC, water_do NUMERIC, water_ph NUMERIC, water_amm NUMERIC,
  pond_condition TEXT DEFAULT 'good',
  observations TEXT DEFAULT '',
  recommendations TEXT DEFAULT '',
  next_visit DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS farmer_calls (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TEXT DEFAULT '',
  farmer_id INTEGER REFERENCES farmers(id),
  tech_name TEXT DEFAULT '',
  call_type TEXT DEFAULT 'incoming',
  subject TEXT DEFAULT '',
  discussion TEXT DEFAULT '',
  action_required TEXT DEFAULT '',
  followup_date DATE,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS field_orders (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  farmer_id INTEGER REFERENCES farmers(id),
  tech_name TEXT DEFAULT '',
  order_type TEXT DEFAULT 'seed',
  item_name TEXT DEFAULT '',
  qty NUMERIC DEFAULT 0,
  unit TEXT DEFAULT '',
  price NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  delivery_date DATE,
  payment_status TEXT DEFAULT 'pending',
  paid_amount NUMERIC DEFAULT 0,
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (run if needed)
ALTER TABLE field_visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_calls DISABLE ROW LEVEL SECURITY;
ALTER TABLE field_orders DISABLE ROW LEVEL SECURITY;
`.trim();

export default function FieldTechOperations() {
  const { farmers } = useApp();
  const [tab, setTab] = useState("dashboard");
  const [visits, setVisits] = useState([]);
  const [calls, setCalls] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSQL, setShowSQL] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [v, c, o] = await Promise.all([
      supabase.from("field_visits").select("*").order("date", { ascending: false }),
      supabase.from("farmer_calls").select("*").order("date", { ascending: false }),
      supabase.from("field_orders").select("*").order("date", { ascending: false }),
    ]);
    if (!v.error) setVisits(v.data || []);
    if (!c.error) setCalls(c.data || []);
    if (!o.error) setOrders(o.data || []);
    setLoading(false);
  }

  const todayVisits = visits.filter(v => v.date === today);
  const todayCalls = calls.filter(c => c.date === today);
  const pendingOrders = orders.filter(o => o.status === "pending");
  const openCalls = calls.filter(c => c.status === "open");

  return (
    <div style={{ padding: "20px 24px" }}>
      {/* SQL Setup */}
      <div style={{ marginBottom: 14 }}>
        <button onClick={() => setShowSQL(p => !p)} style={{ background: "none", border: "1px solid " + C.border, color: C.sub, borderRadius: 7, padding: "4px 12px", fontSize: 11, cursor: "pointer" }}>
          {showSQL ? "▲" : "▼"} SQL Table Setup (run once in Supabase)
        </button>
        {showSQL && (
          <pre style={{ marginTop: 8, background: "#0a0f1e", border: "1px solid " + C.border, borderRadius: 8, padding: 14, color: C.teal, fontSize: 10, overflowX: "auto", whiteSpace: "pre-wrap" }}>
            {SETUP_SQL}
          </pre>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <KPI label="Today's Visits"   value={todayVisits.length}    sub="farm visits today"    color={C.teal}   icon="🚗"/>
        <KPI label="Today's Calls"    value={todayCalls.length}     sub="calls today"          color={C.blue}   icon="📞"/>
        <KPI label="Pending Orders"   value={pendingOrders.length}  sub="awaiting dispatch"    color={C.amber}  icon="🛒"/>
        <KPI label="Open Follow-ups"  value={openCalls.length}      sub="action required"      color={C.red}    icon="⚠️"/>
        <KPI label="Total Visits"     value={visits.length}         sub="all time"             color={C.purple} icon="📋"/>
      </div>

      <Tabs
        tabs={[
          { id: "dashboard", label: "📊 Overview" },
          { id: "visits",    label: "🚗 Farm Visits" },
          { id: "calls",     label: "📞 Farmer Calls" },
          { id: "orders",    label: "🛒 Orders" },
        ]}
        active={tab} onChange={setTab}
      />

      {tab === "dashboard" && <DashboardTab visits={visits} calls={calls} orders={orders} farmers={farmers} today={today} />}
      {tab === "visits"    && <VisitsTab    visits={visits} farmers={farmers} reload={loadAll} />}
      {tab === "calls"     && <CallsTab     calls={calls}   farmers={farmers} reload={loadAll} />}
      {tab === "orders"    && <OrdersTab    orders={orders} farmers={farmers} reload={loadAll} />}
    </div>
  );
}

// ── Dashboard Tab ─────────────────────────────────────────────
function DashboardTab({ visits, calls, orders, farmers, today }) {
  const todayVisits  = visits.filter(v => v.date === today);
  const pendingOrders = orders.filter(o => o.status === "pending");
  const openCalls    = calls.filter(c => c.status === "open");

  const getFarmer = id => farmers.find(f => f.id === id);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>
      {/* Today's Farm Visits */}
      <Card>
        <div style={{ color: C.text, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>🚗 Today's Farm Visits ({todayVisits.length})</div>
        {todayVisits.length === 0
          ? <div style={{ color: C.sub, fontSize: 12, textAlign: "center", padding: 24 }}>No visits logged today</div>
          : todayVisits.map(v => {
            const f = getFarmer(v.farmer_id);
            return (
              <div key={v.id} style={{ background: C.card2, borderRadius: 8, padding: "10px 14px", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: C.text, fontWeight: 700, fontSize: 12 }}>{f?.name || "—"}</span>
                  <Badge label={v.pond_condition} color={v.pond_condition === "good" ? C.teal : v.pond_condition === "average" ? C.amber : C.red} />
                </div>
                <div style={{ color: C.sub, fontSize: 11 }}>Pond: {v.pond_no || "—"} • DOC: D{v.doc} • {v.purpose}</div>
                {v.observations && <div style={{ color: C.sub, fontSize: 10, marginTop: 4 }}>{v.observations}</div>}
              </div>
            );
          })}
      </Card>

      {/* Pending Orders */}
      <Card>
        <div style={{ color: C.text, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>🛒 Pending Orders ({pendingOrders.length})</div>
        {pendingOrders.length === 0
          ? <div style={{ color: C.sub, fontSize: 12, textAlign: "center", padding: 24 }}>No pending orders</div>
          : pendingOrders.map(o => {
            const f = getFarmer(o.farmer_id);
            const typeColor = o.order_type === "seed" ? C.teal : o.order_type === "feed" ? C.amber : C.purple;
            return (
              <div key={o.id} style={{ background: C.card2, borderRadius: 8, padding: "10px 14px", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: C.text, fontWeight: 700, fontSize: 12 }}>{f?.name || "—"}</span>
                  <Badge label={o.order_type} color={typeColor} />
                </div>
                <div style={{ color: C.sub, fontSize: 11 }}>{o.item_name} • {o.qty} {o.unit} • ₹{(o.total || 0).toLocaleString("en-IN")}</div>
                <div style={{ color: C.sub, fontSize: 10, marginTop: 3 }}>Delivery: {o.delivery_date || "TBD"}</div>
              </div>
            );
          })}
      </Card>

      {/* Open Follow-up Calls */}
      <Card>
        <div style={{ color: C.text, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>📞 Open Follow-ups ({openCalls.length})</div>
        {openCalls.length === 0
          ? <div style={{ color: C.sub, fontSize: 12, textAlign: "center", padding: 24 }}>No open follow-ups</div>
          : openCalls.slice(0, 5).map(c => {
            const f = getFarmer(c.farmer_id);
            return (
              <div key={c.id} style={{ background: C.red + "10", borderRadius: 8, padding: "10px 14px", marginBottom: 8, border: "1px solid " + C.red + "20" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: C.text, fontWeight: 700, fontSize: 12 }}>{f?.name || "—"}</span>
                  <span style={{ color: C.sub, fontSize: 10 }}>{c.date}</span>
                </div>
                <div style={{ color: C.sub, fontSize: 11 }}>{c.subject}</div>
                {c.action_required && <div style={{ color: C.amber, fontSize: 10, marginTop: 3 }}>Action: {c.action_required}</div>}
              </div>
            );
          })}
      </Card>

      {/* Recent Orders Summary */}
      <Card>
        <div style={{ color: C.text, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>📊 Orders Summary</div>
        {[
          { label: "Seed (PL) Orders", type: "seed", color: C.teal, icon: "🦐" },
          { label: "Feed Orders",      type: "feed", color: C.amber, icon: "🌾" },
          { label: "Medicine Orders",  type: "medicine", color: C.purple, icon: "💊" },
        ].map(({ label, type, color, icon }) => {
          const typeOrders = orders.filter(o => o.order_type === type);
          const total = typeOrders.reduce((s, o) => s + (o.total || 0), 0);
          return (
            <div key={type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid " + C.border }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <div>
                  <div style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>{label}</div>
                  <div style={{ color: C.sub, fontSize: 10 }}>{typeOrders.length} orders</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color, fontSize: 13, fontWeight: 700 }}>₹{(total / 1000).toFixed(1)}K</div>
                <div style={{ color: C.sub, fontSize: 10 }}>{typeOrders.filter(o => o.status === "pending").length} pending</div>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ── Farm Visits Tab ───────────────────────────────────────────
function VisitsTab({ visits, farmers, reload }) {
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const blank = { date: today, farmer_id: "", tech_name: "", pond_no: "", doc: "", purpose: "Routine Visit", water_temp: "", water_sal: "", water_do: "", water_ph: "", water_amm: "", pond_condition: "good", observations: "", recommendations: "", next_visit: "" };
  const [form, setForm] = useState(blank);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.farmer_id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("field_visits").insert({
        date: form.date, farmer_id: +form.farmer_id, tech_name: form.tech_name,
        pond_no: form.pond_no, doc: +form.doc || 0, purpose: form.purpose,
        water_temp: form.water_temp ? +form.water_temp : null,
        water_sal:  form.water_sal  ? +form.water_sal  : null,
        water_do:   form.water_do   ? +form.water_do   : null,
        water_ph:   form.water_ph   ? +form.water_ph   : null,
        water_amm:  form.water_amm  ? +form.water_amm  : null,
        pond_condition: form.pond_condition, observations: form.observations,
        recommendations: form.recommendations, next_visit: form.next_visit || null,
      });
      if (error) throw new Error(error.message);
      setShow(false); setForm(blank); await reload();
    } catch (e) { alert("Error: " + e.message); }
    finally { setSaving(false); }
  };

  const getFarmer = id => farmers.find(f => f.id === id);

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button onClick={() => setShow(true)} style={{ background: "linear-gradient(135deg,#00d4aa,#0099ff)", color: "#000", fontWeight: 700, fontSize: 13, padding: "8px 18px", borderRadius: 10, border: "none", cursor: "pointer" }}>+ Log Farm Visit</button>
      </div>

      {show && (
        <FormBox title="🚗 Log Farm Visit" onClose={() => setShow(false)} onSave={save}>
          <FGrid cols={4}>
            <Field label="Date"><input style={inp} type="date" value={form.date} onChange={e => f("date", e.target.value)} /></Field>
            <Field label="Farmer *">
              <select style={sel} value={form.farmer_id} onChange={e => f("farmer_id", e.target.value)}>
                <option value="">— Select Farmer —</option>
                {farmers.map(fm => <option key={fm.id} value={fm.id}>{fm.name} — {fm.village}</option>)}
              </select>
            </Field>
            <Field label="Technician Name"><input style={inp} value={form.tech_name} onChange={e => f("tech_name", e.target.value)} placeholder="Tech name" /></Field>
            <Field label="Pond No."><input style={inp} value={form.pond_no} onChange={e => f("pond_no", e.target.value)} placeholder="Pond 1" /></Field>
            <Field label="Farmer DOC"><input style={inp} type="number" value={form.doc} onChange={e => f("doc", e.target.value)} placeholder="14" /></Field>
            <Field label="Purpose">
              <select style={sel} value={form.purpose} onChange={e => f("purpose", e.target.value)}>
                {["Routine Visit", "Water Check", "Harvest Planning", "Problem Solving", "Feed Delivery", "Medicine Delivery", "Sales Visit"].map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Pond Condition">
              <select style={sel} value={form.pond_condition} onChange={e => f("pond_condition", e.target.value)}>
                <option value="good">Good ✅</option>
                <option value="average">Average ⚠️</option>
                <option value="poor">Poor 🔴</option>
              </select>
            </Field>
            <Field label="Next Visit Date"><input style={inp} type="date" value={form.next_visit} onChange={e => f("next_visit", e.target.value)} /></Field>
          </FGrid>

          {/* Pond Water Parameters */}
          <div style={{ marginTop: 12, padding: "10px 14px", background: C.blue + "10", borderRadius: 8, border: "1px solid " + C.blue + "20" }}>
            <div style={{ color: C.blue, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>💧 Pond Water Parameters (Optional)</div>
            <FGrid cols={5}>
              <Field label="Temp °C"><input style={inp} type="number" value={form.water_temp} onChange={e => f("water_temp", e.target.value)} placeholder="28" /></Field>
              <Field label="Salinity ppt"><input style={inp} type="number" value={form.water_sal} onChange={e => f("water_sal", e.target.value)} placeholder="15" /></Field>
              <Field label="DO mg/L"><input style={inp} type="number" value={form.water_do} onChange={e => f("water_do", e.target.value)} placeholder="6" /></Field>
              <Field label="pH"><input style={inp} type="number" value={form.water_ph} onChange={e => f("water_ph", e.target.value)} placeholder="7.5" /></Field>
              <Field label="Ammonia ppm"><input style={inp} type="number" value={form.water_amm} onChange={e => f("water_amm", e.target.value)} placeholder="0.1" /></Field>
            </FGrid>
          </div>

          <FGrid cols={2} style={{ marginTop: 8 }}>
            <Field label="Observations"><input style={inp} value={form.observations} onChange={e => f("observations", e.target.value)} placeholder="Shrimp active, colour normal..." /></Field>
            <Field label="Recommendations"><input style={inp} value={form.recommendations} onChange={e => f("recommendations", e.target.value)} placeholder="Reduce feeding, add probiotic..." /></Field>
          </FGrid>
          {saving && <div style={{ color: C.teal, fontSize: 12, marginTop: 8 }}>Saving...</div>}
        </FormBox>
      )}

      <Card>
        <Tbl heads={["Date", "Farmer", "Village", "Tech", "Pond", "DOC", "Purpose", "Condition", "Temp", "Sal", "DO", "pH", "Ammonia", "Observations", "Next Visit"]}>
          {visits.length === 0 && <TR><TD colSpan={15} style={{ textAlign: "center", padding: 30, color: C.sub }}>No farm visits logged yet.</TD></TR>}
          {visits.map(v => {
            const fm = getFarmer(v.farmer_id);
            const cc = v.pond_condition === "good" ? C.teal : v.pond_condition === "average" ? C.amber : C.red;
            return (
              <TR key={v.id}>
                <TD>{v.date}</TD>
                <TD color={C.blue} bold>{fm?.name || "—"}</TD>
                <TD color={C.sub}>{fm?.village || "—"}</TD>
                <TD color={C.sub} small>{v.tech_name || "—"}</TD>
                <TD color={C.sub}>{v.pond_no || "—"}</TD>
                <TD color={C.teal} bold>D{v.doc}</TD>
                <TD color={C.sub} small>{v.purpose}</TD>
                <TD><Badge label={v.pond_condition} color={cc} /></TD>
                <TD color={C.sub}>{v.water_temp ?? "—"}</TD>
                <TD color={C.sub}>{v.water_sal  ?? "—"}</TD>
                <TD color={v.water_do < 5 ? C.red : C.teal} bold={v.water_do < 5}>{v.water_do  ?? "—"}</TD>
                <TD color={C.sub}>{v.water_ph   ?? "—"}</TD>
                <TD color={v.water_amm > 0.5 ? C.red : C.sub}>{v.water_amm ?? "—"}</TD>
                <TD color={C.sub} small>{v.observations || "—"}</TD>
                <TD color={C.amber}>{v.next_visit || "—"}</TD>
              </TR>
            );
          })}
        </Tbl>
      </Card>
    </div>
  );
}

// ── Farmer Calls Tab ──────────────────────────────────────────
function CallsTab({ calls, farmers, reload }) {
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const blank = { date: today, time: "", farmer_id: "", tech_name: "", call_type: "incoming", subject: "", discussion: "", action_required: "", followup_date: "", status: "open" };
  const [form, setForm] = useState(blank);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.farmer_id || !form.subject) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("farmer_calls").insert({
        date: form.date, time: form.time, farmer_id: +form.farmer_id,
        tech_name: form.tech_name, call_type: form.call_type,
        subject: form.subject, discussion: form.discussion,
        action_required: form.action_required,
        followup_date: form.followup_date || null, status: form.status,
      });
      if (error) throw new Error(error.message);
      setShow(false); setForm(blank); await reload();
    } catch (e) { alert("Error: " + e.message); }
    finally { setSaving(false); }
  };

  const closeCall = async (id) => {
    await supabase.from("farmer_calls").update({ status: "closed" }).eq("id", id);
    await reload();
  };

  const getFarmer = id => farmers.find(f => f.id === id);

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button onClick={() => setShow(true)} style={{ background: "linear-gradient(135deg,#00d4aa,#0099ff)", color: "#000", fontWeight: 700, fontSize: 13, padding: "8px 18px", borderRadius: 10, border: "none", cursor: "pointer" }}>+ Log Call</button>
      </div>

      {show && (
        <FormBox title="📞 Log Farmer Call" onClose={() => setShow(false)} onSave={save}>
          <FGrid cols={4}>
            <Field label="Date"><input style={inp} type="date" value={form.date} onChange={e => f("date", e.target.value)} /></Field>
            <Field label="Time"><input style={inp} type="time" value={form.time} onChange={e => f("time", e.target.value)} /></Field>
            <Field label="Farmer *">
              <select style={sel} value={form.farmer_id} onChange={e => f("farmer_id", e.target.value)}>
                <option value="">— Select Farmer —</option>
                {farmers.map(fm => <option key={fm.id} value={fm.id}>{fm.name} — {fm.village}</option>)}
              </select>
            </Field>
            <Field label="Technician"><input style={inp} value={form.tech_name} onChange={e => f("tech_name", e.target.value)} placeholder="Tech name" /></Field>
            <Field label="Call Type">
              <select style={sel} value={form.call_type} onChange={e => f("call_type", e.target.value)}>
                <option value="incoming">📲 Incoming (Farmer called)</option>
                <option value="outgoing">📞 Outgoing (We called)</option>
              </select>
            </Field>
            <Field label="Subject *"><input style={inp} value={form.subject} onChange={e => f("subject", e.target.value)} placeholder="Water quality issue, Order inquiry..." /></Field>
            <Field label="Status">
              <select style={sel} value={form.status} onChange={e => f("status", e.target.value)}>
                <option value="open">Open (Follow-up needed)</option>
                <option value="closed">Closed (Resolved)</option>
              </select>
            </Field>
            <Field label="Follow-up Date"><input style={inp} type="date" value={form.followup_date} onChange={e => f("followup_date", e.target.value)} /></Field>
            <Field label="Discussion" style={{ gridColumn: "1/-1" }}><input style={inp} value={form.discussion} onChange={e => f("discussion", e.target.value)} placeholder="What was discussed..." /></Field>
            <Field label="Action Required" style={{ gridColumn: "1/-1" }}><input style={inp} value={form.action_required} onChange={e => f("action_required", e.target.value)} placeholder="Send feed samples, schedule visit..." /></Field>
          </FGrid>
          {saving && <div style={{ color: C.teal, fontSize: 12, marginTop: 8 }}>Saving...</div>}
        </FormBox>
      )}

      <Card>
        <Tbl heads={["Date", "Time", "Farmer", "Tech", "Type", "Subject", "Discussion", "Action Required", "Follow-up", "Status", ""]}>
          {calls.length === 0 && <TR><TD colSpan={11} style={{ textAlign: "center", padding: 30, color: C.sub }}>No calls logged yet.</TD></TR>}
          {calls.map(c => {
            const fm = getFarmer(c.farmer_id);
            const tc = c.call_type === "incoming" ? C.blue : C.teal;
            return (
              <TR key={c.id}>
                <TD>{c.date}</TD>
                <TD color={C.sub} small>{c.time || "—"}</TD>
                <TD color={C.blue} bold>{fm?.name || "—"}</TD>
                <TD color={C.sub} small>{c.tech_name || "—"}</TD>
                <TD><Badge label={c.call_type} color={tc} /></TD>
                <TD color={C.text} bold>{c.subject}</TD>
                <TD color={C.sub} small>{c.discussion || "—"}</TD>
                <TD color={C.amber} small>{c.action_required || "—"}</TD>
                <TD color={C.sub}>{c.followup_date || "—"}</TD>
                <TD><Badge label={c.status} color={c.status === "open" ? C.red : C.teal} /></TD>
                <TD>
                  {c.status === "open" && (
                    <button onClick={() => closeCall(c.id)} style={{ background: C.teal + "20", color: C.teal, border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>Close</button>
                  )}
                </TD>
              </TR>
            );
          })}
        </Tbl>
      </Card>
    </div>
  );
}

// ── Orders Tab ────────────────────────────────────────────────
function OrdersTab({ orders, farmers, reload }) {
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fType, setFType] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const blank = { date: today, farmer_id: "", tech_name: "", order_type: "seed", item_name: "", qty: "", unit: "", price: "", total: "", delivery_date: "", payment_status: "pending", paid_amount: "", notes: "", status: "pending" };
  const [form, setForm] = useState(blank);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const calcTotal = (qty, price) => { const t = (+qty || 0) * (+price || 0); f("total", t); };

  const save = async () => {
    if (!form.farmer_id || !form.item_name) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("field_orders").insert({
        date: form.date, farmer_id: +form.farmer_id, tech_name: form.tech_name,
        order_type: form.order_type, item_name: form.item_name,
        qty: +form.qty || 0, unit: form.unit, price: +form.price || 0,
        total: +form.total || 0, delivery_date: form.delivery_date || null,
        payment_status: form.payment_status, paid_amount: +form.paid_amount || 0,
        notes: form.notes, status: form.status,
      });
      if (error) throw new Error(error.message);
      setShow(false); setForm(blank); await reload();
    } catch (e) { alert("Error: " + e.message); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id, status) => {
    await supabase.from("field_orders").update({ status }).eq("id", id);
    await reload();
  };

  const getFarmer = id => farmers.find(f => f.id === id);

  const filtered = orders.filter(o =>
    (fType === "all" || o.order_type === fType) &&
    (fStatus === "all" || o.status === fStatus)
  );

  const totalRevenue = filtered.reduce((s, o) => s + (o.total || 0), 0);

  const unitOptions = {
    seed: ["1000 PLs", "Nos", "Lakhs"],
    feed: ["kg", "bag (30kg)", "bag (25kg)"],
    medicine: ["g", "kg", "ml", "L", "bottle"],
  };

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select style={{ ...sel, width: "auto", fontSize: 12, padding: "6px 10px" }} value={fType} onChange={e => setFType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="seed">🦐 Seed (PL)</option>
            <option value="feed">🌾 Feed</option>
            <option value="medicine">💊 Medicine</option>
          </select>
          <select style={{ ...sel, width: "auto", fontSize: 12, padding: "6px 10px" }} value={fStatus} onChange={e => setFStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <span style={{ color: C.teal, fontSize: 12, fontWeight: 700 }}>Total: ₹{totalRevenue.toLocaleString("en-IN")}</span>
        </div>
        <button onClick={() => setShow(true)} style={{ background: "linear-gradient(135deg,#00d4aa,#0099ff)", color: "#000", fontWeight: 700, fontSize: 13, padding: "8px 18px", borderRadius: 10, border: "none", cursor: "pointer" }}>+ Add Order</button>
      </div>

      {show && (
        <FormBox title="🛒 Add Farmer Order" onClose={() => setShow(false)} onSave={save}>
          <FGrid cols={4}>
            <Field label="Date"><input style={inp} type="date" value={form.date} onChange={e => f("date", e.target.value)} /></Field>
            <Field label="Farmer *">
              <select style={sel} value={form.farmer_id} onChange={e => f("farmer_id", e.target.value)}>
                <option value="">— Select Farmer —</option>
                {farmers.map(fm => <option key={fm.id} value={fm.id}>{fm.name} — {fm.village}</option>)}
              </select>
            </Field>
            <Field label="Technician"><input style={inp} value={form.tech_name} onChange={e => f("tech_name", e.target.value)} placeholder="Tech name" /></Field>
            <Field label="Order Type">
              <select style={sel} value={form.order_type} onChange={e => { f("order_type", e.target.value); f("unit", ""); }}>
                <option value="seed">🦐 Seed (PL)</option>
                <option value="feed">🌾 Feed</option>
                <option value="medicine">💊 Medicine</option>
              </select>
            </Field>
            <Field label="Item Name *"><input style={inp} value={form.item_name} onChange={e => f("item_name", e.target.value)} placeholder={form.order_type === "seed" ? "PL-8, PL-10..." : form.order_type === "feed" ? "Goldcoin, CP..." : "EDTA, Probiotic..."} /></Field>
            <Field label="Quantity"><input style={inp} type="number" value={form.qty} onChange={e => { f("qty", e.target.value); calcTotal(e.target.value, form.price); }} placeholder="100" /></Field>
            <Field label="Unit">
              <select style={sel} value={form.unit} onChange={e => f("unit", e.target.value)}>
                <option value="">— Unit —</option>
                {(unitOptions[form.order_type] || []).map(u => <option key={u}>{u}</option>)}
              </select>
            </Field>
            <Field label="Price (₹)"><input style={inp} type="number" value={form.price} onChange={e => { f("price", e.target.value); calcTotal(form.qty, e.target.value); }} placeholder="450" /></Field>
            <Field label="Total (₹)"><input style={inp} type="number" value={form.total} onChange={e => f("total", e.target.value)} /></Field>
            <Field label="Delivery Date"><input style={inp} type="date" value={form.delivery_date} onChange={e => f("delivery_date", e.target.value)} /></Field>
            <Field label="Payment Status">
              <select style={sel} value={form.payment_status} onChange={e => f("payment_status", e.target.value)}>
                <option value="pending">Pending</option>
                <option value="advance">Advance Paid</option>
                <option value="paid">Fully Paid</option>
              </select>
            </Field>
            <Field label="Paid Amount (₹)"><input style={inp} type="number" value={form.paid_amount} onChange={e => f("paid_amount", e.target.value)} placeholder="0" /></Field>
            <Field label="Status">
              <select style={sel} value={form.status} onChange={e => f("status", e.target.value)}>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </Field>
            <Field label="Notes"><input style={inp} value={form.notes} onChange={e => f("notes", e.target.value)} placeholder="Special instructions..." /></Field>
          </FGrid>
          {saving && <div style={{ color: C.teal, fontSize: 12, marginTop: 8 }}>Saving...</div>}
        </FormBox>
      )}

      <Card>
        <Tbl heads={["Date", "Farmer", "Tech", "Type", "Item", "Qty", "Unit", "Price", "Total", "Delivery", "Payment", "Paid", "Balance", "Status", "Action"]}>
          {filtered.length === 0 && <TR><TD colSpan={15} style={{ textAlign: "center", padding: 30, color: C.sub }}>No orders found.</TD></TR>}
          {filtered.map(o => {
            const fm = getFarmer(o.farmer_id);
            const tc = o.order_type === "seed" ? C.teal : o.order_type === "feed" ? C.amber : C.purple;
            const sc = o.status === "delivered" ? C.teal : o.status === "confirmed" ? C.blue : o.status === "cancelled" ? C.red : C.amber;
            const balance = (o.total || 0) - (o.paid_amount || 0);
            return (
              <TR key={o.id}>
                <TD>{o.date}</TD>
                <TD color={C.blue} bold>{fm?.name || "—"}</TD>
                <TD color={C.sub} small>{o.tech_name || "—"}</TD>
                <TD><Badge label={o.order_type} color={tc} /></TD>
                <TD color={C.text} bold>{o.item_name}</TD>
                <TD color={C.text} bold>{o.qty}</TD>
                <TD color={C.sub} small>{o.unit}</TD>
                <TD color={C.sub}>₹{(o.price || 0).toLocaleString("en-IN")}</TD>
                <TD color={C.purple} bold>₹{(o.total || 0).toLocaleString("en-IN")}</TD>
                <TD color={C.amber}>{o.delivery_date || "—"}</TD>
                <TD><Badge label={o.payment_status} color={o.payment_status === "paid" ? C.teal : C.amber} /></TD>
                <TD color={C.teal}>₹{(o.paid_amount || 0).toLocaleString("en-IN")}</TD>
                <TD color={balance > 0 ? C.red : C.teal} bold>₹{balance.toLocaleString("en-IN")}</TD>
                <TD><Badge label={o.status} color={sc} /></TD>
                <TD>
                  {o.status === "pending" && <button onClick={() => updateStatus(o.id, "confirmed")} style={{ background: C.blue + "20", color: C.blue, border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>Confirm</button>}
                  {o.status === "confirmed" && <button onClick={() => updateStatus(o.id, "delivered")} style={{ background: C.teal + "20", color: C.teal, border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>Delivered</button>}
                </TD>
              </TR>
            );
          })}
        </Tbl>
      </Card>
    </div>
  );
}
