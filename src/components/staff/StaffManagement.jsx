import {useState} from "react";
import {useApp} from "../../context/AppContext.jsx";
import {C,KPI,Card,Badge,FormBox,FGrid,Field,inp,sel} from "../common/ui.jsx";
const ROLE_COLOR={Technician:C.teal,Worker:C.blue,Manager:C.amber,HR:C.purple,Admin:C.green};
const ROLE_MAP={staff_technician:"Technician",staff_field:"Field Technician",staff_worker:"Worker",staff_manager:"Manager",staff_hr:"HR",staff_admin:"Admin"};

export default function StaffManagement(){
  const {staff,addStaff,updateStaff,delStaff,techLogs,page}=useApp();
  const role=ROLE_MAP[page]||"Technician";
  const rc=ROLE_COLOR[role]||C.teal;
  const [show,setShow]=useState(false);
  const [editId,setEditId]=useState(null);
  const [search,setSearch]=useState("");
  const BLANK={name:"",empId:"",role,dept:"Operations",ph:"",email:"",qual:"",join:"",sal:"",status:"active"};
  const [form,setForm]=useState(BLANK);
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));

  const list=staff.filter(s=>s.role===role&&(s.name.toLowerCase().includes(search.toLowerCase())||s.empId.toLowerCase().includes(search.toLowerCase())));
  const getScore=id=>{const logs=techLogs.filter(l=>l.tId===id);return logs.length?Math.round(logs.reduce((s,l)=>s+(l.score||0),0)/logs.length):0;};
  const todayLog=id=>techLogs.find(l=>l.tId===id);

  function openAdd(){ setEditId(null); setForm(BLANK); setShow(true); }
  function openEdit(e,emp){ e.stopPropagation(); setEditId(emp.id); setForm({name:emp.name,empId:emp.empId,role:emp.role,dept:emp.dept,ph:emp.ph||"",email:emp.email||"",qual:emp.qual||"",join:emp.join||"",sal:emp.sal||"",status:emp.status}); setShow(true); }

  const save=()=>{
    if(!form.name||!form.ph)return;
    const data={...form,sal:+form.sal,tanks:[],farmers:[]};
    if(editId) updateStaff(editId,data);
    else addStaff(data);
    setShow(false); setEditId(null); setForm(BLANK);
  };

  return(
    <div style={{padding:"20px 24px"}}>
      <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        <KPI label={"Total "+role+"s"}  value={list.length} sub="registered" color={rc} icon="👤"/>
        <KPI label="Active"             value={list.filter(s=>s.status==="active").length} sub="currently" color={C.green} icon="✅"/>
        <KPI label="On Leave"           value={list.filter(s=>s.status==="on-leave").length} sub="absent" color={C.amber} icon="🏖️"/>
        {role==="Technician"&&<KPI label="Avg Compliance" value={list.length?Math.round(list.reduce((s,t)=>s+getScore(t.id),0)/list.length)+"%":"—"} sub="score" color={C.blue} icon="📊"/>}
        <KPI label="Monthly Salary" value={"₹"+list.reduce((s,x)=>s+(x.sal||0),0).toLocaleString("en-IN")} sub="total" color={C.purple} icon="💵"/>
      </div>
      <div style={{display:"flex",gap:12,marginBottom:16,alignItems:"center"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={"🔍 Search "+role+"s..."} style={{flex:1,background:C.card,border:"1px solid "+C.border,borderRadius:10,padding:"9px 14px",color:C.text,fontSize:13}}/>
        <button onClick={openAdd} style={{background:"linear-gradient(135deg,#00d4aa,#0099ff)",color:"#000",fontWeight:700,fontSize:13,padding:"9px 20px",borderRadius:10,border:"none",cursor:"pointer",whiteSpace:"nowrap"}}>+ Add {role}</button>
      </div>

      {show&&<FormBox title={editId?"✏️ Edit "+role:"➕ Add New "+role} onClose={()=>{setShow(false);setEditId(null);}} onSave={save}>
        <FGrid cols={3}>
          <Field label="Full Name"><input style={inp} value={form.name} onChange={e=>f("name",e.target.value)} placeholder="Full name"/></Field>
          <Field label="Employee ID"><input style={inp} value={form.empId} onChange={e=>f("empId",e.target.value)} placeholder="EMP-011"/></Field>
          <Field label="Contact"><input style={inp} value={form.ph} onChange={e=>f("ph",e.target.value)} placeholder="9988776655"/></Field>
          <Field label="Email"><input style={inp} value={form.email} onChange={e=>f("email",e.target.value)}/></Field>
          <Field label="Qualification"><input style={inp} value={form.qual} onChange={e=>f("qual",e.target.value)} placeholder="B.Sc Aquaculture"/></Field>
          <Field label="Joining Date"><input style={inp} type="date" value={form.join} onChange={e=>f("join",e.target.value)}/></Field>
          <Field label="Monthly Salary (₹)"><input style={inp} type="number" value={form.sal} onChange={e=>f("sal",e.target.value)} placeholder="20000"/></Field>
          <Field label="Department"><input style={inp} value={form.dept} onChange={e=>f("dept",e.target.value)}/></Field>
          <Field label="Status"><select style={sel} value={form.status} onChange={e=>f("status",e.target.value)}><option value="active">Active</option><option value="on-leave">On Leave</option><option value="resigned">Resigned</option><option value="terminated">Terminated</option></select></Field>
        </FGrid>
      </FormBox>}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))",gap:14}}>
        {list.map(emp=>{
          const sc=role==="Technician"?getScore(emp.id):null;
          const log=role==="Technician"?todayLog(emp.id):null;
          const cc=sc>=90?C.teal:sc>=70?C.amber:C.red;
          return(
            <div key={emp.id} style={{background:C.card,borderRadius:14,padding:"20px",border:"1px solid "+C.border}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,"+rc+",#0099ff)",display:"flex",alignItems:"center",justifyContent:"center",color:"#000",fontWeight:700,fontSize:15}}>
                    {emp.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                  </div>
                  <div><div style={{color:C.text,fontSize:13,fontWeight:700}}>{emp.name}</div><div style={{color:C.sub,fontSize:11}}>{emp.empId} • {emp.qual}</div></div>
                </div>
                <div style={{display:"flex",gap:5,alignItems:"center"}}>
                  <Badge label={emp.status} color={emp.status==="active"?C.teal:emp.status==="on-leave"?C.amber:C.red}/>
                  <button onClick={e=>openEdit(e,emp)} style={{background:C.blue+"18",color:C.blue,border:"none",borderRadius:6,padding:"3px 7px",cursor:"pointer",fontSize:10}}>Edit</button>
                  <button onClick={()=>{if(window.confirm("Delete "+emp.name+"?"))delStaff(emp.id);}} style={{background:C.red+"18",color:C.red,border:"none",borderRadius:6,padding:"3px 7px",cursor:"pointer",fontSize:10}}>Del</button>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                {[["Contact",emp.ph],["Salary","₹"+(emp.sal||0).toLocaleString("en-IN")],["Joined",emp.join],["Dept",emp.dept]].map(([l,v])=>(
                  <div key={l} style={{background:"rgba(255,255,255,0.03)",borderRadius:7,padding:"6px 9px"}}>
                    <div style={{color:C.sub,fontSize:10}}>{l}</div><div style={{color:C.text,fontSize:11,fontWeight:600,marginTop:2}}>{v}</div>
                  </div>
                ))}
              </div>
              {role==="Technician"&&sc!==null&&<>
                <div style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{color:C.sub,fontSize:11}}>Compliance</span><span style={{color:cc,fontWeight:700,fontSize:12}}>{sc}%</span></div>
                  <div style={{height:5,borderRadius:3,background:"rgba(255,255,255,0.08)"}}><div style={{height:"100%",width:sc+"%",borderRadius:3,background:cc}}/></div>
                </div>
                {log&&<div style={{background:"rgba(0,0,0,0.2)",borderRadius:8,padding:"9px 11px"}}>
                  <div style={{color:C.sub,fontSize:10,fontWeight:600,marginBottom:5,textTransform:"uppercase",letterSpacing:.5}}>Latest Log</div>
                  <div style={{display:"flex",gap:8,marginBottom:5,flexWrap:"wrap"}}>
                    {[["Morning 🌅",log.mW],["Afternoon ☀️",log.aW],["Night 🌙",log.nW]].map(([l,v])=><span key={l} style={{background:v?C.teal+"18":C.red+"18",color:v?C.teal:C.red,fontSize:10,padding:"2px 7px",borderRadius:99,fontWeight:600}}>{v?"✓":"✗"} {l}</span>)}
                  </div>
                  <div style={{display:"flex",gap:10}}><span style={{color:C.sub,fontSize:10}}>Feed: <b style={{color:C.text}}>{log.feeds}</b></span><span style={{color:C.sub,fontSize:10}}>Med: <b style={{color:C.text}}>{log.meds}</b></span><span style={{color:C.sub,fontSize:10}}>PL Checks: <b style={{color:C.text}}>{log.plc}</b></span></div>
                </div>}
                {emp.tanks?.length>0&&<div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:8}}>{emp.tanks.slice(0,8).map(tid=><span key={tid} style={{background:C.blue+"18",color:C.blue,fontSize:9,padding:"1px 6px",borderRadius:99}}>T-{tid}</span>)}{emp.tanks.length>8&&<span style={{color:C.sub,fontSize:9}}>+{emp.tanks.length-8}</span>}</div>}
              </>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
