import { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext.jsx";
import { C, KPI, Card, SHead, Badge, Tbl, TR, TD, FRow, FSelect, FormBox, FGrid, Field, inp, sel } from "../common/ui.jsx";

const PL_STAGES = ["PL-5","PL-8","PL-10","PL-12","PL-15","PL-18","PL-20"];

function sc(s){ return s==="active"?C.teal:s==="harvest-ready"?C.amber:s==="harvested"?C.green:C.sub; }
function val(v, unit=""){ return v!=null&&v!==""&&v!==0 ? v+unit : <span style={{color:"rgba(255,255,255,0.2)"}}>—</span>; }
function paramCell(v, unit="", ok, warn){
  const color = v==null||v==="" ? C.sub : ok && !ok(+v) ? C.red : warn && !warn(+v) ? C.amber : C.teal;
  return <TD color={color}>{v!=null&&v!==""?v+unit:"—"}</TD>;
}

// ── NEW STOCKING TAB ──────────────────────────────────────────
function NewStocking({ batches, tanks, sheds, addBatch, updateBatch, delBatch, addWater }) {
  const activeTankIds = batches.filter(b=>b.status!=="harvested").map(b=>b.tId);
  const BLANK = {
    tId:"", no:"", sd:new Date().toISOString().slice(0,10),
    pl:"PL-10", cnt:"", hatch:"", loc:"", c1k:"", sr:"85",
    sal:"", temp:"", notes:"", status:"active",
  };
  const [form,   setForm]    = useState(BLANK);
  const [show,   setShow]    = useState(false);
  const [editId, setEditId]  = useState(null);
  const [saving, setSaving]  = useState(false);
  const f = (k,v) => setForm(p=>({...p,[k]:v}));

  const availTanks = editId ? tanks : tanks.filter(t=>!activeTankIds.includes(t.id));

  function openAdd()  { setEditId(null); setForm(BLANK); setShow(true); }
  function openEdit(b){ setEditId(b.id); setForm({ tId:b.tId, no:b.no, sd:b.sd||"", pl:b.pl, cnt:b.cnt, hatch:b.hatch||"", loc:b.loc||"", c1k:b.c1k||"", sr:b.sr||85, sal:"", temp:"", notes:b.notes||"", status:b.status }); setShow(true); }

  async function save(){
    if(!form.tId||!form.no||!form.cnt){ alert("Tank, Batch No and PL Count are required."); return; }
    setSaving(true);
    const data = {
      tId:+form.tId, no:form.no, sd:form.sd, pl:form.pl,
      cnt:+form.cnt, hatch:form.hatch, loc:form.loc,
      c1k:+form.c1k, cost:(+form.cnt/1000)*(+form.c1k),
      doc:0, harvest:"", status:form.status||"active",
      sr:+form.sr, bio:0, feed:0, fcr:0, notes:form.notes,
    };
    if(editId){
      await updateBatch(editId, data);
    } else {
      await addBatch(data);
      // save initial water reading (salinity + temp) if provided
      if(form.sal||form.temp){
        await addWater({
          tId:+form.tId, date:form.sd, shift:"morning",
          temp:+form.temp||null, sal:+form.sal||null,
          doV:null, ph:null, trans:null, amm:null, nit:null, alk:null, color:"", notes:"Day-1 stocking",
        });
      }
    }
    setSaving(false);
    setShow(false); setEditId(null); setForm(BLANK);
  }

  const cost = form.cnt&&form.c1k ? (+form.cnt/1000)*(+form.c1k) : 0;

  return(
    <div>
      {/* Top action */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <div style={{color:C.text,fontSize:14,fontWeight:700}}>New Stocking Entry</div>
          <div style={{color:C.sub,fontSize:12}}>Record day-1 batch from hatchery with initial water salinity</div>
        </div>
        <button onClick={openAdd} style={{background:"linear-gradient(135deg,#00d4aa,#0099ff)",color:"#000",fontWeight:700,fontSize:13,padding:"10px 22px",borderRadius:10,border:"none",cursor:"pointer",whiteSpace:"nowrap"}}>
          + New Stocking
        </button>
      </div>

      {/* KPIs */}
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <KPI label="Total Batches"   value={batches.length}                                          sub="all time"     color={C.teal}   icon="🐟"/>
        <KPI label="Active"          value={batches.filter(b=>b.status!=="harvested").length}         sub="in culture"   color={C.blue}   icon="🔵"/>
        <KPI label="Harvest Ready"   value={batches.filter(b=>b.doc>=22&&b.status!=="harvested").length} sub="DOC ≥ 22" color={C.amber}  icon="⏰"/>
        <KPI label="Total PLs In"    value={(batches.reduce((s,b)=>s+(b.cnt||0),0)/1000000).toFixed(2)+"M"} sub="stocked"  color={C.purple} icon="🦐"/>
        <KPI label="Total Invested"  value={"₹"+(batches.reduce((s,b)=>s+(b.cost||0),0)/100000).toFixed(2)+"L"} sub="PL cost" color={C.red} icon="💰"/>
      </div>

      {/* Form */}
      {show&&(
        <FormBox title={editId?"✏️ Edit Batch":"➕ New Stocking — Day 1 Entry"} onClose={()=>{setShow(false);setEditId(null);setForm(BLANK);}} onSave={save}>
          {/* Section: Batch Info */}
          <div style={{color:C.teal,fontSize:11,fontWeight:700,letterSpacing:.8,marginBottom:8,textTransform:"uppercase"}}>Batch Information</div>
          <FGrid cols={3}>
            <Field label="Tank *">
              <select style={sel} value={form.tId} onChange={e=>f("tId",e.target.value)}>
                <option value="">— Select Tank —</option>
                {availTanks.map(t=><option key={t.id} value={t.id}>{t.name} — {t.shed||"—"}</option>)}
              </select>
            </Field>
            <Field label="Batch Number *">
              <input style={inp} value={form.no} onChange={e=>f("no",e.target.value)} placeholder="B2024-001"/>
            </Field>
            <Field label="Stocking Date">
              <input style={inp} type="date" value={form.sd} onChange={e=>f("sd",e.target.value)}/>
            </Field>
            <Field label="PL Size / Stage">
              <select style={sel} value={form.pl} onChange={e=>f("pl",e.target.value)}>
                {PL_STAGES.map(x=><option key={x}>{x}</option>)}
              </select>
            </Field>
            <Field label="PL Count *">
              <input style={inp} type="number" value={form.cnt} onChange={e=>f("cnt",e.target.value)} placeholder="500000"/>
            </Field>
            <Field label="Cost per 1000 PLs (₹)">
              <input style={inp} type="number" value={form.c1k} onChange={e=>f("c1k",e.target.value)} placeholder="180"/>
            </Field>
          </FGrid>

          {/* Section: Hatchery Info */}
          <div style={{color:C.blue,fontSize:11,fontWeight:700,letterSpacing:.8,marginTop:16,marginBottom:8,textTransform:"uppercase"}}>Hatchery Details</div>
          <FGrid cols={3}>
            <Field label="Hatchery Name">
              <input style={inp} value={form.hatch} onChange={e=>f("hatch",e.target.value)} placeholder="Blue Ocean Hatchery"/>
            </Field>
            <Field label="Hatchery Location">
              <input style={inp} value={form.loc} onChange={e=>f("loc",e.target.value)} placeholder="Nellore, AP"/>
            </Field>
            <Field label="Expected Survival Rate (%)">
              <input style={inp} type="number" value={form.sr} onChange={e=>f("sr",e.target.value)} placeholder="85"/>
            </Field>
          </FGrid>

          {/* Section: Day-1 Water (only for new) */}
          {!editId&&<>
            <div style={{color:C.purple,fontSize:11,fontWeight:700,letterSpacing:.8,marginTop:16,marginBottom:8,textTransform:"uppercase"}}>Day-1 Water Parameters</div>
            <FGrid cols={3}>
              <Field label="Salinity (ppt)">
                <input style={inp} type="number" step="0.1" value={form.sal} onChange={e=>f("sal",e.target.value)} placeholder="28"/>
              </Field>
              <Field label="Temperature (°C)">
                <input style={inp} type="number" step="0.1" value={form.temp} onChange={e=>f("temp",e.target.value)} placeholder="29"/>
              </Field>
              <Field label="Notes">
                <input style={inp} value={form.notes} onChange={e=>f("notes",e.target.value)} placeholder="Acclimatisation notes..."/>
              </Field>
            </FGrid>
          </>}
          {editId&&<Field label="Notes"><input style={inp} value={form.notes} onChange={e=>f("notes",e.target.value)}/></Field>}

          {/* Cost preview */}
          {cost>0&&(
            <div style={{marginTop:14,padding:"10px 16px",background:C.teal+"12",borderRadius:8,border:"1px solid "+C.teal+"30",display:"flex",gap:24,alignItems:"center"}}>
              <span style={{color:C.sub,fontSize:12}}>Total PL Cost</span>
              <span style={{color:C.teal,fontWeight:700,fontSize:16}}>₹{cost.toLocaleString("en-IN")}</span>
              <span style={{color:C.sub,fontSize:11}}>{(+form.cnt/1000).toFixed(0)}K × ₹{form.c1k}/1000</span>
            </div>
          )}
          {saving&&<div style={{color:C.teal,fontSize:12,marginTop:8}}>⏳ Saving to database...</div>}
        </FormBox>
      )}

      {/* Batches table */}
      <Card>
        <SHead title={`All Stocking Records (${batches.length})`}/>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr>
                {["Tank","Shed","Batch No","Stocking Date","PL Stage","PL Count","Hatchery","Location","Cost/1000","Total Cost","Exp. SR%","DOC","Status","Actions"].map(h=>(
                  <th key={h} style={{padding:"8px 12px 8px 0",color:C.sub,fontSize:10,fontWeight:700,textAlign:"left",textTransform:"uppercase",letterSpacing:.5,borderBottom:"1px solid "+C.border,whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {batches.length===0&&(
                <tr><td colSpan={14} style={{textAlign:"center",padding:"40px",color:C.sub,fontSize:13}}>
                  No stocking records yet. Click <b style={{color:C.teal}}>+ New Stocking</b> to add the first batch.
                </td></tr>
              )}
              {[...batches].reverse().map(b=>{
                const t = tanks.find(x=>x.id===b.tId);
                const effStatus = b.doc>=22&&b.status==="active"?"harvest-ready":b.status;
                return(
                  <tr key={b.id} style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                    <td style={{padding:"9px 12px 9px 0",color:C.blue,fontWeight:700,fontSize:12,whiteSpace:"nowrap"}}>{t?.name||"T-"+b.tId}</td>
                    <td style={{padding:"9px 12px 9px 0",color:C.sub,fontSize:11}}>{t?.shed||"—"}</td>
                    <td style={{padding:"9px 12px 9px 0",color:C.text,fontSize:11}}>{b.no}</td>
                    <td style={{padding:"9px 12px 9px 0",color:C.sub,fontSize:11}}>{b.sd||"—"}</td>
                    <td style={{padding:"9px 12px 9px 0"}}><Badge label={b.pl} color={C.teal}/></td>
                    <td style={{padding:"9px 12px 9px 0",color:C.blue,fontWeight:700,fontSize:12}}>{((b.cnt||0)/1000).toFixed(0)}K</td>
                    <td style={{padding:"9px 12px 9px 0",color:C.text,fontSize:11}}>{b.hatch||"—"}</td>
                    <td style={{padding:"9px 12px 9px 0",color:C.sub,fontSize:11}}>{b.loc||"—"}</td>
                    <td style={{padding:"9px 12px 9px 0",color:C.text,fontSize:11}}>₹{b.c1k||0}</td>
                    <td style={{padding:"9px 12px 9px 0",color:C.purple,fontWeight:700,fontSize:12}}>₹{(b.cost||0).toLocaleString("en-IN")}</td>
                    <td style={{padding:"9px 12px 9px 0",color:b.sr>=80?C.green:C.amber,fontWeight:700,fontSize:12}}>{b.sr}%</td>
                    <td style={{padding:"9px 12px 9px 0",color:b.doc>=22?C.amber:C.teal,fontWeight:700,fontSize:12}}>D{b.doc||0}</td>
                    <td style={{padding:"9px 12px 9px 0"}}><Badge label={effStatus} color={sc(effStatus)}/></td>
                    <td style={{padding:"9px 0"}}>
                      <div style={{display:"flex",gap:4}}>
                        <button onClick={()=>openEdit(b)} style={{background:C.blue+"18",color:C.blue,border:"none",borderRadius:5,padding:"3px 8px",cursor:"pointer",fontSize:11}}>Edit</button>
                        <button onClick={()=>{if(window.confirm("Delete batch "+b.no+"?"))delBatch(b.id);}} style={{background:C.red+"18",color:C.red,border:"none",borderRadius:5,padding:"3px 8px",cursor:"pointer",fontSize:11}}>Del</button>
                      </div>
                    </td>
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

// ── RUNNING STOCK TAB ─────────────────────────────────────────
function RunningStock({ batches, tanks, sheds, water }) {
  const [fShed, setFShed] = useState("all");
  const active = batches.filter(b => b.status!=="harvested");

  // Latest water reading per tank
  const latestWater = useMemo(()=>{
    const map = {};
    water.forEach(w=>{
      if(!map[w.tId]||new Date(w.date)>=new Date(map[w.tId].date)) map[w.tId]=w;
    });
    return map;
  },[water]);

  const list = active.filter(b=>{
    if(fShed==="all") return true;
    const t = tanks.find(x=>x.id===b.tId);
    return t?.shedId===+fShed;
  });

  const avgSR  = list.length ? (list.reduce((s,b)=>s+(b.sr||0),0)/list.length).toFixed(1) : 0;
  const avgFCR = list.length ? (list.reduce((s,b)=>s+(b.fcr||0),0)/list.length).toFixed(2) : 0;
  const totalBio = list.reduce((s,b)=>s+(b.bio||0),0).toFixed(1);

  return(
    <div>
      <div style={{marginBottom:16}}>
        <div style={{color:C.text,fontSize:14,fontWeight:700}}>Running Stock Monitor</div>
        <div style={{color:C.sub,fontSize:12}}>Live view of all active batches — water parameters, FCR, biomass, survival</div>
      </div>

      {/* KPIs */}
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <KPI label="Active Batches" value={list.length}                  sub="in culture"     color={C.teal}   icon="🐟"/>
        <KPI label="Total Biomass"  value={totalBio+" kg"}               sub="estimated"      color={C.amber}  icon="⚖️"/>
        <KPI label="Avg Survival"   value={avgSR+"%"}                    sub="across batches" color={C.green}  icon="📈"/>
        <KPI label="Avg FCR"        value={avgFCR}                       sub="feed ratio"     color={C.blue}   icon="📊"/>
        <KPI label="Harvest Ready"  value={list.filter(b=>b.doc>=22).length} sub="DOC ≥ 22"  color={C.amber}  icon="⏰"/>
        <KPI label="Total PLs"      value={(list.reduce((s,b)=>s+(b.cnt||0),0)/1000000).toFixed(2)+"M"} sub="in nursery" color={C.purple} icon="🦐"/>
      </div>

      {/* Filter */}
      <div style={{marginBottom:14}}>
        <FRow>
          <FSelect label="Shed:" value={fShed} onChange={setFShed}>
            <option value="all">All Sheds</option>
            {sheds.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </FSelect>
        </FRow>
      </div>

      {/* Main running stock table */}
      <Card>
        <SHead title="Active Batch Details — Water + Performance"/>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr>
                {/* Batch info */}
                <th colSpan={6} style={{padding:"6px 12px 6px 0",color:C.teal,fontSize:10,fontWeight:700,textAlign:"left",textTransform:"uppercase",letterSpacing:.5,borderBottom:"1px solid "+C.teal+"40"}}>
                  Batch Info
                </th>
                {/* Water params */}
                <th colSpan={6} style={{padding:"6px 12px 6px 0",color:C.blue,fontSize:10,fontWeight:700,textAlign:"left",textTransform:"uppercase",letterSpacing:.5,borderBottom:"1px solid "+C.blue+"40"}}>
                  Latest Water Parameters
                </th>
                {/* Performance */}
                <th colSpan={4} style={{padding:"6px 12px 6px 0",color:C.amber,fontSize:10,fontWeight:700,textAlign:"left",textTransform:"uppercase",letterSpacing:.5,borderBottom:"1px solid "+C.amber+"40"}}>
                  Performance
                </th>
              </tr>
              <tr style={{background:"rgba(255,255,255,0.02)"}}>
                {["Tank","Shed","Batch No","DOC","PL Stage","PL Count",
                  "Temp (°C)","Salinity","DO (mg/L)","pH","Ammonia","Water Date",
                  "Biomass (kg)","FCR","Survival %","Status"].map(h=>(
                  <th key={h} style={{padding:"7px 12px 7px 0",color:C.sub,fontSize:10,fontWeight:700,textAlign:"left",textTransform:"uppercase",letterSpacing:.4,borderBottom:"1px solid "+C.border,whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.length===0&&(
                <tr><td colSpan={16} style={{textAlign:"center",padding:"40px",color:C.sub,fontSize:13}}>
                  No active batches. Add a new stocking from the <b style={{color:C.teal}}>New Stocking</b> tab.
                </td></tr>
              )}
              {list.map(b=>{
                const t   = tanks.find(x=>x.id===b.tId);
                const lw  = latestWater[b.tId];
                const effStatus = b.doc>=22?"harvest-ready":b.status;
                const docColor  = b.doc>=22 ? C.amber : b.doc>=15 ? C.blue : C.teal;
                const srColor   = b.sr>=85 ? C.green : b.sr>=70 ? C.amber : C.red;
                return(
                  <tr key={b.id} style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                    {/* Batch info */}
                    <td style={{padding:"10px 12px 10px 0",color:C.blue,fontWeight:700,fontSize:12,whiteSpace:"nowrap"}}>{t?.name||"T-"+b.tId}</td>
                    <td style={{padding:"10px 12px 10px 0",color:C.sub,fontSize:11}}>{t?.shed||"—"}</td>
                    <td style={{padding:"10px 12px 10px 0",color:C.text,fontSize:11}}>{b.no}</td>
                    <td style={{padding:"10px 12px 10px 0",color:docColor,fontWeight:700,fontSize:13}}>D{b.doc||0}</td>
                    <td style={{padding:"10px 12px 10px 0"}}><Badge label={b.pl} color={C.teal}/></td>
                    <td style={{padding:"10px 12px 10px 0",color:C.text,fontSize:12}}>{((b.cnt||0)/1000).toFixed(0)}K</td>

                    {/* Water params — colour-coded */}
                    <td style={{padding:"10px 12px 10px 0",color: lw?.temp ? (lw.temp<27||lw.temp>32?C.red:C.teal) : C.sub, fontWeight:600,fontSize:12}}>{lw?.temp??<span style={{color:"rgba(255,255,255,0.2)"}}>—</span>}</td>
                    <td style={{padding:"10px 12px 10px 0",color: lw?.sal  ? (lw.sal<20||lw.sal>35?C.amber:C.teal) : C.sub, fontWeight:600,fontSize:12}}>{lw?.sal!=null?lw.sal+" ppt":<span style={{color:"rgba(255,255,255,0.2)"}}>—</span>}</td>
                    <td style={{padding:"10px 12px 10px 0",color: lw?.doV  ? (lw.doV<5?C.red:lw.doV<6?C.amber:C.teal) : C.sub, fontWeight:600,fontSize:12}}>{lw?.doV??<span style={{color:"rgba(255,255,255,0.2)"}}>—</span>}</td>
                    <td style={{padding:"10px 12px 10px 0",color: lw?.ph   ? (lw.ph<7.5||lw.ph>8.5?C.amber:C.teal) : C.sub, fontWeight:600,fontSize:12}}>{lw?.ph??<span style={{color:"rgba(255,255,255,0.2)"}}>—</span>}</td>
                    <td style={{padding:"10px 12px 10px 0",color: lw?.amm  ? (lw.amm>0.5?C.red:lw.amm>0.25?C.amber:C.teal) : C.sub, fontWeight:600,fontSize:12}}>{lw?.amm!=null?lw.amm+" ppm":<span style={{color:"rgba(255,255,255,0.2)"}}>—</span>}</td>
                    <td style={{padding:"10px 12px 10px 0",color:C.sub,fontSize:10}}>{lw?.date||<span style={{color:"rgba(255,255,255,0.2)"}}>No data</span>}</td>

                    {/* Performance */}
                    <td style={{padding:"10px 12px 10px 0",color:C.amber,fontWeight:700,fontSize:12}}>{b.bio||0} kg</td>
                    <td style={{padding:"10px 12px 10px 0",color:b.fcr>1.5?C.red:b.fcr>1.2?C.amber:C.teal,fontWeight:700,fontSize:12}}>{b.fcr||"—"}</td>
                    <td style={{padding:"10px 12px 10px 0"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{width:50,height:5,borderRadius:99,background:"rgba(255,255,255,0.08)"}}>
                          <div style={{width:Math.min(100,b.sr||0)+"%",height:"100%",borderRadius:99,background:srColor}}/>
                        </div>
                        <span style={{color:srColor,fontWeight:700,fontSize:12}}>{b.sr}%</span>
                      </div>
                    </td>
                    <td style={{padding:"10px 0"}}><Badge label={effStatus} color={sc(effStatus)}/></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Colour guide */}
      <div style={{marginTop:12,display:"flex",gap:16,flexWrap:"wrap"}}>
        {[["🟢 Green","Normal / Good range"],["🟡 Amber","Caution — borderline"],["🔴 Red","Out of safe range"],["— Grey","No data recorded"]].map(([l,d])=>(
          <div key={l} style={{color:C.sub,fontSize:11}}><b style={{color:C.text}}>{l}</b> {d}</div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────
export default function Stocking() {
  const { tanks, batches, sheds, water, addBatch, updateBatch, delBatch, addWater } = useApp();
  const [sub, setSub] = useState("newstock");

  const SUBS = [
    { id:"newstock",  label:"🐟 New Stocking"   },
    { id:"running",   label:"📡 Running Stock"   },
  ];

  return (
    <div style={{padding:"20px 24px"}}>
      {/* Header */}
      <div style={{marginBottom:16}}>
        <h2 style={{color:C.text,fontSize:18,fontWeight:700,margin:"0 0 4px"}}>Stocking Management</h2>
        <p style={{color:C.sub,fontSize:12,margin:0}}>Manage PL batches from hatchery to harvest</p>
      </div>

      {/* Sub-menu tabs */}
      <div style={{display:"flex",gap:4,marginBottom:20,borderBottom:"1px solid "+C.border}}>
        {SUBS.map(s=>(
          <button key={s.id} onClick={()=>setSub(s.id)} style={{
            padding:"10px 22px",borderRadius:"8px 8px 0 0",border:"none",cursor:"pointer",
            fontSize:13,fontWeight:600,transition:"all .15s",
            background: sub===s.id ? C.teal : "rgba(255,255,255,0.04)",
            color:       sub===s.id ? "#000" : C.sub,
            borderBottom: sub===s.id ? "2px solid "+C.teal : "2px solid transparent",
            marginBottom:"-1px",
          }}>
            {s.label}
          </button>
        ))}
      </div>

      {sub==="newstock" && <NewStocking batches={batches} tanks={tanks} sheds={sheds} addBatch={addBatch} updateBatch={updateBatch} delBatch={delBatch} addWater={addWater}/>}
      {sub==="running"  && <RunningStock batches={batches} tanks={tanks} sheds={sheds} water={water}/>}
    </div>
  );
}
