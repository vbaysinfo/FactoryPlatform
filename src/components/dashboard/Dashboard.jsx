
import { useApp } from "../../context/AppContext.jsx";
import { C,KPI,Card,SHead,Badge,Tbl,TR,TD,TT } from "../common/ui.jsx";
import { BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,PieChart,Pie,Cell } from "recharts";
const CLRS=["#00d4aa","#0099ff","#a855f7","#f59e0b","#ef4444","#22c55e"];
export default function Dashboard(){
  const {tanks,batches,sales,farmers,staff,techLogs,monthly,sheds,water,feed,meds,feedStock,medStock}=useApp();
  const todayISO=new Date().toISOString().slice(0,10);
  const active=batches.filter(b=>b.status!=="harvested");
  const hr=batches.filter(b=>b.status!=="harvested"&&Math.max(0,Math.floor((new Date()-new Date(b.sd||""))/(864e5)))>=22);
  const totalPL=active.reduce((s,b)=>s+b.cnt,0);
  const totalBio=active.reduce((s,b)=>s+(b.bio||0),0).toFixed(1);
  const avgFCR=active.length?(active.reduce((s,b)=>s+(b.fcr||0),0)/active.length).toFixed(2):"0";
  const totalRev=sales.reduce((s,x)=>s+x.total,0);
  const pend=sales.filter(x=>x.status!=="paid").reduce((s,x)=>s+x.bal,0);

  // Today's tasks
  const activeTankIds=active.map(b=>b.tId);
  const waterToday=water.filter(w=>w.date===todayISO);
  const checkedTodayIds=new Set(waterToday.map(w=>w.tId));
  const pendingWater=activeTankIds.filter(id=>!checkedTodayIds.has(id)).length;
  const expiringMeds=(medStock||[]).filter(m=>m.expiry&&(new Date(m.expiry)-new Date())/(864e5)<=30).length;
  const totalFeedStocked=(feedStock||[]).reduce((s,f)=>s+f.qty,0);
  const totalFeedUsed=feed.reduce((s,f)=>s+(f.qty||0)/1000,0);
  const feedRemaining=Math.max(0,totalFeedStocked-totalFeedUsed);
  const lowFeed=feedRemaining<50?1:0;

  const pieData=[
    {n:"Culture Active",v:tanks.filter(t=>t.type==="culture"&&t.status==="active").length},
    {n:"Treatment Active",v:tanks.filter(t=>t.type==="treatment"&&t.status==="active").length},
    {n:"Harvest Ready",v:hr.length},
    {n:"Empty",v:tanks.filter(t=>t.status==="empty").length},
    {n:"Maintenance",v:tanks.filter(t=>t.status==="maintenance").length},
  ];
  const shedBio=sheds.map(sh=>{
    const sTanks=tanks.filter(t=>t.shedId===sh.id);
    const sb=batches.filter(b=>sTanks.some(t=>t.id===b.tId)&&b.status!=="harvested");
    return{name:sh.name,bio:+sb.reduce((s,b)=>s+(b.bio||0),0).toFixed(1)};
  });
  const techs=staff.filter(s=>s.role==="Technician");
  const todayL=techLogs.filter(l=>l.date===todayISO);

  // Recent activity — last 5 entries across water/feed/meds
  const recentActs=[
    ...water.map(w=>({date:w.date,tId:w.tId,icon:"💧",desc:"Water check"})),
    ...feed.map(f=>({date:f.date,tId:f.tId,icon:"🌾",desc:`Feed: ${((f.qty||0)/1000).toFixed(1)}kg ${f.brand||""}`})),
    ...meds.map(m=>({date:m.date,tId:m.tId,icon:"💊",desc:`Medicine: ${m.name||""} ${m.dose||""}${m.unit||""}`})),
  ].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
  const topF=farmers.map(f=>({name:f.name.split(" ")[0],v:sales.filter(s=>s.fId===f.id).reduce((s,x)=>s+x.total,0)/1000})).filter(f=>f.v>0).sort((a,b)=>b.v-a.v).slice(0,5);
  return(
    <div style={{padding:"20px 24px",overflowY:"auto"}}>
      {/* Today's Tasks Alert Row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
        {[
          {icon:"💧",label:"Water Checks Pending",value:pendingWater,color:pendingWater>0?C.blue:C.sub,alert:pendingWater>0},
          {icon:"✅",label:"Harvest Ready",value:hr.length,color:hr.length>0?C.amber:C.sub,alert:hr.length>0},
          {icon:"⏰",label:"Medicines Expiring (30d)",value:expiringMeds,color:expiringMeds>0?C.red:C.sub,alert:expiringMeds>0},
          {icon:"📦",label:"Feed Stock Low",value:lowFeed?"YES":"OK",color:lowFeed?C.red:C.teal,alert:!!lowFeed},
        ].map(t=>(
          <div key={t.label} style={{background:t.alert?t.color+"15":C.card,border:"1px solid "+(t.alert?t.color+"40":C.border),borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:22}}>{t.icon}</span>
            <div>
              <div style={{color:t.color,fontSize:20,fontWeight:800,lineHeight:1}}>{t.value}</div>
              <div style={{color:C.sub,fontSize:10,marginTop:2}}>{t.label}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        <KPI label="Active Cultures"  value={active.length}                        sub={hr.length+" harvest ready"} color={C.teal}   icon="🐟"/>
        <KPI label="Total PLs"        value={(totalPL/1000000).toFixed(2)+"M"}     sub="in nursery"                 color={C.blue}   icon="🦐"/>
        <KPI label="Total Biomass"    value={totalBio+" kg"}                       sub="all tanks"                  color={C.amber}  icon="⚖️"/>
        <KPI label="Avg FCR"          value={avgFCR}                               sub="feed conversion ratio"      color={C.purple} icon="📊"/>
        <KPI label="Revenue YTD"      value={"₹"+(totalRev/100000).toFixed(1)+"L"} sub="all sales"                 color={C.green}  icon="💰"/>
        <KPI label="Pending"          value={"₹"+(pend/1000).toFixed(0)+"K"}      sub="uncollected"                color={C.red}    icon="⚠️"/>
      </div>
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        {[{l:"Total Tanks",v:tanks.length,c:C.blue},{l:"Culture Active",v:tanks.filter(t=>t.type==="culture"&&t.status==="active").length,c:C.teal},{l:"Treatment Active",v:tanks.filter(t=>t.type==="treatment"&&t.status==="active").length,c:C.purple},{l:"Empty",v:tanks.filter(t=>t.status==="empty").length,c:C.sub},{l:"Maintenance",v:tanks.filter(t=>t.status==="maintenance").length,c:C.red},{l:"Farmers",v:farmers.length,c:C.amber},{l:"Staff",v:staff.length,c:C.blue},{l:"Invoices",v:sales.length,c:C.teal}].map(k=>(
          <div key={k.l} style={{background:C.card,borderRadius:10,padding:"10px 14px",flex:1,minWidth:90,border:"1px solid "+k.c+"25",textAlign:"center"}}>
            <div style={{color:k.c,fontSize:20,fontWeight:700}}>{k.v}</div>
            <div style={{color:C.sub,fontSize:9,marginTop:2}}>{k.l}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 260px",gap:14,marginBottom:16}}>
        <Card><SHead title="Monthly Revenue vs Cost"/><ResponsiveContainer width="100%" height={175}><BarChart data={monthly}><XAxis dataKey="m" stroke={C.sub} fontSize={10}/><YAxis stroke={C.sub} fontSize={10} tickFormatter={v=>"₹"+(v/1000).toFixed(0)+"K"}/><Tooltip {...TT} formatter={v=>"₹"+(v/1000).toFixed(0)+"K"}/><Bar dataKey="rev" fill={C.teal} radius={[4,4,0,0]} name="Revenue"/><Bar dataKey="cost" fill={C.blue} radius={[4,4,0,0]} name="Cost"/><Bar dataKey="profit" fill={C.purple} radius={[4,4,0,0]} name="Profit"/></BarChart></ResponsiveContainer></Card>
        <Card><SHead title="Biomass by Shed (kg)"/><ResponsiveContainer width="100%" height={175}><BarChart data={shedBio}><XAxis dataKey="name" stroke={C.sub} fontSize={10}/><YAxis stroke={C.sub} fontSize={10}/><Tooltip {...TT}/><Bar dataKey="bio" fill={C.teal} radius={[4,4,0,0]} name="kg"/></BarChart></ResponsiveContainer></Card>
        <Card><SHead title="Tank Status"/><ResponsiveContainer width="100%" height={110}><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={52} dataKey="v" paddingAngle={3}>{pieData.map((_,i)=><Cell key={i} fill={CLRS[i]}/>)}</Pie><Tooltip {...TT}/></PieChart></ResponsiveContainer>{pieData.map((d,i)=><div key={d.n} style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{display:"flex",alignItems:"center",gap:5,color:C.sub,fontSize:10}}><span style={{width:6,height:6,borderRadius:"50%",background:CLRS[i],display:"block"}}/>{d.n}</span><span style={{color:C.text,fontSize:10,fontWeight:600}}>{d.v}</span></div>)}</Card>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:16}}>
        <Card accent={C.amber}><SHead title="🌾 Harvest Ready"/>{hr.length===0?<p style={{color:C.sub,fontSize:12}}>None ready</p>:hr.map(b=>{const t=tanks.find(x=>x.id===b.tId);return(<div key={b.id} style={{background:C.amber+"10",borderRadius:8,padding:"8px 10px",marginBottom:7,border:"1px solid "+C.amber+"25"}}><div style={{display:"flex",justifyContent:"space-between"}}><div><div style={{color:C.text,fontSize:12,fontWeight:700}}>{t?.name} — {b.no}</div><div style={{color:C.sub,fontSize:10}}>{b.pl} • {(b.cnt/1000).toFixed(0)}K</div></div><div style={{textAlign:"right"}}><div style={{color:C.amber,fontSize:14,fontWeight:700}}>D{b.doc}</div><div style={{color:C.teal,fontSize:10}}>{b.bio}kg</div></div></div></div>);})}</Card>
        <Card><SHead title="👷 Tech Compliance"/>{techs.map(tech=>{const log=todayL.find(l=>l.tId===tech.id);const sc=log?.score||0;const cc=sc>=90?C.teal:sc>=70?C.amber:C.red;return(<div key={tech.id} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{color:C.text,fontSize:12}}>{tech.name}</span><span style={{color:cc,fontWeight:700,fontSize:12}}>{sc}%</span></div><div style={{height:5,borderRadius:3,background:"rgba(255,255,255,0.08)"}}><div style={{height:"100%",width:sc+"%",borderRadius:3,background:cc}}/></div>{log&&<div style={{display:"flex",gap:8,marginTop:3}}>{[["M",log.mW],["A",log.aW],["N",log.nW]].map(([l,v])=><span key={l} style={{fontSize:9,color:v?C.teal:C.red,fontWeight:700}}>{l}:{v?"✓":"✗"}</span>)}</div>}</div>);})}</Card>
        <Card><SHead title="🏆 Top Farmers"/>{topF.map((f,i)=>(<div key={f.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{width:18,height:18,borderRadius:"50%",background:CLRS[i],display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#000",fontWeight:700}}>{i+1}</span><span style={{color:C.text,fontSize:12}}>{f.name}</span></div><span style={{color:C.teal,fontSize:12,fontWeight:700}}>₹{f.v.toFixed(0)}K</span></div>))}</Card>
      </div>
      <Card><SHead title="All Active Batches"/>
        <Tbl heads={["Tank","Shed","Type","Batch No","DOC","PL","Stocked","Biomass","FCR","Feed","SR%","Hatchery","Cost","Status"]}>
          {batches.filter(b=>b.status!=="harvested").map(b=>{const t=tanks.find(x=>x.id===b.tId);const doc=Math.max(0,Math.floor((new Date()-new Date(b.sd||""))/(864e5)));const sc=doc>=22?C.amber:doc>=15?C.blue:C.teal;return(<TR key={b.id}><TD color={C.blue} bold>{t?.name}</TD><TD color={C.sub}>{t?.shed}</TD><TD><Badge label={t?.type||""} color={t?.type==="culture"?C.teal:C.purple}/></TD><TD color={C.sub} small>{b.no}</TD><TD color={sc} bold>D{doc}</TD><TD>{b.pl}</TD><TD>{(b.cnt/1000).toFixed(0)}K</TD><TD color={C.amber} bold>{b.bio||"—"}kg</TD><TD color={C.blue}>{b.fcr||"—"}</TD><TD color={C.sub}>{b.feed||"—"}kg</TD><TD color={C.green} bold>{b.sr}%</TD><TD color={C.sub} small>{b.hatch}</TD><TD color={C.purple}>₹{(b.cost||0).toLocaleString("en-IN")}</TD><TD><Badge label={doc>=22?"harvest-ready":b.status} color={sc}/></TD></TR>);})}
        </Tbl>
      </Card>
      {recentActs.length>0&&<Card style={{marginTop:14}}><SHead title="🕐 Recent Activity"/>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {recentActs.map((a,i)=>{const t=tanks.find(x=>x.id===a.tId);return(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 12px",background:C.card2,borderRadius:8}}>
              <span style={{fontSize:16}}>{a.icon}</span>
              <span style={{color:C.sub,fontSize:11,width:80,flexShrink:0}}>{a.date}</span>
              <span style={{color:C.blue,fontSize:11,fontWeight:600,width:60,flexShrink:0}}>{t?.name||"—"}</span>
              <span style={{color:C.text,fontSize:11}}>{a.desc}</span>
            </div>
          );})}
        </div>
      </Card>}
    </div>
  );
}
