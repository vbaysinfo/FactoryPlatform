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
  background: bg+"22", color, fontSize:10, fontWeight:700,
  padding:"3px 10px", borderRadius:99, display:"inline-block", ...extra,
});
const btn = (bg, color="#000") => ({
  background:bg, color, border:"none", borderRadius:11,
  padding:"11px 0", fontWeight:700, fontSize:13,
  cursor:"pointer", width:"100%", marginTop:8,
});
const inp = {
  background:"#0d1525", border:"1px solid rgba(255,255,255,0.1)",
  borderRadius:9, padding:"9px 12px", color:M.text,
  fontSize:13, width:"100%", boxSizing:"border-box", marginTop:4,
};
const lbl = { color:M.sub, fontSize:11, marginTop:10, display:"block" };

// ── mock data ────────────────────────────────────────────────────────────────
const TANKS = [
  { id:1, name:"T-01", shed:"Shed A", batch:"B-2024-01", pl:"PL-12", doc:18, cnt:5000000, status:"active",  temp:28.5, doV:6.2, ph:7.9, sal:22, amm:0.08, lastFeed:"06:30 AM", feedKg:12, bio:42, sr:88 },
  { id:2, name:"T-02", shed:"Shed A", batch:"B-2024-02", pl:"PL-10", doc:32, cnt:8000000, status:"harvest-ready", temp:29.1, doV:5.7, ph:8.1, sal:24, amm:0.15, lastFeed:"07:00 AM", feedKg:18, bio:95, sr:82 },
  { id:3, name:"T-03", shed:"Shed B", batch:"B-2024-03", pl:"PL-12", doc:7,  cnt:3000000, status:"active",  temp:27.4, doV:7.1, ph:7.8, sal:20, amm:0.05, lastFeed:"06:45 AM", feedKg:6,  bio:12, sr:95 },
  { id:4, name:"T-04", shed:"Shed B", batch:"B-2024-04", pl:"PL-8",  doc:3,  cnt:4000000, status:"active",  temp:28.0, doV:6.8, ph:7.9, sal:21, amm:0.04, lastFeed:"07:15 AM", feedKg:8,  bio:8,  sr:98 },
  { id:5, name:"T-05", shed:"Shed C", batch:null,        pl:null,    doc:0,  cnt:0,        status:"empty",   temp:null, doV:null, ph:null, sal:null, amm:null, lastFeed:null, feedKg:0, bio:0, sr:0 },
];
const SHIFTS = ["Morning 🌅", "Afternoon ☀️", "Night 🌙"];

// ── colour helpers ────────────────────────────────────────────────────────────
const wc = (v,lo,hi,wlo,whi) => {
  if(v==null) return M.sub;
  if(v<lo||v>hi) return M.red;
  if(wlo!=null&&(v<wlo||v>whi)) return M.amber;
  return M.teal;
};
const docColor = d => d>=22?M.amber:d>=15?M.blue:M.teal;
const sc       = s => s==="harvest-ready"?M.amber:s==="active"?M.teal:s==="empty"?M.sub:M.green;

// ─────────────────────────────────────────────────────────────────────────────
// HOME
// ─────────────────────────────────────────────────────────────────────────────
function HomeScreen({ go }) {
  const active = TANKS.filter(t=>t.status!=="empty");
  const ready  = TANKS.filter(t=>t.status==="harvest-ready");
  const alerts = [
    { icon:"⚠️", text:"T-02 DO level low (5.7 mg/L) – check aerator", color:M.red,   action:"tanks" },
    { icon:"⏰", text:"T-02 harvest ready – Day 32", color:M.amber, action:"harvest" },
    { icon:"💊", text:"T-03 probiotic dose due today",               color:M.purple, action:"medicine" },
    { icon:"🌊", text:"Afternoon water check pending",               color:M.blue,   action:"water" },
  ];
  const tasks = [
    { done:true,  label:"Morning water readings – all tanks" },
    { done:true,  label:"Morning feed – T-01, T-02, T-03, T-04" },
    { done:false, label:"Afternoon water readings" },
    { done:false, label:"Afternoon feed round" },
    { done:false, label:"Probiotic dose – T-03" },
    { done:false, label:"Night water check" },
  ];

  return (
    <div style={{ padding:"16px 14px", overflowY:"auto", height:"100%" }}>
      <div style={{ marginBottom:16 }}>
        <div style={{ color:M.sub, fontSize:12 }}>Good Morning 🌅</div>
        <div style={{ color:M.text, fontWeight:700, fontSize:18 }}>Suresh (Nursery Tech)</div>
        <div style={{ color:M.sub, fontSize:11, marginTop:2 }}>Tuesday, 10 Jun 2026</div>
      </div>

      {/* KPI strip */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:7, marginBottom:16 }}>
        {[["Tanks","5",M.teal,"🧪"],["Active","4",M.blue,"📡"],["Ready","1",M.amber,"✅"],["Alerts","4",M.red,"🔔"]].map(([l,v,c,ic])=>(
          <div key={l} style={{ background:M.card2, borderRadius:11, padding:"10px 6px", textAlign:"center" }}>
            <div style={{ fontSize:14 }}>{ic}</div>
            <div style={{ color:c, fontWeight:700, fontSize:18 }}>{v}</div>
            <div style={{ color:M.sub, fontSize:9 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* alerts */}
      <div style={{ color:M.sub, fontSize:11, fontWeight:600, letterSpacing:1, marginBottom:8 }}>🔔 ALERTS</div>
      {alerts.map((a,i)=>(
        <button key={i} onClick={()=>go(a.action)}
          style={{ width:"100%", background:M.card, border:`1px solid ${a.color}33`, borderRadius:11, padding:"10px 12px", marginBottom:7, display:"flex", alignItems:"center", gap:10, cursor:"pointer", textAlign:"left" }}>
          <span style={{ fontSize:18 }}>{a.icon}</span>
          <div style={{ flex:1, color:M.text, fontSize:12 }}>{a.text}</div>
          <span style={{ color:a.color, fontSize:16 }}>›</span>
        </button>
      ))}

      {/* today's tasks */}
      <div style={{ color:M.sub, fontSize:11, fontWeight:600, letterSpacing:1, margin:"14px 0 8px" }}>📋 TODAY'S TASKS</div>
      <div style={{ background:M.card, borderRadius:13, padding:"12px 14px", marginBottom:14 }}>
        {tasks.map((t,i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 0", borderBottom:i<tasks.length-1?"1px solid rgba(255,255,255,0.04)":"none" }}>
            <div style={{ width:18, height:18, borderRadius:5, border:`2px solid ${t.done?M.teal:"rgba(255,255,255,0.2)"}`, background:t.done?M.teal:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              {t.done && <span style={{ color:"#000", fontSize:10, fontWeight:900 }}>✓</span>}
            </div>
            <span style={{ color:t.done?M.sub:M.text, fontSize:12, textDecoration:t.done?"line-through":"none" }}>{t.label}</span>
          </div>
        ))}
        <div style={{ marginTop:10, display:"flex", justifyContent:"space-between" }}>
          <span style={{ color:M.sub, fontSize:11 }}>Progress</span>
          <span style={{ color:M.teal, fontWeight:700, fontSize:11 }}>{tasks.filter(t=>t.done).length}/{tasks.length} done</span>
        </div>
        <div style={{ height:5, borderRadius:99, background:"rgba(255,255,255,0.08)", marginTop:6 }}>
          <div style={{ height:"100%", width:(tasks.filter(t=>t.done).length/tasks.length*100)+"%", borderRadius:99, background:"linear-gradient(90deg,#00d4aa,#0099ff)" }}/>
        </div>
      </div>

      {/* quick actions */}
      <div style={{ color:M.sub, fontSize:11, fontWeight:600, letterSpacing:1, marginBottom:8 }}>QUICK ACTIONS</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
        {[
          { icon:"💧", label:"Log Water",    sub:"Record readings",    screen:"water",    color:M.blue },
          { icon:"🌾", label:"Log Feed",     sub:"Record feeding",     screen:"feed",     color:M.amber },
          { icon:"💊", label:"Log Medicine", sub:"Record treatment",   screen:"medicine", color:M.purple },
          { icon:"🧪", label:"Tanks",        sub:"View all tanks",     screen:"tanks",    color:M.teal },
        ].map(a=>(
          <button key={a.screen} onClick={()=>go(a.screen)}
            style={{ background:M.card2, border:`1px solid ${a.color}22`, borderRadius:13, padding:"13px", cursor:"pointer", textAlign:"left" }}>
            <div style={{ fontSize:22, marginBottom:5 }}>{a.icon}</div>
            <div style={{ color:M.text, fontWeight:700, fontSize:12 }}>{a.label}</div>
            <div style={{ color:M.sub, fontSize:10, marginTop:2 }}>{a.sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TANKS SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function TanksScreen({ go }) {
  const [selected, setSelected] = useState(null);
  const [shed, setShed] = useState("all");
  const sheds = ["all","Shed A","Shed B","Shed C"];
  const list = shed==="all" ? TANKS : TANKS.filter(t=>t.shed===shed);

  const Param = ({label,val,unit,lo,hi,wlo,whi}) => {
    const c = wc(val,lo,hi,wlo,whi);
    return (
      <div style={{ background:M.card2, borderRadius:9, padding:"9px 10px" }}>
        <div style={{ color:M.sub, fontSize:10 }}>{label}</div>
        <div style={{ color:val!=null?c:M.sub, fontWeight:700, fontSize:13, marginTop:2 }}>{val!=null?val+unit:"—"}</div>
      </div>
    );
  };

  if(selected) {
    const t = selected;
    const stc = sc(t.status);
    return (
      <div style={{ padding:"16px 14px", overflowY:"auto", height:"100%" }}>
        <button onClick={()=>setSelected(null)} style={{ background:"transparent", border:"none", color:M.teal, fontSize:18, cursor:"pointer", marginBottom:10 }}>← Back</button>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
          <div>
            <div style={{ color:M.text, fontWeight:700, fontSize:20 }}>{t.name}</div>
            <div style={{ color:M.sub, fontSize:11 }}>{t.shed} • {t.pl||"—"} • {t.batch||"Empty"}</div>
          </div>
          {t.status!=="empty" && <span style={pill(stc,stc,{fontSize:12,padding:"5px 13px"})}>D{t.doc}</span>}
        </div>

        {t.status==="harvest-ready" && (
          <div style={{ background:M.amber+"18", border:`1px solid ${M.amber}44`, borderRadius:12, padding:"12px 14px", marginBottom:12 }}>
            <div style={{ color:M.amber, fontWeight:700, fontSize:13 }}>🎉 Harvest Ready – Day {t.doc}</div>
            <div style={{ color:"#d1913c", fontSize:11, marginTop:4 }}>Contact manager to schedule harvest. Biomass est. {t.bio} kg.</div>
          </div>
        )}

        {t.status!=="empty" ? <>
          <div style={{ color:M.sub, fontSize:11, fontWeight:600, letterSpacing:1, marginBottom:8 }}>WATER PARAMETERS</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
            <Param label="Temperature" val={t.temp} unit="°C"    lo={26} hi={32} wlo={27} whi={31}/>
            <Param label="Dissolved O₂" val={t.doV} unit=" mg/L" lo={5}  hi={20} wlo={6}  whi={15}/>
            <Param label="pH"           val={t.ph}  unit=""      lo={7.5} hi={8.5} wlo={7.8} whi={8.3}/>
            <Param label="Salinity"     val={t.sal} unit=" ppt"  lo={15} hi={40} wlo={18} whi={28}/>
            <Param label="Ammonia"      val={t.amm} unit=" ppm"  lo={0}  hi={0.5} wlo={0}  whi={0.1}/>
            <Param label="Survival Rate" val={t.sr} unit="%"     lo={70} hi={100} wlo={80} whi={100}/>
          </div>

          <div style={{ color:M.sub, fontSize:11, fontWeight:600, letterSpacing:1, marginBottom:8 }}>BATCH INFO</div>
          <div style={{ background:M.card, borderRadius:12, padding:14, marginBottom:14 }}>
            {[["PL Count",(t.cnt/1000000).toFixed(1)+"M PLs"],["Biomass Est.",t.bio+" kg"],["DOC","Day "+t.doc],["Last Feed",t.lastFeed||"—"],["Feed Today",t.feedKg+" kg"]].map(([l,v])=>(
              <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ color:M.sub, fontSize:12 }}>{l}</span>
                <span style={{ color:M.text, fontSize:12, fontWeight:600 }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:7 }}>
            <button onClick={()=>go("water")}    style={{ ...btn(M.blue+"22",M.blue),   padding:"8px 0", fontSize:11 }}>💧 Water</button>
            <button onClick={()=>go("feed")}     style={{ ...btn(M.amber+"22",M.amber), padding:"8px 0", fontSize:11 }}>🌾 Feed</button>
            <button onClick={()=>go("medicine")} style={{ ...btn(M.purple+"22",M.purple),padding:"8px 0",fontSize:11}}>💊 Med</button>
          </div>
        </> : (
          <div style={{ textAlign:"center", padding:"40px 20px" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🪣</div>
            <div style={{ color:M.sub, fontSize:13 }}>This tank is currently empty</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding:"16px 14px", overflowY:"auto", height:"100%" }}>
      <div style={{ color:M.text, fontWeight:700, fontSize:15, marginBottom:12 }}>🧪 Tank Overview</div>
      {/* shed filter */}
      <div style={{ display:"flex", gap:6, marginBottom:12, overflowX:"auto" }}>
        {sheds.map(s=>(
          <button key={s} onClick={()=>setShed(s)} style={{ flexShrink:0, padding:"6px 12px", borderRadius:8, border:"none", background:shed===s?M.teal:M.card2, color:shed===s?"#000":M.sub, fontWeight:700, fontSize:11, cursor:"pointer" }}>{s==="all"?"All Sheds":s}</button>
        ))}
      </div>
      {list.map(t=>{
        const stc = sc(t.status);
        const doAlert = t.doV!=null&&t.doV<6;
        return (
          <button key={t.id} onClick={()=>setSelected(t)}
            style={{ width:"100%", background:M.card, borderRadius:13, padding:"13px", marginBottom:9, borderLeft:`3px solid ${stc}`, cursor:"pointer", textAlign:"left", border:`1px solid ${doAlert?M.red+"44":M.border}`, borderLeftWidth:3, borderLeftColor:stc }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
              <div>
                <div style={{ color:M.text, fontWeight:700, fontSize:14 }}>{t.name} <span style={{ color:M.sub, fontWeight:400, fontSize:11 }}>• {t.shed}</span></div>
                <div style={{ color:M.sub, fontSize:11 }}>{t.batch||"Empty"} {t.pl&&"• "+t.pl}</div>
              </div>
              {t.status!=="empty" && <div style={{ textAlign:"right" }}>
                <div style={{ color:docColor(t.doc), fontWeight:700, fontSize:18 }}>D{t.doc}</div>
                <div style={{ color:M.sub, fontSize:9 }}>DOC</div>
              </div>}
            </div>
            {t.status==="empty" ? (
              <span style={pill(M.sub,M.sub)}>Empty</span>
            ) : (
              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                <span style={{ color:M.sub, fontSize:11 }}>🌡 <b style={{color:wc(t.temp,26,32,27,31)}}>{t.temp}°C</b></span>
                <span style={{ color:M.sub, fontSize:11 }}>O₂ <b style={{color:wc(t.doV,5,20,6,15)}}>{t.doV}</b></span>
                <span style={{ color:M.sub, fontSize:11 }}>pH <b style={{color:wc(t.ph,7.5,8.5,7.8,8.3)}}>{t.ph}</b></span>
                <span style={{ color:M.sub, fontSize:11 }}>PLs <b style={{color:M.text}}>{(t.cnt/1000000).toFixed(1)}M</b></span>
              </div>
            )}
            {doAlert && <div style={{ background:M.red+"18", color:M.red, fontSize:10, borderRadius:6, padding:"4px 9px", marginTop:7, fontWeight:600 }}>⚠️ DO low – check aerators</div>}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WATER LOG
// ─────────────────────────────────────────────────────────────────────────────
function WaterScreen() {
  const [tank, setTank] = useState("T-01");
  const [shift, setShift] = useState("Morning 🌅");
  const [submitted, setSubmitted] = useState(false);

  const history = [
    { tank:"T-01", shift:"Morning", temp:28.5, do:6.2, ph:7.9, sal:22, amm:0.08, time:"06:45 AM" },
    { tank:"T-02", shift:"Morning", temp:29.1, do:5.7, ph:8.1, sal:24, amm:0.15, time:"07:00 AM" },
    { tank:"T-03", shift:"Morning", temp:27.4, do:7.1, ph:7.8, sal:20, amm:0.05, time:"07:20 AM" },
  ];

  if(submitted) return (
    <div style={{ padding:"60px 24px", textAlign:"center" }}>
      <div style={{ fontSize:56, marginBottom:12 }}>✅</div>
      <div style={{ color:M.teal, fontWeight:700, fontSize:18, marginBottom:8 }}>Reading Saved!</div>
      <div style={{ color:M.sub, fontSize:13, marginBottom:24 }}>Water data synced to web app. Manager can view live.</div>
      <button onClick={()=>setSubmitted(false)} style={btn("linear-gradient(135deg,#00d4aa,#0099ff)")}>Log Another Tank</button>
    </div>
  );

  return (
    <div style={{ padding:"16px 14px", overflowY:"auto", height:"100%" }}>
      <div style={{ color:M.text, fontWeight:700, fontSize:15, marginBottom:4 }}>💧 Water Quality Log</div>
      <div style={{ color:M.sub, fontSize:11, marginBottom:14 }}>Record readings for each tank every shift</div>

      <div style={{ background:M.card, borderRadius:14, padding:16, marginBottom:12 }}>
        <label style={lbl}>Select Tank</label>
        <select style={inp} value={tank} onChange={e=>setTank(e.target.value)}>
          {TANKS.filter(t=>t.status!=="empty").map(t=><option key={t.id}>{t.name} – {t.shed}</option>)}
        </select>
        <label style={lbl}>Shift</label>
        <div style={{ display:"flex", gap:7, marginTop:6 }}>
          {SHIFTS.map(s=>(
            <button key={s} onClick={()=>setShift(s)} style={{ flex:1, padding:"8px 4px", borderRadius:9, border:"none", background:shift===s?M.blue+"33":M.card2, color:shift===s?M.blue:M.sub, fontWeight:700, fontSize:9, cursor:"pointer" }}>{s}</button>
          ))}
        </div>
        <label style={lbl}>Date & Time</label>
        <input style={inp} type="datetime-local" defaultValue="2026-06-10T07:00"/>
      </div>

      <div style={{ background:M.card, borderRadius:14, padding:16, marginBottom:12 }}>
        <div style={{ color:M.text, fontWeight:700, marginBottom:12 }}>Parameters</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
          {[["Temperature (°C)","27–31","temp"],["DO mg/L","above 6","do"],["pH","7.8–8.3","ph"],["Salinity ppt","18–28","sal"],["Ammonia ppm","below 0.1","amm"],["Transparency cm","30–40","trans"]].map(([l,hint,k])=>(
            <div key={k}>
              <label style={lbl}>{l}</label>
              <input style={inp} type="number" step="0.01" placeholder="0.00"/>
              <div style={{ color:M.sub, fontSize:9, marginTop:2 }}>{hint}</div>
            </div>
          ))}
        </div>
        <label style={lbl}>Remarks</label>
        <textarea style={{...inp, height:55, resize:"none"}} placeholder="Any observations..."/>
      </div>

      <button onClick={()=>setSubmitted(true)} style={btn("linear-gradient(135deg,#00d4aa,#0099ff)")}>📤 Submit Water Reading</button>

      <div style={{ color:M.sub, fontSize:11, fontWeight:600, letterSpacing:1, margin:"16px 0 8px" }}>TODAY'S LOGS</div>
      {history.map((h,i)=>(
        <div key={i} style={{ background:M.card, borderRadius:11, padding:"11px 13px", marginBottom:7, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ color:M.text, fontSize:12, fontWeight:700 }}>{h.tank} – {h.shift}</div>
            <div style={{ color:M.sub, fontSize:10, marginTop:3 }}>
              🌡{h.temp}°C  O₂{h.do}  pH{h.ph}  Amm{h.amm}
            </div>
          </div>
          <div style={{ color:M.sub, fontSize:10 }}>{h.time}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FEED LOG
// ─────────────────────────────────────────────────────────────────────────────
function FeedScreen() {
  const [submitted, setSubmitted] = useState(false);
  const [bulk, setBulk] = useState(false);
  const feeds = ["Starter 0.8mm","Grower 2mm","Finisher 3mm","Artemia","Algae paste"];

  const history = [
    { tank:"T-01", feed:"Grower 2mm", kg:12, shift:"Morning", time:"06:30 AM", fcr:1.4 },
    { tank:"T-02", feed:"Finisher 3mm", kg:18, shift:"Morning", time:"07:00 AM", fcr:1.6 },
    { tank:"T-03", feed:"Starter 0.8mm", kg:6,  shift:"Morning", time:"07:20 AM", fcr:1.2 },
    { tank:"T-04", feed:"Grower 2mm", kg:8, shift:"Morning", time:"07:40 AM", fcr:1.3 },
  ];

  if(submitted) return (
    <div style={{ padding:"60px 24px", textAlign:"center" }}>
      <div style={{ fontSize:56, marginBottom:12 }}>🌾</div>
      <div style={{ color:M.teal, fontWeight:700, fontSize:18, marginBottom:8 }}>Feed Logged!</div>
      <div style={{ color:M.sub, fontSize:13, marginBottom:24 }}>Feed record saved. Inventory updated automatically.</div>
      <button onClick={()=>setSubmitted(false)} style={btn("linear-gradient(135deg,#00d4aa,#0099ff)")}>Log Another</button>
    </div>
  );

  return (
    <div style={{ padding:"16px 14px", overflowY:"auto", height:"100%" }}>
      <div style={{ color:M.text, fontWeight:700, fontSize:15, marginBottom:4 }}>🌾 Feed Log</div>
      <div style={{ color:M.sub, fontSize:11, marginBottom:14 }}>Record every feed for accurate FCR tracking</div>

      <div style={{ display:"flex", gap:8, marginBottom:12 }}>
        {[false,true].map(b=>(
          <button key={b} onClick={()=>setBulk(b)} style={{ flex:1, padding:"8px", borderRadius:9, border:"none", background:bulk===b?"linear-gradient(135deg,#f59e0b33,#f9731633)":M.card2, color:bulk===b?M.amber:M.sub, fontWeight:700, fontSize:12, cursor:"pointer" }}>{b?"All Tanks (Bulk)":"Single Tank"}</button>
        ))}
      </div>

      <div style={{ background:M.card, borderRadius:14, padding:16, marginBottom:12 }}>
        {!bulk && <>
          <label style={lbl}>Select Tank</label>
          <select style={inp}>
            {TANKS.filter(t=>t.status!=="empty").map(t=><option key={t.id}>{t.name} – {t.shed}</option>)}
          </select>
        </>}
        <label style={lbl}>Feed Type</label>
        <select style={inp}>{feeds.map(f=><option key={f}>{f}</option>)}</select>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
          <div>
            <label style={lbl}>Qty (kg)</label>
            <input style={inp} type="number" step="0.1" placeholder="0.0"/>
          </div>
          <div>
            <label style={lbl}>Feed Rate (%BW)</label>
            <input style={inp} type="number" step="0.1" placeholder="2.5"/>
          </div>
        </div>
        <label style={lbl}>Shift</label>
        <div style={{ display:"flex", gap:7, marginTop:6 }}>
          {SHIFTS.map(s=>(
            <button key={s} style={{ flex:1, padding:"8px 4px", borderRadius:9, border:"none", background:s==="Morning 🌅"?M.amber+"33":M.card2, color:s==="Morning 🌅"?M.amber:M.sub, fontWeight:700, fontSize:9, cursor:"pointer" }}>{s}</button>
          ))}
        </div>
        <label style={lbl}>Shrimp Response</label>
        <select style={inp}>
          <option>Active feeding – all consumed</option>
          <option>Slow feeding – partial</option>
          <option>Not eating</option>
        </select>
        <label style={lbl}>Remarks</label>
        <textarea style={{...inp, height:50, resize:"none"}} placeholder="Any notes..."/>
      </div>
      <button onClick={()=>setSubmitted(true)} style={btn("linear-gradient(135deg,#f59e0b,#f97316)","#000")}>🌾 Save Feed Log</button>

      <div style={{ color:M.sub, fontSize:11, fontWeight:600, letterSpacing:1, margin:"16px 0 8px" }}>TODAY'S FEED LOGS</div>
      {history.map((h,i)=>(
        <div key={i} style={{ background:M.card, borderRadius:11, padding:"11px 13px", marginBottom:7 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <div style={{ color:M.text, fontSize:12, fontWeight:700 }}>{h.tank} – {h.feed}</div>
            <div style={{ color:M.sub, fontSize:10 }}>{h.time}</div>
          </div>
          <div style={{ display:"flex", gap:14 }}>
            <span style={{ color:M.sub, fontSize:11 }}>Qty: <b style={{color:M.amber}}>{h.kg}kg</b></span>
            <span style={{ color:M.sub, fontSize:11 }}>FCR: <b style={{color:h.fcr<=1.4?M.teal:M.amber}}>{h.fcr}</b></span>
            <span style={{ color:M.sub, fontSize:11 }}>{h.shift}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MEDICINE LOG
// ─────────────────────────────────────────────────────────────────────────────
function MedicineScreen() {
  const [tab, setTab]           = useState("schedule");  // schedule | log | history
  const [submitted, setSubmitted] = useState(false);
  const [tankSel, setTankSel]   = useState("T-03");
  const [medType, setMedType]   = useState("preventive");
  const [waterChange, setWaterChange] = useState(false);

  const CATEGORIES = {
    probiotics:  ["Probiotics (Bacillus)","Lactobacillus","Photosynthetic bacteria","Yeast culture"],
    minerals:    ["Mineral Mix","Dolomite","Lime (CaCO₃)","Zeolite","Salt (NaCl)"],
    vitamins:    ["Vitamin C","Vitamin E+C mix","B-complex","Multivitamin"],
    chemicals:   ["EDTA","Potassium permanganate (KMnO₄)","Formalin","Copper sulphate"],
    water:       ["Water conditioner","pH up (NaOH)","pH down (HCl)","De-chlorinator","Algaecide"],
    antibiotics: ["Oxytetracycline","Florfenicol","Enrofloxacin"],
  };
  const CAT_LABELS = {
    probiotics:"🦠 Probiotics", minerals:"⛏ Minerals", vitamins:"💉 Vitamins",
    chemicals:"⚗️ Chemicals", water:"🌊 Water Treatment", antibiotics:"💉 Antibiotics",
  };
  const [catSel, setCatSel] = useState("probiotics");

  const schedule = [
    { tank:"T-03", med:"Probiotics", dose:"200g", freq:"Daily", due:"Today",     status:"pending",  priority:"high"   },
    { tank:"T-01", med:"Mineral Mix",dose:"500g", freq:"Weekly",due:"Tomorrow",  status:"upcoming", priority:"medium" },
    { tank:"T-02", med:"Vitamin C",  dose:"100g", freq:"Daily", due:"Today",     status:"done",     priority:"low"    },
    { tank:"T-04", med:"Lime",       dose:"1kg",  freq:"2×week",due:"Today",     status:"pending",  priority:"medium" },
  ];

  const history = [
    { tank:"T-01", med:"Probiotics",  dose:"200g", method:"Broadcast",   purpose:"Routine",        before:"pH 7.8", after:"pH 7.9", result:"Good",    time:"Yesterday 7 AM", tech:"Suresh" },
    { tank:"T-02", med:"Vitamin C",   dose:"100g", method:"Premix water", purpose:"Immune boost",   before:"DO 5.8", after:"DO 6.1", result:"Improved",time:"Yesterday 8 AM", tech:"Suresh" },
    { tank:"T-03", med:"Formalin",    dose:"25ml", method:"Broadcast",   purpose:"White spot trt",  before:"Spots visible",after:"Spots reduced",result:"Moderate",time:"2 days ago",tech:"Suresh" },
    { tank:"T-04", med:"Mineral Mix", dose:"500g", method:"Broadcast",   purpose:"Moulting support",before:"SR 91%", after:"SR 93%", result:"Good",    time:"3 days ago", tech:"Suresh" },
  ];

  const rc = p => p==="high"?M.red:p==="medium"?M.amber:M.teal;
  const sc_s = s => s==="done"?M.teal:s==="pending"?M.red:M.amber;
  const res_c = r => r==="Good"||r==="Improved"?M.teal:r==="Moderate"?M.amber:M.red;

  if(submitted) return (
    <div style={{ padding:"50px 24px", textAlign:"center" }}>
      <div style={{ fontSize:56, marginBottom:10 }}>💊</div>
      <div style={{ color:M.purple, fontWeight:700, fontSize:18, marginBottom:8 }}>Treatment Logged!</div>
      <div style={{ color:M.sub, fontSize:12, marginBottom:6 }}>Medicine record saved to database.</div>
      <div style={{ color:M.sub, fontSize:12, marginBottom:20 }}>📦 Stock deducted from inventory automatically.</div>
      <button onClick={()=>{setSubmitted(false);setTab("history");}} style={btn("linear-gradient(135deg,#a855f7,#0099ff)")}>View History</button>
      <button onClick={()=>{setSubmitted(false);setTab("log");}} style={{ ...btn(M.purple+"22",M.purple), marginTop:0 }}>Log Another</button>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      {/* header */}
      <div style={{ padding:"14px 14px 0", flexShrink:0 }}>
        <div style={{ color:M.text, fontWeight:700, fontSize:15, marginBottom:10 }}>💊 Medicine & Treatment</div>
        <div style={{ display:"flex", gap:6, marginBottom:12 }}>
          {[["schedule","📅 Schedule"],["log","➕ Log"],["history","📋 History"]].map(([k,lb])=>(
            <button key={k} onClick={()=>setTab(k)} style={{ flex:1, padding:"7px 4px", borderRadius:9, border:"none", background:tab===k?"linear-gradient(135deg,#a855f722,#0099ff22)":M.card2, color:tab===k?M.purple:M.sub, fontWeight:700, fontSize:10, cursor:"pointer", borderBottom:tab===k?`2px solid ${M.purple}`:"2px solid transparent" }}>{lb}</button>
          ))}
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"0 14px 14px" }}>

      {/* ── SCHEDULE TAB ── */}
      {tab==="schedule" && <>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:7, marginBottom:14 }}>
          {[["Pending",schedule.filter(s=>s.status==="pending").length,M.red],
            ["Done Today",schedule.filter(s=>s.status==="done").length,M.teal],
            ["Upcoming",schedule.filter(s=>s.status==="upcoming").length,M.amber]].map(([l,v,c])=>(
            <div key={l} style={{ background:M.card2, borderRadius:11, padding:"10px 8px", textAlign:"center" }}>
              <div style={{ color:c, fontWeight:700, fontSize:20 }}>{v}</div>
              <div style={{ color:M.sub, fontSize:9 }}>{l}</div>
            </div>
          ))}
        </div>

        {schedule.map((s,i)=>(
          <div key={i} style={{ background:M.card, borderRadius:13, padding:"13px", marginBottom:9, borderLeft:`3px solid ${sc_s(s.status)}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
              <div style={{ color:M.text, fontWeight:700, fontSize:13 }}>{s.tank} — {s.med}</div>
              <span style={pill(rc(s.priority),rc(s.priority))}>{s.priority}</span>
            </div>
            <div style={{ display:"flex", gap:14, marginBottom:8 }}>
              <span style={{ color:M.sub, fontSize:11 }}>💊 {s.dose}</span>
              <span style={{ color:M.sub, fontSize:11 }}>🔁 {s.freq}</span>
              <span style={{ color:M.sub, fontSize:11 }}>📅 {s.due}</span>
            </div>
            {s.status!=="done" ? (
              <div style={{ display:"flex", gap:7 }}>
                <button onClick={()=>setTab("log")} style={{ flex:2, ...btn("linear-gradient(135deg,#a855f7,#0099ff)"), padding:"7px 0", fontSize:11, marginTop:0 }}>💊 Apply Now</button>
                <button style={{ flex:1, ...btn(M.card2,M.sub), padding:"7px 0", fontSize:11, marginTop:0 }}>Skip</button>
              </div>
            ) : (
              <span style={pill(M.teal,M.teal)}>✓ Done</span>
            )}
          </div>
        ))}
      </>}

      {/* ── LOG TAB ── */}
      {tab==="log" && <>
        {/* treatment type */}
        <div style={{ background:M.card, borderRadius:14, padding:14, marginBottom:10 }}>
          <div style={{ color:M.text, fontWeight:700, fontSize:13, marginBottom:10 }}>Treatment Type</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
            {[["preventive","🛡 Preventive","Routine scheduled dose"],["curative","🚑 Curative","Active disease treatment"],["nutritional","🥗 Nutritional","Vitamins & minerals"],["water","🌊 Water Treatment","pH / DO correction"]].map(([k,lb,sub])=>(
              <button key={k} onClick={()=>setMedType(k)}
                style={{ background:medType===k?M.purple+"33":M.card2, border:`1px solid ${medType===k?M.purple:"transparent"}`, borderRadius:10, padding:"10px 8px", cursor:"pointer", textAlign:"left" }}>
                <div style={{ color:medType===k?M.purple:M.text, fontWeight:700, fontSize:11 }}>{lb}</div>
                <div style={{ color:M.sub, fontSize:9, marginTop:2 }}>{sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* tank selection */}
        <div style={{ background:M.card, borderRadius:14, padding:14, marginBottom:10 }}>
          <div style={{ color:M.text, fontWeight:700, fontSize:13, marginBottom:10 }}>Tank Selection</div>
          <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
            {TANKS.filter(t=>t.status!=="empty").map(t=>(
              <button key={t.id} onClick={()=>setTankSel(t.name)}
                style={{ padding:"7px 12px", borderRadius:8, border:"none", background:tankSel===t.name?M.teal+"33":M.card2, color:tankSel===t.name?M.teal:M.sub, fontWeight:700, fontSize:12, cursor:"pointer" }}>{t.name}</button>
            ))}
            <button style={{ padding:"7px 12px", borderRadius:8, border:"none", background:tankSel==="All"?M.teal+"33":M.card2, color:tankSel==="All"?M.teal:M.sub, fontWeight:700, fontSize:12, cursor:"pointer" }} onClick={()=>setTankSel("All")}>All Tanks</button>
          </div>
          {tankSel!=="All" && <div style={{ background:M.card2, borderRadius:9, padding:"9px 11px", marginTop:10, display:"flex", gap:14 }}>
            <span style={{ color:M.sub, fontSize:11 }}>DOC: <b style={{color:M.teal}}>D18</b></span>
            <span style={{ color:M.sub, fontSize:11 }}>PLs: <b style={{color:M.text}}>5M</b></span>
            <span style={{ color:M.sub, fontSize:11 }}>DO: <b style={{color:M.teal}}>6.2</b></span>
          </div>}
        </div>

        {/* medicine selection */}
        <div style={{ background:M.card, borderRadius:14, padding:14, marginBottom:10 }}>
          <div style={{ color:M.text, fontWeight:700, fontSize:13, marginBottom:10 }}>Medicine / Chemical</div>
          <div style={{ display:"flex", gap:6, overflowX:"auto", marginBottom:10, paddingBottom:4 }}>
            {Object.keys(CAT_LABELS).map(k=>(
              <button key={k} onClick={()=>setCatSel(k)} style={{ flexShrink:0, padding:"5px 10px", borderRadius:8, border:"none", background:catSel===k?M.purple+"33":M.card2, color:catSel===k?M.purple:M.sub, fontWeight:700, fontSize:9, cursor:"pointer" }}>{CAT_LABELS[k]}</button>
            ))}
          </div>
          <select style={inp}>
            {CATEGORIES[catSel].map(m=><option key={m}>{m}</option>)}
          </select>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9, marginTop:10 }}>
            <div>
              <label style={lbl}>Dose (g / ml)</label>
              <input style={inp} type="number" placeholder="0"/>
            </div>
            <div>
              <label style={lbl}>Unit</label>
              <select style={inp}><option>grams (g)</option><option>ml</option><option>kg</option><option>litres</option><option>ppm</option></select>
            </div>
            <div>
              <label style={lbl}>Application Method</label>
              <select style={inp}>
                <option>Broadcast (direct pond)</option>
                <option>Premix in water 1st</option>
                <option>Mix in feed</option>
                <option>Drip application</option>
                <option>Spray on surface</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Time of Application</label>
              <input style={inp} type="time" defaultValue="07:00"/>
            </div>
          </div>

          <label style={lbl}>Dosage Calculator</label>
          <div style={{ background:M.card2, borderRadius:9, padding:"10px 12px", marginTop:4 }}>
            <div style={{ color:M.sub, fontSize:11 }}>Tank volume: <b style={{color:M.teal}}>146,760 L</b></div>
            <div style={{ color:M.sub, fontSize:11, marginTop:4 }}>Recommended: <b style={{color:M.amber}}>1 ppm = 146.8g per tank</b></div>
          </div>
        </div>

        {/* condition before */}
        <div style={{ background:M.card, borderRadius:14, padding:14, marginBottom:10 }}>
          <div style={{ color:M.text, fontWeight:700, fontSize:13, marginBottom:10 }}>Condition Before Treatment</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
            <div><label style={lbl}>Water Temp °C</label><input style={inp} type="number" step="0.1" placeholder="29.0"/></div>
            <div><label style={lbl}>DO mg/L</label><input style={inp} type="number" step="0.1" placeholder="5.8"/></div>
            <div><label style={lbl}>pH</label><input style={inp} type="number" step="0.1" placeholder="8.1"/></div>
            <div><label style={lbl}>Ammonia ppm</label><input style={inp} type="number" step="0.01" placeholder="0.15"/></div>
          </div>
          <label style={lbl}>Symptoms observed</label>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginTop:6 }}>
            {["White spots","Slow movement","Not eating","Floating","Skin lesions","Gill discolouration","Unusual swimming","Mass mortality"].map(sym=>(
              <label key={sym} style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer" }}>
                <input type="checkbox" style={{ accentColor:M.purple }}/>
                <span style={{ color:M.sub, fontSize:11 }}>{sym}</span>
              </label>
            ))}
          </div>
          <label style={lbl}>Mortality count (today)</label>
          <input style={inp} type="number" placeholder="0 dead shrimp"/>
          <label style={lbl}>Additional observations</label>
          <textarea style={{...inp, height:55, resize:"none"}} placeholder="Water colour, foam, shrimp behaviour..."/>
        </div>

        {/* water change */}
        <div style={{ background:M.card, borderRadius:14, padding:14, marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:waterChange?12:0 }}>
            <div style={{ color:M.text, fontWeight:700, fontSize:13 }}>🌊 Water Change Before Treatment?</div>
            <button onClick={()=>setWaterChange(p=>!p)} style={{ background:waterChange?M.teal+"33":M.card2, color:waterChange?M.teal:M.sub, border:"none", borderRadius:8, padding:"5px 12px", fontSize:11, fontWeight:700, cursor:"pointer" }}>{waterChange?"Yes ✓":"No"}</button>
          </div>
          {waterChange && <>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
              <div><label style={lbl}>% Changed</label><input style={inp} type="number" placeholder="30"/></div>
              <div><label style={lbl}>Volume (litres)</label><input style={inp} type="number" placeholder="44000"/></div>
            </div>
            <label style={lbl}>Reason for water change</label>
            <select style={inp}>
              <option>Pre-treatment prep</option>
              <option>High ammonia</option>
              <option>Poor water colour</option>
              <option>Routine exchange</option>
            </select>
          </>}
        </div>

        {/* after treatment */}
        <div style={{ background:M.card, borderRadius:14, padding:14, marginBottom:10 }}>
          <div style={{ color:M.text, fontWeight:700, fontSize:13, marginBottom:10 }}>After Treatment Plan</div>
          <label style={lbl}>Stop feed for</label>
          <select style={inp}><option>No feed stop</option><option>1 hour</option><option>2 hours</option><option>4 hours</option><option>Morning feed only</option><option>Full day</option></select>
          <label style={lbl}>Follow-up check (hours later)</label>
          <select style={inp}><option>2 hours</option><option>4 hours</option><option>6 hours</option><option>Next morning</option></select>
          <label style={lbl}>Next dose date</label>
          <input style={inp} type="date"/>
          <label style={lbl}>Shrimp response after treatment</label>
          <select style={inp}>
            <option>Active – no change needed</option>
            <option>Improved – condition better</option>
            <option>No change – monitor</option>
            <option>Worsened – escalate</option>
          </select>
          <label style={lbl}>Post-treatment notes</label>
          <textarea style={{...inp, height:55, resize:"none"}} placeholder="Shrimp behaviour 2hrs after, water reaction, any concern..."/>
        </div>

        <button onClick={()=>setSubmitted(true)} style={btn("linear-gradient(135deg,#a855f7,#0099ff)")}>💊 Save Treatment Record</button>
      </>}

      {/* ── HISTORY TAB ── */}
      {tab==="history" && <>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginBottom:14 }}>
          {[["This Week","8 treatments",M.purple],["Last Treatment","Today 8:30 AM",M.teal]].map(([l,v,c])=>(
            <div key={l} style={{ background:M.card2, borderRadius:11, padding:"11px 10px" }}>
              <div style={{ color:M.sub, fontSize:10 }}>{l}</div>
              <div style={{ color:c, fontWeight:700, fontSize:13, marginTop:3 }}>{v}</div>
            </div>
          ))}
        </div>

        {history.map((h,i)=>(
          <div key={i} style={{ background:M.card, borderRadius:13, padding:"13px", marginBottom:10, borderLeft:`3px solid ${M.purple}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
              <div style={{ color:M.text, fontWeight:700, fontSize:13 }}>{h.tank} — {h.med}</div>
              <span style={pill(res_c(h.result),res_c(h.result))}>{h.result}</span>
            </div>
            <div style={{ display:"flex", gap:10, marginBottom:7, flexWrap:"wrap" }}>
              <span style={{ color:M.sub, fontSize:11 }}>💊 {h.dose}</span>
              <span style={{ color:M.sub, fontSize:11 }}>⚗️ {h.method}</span>
              <span style={{ color:M.sub, fontSize:11 }}>🎯 {h.purpose}</span>
            </div>
            <div style={{ background:M.card2, borderRadius:9, padding:"9px 11px", marginBottom:5 }}>
              <div style={{ display:"flex", gap:14 }}>
                <div>
                  <div style={{ color:M.sub, fontSize:9 }}>BEFORE</div>
                  <div style={{ color:M.amber, fontSize:11, fontWeight:600, marginTop:2 }}>{h.before}</div>
                </div>
                <div style={{ color:M.sub, fontSize:16, alignSelf:"center" }}>→</div>
                <div>
                  <div style={{ color:M.sub, fontSize:9 }}>AFTER</div>
                  <div style={{ color:M.teal, fontSize:11, fontWeight:600, marginTop:2 }}>{h.after}</div>
                </div>
              </div>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span style={{ color:M.sub, fontSize:10 }}>👤 {h.tech}</span>
              <span style={{ color:M.sub, fontSize:10 }}>🕐 {h.time}</span>
            </div>
          </div>
        ))}
      </>}

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HARVEST SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function HarvestScreen({ go }) {
  const [step, setStep] = useState(1); // 1=select, 2=form, 3=done
  const ready = TANKS.filter(t=>t.status==="harvest-ready");

  if(step===3) return (
    <div style={{ padding:"60px 24px", textAlign:"center" }}>
      <div style={{ fontSize:60, marginBottom:12 }}>🎉</div>
      <div style={{ color:M.teal, fontWeight:700, fontSize:20, marginBottom:8 }}>Harvest Recorded!</div>
      <div style={{ color:M.sub, fontSize:13, marginBottom:6 }}>T-02 harvest data submitted.</div>
      <div style={{ color:M.sub, fontSize:12, marginBottom:24 }}>Tank status updated to "harvested". Invoice will be auto-generated.</div>
      <button onClick={()=>{setStep(1);go("tanks");}} style={btn("linear-gradient(135deg,#00d4aa,#0099ff)")}>Back to Tanks</button>
    </div>
  );
  if(step===2) return (
    <div style={{ padding:"16px 14px", overflowY:"auto", height:"100%" }}>
      <button onClick={()=>setStep(1)} style={{ background:"transparent", border:"none", color:M.teal, fontSize:18, cursor:"pointer", marginBottom:10 }}>← Back</button>
      <div style={{ color:M.text, fontWeight:700, fontSize:15, marginBottom:4 }}>🎉 Harvest – T-02</div>
      <div style={{ color:M.sub, fontSize:11, marginBottom:14 }}>Fill in final harvest data. This will auto-create a sales invoice.</div>

      <div style={{ background:M.card, borderRadius:14, padding:16, marginBottom:12 }}>
        <div style={{ color:M.text, fontWeight:700, marginBottom:10 }}>Harvest Details</div>
        <label style={lbl}>Harvest Date</label>
        <input style={inp} type="date" defaultValue="2026-06-10"/>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
          <div><label style={lbl}>Final PL Count</label><input style={inp} type="number" placeholder="7500000"/></div>
          <div><label style={lbl}>Biomass (kg)</label><input style={inp} type="number" placeholder="95"/></div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
          <div><label style={lbl}>Survival Rate (%)</label><input style={inp} type="number" defaultValue="82"/></div>
          <div><label style={lbl}>Avg Weight (mg)</label><input style={inp} type="number" placeholder="12.6"/></div>
        </div>
        <label style={lbl}>PL Size / Stage</label>
        <input style={inp} defaultValue="PL-12"/>
        <label style={lbl}>Sold To (Buyer)</label>
        <input style={inp} placeholder="Farmer / company name"/>
        <label style={lbl}>Sale Amount (₹)</label>
        <input style={inp} type="number" placeholder="0"/>
        <label style={lbl}>Transport / Packing</label>
        <select style={inp}><option>Oxygen packed bags</option><option>Open truck</option><option>Insulated van</option></select>
        <label style={lbl}>Notes</label>
        <textarea style={{...inp, height:60, resize:"none"}} placeholder="Any observations during harvest..."/>
      </div>
      <button onClick={()=>setStep(3)} style={btn("linear-gradient(135deg,#22c55e,#00d4aa)")}>✅ Confirm Harvest</button>
    </div>
  );

  return (
    <div style={{ padding:"16px 14px", overflowY:"auto", height:"100%" }}>
      <div style={{ color:M.text, fontWeight:700, fontSize:15, marginBottom:4 }}>🎉 Harvest Ready Tanks</div>
      <div style={{ color:M.sub, fontSize:11, marginBottom:14 }}>Tanks with DOC ≥ 22 days are ready for harvest</div>

      {ready.length===0 ? (
        <div style={{ textAlign:"center", padding:"50px 20px" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>⏳</div>
          <div style={{ color:M.sub, fontSize:13 }}>No tanks ready for harvest yet</div>
        </div>
      ) : ready.map(t=>(
        <div key={t.id} style={{ background:M.card, borderRadius:14, padding:16, marginBottom:12, borderLeft:`3px solid ${M.amber}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <div style={{ color:M.text, fontWeight:700, fontSize:15 }}>{t.name}</div>
            <span style={pill(M.amber,M.amber,{fontSize:12})}>Day {t.doc} ✅</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
            {[["Batch",t.batch],["PL Stage",t.pl],["Count",(t.cnt/1000000).toFixed(1)+"M"],["Biomass Est.",t.bio+"kg"],["Survival",t.sr+"%"],["Shed",t.shed]].map(([l,v])=>(
              <div key={l} style={{ background:M.card2, borderRadius:8, padding:"8px 10px" }}>
                <div style={{ color:M.sub, fontSize:10 }}>{l}</div>
                <div style={{ color:M.text, fontSize:12, fontWeight:600, marginTop:2 }}>{v}</div>
              </div>
            ))}
          </div>
          <button onClick={()=>setStep(2)} style={btn("linear-gradient(135deg,#22c55e,#00d4aa)")}>🎉 Start Harvest Entry</button>
        </div>
      ))}

      <div style={{ background:M.card2, borderRadius:12, padding:14, marginTop:4, border:`1px solid ${M.teal}22` }}>
        <div style={{ color:M.teal, fontWeight:700, fontSize:12, marginBottom:6 }}>📋 Harvest Checklist</div>
        {["Nets and harvest equipment ready","Oxygen bags and packing ready","Buyer confirmed and transport arranged","Aeration in harvest tank prepared","Counting trays ready"].map((c,i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 0", borderBottom:i<4?"1px solid rgba(255,255,255,0.04)":"none" }}>
            <div style={{ width:16, height:16, borderRadius:4, border:"2px solid rgba(255,255,255,0.2)", flexShrink:0 }}/>
            <span style={{ color:M.sub, fontSize:11 }}>{c}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REPORTS SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function ReportsScreen() {
  const [submitted, setSubmitted] = useState(false);

  const logs = [
    { type:"Water",    tank:"T-01", note:"All params normal. Morning shift done.", time:"06:45 AM", icon:"💧", color:M.blue },
    { type:"Feed",     tank:"T-02", note:"Finisher 3mm – 18kg. Shrimp active.", time:"07:00 AM", icon:"🌾", color:M.amber },
    { type:"Water",    tank:"T-03", note:"DO 7.1 – excellent. Ammonia 0.05.", time:"07:20 AM", icon:"💧", color:M.blue },
    { type:"Medicine", tank:"T-03", note:"Probiotics 200g applied. Water response good.", time:"08:30 AM", icon:"💊", color:M.purple },
  ];

  if(submitted) return (
    <div style={{ padding:"60px 24px", textAlign:"center" }}>
      <div style={{ fontSize:56, marginBottom:12 }}>📋</div>
      <div style={{ color:M.teal, fontWeight:700, fontSize:18, marginBottom:8 }}>Daily Report Submitted!</div>
      <div style={{ color:M.sub, fontSize:13, marginBottom:24 }}>Manager can now view your full day report in the web app.</div>
      <button onClick={()=>setSubmitted(false)} style={btn("linear-gradient(135deg,#00d4aa,#0099ff)")}>View Logs</button>
    </div>
  );

  return (
    <div style={{ padding:"16px 14px", overflowY:"auto", height:"100%" }}>
      <div style={{ color:M.text, fontWeight:700, fontSize:15, marginBottom:4 }}>📋 Daily Report</div>
      <div style={{ color:M.sub, fontSize:11, marginBottom:14 }}>Summary of all activities today</div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16 }}>
        {[["Water Logs","6",M.blue,"💧"],["Feed Logs","4",M.amber,"🌾"],["Med Logs","1",M.purple,"💊"]].map(([l,v,c,ic])=>(
          <div key={l} style={{ background:M.card2, borderRadius:12, padding:"12px 8px", textAlign:"center" }}>
            <div style={{ fontSize:18 }}>{ic}</div>
            <div style={{ color:c, fontWeight:700, fontSize:20 }}>{v}</div>
            <div style={{ color:M.sub, fontSize:9 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* end of day report form */}
      <div style={{ background:M.card, borderRadius:14, padding:16, marginBottom:12 }}>
        <div style={{ color:M.text, fontWeight:700, marginBottom:10 }}>End of Day Summary</div>
        <label style={lbl}>Overall tank condition today</label>
        <select style={inp}><option>All Good – Normal</option><option>One tank needs attention</option><option>Multiple issues – escalate</option></select>
        <label style={lbl}>Any abnormal observations?</label>
        <textarea style={{...inp, height:70, resize:"none"}} placeholder="Describe any unusual behaviour, water colour change, shrimp mortality, equipment issues..."/>
        <label style={lbl}>Equipment issues</label>
        <textarea style={{...inp, height:50, resize:"none"}} placeholder="Pump, aerator, feeder issues..."/>
        <label style={lbl}>Tomorrow's plan</label>
        <textarea style={{...inp, height:50, resize:"none"}} placeholder="Any specific tasks planned..."/>
      </div>
      <button onClick={()=>setSubmitted(true)} style={btn("linear-gradient(135deg,#00d4aa,#0099ff)")}>📤 Submit Daily Report</button>

      <div style={{ color:M.sub, fontSize:11, fontWeight:600, letterSpacing:1, margin:"16px 0 8px" }}>TODAY'S ACTIVITY LOG</div>
      {logs.map((l,i)=>(
        <div key={i} style={{ background:M.card, borderRadius:12, padding:"11px 13px", marginBottom:7, display:"flex", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:l.color+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{l.icon}</div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span style={{ color:M.text, fontSize:12, fontWeight:700 }}>{l.type} – {l.tank}</span>
              <span style={{ color:M.sub, fontSize:10 }}>{l.time}</span>
            </div>
            <div style={{ color:M.sub, fontSize:11, marginTop:2 }}>{l.note}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NAV
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { id:"home",     icon:"🏠", label:"Home" },
  { id:"tanks",    icon:"🧪", label:"Tanks" },
  { id:"water",    icon:"💧", label:"Water" },
  { id:"feed",     icon:"🌾", label:"Feed" },
  { id:"medicine", icon:"💊", label:"Medicine" },
];

// ─────────────────────────────────────────────────────────────────────────────
// PHONE FRAME
// ─────────────────────────────────────────────────────────────────────────────
export default function NurseryTechMobile() {
  const [screen, setScreen] = useState("home");
  const go = s => setScreen(s);

  const screens = {
    home:     <HomeScreen go={go}/>,
    tanks:    <TanksScreen go={go}/>,
    water:    <WaterScreen/>,
    feed:     <FeedScreen/>,
    medicine: <MedicineScreen/>,
    harvest:  <HarvestScreen go={go}/>,
    reports:  <ReportsScreen/>,
  };

  const alerts = { tanks:1, medicine:2 };

  return (
    <div style={{ minHeight:"100vh", background:"#060e1f", display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"30px 20px", fontFamily:"Inter,sans-serif", gap:40, flexWrap:"wrap" }}>

      {/* phone */}
      <div>
        <div style={{ textAlign:"center", marginBottom:16 }}>
          <div style={{ color:M.teal, fontWeight:700, fontSize:16, letterSpacing:1 }}>📱 Nursery Technician App</div>
          <div style={{ color:M.sub, fontSize:12, marginTop:4 }}>Interactive UI Mockup</div>
        </div>

        <div style={{ width:360, background:"#111827", borderRadius:40, boxShadow:"0 30px 80px rgba(0,0,0,0.7), 0 0 0 2px rgba(255,255,255,0.08)", overflow:"hidden" }}>
          {/* status bar */}
          <div style={{ background:"#0a0f1e", height:44, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px" }}>
            <div style={{ color:M.sub, fontSize:11 }}>9:41 AM</div>
            <div style={{ width:80, height:16, background:"#0a0f1e", borderRadius:99, border:"2px solid #1a2235" }}/>
            <div style={{ color:M.sub, fontSize:11 }}>📶 🔋</div>
          </div>

          {/* top bar */}
          <div style={{ background:"#0d1525", padding:"10px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,#00d4aa,#0099ff)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>🦐</div>
              <div>
                <div style={{ color:M.text, fontSize:12, fontWeight:700 }}>AquaNursery</div>
                <div style={{ color:M.teal, fontSize:9, letterSpacing:1 }}>NURSERY TECH</div>
              </div>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <div style={{ position:"relative" }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background:M.red+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>🔔</div>
                <div style={{ position:"absolute", top:-3, right:-3, width:14, height:14, borderRadius:"50%", background:M.red, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:8, fontWeight:700 }}>4</div>
              </div>
              <div style={{ width:28, height:28, borderRadius:"50%", background:M.teal+"22", display:"flex", alignItems:"center", justifyContent:"center", color:M.teal, fontWeight:700, fontSize:11 }}>ST</div>
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
                {alerts[t.id] && screen!==t.id && <div style={{ position:"absolute", top:2, right:"18%", width:8, height:8, borderRadius:"50%", background:M.red }}/>}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginTop:14, textAlign:"center", color:M.sub, fontSize:12 }}>Click tabs to explore all screens</div>
      </div>

      {/* right panel */}
      <div style={{ maxWidth:280, paddingTop:60 }}>
        <div style={{ color:M.text, fontWeight:700, fontSize:15, marginBottom:16 }}>📋 App Screens</div>
        {[
          { icon:"🏠", name:"Home",           desc:"Daily task checklist, alerts (low DO, harvest ready, meds due), quick action buttons and KPI summary" },
          { icon:"🧪", name:"Tanks",          desc:"All tanks with real-time water params colour-coded (green/amber/red). Tap tank → full detail with batch info" },
          { icon:"💧", name:"Water Log",      desc:"Log temp, DO, pH, salinity, ammonia per tank per shift (morning/afternoon/night). Shows today's log history" },
          { icon:"🌾", name:"Feed Log",       desc:"Log feed type, quantity, feed rate per tank. Single tank or bulk all tanks. Tracks FCR automatically" },
          { icon:"💊", name:"Medicine",       desc:"3 tabs: Schedule (pending/done treatments), Log Treatment (type, category, dose, pre-conditions, symptoms, water change, after-plan), History (before→after comparison per treatment)" },
          { icon:"🎉", name:"Harvest",        desc:"Lists harvest-ready tanks (DOC≥22). Step-by-step harvest form — final count, biomass, SR, buyer, sale amount. Auto-creates invoice" },
          { icon:"📋", name:"Reports",        desc:"End-of-day report form for manager. Full activity log of all water/feed/medicine entries" },
        ].map((s,i)=>(
          <div key={i} style={{ background:M.card, borderRadius:12, padding:"12px 14px", marginBottom:8, display:"flex", gap:10, alignItems:"flex-start" }}>
            <span style={{ fontSize:22, flexShrink:0 }}>{s.icon}</span>
            <div>
              <div style={{ color:M.text, fontWeight:700, fontSize:12 }}>{s.name}</div>
              <div style={{ color:M.sub, fontSize:11, marginTop:2, lineHeight:1.5 }}>{s.desc}</div>
            </div>
          </div>
        ))}

        <div style={{ background:M.teal+"18", border:`1px solid ${M.teal}33`, borderRadius:12, padding:"12px 14px", marginTop:4 }}>
          <div style={{ color:M.teal, fontWeight:700, fontSize:12, marginBottom:6 }}>🔄 Data Flow</div>
          <div style={{ color:"#6ee7d4", fontSize:11, lineHeight:1.8 }}>
            Tech logs water → Manager sees live in web app<br/>
            Tech logs feed → FCR auto-calculated<br/>
            Tech logs medicine → Inventory deducted<br/>
            Tech records harvest → Invoice auto-created<br/>
            Manager sends task → Tech sees as alert
          </div>
        </div>
      </div>
    </div>
  );
}
