import {useState} from "react";
import {useApp} from "../../context/AppContext.jsx";
import {C,KPI,Card,SHead,Badge,FormBox,FGrid,Field,inp,sel} from "../common/ui.jsx";

const BLANK={name:"",ph:"",email:"",village:"",mandal:"",dist:"",state:"AP",ponds:"",area:"",exp:"",tId:"1"};

export default function FarmerManagement(){
  const {farmers,sales,staff,addFarmer,updateFarmer,delFarmer}=useApp();
  const techs=staff.filter(s=>s.role==="Technician");
  const [show,setShow]=useState(false);
  const [editId,setEditId]=useState(null);
  const [search,setSearch]=useState("");
  const [sel2,setSel]=useState(null);
  const [form,setForm]=useState(BLANK);
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));

  const filtered=farmers.filter(fa=>fa.name.toLowerCase().includes(search.toLowerCase())||fa.dist.toLowerCase().includes(search.toLowerCase())||fa.village.toLowerCase().includes(search.toLowerCase()));

  function openAdd(){ setEditId(null); setForm(BLANK); setShow(true); }
  function openEdit(e,fa){ e.stopPropagation(); setEditId(fa.id); setForm({name:fa.name,ph:fa.ph,email:fa.email||"",village:fa.village||"",mandal:fa.mandal||"",dist:fa.dist||"",state:fa.state||"AP",ponds:fa.ponds||"",area:fa.area||"",exp:fa.exp||"",tId:fa.tId||"1"}); setShow(true); }

  const save=()=>{
    if(!form.name||!form.ph)return;
    const data={...form,ponds:+form.ponds,area:+form.area,exp:+form.exp,tId:+form.tId};
    if(editId){ updateFarmer(editId,data); if(sel2?.id===editId) setSel(null); }
    else addFarmer({...data,buys:0,rev:0});
    setShow(false); setEditId(null); setForm(BLANK);
  };

  return(
    <div style={{padding:"20px 24px"}}>
      <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        <KPI label="Total Farmers"  value={farmers.length} sub="registered" color={C.teal} icon="👨‍🌾"/>
        <KPI label="Active Buyers"  value={farmers.filter(fa=>fa.buys>0).length} sub="purchased" color={C.blue} icon="🛒"/>
        <KPI label="Total Area"     value={farmers.reduce((s,fa)=>s+(fa.area||0),0)+" ac"} sub="pond area" color={C.purple} icon="🌊"/>
        <KPI label="Total Revenue"  value={"₹"+(farmers.reduce((s,fa)=>s+(fa.rev||0),0)/100000).toFixed(1)+"L"} sub="from farmers" color={C.amber} icon="💰"/>
      </div>
      <div style={{display:"flex",gap:12,marginBottom:16,alignItems:"center"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search by name, district, village..." style={{flex:1,background:C.card,border:"1px solid "+C.border,borderRadius:10,padding:"9px 14px",color:C.text,fontSize:13}}/>
        <button onClick={openAdd} style={{background:"linear-gradient(135deg,#00d4aa,#0099ff)",color:"#000",fontWeight:700,fontSize:13,padding:"9px 20px",borderRadius:10,border:"none",cursor:"pointer",whiteSpace:"nowrap"}}>+ Add Farmer</button>
      </div>

      {show&&<FormBox title={editId?"✏️ Edit Farmer":"👨‍🌾 Add New Farmer"} onClose={()=>{setShow(false);setEditId(null);}} onSave={save}>
        <FGrid cols={4}>
          <Field label="Full Name"><input style={inp} value={form.name} onChange={e=>f("name",e.target.value)} placeholder="Ravi Kumar"/></Field>
          <Field label="Contact"><input style={inp} value={form.ph} onChange={e=>f("ph",e.target.value)} placeholder="9876543210"/></Field>
          <Field label="Email"><input style={inp} value={form.email} onChange={e=>f("email",e.target.value)}/></Field>
          <Field label="Village"><input style={inp} value={form.village} onChange={e=>f("village",e.target.value)}/></Field>
          <Field label="Mandal"><input style={inp} value={form.mandal} onChange={e=>f("mandal",e.target.value)}/></Field>
          <Field label="District"><input style={inp} value={form.dist} onChange={e=>f("dist",e.target.value)}/></Field>
          <Field label="Pond Count"><input style={inp} type="number" value={form.ponds} onChange={e=>f("ponds",e.target.value)}/></Field>
          <Field label="Total Area (acres)"><input style={inp} type="number" value={form.area} onChange={e=>f("area",e.target.value)}/></Field>
          <Field label="Experience (years)"><input style={inp} type="number" value={form.exp} onChange={e=>f("exp",e.target.value)}/></Field>
          <Field label="Assign Technician"><select style={sel} value={form.tId} onChange={e=>f("tId",e.target.value)}>{techs.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
        </FGrid>
      </FormBox>}

      <div style={{display:"grid",gridTemplateColumns:sel2?"1fr 350px":"1fr",gap:14}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:12,alignContent:"start"}}>
          {filtered.map(fa=>{const tech=techs.find(t=>t.id===fa.tId);return(
            <div key={fa.id} onClick={()=>setSel(sel2?.id===fa.id?null:fa)} style={{background:C.card,borderRadius:14,padding:"16px 18px",border:"1px solid "+(sel2?.id===fa.id?C.teal+"60":C.border),cursor:"pointer"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#00d4aa,#0099ff)",display:"flex",alignItems:"center",justifyContent:"center",color:"#000",fontWeight:700,fontSize:15}}>{fa.name.charAt(0)}</div>
                  <div><div style={{color:C.text,fontSize:13,fontWeight:700}}>{fa.name}</div><div style={{color:C.teal,fontSize:11}}>📞 {fa.ph}</div></div>
                </div>
                <div style={{display:"flex",gap:5}}>
                  <button onClick={e=>openEdit(e,fa)} style={{background:C.blue+"18",color:C.blue,border:"none",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:11}}>Edit</button>
                  <button onClick={e=>{e.stopPropagation();if(window.confirm("Delete this farmer?"))delFarmer(fa.id);}} style={{background:C.red+"18",color:C.red,border:"none",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:11}}>Del</button>
                </div>
              </div>
              <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
                <Badge label={"📍 "+fa.village+", "+fa.dist} color={C.blue}/>
                <Badge label={fa.ponds+" ponds • "+fa.area+"ac"} color={C.purple}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                {[["Experience",(fa.exp||0)+"yrs"],["Technician",tech?.name?.split(" ")[0]||"—"],["Purchases",fa.buys||0],["Revenue","₹"+((fa.rev||0)/1000).toFixed(0)+"K"]].map(([l,v])=><div key={l}><div style={{color:C.sub,fontSize:10}}>{l}</div><div style={{color:C.text,fontSize:12,fontWeight:600}}>{v}</div></div>)}
              </div>
            </div>
          );})}
        </div>
        {sel2&&<div style={{background:C.card,borderRadius:14,padding:"20px",border:"1px solid "+C.teal+"40",position:"sticky",top:20,alignSelf:"start"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
            <SHead title="Farmer Profile"/>
            <button onClick={()=>setSel(null)} style={{background:"rgba(255,255,255,0.06)",color:C.sub,border:"none",borderRadius:6,padding:"3px 10px",cursor:"pointer"}}>✕</button>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <div style={{width:46,height:46,borderRadius:"50%",background:"linear-gradient(135deg,#00d4aa,#0099ff)",display:"flex",alignItems:"center",justifyContent:"center",color:"#000",fontWeight:700,fontSize:17}}>{sel2.name.charAt(0)}</div>
            <div><div style={{color:C.text,fontSize:14,fontWeight:700}}>{sel2.name}</div><div style={{color:C.sub,fontSize:11}}>{sel2.email||"No email"}</div></div>
          </div>
          {[["Contact",sel2.ph],["Village",sel2.village],["District",sel2.dist],["State",sel2.state],["Ponds",sel2.ponds],["Area",(sel2.area||0)+" acres"],["Experience",(sel2.exp||0)+" years"],["Technician",staff.find(t=>t.id===sel2.tId)?.name||"—"]].map(([l,v])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid "+C.border}}><span style={{color:C.sub,fontSize:12}}>{l}</span><span style={{color:C.text,fontSize:12,fontWeight:500}}>{v}</span></div>
          ))}
          <div style={{marginTop:14}}>
            <SHead title="Purchase History"/>
            {sales.filter(s=>s.fId===sel2.id).length===0?<p style={{color:C.sub,fontSize:12}}>No purchases yet</p>:sales.filter(s=>s.fId===sel2.id).map(s=>(
              <div key={s.id} style={{background:C.teal+"08",borderRadius:8,padding:"8px 10px",marginBottom:7}}>
                <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.blue,fontSize:11,fontWeight:700}}>{s.inv}</span><span style={{color:C.teal,fontSize:11,fontWeight:700}}>₹{(s.total||0).toLocaleString("en-IN")}</span></div>
                <div style={{color:C.sub,fontSize:10}}>{((s.qty||0)/1000).toFixed(0)}K PLs • {s.pl} • {s.date}</div>
                <Badge label={s.status} color={s.status==="paid"?C.teal:C.red}/>
              </div>
            ))}
          </div>
        </div>}
      </div>
    </div>
  );
}
