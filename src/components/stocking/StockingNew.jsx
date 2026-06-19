import { useState } from "react";
import { useApp } from "../../context/AppContext.jsx";
import { C, KPI, Card, SHead, Badge, Field, FGrid, inp, sel } from "../common/ui.jsx";

const PL_STAGES = ["PL-5","PL-8","PL-10","PL-12","PL-15","PL-18","PL-20"];

// Calculate DOC from stocking date to today
function calcDOC(sd) {
  if (!sd) return 0;
  const diff = new Date() - new Date(sd);
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

const tabStyle = active => ({
  padding:"10px 26px", border:"none", cursor:"pointer", fontSize:13, fontWeight:700,
  borderRadius:"8px 8px 0 0", marginBottom:"-1px", transition:"all .15s",
  background: active ? C.teal : "rgba(255,255,255,0.05)",
  color:       active ? "#000" : C.sub,
  borderBottom: active ? "2px solid "+C.teal : "2px solid transparent",
});

export default function StockingNew() {
  const { tanks, batches, addBatch, updateBatch, delBatch, addWater } = useApp();

  const [tab,    setTab]    = useState("list");   // "list" | "form"
  const [editB,  setEditB]  = useState(null);     // batch being edited
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");

  // ── form state ──────────────────────────────────────────────
  const BLANK = {
    tId:"", no:"", sd: new Date().toISOString().slice(0,10),
    pl:"PL-10", cnt:"", hatch:"", loc:"", c1k:"", sr:"85", sal:"", temp:"",
  };
  const [form, setForm] = useState(BLANK);
  const fld = (k,v) => setForm(p => ({...p,[k]:v}));

  const activeTankIds = batches.filter(b => b.status !== "harvested").map(b => b.tId);
  const freeTanks     = tanks.filter(t => !activeTankIds.includes(t.id));

  // ── open new form ────────────────────────────────────────────
  function openNew() {
    setEditB(null);
    setForm(BLANK);
    setErr("");
    setTab("form");
  }

  // ── open edit form ───────────────────────────────────────────
  function openEdit(b) {
    setEditB(b);
    setForm({
      tId:b.tId, no:b.no, sd:b.sd||"", pl:b.pl,
      cnt:b.cnt, hatch:b.hatch||"", loc:b.loc||"",
      c1k:b.c1k||"", sr:b.sr||85, sal:"", temp:"",
    });
    setErr("");
    setTab("form");
  }

  // ── save ──────────────────────────────────────────────────────
  async function save() {
    if (!form.tId)  return setErr("Please select a tank.");
    if (!form.no)   return setErr("Batch number is required.");
    if (!form.cnt)  return setErr("PL Count is required.");
    setSaving(true); setErr("");
    const cost = (+form.cnt / 1000) * (+form.c1k || 0);
    try {
      const payload = {
        tId:+form.tId, no:form.no, sd:form.sd, pl:form.pl,
        cnt:+form.cnt, hatch:form.hatch, loc:form.loc,
        c1k:+form.c1k, cost,
        doc:0, harvest:"", status:"active",
        sr:+form.sr, bio:0, feed:0, fcr:0,
      };
      if (editB) {
        await updateBatch(editB.id, payload);
      } else {
        await addBatch(payload);
        // save day-1 water reading if provided
        if (form.sal || form.temp) {
          await addWater({
            tId:+form.tId, date:form.sd, shift:"morning",
            temp: form.temp ? +form.temp : null,
            sal:  form.sal  ? +form.sal  : null,
            doV:null, ph:null, trans:null, amm:null,
            nit:null, alk:null, color:"", notes:"Day-1 stocking",
          });
        }
      }
      setEditB(null);
      setForm(BLANK);
      setTab("list");   // ← go straight to list so user sees the saved row
    } catch(e) {
      setErr("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  const cost = form.cnt && form.c1k ? (+form.cnt/1000)*(+form.c1k) : 0;
  const sorted = [...batches].sort((a,b) => (b.sd||"").localeCompare(a.sd||""));

  // ── STATUS helpers ───────────────────────────────────────────
  const effStatus = b => b.doc>=22 && b.status==="active" ? "harvest-ready" : b.status;
  const stColor   = s => s==="active"?C.teal:s==="harvest-ready"?C.amber:s==="harvested"?C.green:C.sub;

  return (
    <div style={{padding:"20px 24px"}}>

      {/* Page header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div>
          <h2 style={{color:C.text,fontSize:18,fontWeight:700,margin:"0 0 4px"}}>🐟 New Stocking</h2>
          <p style={{color:C.sub,fontSize:12,margin:0}}>Record PL batches arriving from hatchery</p>
        </div>
        <button onClick={openNew} style={{background:"linear-gradient(135deg,#00d4aa,#0099ff)",color:"#000",fontWeight:700,fontSize:13,padding:"10px 24px",borderRadius:10,border:"none",cursor:"pointer",whiteSpace:"nowrap"}}>
          + New Stocking
        </button>
      </div>

      {/* KPIs */}
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <KPI label="Total Batches"   value={batches.length}                                                        sub="all time"   color={C.teal}   icon="🐟"/>
        <KPI label="Active"          value={batches.filter(b=>b.status!=="harvested").length}                      sub="in culture" color={C.blue}   icon="🔵"/>
        <KPI label="Harvest Ready"   value={batches.filter(b=>b.doc>=22&&b.status!=="harvested").length}           sub="DOC ≥ 22"   color={C.amber}  icon="⏰"/>
        <KPI label="Total PLs"       value={(batches.reduce((s,b)=>s+(b.cnt||0),0)/1000000).toFixed(2)+"M"}       sub="stocked"    color={C.purple} icon="🦐"/>
        <KPI label="Total Invested"  value={"₹"+(batches.reduce((s,b)=>s+(b.cost||0),0)/100000).toFixed(2)+"L"}  sub="PL cost"    color={C.amber}  icon="💰"/>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:4,borderBottom:"1px solid "+C.border,marginBottom:24}}>
        <button style={tabStyle(tab==="list")} onClick={()=>{setTab("list");setEditB(null);}}>
          📋 Stock List
          {batches.length > 0 && <span style={{background:"rgba(0,0,0,0.3)",borderRadius:99,padding:"1px 8px",fontSize:10,marginLeft:7}}>{batches.length}</span>}
        </button>
        <button style={tabStyle(tab==="form")} onClick={openNew}>
          {editB ? "✏️ Edit Batch" : "➕ New Stock"}
        </button>
      </div>

      {/* ── TAB 1 : STOCK LIST ── */}
      {tab==="list" && (
        <Card>
          <SHead title={`Stocking Records from Database (${sorted.length})`}/>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",minWidth:1000}}>
              <thead>
                <tr style={{background:"rgba(255,255,255,0.025)"}}>
                  {["#","Tank","Shed","Batch No","Stocking Date","PL Stage","PL Count","Hatchery Name","Location","Cost /1000 (₹)","Total Cost (₹)","Exp. SR %","DOC","Status","Actions"].map(h=>(
                    <th key={h} style={{padding:"10px 14px 10px 0",color:C.sub,fontSize:10,fontWeight:700,textAlign:"left",textTransform:"uppercase",letterSpacing:.5,borderBottom:"1px solid "+C.border,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr><td colSpan={15} style={{textAlign:"center",padding:"60px 20px",color:C.sub,fontSize:13}}>
                    No stocking records yet. Click <b style={{color:C.teal}}>+ New Stocking</b> or the <b style={{color:C.teal}}>➕ New Stock</b> tab to add the first batch.
                  </td></tr>
                ) : sorted.map((b, idx) => {
                  const t   = tanks.find(x => x.id === b.tId);
                  const doc = b.status === "harvested" ? (b.doc||0) : calcDOC(b.sd);
                  const es  = doc>=22 && b.status==="active" ? "harvest-ready" : b.status;
                  return (
                    <tr key={b.id}
                        style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.025)"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={td(C.sub)}>{idx+1}</td>
                      <td style={td(C.blue,true)}>{t?.name||"T-"+b.tId}</td>
                      <td style={td(C.sub)}>{t?.shed||"—"}</td>
                      <td style={td(C.text,true)}>{b.no}</td>
                      <td style={td(C.sub)}>{b.sd||"—"}</td>
                      <td style={{padding:"10px 14px 10px 0"}}><Badge label={b.pl} color={C.teal}/></td>
                      <td style={td(C.blue,true)}>{((b.cnt||0)/1000).toFixed(0)}K</td>
                      <td style={td(C.text)}>{b.hatch||"—"}</td>
                      <td style={td(C.sub)}>{b.loc||"—"}</td>
                      <td style={td(C.text)}>₹{(b.c1k||0).toLocaleString("en-IN")}</td>
                      <td style={td(C.purple,true)}>₹{(b.cost||0).toLocaleString("en-IN")}</td>
                      <td style={td(b.sr>=80?C.green:C.amber,true)}>{b.sr}%</td>
                      <td style={td(doc>=22?C.amber:C.teal,true)}>D{doc}</td>
                      <td style={{padding:"10px 14px 10px 0"}}><Badge label={es} color={stColor(es)}/></td>
                      <td style={{padding:"10px 0"}}>
                        <div style={{display:"flex",gap:5}}>
                          <button onClick={()=>openEdit(b)} style={{background:C.blue+"18",color:C.blue,border:"none",borderRadius:5,padding:"4px 10px",cursor:"pointer",fontSize:11}}>Edit</button>
                          <button onClick={()=>{if(window.confirm("Delete batch "+b.no+"?")) delBatch(b.id);}} style={{background:C.red+"18",color:C.red,border:"none",borderRadius:5,padding:"4px 10px",cursor:"pointer",fontSize:11}}>Del</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── TAB 2 : NEW STOCK FORM ── */}
      {tab==="form" && (
        <div style={{maxWidth:860}}>

          {/* Section: Batch Details */}
          <div style={sHead(C.teal)}>🐟 Batch Details</div>
          <FGrid cols={3}>
            <Field label="Tank *">
              <select style={sel} value={form.tId} onChange={e=>fld("tId",e.target.value)}>
                <option value="">— Select Tank —</option>
                {(editB ? tanks : freeTanks).map(t=>(
                  <option key={t.id} value={t.id}>{t.name}  [{t.shed||"—"}]</option>
                ))}
              </select>
            </Field>
            <Field label="Batch Number *">
              <input style={inp} value={form.no} onChange={e=>fld("no",e.target.value)} placeholder="B2024-001"/>
            </Field>
            <Field label="Stocking Date">
              <input style={inp} type="date" value={form.sd} onChange={e=>fld("sd",e.target.value)}/>
            </Field>
            <Field label="PL Stage / Size">
              <select style={sel} value={form.pl} onChange={e=>fld("pl",e.target.value)}>
                {PL_STAGES.map(x=><option key={x}>{x}</option>)}
              </select>
            </Field>
            <Field label="PL Count (nos.) *">
              <input style={inp} type="number" value={form.cnt} onChange={e=>fld("cnt",e.target.value)} placeholder="500000"/>
            </Field>
            <Field label="Cost per 1000 PLs (₹)">
              <input style={inp} type="number" value={form.c1k} onChange={e=>fld("c1k",e.target.value)} placeholder="180"/>
            </Field>
          </FGrid>

          {/* Density Check Panel */}
          {form.tId && (()=>{
            const t = tanks.find(x=>x.id===+form.tId);
            if (!t?.volumeL) return (
              <div style={{margin:"8px 0 16px",padding:"10px 14px",background:C.amber+"12",borderRadius:8,border:"1px solid "+C.amber+"25",fontSize:11,color:C.amber}}>
                ⚠️ Tank dimensions not set. Go to <b>Settings → Tanks</b> to add length/width/depth for density calculation.
              </div>
            );
            const vol = t.volumeL;
            const cnt = +form.cnt || 0;
            const density = cnt > 0 ? Math.round(cnt / vol) : 0;
            const dColor = density > 250 ? C.red : density > 200 ? C.amber : density >= 100 ? C.teal : density > 0 ? C.blue : C.sub;
            const dLabel = density > 250 ? "⚠️ Too High — Risk of mortality!" : density > 200 ? "⚠️ High — Monitor closely" : density >= 100 ? "✅ Optimal range" : density > 0 ? "↓ Low density" : "Enter PL count";
            return (
              <div style={{margin:"8px 0 16px",padding:"14px 18px",background:dColor+"12",borderRadius:10,border:"1px solid "+dColor+"30",display:"flex",gap:28,flexWrap:"wrap",alignItems:"center"}}>
                <div>
                  <div style={{color:C.sub,fontSize:10,marginBottom:2}}>TANK VOLUME</div>
                  <div style={{color:C.teal,fontSize:18,fontWeight:800}}>{(vol/1000).toFixed(0)}K L</div>
                  <div style={{color:C.sub,fontSize:10}}>{t.shape==="circle"?`Ø${t.lengthFt}ft`:`${t.lengthFt}×${t.widthFt}ft`} × {t.depthFt}ft deep</div>
                </div>
                <div>
                  <div style={{color:C.sub,fontSize:10,marginBottom:2}}>STOCKING DENSITY</div>
                  <div style={{color:dColor,fontSize:18,fontWeight:800}}>{density > 0 ? density+" PLs/L" : "—"}</div>
                  <div style={{color:dColor,fontSize:11,fontWeight:600}}>{dLabel}</div>
                </div>
                <div>
                  <div style={{color:C.sub,fontSize:10,marginBottom:2}}>RECOMMENDED RANGE</div>
                  <div style={{color:C.text,fontSize:13,fontWeight:700}}>100 – 200 PLs/L</div>
                  <div style={{color:C.sub,fontSize:10}}>{(vol*100/1000000).toFixed(1)}M – {(vol*200/1000000).toFixed(1)}M PLs for this tank</div>
                </div>
              </div>
            );
          })()}

          {/* Section: Hatchery */}
          <div style={sHead(C.blue)}>🏭 Hatchery Details</div>
          <FGrid cols={3}>
            <Field label="Hatchery Name">
              <input style={inp} value={form.hatch} onChange={e=>fld("hatch",e.target.value)} placeholder="Blue Ocean Hatchery"/>
            </Field>
            <Field label="Hatchery Location">
              <input style={inp} value={form.loc} onChange={e=>fld("loc",e.target.value)} placeholder="Nellore, AP"/>
            </Field>
            <Field label="Expected Survival Rate (%)">
              <input style={inp} type="number" value={form.sr} onChange={e=>fld("sr",e.target.value)} placeholder="85"/>
            </Field>
          </FGrid>

          {/* Section: Day-1 Water (new only) */}
          {!editB && (
            <>
              <div style={sHead(C.purple)}>💧 Day-1 Water Reading</div>
              <FGrid cols={3}>
                <Field label="Salinity (ppt)">
                  <input style={inp} type="number" step="0.1" value={form.sal} onChange={e=>fld("sal",e.target.value)} placeholder="28"/>
                </Field>
                <Field label="Temperature (°C)">
                  <input style={inp} type="number" step="0.1" value={form.temp} onChange={e=>fld("temp",e.target.value)} placeholder="29"/>
                </Field>
              </FGrid>
            </>
          )}

          {/* Cost preview */}
          {cost > 0 && (
            <div style={{margin:"20px 0",padding:"14px 20px",background:C.teal+"12",borderRadius:10,border:"1px solid "+C.teal+"30",display:"flex",gap:32,alignItems:"center",flexWrap:"wrap"}}>
              <div>
                <div style={{color:C.sub,fontSize:10,marginBottom:2,textTransform:"uppercase",letterSpacing:.8}}>Total PL Cost</div>
                <div style={{color:C.teal,fontWeight:700,fontSize:22}}>₹{cost.toLocaleString("en-IN")}</div>
              </div>
              <div style={{color:C.sub,fontSize:12}}>{(+form.cnt/1000).toFixed(0)}K PLs  ×  ₹{form.c1k} per 1000</div>
            </div>
          )}

          {err && <div style={{color:C.red,fontSize:12,marginBottom:14,padding:"8px 12px",background:C.red+"12",borderRadius:7}}>⚠️ {err}</div>}

          {/* Buttons */}
          <div style={{display:"flex",gap:10,marginTop:8}}>
            <button onClick={save} disabled={saving} style={{background:"linear-gradient(135deg,#00d4aa,#0099ff)",color:"#000",fontWeight:700,fontSize:13,padding:"11px 36px",borderRadius:9,border:"none",cursor:saving?"not-allowed":"pointer",opacity:saving?.7:1}}>
              {saving ? "⏳ Saving..." : editB ? "💾 Update Batch" : "✅ Save Stocking"}
            </button>
            <button onClick={()=>{setTab("list");setEditB(null);setErr("");}} style={{background:"rgba(255,255,255,0.06)",color:C.sub,fontWeight:600,fontSize:13,padding:"11px 22px",borderRadius:9,border:"none",cursor:"pointer"}}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const td = (color=C.text, bold=false) => ({
  padding:"10px 14px 10px 0", color, fontWeight:bold?700:400, fontSize:12, whiteSpace:"nowrap",
});
const sHead = color => ({
  color, fontSize:10, fontWeight:700, letterSpacing:1, textTransform:"uppercase",
  margin:"20px 0 12px", borderLeft:"3px solid "+color, paddingLeft:8,
});
