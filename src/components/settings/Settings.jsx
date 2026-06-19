import { useState } from "react";
import { useApp } from "../../context/AppContext.jsx";
import { C, Card, SHead, Tbl, TR, TD, Tabs, FormBox, FGrid, Field, Badge, KPI, inp, sel } from "../common/ui.jsx";

const COLORS = ["#00d4aa","#0099ff","#f59e0b","#ef4444","#a78bfa","#22c55e","#fb923c","#38bdf8"];

function ColorPicker({ value, onChange }) {
  return (
    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:4 }}>
      {COLORS.map(c => (
        <div key={c} onClick={() => onChange(c)}
          style={{ width:24, height:24, borderRadius:"50%", background:c, cursor:"pointer",
            border: value===c ? "3px solid #fff" : "3px solid transparent",
            boxShadow: value===c ? "0 0 0 2px "+c : "none", transition:"all .15s" }}/>
      ))}
    </div>
  );
}

function ShedsTab() {
  const { sheds, tanks, addShed, updateShed, delShed } = useApp();
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const blank = { name:"", type:"culture", shape:"circle", color:"#00d4aa", desc:"" };
  const [form, setForm] = useState(blank);
  const f = (k,v) => setForm(p => ({...p,[k]:v}));

  const openAdd  = () => { setEditing(null); setForm(blank); setShow(true); };
  const openEdit = s  => { setEditing(s.id); setForm({ name:s.name, type:s.type, shape:s.shape, color:s.color, desc:s.desc||"" }); setShow(true); };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) await updateShed(editing, form);
      else await addShed(form);
      setShow(false); setForm(blank); setEditing(null);
    } catch(e) { alert("Error: "+e.message); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    const tankCount = tanks.filter(t => t.shedId === id).length;
    if (tankCount > 0) { alert(`Cannot delete — this shed has ${tankCount} tank(s). Delete tanks first.`); return; }
    if (!confirm("Delete this shed?")) return;
    try { await delShed(id); } catch(e) { alert("Error: "+e.message); }
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <span style={{ color:C.sub, fontSize:12 }}>{sheds.length} shed{sheds.length!==1?"s":""} configured</span>
        <button onClick={openAdd} style={{ background:"linear-gradient(135deg,#00d4aa,#0099ff)", color:"#000", fontWeight:700, fontSize:13, padding:"8px 18px", borderRadius:10, border:"none", cursor:"pointer" }}>+ Add Shed</button>
      </div>

      {show && (
        <FormBox title={editing ? "✏️ Edit Shed" : "🏗️ Add Shed"} onClose={() => { setShow(false); setEditing(null); }} onSave={save}>
          <FGrid cols={3}>
            <Field label="Shed Name *"><input style={inp} value={form.name} onChange={e=>f("name",e.target.value)} placeholder="Shed A"/></Field>
            <Field label="Type">
              <select style={sel} value={form.type} onChange={e=>f("type",e.target.value)}>
                <option value="culture">Culture</option>
                <option value="treatment">Treatment</option>
              </select>
            </Field>
            <Field label="Tank Shape">
              <select style={sel} value={form.shape} onChange={e=>f("shape",e.target.value)}>
                <option value="circle">Circle (Round tanks)</option>
                <option value="rectangle">Rectangle (Square tanks)</option>
              </select>
            </Field>
            <Field label="Description"><input style={inp} value={form.desc} onChange={e=>f("desc",e.target.value)} placeholder="Optional description"/></Field>
            <Field label="Color (for map)"><ColorPicker value={form.color} onChange={v=>f("color",v)}/></Field>
          </FGrid>
          {saving && <div style={{ color:C.teal, fontSize:12, marginTop:8 }}>Saving…</div>}
        </FormBox>
      )}

      <Card>
        <Tbl heads={["Shed Name","Type","Shape","Color","Tanks","Description","Actions"]}>
          {sheds.length === 0 && (
            <TR><TD colSpan={7} style={{ textAlign:"center", padding:30, color:C.sub }}>No sheds yet. Add your first shed above.</TD></TR>
          )}
          {sheds.map(s => {
            const tCount = tanks.filter(t => t.shedId === s.id).length;
            return (
              <TR key={s.id}>
                <TD color={C.text} bold>{s.name}</TD>
                <TD><Badge label={s.type} color={s.type==="culture"?C.teal:C.purple}/></TD>
                <TD color={C.sub}>{s.shape}</TD>
                <TD><span style={{ display:"inline-block", width:16, height:16, borderRadius:"50%", background:s.color, verticalAlign:"middle" }}/></TD>
                <TD color={C.blue} bold>{tCount}</TD>
                <TD color={C.sub} small>{s.desc||"—"}</TD>
                <TD>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={()=>openEdit(s)} style={{ background:C.blue+"20", color:C.blue, border:"none", borderRadius:6, padding:"4px 10px", fontSize:11, cursor:"pointer", fontWeight:600 }}>Edit</button>
                    <button onClick={()=>del(s.id)}   style={{ background:C.red+"20",  color:C.red,  border:"none", borderRadius:6, padding:"4px 10px", fontSize:11, cursor:"pointer", fontWeight:600 }}>Delete</button>
                  </div>
                </TD>
              </TR>
            );
          })}
        </Tbl>
      </Card>
    </div>
  );
}

function TanksTab() {
  const { sheds, tanks, addTank, updateTank, delTank } = useApp();
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fShed, setFShed] = useState("all");
  const blank = { shedId:"", name:"", shape:"circle", type:"culture", status:"empty", lengthFt:"", widthFt:"", depthFt:"" };
  const [form, setForm] = useState(blank);
  const f = (k,v) => setForm(p => ({...p,[k]:v}));

  const openAdd  = () => { setEditing(null); setForm(blank); setShow(true); };
  const openEdit = t  => { setEditing(t.id); setForm({ shedId:String(t.shedId), name:t.name, shape:t.shape, type:t.type, status:t.status, lengthFt:t.lengthFt||"", widthFt:t.widthFt||"", depthFt:t.depthFt||"" }); setShow(true); };

  // Volume preview
  const previewVol = (() => {
    const l = +form.lengthFt, w = +form.widthFt||l, d = +form.depthFt;
    if (!l || !d) return null;
    const cf = form.shape === "circle" ? Math.PI * Math.pow(l/2,2) * d : l * w * d;
    const vl = Math.round(cf * 28.317);
    const rec = { lo: Math.round(vl*100), hi: Math.round(vl*200) };
    return { vl, rec };
  })();

  const selectShed = (shedId) => {
    const shed = sheds.find(s => s.id === +shedId);
    setForm(p => ({ ...p, shedId, shape: shed?.shape || p.shape, type: shed?.type || p.type }));
  };

  const save = async () => {
    if (!form.name.trim() || !form.shedId) return;
    setSaving(true);
    try {
      if (editing) await updateTank(editing, { ...form, shedId:+form.shedId });
      else await addTank({ ...form, shedId:+form.shedId });
      setShow(false); setForm(blank); setEditing(null);
    } catch(e) { alert("Error: "+e.message); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm("Delete this tank? This will also remove any linked batches.")) return;
    try { await delTank(id); } catch(e) { alert("Error: "+e.message); }
  };

  const filtTanks = tanks.filter(t => fShed==="all" || t.shedId===+fShed);

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ color:C.sub, fontSize:12 }}>{tanks.length} tank{tanks.length!==1?"s":""} total</span>
          <select style={{ ...sel, width:"auto", padding:"5px 10px", fontSize:12 }} value={fShed} onChange={e=>setFShed(e.target.value)}>
            <option value="all">All Sheds</option>
            {sheds.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <button onClick={openAdd} style={{ background:"linear-gradient(135deg,#00d4aa,#0099ff)", color:"#000", fontWeight:700, fontSize:13, padding:"8px 18px", borderRadius:10, border:"none", cursor:"pointer" }}>+ Add Tank</button>
      </div>

      {show && (
        <FormBox title={editing ? "✏️ Edit Tank" : "🪣 Add Tank"} onClose={() => { setShow(false); setEditing(null); }} onSave={save}>
          <FGrid cols={3}>
            <Field label="Shed *">
              <select style={sel} value={form.shedId} onChange={e=>selectShed(e.target.value)}>
                <option value="">— Select Shed —</option>
                {sheds.map(s=><option key={s.id} value={s.id}>{s.name} ({s.shape})</option>)}
              </select>
            </Field>
            <Field label="Tank Name *"><input style={inp} value={form.name} onChange={e=>f("name",e.target.value)} placeholder="T-01"/></Field>
            <Field label="Type">
              <select style={sel} value={form.type} onChange={e=>f("type",e.target.value)}>
                <option value="culture">Culture</option>
                <option value="treatment">Treatment</option>
              </select>
            </Field>
            <Field label="Shape">
              <select style={sel} value={form.shape} onChange={e=>f("shape",e.target.value)}>
                <option value="circle">Circle</option>
                <option value="rectangle">Rectangle</option>
              </select>
            </Field>
            <Field label="Status">
              <select style={sel} value={form.status} onChange={e=>f("status",e.target.value)}>
                <option value="empty">Empty</option>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </Field>
            {form.shedId && (()=>{
              const shed = sheds.find(s=>s.id===+form.shedId);
              return shed ? (
                <div style={{ gridColumn:"1/-1", padding:"8px 12px", background:shed.color+"12", borderRadius:8, border:"1px solid "+shed.color+"30", fontSize:11, color:C.sub }}>
                  Selected shed: <b style={{color:shed.color}}>{shed.name}</b> — {shed.type} shed. Shape auto-filled.
                </div>
              ) : null;
            })()}
          </FGrid>

          {/* Dimensions */}
          <div style={{ marginTop:12, padding:"12px 14px", background:C.blue+"10", borderRadius:8, border:"1px solid "+C.blue+"20" }}>
            <div style={{ color:C.blue, fontSize:11, fontWeight:700, marginBottom:10 }}>📐 Tank Dimensions (for stocking density calculation)</div>
            <FGrid cols={4}>
              {form.shape === "circle"
                ? <Field label="Diameter (ft) *"><input style={inp} type="number" value={form.lengthFt} onChange={e=>f("lengthFt",e.target.value)} placeholder="36"/></Field>
                : <>
                    <Field label="Length (ft) *"><input style={inp} type="number" value={form.lengthFt} onChange={e=>f("lengthFt",e.target.value)} placeholder="36"/></Field>
                    <Field label="Width (ft) *"><input style={inp} type="number" value={form.widthFt} onChange={e=>f("widthFt",e.target.value)} placeholder="36"/></Field>
                  </>
              }
              <Field label="Depth / Height (ft) *"><input style={inp} type="number" value={form.depthFt} onChange={e=>f("depthFt",e.target.value)} placeholder="4"/></Field>
              <Field label="Volume (auto)">
                <input style={{ ...inp, background:C.card2, color:C.teal, fontWeight:700 }} readOnly
                  value={previewVol ? previewVol.vl.toLocaleString("en-IN") + " L" : "— Enter dimensions"} />
              </Field>
            </FGrid>
            {previewVol && (
              <div style={{ marginTop:10, display:"flex", gap:20, flexWrap:"wrap" }}>
                <span style={{ color:C.sub, fontSize:11 }}>Recommended stocking: <b style={{color:C.teal}}>{(previewVol.rec.lo/1000000).toFixed(1)}M – {(previewVol.rec.hi/1000000).toFixed(1)}M PLs</b></span>
                <span style={{ color:C.sub, fontSize:11 }}>Density range: <b style={{color:C.teal}}>100 – 200 PLs/litre</b></span>
              </div>
            )}
          </div>
          {saving && <div style={{ color:C.teal, fontSize:12, marginTop:8 }}>Saving…</div>}
        </FormBox>
      )}

      <Card>
        <Tbl heads={["Tank Name","Shed","Type","Shape","Dimensions (ft)","Volume","Stocking Range","Status","Actions"]}>
          {filtTanks.length === 0 && (
            <TR><TD colSpan={9} style={{ textAlign:"center", padding:30, color:C.sub }}>{tanks.length===0?"No tanks yet. Add sheds first, then add tanks.":"No tanks in this shed."}</TD></TR>
          )}
          {filtTanks.map(t => {
            const shed = sheds.find(s=>s.id===t.shedId);
            const stColor = t.status==="active"?C.teal:t.status==="maintenance"?C.red:C.sub;
            return (
              <TR key={t.id}>
                <TD color={C.blue} bold>{t.name}</TD>
                <TD color={C.sub}>{shed?.name||"—"}</TD>
                <TD><Badge label={t.type} color={t.type==="culture"?C.teal:C.purple}/></TD>
                <TD color={C.sub}>{t.shape}</TD>
                <TD color={C.sub} small>{t.lengthFt?`${t.shape==="circle"?`Ø${t.lengthFt}`:`${t.lengthFt}×${t.widthFt}`}×${t.depthFt}`:"—"}</TD>
                <TD color={t.volumeL>0?C.teal:C.sub} bold>{t.volumeL>0?(t.volumeL/1000).toFixed(0)+"KL":"—"}</TD>
                <TD color={C.sub} small>{t.volumeL>0?`${(t.volumeL*100/1000000).toFixed(1)}M–${(t.volumeL*200/1000000).toFixed(1)}M PLs`:"—"}</TD>
                <TD><Badge label={t.status} color={stColor}/></TD>
                <TD>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={()=>openEdit(t)} style={{ background:C.blue+"20", color:C.blue, border:"none", borderRadius:6, padding:"4px 10px", fontSize:11, cursor:"pointer", fontWeight:600 }}>Edit</button>
                    <button onClick={()=>del(t.id)}   style={{ background:C.red+"20",  color:C.red,  border:"none", borderRadius:6, padding:"4px 10px", fontSize:11, cursor:"pointer", fontWeight:600 }}>Delete</button>
                  </div>
                </TD>
              </TR>
            );
          })}
        </Tbl>
      </Card>
    </div>
  );
}

const genPass = () => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({length:8}, ()=>chars[Math.floor(Math.random()*chars.length)]).join("");
};

const ROLE_LABELS = { nursery_tech:"Nursery Tech", field_tech:"Field Tech", farmer:"Farmer", manager:"Manager" };
const ROLE_COLORS = { nursery_tech:C.teal, field_tech:C.blue, farmer:"#f59e0b", manager:"#a78bfa" };

function UsersTab() {
  const { userProfiles, addUserProfile, updateUserProfile, delUserProfile, farmers } = useApp();
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const [visPass, setVisPass] = useState({});
  const blank = { name:"", email:"", role:"nursery_tech", phone:"", tempPass:"", status:"active", farmerId:null, assignedTanks:[] };
  const [form, setForm] = useState(blank);
  const f = (k,v) => setForm(p => ({...p,[k]:v}));

  const openAdd  = () => { setEditing(null); setForm(blank); setShow(true); };
  const openEdit = u  => { setEditing(u.id); setForm({ name:u.name, email:u.email, role:u.role, phone:u.phone, tempPass:u.tempPass, status:u.status, farmerId:u.farmerId, assignedTanks:u.assignedTanks }); setShow(true); };

  const save = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    setSaving(true);
    try {
      if (editing) await updateUserProfile(editing, form);
      else await addUserProfile(form);
      setShow(false); setForm(blank); setEditing(null);
    } catch(e) { alert("Error: "+e.message); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm("Delete this user?")) return;
    try { await delUserProfile(id); } catch(e) { alert("Error: "+e.message); }
  };

  const total = userProfiles.length;
  const nurseryTechs = userProfiles.filter(u=>u.role==="nursery_tech").length;
  const fieldTechs   = userProfiles.filter(u=>u.role==="field_tech").length;
  const farmersCount = userProfiles.filter(u=>u.role==="farmer").length;

  const sqlText = `CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'nursery_tech',
  phone TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  temp_password TEXT DEFAULT '',
  farmer_id INTEGER REFERENCES farmers(id),
  assigned_tanks INTEGER[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);`;

  return (
    <div>
      {/* Info box */}
      <div style={{ background:"#f59e0b18", border:"1px solid #f59e0b40", borderRadius:10, padding:"10px 16px", marginBottom:16, color:"#f59e0b", fontSize:13 }}>
        ⚠️ After creating a user, share their email and temporary password. For the mobile app, they will log in using these credentials.
      </div>

      {/* KPI row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
        <KPI label="Total Users"    value={total}        color={C.blue}/>
        <KPI label="Nursery Techs"  value={nurseryTechs} color={C.teal}/>
        <KPI label="Field Techs"    value={fieldTechs}   color={C.blue}/>
        <KPI label="Farmers"        value={farmersCount} color="#f59e0b"/>
      </div>

      {/* Add button */}
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:14 }}>
        <button onClick={openAdd} style={{ background:"linear-gradient(135deg,#00d4aa,#0099ff)", color:"#000", fontWeight:700, fontSize:13, padding:"8px 18px", borderRadius:10, border:"none", cursor:"pointer" }}>+ Add User</button>
      </div>

      {/* Form */}
      {show && (
        <FormBox title={editing ? "✏️ Edit User" : "👤 Add User"} onClose={() => { setShow(false); setEditing(null); }} onSave={save}>
          <FGrid cols={3}>
            <Field label="Full Name *"><input style={inp} value={form.name} onChange={e=>f("name",e.target.value)} placeholder="Jane Doe"/></Field>
            <Field label="Email *"><input style={inp} type="email" value={form.email} onChange={e=>f("email",e.target.value)} placeholder="jane@example.com"/></Field>
            <Field label="Role">
              <select style={sel} value={form.role} onChange={e=>f("role",e.target.value)}>
                <option value="nursery_tech">Nursery Technician</option>
                <option value="field_tech">Field Technician</option>
                <option value="farmer">Farmer</option>
                <option value="manager">Manager</option>
              </select>
            </Field>
            <Field label="Phone"><input style={inp} value={form.phone} onChange={e=>f("phone",e.target.value)} placeholder="+91 99999 00000"/></Field>
            <Field label="Temporary Password">
              <div style={{ display:"flex", gap:6 }}>
                <input style={{ ...inp, flex:1 }} value={form.tempPass} onChange={e=>f("tempPass",e.target.value)} placeholder="Auto-generate or type"/>
                <button type="button" onClick={()=>f("tempPass",genPass())} style={{ background:C.teal+"20", color:C.teal, border:"1px solid "+C.teal+"40", borderRadius:8, padding:"4px 10px", fontSize:11, cursor:"pointer", fontWeight:600, whiteSpace:"nowrap" }}>Generate</button>
              </div>
            </Field>
            <Field label="Status">
              <select style={sel} value={form.status} onChange={e=>f("status",e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
            {form.role === "farmer" && (
              <Field label="Link to Farmer (optional)">
                <select style={sel} value={form.farmerId||""} onChange={e=>f("farmerId",e.target.value?+e.target.value:null)}>
                  <option value="">— None —</option>
                  {farmers.map(fr=><option key={fr.id} value={fr.id}>{fr.name}</option>)}
                </select>
              </Field>
            )}
            {(form.role === "nursery_tech" || form.role === "field_tech") && (
              <div style={{ gridColumn:"1/-1", padding:"8px 12px", background:C.blue+"10", borderRadius:8, border:"1px solid "+C.blue+"30", fontSize:11, color:C.sub }}>
                ℹ️ Assign tanks after creating the user
              </div>
            )}
          </FGrid>
          {saving && <div style={{ color:C.teal, fontSize:12, marginTop:8 }}>Saving…</div>}
        </FormBox>
      )}

      {/* Table */}
      <Card>
        <Tbl heads={["Name","Email","Role","Phone","Status","Temp Password","Actions"]}>
          {userProfiles.length === 0 && (
            <TR><TD colSpan={7} style={{ textAlign:"center", padding:30, color:C.sub }}>No users yet. Add your first user above.</TD></TR>
          )}
          {userProfiles.map(u => (
            <TR key={u.id}>
              <TD color={C.text} bold>{u.name}</TD>
              <TD color={C.sub} small>{u.email}</TD>
              <TD><Badge label={ROLE_LABELS[u.role]||u.role} color={ROLE_COLORS[u.role]||C.sub}/></TD>
              <TD color={C.sub} small>{u.phone||"—"}</TD>
              <TD><Badge label={u.status} color={u.status==="active"?C.teal:C.sub}/></TD>
              <TD>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontFamily:"monospace", fontSize:12, color:C.text }}>
                    {visPass[u.id] ? (u.tempPass||"—") : (u.tempPass ? "••••••••" : "—")}
                  </span>
                  {u.tempPass && (
                    <button onClick={()=>setVisPass(p=>({...p,[u.id]:!p[u.id]}))}
                      style={{ background:"none", border:"none", cursor:"pointer", color:C.sub, fontSize:11, padding:"2px 4px" }}>
                      {visPass[u.id] ? "Hide" : "Show"}
                    </button>
                  )}
                </div>
              </TD>
              <TD>
                <div style={{ display:"flex", gap:6 }}>
                  <button onClick={()=>openEdit(u)} style={{ background:C.blue+"20", color:C.blue, border:"none", borderRadius:6, padding:"4px 10px", fontSize:11, cursor:"pointer", fontWeight:600 }}>Edit</button>
                  <button onClick={()=>del(u.id)}   style={{ background:"#ef444420",  color:"#ef4444",  border:"none", borderRadius:6, padding:"4px 10px", fontSize:11, cursor:"pointer", fontWeight:600 }}>Delete</button>
                </div>
              </TD>
            </TR>
          ))}
        </Tbl>
      </Card>

      {/* SQL setup box */}
      <div style={{ marginTop:20 }}>
        <button onClick={()=>setShowSql(p=>!p)} style={{ background:"none", border:"1px solid "+C.sub+"40", color:C.sub, borderRadius:8, padding:"6px 14px", fontSize:12, cursor:"pointer" }}>
          {showSql ? "▲ Hide" : "▼ Show"} SQL Setup
        </button>
        {showSql && (
          <div style={{ marginTop:10, background:"#0a0a0a", border:"1px solid #333", borderRadius:10, padding:16 }}>
            <div style={{ color:C.sub, fontSize:11, marginBottom:8 }}>Run this SQL in your Supabase SQL editor to create the user_profiles table:</div>
            <pre style={{ margin:0, color:"#00d4aa", fontSize:12, fontFamily:"monospace", whiteSpace:"pre-wrap", wordBreak:"break-word" }}>{sqlText}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Settings() {
  const [tab, setTab] = useState("sheds");
  return (
    <div style={{ padding:"20px 24px" }}>
      <div style={{ marginBottom:20 }}>
        <h2 style={{ color:C.text, fontSize:18, fontWeight:700, margin:"0 0 4px" }}>⚙️ Settings</h2>
        <p style={{ color:C.sub, fontSize:12, margin:0 }}>Configure your nursery infrastructure — sheds and tanks must be set up before stocking</p>
      </div>
      <div style={{ marginBottom:16 }}>
        <Tabs
          tabs={[
            { id:"sheds", label:"🏗️ Sheds" },
            { id:"tanks", label:"🪣 Tanks" },
            { id:"users", label:"👥 Users" },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>
      {tab === "sheds" && <ShedsTab />}
      {tab === "tanks" && <TanksTab />}
      {tab === "users" && <UsersTab />}
    </div>
  );
}
