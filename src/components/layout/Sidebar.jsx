
import { useApp } from "../../context/AppContext.jsx";
import { C } from "../common/ui.jsx";

const NAV=[
  {id:"dashboard",   label:"Dashboard",     icon:"⬡"},
  {id:"nursery",     label:"Nursery Map",   icon:"🗺"},
  {id:"grp_stocking",label:"Stocking",      icon:"🐟",sub:[
    {id:"stocking_new",     label:"New Stocking",   icon:"➕"},
    {id:"stocking_running", label:"Running Stock",  icon:"📡"},
    {id:"stocking_history", label:"Harvest History",icon:"✅"},
  ]},
  {id:"grp_daily",   label:"Daily Operations",icon:"📋",sub:[
    {id:"water",       label:"Water Quality", icon:"💧"},
    {id:"feed",        label:"Feed",          icon:"🌾"},
    {id:"medicine",    label:"Medicine",      icon:"💊"},
  ]},
  {id:"sales",        label:"Sales & Orders", icon:"🛒"},
  {id:"farmers",     label:"Farmers",       icon:"👨‍🌾"},
  {id:"history",     label:"Culture History",icon:"📜"},
  {id:"grp_inventory",label:"Inventory",   icon:"📦",sub:[
    {id:"inv_feed",      label:"Feed Stock",    icon:"🌾"},
    {id:"inv_medicine",  label:"Medicine Stock",icon:"💊"},
    {id:"inv_general",   label:"General Supplies",icon:"🗂"},
  ]},
  {id:"grp_reports", label:"Reports",       icon:"📈",sub:[
    {id:"report_farmer",  label:"Farmer Report",      icon:"🌾"},
    {id:"report_sales",   label:"Sales Report",       icon:"💰"},
    {id:"report_feed",    label:"Feed Report",        icon:"🌾"},
    {id:"report_medicine",label:"Medicine Report",    icon:"💊"},
    {id:"report_maint",   label:"Maintenance Report", icon:"🔧"},
  ]},
  {id:"grp_technician",label:"Technician",   icon:"👷",sub:[
    {id:"staff_technician",label:"Nursery Technician",icon:"🔬"},
    {id:"staff_field",     label:"Field Technician",  icon:"🌿"},
  ]},
  {id:"grp_admin",   label:"Administration",icon:"🏢",sub:[
    {id:"staff_worker",    label:"Workers",    icon:"🔨"},
    {id:"staff_manager",   label:"Managers",   icon:"👔"},
    {id:"staff_hr",        label:"HR",         icon:"👥"},
    {id:"staff_admin",     label:"Admin Staff",icon:"🗂"},
  ]},
  {id:"maintenance", label:"Maintenance",   icon:"🔧"},
  {id:"finance",     label:"Finance",       icon:"📊"},
  {id:"settings",    label:"Settings",      icon:"⚙️"},
  {id:"grp_mobile",  label:"Mobile Apps",   icon:"📱",sub:[
    {id:"mobile_fieldtech", label:"Field Tech App", icon:"🌊"},
    {id:"mobile_farmer",    label:"Farmer App",     icon:"🌾"},
    {id:"mobile_nurserytech",label:"Nursery Tech App",icon:"🧪"},
  ]},
];

export default function Sidebar(){
  const {page,setPage,open,toggleMenu}=useApp();
  return(
    <aside style={{width:218,minHeight:"100vh",background:"#070f20",display:"flex",flexDirection:"column",flexShrink:0,borderRight:`1px solid ${C.border}`,overflowY:"auto"}}>
      <div style={{padding:"22px 16px 18px",borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:9,background:"linear-gradient(135deg,#00d4aa,#0099ff)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🦐</div>
          <div>
            <div style={{color:C.text,fontWeight:700,fontSize:13}}>AquaNursery</div>
            <div style={{color:C.teal,fontSize:9,letterSpacing:1.2,fontWeight:700}}>SUPER ADMIN</div>
          </div>
        </div>
      </div>
      <nav style={{flex:1,padding:"12px 8px"}}>
        {NAV.map(item=>{
          if(item.sub){
            const isOpen=open[item.id];
            const anyActive=item.sub.some(s=>page===s.id);
            return(
              <div key={item.id}>
                <button onClick={()=>toggleMenu(item.id)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 11px",marginBottom:2,borderRadius:8,border:"none",background:anyActive?"rgba(0,212,170,0.08)":"transparent",color:anyActive?C.teal:C.sub,cursor:"pointer",fontSize:12,fontWeight:anyActive?600:400,borderLeft:anyActive?`3px solid ${C.teal}`:"3px solid transparent"}}>
                  <span style={{display:"flex",alignItems:"center",gap:8}}><span>{item.icon}</span>{item.label}</span>
                  <span style={{fontSize:9,transform:isOpen?"rotate(90deg)":"none",transition:"transform .2s"}}>▶</span>
                </button>
                {isOpen&&(
                  <div style={{paddingLeft:14,marginBottom:4}}>
                    {item.sub.map(s=>(
                      <button key={s.id} onClick={()=>setPage(s.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:7,padding:"7px 11px",marginBottom:1,borderRadius:7,border:"none",background:page===s.id?"rgba(0,153,255,0.12)":"transparent",color:page===s.id?C.blue:"#5a7a9a",cursor:"pointer",fontSize:11,fontWeight:page===s.id?600:400,borderLeft:page===s.id?`2px solid ${C.blue}`:"2px solid transparent"}}>
                        <span>{s.icon}</span>{s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          const act=page===item.id;
          return(
            <button key={item.id} onClick={()=>setPage(item.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"9px 11px",marginBottom:2,borderRadius:8,border:"none",background:act?"rgba(0,212,170,0.08)":"transparent",color:act?C.teal:C.sub,cursor:"pointer",fontSize:12,fontWeight:act?600:400,textAlign:"left",borderLeft:act?`3px solid ${C.teal}`:"3px solid transparent"}}>
              <span>{item.icon}</span>{item.label}
            </button>
          );
        })}
      </nav>
      <div style={{padding:"12px 14px",borderTop:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#00d4aa,#0099ff)",display:"flex",alignItems:"center",justifyContent:"center",color:"#000",fontWeight:700,fontSize:11}}>SA</div>
          <div><div style={{color:C.text,fontSize:11,fontWeight:600}}>Super Admin</div><div style={{color:C.sub,fontSize:10}}>Full Access</div></div>
        </div>
      </div>
    </aside>
  );
}
