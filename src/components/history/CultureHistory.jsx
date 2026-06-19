
import {useState} from "react";
import {useApp} from "../../context/AppContext.jsx";
import {C,KPI,Card,SHead,Badge,Tbl,TR,TD,FRow,FSelect,inp} from "../common/ui.jsx";
export default function CultureHistory(){
  const {batches,tanks,sheds}=useApp();
  const [fShed,setFShed]=useState("all");
  const [fTank,setFTank]=useState("all");
  const [search,setSearch]=useState("");
  const hist=batches.filter(b=>b.status==="harvested");
  const filtTanks=tanks.filter(t=>fShed==="all"||t.shedId===+fShed);
  const list=hist.filter(b=>{
    const t=tanks.find(x=>x.id===b.tId);
    if(fShed!=="all"&&t?.shedId!==+fShed)return false;
    if(fTank!=="all"&&b.tId!==+fTank)return false;
    if(search&&!b.no.toLowerCase().includes(search.toLowerCase())&&!b.hatch?.toLowerCase().includes(search.toLowerCase()))return false;
    return true;
  });
  const totalBatches=hist.length;
  const avgSR=(hist.reduce((s,b)=>s+b.sr,0)/hist.length||0).toFixed(1);
  const avgFCR=(hist.reduce((s,b)=>s+(b.fcr||0),0)/hist.length||0).toFixed(2);
  const totalRev=hist.reduce((s,b)=>s+(b.saleAmt||0),0);
  return(
    <div style={{padding:"20px 24px"}}>
      <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        <KPI label="Total Batches Completed" value={totalBatches}                               sub="harvested"        color={C.teal}   icon="📜"/>
        <KPI label="Avg Survival Rate"       value={avgSR+"%"}                                  sub="across all"       color={C.green}  icon="📈"/>
        <KPI label="Avg FCR"                 value={avgFCR}                                     sub="feed conversion"  color={C.blue}   icon="📊"/>
        <KPI label="Total Revenue"           value={"₹"+(totalRev/100000).toFixed(2)+"L"}      sub="from completed"   color={C.amber}  icon="💰"/>
        <KPI label="Avg Biomass"             value={(hist.reduce((s,b)=>s+(b.bio||0),0)/hist.length||0).toFixed(1)+"kg"} sub="per batch" color={C.purple} icon="⚖️"/>
      </div>
      <FRow>
        <FSelect label="Shed:" value={fShed} onChange={v=>{setFShed(v);setFTank("all");}}>
          <option value="all">All Sheds</option>{sheds.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </FSelect>
        <FSelect label="Tank:" value={fTank} onChange={setFTank}>
          <option value="all">All Tanks</option>{filtTanks.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
        </FSelect>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search batch no or hatchery..." style={{background:C.card,border:"1px solid "+C.border,borderRadius:8,padding:"6px 12px",color:C.text,fontSize:12,width:240}}/>
      </FRow>
      <Card><SHead title={"Culture History — "+list.length+" Completed Batches"}/>
        <Tbl heads={["Batch No","Tank","Shed","PL Size","Stocked","Hatchery","Stocking Date","Harvest Date","DOC","Biomass","FCR","Feed Used","SR%","Cost","Sale Amount","Profit","Sold To"]}>
          {list.map(b=>{
            const t=tanks.find(x=>x.id===b.tId);
            const profit=(b.saleAmt||0)-(b.cost||0);
            return(<TR key={b.id}>
              <TD color={C.blue} bold small>{b.no}</TD>
              <TD color={C.teal} bold>{t?.name||"T-"+b.tId}</TD>
              <TD color={C.sub}>{t?.shed}</TD>
              <TD>{b.pl}</TD>
              <TD>{(b.cnt/1000).toFixed(0)}K</TD>
              <TD color={C.sub} small>{b.hatch}</TD>
              <TD color={C.sub} small>{b.sd}</TD>
              <TD color={C.teal} small>{b.hd||"—"}</TD>
              <TD color={C.amber} bold>D{b.doc}</TD>
              <TD color={C.amber} bold>{b.bio||"—"}kg</TD>
              <TD color={C.blue}>{b.fcr||"—"}</TD>
              <TD color={C.sub}>{b.feed||"—"}kg</TD>
              <TD color={C.green} bold>{b.sr}%</TD>
              <TD color={C.red}>₹{(b.cost||0).toLocaleString("en-IN")}</TD>
              <TD color={C.teal} bold>₹{(b.saleAmt||0).toLocaleString("en-IN")}</TD>
              <TD color={profit>0?C.green:C.red} bold>₹{profit.toLocaleString("en-IN")}</TD>
              <TD color={C.sub} small>{b.soldTo||"—"}</TD>
            </TR>);
          })}
        </Tbl>
      </Card>
    </div>
  );
}
