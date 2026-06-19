
export const C={
  bg:"#060e1f",card:"#0c1a2e",card2:"#0f2040",
  border:"rgba(255,255,255,0.07)",
  teal:"#00d4aa",blue:"#0099ff",purple:"#a855f7",
  amber:"#f59e0b",red:"#ef4444",green:"#22c55e",
  text:"#e2e8f0",sub:"#64748b",dim:"#1e3a5f",
};
export const inp={width:"100%",background:"#071428",border:"1px solid rgba(255,255,255,0.07)",borderRadius:8,padding:"8px 12px",color:"#e2e8f0",fontSize:13,boxSizing:"border-box"};
export const sel={...inp};
export function Btn({children,onClick,color="teal",style={}}){
  const bg=color==="teal"?"linear-gradient(135deg,#00d4aa,#0099ff)":color==="red"?"#ef444430":color;
  const fc=color==="teal"?"#000":color==="red"?"#ef4444":"#fff";
  return <button onClick={onClick} style={{background:bg,color:fc,border:"none",borderRadius:9,padding:"8px 20px",fontWeight:700,fontSize:13,cursor:"pointer",...style}}>{children}</button>;
}
export function KPI({label,value,sub,color=C.teal,icon}){
  return(
    <div style={{background:C.card,borderRadius:14,padding:"18px 20px",flex:1,minWidth:130,border:`1px solid ${color}30`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <p style={{color:C.sub,fontSize:10,margin:"0 0 5px",textTransform:"uppercase",letterSpacing:.8}}>{label}</p>
          <p style={{color:C.text,fontSize:24,fontWeight:700,margin:0,lineHeight:1}}>{value}</p>
          {sub&&<p style={{color,fontSize:11,margin:"5px 0 0",fontWeight:500}}>{sub}</p>}
        </div>
        {icon&&<span style={{fontSize:24,opacity:.8}}>{icon}</span>}
      </div>
    </div>
  );
}
export function Badge({label,color=C.teal}){
  return <span style={{background:`${color}20`,color,fontSize:10,padding:"2px 9px",borderRadius:99,fontWeight:600,whiteSpace:"nowrap"}}>{label}</span>;
}
export function Card({children,accent,style={}}){
  return <div style={{background:C.card,borderRadius:14,padding:"20px 22px",border:`1px solid ${accent?accent+"30":C.border}`,...style}}>{children}</div>;
}
export function SHead({title,action}){
  return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <h3 style={{color:C.text,fontSize:14,fontWeight:700,margin:0}}>{title}</h3>
      {action}
    </div>
  );
}
export function Tabs({tabs,active,onChange}){
  return(
    <div style={{display:"flex",gap:6,marginBottom:16}}>
      {tabs.map(t=>(
        <button key={t.id} onClick={()=>onChange(t.id)} style={{padding:"7px 16px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:active===t.id?C.teal:"rgba(255,255,255,0.06)",color:active===t.id?"#000":C.sub}}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
export function FRow({children}){return <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>{children}</div>;}
export function FSelect({label,value,onChange,children}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      {label&&<span style={{color:C.sub,fontSize:12,whiteSpace:"nowrap"}}>{label}</span>}
      <select value={value} onChange={e=>onChange(e.target.value)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 12px",color:C.text,fontSize:12,cursor:"pointer"}}>
        {children}
      </select>
    </div>
  );
}
export function Tbl({heads,children}){
  return(
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr>{heads.map(h=><th key={h} style={{textAlign:"left",color:C.sub,fontSize:10,fontWeight:600,padding:"0 14px 10px 0",textTransform:"uppercase",letterSpacing:.5,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
export function TR({children}){return <tr style={{borderTop:"1px solid rgba(255,255,255,0.04)"}}>{children}</tr>;}
export function TD({children,color,bold,small}){return <td style={{padding:"9px 14px 9px 0",color:color||"#e2e8f0",fontSize:small?10:12,fontWeight:bold?700:400,whiteSpace:"nowrap"}}>{children}</td>;}
export function FGrid({cols=3,children}){return <div style={{display:"grid",gridTemplateColumns:`repeat(${cols},1fr)`,gap:12}}>{children}</div>;}
export function Field({label,children}){return <div><label style={{color:"#64748b",fontSize:11,display:"block",marginBottom:4}}>{label}</label>{children}</div>;}
export function FormBox({title,onClose,onSave,children}){
  return(
    <Card accent={C.teal} style={{marginBottom:18}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h3 style={{color:C.teal,fontSize:14,fontWeight:700,margin:0}}>{title}</h3>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.06)",color:C.sub,border:"none",borderRadius:6,padding:"3px 10px",cursor:"pointer"}}>✕</button>
      </div>
      {children}
      <div style={{display:"flex",gap:10,marginTop:16}}>
        <Btn onClick={onSave}>Save</Btn>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.06)",color:C.sub,border:"none",borderRadius:8,padding:"8px 20px",cursor:"pointer"}}>Cancel</button>
      </div>
    </Card>
  );
}
export function Alert({msg,type="warn"}){
  const c=type==="danger"?"#ef4444":type==="info"?"#0099ff":"#f59e0b";
  return <div style={{background:`${c}12`,border:`1px solid ${c}40`,borderRadius:10,padding:"10px 16px",marginBottom:12,color:c,fontSize:12,fontWeight:600}}>{msg}</div>;
}
const TT={contentStyle:{background:"#0a1628",border:"1px solid #1e3a5f",borderRadius:8,color:"#e2e8f0",fontSize:11}};
export {TT};
