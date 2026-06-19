
import {useState,useMemo} from "react";
import {useApp} from "../../context/AppContext.jsx";
import {C,KPI,Card,SHead,Badge,Tbl,TR,TD,FRow,FSelect,FormBox,FGrid,Field,Alert,inp,sel,TT} from "../common/ui.jsx";
import {LineChart,Line,XAxis,YAxis,Tooltip,ResponsiveContainer} from "recharts";

const PARAMS=[
  {k:"temp", l:"Temp (°C)",     min:26,max:34, ideal:"28-32"},
  {k:"sal",  l:"Salinity (ppt)",min:5, max:30, ideal:"10-25"},
  {k:"doV",  l:"DO (mg/L)",     min:4, max:12, ideal:">5"},
  {k:"ph",   l:"pH",            min:7, max:9,  ideal:"7.5-8.5"},
  {k:"amm",  l:"Ammonia",       min:0, max:.5, ideal:"<0.1"},
  {k:"nit",  l:"Nitrite",       min:0, max:.5, ideal:"<0.1"},
];
const pc=(k,v)=>{if(k==="amm"&&v>.1)return C.red;if(k==="nit"&&v>.1)return C.red;if(k==="doV"&&v<5)return C.amber;return C.teal;};
const calcDOC=sd=>sd?Math.max(0,Math.floor((new Date()-new Date(sd))/864e5)):0;
const today=new Date().toISOString().slice(0,10);

const blank={tId:"",date:today,shift:"morning",temp:"",sal:"",doV:"",ph:"",trans:"",amm:"",nit:"",alk:"",color:"Light Green",notes:""};

export default function WaterQuality(){
  const {tanks,batches,water,sheds,addWater}=useApp();
  const [fShed,setFShed]=useState("all");
  const [fTank,setFTank]=useState("all");
  const [show,setShow]=useState(false);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState(blank);
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));

  // Only tanks with active stocking batches
  const activeBatches=batches.filter(b=>b.status!=="harvested");
  const stockedTanks=tanks.filter(t=>activeBatches.some(b=>b.tId===t.id));

  function selectTank(tId){
    f("tId",tId);
  }

  const filtTanks=tanks.filter(t=>fShed==="all"||t.shedId===+fShed);
  const filtStockedTanks=stockedTanks.filter(t=>fShed==="all"||t.shedId===+fShed);

  // Selected tank for the history/chart view
  const viewTankId=fTank==="all"?(filtStockedTanks[0]?.id||filtTanks[0]?.id||null):+fTank;
  const selTank=tanks.find(t=>t.id===viewTankId);
  const tParams=water.filter(p=>p.tId===viewTankId);
  const latest=[...tParams].sort((a,b)=>b.id-a.id)[0];
  const batch=activeBatches.find(b=>b.tId===viewTankId);
  const doc=batch?calcDOC(batch.sd):0;

  // Today's readings for chart
  const chartDate=form.date||today;
  const chart=["morning","afternoon","night"].map(s=>{
    const p=tParams.find(x=>x.shift===s&&x.date===chartDate);
    return{s:s[0].toUpperCase()+s.slice(1),temp:p?.temp,do:p?.doV,ph:p?.ph};
  }).filter(d=>d.temp!=null);

  const alerts=water.filter(p=>p.amm>.1||p.nit>.1||p.doV<5);

  const save=async()=>{
    if(!form.tId)return;
    setSaving(true);
    try{
      await addWater({...form,tId:+form.tId,
        temp:+form.temp||null,sal:+form.sal||null,doV:+form.doV||null,
        ph:+form.ph||null,trans:+form.trans||null,amm:+form.amm||null,
        nit:+form.nit||null,alk:+form.alk||null,
        shift:(form.shift||"morning").toLowerCase(),
      });
      setShow(false);
      setForm(blank);
    }catch(e){alert("Error: "+e.message);}
    finally{setSaving(false);}
  };

  return(
    <div style={{padding:"20px 24px"}}>
      {alerts.length>0&&<Alert type="danger" msg={"⚠️ "+alerts.length+" parameter alert(s) — check ammonia/nitrite/DO"}/>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <FRow>
          <FSelect label="Shed:" value={fShed} onChange={v=>{setFShed(v);setFTank("all");}}>
            <option value="all">All Sheds</option>
            {sheds.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </FSelect>
          <FSelect label="Tank:" value={fTank} onChange={setFTank}>
            <option value="all">All Tanks</option>
            {filtTanks.map(t=><option key={t.id} value={t.id}>{t.name} ({t.shed})</option>)}
          </FSelect>
        </FRow>
        <button onClick={()=>setShow(true)} style={{background:"linear-gradient(135deg,#00d4aa,#0099ff)",color:"#000",fontWeight:700,fontSize:13,padding:"8px 18px",borderRadius:10,border:"none",cursor:"pointer"}}>+ Add Entry</button>
      </div>

      {/* Batch info bar */}
      {batch&&selTank&&<div style={{background:"rgba(0,153,255,0.08)",borderRadius:10,padding:"9px 14px",marginBottom:14,border:"1px solid rgba(0,153,255,0.2)",display:"flex",gap:18,flexWrap:"wrap"}}>
        {["Tank: "+selTank.name,"Batch: "+batch.no,"DOC: D"+doc,"PL: "+batch.pl,"Stocked: "+((batch.cnt||0)/1000).toFixed(0)+"K","Biomass: "+(batch.bio||"—")+"kg","FCR: "+(batch.fcr||"—")].map(t=><span key={t} style={{color:"#89b8cc",fontSize:11}}>{t}</span>)}
      </div>}

      {show&&<FormBox title="💧 Add Water Parameters" onClose={()=>{setShow(false);setForm(blank);}} onSave={save}>
        <FGrid cols={4}>
          <Field label="Tank (Active Stocking) *">
            <select style={sel} value={form.tId} onChange={e=>selectTank(e.target.value)}>
              <option value="">— Select Tank —</option>
              {stockedTanks.map(t=>{
                const b=activeBatches.find(x=>x.tId===t.id);
                const doc=b?calcDOC(b.sd):0;
                return <option key={t.id} value={t.id}>{t.name} [{t.shed||"—"}] {b?`• ${b.no} D${doc}`:""}</option>;
              })}
            </select>
          </Field>
          <Field label="Date"><input style={inp} type="date" value={form.date} onChange={e=>f("date",e.target.value)}/></Field>
          <Field label="Shift">
            <select style={sel} value={form.shift} onChange={e=>f("shift",e.target.value)}>
              <option value="morning">🌅 Morning</option>
              <option value="afternoon">☀️ Afternoon</option>
              <option value="night">🌙 Night</option>
            </select>
          </Field>
          <Field label="Temperature (°C)"><input style={inp} type="number" step=".1" value={form.temp} onChange={e=>f("temp",e.target.value)} placeholder="29.5"/></Field>
          <Field label="Salinity (ppt)"><input style={inp} type="number" value={form.sal} onChange={e=>f("sal",e.target.value)} placeholder="18"/></Field>
          <Field label="DO (mg/L)"><input style={inp} type="number" step=".1" value={form.doV} onChange={e=>f("doV",e.target.value)} placeholder="6.2"/></Field>
          <Field label="pH"><input style={inp} type="number" step=".1" value={form.ph} onChange={e=>f("ph",e.target.value)} placeholder="7.8"/></Field>
          <Field label="Transparency (cm)"><input style={inp} type="number" value={form.trans} onChange={e=>f("trans",e.target.value)} placeholder="35"/></Field>
          <Field label="Ammonia (mg/L)"><input style={inp} type="number" step=".01" value={form.amm} onChange={e=>f("amm",e.target.value)} placeholder="0.05"/></Field>
          <Field label="Nitrite (mg/L)"><input style={inp} type="number" step=".01" value={form.nit} onChange={e=>f("nit",e.target.value)} placeholder="0.03"/></Field>
          <Field label="Alkalinity"><input style={inp} type="number" value={form.alk} onChange={e=>f("alk",e.target.value)} placeholder="120"/></Field>
          <Field label="Water Color"><input style={inp} value={form.color} onChange={e=>f("color",e.target.value)} placeholder="Light Green"/></Field>
          <Field label="Notes"><input style={inp} value={form.notes} onChange={e=>f("notes",e.target.value)}/></Field>
        </FGrid>
        {/* Batch preview after tank selected */}
        {form.tId&&(()=>{
          const b=activeBatches.find(x=>x.tId===+form.tId);
          const t=tanks.find(x=>x.id===+form.tId);
          const d=b?calcDOC(b.sd):0;
          return b?(
            <div style={{marginTop:12,padding:"10px 14px",background:C.teal+"10",borderRadius:8,border:"1px solid "+C.teal+"20",display:"flex",gap:20,flexWrap:"wrap"}}>
              <span style={{color:C.sub,fontSize:11}}>Batch: <b style={{color:C.teal}}>{b.no}</b></span>
              <span style={{color:C.sub,fontSize:11}}>Tank: <b style={{color:C.blue}}>{t?.name}</b></span>
              <span style={{color:C.sub,fontSize:11}}>DOC: <b style={{color:d>=22?C.amber:C.teal}}>D{d}</b></span>
              <span style={{color:C.sub,fontSize:11}}>PL Stage: <b style={{color:C.text}}>{b.pl}</b></span>
              <span style={{color:C.sub,fontSize:11}}>PLs: <b style={{color:C.text}}>{((b.cnt||0)/1000).toFixed(0)}K</b></span>
            </div>
          ):null;
        })()}
        {saving&&<div style={{color:C.teal,fontSize:12,marginTop:8}}>Saving…</div>}
      </FormBox>}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <Card><SHead title={"Latest Parameters — "+(selTank?.name||"Select Tank")}/>
          {!latest?<p style={{color:C.sub,fontSize:12}}>No data yet. Add entry above.</p>:
            PARAMS.map(p=>{const v=latest[p.k];const c=pc(p.k,v);return(
              <div key={p.k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                <span style={{color:C.sub,fontSize:12}}>{p.l}</span>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{color:"#334a60",fontSize:10}}>ideal: {p.ideal}</span>
                  <span style={{color:c,fontWeight:700,fontSize:13,minWidth:36,textAlign:"right"}}>{v??""}</span>
                  <span style={{width:7,height:7,borderRadius:"50%",background:c,display:"block"}}/>
                </div>
              </div>
            );})}
        </Card>
        <Card><SHead title={"Trend — "+chartDate}/>
          {chart.length===0?<p style={{color:C.sub,fontSize:12}}>Add morning/afternoon/night entries to see trend.</p>:
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chart}>
              <XAxis dataKey="s" stroke={C.sub} fontSize={11}/>
              <YAxis stroke={C.sub} fontSize={11}/>
              <Tooltip {...TT}/>
              <Line type="monotone" dataKey="temp" stroke={C.red}  strokeWidth={2} dot={{r:4}} name="Temp"/>
              <Line type="monotone" dataKey="do"   stroke={C.teal} strokeWidth={2} dot={{r:4}} name="DO"/>
              <Line type="monotone" dataKey="ph"   stroke={C.blue} strokeWidth={2} dot={{r:4}} name="pH"/>
            </LineChart>
          </ResponsiveContainer>}
        </Card>
      </div>

      <Card><SHead title={"Parameter History — "+(selTank?.name||"All")}/>
        <Tbl heads={["Tank","Shed","Date","Shift","Temp","Salinity","DO","pH","Ammonia","Nitrite","Alkalinity","Color","Notes"]}>
          {[...tParams].sort((a,b)=>b.id-a.id).map(p=>{
            const t=tanks.find(x=>x.id===p.tId);
            return(<TR key={p.id}>
              <TD color={C.blue} bold>{t?.name||"T-"+p.tId}</TD>
              <TD color={C.sub}>{t?.shed}</TD>
              <TD>{p.date}</TD>
              <TD color={p.shift==="morning"?C.amber:p.shift==="afternoon"?"#ff8c00":"#7799ff"}>{p.shift}</TD>
              <TD color={pc("temp",p.temp)}>{p.temp}</TD>
              <TD>{p.sal}</TD>
              <TD color={pc("doV",p.doV)} bold>{p.doV}</TD>
              <TD>{p.ph}</TD>
              <TD color={pc("amm",p.amm)} bold>{p.amm}</TD>
              <TD color={pc("nit",p.nit)} bold>{p.nit}</TD>
              <TD>{p.alk}</TD>
              <TD color={C.teal}>{p.color}</TD>
              <TD color={C.sub} small>{p.notes||"—"}</TD>
            </TR>);
          })}
        </Tbl>
      </Card>
    </div>
  );
}
