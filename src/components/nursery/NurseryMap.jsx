
import { useApp } from "../../context/AppContext.jsx";
import { C, Card } from "../common/ui.jsx";

const ST = {
  active:      { bg:"rgba(0,212,170,0.12)",  border:"#00d4aa40", dot:"#00d4aa" },
  harvest:     { bg:"rgba(245,158,11,0.12)", border:"#f59e0b40", dot:"#f59e0b" },
  harvested:   { bg:"rgba(34,197,94,0.10)",  border:"#22c55e40", dot:"#22c55e" },
  empty:       { bg:"rgba(30,58,95,0.25)",   border:"#1e3a5f50", dot:"#4a6080" },
  maintenance: { bg:"rgba(239,68,68,0.10)",  border:"#ef444440", dot:"#ef4444" },
};

const calcDOC = sd => sd ? Math.max(0, Math.floor((new Date() - new Date(sd)) / 864e5)) : 0;
const HARVEST_START = 22;  // harvest window opens
const HARVEST_END   = 30;  // last harvest day — after this show "Harvested"
const STALE_DOC     = 35;  // beyond this treat tank as empty

const ST_HARVESTED = { bg:"rgba(34,197,94,0.10)", border:"#22c55e40", dot:"#22c55e" };

const tankStatus = (tank, batch) => {
  if (!batch) return tank.status === "maintenance" ? "maintenance" : "empty";
  const doc = calcDOC(batch.sd);
  if (doc > STALE_DOC) return "empty";
  if (doc > HARVEST_END) return "harvested";
  if (doc >= HARVEST_START) return "harvest";
  return "active";
};

const docLabel = doc => doc >= HARVEST_START ? (doc > HARVEST_END ? "Harvested" : "Ready D"+doc) : "D"+doc;

function CircleTank({ tank, batch }) {
  const doc  = batch ? calcDOC(batch.sd) : 0;
  const eff  = tankStatus(tank, batch);
  const st   = ST[eff] || ST.empty;
  const pct  = batch ? Math.min(doc / 25 * 207, 207) : 0;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5, cursor:"pointer" }}>
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r="42" fill={st.bg} stroke={st.dot} strokeWidth="1.5"
          strokeDasharray={eff==="empty"?"4,3":"none"} opacity={eff==="empty"?.5:1}/>
        {batch && (
          <circle cx="45" cy="45" r="34" fill="none" stroke={st.dot} strokeWidth="4"
            opacity=".2" strokeDasharray={pct+" 213"} strokeLinecap="round" transform="rotate(-90 45 45)"/>
        )}
        <text x="45" y="41" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="700">{tank.name}</text>
        {batch && eff !== "empty" ? (<>
          <text x="45" y="54" textAnchor="middle" fill={st.dot} fontSize={eff==="harvested"?8:10} fontWeight="700">{eff==="harvested"?"✓ Done":docLabel(doc)}</text>
          <text x="45" y="64" textAnchor="middle" fill="#64748b" fontSize="8">{batch.pl}</text>
        </>) : (
          <text x="45" y="54" textAnchor="middle" fill="#4a6080" fontSize="9">{eff}</text>
        )}
        <circle cx="74" cy="16" r="5" fill={st.dot}/>
      </svg>
      {batch && eff === "active" && (
        <div style={{ textAlign:"center" }}>
          <div style={{ color:"#64748b", fontSize:9 }}>{((batch.cnt||0)/1000).toFixed(0)}K PLs</div>
          <div style={{ color:"#f59e0b", fontSize:9 }}>{batch.bio||"—"}kg | FCR {batch.fcr||"—"}</div>
        </div>
      )}
    </div>
  );
}

function RectTank({ tank, batch }) {
  const doc = batch ? calcDOC(batch.sd) : 0;
  const eff = tankStatus(tank, batch);
  const st  = ST[eff] || ST.empty;
  return (
    <div style={{ background:st.bg, border:"1px solid "+st.border, borderRadius:8, padding:"8px 10px", minWidth:110, cursor:"pointer" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
        <span style={{ color:"#e2e8f0", fontSize:12, fontWeight:700 }}>{tank.name}</span>
        <span style={{ width:7, height:7, borderRadius:"50%", background:st.dot, display:"block", boxShadow:"0 0 5px "+st.dot }}/>
      </div>
      {batch && eff !== "empty" ? (<>
        <div style={{ color:st.dot, fontSize:11, fontWeight:700 }}>
          {eff==="harvested" ? "✓ Harvested Completed" : "DOC "+docLabel(doc)}
        </div>
        {eff !== "harvested" && <>
          <div style={{ color:"#64748b", fontSize:10 }}>{batch.pl} • {((batch.cnt||0)/1000).toFixed(0)}K</div>
          <div style={{ color:"#f59e0b", fontSize:10 }}>{batch.bio||"—"}kg | FCR {batch.fcr||"—"}</div>
          <div style={{ color:"#22c55e", fontSize:10 }}>SR {batch.sr||0}%</div>
          <div style={{ height:3, borderRadius:2, background:"rgba(255,255,255,0.08)", marginTop:5 }}>
            <div style={{ height:"100%", width:Math.min(doc/HARVEST_END*100,100)+"%", borderRadius:2, background:st.dot }}/>
          </div>
        </>}
        {eff === "harvested" && <div style={{ color:"#64748b", fontSize:9, marginTop:2 }}>Tank available soon</div>}
      </>) : (
        <div style={{ color:"#4a6080", fontSize:10, marginTop:4 }}>{eff}</div>
      )}
    </div>
  );
}

export default function NurseryMap() {
  const { sheds, tanks, batches } = useApp();

  // Build a map: tankId → active batch (not harvested)
  const activeBatchByTank = {};
  batches.filter(b => b.status !== "harvested").forEach(b => {
    activeBatchByTank[b.tId] = b;
  });

  const effStatus = t => {
    const b = activeBatchByTank[t.id];
    return tankStatus(t, b);
  };

  const stats = [
    { l:"Total",            v:tanks.length,                                                              c:C.blue   },
    { l:"Active",           v:tanks.filter(t=>effStatus(t)==="active").length,                           c:C.teal   },
    { l:"Harvest Ready",    v:tanks.filter(t=>effStatus(t)==="harvest").length,                          c:C.amber  },
    { l:"Harvested",        v:tanks.filter(t=>effStatus(t)==="harvested").length,                        c:"#22c55e"},
    { l:"Empty",            v:tanks.filter(t=>effStatus(t)==="empty").length,                            c:C.sub    },
    { l:"Maintenance",      v:tanks.filter(t=>effStatus(t)==="maintenance").length,                      c:C.red    },
  ];

  return (
    <div style={{ padding:"20px 24px" }}>
      {/* Summary pills */}
      <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
        {stats.map(s => (
          <div key={s.l} style={{ background:C.card, borderRadius:10, padding:"10px 16px", flex:1, minWidth:80, border:"1px solid "+s.c+"25", textAlign:"center" }}>
            <div style={{ color:s.c, fontSize:20, fontWeight:700 }}>{s.v}</div>
            <div style={{ color:C.sub, fontSize:9, marginTop:2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display:"flex", gap:14, marginBottom:18, flexWrap:"wrap" }}>
        {Object.entries(ST).map(([k,v]) => (
          <div key={k} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:v.dot, display:"block" }}/>
            <span style={{ color:C.sub, fontSize:11 }}>{k}</span>
          </div>
        ))}
        <span style={{ color:C.sub, fontSize:10, marginLeft:8 }}>● Circle = Culture  ■ Rectangle = Treatment</span>
      </div>

      {/* Empty state */}
      {sheds.length === 0 && (
        <div style={{ textAlign:"center", padding:"60px 20px", color:C.sub }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🏗️</div>
          <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:8 }}>No Sheds or Tanks Yet</div>
          <div style={{ fontSize:13, marginBottom:4 }}>Go to <b style={{color:C.teal}}>Settings → Sheds & Tanks</b> to add your nursery layout first.</div>
          <div style={{ fontSize:12 }}>Once sheds and tanks are added, the map will display here automatically.</div>
        </div>
      )}

      {/* Sheds */}
      {sheds.map(shed => {
        const shedTanks = tanks.filter(t => t.shedId === shed.id);
        const activeCount = shedTanks.filter(t => effStatus(t) === "active").length;
        return (
          <div key={shed.id} style={{ background:C.card, borderRadius:14, padding:"18px 20px", marginBottom:14, border:"1px solid "+shed.color+"25" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
              <div style={{ width:9, height:9, borderRadius:"50%", background:shed.color }}/>
              <h3 style={{ color:C.text, fontSize:14, fontWeight:700, margin:0 }}>{shed.name}</h3>
              <span style={{ background:shed.color+"18", color:shed.color, fontSize:10, padding:"2px 9px", borderRadius:99, fontWeight:600 }}>
                {shed.type==="culture"?"🔵 CULTURE":"🟣 TREATMENT"} • {(shed.shape||"").toUpperCase()}
              </span>
              <span style={{ color:C.sub, fontSize:11 }}>{shed.desc}</span>
              <span style={{ marginLeft:"auto", color:C.sub, fontSize:11 }}>{activeCount} active / {shedTanks.length} tanks</span>
            </div>
            <div style={{ display:"flex", gap:14, flexWrap:"wrap", alignItems:"flex-start" }}>
              {shedTanks.map(tank => {
                const batch = activeBatchByTank[tank.id] || null;
                return tank.shape === "circle"
                  ? <CircleTank key={tank.id} tank={tank} batch={batch}/>
                  : <RectTank   key={tank.id} tank={tank} batch={batch}/>;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
