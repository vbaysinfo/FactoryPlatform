import { useState } from "react";

const M = {
  bg:     "#0a0f1e",
  card:   "#111827",
  card2:  "#1a2235",
  teal:   "#00d4aa",
  blue:   "#0099ff",
  amber:  "#f59e0b",
  red:    "#ef4444",
  green:  "#22c55e",
  purple: "#a855f7",
  text:   "#e8f0fe",
  sub:    "#6b8aaa",
  border: "rgba(255,255,255,0.07)",
};

const pill = (bg, color) => ({
  background: bg + "22", color, fontSize: 10, fontWeight: 700,
  padding: "2px 9px", borderRadius: 99, display: "inline-block",
});

const btn = (bg, color = "#000") => ({
  background: bg, color, border: "none", borderRadius: 10,
  padding: "10px 0", fontWeight: 700, fontSize: 13,
  cursor: "pointer", width: "100%", marginTop: 6,
});

const inp = {
  background: "#0d1525", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 9, padding: "9px 12px", color: M.text,
  fontSize: 13, width: "100%", boxSizing: "border-box", marginTop: 4,
};

const label = { color: M.sub, fontSize: 11, marginTop: 10, display: "block" };

// ── screens ────────────────────────────────────────────────────────────────

function HomeScreen({ go }) {
  const tasks = [
    { icon: "🌊", title: "Pond Visit", sub: "3 farms scheduled today", screen: "visit", color: M.teal },
    { icon: "🎫", title: "Tickets", sub: "2 open issues from farmers", screen: "tickets", color: M.red },
    { icon: "💬", title: "Chat", sub: "1 unread message", screen: "chat", color: M.blue },
    { icon: "📦", title: "Orders", sub: "1 new order to confirm", screen: "orders", color: M.amber },
  ];
  const recent = [
    { name: "Ravi Kumar", action: "Visit logged", time: "10:30 AM", color: M.teal },
    { name: "Suresh Babu", action: "Order placed – Feed 200kg", time: "9:15 AM", color: M.amber },
    { name: "Kiran Reddy", action: "Call closed", time: "Yesterday", color: M.blue },
  ];
  return (
    <div style={{ padding: "16px 14px", overflowY: "auto", height: "100%" }}>
      {/* greeting */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ color: M.sub, fontSize: 12 }}>Good Morning 👋</div>
        <div style={{ color: M.text, fontWeight: 700, fontSize: 18 }}>Arjun (Field Tech)</div>
        <div style={{ color: M.sub, fontSize: 11, marginTop: 2 }}>Tuesday, 10 Jun 2026</div>
      </div>

      {/* today summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
        {[["Visits", "3", M.teal], ["Tickets", "2", M.red], ["Chats", "1", M.blue]].map(([l, v, c]) => (
          <div key={l} style={{ background: M.card2, borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
            <div style={{ color: c, fontWeight: 700, fontSize: 22 }}>{v}</div>
            <div style={{ color: M.sub, fontSize: 10 }}>{l} Today</div>
          </div>
        ))}
      </div>

      {/* quick actions */}
      <div style={{ color: M.sub, fontSize: 11, fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>QUICK ACTIONS</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
        {tasks.map(t => (
          <button key={t.screen} onClick={() => go(t.screen)}
            style={{ background: M.card2, border: `1px solid ${t.color}22`, borderRadius: 14, padding: "14px 12px", cursor: "pointer", textAlign: "left" }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{t.icon}</div>
            <div style={{ color: M.text, fontWeight: 700, fontSize: 13 }}>{t.title}</div>
            <div style={{ color: M.sub, fontSize: 10, marginTop: 2 }}>{t.sub}</div>
          </button>
        ))}
      </div>

      {/* recent activity */}
      <div style={{ color: M.sub, fontSize: 11, fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>RECENT ACTIVITY</div>
      {recent.map((r, i) => (
        <div key={i} style={{ background: M.card, borderRadius: 11, padding: "12px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: r.color + "22", display: "flex", alignItems: "center", justifyContent: "center", color: r.color, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
            {r.name.split(" ").map(n => n[0]).join("")}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: M.text, fontSize: 12, fontWeight: 600 }}>{r.name}</div>
            <div style={{ color: M.sub, fontSize: 11 }}>{r.action}</div>
          </div>
          <div style={{ color: M.sub, fontSize: 10 }}>{r.time}</div>
        </div>
      ))}
    </div>
  );
}

function VisitScreen({ go }) {
  const [tab, setTab] = useState("list");
  const visits = [
    { farmer: "Ravi Kumar", loc: "Nellore – Plot 3", time: "11:00 AM", status: "scheduled", ponds: 4 },
    { farmer: "Suresh Babu", loc: "Kavali – Farm A", time: "2:00 PM", status: "scheduled", ponds: 2 },
    { farmer: "Kiran Reddy", loc: "Gudur – Block 1", time: "Completed", status: "done", ponds: 3 },
  ];
  const sc = s => s === "done" ? M.teal : M.amber;
  return (
    <div style={{ padding: "16px 14px", overflowY: "auto", height: "100%" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {["list", "log"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "8px", borderRadius: 9, border: "none", background: tab === t ? M.teal : M.card2, color: tab === t ? "#000" : M.sub, fontWeight: 700, fontSize: 12, cursor: "pointer", textTransform: "capitalize" }}>{t === "list" ? "Today's Visits" : "Log a Visit"}</button>
        ))}
      </div>

      {tab === "list" ? (
        visits.map((v, i) => (
          <div key={i} style={{ background: M.card, borderRadius: 13, padding: "14px", marginBottom: 10, borderLeft: `3px solid ${sc(v.status)}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ color: M.text, fontWeight: 700, fontSize: 13 }}>{v.farmer}</div>
              <span style={pill(sc(v.status), sc(v.status))}>{v.status}</span>
            </div>
            <div style={{ color: M.sub, fontSize: 11, marginBottom: 4 }}>📍 {v.loc}</div>
            <div style={{ display: "flex", gap: 12 }}>
              <span style={{ color: M.sub, fontSize: 11 }}>🕐 {v.time}</span>
              <span style={{ color: M.sub, fontSize: 11 }}>🏊 {v.ponds} ponds</span>
            </div>
            {v.status === "scheduled" && (
              <button onClick={() => setTab("log")} style={{ ...btn("linear-gradient(135deg,#00d4aa,#0099ff)"), marginTop: 10, padding: "8px 0", fontSize: 12 }}>Start Visit</button>
            )}
          </div>
        ))
      ) : (
        <div style={{ background: M.card, borderRadius: 14, padding: 16 }}>
          <div style={{ color: M.text, fontWeight: 700, marginBottom: 12 }}>Log Pond Visit</div>
          <label style={label}>Farmer Name</label>
          <input style={inp} defaultValue="Ravi Kumar" />
          <label style={label}>Location</label>
          <input style={inp} placeholder="Farm location" />
          <div style={{ color: M.sub, fontSize: 11, fontWeight: 600, letterSpacing: 1, margin: "14px 0 8px" }}>POND WATER PARAMS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {["Temp °C", "DO mg/L", "pH", "Salinity ppt"].map(p => (
              <div key={p}>
                <label style={{ ...label, marginTop: 0 }}>{p}</label>
                <input style={inp} placeholder="0.0" type="number" />
              </div>
            ))}
          </div>
          <label style={label}>Pond Condition</label>
          <select style={{ ...inp }}>
            <option>Good</option><option>Fair</option><option>Poor</option><option>Critical</option>
          </select>
          <label style={label}>Notes / Observations</label>
          <textarea style={{ ...inp, height: 70, resize: "none" }} placeholder="Any issues observed..." />
          <label style={label}>Next Visit Date</label>
          <input style={inp} type="date" />
          <button style={btn("linear-gradient(135deg,#00d4aa,#0099ff)")}>✅ Submit Visit Log</button>
        </div>
      )}
    </div>
  );
}

function CallsScreen() {
  const [tab, setTab] = useState("open");
  const calls = [
    { farmer: "Mohan Das", dir: "incoming", sub: "Feed delivery delay", time: "9:00 AM", action: "Resend today", status: "open" },
    { farmer: "Vijay Rao", dir: "outgoing", sub: "Water quality advice", time: "Yesterday", action: "Completed", status: "closed" },
    { farmer: "Sita Devi", dir: "incoming", sub: "Medicine order query", time: "8:45 AM", action: "Call back by 3 PM", status: "open" },
  ];
  const filtered = calls.filter(c => c.status === tab);
  return (
    <div style={{ padding: "16px 14px", overflowY: "auto", height: "100%" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {["open", "closed"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "8px", borderRadius: 9, border: "none", background: tab === t ? (t === "open" ? M.amber : M.teal) : M.card2, color: tab === t ? "#000" : M.sub, fontWeight: 700, fontSize: 12, cursor: "pointer", textTransform: "capitalize" }}>{t === "open" ? "Open Calls" : "Closed"}</button>
        ))}
      </div>
      {filtered.map((c, i) => (
        <div key={i} style={{ background: M.card, borderRadius: 13, padding: "14px", marginBottom: 10, borderLeft: `3px solid ${c.dir === "incoming" ? M.blue : M.teal}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ color: M.text, fontWeight: 700, fontSize: 13 }}>{c.farmer}</div>
            <span style={pill(c.dir === "incoming" ? M.blue : M.teal, c.dir === "incoming" ? M.blue : M.teal)}>{c.dir}</span>
          </div>
          <div style={{ color: M.sub, fontSize: 11, marginBottom: 4 }}>📋 {c.sub}</div>
          <div style={{ color: M.sub, fontSize: 11, marginBottom: 8 }}>⚡ {c.action}</div>
          <div style={{ color: M.sub, fontSize: 10 }}>🕐 {c.time}</div>
          {c.status === "open" && <button style={{ ...btn(M.green + "22", M.green), marginTop: 10, padding: "7px 0", fontSize: 11 }}>✓ Mark Closed</button>}
        </div>
      ))}
      {/* log new call */}
      <div style={{ background: M.card, borderRadius: 14, padding: 16, marginTop: 8 }}>
        <div style={{ color: M.text, fontWeight: 700, marginBottom: 10 }}>+ Log New Call</div>
        <label style={label}>Farmer Name</label>
        <input style={inp} placeholder="Farmer name" />
        <label style={label}>Direction</label>
        <select style={inp}><option>Incoming</option><option>Outgoing</option></select>
        <label style={label}>Subject</label>
        <input style={inp} placeholder="Call subject" />
        <label style={label}>Action Required</label>
        <input style={inp} placeholder="What needs to be done?" />
        <button style={btn("linear-gradient(135deg,#0099ff,#a855f7)")}>📞 Save Call Log</button>
      </div>
    </div>
  );
}

function OrdersScreen() {
  const orders = [
    { farmer: "Ravi Kumar", type: "Feed", item: "Grow-out Feed 2mm", qty: "200 kg", total: "₹18,000", status: "pending", date: "Today" },
    { farmer: "Suresh Babu", type: "Seed", item: "PL-12 Vannamei", qty: "5 Lakhs", total: "₹25,000", status: "confirmed", date: "Tomorrow" },
    { farmer: "Kiran Reddy", type: "Medicine", item: "Probiotics 1kg", qty: "10 packs", total: "₹4,500", status: "delivered", date: "Yesterday" },
  ];
  const sc = s => s === "delivered" ? M.teal : s === "confirmed" ? M.blue : M.amber;
  return (
    <div style={{ padding: "16px 14px", overflowY: "auto", height: "100%" }}>
      <div style={{ color: M.text, fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Farmer Orders</div>
      {orders.map((o, i) => (
        <div key={i} style={{ background: M.card, borderRadius: 13, padding: "14px", marginBottom: 10, borderLeft: `3px solid ${sc(o.status)}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ color: M.text, fontWeight: 700, fontSize: 13 }}>{o.farmer}</div>
            <span style={pill(sc(o.status), sc(o.status))}>{o.status}</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={pill(M.purple, M.purple)}>{o.type}</span>
            <span style={{ color: M.sub, fontSize: 11 }}>{o.item}</span>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <span style={{ color: M.sub, fontSize: 11 }}>Qty: <b style={{ color: M.text }}>{o.qty}</b></span>
            <span style={{ color: M.sub, fontSize: 11 }}>Total: <b style={{ color: M.teal }}>{o.total}</b></span>
          </div>
          <div style={{ color: M.sub, fontSize: 10, marginTop: 4 }}>📅 {o.date}</div>
          {o.status === "pending" && (
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={{ ...btn(M.teal + "22", M.teal), flex: 1, padding: "7px 0", fontSize: 11 }}>✓ Confirm</button>
              <button style={{ ...btn(M.red + "22", M.red), flex: 1, padding: "7px 0", fontSize: 11 }}>✗ Cancel</button>
            </div>
          )}
        </div>
      ))}
      {/* new order */}
      <div style={{ background: M.card, borderRadius: 14, padding: 16, marginTop: 4 }}>
        <div style={{ color: M.text, fontWeight: 700, marginBottom: 10 }}>+ New Order</div>
        <label style={label}>Farmer Name</label>
        <input style={inp} placeholder="Select farmer" />
        <label style={label}>Order Type</label>
        <select style={inp}><option>Feed</option><option>Seed / PL</option><option>Medicine</option></select>
        <label style={label}>Item Name</label>
        <input style={inp} placeholder="Item description" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div><label style={label}>Qty</label><input style={inp} placeholder="Amount" type="number" /></div>
          <div><label style={label}>Unit</label><select style={inp}><option>kg</option><option>Lakhs</option><option>packs</option><option>litres</option></select></div>
        </div>
        <label style={label}>Price per unit (₹)</label>
        <input style={inp} placeholder="0" type="number" />
        <label style={label}>Delivery Date</label>
        <input style={inp} type="date" />
        <button style={btn("linear-gradient(135deg,#f59e0b,#ef4444)", "#000")}>📦 Place Order</button>
      </div>
    </div>
  );
}

function ReportsScreen() {
  const logs = [
    { type: "Visit", farmer: "Ravi Kumar", date: "10 Jun", note: "Pond condition good, temp 29°C" },
    { type: "Call", farmer: "Suresh Babu", date: "9 Jun", note: "Feed order query – resolved" },
    { type: "Order", farmer: "Kiran Reddy", date: "8 Jun", note: "Medicine 10 packs – delivered" },
    { type: "Visit", farmer: "Mohan Das", date: "7 Jun", note: "Low DO alert, advised aeration" },
  ];
  const tc = t => t === "Visit" ? M.teal : t === "Call" ? M.blue : M.amber;
  return (
    <div style={{ padding: "16px 14px", overflowY: "auto", height: "100%" }}>
      <div style={{ color: M.text, fontWeight: 700, fontSize: 15, marginBottom: 14 }}>My Submitted Logs</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[["Visits", "12", M.teal], ["Calls", "8", M.blue], ["Orders", "5", M.amber]].map(([l, v, c]) => (
          <div key={l} style={{ background: M.card2, borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
            <div style={{ color: c, fontWeight: 700, fontSize: 20 }}>{v}</div>
            <div style={{ color: M.sub, fontSize: 10 }}>This Month</div>
            <div style={{ color: M.sub, fontSize: 10 }}>{l}</div>
          </div>
        ))}
      </div>
      {logs.map((l, i) => (
        <div key={i} style={{ background: M.card, borderRadius: 12, padding: "12px 14px", marginBottom: 8, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: tc(l.type) + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
            {l.type === "Visit" ? "🌊" : l.type === "Call" ? "📞" : "📦"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: M.text, fontSize: 12, fontWeight: 700 }}>{l.farmer}</span>
              <span style={{ color: M.sub, fontSize: 10 }}>{l.date}</span>
            </div>
            <div style={{ color: M.sub, fontSize: 11, marginTop: 3 }}>{l.note}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── tickets screen ─────────────────────────────────────────────────────────
function TicketsScreen({ go }) {
  const [tab, setTab] = useState("open");
  const tickets = [
    { id: "TK-001", farmer: "Ravi Kumar", issue: "White spots on shrimp", pond: "Pond 2", priority: "high", status: "open", time: "30 min ago", desc: "Shrimp are showing white spots on the body, some are dying. Water looks normal." },
    { id: "TK-002", farmer: "Suresh Babu", issue: "Shrimp not eating feed", pond: "Pond A", priority: "medium", status: "open", time: "2 hrs ago", desc: "Fed this morning but shrimp are not consuming the feed. Water temp is 28°C." },
    { id: "TK-003", farmer: "Kiran Reddy", issue: "Pond water colour change", pond: "Block 1", priority: "low", status: "resolved", time: "Yesterday", desc: "Water turned green colour. Checked — algae bloom, advised water change." },
    { id: "TK-004", farmer: "Mohan Das", issue: "Shrimp floating on surface", pond: "Pond 3", priority: "high", status: "in-progress", time: "1 hr ago", desc: "Many shrimp floating, low oxygen suspected." },
  ];
  const filtered = tickets.filter(t => tab === "all" ? true : t.status === tab);
  const pc = p => p === "high" ? M.red : p === "medium" ? M.amber : M.teal;
  const sc = s => s === "resolved" ? M.teal : s === "in-progress" ? M.blue : M.amber;

  return (
    <div style={{ padding: "16px 14px", overflowY: "auto", height: "100%" }}>
      {/* summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[["🔴 Open", tickets.filter(t=>t.status==="open").length, M.red],
          ["🔵 Progress", tickets.filter(t=>t.status==="in-progress").length, M.blue],
          ["✅ Resolved", tickets.filter(t=>t.status==="resolved").length, M.teal]].map(([l,v,c])=>(
          <div key={l} style={{ background: M.card2, borderRadius: 11, padding: "10px 8px", textAlign: "center" }}>
            <div style={{ color: c, fontWeight: 700, fontSize: 20 }}>{v}</div>
            <div style={{ color: M.sub, fontSize: 9 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto" }}>
        {[["open","Open"],["in-progress","In Progress"],["resolved","Resolved"],["all","All"]].map(([k,lb])=>(
          <button key={k} onClick={()=>setTab(k)} style={{ flexShrink:0, padding:"6px 12px", borderRadius:8, border:"none", background: tab===k ? M.blue : M.card2, color: tab===k ? "#fff" : M.sub, fontWeight:700, fontSize:11, cursor:"pointer" }}>{lb}</button>
        ))}
      </div>

      {filtered.map(t => (
        <div key={t.id} style={{ background: M.card, borderRadius: 13, padding: "13px", marginBottom: 10, borderLeft: `3px solid ${pc(t.priority)}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ color: M.sub, fontSize: 10 }}>{t.id}</span>
            <span style={pill(pc(t.priority), pc(t.priority))}>{t.priority}</span>
          </div>
          <div style={{ color: M.text, fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{t.issue}</div>
          <div style={{ color: M.sub, fontSize: 11, marginBottom: 6 }}>👨‍🌾 {t.farmer} • 🏊 {t.pond}</div>
          <div style={{ color: "#9ca3af", fontSize: 11, marginBottom: 8, lineHeight: 1.4 }}>{t.desc}</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={pill(sc(t.status), sc(t.status))}>{t.status}</span>
            <span style={{ color: M.sub, fontSize: 10 }}>🕐 {t.time}</span>
          </div>
          {t.status !== "resolved" && (
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <button onClick={() => go("chat")} style={{ ...btn(M.blue+"22", M.blue), flex:1, padding:"7px 0", fontSize:11 }}>💬 Reply in Chat</button>
              {t.status === "open" && <button style={{ ...btn(M.amber+"22", M.amber), flex:1, padding:"7px 0", fontSize:11 }}>▶ Take Up</button>}
              {t.status === "in-progress" && <button style={{ ...btn(M.teal+"22", M.teal), flex:1, padding:"7px 0", fontSize:11 }}>✓ Resolve</button>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── chat screen ────────────────────────────────────────────────────────────
function ChatScreen() {
  const [activeFarmer, setActiveFarmer] = useState(null);
  const [msgInput, setMsgInput] = useState("");
  const [chats, setChats] = useState({
    "Ravi Kumar": [
      { from: "farmer", text: "Sir, shrimp have white spots on body, some are dying. What to do?", time: "10:05 AM" },
      { from: "tech",   text: "Hello Ravi, don't panic. Can you check the water temperature and DO level right now?", time: "10:08 AM" },
      { from: "farmer", text: "Temp 29°C, DO I don't know how to check sir", time: "10:10 AM" },
      { from: "tech",   text: "Ok. The white spots could be White Spot Syndrome (WSSV). Please stop feeding immediately and do 30% water exchange. I will visit tomorrow morning.", time: "10:13 AM" },
      { from: "farmer", text: "Ok sir thank you. Should I add medicine?", time: "10:14 AM" },
    ],
    "Suresh Babu": [
      { from: "farmer", text: "Sir feed potteledhu (shrimp not eating feed)", time: "8:20 AM" },
      { from: "tech",   text: "Good morning Suresh. How many days culture now?", time: "9:00 AM" },
      { from: "farmer", text: "15 days sir", time: "9:02 AM" },
    ],
    "Mohan Das": [
      { from: "farmer", text: "Urgently sir! Shrimp are floating on top of water!", time: "9:45 AM" },
      { from: "tech",   text: "Mohan, switch on all aerators immediately! This is low oxygen. How many aerators running?", time: "9:47 AM" },
      { from: "farmer", text: "2 running sir, putting 2 more now", time: "9:48 AM" },
      { from: "tech",   text: "Good. Also do emergency water exchange 20%. I'm coming now.", time: "9:49 AM" },
      { from: "farmer", text: "Thank you sir, shrimp settling now little bit", time: "10:05 AM" },
    ],
  });

  const farmers = [
    { name: "Ravi Kumar",  issue: "White spots on shrimp", unread: 1, time: "10:14 AM", urgent: true },
    { name: "Suresh Babu", issue: "Shrimp not eating", unread: 0, time: "9:02 AM", urgent: false },
    { name: "Mohan Das",   issue: "Shrimp floating – LOW DO", unread: 0, time: "10:05 AM", urgent: true },
  ];

  function sendMsg() {
    if (!msgInput.trim() || !activeFarmer) return;
    setChats(prev => ({
      ...prev,
      [activeFarmer]: [...(prev[activeFarmer]||[]), { from:"tech", text: msgInput.trim(), time: "Now" }]
    }));
    setMsgInput("");
  }

  const quickReplies = [
    "Please check water temperature and DO level",
    "Stop feeding immediately",
    "Do 30% water exchange now",
    "Switch on all aerators",
    "I will visit your farm today",
    "Please send a photo of the pond",
  ];

  if (activeFarmer) {
    const msgs = chats[activeFarmer] || [];
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* chat header */}
        <div style={{ background: "#0d1525", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={() => setActiveFarmer(null)} style={{ background: "transparent", border: "none", color: M.teal, fontSize: 18, cursor: "pointer", padding: 0 }}>←</button>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: M.teal+"22", display:"flex", alignItems:"center", justifyContent:"center", color: M.teal, fontWeight:700, fontSize:12 }}>
            {activeFarmer.split(" ").map(n=>n[0]).join("")}
          </div>
          <div>
            <div style={{ color: M.text, fontWeight: 700, fontSize: 13 }}>{activeFarmer}</div>
            <div style={{ color: M.teal, fontSize: 10 }}>● Online</div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <span style={pill(M.red, M.red)}>🎫 Open Ticket</span>
          </div>
        </div>

        {/* messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: 8, background: M.bg }}>
          <div style={{ textAlign: "center", marginBottom: 4 }}>
            <span style={{ background: M.card2, color: M.sub, fontSize: 10, padding: "3px 10px", borderRadius: 99 }}>Today</span>
          </div>
          {msgs.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.from === "tech" ? "flex-end" : "flex-start" }}>
              {m.from === "farmer" && (
                <div style={{ width:26, height:26, borderRadius:"50%", background:M.blue+"22", display:"flex", alignItems:"center", justifyContent:"center", color:M.blue, fontSize:10, fontWeight:700, flexShrink:0, marginRight:6, alignSelf:"flex-end" }}>
                  {activeFarmer.split(" ").map(n=>n[0]).join("")}
                </div>
              )}
              <div style={{ maxWidth: "72%" }}>
                <div style={{ background: m.from === "tech" ? "linear-gradient(135deg,#00d4aa22,#0099ff22)" : M.card2, border: `1px solid ${m.from==="tech" ? M.teal+"33" : "rgba(255,255,255,0.06)"}`, borderRadius: m.from === "tech" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", padding: "9px 12px" }}>
                  <div style={{ color: M.text, fontSize: 12, lineHeight: 1.5 }}>{m.text}</div>
                </div>
                <div style={{ color: M.sub, fontSize: 9, marginTop: 3, textAlign: m.from === "tech" ? "right" : "left" }}>
                  {m.from === "tech" ? "You" : activeFarmer.split(" ")[0]} • {m.time}
                  {m.from === "tech" && " ✓✓"}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* quick replies */}
        <div style={{ padding: "6px 12px", background: "#0d1525", borderTop: "1px solid rgba(255,255,255,0.04)", overflowX: "auto", display: "flex", gap: 6 }}>
          {quickReplies.map((q, i) => (
            <button key={i} onClick={() => setMsgInput(q)} style={{ flexShrink:0, background: M.teal+"18", color: M.teal, border:"none", borderRadius:99, padding:"5px 10px", fontSize:10, cursor:"pointer", whiteSpace:"nowrap" }}>{q}</button>
          ))}
        </div>

        {/* input */}
        <div style={{ padding: "10px 12px", background: "#0d1525", display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea value={msgInput} onChange={e=>setMsgInput(e.target.value)}
            placeholder="Type advice or instruction..."
            style={{ flex:1, background:"#111827", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"9px 12px", color:M.text, fontSize:12, resize:"none", height:40, fontFamily:"Inter,sans-serif" }}
            onKeyDown={e=>{ if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); sendMsg(); }}}
          />
          <button onClick={sendMsg} style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#00d4aa,#0099ff)", border:"none", cursor:"pointer", fontSize:18, flexShrink:0 }}>➤</button>
        </div>
      </div>
    );
  }

  // farmer list
  return (
    <div style={{ padding: "16px 14px", overflowY: "auto", height: "100%" }}>
      <div style={{ color: M.text, fontWeight: 700, fontSize: 15, marginBottom: 14 }}>💬 Farmer Messages</div>
      {farmers.map((f, i) => (
        <button key={i} onClick={() => setActiveFarmer(f.name)}
          style={{ width:"100%", background: M.card, border: f.urgent ? `1px solid ${M.red}44` : `1px solid ${M.border}`, borderRadius:13, padding:"13px", marginBottom:10, display:"flex", alignItems:"center", gap:12, cursor:"pointer", textAlign:"left" }}>
          <div style={{ position:"relative", flexShrink:0 }}>
            <div style={{ width:42, height:42, borderRadius:"50%", background: f.urgent ? M.red+"22" : M.teal+"22", display:"flex", alignItems:"center", justifyContent:"center", color: f.urgent ? M.red : M.teal, fontWeight:700, fontSize:14 }}>
              {f.name.split(" ").map(n=>n[0]).join("")}
            </div>
            {f.unread > 0 && <div style={{ position:"absolute", top:-3, right:-3, width:16, height:16, borderRadius:"50%", background:M.red, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:9, fontWeight:700 }}>{f.unread}</div>}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
              <span style={{ color:M.text, fontWeight:700, fontSize:13 }}>{f.name}</span>
              <span style={{ color:M.sub, fontSize:10 }}>{f.time}</span>
            </div>
            <div style={{ color: f.urgent ? M.red : M.sub, fontSize:11 }}>
              {f.urgent && "🚨 "}{f.issue}
            </div>
          </div>
        </button>
      ))}

      {/* info box */}
      <div style={{ background: M.card2, borderRadius: 12, padding: 14, marginTop: 6, border: `1px solid ${M.teal}22` }}>
        <div style={{ color: M.teal, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>💡 How Tickets Work</div>
        <div style={{ color: M.sub, fontSize: 11, lineHeight: 1.6 }}>
          1. Farmer raises a <b style={{color:M.text}}>ticket</b> from their app describing the pond issue<br/>
          2. You get a <b style={{color:M.text}}>notification</b> and can see it in Tickets tab<br/>
          3. <b style={{color:M.text}}>Chat here</b> to guide the farmer with immediate steps<br/>
          4. Mark ticket <b style={{color:M.text}}>In Progress</b> → visit farm → <b style={{color:M.text}}>Resolve</b>
        </div>
      </div>
    </div>
  );
}

// ── nav bar ────────────────────────────────────────────────────────────────
const TABS = [
  { id: "home",    icon: "⬡", label: "Home" },
  { id: "visit",   icon: "🌊", label: "Visits" },
  { id: "tickets", icon: "🎫", label: "Tickets" },
  { id: "chat",    icon: "💬", label: "Chat" },
  { id: "orders",  icon: "📦", label: "Orders" },
];

// ── phone frame ────────────────────────────────────────────────────────────
export default function FieldTechMobile() {
  const [screen, setScreen] = useState("home");

  const screens = {
    home:    <HomeScreen go={setScreen} />,
    visit:   <VisitScreen go={setScreen} />,
    tickets: <TicketsScreen go={setScreen} />,
    chat:    <ChatScreen />,
    orders:  <OrdersScreen />,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#060e1f", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "30px 20px", fontFamily: "Inter,sans-serif" }}>
      <div>
        {/* label */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ color: M.teal, fontWeight: 700, fontSize: 16, letterSpacing: 1 }}>📱 Field Technician Mobile App</div>
          <div style={{ color: M.sub, fontSize: 12, marginTop: 4 }}>Interactive UI Mockup</div>
        </div>

        {/* phone shell */}
        <div style={{ width: 360, background: "#111827", borderRadius: 40, boxShadow: "0 30px 80px rgba(0,0,0,0.7), 0 0 0 2px rgba(255,255,255,0.08)", overflow: "hidden", position: "relative" }}>
          {/* notch */}
          <div style={{ background: "#0a0f1e", height: 44, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" }}>
            <div style={{ color: M.sub, fontSize: 11 }}>9:41 AM</div>
            <div style={{ width: 80, height: 16, background: "#0a0f1e", borderRadius: 99, border: "2px solid #1a2235" }} />
            <div style={{ color: M.sub, fontSize: 11 }}>● ● ●</div>
          </div>

          {/* top bar */}
          <div style={{ background: "#0d1525", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#00d4aa,#0099ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🦐</div>
              <div>
                <div style={{ color: M.text, fontSize: 12, fontWeight: 700 }}>AquaNursery</div>
                <div style={{ color: M.teal, fontSize: 9, letterSpacing: 1 }}>FIELD TECH</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: M.amber + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🔔</div>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: M.teal + "22", display: "flex", alignItems: "center", justifyContent: "center", color: M.teal, fontWeight: 700, fontSize: 11 }}>AJ</div>
            </div>
          </div>

          {/* screen content */}
          <div style={{ background: M.bg, height: 580, overflowY: "auto" }}>
            {screens[screen]}
          </div>

          {/* bottom nav */}
          <div style={{ background: "#0d1525", display: "flex", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "6px 0 10px" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setScreen(t.id)}
                style={{ flex: 1, border: "none", background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 0" }}>
                <span style={{ fontSize: 18 }}>{t.icon}</span>
                <span style={{ fontSize: 9, color: screen === t.id ? M.teal : M.sub, fontWeight: screen === t.id ? 700 : 400 }}>{t.label}</span>
                {screen === t.id && <div style={{ width: 4, height: 4, borderRadius: "50%", background: M.teal }} />}
              </button>
            ))}
          </div>
        </div>

        {/* instructions */}
        <div style={{ marginTop: 16, textAlign: "center", color: M.sub, fontSize: 12 }}>
          Click the bottom tabs to explore all screens
        </div>
      </div>
    </div>
  );
}
