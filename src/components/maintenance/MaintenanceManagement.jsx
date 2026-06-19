import {useState} from "react";

import {useApp} from "../../context/AppContext.jsx";
import {supabase} from "../../lib/supabase.js";
import {C,KPI,Card,SHead,Badge,Tbl,TR,TD,Tabs,FormBox,FGrid,Field,Alert,inp,sel} from "../common/ui.jsx";
const CC={RO:C.blue,Generator:C.amber,Tank:C.purple,Electrical:C.teal,Plumbing:"#ec4899",Other:C.sub};
const BLANK={cat:"RO Plant",sub:"",date:new Date().toISOString().slice(0,10),desc:"",cost:"",vendor:"",nxt:"",status:"completed",by:""};

export default function MaintenanceManagement(){
  const {maint,power,staff,addMaint,updateMaint,delMaint,reload}=useApp();
  const [tab,setTab]=useState("logs");
  const [show,setShow]=useState(false);
  const [editId,setEditId]=useState(null);
  const [form,setForm]=useState(BLANK);
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));
  const [showPower,setShowPower]=useState(false);
  const [pForm,setPForm]=useState({month:"January",year:new Date().getFullYear(),units:"",amount:"",billDate:"",status:"pending",paidDate:""});
  const pf=(k,v)=>setPForm(p=>({...p,[k]:v}));

  const scheduled=maint.filter(m=>m.status==="scheduled");
  const completed=maint.filter(m=>m.status==="completed");
  const totalCost=completed.reduce((s,m)=>s+(m.cost||0),0);
  const powerTotal=power.reduce((s,b)=>s+(b.amt||0),0);
  const pendBills=power.filter(b=>b.status==="pending");

  function openAdd(){ setEditId(null); setForm(BLANK); setShow(true); }
  function openEdit(m){ setEditId(m.id); setForm({cat:m.cat,sub:m.sub||"",date:m.date,desc:m.desc||"",cost:m.cost||"",vendor:m.vendor||"",nxt:m.nxt||"",status:m.status,by:m.by||""}); setShow(true); }

  const save=()=>{
    const data={...form,cost:+form.cost};
    if(editId) updateMaint(editId,data);
    else addMaint(data);
    setShow(false); setEditId(null); setForm(BLANK);
  };

  const savePower=async()=>{
    const {error}=await supabase.from("power_bills").insert({
      month:pForm.month,year:+pForm.year,units:+pForm.units,
      amount:+pForm.amount,paid_date:pForm.paidDate||null,status:pForm.status
    });
    if(!error){setShowPower(false);reload();}
  };

  return(
    <div style={{padding:"20px 24px"}}>
      {scheduled.length>0&&<Alert type="warn" msg={"📅 "+scheduled.length+" scheduled: "+scheduled.map(s=>s.cat+" ("+s.date+")").join(", ")}/>}
      {pendBills.length>0&&<Alert type="danger" msg={"⚡ Pending power bill: ₹"+pendBills.reduce((s,b)=>s+(b.amt||0),0).toLocaleString("en-IN")}/>}
      <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        <KPI label="Maintenance Cost" value={"₹"+(totalCost/1000).toFixed(0)+"K"} sub="completed" color={C.teal} icon="🔧"/>
        <KPI label="Scheduled" value={scheduled.length} sub="upcoming" color={C.amber} icon="📅"/>
        <KPI label="Completed" value={completed.length} sub="done" color={C.green} icon="✅"/>
        <KPI label="Power Cost YTD" value={"₹"+(powerTotal/100000).toFixed(1)+"L"} sub="electricity" color={C.blue} icon="⚡"/>
        <KPI label="Pending Bills" value={pendBills.length} sub="unpaid" color={C.red} icon="⚠️"/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <Tabs tabs={[{id:"logs",label:"Maintenance Log"},{id:"power",label:"Power Bills"},{id:"labour",label:"Labour Cost"}]} active={tab} onChange={setTab}/>
        {tab==="logs"&&<button onClick={openAdd} style={{background:"linear-gradient(135deg,#00d4aa,#0099ff)",color:"#000",fontWeight:700,fontSize:13,padding:"8px 18px",borderRadius:10,border:"none",cursor:"pointer"}}>+ Add Maintenance</button>}
        {tab==="power"&&<button onClick={()=>setShowPower(true)} style={{background:"linear-gradient(135deg,#00d4aa,#0099ff)",color:"#000",fontWeight:700,fontSize:13,padding:"8px 18px",borderRadius:10,border:"none",cursor:"pointer"}}>+ Add Power Bill</button>}
      </div>

      {showPower&&tab==="power"&&<FormBox title="⚡ Add Power Bill" onClose={()=>setShowPower(false)} onSave={savePower}>
        <FGrid cols={3}>
          <Field label="Month">
            <select style={sel} value={pForm.month} onChange={e=>pf("month",e.target.value)}>
              {["January","February","March","April","May","June","July","August","September","October","November","December"].map(m=><option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Year"><input style={inp} type="number" value={pForm.year} onChange={e=>pf("year",e.target.value)}/></Field>
          <Field label="Units Consumed"><input style={inp} type="number" value={pForm.units} onChange={e=>pf("units",e.target.value)} placeholder="1200"/></Field>
          <Field label="Amount (₹)"><input style={inp} type="number" value={pForm.amount} onChange={e=>pf("amount",e.target.value)} placeholder="8500"/></Field>
          <Field label="Bill Date"><input style={inp} type="date" value={pForm.billDate} onChange={e=>pf("billDate",e.target.value)}/></Field>
          <Field label="Status">
            <select style={sel} value={pForm.status} onChange={e=>pf("status",e.target.value)}>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </Field>
          {pForm.status==="paid"&&<Field label="Paid Date"><input style={inp} type="date" value={pForm.paidDate} onChange={e=>pf("paidDate",e.target.value)}/></Field>}
        </FGrid>
      </FormBox>}

      {show&&tab==="logs"&&<FormBox title={editId?"✏️ Edit Maintenance":"🔧 Add Maintenance Record"} onClose={()=>{setShow(false);setEditId(null);}} onSave={save}>
        <FGrid cols={3}>
          <Field label="Category"><select style={sel} value={form.cat} onChange={e=>f("cat",e.target.value)}>{["RO Plant","Generator","Tank","Electrical","Plumbing","Other"].map(c=><option key={c}>{c}</option>)}</select></Field>
          <Field label="Sub-category"><input style={inp} value={form.sub} onChange={e=>f("sub",e.target.value)} placeholder="Filter Cleaning"/></Field>
          <Field label="Date"><input style={inp} type="date" value={form.date} onChange={e=>f("date",e.target.value)}/></Field>
          <Field label="Description"><input style={inp} value={form.desc} onChange={e=>f("desc",e.target.value)} placeholder="Work description..."/></Field>
          <Field label="Cost (₹)"><input style={inp} type="number" value={form.cost} onChange={e=>f("cost",e.target.value)} placeholder="3500"/></Field>
          <Field label="Vendor"><input style={inp} value={form.vendor} onChange={e=>f("vendor",e.target.value)} placeholder="AquaPure Systems"/></Field>
          <Field label="Performed By"><input style={inp} value={form.by} onChange={e=>f("by",e.target.value)} placeholder="Tech name"/></Field>
          <Field label="Next Due Date"><input style={inp} type="date" value={form.nxt} onChange={e=>f("nxt",e.target.value)}/></Field>
          <Field label="Status"><select style={sel} value={form.status} onChange={e=>f("status",e.target.value)}><option value="completed">Completed</option><option value="scheduled">Scheduled</option><option value="in-progress">In Progress</option><option value="cancelled">Cancelled</option></select></Field>
        </FGrid>
      </FormBox>}

      {tab==="logs"&&scheduled.length>0&&<div style={{marginBottom:16}}>
        <SHead title="📅 Upcoming Scheduled"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>
          {scheduled.map(m=><div key={m.id} style={{background:C.amber+"10",borderRadius:10,padding:"12px 14px",border:"1px solid "+C.amber+"30"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><Badge label={m.cat} color={CC[m.cat]||C.sub}/><span style={{color:C.amber,fontSize:11,fontWeight:600}}>📅 {m.date}</span></div>
            <div style={{color:C.text,fontSize:12,fontWeight:600,marginBottom:3}}>{m.desc}</div>
            <div style={{color:C.sub,fontSize:10}}>{m.vendor} • Est. ₹{(m.cost||0).toLocaleString("en-IN")}</div>
          </div>)}
        </div>
      </div>}

      {tab==="logs"&&<Card>
        <Tbl heads={["Category","Sub","Date","Description","Cost","Vendor","By","Next Due","Status","Actions"]}>
          {[...maint].reverse().map(m=><TR key={m.id}>
            <TD><Badge label={m.cat} color={CC[m.cat]||C.sub}/></TD>
            <TD color={C.sub} small>{m.sub}</TD>
            <TD>{m.date}</TD>
            <TD>{m.desc}</TD>
            <TD color={C.purple} bold>₹{(m.cost||0).toLocaleString("en-IN")}</TD>
            <TD color={C.sub} small>{m.vendor}</TD>
            <TD color={C.sub} small>{m.by}</TD>
            <TD color={C.sub} small>{m.nxt||"—"}</TD>
            <TD><Badge label={m.status} color={m.status==="completed"?C.teal:m.status==="scheduled"?C.amber:C.blue}/></TD>
            <TD>
              <div style={{display:"flex",gap:4}}>
                <button onClick={()=>openEdit(m)} style={{background:C.blue+"18",color:C.blue,border:"none",borderRadius:5,padding:"3px 8px",cursor:"pointer",fontSize:11,whiteSpace:"nowrap"}}>Edit</button>
                <button onClick={()=>{if(window.confirm("Delete this record?"))delMaint(m.id);}} style={{background:C.red+"18",color:C.red,border:"none",borderRadius:5,padding:"3px 8px",cursor:"pointer",fontSize:11}}>Del</button>
              </div>
            </TD>
          </TR>)}
        </Tbl>
      </Card>}

      {tab==="power"&&<div>
        <Card style={{marginBottom:12}}><SHead title="Monthly Power Bills"/>
          <Tbl heads={["Month","Year","Units (kWh)","Bill Amount","Paid Date","Status"]}>
            {power.map(b=><TR key={b.id}><TD bold>{b.month}</TD><TD color={C.sub}>{b.year}</TD><TD>{(b.units||0).toLocaleString("en-IN")}</TD><TD color={C.blue} bold>₹{(b.amt||0).toLocaleString("en-IN")}</TD><TD color={C.sub}>{b.paid||"—"}</TD><TD><Badge label={b.status} color={b.status==="paid"?C.teal:C.red}/></TD></TR>)}
          </Tbl>
        </Card>
        <div style={{display:"flex",gap:12}}>
          {[["Total Units",power.reduce((s,b)=>s+(b.units||0),0).toLocaleString("en-IN")+" kWh",C.blue],["Total Cost","₹"+powerTotal.toLocaleString("en-IN"),C.teal],["Avg Monthly","₹"+(powerTotal/(power.length||1)).toFixed(0),C.amber]].map(([l,v,c])=><div key={l} style={{flex:1,background:C.card,borderRadius:10,padding:"14px 16px",border:"1px solid "+c+"25"}}><div style={{color:C.sub,fontSize:11}}>{l}</div><div style={{color:c,fontSize:16,fontWeight:700,marginTop:4}}>{v}</div></div>)}
        </div>
      </div>}

      {tab==="labour"&&<Card>
        <SHead title="Staff Salary Summary"/>
        <Tbl heads={["Name","Emp ID","Role","Department","Join Date","Monthly Salary","Status"]}>
          {staff.map(s=><TR key={s.id}>
            <TD bold>{s.name}</TD>
            <TD color={C.blue} small>{s.empId}</TD>
            <TD><Badge label={s.role} color={C.teal}/></TD>
            <TD color={C.sub} small>{s.dept}</TD>
            <TD color={C.sub} small>{s.join}</TD>
            <TD color={C.green} bold>₹{(s.sal||0).toLocaleString("en-IN")}</TD>
            <TD><Badge label={s.status} color={s.status==="active"?C.teal:C.amber}/></TD>
          </TR>)}
        </Tbl>
        <div style={{marginTop:12,paddingTop:10,borderTop:"1px solid "+C.border,display:"flex",justifyContent:"space-between"}}>
          <span style={{color:C.sub,fontSize:12}}>Total Monthly Labour Cost</span>
          <span style={{color:C.teal,fontSize:15,fontWeight:700}}>₹{staff.reduce((s,x)=>s+(x.sal||0),0).toLocaleString("en-IN")}</span>
        </div>
      </Card>}
    </div>
  );
}
