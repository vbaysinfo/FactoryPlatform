import { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext.jsx";
import { C,Card,SHead,KPI,Tbl,TR,TD,Badge,FRow,FSelect } from "../common/ui.jsx";
import { BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,PieChart,Pie,Cell } from "recharts";

const MONTHS=["All","January","February","March","April","May","June","July","August","September","October","November","December"];
const YEARS=["All","2024","2023"];
const fmt=n=>"₹"+(n||0).toLocaleString("en-IN");
const TT={contentStyle:{background:"#0a1628",border:"1px solid #1e3a5f",borderRadius:8,color:"#e2e8f0",fontSize:11}};
function matchMonth(d,m,y){if(!d)return true;const dt=new Date(d);return(m==="All"||MONTHS[dt.getMonth()+1]===m)&&(y==="All"||dt.getFullYear().toString()===y);}

export default function MedicineReport(){
  const {meds,medStock,tanks}=useApp();
  const [month,setMonth]=useState("All");
  const [year, setYear]=useState("All");
  const [mtype,setMtype]=useState("All");

  const types=["All",...new Set((meds||[]).map(m=>m.mtype))];

  const filtered=useMemo(()=>(meds||[]).filter(m=>
    matchMonth(m.date,month,year)&&(mtype==="All"||m.mtype===mtype)
  ),[meds,month,year,mtype]);

  const totalCost=filtered.reduce((a,m)=>a+(m.cost||0),0);
  const totalStockCost=(medStock||[]).reduce((a,s)=>a+s.total,0);

  // Med type distribution
  const typeData=useMemo(()=>{
    const map={};
    filtered.forEach(m=>{
      const t=m.mtype||"Other";
      if(!map[t])map[t]={type:t,count:0,cost:0};
      map[t].count++;
      map[t].cost+=m.cost||0;
    });
    return Object.values(map);
  },[filtered]);

  const PIE_COLORS=[C.teal,C.blue,C.purple,C.amber,C.green];

  // Medicine-wise usage
  const medUsage=useMemo(()=>{
    const map={};
    filtered.forEach(m=>{
      if(!map[m.name])map[m.name]={name:m.name,mtype:m.mtype,count:0,totalDose:0,unit:m.unit,cost:0};
      map[m.name].count++;
      map[m.name].totalDose+=m.dose||0;
      map[m.name].cost+=m.cost||0;
    });
    return Object.values(map).sort((a,b)=>b.cost-a.cost);
  },[filtered]);

  // Monthly cost trend
  const monthlyTrend=useMemo(()=>{
    const map={};
    (meds||[]).forEach(m=>{if(!m.date)return;const mo=new Date(m.date).toLocaleString("en",{month:"short"});if(!map[mo])map[mo]={month:mo,cost:0,count:0};map[mo].cost+=m.cost||0;map[mo].count++;});
    return Object.values(map);
  },[meds]);

  // Treatment reason analysis
  const reasonData=useMemo(()=>{
    const map={};
    filtered.forEach(m=>{const r=m.reason||"Other";if(!map[r])map[r]={reason:r,count:0,cost:0};map[r].count++;map[r].cost+=m.cost||0;});
    return Object.values(map).sort((a,b)=>b.count-a.count);
  },[filtered]);

  // Stock remaining
  const consumed=useMemo(()=>{
    const map={};
    (meds||[]).forEach(m=>{const qty=m.unit==="g"?(m.dose||0)/1000:(m.dose||0);map[m.name]=(map[m.name]||0)+qty;});
    return map;
  },[meds]);

  const stockStatus=useMemo(()=>{
    const map={};
    (medStock||[]).forEach(s=>{if(!map[s.name])map[s.name]={name:s.name,stocked:0};map[s.name].stocked+=s.qty;});
    return Object.values(map).map(r=>({...r,used:consumed[r.name]||0,remaining:Math.max(0,r.stocked-(consumed[r.name]||0))}));
  },[medStock,consumed]);

  return(
    <div style={{padding:24}}>
      <h2 style={{color:C.text,fontSize:18,fontWeight:700,margin:"0 0 4px"}}>Medicine Report</h2>
      <p style={{color:C.sub,fontSize:12,margin:"0 0 20px"}}>Treatment logs, consumption and medicine cost analysis</p>

      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <KPI label="Total Treatments" value={filtered.length}       sub="Applications"         icon="💉" color={C.purple}/>
        <KPI label="Treatment Cost"   value={fmt(totalCost)}        sub="Filtered period"      icon="💰" color={C.amber}/>
        <KPI label="Stock Invested"   value={fmt(totalStockCost)}   sub="Total purchased"      icon="📦" color={C.teal}/>
        <KPI label="Med Types Used"   value={new Set(filtered.map(m=>m.name)).size} sub="Unique medicines" icon="💊" color={C.blue}/>
      </div>

      <FRow>
        <FSelect label="Month" value={month} onChange={setMonth}>{MONTHS.map(m=><option key={m}>{m}</option>)}</FSelect>
        <FSelect label="Year"  value={year}  onChange={setYear}>{YEARS.map(y=><option key={y}>{y}</option>)}</FSelect>
        <FSelect label="Type"  value={mtype} onChange={setMtype}>{types.map(t=><option key={t}>{t}</option>)}</FSelect>
      </FRow>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <Card>
          <SHead title="Monthly Treatment Cost"/>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyTrend}>
              <XAxis dataKey="month" tick={{fill:C.sub,fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.sub,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v}`}/>
              <Tooltip {...TT} formatter={v=>fmt(v)}/>
              <Bar dataKey="cost" fill={C.purple} radius={[4,4,0,0]} name="Cost"/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SHead title="Medicine Type Usage"/>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={typeData} cx="50%" cy="50%" outerRadius={75} dataKey="count" nameKey="type" label={({type,count})=>`${type}:${count}`} fontSize={9}>
                {typeData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
              </Pie>
              <Tooltip {...TT}/>
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <Card>
          <SHead title="Medicine-wise Usage & Cost"/>
          <Tbl heads={["Medicine","Type","Applications","Total Dose","Cost"]}>
            {medUsage.map((m,i)=>(
              <TR key={i}>
                <TD bold>{m.name}</TD>
                <TD><Badge label={m.mtype} color={m.mtype==="Probiotic"?C.green:m.mtype==="Vitamin"?C.blue:C.amber}/></TD>
                <TD>{m.count}</TD>
                <TD>{m.totalDose.toFixed(1)} {m.unit}</TD>
                <TD bold color={C.amber}>{fmt(m.cost)}</TD>
              </TR>
            ))}
          </Tbl>
        </Card>
        <Card>
          <SHead title="Treatment Reason Analysis"/>
          <Tbl heads={["Reason","Count","Cost"]}>
            {reasonData.map((r,i)=>(
              <TR key={i}>
                <TD>{r.reason}</TD>
                <TD bold color={C.blue}>{r.count}</TD>
                <TD>{fmt(r.cost)}</TD>
              </TR>
            ))}
          </Tbl>
        </Card>
      </div>

      <Card style={{marginBottom:16}}>
        <SHead title="Stock vs Consumption Status"/>
        <Tbl heads={["Medicine","Stocked (kg)","Used (kg)","Remaining (kg)","Status"]}>
          {stockStatus.map((s,i)=>{
            const pct=s.stocked>0?Math.round((s.remaining/s.stocked)*100):0;
            const c=pct<=20?C.red:pct<=40?C.amber:C.green;
            return(
              <TR key={i}>
                <TD bold>{s.name}</TD>
                <TD>{s.stocked.toFixed(2)}</TD>
                <TD color={C.amber}>{s.used.toFixed(2)}</TD>
                <TD bold color={c}>{s.remaining.toFixed(2)}</TD>
                <TD><Badge label={pct<=20?"LOW":pct<=40?"MEDIUM":"GOOD"} color={c}/></TD>
              </TR>
            );
          })}
        </Tbl>
      </Card>

      <Card>
        <SHead title={`Treatment Log (${filtered.length} entries)`}/>
        <Tbl heads={["Date","Tank","Medicine","Type","Dose","Method","Reason","Cost"]}>
          {filtered.map(m=>{
            const t=tanks?.find(t=>t.id===m.tId);
            return(
              <TR key={m.id}>
                <TD small>{m.date}</TD>
                <TD bold>{t?.name||m.tId}</TD>
                <TD bold color={C.purple}>{m.name}</TD>
                <TD><Badge label={m.mtype} color={m.mtype==="Probiotic"?C.green:m.mtype==="Vitamin"?C.blue:C.amber}/></TD>
                <TD>{m.dose} {m.unit}</TD>
                <TD small>{m.method}</TD>
                <TD small color={C.sub}>{m.reason}</TD>
                <TD bold color={C.amber}>{fmt(m.cost)}</TD>
              </TR>
            );
          })}
        </Tbl>
      </Card>
    </div>
  );
}
