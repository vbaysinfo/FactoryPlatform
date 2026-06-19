
import { useApp } from "../../context/AppContext.jsx";
import { C } from "../common/ui.jsx";
const TITLES={dashboard:"Dashboard",nursery:"Nursery Map",stocking:"Stocking Management",water:"Water Quality",feed:"Feed Management",medicine:"Medicine Management",sales:"Sales Management",farmers:"Farmer Database",history:"Culture History",staff_technician:"Technicians",staff_worker:"Workers",staff_manager:"Managers",staff_hr:"HR",staff_admin:"Admin Staff",maintenance:"Maintenance",finance:"Finance Reports"};
export default function Header({ onSignOut }){
  const {page,batches}=useApp();
  const hr=batches.filter(b=>b.doc>=22&&b.status!=="harvested").length;
  const today=new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  return(
    <header style={{height:60,background:"#0a1628",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",flexShrink:0}}>
      <div>
        <h1 style={{color:C.text,fontSize:15,fontWeight:700,margin:0}}>{TITLES[page]||"AquaNursery Pro"}</h1>
        <p style={{color:C.sub,fontSize:10,margin:0}}>{today}</p>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        {hr>0&&<div style={{background:`${C.amber}18`,border:`1px solid ${C.amber}50`,borderRadius:8,padding:"4px 12px",color:C.amber,fontSize:12,fontWeight:600}}>🌾 {hr} harvest ready</div>}
        <div style={{width:32,height:32,borderRadius:"50%",background:`${C.teal}18`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",border:`1px solid ${C.teal}40`,fontSize:15}}>🔔</div>
        <div onClick={onSignOut} style={{padding:"5px 12px",borderRadius:8,background:`${C.red}18`,color:C.red,fontSize:12,fontWeight:600,cursor:"pointer"}}>Logout</div>
      </div>
    </header>
  );
}
