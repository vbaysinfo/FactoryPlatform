
import {useState} from "react";
import {useApp} from "../../context/AppContext.jsx";
import {C,KPI,Card,SHead,Badge,Tbl,TR,TD,Tabs,FRow,FSelect,FormBox,FGrid,Field,Alert,inp,sel,TT} from "../common/ui.jsx";
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer} from "recharts";

export default function FeedManagement(){
  const {tanks,batches,feed,feedStock,sheds,addFeed}=useApp();
  const [tab,setTab]=useState("records");
  const [fShed,setFShed]=useState("all");
  const [fTank,setFTank]=useState("all");
  const [show,setShow]=useState(false);
  const today=new Date().toISOString().slice(0,10);
  const blankForm={tId:"",date:today,shift:"morning",stockId:"",brand:"",ftype:"Starter",size:"",qty:"",bio:"",obs:""};
  const [form,setForm]=useState(blankForm);
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));

  // Unique feed brands from inventory stock
  const feedBrands=[...new Map((feedStock||[]).map(s=>[`${s.brand}||${s.type}`,s])).values()];

  // Only tanks with active stocking batches
  const activeBatches=batches.filter(b=>b.status!=="harvested");
  const stockedTanks=tanks.filter(t=>activeBatches.some(b=>b.tId===t.id));

  function selectTank(tId){
    const batch=activeBatches.find(b=>b.tId===+tId);
    const lastFeedBio=feed.filter(r=>r.tId===+tId).sort((a,b)=>b.id-a.id)[0]?.bio;
    const bio=lastFeedBio||batch?.bio||"";
    setForm(p=>({...p,tId,bio:bio||""}));
  }

  function selectBrand(stockId){
    const s=feedStock.find(x=>x.id===+stockId);
    if(s) setForm(p=>({...p,stockId,brand:s.brand,ftype:s.type,size:s.type}));
    else f("stockId",stockId);
  }

  // FCR = cumulative feed kg (including this entry) / current biomass
  function calcFCR(tId,newQtyG,bio){
    const bioNum=+bio||0;
    if(!bioNum)return 0;
    const prevFeedKg=feed.filter(r=>r.tId===+tId).reduce((s,r)=>s+r.qty,0)/1000;
    const totalFeedKg=prevFeedKg+(+newQtyG||0)/1000;
    return+(totalFeedKg/bioNum).toFixed(2);
  }

  // Remaining stock per brand (stocked kg - used kg from feed_logs)
  const remainingByBrand={};
  (feedStock||[]).forEach(s=>{
    const key=`${s.brand}||${s.type}`;
    remainingByBrand[key]=(remainingByBrand[key]||0)+s.qty;
  });
  feed.forEach(r=>{
    const key=`${r.brand}||${r.ftype}`;
    remainingByBrand[key]=(remainingByBrand[key]||0)-(r.qty/1000);
  });

  const filtTanks=tanks.filter(t=>fShed==="all"||t.shedId===+fShed);
  const filtRecs=feed.filter(r=>{const t=tanks.find(x=>x.id===r.tId);return(fShed==="all"||t?.shedId===+fShed)&&(fTank==="all"||r.tId===+fTank);});
  const todayKg=feed.filter(r=>r.date===today).reduce((s,r)=>s+r.qty,0)/1000;
  const avgFCR=feed.filter(r=>r.fcr).length?(feed.filter(r=>r.fcr).reduce((s,r)=>s+(r.fcr||0),0)/feed.filter(r=>r.fcr).length).toFixed(2):"—";
  const totalUsedKg=feed.reduce((s,r)=>s+r.qty,0)/1000;
  const totalRemaining=Math.max(0,Object.values(remainingByBrand).reduce((s,v)=>s+v,0));
  const tankChart=stockedTanks.slice(0,12).map(t=>({name:t.name,g:feed.filter(r=>r.tId===t.id).reduce((s,r)=>s+r.qty,0)})).filter(t=>t.g>0);

  const save=async()=>{
    if(!form.tId||!form.qty||!form.brand)return;
    const q=+form.qty,bio=+form.bio||0;
    const fcr=calcFCR(form.tId,q,bio);
    const stockItem=feedStock.find(x=>x.id===+form.stockId);
    const ckg=stockItem?.ckg||0;
    try{
      await addFeed({...form,tId:+form.tId,qty:q,ckg,cost:(q/1000)*ckg,bio,fcr});
      setShow(false);
      setForm(blankForm);
    }catch(e){alert("Error: "+e.message);}
  };

  return(
    <div style={{padding:"20px 24px"}}>
      <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        <KPI label="Feed Today"    value={todayKg.toFixed(1)+" kg"}        sub="all tanks"      color={C.teal}   icon="🌾"/>
        <KPI label="Total Used"    value={totalUsedKg.toFixed(1)+" kg"}   sub="all time"       color={C.amber}  icon="📦"/>
        <KPI label="Remaining"     value={totalRemaining.toFixed(1)+" kg"} sub="in stock"      color={C.green}  icon="✅"/>
        <KPI label="Avg FCR"       value={avgFCR}                          sub="feed conversion" color={C.blue}  icon="📊"/>
        <KPI label="Total Records" value={feed.length}                     sub="entries"        color={C.purple} icon="📋"/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <Tabs tabs={[{id:"records",label:"Feed Records"},{id:"tankwise",label:"Tank-wise Summary"},{id:"inventory",label:"Inventory"}]} active={tab} onChange={setTab}/>
        {tab==="records"&&<button onClick={()=>setShow(true)} style={{background:"linear-gradient(135deg,#00d4aa,#0099ff)",color:"#000",fontWeight:700,fontSize:13,padding:"8px 18px",borderRadius:10,border:"none",cursor:"pointer"}}>+ Add Record</button>}
      </div>
      {tab!=="inventory"&&<FRow>
        <FSelect label="Shed:" value={fShed} onChange={v=>{setFShed(v);setFTank("all");}}>
          <option value="all">All Sheds</option>{sheds.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </FSelect>
        <FSelect label="Tank:" value={fTank} onChange={setFTank}>
          <option value="all">All Tanks</option>{filtTanks.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
        </FSelect>
      </FRow>}

      {show&&tab==="records"&&<FormBox title="🌾 Add Feed Record" onClose={()=>setShow(false)} onSave={save}>
        <FGrid cols={4}>
          <Field label="Tank (Active Stocking) *">
            <select style={sel} value={form.tId} onChange={e=>selectTank(e.target.value)}>
              <option value="">— Select Tank —</option>
              {stockedTanks.map(t=>{
                const b=activeBatches.find(x=>x.tId===t.id);
                return <option key={t.id} value={t.id}>{t.name} [{t.shed||"—"}] {b?`• ${b.no} D${Math.max(0,Math.floor((new Date()-new Date(b.sd||""))/(864e5)))}`:""}</option>;
              })}
            </select>
          </Field>
          <Field label="Date"><input style={inp} type="date" value={form.date} onChange={e=>f("date",e.target.value)}/></Field>
          <Field label="Shift"><select style={sel} value={form.shift} onChange={e=>f("shift",e.target.value)}><option value="morning">🌅 Morning</option><option value="afternoon">☀️ Afternoon</option><option value="night">🌙 Night</option></select></Field>
          <Field label="Feed (from Inventory) *">
            <select style={sel} value={form.stockId} onChange={e=>selectBrand(e.target.value)}>
              <option value="">— Select Feed —</option>
              {feedBrands.map(s=>{
                const key=`${s.brand}||${s.type}`;
                const rem=Math.max(0,remainingByBrand[key]||0);
                return <option key={s.id} value={s.id}>{s.brand} — {s.type} ({rem.toFixed(1)} kg left)</option>;
              })}
            </select>
          </Field>
          <Field label="Quantity (g)"><input style={inp} type="number" value={form.qty} onChange={e=>f("qty",e.target.value)} placeholder="2500"/></Field>
          <Field label="Biomass (kg) *"><input style={inp} type="number" step=".1" value={form.bio} onChange={e=>f("bio",e.target.value)} placeholder="41.0"/></Field>
          <Field label="Observations"><input style={inp} value={form.obs} onChange={e=>f("obs",e.target.value)} placeholder="Feeding response..."/></Field>
        </FGrid>
        {form.tId&&(()=>{
          const b=activeBatches.find(x=>x.tId===+form.tId);
          const t=tanks.find(x=>x.id===+form.tId);
          const doc=b?Math.max(0,Math.floor((new Date()-new Date(b.sd||""))/(864e5))):0;
          const fcr=calcFCR(form.tId,form.qty,form.bio);
          const stockItem=feedStock.find(x=>x.id===+form.stockId);
          const ckg=stockItem?.ckg||0;
          const feedCost=form.qty&&ckg?((+form.qty/1000)*ckg).toFixed(2):"—";
          const remKey=`${form.brand}||${form.ftype}`;
          const remAfter=form.qty?Math.max(0,(remainingByBrand[remKey]||0)-(+form.qty/1000)):null;
          return b?(
            <div style={{marginTop:12,padding:"10px 14px",background:C.teal+"10",borderRadius:8,border:"1px solid "+C.teal+"20",display:"flex",gap:20,flexWrap:"wrap"}}>
              <span style={{color:C.sub,fontSize:11}}>Batch: <b style={{color:C.teal}}>{b.no}</b></span>
              <span style={{color:C.sub,fontSize:11}}>Tank: <b style={{color:C.blue}}>{t?.name}</b></span>
              <span style={{color:C.sub,fontSize:11}}>DOC: <b style={{color:doc>=22?C.amber:C.teal}}>D{doc}</b></span>
              <span style={{color:C.sub,fontSize:11}}>PL Stage: <b style={{color:C.text}}>{b.pl}</b></span>
              {form.bio&&<span style={{color:C.sub,fontSize:11}}>FCR (auto): <b style={{color:fcr>1.5?C.amber:C.blue}}>{fcr}</b></span>}
              {feedCost!=="—"&&<span style={{color:C.sub,fontSize:11}}>Feed Cost: <b style={{color:C.purple}}>₹{feedCost}</b> <span style={{color:"#555",fontSize:9}}>(₹{ckg}/kg)</span></span>}
              {remAfter!=null&&<span style={{color:C.sub,fontSize:11}}>Stock after save: <b style={{color:remAfter<5?C.red:C.teal}}>{remAfter.toFixed(1)} kg</b></span>}
            </div>
          ):null;
        })()}
      </FormBox>}

      {tab==="records"&&<Card><Tbl heads={["Tank","Shed","DOC","Date","Shift","Brand","Type","Qty(kg)","Biomass","FCR","Notes"]}>
        {filtRecs.map(r=>{
          const t=tanks.find(x=>x.id===r.tId);
          const b=batches.find(x=>x.tId===r.tId&&x.status!=="harvested");
          const doc=b?Math.max(0,Math.floor((new Date(r.date)-new Date(b.sd||""))/(864e5))):null;
          const docColor=doc==null?C.sub:doc>=22?C.amber:doc>=15?C.blue:C.teal;
          return(<TR key={r.id}>
            <TD color={C.blue} bold>{t?.name||"T-"+r.tId}</TD><TD color={C.sub}>{t?.shed}</TD>
            <TD color={docColor} bold>{doc!=null?"D"+doc:"—"}</TD>
            <TD>{r.date}</TD>
            <TD color={r.shift==="morning"?C.amber:r.shift==="afternoon"?"#ff8c00":"#7799ff"}>{r.shift}</TD>
            <TD>{r.brand}</TD><TD><Badge label={r.ftype} color={r.ftype==="Starter"?C.teal:r.ftype==="Grower"?C.blue:C.amber}/></TD>
            <TD bold>{(r.qty/1000).toFixed(2)}</TD>
            <TD color={C.amber}>{r.bio?r.bio+"kg":"—"}</TD><TD color={C.blue}>{r.fcr||"—"}</TD><TD color={C.sub} small>{r.obs||"—"}</TD>
          </TR>);
        })}
      </Tbl></Card>}

      {tab==="tankwise"&&<div>
        <Card style={{marginBottom:14}}><SHead title="Feed Consumption by Tank (grams)"/>
          <ResponsiveContainer width="100%" height={260}><BarChart data={tankChart}><XAxis dataKey="name" stroke={C.sub} fontSize={10}/><YAxis stroke={C.sub} fontSize={10}/><Tooltip {...TT}/><Bar dataKey="g" fill={C.teal} radius={[5,5,0,0]} name="Grams"/></BarChart></ResponsiveContainer>
        </Card>
        <Card><SHead title="Tank-wise Summary"/><Tbl heads={["Tank","Shed","Type","Total Feed(kg)","Total Cost","Batch","DOC","Biomass","FCR","SR%"]}>
          {stockedTanks.map(t=>{
            const b=activeBatches.find(x=>x.tId===t.id);
            const rs=feed.filter(r=>r.tId===t.id);
            const tk=rs.reduce((s,r)=>s+r.qty,0)/1000;
            const tc=rs.reduce((s,r)=>s+r.cost,0);
            const doc=b?Math.max(0,Math.floor((new Date()-new Date(b.sd||""))/(864e5))):0;
            return(<TR key={t.id}>
              <TD color={C.blue} bold>{t.name}</TD><TD color={C.sub}>{t.shed}</TD>
              <TD><Badge label={t.type} color={t.type==="culture"?C.teal:C.purple}/></TD>
              <TD color={C.teal} bold>{tk.toFixed(2)}</TD><TD color={C.purple}>₹{tc.toLocaleString("en-IN")}</TD>
              <TD color={C.sub}>{b?.no||"—"}</TD>
              <TD color={doc>=22?C.amber:C.teal} bold>{b?"D"+doc:"—"}</TD>
              <TD color={C.amber}>{b?.bio||"—"}kg</TD>
              <TD color={C.blue}>{b?.fcr||"—"}</TD><TD color={C.green} bold>{b?.sr||"—"}%</TD>
            </TR>);
          })}
        </Tbl></Card>
      </div>}

      {tab==="inventory"&&(()=>{
        // Aggregate feedStock by brand+type, calc used from feed_logs
        const stockMap={};
        (feedStock||[]).forEach(s=>{
          const key=`${s.brand}||${s.type}`;
          if(!stockMap[key]) stockMap[key]={brand:s.brand,type:s.type,stocked:0,ckg:s.ckg,supplier:s.supplier,expiry:s.expiry};
          stockMap[key].stocked+=s.qty;
        });
        feed.forEach(r=>{
          const key=`${r.brand}||${r.ftype}`;
          if(stockMap[key]) stockMap[key].stocked-=r.qty/1000;
        });
        const items=Object.values(stockMap);
        if(items.length===0) return(
          <div style={{textAlign:"center",padding:"48px",color:C.sub}}>
            <div style={{fontSize:32,marginBottom:12}}>📦</div>
            <div style={{fontSize:13,color:C.text}}>No feed stock added yet.</div>
            <div style={{fontSize:11,marginTop:4}}>Go to <b style={{color:C.teal}}>Inventory → Feed Stock</b> to add stock first.</div>
          </div>
        );
        return(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14}}>
            {items.map((item,i)=>{
              const remaining=Math.max(0,item.stocked);
              const used=Object.values(stockMap).length>0?(feedStock.filter(s=>`${s.brand}||${s.type}`===`${item.brand}||${item.type}`).reduce((a,s)=>a+s.qty,0)-remaining):0;
              const totalStocked=feedStock.filter(s=>`${s.brand}||${s.type}`===`${item.brand}||${item.type}`).reduce((a,s)=>a+s.qty,0);
              const pct=totalStocked>0?Math.round((remaining/totalStocked)*100):0;
              const low=pct<20;
              return(
                <div key={i} style={{background:C.card,borderRadius:14,padding:"18px 20px",border:"1px solid "+(low?C.red+"50":C.border)}}>
                  {low&&<div style={{background:C.red+"18",color:C.red,fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:99,display:"inline-block",marginBottom:10}}>⚠️ LOW STOCK</div>}
                  <h3 style={{color:C.text,fontSize:14,fontWeight:700,margin:"0 0 2px"}}>{item.brand}</h3>
                  <p style={{color:C.teal,fontSize:12,margin:"0 0 12px"}}>{item.type}</p>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{color:C.sub,fontSize:12}}>Remaining</span>
                    <span style={{color:low?C.red:C.teal,fontWeight:700,fontSize:16}}>{remaining.toFixed(1)} kg</span>
                  </div>
                  <div style={{height:5,borderRadius:3,background:"rgba(255,255,255,0.08)",marginBottom:12}}>
                    <div style={{height:"100%",width:pct+"%",borderRadius:3,background:low?C.red:C.teal}}/>
                  </div>
                  {[
                    ["Total Stocked", totalStocked.toFixed(1)+" kg"],
                    ["Used",          (totalStocked-remaining).toFixed(1)+" kg"],
                    ["Remaining",     remaining.toFixed(1)+" kg ("+pct+"%)"],
                    ["Cost/kg",       "₹"+item.ckg],
                    ["Supplier",      item.supplier||"—"],
                    ["Expiry",        item.expiry||"—"],
                  ].map(([l,v])=>(
                    <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <span style={{color:C.sub,fontSize:11}}>{l}</span>
                      <span style={{color:l==="Remaining"?C.teal:l==="Used"?C.amber:C.text,fontSize:11,fontWeight:l==="Remaining"||l==="Used"?600:400}}>{v}</span>
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
