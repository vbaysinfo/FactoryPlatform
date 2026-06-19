import { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext.jsx";
import { C,Btn,Card,SHead,Tabs,KPI,Tbl,TR,TD,Badge,FRow,FSelect,FormBox,Field,FGrid,Alert,inp,sel } from "../common/ui.jsx";

const MONTHS=["All","January","February","March","April","May","June","July","August","September","October","November","December"];
const YEARS=["All","2024","2023"];

// ── helpers ─────────────────────────────────────────────────
function fmt(n){return "₹"+(n||0).toLocaleString("en-IN");}
function fmtN(n,u="kg"){return `${(n||0).toFixed(1)} ${u}`;}
function matchMonth(dateStr,month,year){
  if(!dateStr)return true;
  const d=new Date(dateStr);
  const mOk=month==="All"||MONTHS[d.getMonth()+1]===month;
  const yOk=year==="All"||d.getFullYear().toString()===year;
  return mOk&&yOk;
}
function statusColor(pct){
  if(pct<=20)return C.red;
  if(pct<=40)return C.amber;
  return C.green;
}
function ProgressBar({pct,color}){
  return(
    <div style={{background:"rgba(255,255,255,0.06)",borderRadius:99,height:6,width:120,overflow:"hidden"}}>
      <div style={{width:`${Math.min(100,pct)}%`,height:"100%",background:color,borderRadius:99,transition:"width .4s"}}/>
    </div>
  );
}

// ── Feed Tab ────────────────────────────────────────────────
function FeedTab(){
  const {feedStock,feed,addFeedStock}=useApp();
  const [month,setMonth]=useState("All");
  const [year, setYear]=useState("All");
  const [brand,setBrand]=useState("All");
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({brand:"",type:"",qty:"",date:"",supplier:"",invoice:"",ckg:"",expiry:"",notes:""});

  const brands=["All",...new Set((feedStock||[]).map(f=>f.brand))];

  const filtered=(feedStock||[]).filter(s=>
    matchMonth(s.date,month,year)&&(brand==="All"||s.brand===brand)
  );

  // Calculate consumed per brand+type from feed_logs
  const consumed=useMemo(()=>{
    const map={};
    (feed||[]).forEach(f=>{
      const key=`${f.brand}||${f.ftype}`;
      map[key]=(map[key]||0)+(f.qty||0)/1000; // convert grams to kg
    });
    return map;
  },[feed]);

  // Aggregate by brand+type
  const summary=useMemo(()=>{
    const map={};
    (feedStock||[]).forEach(s=>{
      const key=`${s.brand}||${s.type}`;
      if(!map[key]) map[key]={brand:s.brand,type:s.type,totalStocked:0,totalCost:0,ckg:s.ckg,expiry:s.expiry,supplier:s.supplier};
      map[key].totalStocked+=s.qty;
      map[key].totalCost+=s.total;
    });
    return Object.values(map).map(r=>{
      const key=`${r.brand}||${r.type.split(" ")[0]}`;
      const used=consumed[key]||0;
      const remaining=Math.max(0,r.totalStocked-used);
      const pct=r.totalStocked>0?Math.round((remaining/r.totalStocked)*100):0;
      return {...r,used:used.toFixed(1),remaining:remaining.toFixed(1),pct};
    });
  },[feedStock,consumed]);

  const totalStocked=(feedStock||[]).reduce((a,s)=>a+s.qty,0);
  const totalCost=(feedStock||[]).reduce((a,s)=>a+s.total,0);
  const totalUsedKg=Object.values(consumed).reduce((a,b)=>a+b,0);
  const totalRemaining=Math.max(0,totalStocked-totalUsedKg);

  async function save(){
    const s={...form,qty:+form.qty,ckg:+form.ckg,total:+form.qty*+form.ckg};
    try{ await addFeedStock(s); setShowForm(false); setForm({brand:"",type:"",qty:"",date:"",supplier:"",invoice:"",ckg:"",expiry:"",notes:""}); }
    catch(e){ alert("Error: "+e.message); }
  }

  return(
    <div>
      {/* Top bar */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{color:C.sub,fontSize:13}}>Manage feed stock purchases and consumption</div>
        <Btn onClick={()=>setShowForm(v=>!v)}>+ Add Stock</Btn>
      </div>
      {showForm&&(
        <FormBox title="Add Feed Stock Entry" onClose={()=>setShowForm(false)} onSave={save}>
          <FGrid cols={3}>
            <Field label="Brand"><input style={inp} value={form.brand} onChange={e=>setForm(p=>({...p,brand:e.target.value}))} placeholder="CP Feeds"/></Field>
            <Field label="Feed Type"><input style={inp} value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} placeholder="Starter 0.3mm"/></Field>
            <Field label="Quantity (kg)"><input style={inp} type="number" value={form.qty} onChange={e=>setForm(p=>({...p,qty:e.target.value}))}/></Field>
            <Field label="Cost/kg (₹)"><input style={inp} type="number" value={form.ckg} onChange={e=>setForm(p=>({...p,ckg:e.target.value}))}/></Field>
            <Field label="Purchase Date"><input style={inp} type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></Field>
            <Field label="Supplier"><input style={inp} value={form.supplier} onChange={e=>setForm(p=>({...p,supplier:e.target.value}))}/></Field>
            <Field label="Invoice No"><input style={inp} value={form.invoice} onChange={e=>setForm(p=>({...p,invoice:e.target.value}))}/></Field>
            <Field label="Expiry Date"><input style={inp} type="date" value={form.expiry} onChange={e=>setForm(p=>({...p,expiry:e.target.value}))}/></Field>
            <Field label="Notes"><input style={inp} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></Field>
          </FGrid>
        </FormBox>
      )}
      {/* KPIs */}
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <KPI label="Total Stocked"  value={`${totalStocked.toFixed(0)} kg`} sub="All time"              icon="📦" color={C.blue}/>
        <KPI label="Total Used"     value={`${totalUsedKg.toFixed(1)} kg`} sub="From feed logs"         icon="🌾" color={C.amber}/>
        <KPI label="Remaining"      value={`${totalRemaining.toFixed(1)} kg`} sub="Available in stock"  icon="✅" color={C.green}/>
        <KPI label="Total Cost"     value={fmt(totalCost)}               sub="All purchases"            icon="💰" color={C.teal}/>
      </div>

      {/* Stock Summary per brand */}
      <Card style={{marginBottom:16}}>
        <SHead title="Feed Stock Summary — Remaining vs Used"/>
        <Tbl heads={["Brand","Type","Stocked (kg)","Used (kg)","Remaining (kg)","Stock Level","Cost/kg","Total Cost"]}>
          {summary.map((r,i)=>{
            const c=statusColor(r.pct);
            return(
              <TR key={i}>
                <TD bold>{r.brand}</TD>
                <TD>{r.type}</TD>
                <TD>{r.totalStocked}</TD>
                <TD color={C.amber}>{r.used}</TD>
                <TD bold color={c}>{r.remaining}</TD>
                <TD><div style={{display:"flex",alignItems:"center",gap:8}}><ProgressBar pct={r.pct} color={c}/><span style={{color:c,fontSize:11}}>{r.pct}%</span></div></TD>
                <TD>{fmt(r.ckg)}</TD>
                <TD bold>{fmt(r.totalCost)}</TD>
              </TR>
            );
          })}
        </Tbl>
      </Card>

      {/* Filters + Add */}
      <div style={{display:"flex",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
        <FRow>
          <FSelect label="Month" value={month} onChange={setMonth}>{MONTHS.map(m=><option key={m}>{m}</option>)}</FSelect>
          <FSelect label="Year"  value={year}  onChange={setYear}>{YEARS.map(y=><option key={y}>{y}</option>)}</FSelect>
          <FSelect label="Brand" value={brand} onChange={setBrand}>{brands.map(b=><option key={b}>{b}</option>)}</FSelect>
        </FRow>
      </div>

      {/* Purchase history */}
      <Card>
        <SHead title={`Feed Purchase History (${filtered.length} entries)`}/>
        <Tbl heads={["Date","Brand","Type","Qty (kg)","Cost/kg","Total","Supplier","Invoice","Expiry","Notes"]}>
          {filtered.map(s=>{
            const exp=s.expiry?new Date(s.expiry)<new Date():false;
            return(
              <TR key={s.id}>
                <TD>{s.date}</TD>
                <TD bold>{s.brand}</TD>
                <TD>{s.type}</TD>
                <TD bold color={C.blue}>{s.qty}</TD>
                <TD>{fmt(s.ckg)}</TD>
                <TD bold>{fmt(s.total)}</TD>
                <TD>{s.supplier}</TD>
                <TD small color={C.sub}>{s.invoice}</TD>
                <TD><Badge label={s.expiry||"—"} color={exp?C.red:C.green}/></TD>
                <TD small color={C.sub}>{s.notes||"—"}</TD>
              </TR>
            );
          })}
        </Tbl>
      </Card>
    </div>
  );
}

// ── Medicine Tab ─────────────────────────────────────────────
function MedicineTab(){
  const {medStock,meds,addMedStock}=useApp();
  const [month,setMonth]=useState("All");
  const [year, setYear]=useState("All");
  const [mtype,setMtype]=useState("All");
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({name:"",mtype:"",qty:"",unit:"kg",date:"",supplier:"",invoice:"",cunit:"",expiry:"",notes:""});

  const types=["All",...new Set((medStock||[]).map(m=>m.mtype))];
  const filtered=(medStock||[]).filter(s=>matchMonth(s.date,month,year)&&(mtype==="All"||s.mtype===mtype));

  const consumed=useMemo(()=>{
    const map={};
    (meds||[]).forEach(m=>{
      const key=m.name;
      const qty=m.unit==="g"?(m.dose||0)/1000:(m.dose||0);
      map[key]=(map[key]||0)+qty;
    });
    return map;
  },[meds]);

  const summary=useMemo(()=>{
    const map={};
    (medStock||[]).forEach(s=>{
      if(!map[s.name]) map[s.name]={name:s.name,mtype:s.mtype,totalStocked:0,totalCost:0,unit:s.unit,supplier:s.supplier};
      map[s.name].totalStocked+=s.qty;
      map[s.name].totalCost+=s.total;
    });
    return Object.values(map).map(r=>{
      const used=consumed[r.name]||0;
      const remaining=Math.max(0,r.totalStocked-used);
      const pct=r.totalStocked>0?Math.round((remaining/r.totalStocked)*100):0;
      return {...r,used:used.toFixed(2),remaining:remaining.toFixed(2),pct};
    });
  },[medStock,consumed]);

  const totalCost=(medStock||[]).reduce((a,s)=>a+s.total,0);

  async function save(){
    const s={...form,qty:+form.qty,cunit:+form.cunit,total:+form.qty*+form.cunit};
    try{ await addMedStock(s); setShowForm(false); setForm({name:"",mtype:"",qty:"",unit:"kg",date:"",supplier:"",invoice:"",cunit:"",expiry:"",notes:""}); }
    catch(e){ alert("Error: "+e.message); }
  }

  return(
    <div>
      {/* Top bar */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{color:C.sub,fontSize:13}}>Manage medicine stock purchases and consumption</div>
        <Btn onClick={()=>setShowForm(v=>!v)}>+ Add Stock</Btn>
      </div>
      {showForm&&(
        <FormBox title="Add Medicine Stock Entry" onClose={()=>setShowForm(false)} onSave={save}>
          <FGrid cols={3}>
            <Field label="Medicine Name"><input style={inp} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="EDTA"/></Field>
            <Field label="Type"><select style={sel} value={form.mtype} onChange={e=>setForm(p=>({...p,mtype:e.target.value}))}><option>Mineral</option><option>Probiotic</option><option>Vitamin</option><option>Antibiotic</option><option>Chemical</option></select></Field>
            <Field label="Quantity"><input style={inp} type="number" value={form.qty} onChange={e=>setForm(p=>({...p,qty:e.target.value}))}/></Field>
            <Field label="Unit"><select style={sel} value={form.unit} onChange={e=>setForm(p=>({...p,unit:e.target.value}))}><option>kg</option><option>g</option><option>L</option><option>ml</option><option>pcs</option></select></Field>
            <Field label="Cost/Unit (₹)"><input style={inp} type="number" value={form.cunit} onChange={e=>setForm(p=>({...p,cunit:e.target.value}))}/></Field>
            <Field label="Purchase Date"><input style={inp} type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></Field>
            <Field label="Expiry Date"><input style={inp} type="date" value={form.expiry} onChange={e=>setForm(p=>({...p,expiry:e.target.value}))}/></Field>
            <Field label="Supplier"><input style={inp} value={form.supplier} onChange={e=>setForm(p=>({...p,supplier:e.target.value}))}/></Field>
            <Field label="Invoice No"><input style={inp} value={form.invoice} onChange={e=>setForm(p=>({...p,invoice:e.target.value}))}/></Field>
          </FGrid>
        </FormBox>
      )}
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <KPI label="Total Items"    value={summary.length}       sub="Medicine types"          icon="💊" color={C.purple}/>
        <KPI label="Total Invested" value={fmt(totalCost)}       sub="All purchases"           icon="💰" color={C.teal}/>
        <KPI label="Near Expiry"    value={(medStock||[]).filter(s=>s.expiry&&new Date(s.expiry)<new Date(Date.now()+30*24*60*60*1000)).length} sub="Within 30 days" icon="⚠️" color={C.amber}/>
        <KPI label="Low Stock"      value={summary.filter(s=>s.pct<=20).length} sub="Below 20%"   icon="🔴" color={C.red}/>
      </div>

      <Card style={{marginBottom:16}}>
        <SHead title="Medicine Stock Summary"/>
        <Tbl heads={["Name","Type","Stocked","Used","Remaining","Stock Level","Total Cost","Supplier"]}>
          {summary.map((r,i)=>{
            const c=statusColor(r.pct);
            return(
              <TR key={i}>
                <TD bold>{r.name}</TD>
                <TD><Badge label={r.mtype} color={r.mtype==="Probiotic"?C.green:r.mtype==="Vitamin"?C.blue:C.amber}/></TD>
                <TD>{r.totalStocked} {r.unit}</TD>
                <TD color={C.amber}>{r.used} {r.unit}</TD>
                <TD bold color={c}>{r.remaining} {r.unit}</TD>
                <TD><div style={{display:"flex",alignItems:"center",gap:8}}><ProgressBar pct={r.pct} color={c}/><span style={{color:c,fontSize:11}}>{r.pct}%</span></div></TD>
                <TD bold>{fmt(r.totalCost)}</TD>
                <TD small color={C.sub}>{r.supplier}</TD>
              </TR>
            );
          })}
        </Tbl>
      </Card>

      <div style={{display:"flex",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
        <FRow>
          <FSelect label="Month" value={month} onChange={setMonth}>{MONTHS.map(m=><option key={m}>{m}</option>)}</FSelect>
          <FSelect label="Year"  value={year}  onChange={setYear}>{YEARS.map(y=><option key={y}>{y}</option>)}</FSelect>
          <FSelect label="Type"  value={mtype} onChange={setMtype}>{types.map(t=><option key={t}>{t}</option>)}</FSelect>
        </FRow>
      </div>

      <Card>
        <SHead title={`Medicine Purchase History (${filtered.length} entries)`}/>
        <Tbl heads={["Date","Name","Type","Qty","Cost/Unit","Total","Supplier","Invoice","Expiry"]}>
          {filtered.map(s=>{
            const exp=s.expiry?new Date(s.expiry)<new Date():false;
            const nearExp=s.expiry?new Date(s.expiry)<new Date(Date.now()+30*24*60*60*1000):false;
            return(
              <TR key={s.id}>
                <TD>{s.date}</TD>
                <TD bold>{s.name}</TD>
                <TD><Badge label={s.mtype} color={s.mtype==="Probiotic"?C.green:s.mtype==="Vitamin"?C.blue:C.amber}/></TD>
                <TD bold color={C.blue}>{s.qty} {s.unit}</TD>
                <TD>{fmt(s.cunit)}</TD>
                <TD bold>{fmt(s.total)}</TD>
                <TD>{s.supplier}</TD>
                <TD small color={C.sub}>{s.invoice}</TD>
                <TD><Badge label={s.expiry||"—"} color={exp?C.red:nearExp?C.amber:C.green}/></TD>
              </TR>
            );
          })}
        </Tbl>
      </Card>
    </div>
  );
}

// ── General Supplies Tab ────────────────────────────────────
function GeneralTab(){
  const {generalInv,addGeneralInv}=useApp();
  const [cat,setCat]=useState("All");
  const [month,setMonth]=useState("All");
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({cat:"Chemicals",name:"",qty:"",unit:"kg",date:"",supplier:"",cunit:"",total:"",minStock:"",notes:""});

  const cats=["All",...new Set((generalInv||[]).map(g=>g.cat))];
  const filtered=(generalInv||[]).filter(g=>(cat==="All"||g.cat===cat)&&matchMonth(g.date,month,"All"));

  const totalCost=(generalInv||[]).reduce((a,g)=>a+g.total,0);
  const lowStock=(generalInv||[]).filter(g=>g.qty<g.minStock).length;

  async function save(){
    try{ await addGeneralInv({...form,qty:+form.qty,cunit:+form.cunit,total:+form.qty*+form.cunit,minStock:+form.minStock}); setShowForm(false); }
    catch(e){ alert("Error: "+e.message); }
  }

  return(
    <div>
      {/* Top bar */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{color:C.sub,fontSize:13}}>Manage general supplies, chemicals, fuel and consumables</div>
        <Btn onClick={()=>setShowForm(v=>!v)}>+ Add Item</Btn>
      </div>
      {showForm&&(
        <FormBox title="Add Inventory Item" onClose={()=>setShowForm(false)} onSave={save}>
          <FGrid cols={3}>
            <Field label="Category"><select style={sel} value={form.cat} onChange={e=>setForm(p=>({...p,cat:e.target.value}))}><option>Chemicals</option><option>Fuel</option><option>Aeration</option><option>Sampling</option><option>Water Test</option><option>Packaging</option><option>Other</option></select></Field>
            <Field label="Item Name"><input style={inp} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></Field>
            <Field label="Quantity"><input style={inp} type="number" value={form.qty} onChange={e=>setForm(p=>({...p,qty:e.target.value}))}/></Field>
            <Field label="Unit"><select style={sel} value={form.unit} onChange={e=>setForm(p=>({...p,unit:e.target.value}))}><option>kg</option><option>L</option><option>pcs</option><option>boxes</option><option>bags</option></select></Field>
            <Field label="Cost/Unit (₹)"><input style={inp} type="number" value={form.cunit} onChange={e=>setForm(p=>({...p,cunit:e.target.value}))}/></Field>
            <Field label="Min Stock"><input style={inp} type="number" value={form.minStock} onChange={e=>setForm(p=>({...p,minStock:e.target.value}))}/></Field>
            <Field label="Purchase Date"><input style={inp} type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></Field>
            <Field label="Supplier"><input style={inp} value={form.supplier} onChange={e=>setForm(p=>({...p,supplier:e.target.value}))}/></Field>
            <Field label="Notes"><input style={inp} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></Field>
          </FGrid>
        </FormBox>
      )}
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <KPI label="Total Items"   value={(generalInv||[]).length}  sub="All categories"  icon="📦" color={C.blue}/>
        <KPI label="Total Cost"    value={fmt(totalCost)}           sub="All purchases"   icon="💰" color={C.teal}/>
        <KPI label="Low Stock"     value={lowStock}                 sub="Below minimum"   icon="⚠️" color={C.amber}/>
        <KPI label="Categories"    value={cats.length-1}            sub="Item types"      icon="🗂" color={C.purple}/>
      </div>

      <div style={{display:"flex",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
        <FRow>
          <FSelect label="Category" value={cat}   onChange={setCat}>{cats.map(c=><option key={c}>{c}</option>)}</FSelect>
          <FSelect label="Month"    value={month} onChange={setMonth}>{MONTHS.map(m=><option key={m}>{m}</option>)}</FSelect>
        </FRow>
      </div>

      <Card>
        <Tbl heads={["Category","Item","Qty","Unit","Cost/Unit","Total","Min Stock","Status","Supplier","Date"]}>
          {filtered.map(g=>{
            const low=g.qty<g.minStock;
            return(
              <TR key={g.id}>
                <TD><Badge label={g.cat} color={g.cat==="Fuel"?C.red:g.cat==="Chemicals"?C.purple:C.blue}/></TD>
                <TD bold>{g.name}</TD>
                <TD bold color={low?C.red:C.green}>{g.qty}</TD>
                <TD>{g.unit}</TD>
                <TD>{fmt(g.cunit)}</TD>
                <TD>{fmt(g.total)}</TD>
                <TD small color={C.sub}>{g.minStock}</TD>
                <TD><Badge label={low?"LOW STOCK":"OK"} color={low?C.red:C.green}/></TD>
                <TD small>{g.supplier}</TD>
                <TD small color={C.sub}>{g.date}</TD>
              </TR>
            );
          })}
        </Tbl>
      </Card>
    </div>
  );
}

// ── Main Inventory Page ──────────────────────────────────────
export default function Inventory(){
  const {page}=useApp();
  const titles={inv_feed:"Feed Stock",inv_medicine:"Medicine Stock",inv_general:"General Supplies"};
  const title=titles[page]||"Inventory";
  return(
    <div style={{padding:24}}>
      <div style={{marginBottom:20}}>
        <h2 style={{color:C.text,fontSize:18,fontWeight:700,margin:"0 0 4px"}}>Inventory Management — {title}</h2>
        <p style={{color:C.sub,fontSize:12,margin:0}}>Track stock levels, consumption, cost and reorder alerts</p>
      </div>
      {page==="inv_feed"     && <FeedTab/>}
      {page==="inv_medicine" && <MedicineTab/>}
      {page==="inv_general"  && <GeneralTab/>}
    </div>
  );
}
