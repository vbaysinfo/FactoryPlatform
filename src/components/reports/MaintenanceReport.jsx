import { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext.jsx";
import { C,Card,SHead,KPI,Tbl,TR,TD,Badge,FRow,FSelect } from "../common/ui.jsx";
import { BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,PieChart,Pie,Cell } from "recharts";

const MONTHS=["All","January","February","March","April","May","June","July","August","September","October","November","December"];
const YEARS=["All","2024","2023"];
const fmt=n=>"₹"+(n||0).toLocaleString("en-IN");
const TT={contentStyle:{background:"#0a1628",border:"1px solid #1e3a5f",borderRadius:8,color:"#e2e8f0",fontSize:11}};
function matchMonth(d,m,y){if(!d)return true;const dt=new Date(d);return(m==="All"||MONTHS[dt.getMonth()+1]===m)&&(y==="All"||dt.getFullYear().toString()===y);}

const CAT_COLORS={
  "RO Plant":C.blue,"Generator":C.amber,"Tank":C.teal,
  "Electrical":C.purple,"Plumbing":C.green,"Other":"#94a3b8",
};

export default function MaintenanceReport(){
  const {maint,power}=useApp();
  const [month,setMonth]=useState("All");
  const [year, setYear]=useState("All");
  const [cat, setCat]=useState("All");
  const [status,setStatus]=useState("All");

  const cats=["All",...new Set((maint||[]).map(m=>m.cat))];

  const filtered=useMemo(()=>(maint||[]).filter(m=>
    matchMonth(m.date,month,year)
    &&(cat==="All"||m.cat===cat)
    &&(status==="All"||m.status===status)
  ),[maint,month,year,cat,status]);

  const totalCost=filtered.reduce((a,m)=>a+(m.cost||0),0);
  const totalPowerCost=(power||[]).reduce((a,p)=>a+(p.amt||0),0);
  const completed=filtered.filter(m=>m.status==="completed").length;
  const scheduled=filtered.filter(m=>m.status==="scheduled").length;

  // Category-wise cost
  const catData=useMemo(()=>{
    const map={};
    filtered.forEach(m=>{if(!map[m.cat])map[m.cat]={cat:m.cat,cost:0,count:0};map[m.cat].cost+=m.cost||0;map[m.cat].count++;});
    return Object.values(map).sort((a,b)=>b.cost-a.cost);
  },[filtered]);

  // Monthly cost trend
  const monthlyData=useMemo(()=>{
    const map={};
    (maint||[]).forEach(m=>{if(!m.date)return;const mo=new Date(m.date).toLocaleString("en",{month:"short"});if(!map[mo])map[mo]={month:mo,cost:0,count:0};map[mo].cost+=m.cost||0;map[mo].count++;});
    return Object.values(map);
  },[maint]);

  // Upcoming scheduled
  const upcoming=(maint||[]).filter(m=>m.status==="scheduled"&&m.nxt).sort((a,b)=>new Date(a.nxt)-new Date(b.nxt));

  // Vendor analysis
  const vendorData=useMemo(()=>{
    const map={};
    filtered.forEach(m=>{const v=m.vendor||"Unknown";if(!map[v])map[v]={vendor:v,count:0,cost:0};map[v].count++;map[v].cost+=m.cost||0;});
    return Object.values(map).sort((a,b)=>b.cost-a.cost);
  },[filtered]);

  // Power bills
  const powerFiltered=(power||[]).filter(p=>year==="All"||p.year?.toString()===year);

  return(
    <div style={{padding:24}}>
      <h2 style={{color:C.text,fontSize:18,fontWeight:700,margin:"0 0 4px"}}>Maintenance Report</h2>
      <p style={{color:C.sub,fontSize:12,margin:"0 0 20px"}}>Equipment maintenance cost, schedule and vendor analysis</p>

      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <KPI label="Total Jobs"      value={filtered.length}     sub="Maintenance entries"   icon="🔧" color={C.teal}/>
        <KPI label="Total Cost"      value={fmt(totalCost)}      sub="Maintenance spend"     icon="💰" color={C.amber}/>
        <KPI label="Completed"       value={completed}           sub="Jobs done"             icon="✅" color={C.green}/>
        <KPI label="Scheduled"       value={scheduled}           sub="Upcoming jobs"         icon="📅" color={C.blue}/>
        <KPI label="Power Bills"     value={fmt(totalPowerCost)} sub="Total electricity"     icon="⚡" color={C.purple}/>
      </div>

      <FRow>
        <FSelect label="Month"    value={month}  onChange={setMonth}>{MONTHS.map(m=><option key={m}>{m}</option>)}</FSelect>
        <FSelect label="Year"     value={year}   onChange={setYear}>{YEARS.map(y=><option key={y}>{y}</option>)}</FSelect>
        <FSelect label="Category" value={cat}    onChange={setCat}>{cats.map(c=><option key={c}>{c}</option>)}</FSelect>
        <FSelect label="Status"   value={status} onChange={setStatus}><option>All</option><option>completed</option><option>scheduled</option><option>in-progress</option></FSelect>
      </FRow>

      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16,marginBottom:16}}>
        <Card>
          <SHead title="Monthly Maintenance Cost"/>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" tick={{fill:C.sub,fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.sub,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
              <Tooltip {...TT} formatter={v=>fmt(v)}/>
              <Bar dataKey="cost" radius={[4,4,0,0]} name="Cost">
                {monthlyData.map((_,i)=><Cell key={i} fill={C.amber}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SHead title="Category-wise Spend"/>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={catData} cx="50%" cy="50%" outerRadius={75} dataKey="cost" nameKey="cat" label={({cat,cost})=>`${cat}`} fontSize={9}>
                {catData.map((d,i)=><Cell key={i} fill={CAT_COLORS[d.cat]||"#94a3b8"}/>)}
              </Pie>
              <Tooltip {...TT} formatter={v=>fmt(v)}/>
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <Card>
          <SHead title="Category Summary"/>
          <Tbl heads={["Category","Jobs","Total Cost","Avg Cost"]}>
            {catData.map((c,i)=>(
              <TR key={i}>
                <TD><span style={{display:"flex",alignItems:"center",gap:6}}><span style={{width:10,height:10,borderRadius:2,background:CAT_COLORS[c.cat]||"#94a3b8",display:"inline-block"}}/>{c.cat}</span></TD>
                <TD>{c.count}</TD>
                <TD bold color={C.amber}>{fmt(c.cost)}</TD>
                <TD small color={C.sub}>{fmt(Math.round(c.cost/c.count))}</TD>
              </TR>
            ))}
          </Tbl>
        </Card>
        <Card>
          <SHead title="Vendor Analysis"/>
          <Tbl heads={["Vendor","Jobs","Total Paid"]}>
            {vendorData.map((v,i)=>(
              <TR key={i}>
                <TD bold>{v.vendor}</TD>
                <TD>{v.count}</TD>
                <TD bold color={C.teal}>{fmt(v.cost)}</TD>
              </TR>
            ))}
          </Tbl>
        </Card>
      </div>

      {/* Upcoming scheduled */}
      {upcoming.length>0&&(
        <Card style={{marginBottom:16,border:`1px solid ${C.amber}30`}}>
          <SHead title="⚠️ Upcoming Scheduled Maintenance"/>
          <Tbl heads={["Category","Sub","Next Due","Description","Estimated Cost","Vendor"]}>
            {upcoming.map((m,i)=>{
              const days=Math.ceil((new Date(m.nxt)-new Date())/(1000*60*60*24));
              return(
                <TR key={i}>
                  <TD><Badge label={m.cat} color={CAT_COLORS[m.cat]||C.sub}/></TD>
                  <TD>{m.sub}</TD>
                  <TD bold color={days<=7?C.red:days<=14?C.amber:C.green}>{m.nxt} <span style={{fontSize:10}}>({days}d)</span></TD>
                  <TD small>{m.desc}</TD>
                  <TD>{fmt(m.cost)}</TD>
                  <TD small color={C.sub}>{m.vendor}</TD>
                </TR>
              );
            })}
          </Tbl>
        </Card>
      )}

      {/* Power Bills */}
      <Card style={{marginBottom:16}}>
        <SHead title="⚡ Power Bill Summary"/>
        <div style={{display:"flex",gap:12,marginBottom:12,flexWrap:"wrap"}}>
          <KPI label="Total Units" value={(powerFiltered.reduce((a,p)=>a+(p.units||0),0)).toLocaleString()} sub="kWh consumed" icon="⚡" color={C.blue}/>
          <KPI label="Total Bill"  value={fmt(powerFiltered.reduce((a,p)=>a+(p.amt||0),0))}   sub="Electricity cost" icon="💡" color={C.amber}/>
          <KPI label="Pending"     value={powerFiltered.filter(p=>p.status==="pending").length} sub="Bills unpaid"    icon="⏳" color={C.red}/>
        </div>
        <Tbl heads={["Month","Year","Units (kWh)","Amount","Status","Paid Date"]}>
          {powerFiltered.map(p=>(
            <TR key={p.id}>
              <TD bold>{p.month}</TD>
              <TD>{p.year}</TD>
              <TD color={C.blue}>{(p.units||0).toLocaleString()}</TD>
              <TD bold>{fmt(p.amt)}</TD>
              <TD><Badge label={p.status} color={p.status==="paid"?C.green:C.red}/></TD>
              <TD small color={C.sub}>{p.paid||"—"}</TD>
            </TR>
          ))}
        </Tbl>
      </Card>

      {/* Full maintenance log */}
      <Card>
        <SHead title={`Maintenance Log (${filtered.length} entries)`}/>
        <Tbl heads={["Date","Category","Sub","Description","Cost","Vendor","Done By","Next Due","Status"]}>
          {filtered.map(m=>(
            <TR key={m.id}>
              <TD small>{m.date}</TD>
              <TD><Badge label={m.cat} color={CAT_COLORS[m.cat]||C.sub}/></TD>
              <TD small>{m.sub}</TD>
              <TD small>{m.desc}</TD>
              <TD bold color={C.amber}>{fmt(m.cost)}</TD>
              <TD small>{m.vendor}</TD>
              <TD small color={C.sub}>{m.by}</TD>
              <TD small color={m.nxt&&new Date(m.nxt)<new Date()?C.red:C.sub}>{m.nxt||"—"}</TD>
              <TD><Badge label={m.status} color={m.status==="completed"?C.green:m.status==="scheduled"?C.blue:C.amber}/></TD>
            </TR>
          ))}
        </Tbl>
      </Card>
    </div>
  );
}
