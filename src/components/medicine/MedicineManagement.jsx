
import {useState} from "react";
import {useApp} from "../../context/AppContext.jsx";
import {C,KPI,Card,Badge,Tbl,TR,TD,Tabs,FRow,FSelect,FormBox,FGrid,Field,Alert,inp,sel} from "../common/ui.jsx";
const TC={Mineral:C.blue,Probiotic:C.teal,Vitamin:C.purple,Antibiotic:C.red,Disinfectant:C.amber,Other:C.sub};

export default function MedicineManagement(){
  const {tanks,batches,meds,medStock,sheds,addMed}=useApp();
  const [tab,setTab]=useState("records");
  const [fShed,setFShed]=useState("all");
  const [fTank,setFTank]=useState("all");
  const [show,setShow]=useState(false);
  const [saving,setSaving]=useState(false);
  const today=new Date().toISOString().slice(0,10);
  const [form,setForm]=useState({tId:"",date:today,name:"",mtype:"Probiotic",dose:"",unit:"g",method:"Direct",reason:"",cost:"",notes:""});
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));

  // Only tanks with active stocking batches
  const activeBatches=batches.filter(b=>b.status!=="harvested");
  const stockedTanks=tanks.filter(t=>activeBatches.some(b=>b.tId===t.id));

  function selectTank(tId){
    f("tId",tId);
  }

  const filtTanks=tanks.filter(t=>fShed==="all"||t.shedId===+fShed);
  const filtRecs=meds.filter(r=>{const t=tanks.find(x=>x.id===r.tId);return(fShed==="all"||t?.shedId===+fShed)&&(fTank==="all"||r.tId===+fTank);});
  const expiring=(medStock||[]).filter(m=>m.expiry&&(new Date(m.expiry)-new Date())/(864e5)<=90);
  const lowStock=[];

  const save=async()=>{
    if(!form.tId||!form.name)return;
    setSaving(true);
    try{
      await addMed({...form,tId:+form.tId,dose:+form.dose,cost:+form.cost});
      setShow(false);
      setForm({tId:"",date:today,name:"",mtype:"Probiotic",dose:"",unit:"g",method:"Direct",reason:"",cost:"",notes:""});
    }catch(e){console.error("addMed error:",e);}
    finally{setSaving(false);}
  };

  return(
    <div style={{padding:"20px 24px"}}>
      {expiring.length>0&&<Alert type="warn" msg={"⏰ Expiring soon: "+expiring.map(m=>m.name).join(", ")}/>}
      {lowStock.length>0&&<Alert type="danger" msg={"📦 Low stock: "+lowStock.map(m=>m.name).join(", ")}/>}
      <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        <KPI label="Total Records"   value={meds.length}       sub="treatments"    color={C.blue}   icon="📋"/>
        <KPI label="Inventory Items" value={(medStock||[]).length} sub="stock entries" color={C.teal} icon="💊"/>
        <KPI label="Expiring Soon"   value={expiring.length}   sub="within 90 days" color={C.amber} icon="⏰"/>
        <KPI label="Low Stock"       value={lowStock.length}   sub="need reorder"  color={C.red}    icon="⚠️"/>
        <KPI label="Total Cost"      value={"₹"+meds.reduce((s,r)=>s+r.cost,0).toLocaleString("en-IN")} sub="all treatments" color={C.purple} icon="💰"/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <Tabs tabs={[{id:"records",label:"Treatment Records"},{id:"inventory",label:"Inventory"}]} active={tab} onChange={setTab}/>
        {tab==="records"&&<button onClick={()=>setShow(true)} style={{background:"linear-gradient(135deg,#00d4aa,#0099ff)",color:"#000",fontWeight:700,fontSize:13,padding:"8px 18px",borderRadius:10,border:"none",cursor:"pointer"}}>+ Add Treatment</button>}
      </div>
      {tab==="records"&&<FRow>
        <FSelect label="Shed:" value={fShed} onChange={v=>{setFShed(v);setFTank("all");}}>
          <option value="all">All Sheds</option>{sheds.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </FSelect>
        <FSelect label="Tank:" value={fTank} onChange={setFTank}>
          <option value="all">All Tanks</option>{filtTanks.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
        </FSelect>
      </FRow>}

      {show&&tab==="records"&&<FormBox title="💊 Add Treatment" onClose={()=>setShow(false)} onSave={save}>
        <FGrid cols={4}>
          <Field label="Tank (Active Stocking) *">
            <select style={sel} value={form.tId} onChange={e=>selectTank(e.target.value)}>
              <option value="">— Select Tank —</option>
              {stockedTanks.map(t=>{
                const b=activeBatches.find(x=>x.tId===t.id);
                const doc=b?Math.max(0,Math.floor((new Date()-new Date(b.sd||""))/(864e5))):0;
                return <option key={t.id} value={t.id}>{t.name} [{t.shed||"—"}] {b?`• ${b.no} D${doc}`:""}</option>;
              })}
            </select>
          </Field>
          <Field label="Date"><input style={inp} type="date" value={form.date} onChange={e=>f("date",e.target.value)}/></Field>
          <Field label="Medicine Name"><input style={inp} value={form.name} onChange={e=>f("name",e.target.value)} placeholder="EDTA"/></Field>
          <Field label="Type"><select style={sel} value={form.mtype} onChange={e=>f("mtype",e.target.value)}>{["Mineral","Probiotic","Vitamin","Antibiotic","Disinfectant","Other"].map(t=><option key={t}>{t}</option>)}</select></Field>
          <Field label="Dosage"><input style={inp} type="number" value={form.dose} onChange={e=>f("dose",e.target.value)} placeholder="2"/></Field>
          <Field label="Unit"><select style={sel} value={form.unit} onChange={e=>f("unit",e.target.value)}>{["g","kg","ml","L","ppm"].map(u=><option key={u}>{u}</option>)}</select></Field>
          <Field label="Application"><select style={sel} value={form.method} onChange={e=>f("method",e.target.value)}><option>Direct</option><option>Premix with feed</option><option>Water treatment</option></select></Field>
          <Field label="Reason"><input style={inp} value={form.reason} onChange={e=>f("reason",e.target.value)} placeholder="Ammonia control"/></Field>
          <Field label="Cost (₹)"><input style={inp} type="number" value={form.cost} onChange={e=>f("cost",e.target.value)} placeholder="400"/></Field>
          <Field label="Notes"><input style={inp} value={form.notes} onChange={e=>f("notes",e.target.value)}/></Field>
        </FGrid>
        {form.tId&&(()=>{
          const b=activeBatches.find(x=>x.tId===+form.tId);
          const t=tanks.find(x=>x.id===+form.tId);
          const doc=b?Math.max(0,Math.floor((new Date()-new Date(b.sd||""))/(864e5))):0;
          return b?(
            <div style={{marginTop:12,padding:"10px 14px",background:C.teal+"10",borderRadius:8,border:"1px solid "+C.teal+"20",display:"flex",gap:20,flexWrap:"wrap"}}>
              <span style={{color:C.sub,fontSize:11}}>Batch: <b style={{color:C.teal}}>{b.no}</b></span>
              <span style={{color:C.sub,fontSize:11}}>Tank: <b style={{color:C.blue}}>{t?.name}</b></span>
              <span style={{color:C.sub,fontSize:11}}>DOC: <b style={{color:doc>=22?C.amber:C.teal}}>D{doc}</b></span>
              <span style={{color:C.sub,fontSize:11}}>PL Stage: <b style={{color:C.text}}>{b.pl}</b></span>
              <span style={{color:C.sub,fontSize:11}}>PLs: <b style={{color:C.text}}>{((b.cnt||0)/1000).toFixed(0)}K</b></span>
            </div>
          ):null;
        })()}
        {saving&&<div style={{color:C.teal,fontSize:12,marginTop:8}}>Saving...</div>}
      </FormBox>}

      {tab==="records"&&<Card><Tbl heads={["Tank","Shed","DOC","Date","Medicine","Type","Dosage","Method","Reason","Cost","Notes"]}>
        {filtRecs.map(r=>{
          const t=tanks.find(x=>x.id===r.tId);
          const b=batches.find(x=>x.tId===r.tId&&x.status!=="harvested");
          const doc=b?Math.max(0,Math.floor((new Date(r.date)-new Date(b.sd||""))/(864e5))):null;
          const docColor=doc==null?C.sub:doc>=22?C.amber:doc>=15?C.blue:C.teal;
          const c=TC[r.mtype]||C.sub;
          return(<TR key={r.id}>
            <TD color={C.blue} bold>{t?.name}</TD><TD color={C.sub}>{t?.shed}</TD>
            <TD color={docColor} bold>{doc!=null?"D"+doc:"—"}</TD>
            <TD>{r.date}</TD>
            <TD bold>{r.name}</TD><TD><Badge label={r.mtype} color={c}/></TD>
            <TD>{r.dose} {r.unit}</TD><TD color={C.sub} small>{r.method}</TD>
            <TD color={C.sub} small>{r.reason}</TD><TD color={C.purple} bold>₹{r.cost}</TD>
            <TD color={C.sub} small>{r.notes||"—"}</TD>
          </TR>);
        })}
      </Tbl></Card>}

      {tab==="inventory"&&(()=>{
        // Aggregate medStock by name+type, calc used from medicine_logs
        const stockMap={};
        (medStock||[]).forEach(s=>{
          const key=`${s.name}||${s.mtype}`;
          if(!stockMap[key]) stockMap[key]={name:s.name,mtype:s.mtype,unit:s.unit,stocked:0,cunit:s.cunit,supplier:s.supplier,expiry:s.expiry};
          stockMap[key].stocked+=s.qty;
        });
        meds.forEach(r=>{
          const key=`${r.name}||${r.mtype}`;
          if(stockMap[key]) stockMap[key].stocked-=(r.dose||0);
        });
        const items=Object.values(stockMap);
        if(items.length===0) return(
          <div style={{textAlign:"center",padding:"48px",color:C.sub}}>
            <div style={{fontSize:32,marginBottom:12}}>💊</div>
            <div style={{fontSize:13,color:C.text}}>No medicine stock added yet.</div>
            <div style={{fontSize:11,marginTop:4}}>Go to <b style={{color:C.teal}}>Inventory → Medicine Stock</b> to add stock first.</div>
          </div>
        );
        return(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:14}}>
            {items.map((item,i)=>{
              const c=TC[item.mtype]||C.sub;
              const totalStocked=(medStock||[]).filter(s=>`${s.name}||${s.mtype}`===`${item.name}||${item.mtype}`).reduce((a,s)=>a+s.qty,0);
              const remaining=Math.max(0,item.stocked);
              const used=totalStocked-remaining;
              const pct=totalStocked>0?Math.round((remaining/totalStocked)*100):0;
              const low=pct<20;
              const dl=item.expiry?Math.ceil((new Date(item.expiry)-new Date())/864e5):null;
              const exp=dl!=null&&dl<=90;
              return(
                <div key={i} style={{background:C.card,borderRadius:14,padding:"18px 20px",border:"1px solid "+(low||exp?C.red+"50":C.border)}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                    <div><h3 style={{color:C.text,fontSize:14,fontWeight:700,margin:"0 0 4px"}}>{item.name}</h3><Badge label={item.mtype} color={c}/></div>
                    {(low||exp)&&<span style={{fontSize:18}}>{low?"⚠️":"⏰"}</span>}
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",margin:"10px 0 4px"}}>
                    <span style={{color:C.sub,fontSize:12}}>Remaining</span>
                    <span style={{color:low?C.red:C.teal,fontWeight:700,fontSize:16}}>{remaining.toFixed(1)} {item.unit}</span>
                  </div>
                  <div style={{height:5,borderRadius:3,background:"rgba(255,255,255,0.08)",marginBottom:12}}>
                    <div style={{height:"100%",width:pct+"%",borderRadius:3,background:low?C.red:C.teal}}/>
                  </div>
                  {[
                    ["Total Stocked", totalStocked.toFixed(1)+" "+item.unit],
                    ["Used",          used.toFixed(1)+" "+item.unit],
                    ["Remaining",     remaining.toFixed(1)+" "+item.unit+" ("+pct+"%)"],
                    ["Cost/Unit",     "₹"+item.cunit],
                    ["Supplier",      item.supplier||"—"],
                    ["Expiry",        item.expiry?(item.expiry+(exp?" ⚠️":"")):"—"],
                  ].map(([l,v])=>(
                    <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <span style={{color:C.sub,fontSize:11}}>{l}</span>
                      <span style={{color:l==="Remaining"?C.teal:l==="Used"?C.amber:exp&&l==="Expiry"?C.red:C.text,fontSize:11,fontWeight:l==="Remaining"||l==="Used"?600:400}}>{v}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
