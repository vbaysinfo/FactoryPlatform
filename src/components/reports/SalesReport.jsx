import { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext.jsx";
import { C,Card,SHead,KPI,Tbl,TR,TD,Badge,FRow,FSelect } from "../common/ui.jsx";
import { BarChart,Bar,LineChart,Line,XAxis,YAxis,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,Legend } from "recharts";

const MONTHS=["All","January","February","March","April","May","June","July","August","September","October","November","December"];
const YEARS=["All","2024","2023"];
const fmt=n=>"₹"+(n||0).toLocaleString("en-IN");
const TT={contentStyle:{background:"#0a1628",border:"1px solid #1e3a5f",borderRadius:8,color:"#e2e8f0",fontSize:11}};

function matchMonth(d,m,y){
  if(!d)return true;
  const dt=new Date(d);
  return(m==="All"||MONTHS[dt.getMonth()+1]===m)&&(y==="All"||dt.getFullYear().toString()===y);
}

export default function SalesReport(){
  const {sales,farmers,batches}=useApp();
  const [month,setMonth]=useState("All");
  const [year, setYear]=useState("All");
  const [status,setStatus]=useState("All");
  const [farmer,setFarmer]=useState("All");

  const farmerNames=["All",...(farmers||[]).map(f=>f.name)];

  const filtered=useMemo(()=>(sales||[]).filter(s=>{
    const f=farmers?.find(f=>f.id===s.fId);
    return matchMonth(s.date,month,year)
      &&(status==="All"||s.status===status)
      &&(farmer==="All"||f?.name===farmer);
  }),[sales,month,year,status,farmer,farmers]);

  const totalRevenue=filtered.reduce((a,s)=>a+(s.total||0),0);
  const totalCollected=filtered.reduce((a,s)=>a+(s.paid||0),0);
  const totalPending=filtered.reduce((a,s)=>a+(s.bal||0),0);
  const totalQty=filtered.reduce((a,s)=>a+(s.qty||0),0);

  // Monthly revenue chart data
  const monthlyData=useMemo(()=>{
    const map={};
    (sales||[]).forEach(s=>{
      if(!s.date)return;
      const m=new Date(s.date).toLocaleString("en",{month:"short"});
      if(!map[m])map[m]={month:m,revenue:0,collected:0,pending:0};
      map[m].revenue+=s.total||0;
      map[m].collected+=s.paid||0;
      map[m].pending+=s.bal||0;
    });
    return Object.values(map);
  },[sales]);

  // Farmer-wise revenue
  const farmerData=useMemo(()=>{
    const map={};
    filtered.forEach(s=>{
      const f=farmers?.find(f=>f.id===s.fId);
      const name=f?.name||"Unknown";
      if(!map[name])map[name]={name,revenue:0,qty:0,count:0};
      map[name].revenue+=s.total||0;
      map[name].qty+=s.qty||0;
      map[name].count++;
    });
    return Object.values(map).sort((a,b)=>b.revenue-a.revenue);
  },[filtered,farmers]);

  // Payment status pie
  const pieData=[
    {name:"Paid",    value:filtered.filter(s=>s.status==="paid").length,    color:C.green},
    {name:"Partial", value:filtered.filter(s=>s.status==="partial").length, color:C.amber},
    {name:"Pending", value:filtered.filter(s=>s.status==="pending").length, color:C.red},
  ].filter(d=>d.value>0);

  return(
    <div style={{padding:24}}>
      <h2 style={{color:C.text,fontSize:18,fontWeight:700,margin:"0 0 4px"}}>Sales Report</h2>
      <p style={{color:C.sub,fontSize:12,margin:"0 0 20px"}}>Revenue, collections and farmer-wise sales analysis</p>

      {/* KPIs */}
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <KPI label="Total Revenue"   value={fmt(totalRevenue)}   sub={`${filtered.length} invoices`}          icon="💰" color={C.teal}/>
        <KPI label="Collected"       value={fmt(totalCollected)} sub="Payments received"                      icon="✅" color={C.green}/>
        <KPI label="Pending"         value={fmt(totalPending)}   sub="Outstanding balance"                    icon="⏳" color={C.red}/>
        <KPI label="Total Qty Sold"  value={`${(totalQty/1000).toFixed(0)}K PL`} sub="Post-larvae sold"      icon="🦐" color={C.blue}/>
      </div>

      {/* Filters */}
      <FRow>
        <FSelect label="Month"  value={month}  onChange={setMonth}>{MONTHS.map(m=><option key={m}>{m}</option>)}</FSelect>
        <FSelect label="Year"   value={year}   onChange={setYear}>{YEARS.map(y=><option key={y}>{y}</option>)}</FSelect>
        <FSelect label="Status" value={status} onChange={setStatus}><option>All</option><option>paid</option><option>partial</option><option>pending</option></FSelect>
        <FSelect label="Farmer" value={farmer} onChange={setFarmer}>{farmerNames.map(f=><option key={f}>{f}</option>)}</FSelect>
      </FRow>

      {/* Charts */}
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16,marginBottom:16}}>
        <Card>
          <SHead title="Monthly Revenue vs Collections"/>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" tick={{fill:C.sub,fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.sub,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
              <Tooltip {...TT} formatter={v=>fmt(v)}/>
              <Bar dataKey="revenue"   name="Revenue"   fill={C.teal}  radius={[4,4,0,0]}/>
              <Bar dataKey="collected" name="Collected" fill={C.blue}  radius={[4,4,0,0]}/>
              <Bar dataKey="pending"   name="Pending"   fill={C.red}   radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SHead title="Payment Status"/>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,value})=>`${name}: ${value}`} labelLine={false} fontSize={10}>
                {pieData.map((d,i)=><Cell key={i} fill={d.color}/>)}
              </Pie>
              <Tooltip {...TT}/>
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Farmer-wise */}
      <Card style={{marginBottom:16}}>
        <SHead title="Farmer-wise Sales"/>
        <Tbl heads={["Farmer","Invoices","Total Qty","Revenue","Avg per Invoice"]}>
          {farmerData.map((f,i)=>(
            <TR key={i}>
              <TD bold>{f.name}</TD>
              <TD>{f.count}</TD>
              <TD>{(f.qty/1000).toFixed(0)}K PL</TD>
              <TD bold color={C.teal}>{fmt(f.revenue)}</TD>
              <TD>{fmt(Math.round(f.revenue/f.count))}</TD>
            </TR>
          ))}
        </Tbl>
      </Card>

      {/* Invoice table */}
      <Card>
        <SHead title={`Sales Transactions (${filtered.length})`}/>
        <Tbl heads={["Invoice","Date","Farmer","Qty","PL Stage","Price/K","Total","Paid","Balance","Status","Method"]}>
          {filtered.map(s=>{
            const f=farmers?.find(f=>f.id===s.fId);
            return(
              <TR key={s.id}>
                <TD bold color={C.blue}>{s.inv}</TD>
                <TD small>{s.date}</TD>
                <TD>{f?.name||"—"}</TD>
                <TD>{(s.qty/1000).toFixed(0)}K</TD>
                <TD>{s.pl}</TD>
                <TD>{fmt(s.p1k)}</TD>
                <TD bold>{fmt(s.total)}</TD>
                <TD color={C.green}>{fmt(s.paid)}</TD>
                <TD color={s.bal>0?C.red:C.sub}>{fmt(s.bal)}</TD>
                <TD><Badge label={s.status} color={s.status==="paid"?C.green:s.status==="partial"?C.amber:C.red}/></TD>
                <TD small color={C.sub}>{s.method}</TD>
              </TR>
            );
          })}
        </Tbl>
      </Card>
    </div>
  );
}
