import { useMemo, useState } from "react";
import { useApp } from "../../context/AppContext.jsx";
import { C, KPI, Card, SHead, Badge, FRow, FSelect, FormBox, FGrid, Field, inp } from "../common/ui.jsx";

/* Colour helpers */
const ok   = (v, lo, hi) => v >= lo && v <= hi;
const cWater = (v, lo, hi, wlo, whi) => {
  if (v == null || v === "") return C.sub;
  if (!ok(v, lo, hi)) return C.red;
  if (wlo != null && (!ok(v, wlo, whi))) return C.amber;
  return C.teal;
};
const srColor  = sr => sr >= 85 ? C.green : sr >= 70 ? C.amber : C.red;
const calcDOC  = sd => { if(!sd) return 0; return Math.max(0, Math.floor((new Date()-new Date(sd))/(1000*60*60*24))); };
const fcrColor = fcr => fcr <= 1.2 ? C.green : fcr <= 1.6 ? C.amber : C.red;

function Pill({ label, color }) {
  return (
    <span style={{ display:"inline-block", padding:"1px 8px", borderRadius:99, background:color+"18", color, fontSize:10, fontWeight:700, whiteSpace:"nowrap" }}>{label}</span>
  );
}

function WaterCell({ v, unit="", lo, hi, wlo, whi }) {
  const color = cWater(+v, lo, hi, wlo, whi);
  const empty = v == null || v === "";
  return (
    <td style={{ padding:"11px 14px 11px 0", color: empty ? "rgba(255,255,255,0.18)" : color, fontWeight:600, fontSize:12 }}>
      {empty ? "—" : v + unit}
    </td>
  );
}

function SRBar({ sr }) {
  const color = srColor(sr);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:7, minWidth:90 }}>
      <div style={{ flex:1, height:6, borderRadius:99, background:"rgba(255,255,255,0.08)" }}>
        <div style={{ width:Math.min(100,sr||0)+"%", height:"100%", borderRadius:99, background:color, transition:"width .4s" }}/>
      </div>
      <span style={{ color, fontWeight:700, fontSize:12, minWidth:30 }}>{sr}%</span>
    </div>
  );
}

export default function StockingRunning() {
  const { tanks, batches, sheds, water, updateBatch } = useApp();
  const [fShed, setFShed] = useState("all");
  const [harvestForm, setHarvestForm] = useState(null); // null = closed, batch object = open
  const [hForm, setHForm] = useState({});
  const [hSaving, setHSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  function openHarvest(b) {
    const autoSR = b.stocked ? ((b.cnt || 0) / b.stocked * 100).toFixed(1) : (b.sr || "");
    setHForm({
      harvestDate: today,
      bio: b.bio || "",
      cnt: b.cnt || "",
      sr: autoSR,
      soldTo: "",
      saleAmt: "",
      notes: "",
    });
    setHarvestForm(b);
  }

  async function saveHarvest() {
    if (!harvestForm) return;
    setHSaving(true);
    await updateBatch(harvestForm.id, {
      ...harvestForm,
      status: "harvested",
      hd: hForm.harvestDate,
      bio: hForm.bio,
      sr: hForm.sr,
      saleAmt: hForm.saleAmt,
      soldTo: hForm.soldTo,
    });
    setHSaving(false);
    setHarvestForm(null);
  }

  const active = batches.filter(b => b.status !== "harvested");

  /* Latest water reading per tank */
  const latestWater = useMemo(() => {
    const map = {};
    water.forEach(w => {
      if (!map[w.tId] || new Date(w.date) >= new Date(map[w.tId].date)) map[w.tId] = w;
    });
    return map;
  }, [water]);

  const list = active.filter(b => {
    if (fShed === "all") return true;
    return tanks.find(x => x.id === b.tId)?.shedId === +fShed;
  }).sort((a, b) => (b.sd||"").localeCompare(a.sd||""));

  /* Summary stats */
  const totalBio  = list.reduce((s,b) => s + (b.bio||0), 0);
  const avgSR     = list.length ? (list.reduce((s,b) => s + (b.sr||0), 0) / list.length).toFixed(1) : 0;
  const avgFCR    = list.filter(b=>b.fcr).length
                    ? (list.filter(b=>b.fcr).reduce((s,b) => s + b.fcr, 0) / list.filter(b=>b.fcr).length).toFixed(2) : "—";
  const readyCount = list.filter(b => calcDOC(b.sd) >= 22).length;

  return (
    <div style={{ padding:"20px 24px" }}>
      <div style={{ marginBottom:20 }}>
        <h2 style={{ color:C.text, fontSize:18, fontWeight:700, margin:"0 0 4px" }}>📡 Running Stock Monitor</h2>
        <p style={{ color:C.sub, fontSize:12, margin:0 }}>Live view of all active batches — water parameters, FCR, biomass and survival</p>
      </div>

      {/* KPIs */}
      <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
        <KPI label="Active Batches"  value={list.length}                                                          sub="in culture"     color={C.teal}   icon="🐟"/>
        <KPI label="Total Biomass"   value={totalBio.toFixed(1)+" kg"}                                           sub="estimated"      color={C.amber}  icon="⚖️"/>
        <KPI label="Avg Survival"    value={avgSR+"%"}                                                            sub="across batches" color={C.green}  icon="📈"/>
        <KPI label="Avg FCR"         value={avgFCR}                                                               sub="feed ratio"     color={C.blue}   icon="📊"/>
        <KPI label="Harvest Ready"   value={readyCount}                                                           sub="DOC ≥ 22 days"  color={C.amber}  icon="⏰"/>
        <KPI label="Total PLs"       value={(list.reduce((s,b)=>s+(b.cnt||0),0)/1000000).toFixed(2)+"M"}        sub="in nursery"     color={C.purple} icon="🦐"/>
      </div>

      {/* Filter */}
      <div style={{ marginBottom:14 }}>
        <FRow>
          <FSelect label="Shed:" value={fShed} onChange={setFShed}>
            <option value="all">All Sheds</option>
            {sheds.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </FSelect>
        </FRow>
      </div>

      {/* Legend */}
      <div style={{ display:"flex", gap:20, marginBottom:14, flexWrap:"wrap" }}>
        {[["🟢","Normal / Good"],["🟡","Caution"],["🔴","Out of range"],["⬜","No reading"]].map(([ic,lb])=>(
          <span key={lb} style={{ color:C.sub, fontSize:11 }}>{ic} {lb}</span>
        ))}
      </div>

      {/* Main table */}
      <Card>
        <SHead title={`Active Batches (${list.length})`}/>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:1100 }}>
            <thead>
              {/* Group header row */}
              <tr>
                <th colSpan={5} style={gHead(C.teal)}>🐟 Batch</th>
                <th colSpan={6} style={gHead(C.blue)}>💧 Latest Water Parameters</th>
                <th colSpan={5} style={gHead(C.amber)}>📊 Performance</th>
                <th colSpan={1} style={gHead(C.sub)}>Status</th>
                <th colSpan={1} style={gHead(C.green)}>Action</th>
              </tr>
              {/* Column header row */}
              <tr style={{ background:"rgba(255,255,255,0.025)" }}>
                {[
                  "Tank","Shed","Batch No","PL Stage","DOC",
                  "Temp °C","Salinity ppt","DO mg/L","pH","Ammonia ppm","Reading Date",
                  "PL Count","Biomass kg","Survival %","FCR","Density PLs/L",
                  "Status","Harvest",
                ].map(h=>(
                  <th key={h} style={colHead}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr>
                  <td colSpan={17} style={{ textAlign:"center", padding:"50px", color:C.sub, fontSize:13 }}>
                    No active batches found. Add one from <b style={{ color:C.teal }}>New Stocking</b>.
                  </td>
                </tr>
              )}
              {list.map(b => {
                const t   = tanks.find(x => x.id === b.tId);
                const lw  = latestWater[b.tId];
                const doc = calcDOC(b.sd);
                const eff = doc >= 22 ? "harvest-ready" : b.status;
                const stc = eff==="harvest-ready" ? C.amber : eff==="active" ? C.teal : C.green;
                const docColor = doc>=22 ? C.amber : doc>=15 ? C.blue : C.teal;
                return (
                  <tr key={b.id}
                      style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.025)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    {/* Batch */}
                    <td style={cell(C.blue, true)}>{t?.name || "T-"+b.tId}</td>
                    <td style={cell(C.sub)}>{t?.shed || "—"}</td>
                    <td style={cell(C.text, true)}>{b.no}</td>
                    <td style={{ padding:"11px 14px 11px 0" }}><Badge label={b.pl} color={C.teal}/></td>
                    <td style={cell(docColor, true, 14)}>D{doc}</td>

                    {/* Water — colour coded */}
                    <WaterCell v={lw?.temp}  unit="°C"  lo={26} hi={32} wlo={27} whi={31}/>
                    <WaterCell v={lw?.sal}   unit=" ppt" lo={15} hi={40} wlo={20} whi={35}/>
                    <WaterCell v={lw?.doV}   unit=" mg/L" lo={5}  hi={20} wlo={6}  whi={15}/>
                    <WaterCell v={lw?.ph}    unit=""     lo={7.5} hi={8.5} wlo={7.8} whi={8.3}/>
                    <WaterCell v={lw?.amm}   unit=" ppm" lo={0}  hi={0.5} wlo={0} whi={0.25}/>
                    <td style={{ padding:"11px 14px 11px 0", color:C.sub, fontSize:10 }}>{lw?.date || <span style={{ color:"rgba(255,255,255,0.18)" }}>No data</span>}</td>

                    {/* Performance */}
                    <td style={cell(C.text)}>{((b.cnt||0)/1000).toFixed(0)}K</td>
                    <td style={cell(b.bio ? C.amber : C.sub, !!b.bio)}>{b.bio ? b.bio+" kg" : "—"}</td>
                    <td style={{ padding:"11px 14px 11px 0" }}><SRBar sr={b.sr||0}/></td>
                    <td style={{ padding:"11px 14px 11px 0", color:b.fcr ? fcrColor(b.fcr) : C.sub, fontWeight:b.fcr?700:400, fontSize:12 }}>{b.fcr||"—"}</td>

                    {/* Density */}
                    {(()=>{
                      const vol = t?.volumeL || 0;
                      const density = vol > 0 ? Math.round((b.cnt||0) / vol) : null;
                      const dc = density == null ? C.sub : density > 250 ? C.red : density > 200 ? C.amber : density >= 100 ? C.teal : C.blue;
                      return <td style={cell(dc, density!=null, 12)}>{density != null ? density+" /L" : "—"}</td>;
                    })()}
                    {/* Status */}
                    <td style={{ padding:"11px 0" }}><Badge label={eff} color={stc}/></td>

                    {/* Harvest action */}
                    <td style={{ padding:"11px 0" }}>
                      {doc >= 22 ? (
                        <button
                          onClick={() => openHarvest(b)}
                          style={{ background:"linear-gradient(135deg,#22c55e,#16a34a)", color:"#fff", border:"none", borderRadius:8, padding:"5px 14px", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                          🎉 Harvest
                        </button>
                      ) : (
                        <button
                          disabled
                          title="Available from D22"
                          style={{ background:"#1e2d3d", color:"#4a6a8a", border:"none", borderRadius:8, padding:"5px 14px", fontSize:12, fontWeight:700, cursor:"default" }}>
                          Harvest
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Harvest form modal */}
      {harvestForm && (
        <FormBox
          title={`🎉 Harvest — ${harvestForm.no}`}
          onClose={() => setHarvestForm(null)}
          onSave={saveHarvest}
          saving={hSaving}>
          <FGrid cols={2}>
            <Field label="Harvest Date">
              <input type="date" style={inp} value={hForm.harvestDate}
                onChange={e => setHForm(f => ({ ...f, harvestDate: e.target.value }))}/>
            </Field>
            <Field label="Final Biomass (kg)">
              <input type="number" style={inp} value={hForm.bio} placeholder="e.g. 12.5"
                onChange={e => setHForm(f => ({ ...f, bio: e.target.value }))}/>
            </Field>
            <Field label="Final Count (PLs)">
              <input type="number" style={inp} value={hForm.cnt} placeholder="e.g. 850000"
                onChange={e => {
                  const cnt = e.target.value;
                  const autoSR = harvestForm.stocked ? (cnt / harvestForm.stocked * 100).toFixed(1) : hForm.sr;
                  setHForm(f => ({ ...f, cnt, sr: autoSR }));
                }}/>
            </Field>
            <Field label="Actual Survival Rate %">
              <input type="number" style={inp} value={hForm.sr} placeholder="e.g. 88.5"
                onChange={e => setHForm(f => ({ ...f, sr: e.target.value }))}/>
            </Field>
            <Field label="Sold To">
              <input type="text" style={inp} value={hForm.soldTo} placeholder="Farmer name or 'In stock'"
                onChange={e => setHForm(f => ({ ...f, soldTo: e.target.value }))}/>
            </Field>
            <Field label="Sale Amount (₹)">
              <input type="number" style={inp} value={hForm.saleAmt} placeholder="e.g. 25000"
                onChange={e => setHForm(f => ({ ...f, saleAmt: e.target.value }))}/>
            </Field>
            <Field label="Notes">
              <input type="text" style={inp} value={hForm.notes} placeholder="Optional notes"
                onChange={e => setHForm(f => ({ ...f, notes: e.target.value }))}/>
            </Field>
          </FGrid>
        </FormBox>
      )}

      {/* Harvest alerts */}
      {readyCount > 0 && (
        <div style={{ marginTop:16, padding:"14px 18px", background:C.amber+"10", borderRadius:12, border:"1px solid "+C.amber+"30" }}>
          <div style={{ color:C.amber, fontWeight:700, fontSize:13, marginBottom:8 }}>⏰ {readyCount} Batch{readyCount>1?"es":""} Ready for Harvest (DOC ≥ 22)</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {list.filter(b=>calcDOC(b.sd)>=22).map(b=>{
              const t = tanks.find(x=>x.id===b.tId);
              return <Pill key={b.id} label={`${t?.name||"T-"+b.tId} · ${b.no} · D${calcDOC(b.sd)}`} color={C.amber}/>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* Style helpers */
const gHead = color => ({
  padding:"7px 14px 7px 0", color, fontSize:10, fontWeight:700,
  textAlign:"left", textTransform:"uppercase", letterSpacing:.8,
  borderBottom:"2px solid "+color+"50", background:"rgba(255,255,255,0.01)",
});
const colHead = {
  padding:"8px 14px 8px 0", color:C.sub, fontSize:10, fontWeight:700,
  textAlign:"left", textTransform:"uppercase", letterSpacing:.5,
  borderBottom:"1px solid rgba(255,255,255,0.08)", whiteSpace:"nowrap",
};
const cell = (color=C.text, bold=false, size=12) => ({
  padding:"11px 14px 11px 0", color, fontWeight:bold?700:400, fontSize:size, whiteSpace:"nowrap",
});
