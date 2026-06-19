import { useApp } from "../../context/AppContext.jsx";
import { C, KPI, Card, SHead, Badge } from "../common/ui.jsx";

export default function StockingHistory() {
  const { tanks, batches } = useApp();
  const hist = [...batches.filter(b => b.status === "harvested")]
    .sort((a,b) => (b.hd||b.harvest||"").localeCompare(a.hd||a.harvest||""));

  const totalSold    = hist.reduce((s,b) => s+(b.saleAmt||0), 0);
  const totalInvest  = hist.reduce((s,b) => s+(b.cost||0), 0);
  const avgDOC       = hist.length ? (hist.reduce((s,b) => s+(b.doc||0), 0) / hist.length).toFixed(1) : 0;
  const avgSR        = hist.length ? (hist.reduce((s,b) => s+(b.sr||0), 0) / hist.length).toFixed(1) : 0;

  return (
    <div style={{ padding:"20px 24px" }}>
      <div style={{ marginBottom:20 }}>
        <h2 style={{ color:C.text, fontSize:18, fontWeight:700, margin:"0 0 4px" }}>✅ Harvest History</h2>
        <p style={{ color:C.sub, fontSize:12, margin:0 }}>Completed batches — full culture performance summary</p>
      </div>

      <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
        <KPI label="Completed Batches" value={hist.length}                                              sub="harvested"       color={C.green}  icon="✅"/>
        <KPI label="Total Sale Value"  value={"₹"+(totalSold/100000).toFixed(2)+"L"}                   sub="revenue"         color={C.teal}   icon="💰"/>
        <KPI label="Total PL Cost"     value={"₹"+(totalInvest/100000).toFixed(2)+"L"}                 sub="investment"      color={C.blue}   icon="📥"/>
        <KPI label="Avg DOC"           value={avgDOC+" days"}                                           sub="culture period"  color={C.amber}  icon="📅"/>
        <KPI label="Avg Survival"      value={avgSR+"%"}                                                sub="across harvests" color={C.purple} icon="📈"/>
      </div>

      <Card>
        <SHead title={`Harvested Batches (${hist.length})`}/>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:900 }}>
            <thead>
              <tr style={{ background:"rgba(255,255,255,0.025)" }}>
                {["#","Tank","Batch No","Stocking Date","Harvest Date","PL Stage","PL Stocked","DOC","Biomass","FCR","Survival %","PL Cost","Sale Amount","Hatchery"].map(h=>(
                  <th key={h} style={{ padding:"10px 14px 10px 0", color:C.sub, fontSize:10, fontWeight:700, textAlign:"left", textTransform:"uppercase", letterSpacing:.6, borderBottom:"1px solid "+C.border, whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hist.length === 0 && (
                <tr><td colSpan={14} style={{ textAlign:"center", padding:"50px", color:C.sub, fontSize:13 }}>
                  No harvested batches yet.
                </td></tr>
              )}
              {hist.map((b, idx) => {
                const t  = tanks.find(x => x.id === b.tId);
                const sr = b.sr||0;
                const srColor = sr>=85?C.green:sr>=70?C.amber:C.red;
                const fcr = b.fcr;
                const fcrColor = !fcr?"—": fcr<=1.2?C.green:fcr<=1.6?C.amber:C.red;
                return (
                  <tr key={b.id}
                      style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={c(C.sub)}>{idx+1}</td>
                    <td style={c(C.blue,true)}>{t?.name||"T-"+b.tId}</td>
                    <td style={c(C.text,true)}>{b.no}</td>
                    <td style={c(C.sub)}>{b.sd||"—"}</td>
                    <td style={c(C.green)}>{b.hd||b.harvest||"—"}</td>
                    <td style={{ padding:"10px 14px 10px 0" }}><Badge label={b.pl} color={C.teal}/></td>
                    <td style={c(C.blue,true)}>{((b.cnt||0)/1000).toFixed(0)}K</td>
                    <td style={c(C.amber,true)}>{b.doc||0}</td>
                    <td style={c(C.amber,true)}>{b.bio||0} kg</td>
                    <td style={{ padding:"10px 14px 10px 0", color:fcr?fcrColor:C.sub, fontWeight:fcr?700:400, fontSize:12 }}>{fcr||"—"}</td>
                    <td style={{ padding:"10px 14px 10px 0" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ width:44, height:5, borderRadius:99, background:"rgba(255,255,255,0.08)" }}>
                          <div style={{ width:Math.min(100,sr)+"%", height:"100%", borderRadius:99, background:srColor }}/>
                        </div>
                        <span style={{ color:srColor, fontWeight:700, fontSize:12 }}>{sr}%</span>
                      </div>
                    </td>
                    <td style={c(C.purple,true)}>₹{(b.cost||0).toLocaleString("en-IN")}</td>
                    <td style={c(b.saleAmt?C.teal:C.sub, !!b.saleAmt)}>
                      {b.saleAmt ? "₹"+b.saleAmt.toLocaleString("en-IN") : "—"}
                    </td>
                    <td style={c(C.sub)}>{b.hatch||"—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

const c = (color=C.text, bold=false) => ({
  padding:"10px 14px 10px 0", color, fontWeight:bold?700:400, fontSize:12, whiteSpace:"nowrap",
});
