import { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext.jsx";
import { C,Card,SHead,KPI,Tbl,TR,TD,Badge,FRow,FSelect } from "../common/ui.jsx";
import { BarChart,Bar,LineChart,Line,XAxis,YAxis,Tooltip,ResponsiveContainer,PieChart,Pie,Cell } from "recharts";

const MONTHS=["All","January","February","March","April","May","June","July","August","September","October","November","December"];
const YEARS=["All","2024","2023"];
const fmt=n=>"₹"+(n||0).toLocaleString("en-IN");
const TT={contentStyle:{background:"#0a1628",border:"1px solid #1e3a5f",borderRadius:8,color:"#e2e8f0",fontSize:11}};
function matchMonth(d,m,y){if(!d)return true;const dt=new Date(d);return(m==="All"||MONTHS[dt.getMonth()+1]===m)&&(y==="All"||dt.getFullYear().toString()===y);}

export default function FeedReport(){
  const {feed,feedStock,tanks,batches}=useApp();
  const [month,setMonth]=useState("All");
  const [year, setYear]=useState("All");
  const [brand,setBrand]=useState("All");
  const [shift,setShift]=useState("All");

  const brands=["All",...new Set((feed||[]).map(f=>f.brand))];

  const filtered=useMemo(()=>(feed||[]).filter(f=>
    matchMonth(f.date,month,year)
    &&(brand==="All"||f.brand===brand)
    &&(shift==="All"||f.shift===shift)
  ),[feed,month,year,brand,shift]);

  const totalQtyKg=filtered.reduce((a,f)=>a+(f.qty||0),0)/1000;
  const totalCost=filtered.reduce((a,f)=>a+(f.cost||0),0);
  const avgFCR=filtered.length?filtered.reduce((a,f)=>a+(f.fcr||0),0)/filtered.length:0;

  // Stock vs consumed
  const totalStocked=(feedStock||[]).reduce((a,s)=>a+s.qty,0);
  const totalConsumedKg=(feed||[]).reduce((a,f)=>a+(f.qty||0),0)/1000;
  const remaining=Math.max(0,totalStocked-totalConsumedKg);

  // Brand-wise usage
  const brandData=useMemo(()=>{
    const map={};
    filtered.forEach(f=>{
      if(!map[f.brand])map[f.brand]={brand:f.brand,qtyKg:0,cost:0,count:0};
      map[f.brand].qtyKg+=f.qty/1000;
      map[f.brand].cost+=f.cost||0;
      map[f.brand].count++;
    });
    return Object.values(map).sort((a,b)=>b.qtyKg-a.qtyKg);
  },[filtered]);

  // Daily usage line chart
  const dailyData=useMemo(()=>{
    const map={};
    filtered.forEach(f=>{if(!f.date)return;if(!map[f.date])map[f.date]={date:f.date,qty:0,cost:0};map[f.date].qty+=f.qty/1000;map[f.date].cost+=f.cost||0;});
    return Object.values(map).sort((a,b)=>a.date.localeCompare(b.date)).slice(-30);
  },[filtered]);

  // Shift-wise distribution
  const shiftData=[
    {name:"Morning",  value:filtered.filter(f=>f.shift==="morning").reduce((a,f)=>a+f.qty/1000,0)},
    {name:"Afternoon",value:filtered.filter(f=>f.shift==="afternoon").reduce((a,f)=>a+f.qty/1000,0)},
    {name:"Night",    value:filtered.filter(f=>f.shift==="night").reduce((a,f)=>a+f.qty/1000,0)},
  ];
  const PIE_COLORS=[C.teal,C.blue,C.purple];

  // Feed type breakdown
  const typeData=useMemo(()=>{
    const map={};
    filtered.forEach(f=>{const t=f.ftype||"Unknown";if(!map[t])map[t]={type:t,qty:0,cost:0};map[t].qty+=f.qty/1000;map[t].cost+=f.cost||0;});
    return Object.values(map);
  },[filtered]);

  return(
    <div style={{padding:24}}>
      <h2 style={{color:C.text,fontSize:18,fontWeight:700,margin:"0 0 4px"}}>Feed Report</h2>
      <p style={{color:C.sub,fontSize:12,margin:"0 0 20px"}}>Feed consumption, cost analysis and FCR tracking</p>

      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <KPI label="Total Used"     value={`${totalQtyKg.toFixed(1)} kg`}   sub="Feed consumed"      icon="🌾" color={C.teal}/>
        <KPI label="Total Cost"     value={fmt(totalCost)}                   sub="Feed expenditure"   icon="💰" color={C.amber}/>
        <KPI label="Avg FCR"        value={avgFCR.toFixed(2)}                sub="Feed conversion ratio" icon="📊" color={C.blue}/>
        <KPI label="Stock Remaining" value={`${remaining.toFixed(0)} kg`}   sub="Available in store" icon="📦" color={C.green}/>
      </div>

      {/* Stock Overview bar */}
      <Card style={{marginBottom:16}}>
        <SHead title="Overall Feed Inventory Status"/>
        <div style={{display:"flex",gap:32,flexWrap:"wrap"}}>
          {[
            {label:"Total Stocked",value:`${totalStocked} kg`,color:C.blue},
            {label:"Total Consumed",value:`${totalConsumedKg.toFixed(1)} kg`,color:C.amber},
            {label:"Remaining",value:`${remaining.toFixed(1)} kg`,color:C.green},
            {label:"Total Cost",value:fmt((feedStock||[]).reduce((a,s)=>a+s.total,0)),color:C.teal},
          ].map((item,i)=>(
            <div key={i}>
              <p style={{color:C.sub,fontSize:10,margin:"0 0 4px",textTransform:"uppercase",letterSpacing:.5}}>{item.label}</p>
              <p style={{color:item.color,fontSize:22,fontWeight:700,margin:0}}>{item.value}</p>
            </div>
          ))}
        </div>
      </Card>

      <FRow>
        <FSelect label="Month" value={month} onChange={setMonth}>{MONTHS.map(m=><option key={m}>{m}</option>)}</FSelect>
        <FSelect label="Year"  value={year}  onChange={setYear}>{YEARS.map(y=><option key={y}>{y}</option>)}</FSelect>
        <FSelect label="Brand" value={brand} onChange={setBrand}>{brands.map(b=><option key={b}>{b}</option>)}</FSelect>
        <FSelect label="Shift" value={shift} onChange={setShift}><option>All</option><option>morning</option><option>afternoon</option><option>night</option></FSelect>
      </FRow>

      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16,marginBottom:16}}>
        <Card>
          <SHead title="Daily Feed Usage (kg)"/>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dailyData}>
              <XAxis dataKey="date" tick={{fill:C.sub,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={d=>d.slice(5)}/>
              <YAxis tick={{fill:C.sub,fontSize:10}} axisLine={false} tickLine={false}/>
              <Tooltip {...TT}/>
              <Line type="monotone" dataKey="qty" stroke={C.teal} strokeWidth={2} dot={false} name="Feed (kg)"/>
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SHead title="Shift-wise Distribution"/>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={shiftData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({name,value})=>`${name}: ${value.toFixed(1)}kg`} fontSize={9}>
                {shiftData.map((d,i)=><Cell key={i} fill={PIE_COLORS[i]}/>)}
              </Pie>
              <Tooltip {...TT} formatter={v=>`${v.toFixed(2)} kg`}/>
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <Card>
          <SHead title="Brand-wise Usage"/>
          <Tbl heads={["Brand","Used (kg)","Cost","Sessions"]}>
            {brandData.map((b,i)=>(
              <TR key={i}>
                <TD bold>{b.brand}</TD>
                <TD color={C.amber}>{b.qtyKg.toFixed(1)}</TD>
                <TD bold>{fmt(b.cost)}</TD>
                <TD small color={C.sub}>{b.count}</TD>
              </TR>
            ))}
          </Tbl>
        </Card>
        <Card>
          <SHead title="Feed Type Breakdown"/>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={typeData} layout="vertical">
              <XAxis type="number" tick={{fill:C.sub,fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis dataKey="type" type="category" tick={{fill:C.text,fontSize:11}} axisLine={false} tickLine={false} width={70}/>
              <Tooltip {...TT} formatter={v=>`${v.toFixed(1)} kg`}/>
              <Bar dataKey="qty" fill={C.teal} radius={[0,4,4,0]} name="kg"/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <SHead title={`Feed Log Details (${filtered.length} entries)`}/>
        <Tbl heads={["Date","Tank","Shift","Brand","Type","Qty (g)","Cost/kg","Cost","Biomass","FCR","Obs"]}>
          {filtered.slice(0,50).map(f=>{
            const t=tanks?.find(t=>t.id===f.tId);
            return(
              <TR key={f.id}>
                <TD small>{f.date}</TD>
                <TD bold>{t?.name||f.tId}</TD>
                <TD><Badge label={f.shift} color={f.shift==="morning"?C.teal:f.shift==="afternoon"?C.amber:C.purple}/></TD>
                <TD>{f.brand}</TD>
                <TD small>{f.ftype}</TD>
                <TD bold color={C.blue}>{f.qty}</TD>
                <TD small>{fmt(f.ckg)}</TD>
                <TD bold>{fmt(f.cost)}</TD>
                <TD small>{f.bio}</TD>
                <TD small color={f.fcr>1.7?C.red:C.green}>{f.fcr}</TD>
                <TD small color={C.sub}>{f.obs}</TD>
              </TR>
            );
          })}
        </Tbl>
      </Card>
    </div>
  );
}
