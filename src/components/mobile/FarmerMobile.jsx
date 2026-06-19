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
  orange: "#f97316",
  text:   "#e8f0fe",
  sub:    "#6b8aaa",
  border: "rgba(255,255,255,0.07)",
};

const pill = (bg, color, extra={}) => ({
  background: bg + "22", color, fontSize: 10, fontWeight: 700,
  padding: "3px 10px", borderRadius: 99, display: "inline-block", ...extra,
});

const btn = (bg, color = "#000") => ({
  background: bg, color, border: "none", borderRadius: 11,
  padding: "11px 0", fontWeight: 700, fontSize: 13,
  cursor: "pointer", width: "100%", marginTop: 8,
});

const inp = {
  background: "#0d1525", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 9, padding: "9px 12px", color: M.text,
  fontSize: 13, width: "100%", boxSizing: "border-box", marginTop: 4,
};

const lbl = { color: M.sub, fontSize: 11, marginTop: 10, display: "block" };

// ─────────────────────────────────────────────────────────────────────────────
// HOME SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function HomeScreen({ go }) {
  const ponds = [
    { name: "Pond 1", doc: 18, status: "active", temp: 28, do: 6.2, alert: null },
    { name: "Pond 2", doc: 32, status: "harvest-ready", temp: 29, do: 5.8, alert: "Harvest Ready!" },
    { name: "Pond 3", doc: 7,  status: "active", temp: 27, do: 7.1, alert: null },
  ];
  const alerts = [
    { icon: "🚨", text: "Pond 2 is harvest-ready (D32)", color: M.amber, action: "tickets" },
    { icon: "💬", text: "Technician replied to your ticket", color: M.blue, action: "chat" },
    { icon: "📦", text: "Feed order dispatched – arrives tomorrow", color: M.teal, action: "orders" },
  ];

  return (
    <div style={{ padding: "16px 14px", overflowY: "auto", height: "100%" }}>
      {/* greeting */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: M.sub, fontSize: 12 }}>Welcome back 🌾</div>
        <div style={{ color: M.text, fontWeight: 700, fontSize: 18 }}>Ravi Kumar</div>
        <div style={{ color: M.sub, fontSize: 11, marginTop: 2 }}>Nellore Farm • Tuesday, 10 Jun 2026</div>
      </div>

      {/* summary strip */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 7, marginBottom: 16 }}>
        {[["Ponds", "3", M.teal, "🏊"],["Active", "2", M.blue, "📡"],["Ready", "1", M.amber, "✅"],["Alerts", "3", M.red, "🔔"]].map(([l,v,c,ic])=>(
          <div key={l} style={{ background: M.card2, borderRadius: 11, padding: "10px 6px", textAlign: "center" }}>
            <div style={{ fontSize: 14 }}>{ic}</div>
            <div style={{ color: c, fontWeight: 700, fontSize: 18 }}>{v}</div>
            <div style={{ color: M.sub, fontSize: 9 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* alerts */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: M.sub, fontSize: 11, fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>🔔 ALERTS</div>
        {alerts.map((a, i) => (
          <button key={i} onClick={() => go(a.action)}
            style={{ width: "100%", background: M.card, border: `1px solid ${a.color}33`, borderRadius: 11, padding: "10px 12px", marginBottom: 7, display: "flex", alignItems: "center", gap: 10, cursor: "pointer", textAlign: "left" }}>
            <span style={{ fontSize: 18 }}>{a.icon}</span>
            <div style={{ flex: 1, color: M.text, fontSize: 12 }}>{a.text}</div>
            <span style={{ color: a.color, fontSize: 16 }}>›</span>
          </button>
        ))}
      </div>

      {/* pond cards */}
      <div style={{ color: M.sub, fontSize: 11, fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>🏊 MY PONDS</div>
      {ponds.map((p, i) => {
        const sc = p.status === "harvest-ready" ? M.amber : M.teal;
        return (
          <button key={i} onClick={() => go("ponds")}
            style={{ width: "100%", background: M.card, borderRadius: 13, padding: "13px", marginBottom: 9, borderLeft: `3px solid ${sc}`, cursor: "pointer", textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
              <span style={{ color: M.text, fontWeight: 700, fontSize: 13 }}>{p.name}</span>
              <span style={pill(sc, sc)}>D{p.doc} • {p.status}</span>
            </div>
            {p.alert && <div style={{ background: M.amber+"18", color: M.amber, fontSize: 11, borderRadius: 8, padding: "5px 10px", marginBottom: 7, fontWeight: 600 }}>⚠️ {p.alert}</div>}
            <div style={{ display: "flex", gap: 16 }}>
              <span style={{ color: M.sub, fontSize: 11 }}>🌡 <b style={{color:M.text}}>{p.temp}°C</b></span>
              <span style={{ color: M.sub, fontSize: 11 }}>O₂ <b style={{color: p.do < 6 ? M.amber : M.teal}}>{p.do} mg/L</b></span>
            </div>
          </button>
        );
      })}

      {/* quick actions */}
      <div style={{ color: M.sub, fontSize: 11, fontWeight: 600, letterSpacing: 1, margin: "14px 0 8px" }}>QUICK ACTIONS</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
        {[
          { icon: "🎫", label: "Report Issue", sub: "Raise a ticket", screen: "tickets", color: M.red },
          { icon: "💬", label: "Ask Technician", sub: "Chat support", screen: "chat", color: M.blue },
          { icon: "📦", label: "Order Feed", sub: "Place order", screen: "orders", color: M.amber },
          { icon: "💧", label: "Log Water", sub: "Daily update", screen: "waterlog", color: M.teal },
        ].map(a => (
          <button key={a.screen} onClick={() => go(a.screen)}
            style={{ background: M.card2, border: `1px solid ${a.color}22`, borderRadius: 13, padding: "13px", cursor: "pointer", textAlign: "left" }}>
            <div style={{ fontSize: 22, marginBottom: 5 }}>{a.icon}</div>
            <div style={{ color: M.text, fontWeight: 700, fontSize: 12 }}>{a.label}</div>
            <div style={{ color: M.sub, fontSize: 10, marginTop: 2 }}>{a.sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PONDS SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function PondsScreen({ go }) {
  const [selected, setSelected] = useState(null);
  const ponds = [
    { name: "Pond 1", size: "1 acre", doc: 18, stocked: "5 Lakhs PL-12", temp: 28.5, doV: 6.2, ph: 7.9, sal: 22, amm: 0.1, status: "active", sr: 88, feed: "Grow-out 2mm", lastVisit: "8 Jun" },
    { name: "Pond 2", size: "1.5 acres", doc: 32, stocked: "8 Lakhs PL-12", temp: 29.1, doV: 5.8, ph: 8.1, sal: 24, amm: 0.2, status: "harvest-ready", sr: 82, feed: "Grower 3mm", lastVisit: "9 Jun" },
    { name: "Pond 3", size: "0.8 acres", doc: 7,  stocked: "3 Lakhs PL-10", temp: 27.4, doV: 7.1, ph: 7.8, sal: 20, amm: 0.05, status: "active", sr: 95, feed: "Starter 0.8mm", lastVisit: "7 Jun" },
  ];

  const param = (label, val, unit, ok) => (
    <div style={{ background: M.card2, borderRadius: 9, padding: "9px 10px" }}>
      <div style={{ color: M.sub, fontSize: 10 }}>{label}</div>
      <div style={{ color: ok ? M.teal : M.amber, fontWeight: 700, fontSize: 13, marginTop: 2 }}>{val}{unit}</div>
    </div>
  );

  if (selected) {
    const p = selected;
    const sc = p.status === "harvest-ready" ? M.amber : M.teal;
    return (
      <div style={{ padding: "16px 14px", overflowY: "auto", height: "100%" }}>
        <button onClick={() => setSelected(null)} style={{ background:"transparent", border:"none", color:M.teal, fontSize:18, cursor:"pointer", marginBottom:12 }}>← Back</button>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
          <div>
            <div style={{ color:M.text, fontWeight:700, fontSize:18 }}>{p.name}</div>
            <div style={{ color:M.sub, fontSize:11 }}>{p.size} • {p.stocked}</div>
          </div>
          <span style={pill(sc, sc, { fontSize:12, padding:"4px 12px" })}>Day {p.doc}</span>
        </div>

        {p.status === "harvest-ready" && (
          <div style={{ background:M.amber+"18", border:`1px solid ${M.amber}44`, borderRadius:12, padding:"12px 14px", marginBottom:14 }}>
            <div style={{ color:M.amber, fontWeight:700, fontSize:13 }}>🎉 Harvest Ready!</div>
            <div style={{ color:"#d1913c", fontSize:11, marginTop:4 }}>Your shrimp are ready to harvest. Contact your technician to schedule the harvest date.</div>
            <button onClick={()=>go("chat")} style={{ ...btn(`linear-gradient(135deg,${M.amber},${M.orange})`, "#000"), marginTop:8, padding:"8px 0", fontSize:12 }}>📞 Contact Technician</button>
          </div>
        )}

        <div style={{ color:M.sub, fontSize:11, fontWeight:600, letterSpacing:1, marginBottom:8 }}>WATER PARAMETERS</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
          {param("Temperature", p.temp, "°C", p.temp>=27&&p.temp<=31)}
          {param("Dissolved O₂", p.doV, " mg/L", p.doV>=6)}
          {param("pH", p.ph, "", p.ph>=7.8&&p.ph<=8.3)}
          {param("Salinity", p.sal, " ppt", p.sal>=18&&p.sal<=28)}
          {param("Ammonia", p.amm, " ppm", p.amm<=0.1)}
          {param("Survival Rate", p.sr, "%", p.sr>=80)}
        </div>

        <div style={{ color:M.sub, fontSize:11, fontWeight:600, letterSpacing:1, marginBottom:8 }}>CULTURE INFO</div>
        <div style={{ background:M.card, borderRadius:12, padding:14, marginBottom:14 }}>
          {[["Current Feed", p.feed],["Last Tech Visit", p.lastVisit],["Culture Status", p.status],["Days on Culture", "D"+p.doc]].map(([l,v])=>(
            <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ color:M.sub, fontSize:12 }}>{l}</span>
              <span style={{ color:M.text, fontSize:12, fontWeight:600 }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          <button onClick={()=>go("waterlog")} style={{ ...btn(M.teal+"22", M.teal), fontSize:12, padding:"9px 0" }}>💧 Log Water</button>
          <button onClick={()=>go("tickets")} style={{ ...btn(M.red+"22", M.red), fontSize:12, padding:"9px 0" }}>🎫 Report Issue</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding:"16px 14px", overflowY:"auto", height:"100%" }}>
      <div style={{ color:M.text, fontWeight:700, fontSize:15, marginBottom:14 }}>🏊 My Ponds</div>
      {ponds.map((p, i) => {
        const sc = p.status==="harvest-ready" ? M.amber : M.teal;
        return (
          <button key={i} onClick={()=>setSelected(p)}
            style={{ width:"100%", background:M.card, borderRadius:14, padding:"14px", marginBottom:10, borderLeft:`3px solid ${sc}`, cursor:"pointer", textAlign:"left" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <div>
                <div style={{ color:M.text, fontWeight:700, fontSize:14 }}>{p.name}</div>
                <div style={{ color:M.sub, fontSize:11 }}>{p.size} • {p.stocked}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ color:sc, fontWeight:700, fontSize:18 }}>D{p.doc}</div>
                <div style={{ color:M.sub, fontSize:9 }}>Days</div>
              </div>
            </div>
            {p.status==="harvest-ready" && <div style={{ background:M.amber+"18", color:M.amber, fontSize:10, borderRadius:7, padding:"4px 9px", marginBottom:8, fontWeight:600, display:"inline-block" }}>🎉 Harvest Ready</div>}
            <div style={{ display:"flex", gap:14 }}>
              <span style={{ color:M.sub, fontSize:11 }}>🌡 <b style={{color:M.text}}>{p.temp}°C</b></span>
              <span style={{ color:M.sub, fontSize:11 }}>O₂ <b style={{color: p.doV<6?M.amber:M.teal}}>{p.doV}</b></span>
              <span style={{ color:M.sub, fontSize:11 }}>SR <b style={{color:M.green}}>{p.sr}%</b></span>
            </div>
          </button>
        );
      })}

      <button onClick={()=>go("waterlog")} style={btn("linear-gradient(135deg,#00d4aa,#0099ff)")}>💧 Log Today's Water Reading</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WATER LOG SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function WaterLogScreen({ go }) {
  const [submitted, setSubmitted] = useState(false);
  if (submitted) return (
    <div style={{ padding:"60px 30px", textAlign:"center" }}>
      <div style={{ fontSize:60, marginBottom:16 }}>✅</div>
      <div style={{ color:M.teal, fontWeight:700, fontSize:18, marginBottom:8 }}>Reading Submitted!</div>
      <div style={{ color:M.sub, fontSize:13, marginBottom:24 }}>Your technician has been notified. They will check and advise if any action needed.</div>
      <button onClick={()=>{setSubmitted(false);go("home");}} style={btn("linear-gradient(135deg,#00d4aa,#0099ff)")}>Back to Home</button>
    </div>
  );
  return (
    <div style={{ padding:"16px 14px", overflowY:"auto", height:"100%" }}>
      <div style={{ color:M.text, fontWeight:700, fontSize:15, marginBottom:4 }}>💧 Daily Water Log</div>
      <div style={{ color:M.sub, fontSize:11, marginBottom:14 }}>Fill readings every morning to keep your technician updated</div>

      <div style={{ background:M.card, borderRadius:14, padding:16, marginBottom:12 }}>
        <div style={{ color:M.text, fontWeight:700, marginBottom:10 }}>Select Pond</div>
        <select style={inp}>
          <option>Pond 1</option><option>Pond 2</option><option>Pond 3</option>
        </select>
        <label style={lbl}>Date & Time</label>
        <input style={inp} type="datetime-local" defaultValue="2026-06-10T07:00" />
      </div>

      <div style={{ background:M.card, borderRadius:14, padding:16, marginBottom:12 }}>
        <div style={{ color:M.text, fontWeight:700, marginBottom:10 }}>Water Parameters</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
          {[["Temperature (°C)","27-31 normal"],["DO mg/L","above 6 good"],["pH","7.8-8.3 good"],["Salinity ppt","18-28 normal"],["Ammonia ppm","below 0.1 safe"],["Transparency cm","30-40 good"]].map(([l,hint])=>(
            <div key={l}>
              <label style={lbl}>{l}</label>
              <input style={inp} type="number" step="0.1" placeholder="0.0"/>
              <div style={{ color:M.sub, fontSize:9, marginTop:2 }}>{hint}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background:M.card, borderRadius:14, padding:16, marginBottom:12 }}>
        <div style={{ color:M.text, fontWeight:700, marginBottom:10 }}>Observations</div>
        <label style={lbl}>Pond Condition</label>
        <select style={inp}>
          <option>Good – Normal</option>
          <option>Fair – Some concern</option>
          <option>Poor – Need help</option>
          <option>Critical – Emergency</option>
        </select>
        <label style={lbl}>Any issues or observations?</label>
        <textarea style={{...inp, height:70, resize:"none"}} placeholder="e.g. shrimp jumping, water colour change, dead shrimp..."/>
      </div>

      <button onClick={()=>setSubmitted(true)} style={btn("linear-gradient(135deg,#00d4aa,#0099ff)")}>📤 Submit Water Reading</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TICKETS SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function TicketsScreen({ go }) {
  const [view, setView] = useState("list"); // list | new | success
  const [priority, setPriority] = useState("medium");

  const myTickets = [
    { id:"TK-001", issue:"White spots on shrimp", pond:"Pond 2", status:"in-progress", priority:"high", tech:"Arjun (Field Tech)", reply:"Stop feeding and do 30% water exchange. I'm visiting tomorrow.", time:"30 min ago" },
    { id:"TK-003", issue:"Feed not being consumed", pond:"Pond 1", status:"open", priority:"medium", tech:null, reply:null, time:"2 hrs ago" },
    { id:"TK-005", issue:"Green water colour", pond:"Pond 3", status:"resolved", priority:"low", tech:"Arjun (Field Tech)", reply:"Algae bloom. Water exchange done. Normal now.", time:"2 days ago" },
  ];

  const issues = ["Shrimp white spots / disease","Shrimp not eating feed","Shrimp floating on surface","Water colour change","Low oxygen / shrimp gasping","Sudden shrimp death","Pond foam / bubbles","Feed order needed","Medicine needed","Other issue"];
  const pc = p => p==="high"?M.red:p==="medium"?M.amber:M.teal;
  const sc = s => s==="resolved"?M.teal:s==="in-progress"?M.blue:M.amber;

  if (view==="success") return (
    <div style={{ padding:"60px 24px", textAlign:"center" }}>
      <div style={{ fontSize:56, marginBottom:12 }}>🎫</div>
      <div style={{ color:M.teal, fontWeight:700, fontSize:18, marginBottom:8 }}>Ticket Raised!</div>
      <div style={{ color:M.sub, fontSize:13, marginBottom:6 }}>Your technician has been notified.</div>
      <div style={{ color:M.sub, fontSize:12, marginBottom:24 }}>You will receive a reply soon. For emergencies, use Chat directly.</div>
      <button onClick={()=>setView("list")} style={btn("linear-gradient(135deg,#00d4aa,#0099ff)")}>View My Tickets</button>
      <button onClick={()=>go("chat")} style={{ ...btn(M.blue+"22", M.blue), marginTop:0 }}>💬 Open Chat</button>
    </div>
  );

  if (view==="new") return (
    <div style={{ padding:"16px 14px", overflowY:"auto", height:"100%" }}>
      <button onClick={()=>setView("list")} style={{ background:"transparent", border:"none", color:M.teal, fontSize:18, cursor:"pointer", marginBottom:12 }}>← Back</button>
      <div style={{ color:M.text, fontWeight:700, fontSize:15, marginBottom:4 }}>🎫 Raise a Ticket</div>
      <div style={{ color:M.sub, fontSize:11, marginBottom:14 }}>Tell us what's wrong — our technician will guide you immediately</div>

      <div style={{ background:M.card, borderRadius:14, padding:16, marginBottom:10 }}>
        <label style={lbl}>Select Pond</label>
        <select style={inp}><option>Pond 1</option><option>Pond 2</option><option>Pond 3</option></select>
        <label style={lbl}>What is the issue?</label>
        <select style={inp}>
          {issues.map(i=><option key={i}>{i}</option>)}
        </select>
        <label style={lbl}>Describe in your own words</label>
        <textarea style={{...inp, height:80, resize:"none"}} placeholder="Tell us what you see in the pond... (in any language)"/>
      </div>

      <div style={{ background:M.card, borderRadius:14, padding:16, marginBottom:10 }}>
        <div style={{ color:M.text, fontWeight:700, marginBottom:10 }}>How serious is it?</div>
        <div style={{ display:"flex", gap:8 }}>
          {[["low","Low – Can wait","🟢"],["medium","Medium – Today","🟡"],["high","High – Emergency","🔴"]].map(([k,lb,ic])=>(
            <button key={k} onClick={()=>setPriority(k)}
              style={{ flex:1, background: priority===k ? pc(k)+"33" : M.card2, border:`1px solid ${priority===k?pc(k):"transparent"}`, borderRadius:10, padding:"10px 4px", cursor:"pointer", textAlign:"center" }}>
              <div style={{ fontSize:18 }}>{ic}</div>
              <div style={{ color:priority===k?pc(k):M.sub, fontSize:9, fontWeight:priority===k?700:400, marginTop:3 }}>{lb}</div>
            </button>
          ))}
        </div>
      </div>

      {priority==="high" && (
        <div style={{ background:M.red+"18", border:`1px solid ${M.red}44`, borderRadius:12, padding:"10px 14px", marginBottom:10 }}>
          <div style={{ color:M.red, fontWeight:700, fontSize:12 }}>🚨 Emergency Steps While You Wait:</div>
          <div style={{ color:"#fca5a5", fontSize:11, marginTop:6, lineHeight:1.7 }}>
            1. Switch ON all aerators<br/>
            2. Stop feeding immediately<br/>
            3. Do not add chemicals without advice<br/>
            4. Call your technician directly
          </div>
        </div>
      )}

      <button onClick={()=>setView("success")} style={btn("linear-gradient(135deg,#ef4444,#f59e0b)", "#fff")}>🎫 Submit Ticket</button>
    </div>
  );

  return (
    <div style={{ padding:"16px 14px", overflowY:"auto", height:"100%" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ color:M.text, fontWeight:700, fontSize:15 }}>🎫 My Tickets</div>
        <button onClick={()=>setView("new")} style={{ background:"linear-gradient(135deg,#ef4444,#f59e0b)", color:"#fff", border:"none", borderRadius:9, padding:"7px 14px", fontSize:11, fontWeight:700, cursor:"pointer" }}>+ New Ticket</button>
      </div>

      {myTickets.map(t=>(
        <div key={t.id} style={{ background:M.card, borderRadius:13, padding:"14px", marginBottom:10, borderLeft:`3px solid ${pc(t.priority)}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <span style={{ color:M.sub, fontSize:10 }}>{t.id} • {t.time}</span>
            <span style={pill(sc(t.status), sc(t.status))}>{t.status}</span>
          </div>
          <div style={{ color:M.text, fontWeight:700, fontSize:13, marginBottom:3 }}>{t.issue}</div>
          <div style={{ color:M.sub, fontSize:11, marginBottom:t.reply?10:0 }}>🏊 {t.pond}</div>
          {t.reply && (
            <div style={{ background:M.blue+"18", border:`1px solid ${M.blue}33`, borderRadius:9, padding:"9px 11px" }}>
              <div style={{ color:M.blue, fontSize:10, fontWeight:700, marginBottom:3 }}>💬 {t.tech} replied:</div>
              <div style={{ color:M.text, fontSize:11, lineHeight:1.5 }}>{t.reply}</div>
            </div>
          )}
          {t.status!=="resolved" && (
            <button onClick={()=>go("chat")} style={{ ...btn(M.blue+"22", M.blue), padding:"7px 0", fontSize:11, marginTop:8 }}>💬 Continue in Chat</button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDERS SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function OrdersScreen() {
  const [tab, setTab] = useState("new");
  const [type, setType] = useState("feed");
  const [placed, setPlaced] = useState(false);

  const myOrders = [
    { id:"ORD-041", item:"Grow-out Feed 2mm – 200kg", total:"₹18,000", status:"dispatched", date:"Arriving Tomorrow", type:"Feed" },
    { id:"ORD-038", item:"Probiotics 1kg – 5 packs", total:"₹3,500", status:"delivered", date:"Delivered 8 Jun", type:"Medicine" },
    { id:"ORD-035", item:"PL-12 Vannamei – 3 Lakhs", total:"₹15,000", status:"confirmed", date:"Delivery 12 Jun", type:"Seed" },
  ];
  const catalog = {
    feed: [
      { name:"Starter Feed 0.8mm", unit:"kg", price:85, desc:"PL1–PL10 stage" },
      { name:"Grower Feed 2mm",    unit:"kg", price:92, desc:"PL10–PL20 stage" },
      { name:"Finisher Feed 3mm",  unit:"kg", price:88, desc:"Harvest stage" },
    ],
    medicine: [
      { name:"Probiotics 1kg",     unit:"pack", price:700, desc:"Gut health" },
      { name:"Mineral Mix 5kg",    unit:"bag",  price:1200, desc:"Moulting support" },
      { name:"Water Conditioner",  unit:"litre",price:450, desc:"pH balance" },
    ],
    seed: [
      { name:"Vannamei PL-10",     unit:"lakh", price:4500, desc:"High quality seed" },
      { name:"Vannamei PL-12",     unit:"lakh", price:5000, desc:"Premium seed" },
    ],
  };
  const sc = s => s==="delivered"?M.teal:s==="dispatched"?M.blue:s==="confirmed"?M.green:M.amber;

  if (placed) return (
    <div style={{ padding:"60px 24px", textAlign:"center" }}>
      <div style={{ fontSize:60, marginBottom:12 }}>📦</div>
      <div style={{ color:M.teal, fontWeight:700, fontSize:18, marginBottom:8 }}>Order Placed!</div>
      <div style={{ color:M.sub, fontSize:13, marginBottom:24 }}>Your order has been sent to the company. You'll get a confirmation soon.</div>
      <button onClick={()=>setPlaced(false)} style={btn("linear-gradient(135deg,#00d4aa,#0099ff)")}>View My Orders</button>
    </div>
  );

  return (
    <div style={{ padding:"16px 14px", overflowY:"auto", height:"100%" }}>
      <div style={{ display:"flex", gap:6, marginBottom:14 }}>
        {[["new","New Order"],["track","My Orders"]].map(([k,lb])=>(
          <button key={k} onClick={()=>setTab(k)} style={{ flex:1, padding:"8px", borderRadius:9, border:"none", background:tab===k?"linear-gradient(135deg,#00d4aa,#0099ff)":M.card2, color:tab===k?"#000":M.sub, fontWeight:700, fontSize:12, cursor:"pointer" }}>{lb}</button>
        ))}
      </div>

      {tab==="track" ? (
        myOrders.map(o=>(
          <div key={o.id} style={{ background:M.card, borderRadius:13, padding:"13px", marginBottom:10, borderLeft:`3px solid ${sc(o.status)}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
              <span style={{ color:M.sub, fontSize:10 }}>{o.id}</span>
              <span style={pill(sc(o.status), sc(o.status))}>{o.status}</span>
            </div>
            <div style={{ color:M.text, fontWeight:700, fontSize:12, marginBottom:3 }}>{o.item}</div>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span style={{ color:M.teal, fontWeight:700, fontSize:13 }}>{o.total}</span>
              <span style={{ color:M.sub, fontSize:10 }}>📅 {o.date}</span>
            </div>
            {o.status==="dispatched" && (
              <div style={{ background:M.blue+"18", borderRadius:8, padding:"7px 10px", marginTop:8, color:M.blue, fontSize:11, fontWeight:600 }}>🚚 Your order is on the way!</div>
            )}
          </div>
        ))
      ) : (
        <>
          {/* type selector */}
          <div style={{ display:"flex", gap:7, marginBottom:14 }}>
            {[["feed","🌾 Feed"],["medicine","💊 Medicine"],["seed","🦐 Seed/PL"]].map(([k,lb])=>(
              <button key={k} onClick={()=>setType(k)} style={{ flex:1, padding:"8px 4px", borderRadius:9, border:"none", background:type===k?(k==="feed"?M.amber:k==="medicine"?M.purple:M.teal)+"33":M.card2, color:type===k?(k==="feed"?M.amber:k==="medicine"?M.purple:M.teal):M.sub, fontWeight:700, fontSize:10, cursor:"pointer" }}>{lb}</button>
            ))}
          </div>

          {/* catalog */}
          {catalog[type].map((item,i)=>(
            <div key={i} style={{ background:M.card, borderRadius:12, padding:"13px", marginBottom:9 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <div style={{ color:M.text, fontWeight:700, fontSize:12 }}>{item.name}</div>
                <div style={{ color:M.teal, fontWeight:700, fontSize:13 }}>₹{item.price.toLocaleString("en-IN")}/{item.unit}</div>
              </div>
              <div style={{ color:M.sub, fontSize:10, marginBottom:8 }}>{item.desc}</div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <input style={{...inp, marginTop:0, flex:1}} type="number" placeholder={`Qty (${item.unit}s)`}/>
                <button onClick={()=>setPlaced(true)} style={{ background:"linear-gradient(135deg,#00d4aa,#0099ff)", color:"#000", border:"none", borderRadius:9, padding:"9px 14px", fontWeight:700, fontSize:12, cursor:"pointer", flexShrink:0 }}>Order</button>
              </div>
            </div>
          ))}

          <div style={{ background:M.card2, borderRadius:12, padding:"13px", border:`1px solid ${M.teal}22` }}>
            <div style={{ color:M.teal, fontSize:11, fontWeight:700, marginBottom:4 }}>💡 Custom Order?</div>
            <div style={{ color:M.sub, fontSize:11, marginBottom:8 }}>Need something not listed? Chat with your technician or raise a ticket.</div>
            <textarea style={{...inp, height:60, resize:"none"}} placeholder="Describe what you need..."/>
            <button onClick={()=>setPlaced(true)} style={{ ...btn(M.blue+"22", M.blue), padding:"8px 0", fontSize:12 }}>📤 Send Request</button>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAT SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function ChatScreen() {
  const [msgInput, setMsgInput] = useState("");
  const [msgs, setMsgs] = useState([
    { from:"tech",   text:"Good morning Ravi! How are the ponds today?", time:"8:00 AM" },
    { from:"farmer", text:"Good morning sir. Pond 2 water colour little green looking", time:"8:05 AM" },
    { from:"tech",   text:"That could be algae growth. What is the temperature and DO reading?", time:"8:07 AM" },
    { from:"farmer", text:"Temp 29 sir. DO I checked 5.8", time:"8:10 AM" },
    { from:"tech",   text:"DO is slightly low. Please switch on 2 extra aerators. I will visit Pond 2 today at 11 AM. Meanwhile stop feeding for now.", time:"8:12 AM" },
    { from:"farmer", text:"Ok sir, aerators put on. Thank you", time:"8:14 AM" },
  ]);

  const quickMsgs = ["Water looks good sir","Shrimp are active","Feed is done","Something is wrong","Please visit today","Harvest when?"];

  function send(text) {
    const t = text || msgInput.trim();
    if (!t) return;
    setMsgs(p => [...p, { from:"farmer", text:t, time:"Now" }]);
    setMsgInput("");
    // auto reply after delay (mockup)
    setTimeout(()=>{
      setMsgs(p => [...p, { from:"tech", text:"Got it Ravi! I will check and advise you shortly. 👍", time:"Now" }]);
    }, 800);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      {/* header */}
      <div style={{ background:"#0d1525", padding:"10px 14px", display:"flex", alignItems:"center", gap:10, borderBottom:"1px solid rgba(255,255,255,0.06)", flexShrink:0 }}>
        <div style={{ width:38, height:38, borderRadius:"50%", background:"linear-gradient(135deg,#00d4aa,#0099ff)", display:"flex", alignItems:"center", justifyContent:"center", color:"#000", fontWeight:700, fontSize:13 }}>AJ</div>
        <div style={{ flex:1 }}>
          <div style={{ color:M.text, fontWeight:700, fontSize:13 }}>Arjun — Field Technician</div>
          <div style={{ color:M.teal, fontSize:10 }}>● Online • Your assigned technician</div>
        </div>
        <div style={{ background:M.teal+"22", color:M.teal, borderRadius:8, padding:"4px 10px", fontSize:10, fontWeight:700 }}>📞 Call</div>
      </div>

      {/* info bar */}
      <div style={{ background:M.card2, padding:"8px 14px", display:"flex", gap:12, borderBottom:"1px solid rgba(255,255,255,0.04)", flexShrink:0 }}>
        <span style={{ color:M.sub, fontSize:10 }}>Open tickets: <b style={{color:M.red}}>1</b></span>
        <span style={{ color:M.sub, fontSize:10 }}>Next visit: <b style={{color:M.teal}}>Today 11 AM</b></span>
      </div>

      {/* messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"14px", display:"flex", flexDirection:"column", gap:9, background:M.bg }}>
        <div style={{ textAlign:"center", marginBottom:4 }}>
          <span style={{ background:M.card2, color:M.sub, fontSize:10, padding:"3px 12px", borderRadius:99 }}>Today — 10 Jun 2026</span>
        </div>
        {msgs.map((m, i) => (
          <div key={i} style={{ display:"flex", justifyContent:m.from==="farmer"?"flex-end":"flex-start", gap:8, alignItems:"flex-end" }}>
            {m.from==="tech" && (
              <div style={{ width:26, height:26, borderRadius:"50%", background:"linear-gradient(135deg,#00d4aa,#0099ff)", display:"flex", alignItems:"center", justifyContent:"center", color:"#000", fontWeight:700, fontSize:10, flexShrink:0 }}>AJ</div>
            )}
            <div style={{ maxWidth:"75%" }}>
              <div style={{ background:m.from==="farmer"?"linear-gradient(135deg,#0099ff33,#00d4aa22)":M.card2, border:`1px solid ${m.from==="farmer"?M.blue+"44":"rgba(255,255,255,0.06)"}`, borderRadius:m.from==="farmer"?"14px 14px 4px 14px":"14px 14px 14px 4px", padding:"9px 12px" }}>
                <div style={{ color:M.text, fontSize:12, lineHeight:1.5 }}>{m.text}</div>
              </div>
              <div style={{ color:M.sub, fontSize:9, marginTop:3, textAlign:m.from==="farmer"?"right":"left" }}>
                {m.from==="farmer"?"You":"Technician"} • {m.time} {m.from==="farmer"&&"✓✓"}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* quick messages */}
      <div style={{ padding:"6px 10px", background:"#0d1525", borderTop:"1px solid rgba(255,255,255,0.04)", overflowX:"auto", display:"flex", gap:6, flexShrink:0 }}>
        {quickMsgs.map((q,i)=>(
          <button key={i} onClick={()=>send(q)} style={{ flexShrink:0, background:M.teal+"18", color:M.teal, border:"none", borderRadius:99, padding:"5px 10px", fontSize:10, cursor:"pointer", whiteSpace:"nowrap" }}>{q}</button>
        ))}
      </div>

      {/* input */}
      <div style={{ padding:"10px 12px", background:"#0d1525", display:"flex", gap:8, alignItems:"flex-end", flexShrink:0 }}>
        <textarea value={msgInput} onChange={e=>setMsgInput(e.target.value)}
          placeholder="Message your technician..."
          style={{ flex:1, background:"#111827", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"9px 12px", color:M.text, fontSize:12, resize:"none", height:40, fontFamily:"Inter,sans-serif" }}
          onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
        />
        <button onClick={()=>send()} style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#00d4aa,#0099ff)", border:"none", cursor:"pointer", fontSize:18, flexShrink:0 }}>➤</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NAV TABS
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { id:"home",     icon:"🏠", label:"Home" },
  { id:"ponds",    icon:"🏊", label:"Ponds" },
  { id:"tickets",  icon:"🎫", label:"Issues" },
  { id:"chat",     icon:"💬", label:"Chat" },
  { id:"orders",   icon:"📦", label:"Orders" },
];

// ─────────────────────────────────────────────────────────────────────────────
// PHONE FRAME
// ─────────────────────────────────────────────────────────────────────────────
export default function FarmerMobile() {
  const [screen, setScreen] = useState("home");

  const go = s => setScreen(s);

  const screens = {
    home:     <HomeScreen go={go} />,
    ponds:    <PondsScreen go={go} />,
    waterlog: <WaterLogScreen go={go} />,
    tickets:  <TicketsScreen go={go} />,
    chat:     <ChatScreen />,
    orders:   <OrdersScreen />,
  };

  const notif = { tickets: 1, chat: 1 };

  return (
    <div style={{ minHeight:"100vh", background:"#060e1f", display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"30px 20px", fontFamily:"Inter,sans-serif", gap: 40 }}>

      {/* left — farmer phone */}
      <div>
        <div style={{ textAlign:"center", marginBottom:16 }}>
          <div style={{ color:M.teal, fontWeight:700, fontSize:16, letterSpacing:1 }}>📱 Farmer Mobile App</div>
          <div style={{ color:M.sub, fontSize:12, marginTop:4 }}>What farmers see on their phone</div>
        </div>

        <div style={{ width:360, background:"#111827", borderRadius:40, boxShadow:"0 30px 80px rgba(0,0,0,0.7), 0 0 0 2px rgba(255,255,255,0.08)", overflow:"hidden" }}>
          {/* status bar */}
          <div style={{ background:"#0a0f1e", height:44, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px" }}>
            <div style={{ color:M.sub, fontSize:11 }}>9:41 AM</div>
            <div style={{ width:80, height:16, background:"#0a0f1e", borderRadius:99, border:"2px solid #1a2235" }}/>
            <div style={{ color:M.sub, fontSize:11 }}>📶 🔋</div>
          </div>

          {/* app top bar */}
          <div style={{ background:"#0d1525", padding:"10px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,#00d4aa,#0099ff)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>🦐</div>
              <div>
                <div style={{ color:M.text, fontSize:12, fontWeight:700 }}>AquaNursery</div>
                <div style={{ color:M.green, fontSize:9, letterSpacing:1 }}>FARMER APP</div>
              </div>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <div style={{ position:"relative" }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background:M.amber+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>🔔</div>
                <div style={{ position:"absolute", top:-3, right:-3, width:14, height:14, borderRadius:"50%", background:M.red, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:8, fontWeight:700 }}>2</div>
              </div>
              <div style={{ width:28, height:28, borderRadius:"50%", background:M.green+"22", display:"flex", alignItems:"center", justifyContent:"center", color:M.green, fontWeight:700, fontSize:11 }}>RK</div>
            </div>
          </div>

          {/* screen */}
          <div style={{ background:M.bg, height:580, overflow:"hidden", display:"flex", flexDirection:"column" }}>
            {screens[screen] || screens.home}
          </div>

          {/* bottom nav */}
          <div style={{ background:"#0d1525", display:"flex", borderTop:"1px solid rgba(255,255,255,0.06)", padding:"6px 0 10px" }}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setScreen(t.id)}
                style={{ flex:1, border:"none", background:"transparent", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:"4px 0", position:"relative" }}>
                <span style={{ fontSize:18 }}>{t.icon}</span>
                <span style={{ fontSize:9, color:screen===t.id?M.teal:M.sub, fontWeight:screen===t.id?700:400 }}>{t.label}</span>
                {screen===t.id && <div style={{ width:4, height:4, borderRadius:"50%", background:M.teal }}/>}
                {notif[t.id] && screen!==t.id && <div style={{ position:"absolute", top:2, right:"18%", width:8, height:8, borderRadius:"50%", background:M.red }}/>}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop:14, textAlign:"center", color:M.sub, fontSize:12 }}>Click tabs to explore all screens</div>
      </div>

      {/* right — flow explanation */}
      <div style={{ maxWidth:280, paddingTop:60 }}>
        <div style={{ color:M.text, fontWeight:700, fontSize:15, marginBottom:16 }}>📋 Farmer App Screens</div>
        {[
          { icon:"🏠", name:"Home", desc:"Pond summary, alerts, quick actions" },
          { icon:"🏊", name:"My Ponds", desc:"View each pond – DOC, water params, harvest status. Tap pond for full detail." },
          { icon:"💧", name:"Water Log", desc:"Farmer logs daily water readings. Technician sees it in web app." },
          { icon:"🎫", name:"Issues", desc:"Farmer raises a ticket describing pond problem. Gets guided steps & tech reply." },
          { icon:"💬", name:"Chat", desc:"Direct chat with assigned technician. Quick reply buttons for easy messaging." },
          { icon:"📦", name:"Orders", desc:"Order feed, medicine, seed directly. Track delivery status." },
        ].map((s,i)=>(
          <div key={i} style={{ background:M.card, borderRadius:12, padding:"12px 14px", marginBottom:8, display:"flex", gap:10, alignItems:"flex-start" }}>
            <span style={{ fontSize:22, flexShrink:0 }}>{s.icon}</span>
            <div>
              <div style={{ color:M.text, fontWeight:700, fontSize:12 }}>{s.name}</div>
              <div style={{ color:M.sub, fontSize:11, marginTop:2, lineHeight:1.5 }}>{s.desc}</div>
            </div>
          </div>
        ))}

        <div style={{ background:M.teal+"18", border:`1px solid ${M.teal}33`, borderRadius:12, padding:"12px 14px", marginTop:8 }}>
          <div style={{ color:M.teal, fontWeight:700, fontSize:12, marginBottom:6 }}>🔄 Data Flow</div>
          <div style={{ color:"#6ee7d4", fontSize:11, lineHeight:1.8 }}>
            Farmer logs water → Tech sees in web app<br/>
            Farmer raises ticket → Tech gets alert<br/>
            Farmer chats → Tech replies in Field Tech app<br/>
            Farmer places order → Manager sees in Sales
          </div>
        </div>
      </div>
    </div>
  );
}
