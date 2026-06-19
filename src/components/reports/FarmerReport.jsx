import { useApp } from "../../context/AppContext.jsx";
import { C, Badge } from "../common/ui.jsx";

const calcDOC = sd => sd ? Math.max(0, Math.floor((new Date() - new Date(sd)) / 864e5)) : 0;
const today = new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"long", year:"numeric" });
const todayISO = new Date().toISOString().slice(0,10);

const srColor  = sr => sr >= 85 ? "#16a34a" : sr >= 70 ? "#d97706" : "#dc2626";
const docColor = doc => doc >= 22 ? "#d97706" : doc >= 15 ? "#2563eb" : "#059669";
const statusLabel = doc => doc >= 22 ? "✅ Ready to Harvest" : doc >= 15 ? "🔵 Growing Well" : "🌱 Early Stage";
const statusColor = doc => doc >= 22 ? "#d97706" : doc >= 15 ? "#2563eb" : "#059669";

function PrintStyles() {
  return (
    <style>{`
      @media print {
        body * { visibility: hidden; }
        #farmer-report-print, #farmer-report-print * { visibility: visible; }
        #farmer-report-print { position: fixed; top: 0; left: 0; width: 100%; background: white !important; padding: 0 !important; }
        .no-print { display: none !important; }
        .print-table th, .print-table td { color: #111 !important; border-color: #ccc !important; }
        @page { size: A4 landscape; margin: 12mm; }
      }
    `}</style>
  );
}

export default function FarmerReport() {
  const { tanks, batches, water, sheds } = useApp();

  const activeBatches = batches
    .filter(b => b.status !== "harvested")
    .map(b => {
      const doc = calcDOC(b.sd);
      const tank = tanks.find(t => t.id === b.tId);
      const shed = sheds.find(s => s.id === tank?.shedId);
      const latestWater = water
        .filter(w => w.tId === b.tId)
        .sort((a, z) => new Date(z.date) - new Date(a.date))[0];
      return { ...b, doc, tank, shed, latestWater };
    })
    .filter(b => b.doc <= 35)
    .sort((a, b) => b.doc - a.doc);

  const readyBatches  = activeBatches.filter(b => b.doc >= 22);
  const growingBatches = activeBatches.filter(b => b.doc < 22);

  return (
    <>
      <PrintStyles />
      <div className="print-page" style={{ padding:"24px", background:C.bg, minHeight:"100vh" }}>

        {/* Toolbar — hidden on print */}
        <div className="no-print" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div>
            <h2 style={{ color:C.text, fontSize:18, fontWeight:700, margin:"0 0 4px" }}>🌾 Farmer Culture Report</h2>
            <p style={{ color:C.sub, fontSize:12, margin:0 }}>Share with farmers for sale — shows all active batches with live data</p>
          </div>
          <button
            onClick={() => window.print()}
            style={{ background:"linear-gradient(135deg,#00d4aa,#0099ff)", color:"#000", fontWeight:700, fontSize:14, padding:"10px 24px", borderRadius:10, border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
            🖨️ Print / Save PDF
          </button>
        </div>

        {/* ── PRINTABLE CONTENT ── */}
        <div id="farmer-report-print" style={{ background:"white", borderRadius:12, padding:"32px 36px", boxShadow:"0 2px 20px rgba(0,0,0,0.15)" }}>

          {/* Header */}
          <div className="print-header" style={{ borderBottom:"3px solid #0ea5e9", paddingBottom:16, marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
                <div style={{ width:44, height:44, borderRadius:10, background:"linear-gradient(135deg,#00d4aa,#0099ff)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>🦐</div>
                <div>
                  <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:"#0f172a" }}>AquaNursery Pro</h1>
                  <p style={{ margin:0, fontSize:11, color:"#64748b", letterSpacing:1 }}>SHRIMP NURSERY MANAGEMENT</p>
                </div>
              </div>
              <h2 style={{ margin:"8px 0 0", fontSize:16, fontWeight:700, color:"#0ea5e9" }}>🌾 Culture Stock Report — For Farmers</h2>
            </div>
            <div style={{ textAlign:"right" }}>
              <p style={{ margin:0, fontSize:12, color:"#64748b" }}>Report Date</p>
              <p style={{ margin:0, fontSize:15, fontWeight:700, color:"#0f172a" }}>{today}</p>
              <p style={{ margin:"6px 0 0", fontSize:11, color:"#64748b" }}>Stocking Day 1 → Harvest Day 22–25</p>
            </div>
          </div>

          {/* Summary boxes */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:28 }}>
            {[
              { label:"Total Active Batches", value:activeBatches.length, color:"#0ea5e9", icon:"🐟" },
              { label:"Ready for Harvest", value:readyBatches.length, color:"#d97706", icon:"✅" },
              { label:"Total PLs Available", value:readyBatches.reduce((s,b)=>s+(b.cnt||0),0).toLocaleString("en-IN"), color:"#16a34a", icon:"🦐" },
              { label:"Avg Survival Rate", value: activeBatches.length ? (activeBatches.reduce((s,b)=>s+(b.sr||0),0)/activeBatches.length).toFixed(1)+"%" : "—", color:"#7c3aed", icon:"📈" },
            ].map(s => (
              <div key={s.label} style={{ border:`2px solid ${s.color}30`, borderRadius:10, padding:"14px 16px", background:`${s.color}08` }}>
                <div style={{ fontSize:20, marginBottom:4 }}>{s.icon}</div>
                <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:10, color:"#64748b", fontWeight:600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Ready for Harvest */}
          {readyBatches.length > 0 && (
            <div style={{ marginBottom:28 }}>
              <div style={{ background:"#d97706", color:"white", padding:"8px 16px", borderRadius:"8px 8px 0 0", fontWeight:700, fontSize:13, display:"flex", alignItems:"center", gap:8 }}>
                ✅ READY FOR HARVEST — D22 to D30 ({readyBatches.length} batch{readyBatches.length>1?"es":""})
              </div>
              <BatchTable batches={readyBatches} highlight />
            </div>
          )}

          {/* Growing */}
          {growingBatches.length > 0 && (
            <div style={{ marginBottom:28 }}>
              <div style={{ background:"#0ea5e9", color:"white", padding:"8px 16px", borderRadius:"8px 8px 0 0", fontWeight:700, fontSize:13 }}>
                🌱 GROWING — Available in upcoming days ({growingBatches.length} batch{growingBatches.length>1?"es":""})
              </div>
              <BatchTable batches={growingBatches} />
            </div>
          )}

          {activeBatches.length === 0 && (
            <div style={{ textAlign:"center", padding:"48px", color:"#94a3b8", fontSize:14 }}>
              No active batches at this time.
            </div>
          )}

          {/* Water quality note */}
          <div style={{ marginTop:8, padding:"12px 16px", background:"#f0f9ff", borderRadius:8, border:"1px solid #bae6fd" }}>
            <p style={{ margin:0, fontSize:11, color:"#0369a1", fontWeight:600 }}>📌 Note for Farmers</p>
            <p style={{ margin:"4px 0 0", fontSize:11, color:"#0369a1" }}>
              Please ensure your pond salinity matches within ±3 ppt of nursery salinity before transfer. Acclimatize PLs gradually.
              Contact us 2–3 days before planned stocking date to confirm availability.
            </p>
          </div>

          {/* Footer */}
          <div style={{ marginTop:24, paddingTop:14, borderTop:"1px solid #e2e8f0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <p style={{ margin:0, fontSize:10, color:"#94a3b8" }}>Generated by AquaNursery Pro • {todayISO}</p>
            <p style={{ margin:0, fontSize:10, color:"#94a3b8" }}>Day 1 = Stocking Date • Harvest Window = D22 to D25</p>
          </div>
        </div>
      </div>
    </>
  );
}

function BatchTable({ batches, highlight }) {
  const thStyle = {
    padding:"9px 12px", fontSize:10, fontWeight:700, textAlign:"left",
    background: highlight ? "#fef3c7" : "#f8fafc",
    color: highlight ? "#92400e" : "#475569",
    borderBottom:"2px solid "+(highlight?"#fbbf24":"#e2e8f0"),
    whiteSpace:"nowrap",
  };
  const tdStyle = (color="#0f172a", bold=false) => ({
    padding:"9px 12px", fontSize:11, color, fontWeight:bold?700:400,
    borderBottom:"1px solid #f1f5f9", whiteSpace:"nowrap",
  });

  return (
    <div style={{ overflowX:"auto", border:"1px solid "+(highlight?"#fbbf24":"#e2e8f0"), borderTop:"none", borderRadius:"0 0 8px 8px" }}>
      <table className="print-table" style={{ width:"100%", borderCollapse:"collapse", minWidth:900 }}>
        <thead>
          <tr>
            {["Tank","Shed","Batch No","Stocking Date","DOC","PL Stage","Count (PLs)","SR %","Biomass","Temp °C","Salinity ppt","DO mg/L","pH","Harvest Window","Status"].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {batches.map(b => {
            const harvestDate = b.sd ? new Date(new Date(b.sd).getTime() + 22*864e5).toLocaleDateString("en-IN",{day:"2-digit",month:"short"}) : "—";
            const lw = b.latestWater;
            return (
              <tr key={b.id} style={{ background: highlight && b.doc >= 22 ? "#fffbeb" : "white" }}>
                <td style={tdStyle("#0369a1", true)}>{b.tank?.name || "—"}</td>
                <td style={tdStyle("#64748b")}>{b.shed?.name || b.tank?.shed || "—"}</td>
                <td style={tdStyle("#0f172a", true)}>{b.no}</td>
                <td style={tdStyle("#64748b")}>{b.sd || "—"}</td>
                <td style={{ ...tdStyle(docColor(b.doc), true) }}>D{b.doc}</td>
                <td style={tdStyle("#7c3aed", true)}>{b.pl}</td>
                <td style={tdStyle("#0f172a", true)}>{((b.cnt||0)/1000).toFixed(0)}K</td>
                <td style={tdStyle(srColor(b.sr||0), true)}>{b.sr||0}%</td>
                <td style={tdStyle("#d97706")}>{b.bio ? b.bio+" kg" : "—"}</td>
                <td style={tdStyle(lw?.temp ? "#0369a1" : "#cbd5e1")}>{lw?.temp ?? "—"}</td>
                <td style={tdStyle(lw?.sal  ? "#0369a1" : "#cbd5e1")}>{lw?.sal  ?? "—"}</td>
                <td style={tdStyle(lw?.doV  ? (lw.doV<5?"#dc2626":"#16a34a") : "#cbd5e1", !!lw?.doV)}>{lw?.doV  ?? "—"}</td>
                <td style={tdStyle(lw?.ph   ? "#0369a1" : "#cbd5e1")}>{lw?.ph   ?? "—"}</td>
                <td style={tdStyle("#059669", true)}>From {harvestDate}</td>
                <td style={{ padding:"9px 12px", borderBottom:"1px solid #f1f5f9" }}>
                  <span style={{ background: statusColor(b.doc)+"18", color: statusColor(b.doc), fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:99, whiteSpace:"nowrap" }}>
                    {statusLabel(b.doc)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
