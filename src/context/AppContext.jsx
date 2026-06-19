import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase.js";

const Ctx = createContext(null);

// ── DB row → UI shape mappers ──────────────────────────────
const mapShed      = r => ({ id:r.id, name:r.name, tankCount:r.tank_count, type:r.type, shape:r.shape, color:r.color, desc:r.description });
const mapTank = (r, sheds=[]) => {
  const shape = r.shape || "rectangle";
  const lft = r.length_ft || 0, wft = r.width_ft || 0, dft = r.depth_ft || 0;
  const cubicFt = shape === "circle"
    ? Math.PI * Math.pow(lft / 2, 2) * dft
    : lft * (wft || lft) * dft;
  const volumeL = Math.round(cubicFt * 28.317);
  return { id:r.id, shedId:r.shed_id, shed:(sheds.find(s=>s.id===r.shed_id)?.name||r.shed||"—"), name:r.name, shape, type:r.type, status:r.status, batchId:r.batch_id, lengthFt:lft, widthFt:wft, depthFt:dft, volumeL };
};
const mapBatch     = r => ({ id:r.id, tId:r.t_id, no:r.batch_no, sd:r.start_date, pl:r.pl_stage, cnt:r.count, hatch:r.hatchery, loc:r.location, c1k:r.cost_per_k, cost:r.total_cost, doc:r.doc, harvest:r.harvest_date, status:r.status, sr:r.survival_rate, bio:r.biomass, feed:r.feed_kg, fcr:r.fcr, hd:r.harvest_date_actual, soldTo:r.sold_to, saleAmt:r.sale_amount });
const mapWater     = r => ({ id:r.id, tId:r.t_id, date:r.date, shift:r.shift, temp:r.temp, sal:r.salinity, doV:r.do_value, ph:r.ph, trans:r.transparency, amm:r.ammonia, nit:r.nitrite, alk:r.alkalinity, color:r.color, notes:r.notes });
const mapFeed      = r => ({ id:r.id, tId:r.t_id, date:r.date, shift:r.shift, brand:r.brand, ftype:r.feed_type, size:r.size, qty:r.qty_g, ckg:r.cost_per_kg, cost:r.cost, bio:r.biomass, fcr:r.fcr, obs:r.observation });
const mapMed       = r => ({ id:r.id, tId:r.t_id, date:r.date, name:r.name, mtype:r.med_type, dose:r.dose, unit:r.unit, method:r.method, reason:r.reason, cost:r.cost });
const mapFarmer    = r => ({ id:r.id, name:r.name, ph:r.phone, email:r.email, village:r.village, dist:r.district, state:r.state, ponds:r.ponds, area:r.area_acres, exp:r.experience, tId:r.tank_id, buys:r.total_buys, rev:r.total_revenue });
const mapSale      = r => ({ id:r.id, bId:r.batch_id, tId:r.t_id, date:r.date, fId:r.farmer_id, qty:r.qty, pl:r.pl_stage, p1k:r.price_per_k, total:r.total, method:r.payment_method, status:r.status, paid:r.paid_amount, bal:r.balance, inv:r.invoice_no });
const mapStaff     = r => ({ id:r.id, name:r.name, empId:r.emp_id, role:r.role, dept:r.dept, ph:r.phone, email:r.email, qual:r.qualification, join:r.join_date, sal:r.salary, status:r.status, tanks:r.assigned_tanks||[], farmers:r.assigned_farmers||[] });
const mapMaint     = r => ({ id:r.id, cat:r.category, sub:r.sub_category, date:r.date, desc:r.description, cost:r.cost, vendor:r.vendor, nxt:r.next_due, status:r.status, by:r.done_by });
const mapPower     = r => ({ id:r.id, month:r.month, year:r.year, units:r.units, amt:r.amount, paid:r.paid_date, status:r.status });
const mapMonthly   = r => ({ m:r.month, rev:r.revenue, cost:r.cost, profit:r.profit });
const mapFeedInv   = r => ({ id:r.id, brand:r.brand, type:r.feed_type, kg:r.stock_kg, date:r.purchase_date, ckg:r.cost_per_kg, supplier:r.supplier, expiry:r.expiry_date, min:r.min_stock });
const mapMedInv    = r => ({ id:r.id, name:r.name, mtype:r.med_type, qty:r.quantity, unit:r.unit, cost:r.cost_per_unit, expiry:r.expiry_date, supplier:r.supplier, min:r.min_stock });
const mapTechLog   = r => ({ date:r.date, tId:r.t_id, mW:r.morning_water, aW:r.afternoon_water, nW:r.night_water, feeds:r.feed_count, meds:r.med_count, plc:r.pl_count, score:r.score });
const mapFeedStock = r => ({ id:r.id, brand:r.brand, type:r.feed_type, qty:r.qty, unit:r.unit, date:r.date, supplier:r.supplier, invoice:r.invoice_no, ckg:r.cost_per_kg, total:r.total_cost, expiry:r.expiry_date, notes:r.notes });
const mapMedStock  = r => ({ id:r.id, name:r.name, mtype:r.med_type, qty:r.qty, unit:r.unit, date:r.date, supplier:r.supplier, invoice:r.invoice_no, cunit:r.cost_per_unit, total:r.total_cost, expiry:r.expiry_date, notes:r.notes });
const mapGenInv    = r => ({ id:r.id, cat:r.category, name:r.name, qty:r.qty, unit:r.unit, date:r.date, supplier:r.supplier, cunit:r.cost_per_unit, total:r.total_cost, minStock:r.min_stock, notes:r.notes });
const mapUserProfile = r => ({ id:r.id, name:r.name, email:r.email, role:r.role, phone:r.phone||"", status:r.status||"active", tempPass:r.temp_password||"", farmerId:r.farmer_id||null, assignedTanks:r.assigned_tanks||[], createdAt:r.created_at });

export function AppProvider({ children }) {
  const [sheds,      setSheds]      = useState([]);
  const [tanks,      setTanks]      = useState([]);
  const [batches,    setBatches]    = useState([]);
  const [water,      setWater]      = useState([]);
  const [feed,       setFeed]       = useState([]);
  const [meds,       setMeds]       = useState([]);
  const [sales,      setSales]      = useState([]);
  const [farmers,    setFarmers]    = useState([]);
  const [staff,      setStaff]      = useState([]);
  const [techLogs,   setTechLogs]   = useState([]);
  const [maint,      setMaint]      = useState([]);
  const [power,      setPower]      = useState([]);
  const [monthly,    setMonthly]    = useState([]);
  const [feedInv,    setFeedInv]    = useState([]);
  const [medInv,     setMedInv]     = useState([]);
  const [feedStock,  setFeedStock]  = useState([]);
  const [medStock,   setMedStock]   = useState([]);
  const [generalInv, setGeneralInv] = useState([]);
  const [userProfiles, setUserProfiles] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [dbReady,    setDbReady]    = useState(false);
  const [page,       setPage]       = useState("dashboard");
  const [open,       setOpen]       = useState({});

  const toggleMenu = k => setOpen(p => ({ ...p, [k]: !p[k] }));

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const q = name => supabase.from(name).select("*").order("id");
      const [
        { data: sh, error: e1 },
        { data: tk, error: e2 },
        { data: bt, error: e3 },
        { data: wq, error: e4 },
        { data: fl, error: e5 },
        { data: ml, error: e6 },
        { data: fm, error: e7 },
        { data: sl, error: e8 },
        { data: st, error: e9 },
        { data: tl, error: e10 },
        { data: mn, error: e11 },
        { data: pw, error: e12 },
        { data: mo, error: e13 },
        { data: fs, error: e14 },
        { data: ms, error: e15 },
        { data: gi, error: e16 },
        { data: up, error: e17 },
      ] = await Promise.all([
        q("sheds"), q("tanks"), q("batches"), q("water_quality"),
        q("feed_logs"), q("medicine_logs"), q("farmers"), q("sales"),
        q("staff"), q("tech_logs"), q("maintenance"), q("power_bills"),
        q("monthly_summary"), q("feed_stock"), q("medicine_stock"), q("general_inventory"),
        q("user_profiles"),
      ]);

      // Log any errors but continue loading what succeeded
      [e1,e2,e3,e4,e5,e6,e7,e8,e9,e10,e11,e12,e13,e14,e15,e16,e17].forEach((e,i)=>{
        if(e) console.warn(`Table load error [${i}]:`, e.message);
      });

      const mappedSheds = (sh||[]).map(mapShed);
      setSheds(mappedSheds);
      setTanks(      (tk||[]).map(r=>mapTank(r,mappedSheds)));
      setBatches(    (bt||[]).map(mapBatch));
      setWater(      (wq||[]).map(mapWater));
      setFeed(       (fl||[]).map(mapFeed));
      setMeds(       (ml||[]).map(mapMed));
      setFarmers(    (fm||[]).map(mapFarmer));
      setSales(      (sl||[]).map(mapSale));
      setStaff(      (st||[]).map(mapStaff));
      setTechLogs(   (tl||[]).map(mapTechLog));
      setMaint(      (mn||[]).map(mapMaint));
      setPower(      (pw||[]).map(mapPower));
      setMonthly(    (mo||[]).map(mapMonthly));
      setFeedStock(  (fs||[]).map(mapFeedStock));
      setMedStock(   (ms||[]).map(mapMedStock));
      setGeneralInv( (gi||[]).map(mapGenInv));
      setUserProfiles((up||[]).map(mapUserProfile));
      setDbReady(true);
    } catch (err) {
      console.error("Supabase load error:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── CRUD: Sheds ──────────────────────────────────────────
  async function reloadSheds() {
    const { data, error } = await supabase.from("sheds").select("*").order("id");
    if (error) console.warn("sheds reload error:", error.message);
    else setSheds((data||[]).map(mapShed));
  }
  async function reloadTanks(currentSheds) {
    const { data, error } = await supabase.from("tanks").select("*").order("id");
    if (error) console.warn("tanks reload error:", error.message);
    else {
      const sh = currentSheds || sheds;
      setTanks((data||[]).map(r => mapTank(r, sh)));
    }
  }
  async function addShed(s) {
    const { error } = await supabase.from("sheds").insert({
      name:s.name, type:s.type||"culture", shape:s.shape||"circle",
      color:s.color||"#00d4aa", description:s.desc||"",
    });
    if (error) { console.error("addShed error:", error.message); throw new Error(error.message); }
    await reloadSheds();
  }
  async function updateShed(id, s) {
    const { error } = await supabase.from("sheds").update({
      name:s.name, type:s.type, shape:s.shape,
      color:s.color, description:s.desc||"",
    }).eq("id", id);
    if (error) { console.error("updateShed error:", error.message); throw new Error(error.message); }
    await reloadSheds();
  }
  async function delShed(id) {
    const { error } = await supabase.from("sheds").delete().eq("id", id);
    if (error) { console.error("delShed error:", error.message); throw new Error(error.message); }
    setSheds(p => p.filter(x => x.id !== id));
  }
  async function addTank(t) {
    const shedName = sheds.find(s=>s.id===t.shedId)?.name || "";
    const { error } = await supabase.from("tanks").insert({
      shed_id:t.shedId, shed:shedName, name:t.name,
      shape:t.shape||"circle", type:t.type||"culture", status:t.status||"empty",
      length_ft:+t.lengthFt||0, width_ft:+t.widthFt||0, depth_ft:+t.depthFt||0,
    });
    if (error) { console.error("addTank error:", error.message); throw new Error(error.message); }
    await reloadTanks();
  }
  async function updateTank(id, t) {
    const shedName = sheds.find(s=>s.id===t.shedId)?.name || "";
    const { error } = await supabase.from("tanks").update({
      shed_id:t.shedId, shed:shedName, name:t.name,
      shape:t.shape, type:t.type, status:t.status,
      length_ft:+t.lengthFt||0, width_ft:+t.widthFt||0, depth_ft:+t.depthFt||0,
    }).eq("id", id);
    if (error) { console.error("updateTank error:", error.message); throw new Error(error.message); }
    await reloadTanks();
  }
  async function delTank(id) {
    const { error } = await supabase.from("tanks").delete().eq("id", id);
    if (error) { console.error("delTank error:", error.message); throw new Error(error.message); }
    setTanks(p => p.filter(x => x.id !== id));
  }

  // ── CRUD: Batches ─────────────────────────────────────────
  async function reloadBatches() {
    const { data } = await supabase.from("batches").select("*").order("id");
    if (data) setBatches(data.map(mapBatch));
  }

  async function addBatch(b) {
    const { error } = await supabase.from("batches").insert({
      t_id:b.tId, batch_no:b.no, start_date:b.sd||null, pl_stage:b.pl,
      count:b.cnt, hatchery:b.hatch, location:b.loc,
      cost_per_k:b.c1k, total_cost:b.cost, doc:b.doc||0,
      harvest_date:b.harvest||null, status:b.status||"active",
      survival_rate:b.sr, biomass:b.bio||0, feed_kg:b.feed||0, fcr:b.fcr||0,
    });
    if (error) { console.error("addBatch error:", error.message); throw new Error(error.message); }
    await reloadBatches();
  }

  async function updateBatch(id, b) {
    const { error } = await supabase.from("batches").update({
      t_id:b.tId, batch_no:b.no, start_date:b.sd||null, pl_stage:b.pl,
      count:b.cnt, hatchery:b.hatch, location:b.loc,
      cost_per_k:b.c1k, total_cost:b.cost, doc:b.doc||0,
      harvest_date:b.harvest||null, status:b.status,
      survival_rate:b.sr, biomass:b.bio||0, feed_kg:b.feed||0, fcr:b.fcr||0,
    }).eq("id", id);
    if (error) { console.error("updateBatch error:", error.message); throw new Error(error.message); }
    await reloadBatches();
  }

  async function delBatch(id) {
    await supabase.from("batches").delete().eq("id", id);
    setBatches(p => p.filter(x => x.id !== id));
  }

  // ── CRUD helpers — insert/update then reload ─────────────
  async function upsert(table, payload, reload) {
    const { error } = await supabase.from(table).insert(payload);
    if (error) { console.error(table+" insert error:", error.message); throw new Error(error.message); }
    await reload();
  }
  async function upd(table, id, payload, reload) {
    const { error } = await supabase.from(table).update(payload).eq("id", id);
    if (error) { console.error(table+" update error:", error.message); throw new Error(error.message); }
    await reload();
  }

  // ── Reload helpers per table ──────────────────────────────
  const rl = (table, mapper, setter) => async () => {
    const { data, error } = await supabase.from(table).select("*").order("id");
    if (error) console.warn(table+" reload error:", error.message);
    else setter((data||[]).map(mapper));
  };
  const reloadWater    = rl("water_quality",    mapWater,    setWater);
  const reloadFeed     = rl("feed_logs",         mapFeed,     setFeed);
  const reloadMeds     = rl("medicine_logs",     mapMed,      setMeds);
  const reloadSales    = rl("sales",             mapSale,     setSales);
  const reloadFarmers  = rl("farmers",           mapFarmer,   setFarmers);
  const reloadStaff    = rl("staff",             mapStaff,    setStaff);
  const reloadMaint    = rl("maintenance",       mapMaint,    setMaint);
  const reloadFeedStock= rl("feed_stock",        mapFeedStock,setFeedStock);
  const reloadMedStock = rl("medicine_stock",    mapMedStock, setMedStock);
  const reloadGenInv   = rl("general_inventory", mapGenInv,   setGeneralInv);
  const reloadUserProfiles = rl("user_profiles", mapUserProfile, setUserProfiles);

  // ── CRUD: Water Quality ───────────────────────────────────
  async function addWater(w) {
    await upsert("water_quality", {
      t_id:w.tId, date:w.date||null, shift:(w.shift||"morning").toLowerCase(), temp:w.temp||null,
      salinity:w.sal||null, do_value:w.doV||null, ph:w.ph||null,
      transparency:w.trans||null, ammonia:w.amm||null, nitrite:w.nit||null,
      alkalinity:w.alk||null, color:w.color||"", notes:w.notes||"",
    }, reloadWater);
  }
  async function updateWater(id, w) {
    await upd("water_quality", id, {
      t_id:w.tId, date:w.date||null, shift:(w.shift||"morning").toLowerCase(), temp:w.temp||null,
      salinity:w.sal||null, do_value:w.doV||null, ph:w.ph||null,
      transparency:w.trans||null, ammonia:w.amm||null, nitrite:w.nit||null,
      alkalinity:w.alk||null, color:w.color||"", notes:w.notes||"",
    }, reloadWater);
  }
  async function delWater(id) {
    await supabase.from("water_quality").delete().eq("id", id);
    setWater(p => p.filter(x => x.id !== id));
  }

  // ── CRUD: Feed Logs ───────────────────────────────────────
  async function addFeed(f) {
    await upsert("feed_logs", {
      t_id:f.tId, date:f.date||null, shift:(f.shift||"morning").toLowerCase(), brand:f.brand||"",
      feed_type:f.ftype||"", size:f.size||"", qty_g:f.qty||0,
      cost_per_kg:f.ckg||0, cost:f.cost||0, biomass:f.bio||0,
      fcr:f.fcr||0, observation:f.obs||"",
    }, reloadFeed);
  }
  async function updateFeed(id, f) {
    await upd("feed_logs", id, {
      t_id:f.tId, date:f.date||null, shift:(f.shift||"morning").toLowerCase(), brand:f.brand||"",
      feed_type:f.ftype||"", size:f.size||"", qty_g:f.qty||0,
      cost_per_kg:f.ckg||0, cost:f.cost||0, biomass:f.bio||0,
      fcr:f.fcr||0, observation:f.obs||"",
    }, reloadFeed);
  }
  async function delFeed(id) {
    await supabase.from("feed_logs").delete().eq("id", id);
    setFeed(p => p.filter(x => x.id !== id));
  }

  // ── CRUD: Medicine Logs ───────────────────────────────────
  async function addMed(m) {
    await upsert("medicine_logs", {
      t_id:m.tId, date:m.date||null, name:m.name||"", med_type:m.mtype||"",
      dose:m.dose||0, unit:m.unit||"", method:m.method||"",
      reason:m.reason||"", cost:m.cost||0,
    }, reloadMeds);
  }
  async function updateMed(id, m) {
    await upd("medicine_logs", id, {
      t_id:m.tId, date:m.date||null, name:m.name||"", med_type:m.mtype||"",
      dose:m.dose||0, unit:m.unit||"", method:m.method||"",
      reason:m.reason||"", cost:m.cost||0,
    }, reloadMeds);
  }
  async function delMed(id) {
    await supabase.from("medicine_logs").delete().eq("id", id);
    setMeds(p => p.filter(x => x.id !== id));
  }

  // ── CRUD: Sales ───────────────────────────────────────────
  async function addSale(s) {
    await upsert("sales", {
      batch_id:s.bId||null, t_id:s.tId||null, date:s.date||null,
      farmer_id:s.fId||null, qty:s.qty||0, pl_stage:s.pl||"",
      price_per_k:s.p1k||0, total:s.total||0,
      payment_method:s.method||"", status:s.status||"pending",
      paid_amount:s.paid||0, balance:s.bal||0, invoice_no:s.inv||"",
    }, reloadSales);
  }
  async function updateSale(id, s) {
    await upd("sales", id, {
      batch_id:s.bId||null, t_id:s.tId||null, date:s.date||null,
      farmer_id:s.fId||null, qty:s.qty||0, pl_stage:s.pl||"",
      price_per_k:s.p1k||0, total:s.total||0,
      payment_method:s.method||"", status:s.status||"pending",
      paid_amount:s.paid||0, balance:s.bal||0, invoice_no:s.inv||"",
    }, reloadSales);
  }
  async function delSale(id) {
    await supabase.from("sales").delete().eq("id", id);
    setSales(p => p.filter(x => x.id !== id));
  }

  // ── CRUD: Farmers ─────────────────────────────────────────
  async function addFarmer(f) {
    await upsert("farmers", {
      name:f.name, phone:f.ph||"", email:f.email||"", village:f.village||"",
      district:f.dist||"", state:f.state||"AP", ponds:f.ponds||0,
      area_acres:f.area||0, experience:f.exp||0, tank_id:f.tId||null,
    }, reloadFarmers);
  }
  async function updateFarmer(id, f) {
    await upd("farmers", id, {
      name:f.name, phone:f.ph||"", email:f.email||"", village:f.village||"",
      district:f.dist||"", state:f.state||"AP", ponds:f.ponds||0,
      area_acres:f.area||0, experience:f.exp||0, tank_id:f.tId||null,
    }, reloadFarmers);
  }
  async function delFarmer(id) {
    await supabase.from("farmers").delete().eq("id", id);
    setFarmers(p => p.filter(f => f.id !== id));
  }

  // ── CRUD: Staff ───────────────────────────────────────────
  async function addStaff(s) {
    await upsert("staff", {
      name:s.name, emp_id:s.empId||"", role:s.role||"", dept:s.dept||"",
      phone:s.ph||"", email:s.email||"", qualification:s.qual||"",
      join_date:s.join||null, salary:s.sal||0, status:s.status||"active",
      assigned_tanks:s.tanks||[], assigned_farmers:s.farmers||[],
    }, reloadStaff);
  }
  async function updateStaff(id, s) {
    await upd("staff", id, {
      name:s.name, emp_id:s.empId||"", role:s.role||"", dept:s.dept||"",
      phone:s.ph||"", email:s.email||"", qualification:s.qual||"",
      join_date:s.join||null, salary:s.sal||0, status:s.status||"active",
      assigned_tanks:s.tanks||[], assigned_farmers:s.farmers||[],
    }, reloadStaff);
  }
  async function delStaff(id) {
    await supabase.from("staff").delete().eq("id", id);
    setStaff(p => p.filter(s => s.id !== id));
  }

  // ── CRUD: Maintenance ─────────────────────────────────────
  async function addMaint(m) {
    await upsert("maintenance", {
      category:m.cat||"", sub_category:m.sub||"", date:m.date||null,
      description:m.desc||"", cost:m.cost||0, vendor:m.vendor||"",
      next_due:m.nxt||null, status:m.status||"scheduled", done_by:m.by||"",
    }, reloadMaint);
  }
  async function updateMaint(id, m) {
    await upd("maintenance", id, {
      category:m.cat||"", sub_category:m.sub||"", date:m.date||null,
      description:m.desc||"", cost:m.cost||0, vendor:m.vendor||"",
      next_due:m.nxt||null, status:m.status||"scheduled", done_by:m.by||"",
    }, reloadMaint);
  }
  async function delMaint(id) {
    await supabase.from("maintenance").delete().eq("id", id);
    setMaint(p => p.filter(x => x.id !== id));
  }

  // ── CRUD: Feed Stock ──────────────────────────────────────
  async function addFeedStock(s) {
    await upsert("feed_stock", {
      brand:s.brand||"", feed_type:s.type||"", qty:s.qty||0, unit:s.unit||"kg",
      date:s.date||null, supplier:s.supplier||"", invoice_no:s.invoice||"",
      cost_per_kg:s.ckg||0, total_cost:s.total||(s.qty*s.ckg)||0,
      expiry_date:s.expiry||null, notes:s.notes||"",
    }, reloadFeedStock);
  }
  async function updateFeedStock(id, s) {
    await upd("feed_stock", id, {
      brand:s.brand||"", feed_type:s.type||"", qty:s.qty||0, unit:s.unit||"kg",
      date:s.date||null, supplier:s.supplier||"", invoice_no:s.invoice||"",
      cost_per_kg:s.ckg||0, total_cost:s.total||(s.qty*s.ckg)||0,
      expiry_date:s.expiry||null, notes:s.notes||"",
    }, reloadFeedStock);
  }
  async function delFeedStock(id) {
    await supabase.from("feed_stock").delete().eq("id", id);
    setFeedStock(p => p.filter(x => x.id !== id));
  }

  // ── CRUD: Medicine Stock ──────────────────────────────────
  async function addMedStock(s) {
    await upsert("medicine_stock", {
      name:s.name||"", med_type:s.mtype||"", qty:s.qty||0, unit:s.unit||"kg",
      date:s.date||null, supplier:s.supplier||"", invoice_no:s.invoice||"",
      cost_per_unit:s.cunit||0, total_cost:s.total||(s.qty*s.cunit)||0,
      expiry_date:s.expiry||null, notes:s.notes||"",
    }, reloadMedStock);
  }
  async function updateMedStock(id, s) {
    await upd("medicine_stock", id, {
      name:s.name||"", med_type:s.mtype||"", qty:s.qty||0, unit:s.unit||"kg",
      date:s.date||null, supplier:s.supplier||"", invoice_no:s.invoice||"",
      cost_per_unit:s.cunit||0, total_cost:s.total||(s.qty*s.cunit)||0,
      expiry_date:s.expiry||null, notes:s.notes||"",
    }, reloadMedStock);
  }
  async function delMedStock(id) {
    await supabase.from("medicine_stock").delete().eq("id", id);
    setMedStock(p => p.filter(x => x.id !== id));
  }

  // ── CRUD: General Inventory ───────────────────────────────
  async function addGeneralInv(s) {
    await upsert("general_inventory", {
      category:s.cat||"", name:s.name||"", qty:s.qty||0, unit:s.unit||"pcs",
      date:s.date||null, supplier:s.supplier||"",
      cost_per_unit:s.cunit||0, total_cost:s.total||(s.qty*s.cunit)||0,
      min_stock:s.minStock||0, notes:s.notes||"",
    }, reloadGenInv);
  }
  async function updateGeneralInv(id, s) {
    await upd("general_inventory", id, {
      category:s.cat||"", name:s.name||"", qty:s.qty||0, unit:s.unit||"pcs",
      date:s.date||null, supplier:s.supplier||"",
      cost_per_unit:s.cunit||0, total_cost:s.total||(s.qty*s.cunit)||0,
      min_stock:s.minStock||0, notes:s.notes||"",
    }, reloadGenInv);
  }
  async function delGeneralInv(id) {
    await supabase.from("general_inventory").delete().eq("id", id);
    setGeneralInv(p => p.filter(x => x.id !== id));
  }

  // ── CRUD: User Profiles ───────────────────────────────────
  async function addUserProfile(u) {
    await upsert("user_profiles", {
      name:u.name, email:u.email, role:u.role, phone:u.phone||"",
      status:u.status||"active", temp_password:u.tempPass||"",
      farmer_id:u.farmerId||null, assigned_tanks:u.assignedTanks||[],
    }, reloadUserProfiles);
  }
  async function updateUserProfile(id, u) {
    await upd("user_profiles", id, {
      name:u.name, email:u.email, role:u.role, phone:u.phone||"",
      status:u.status||"active", temp_password:u.tempPass||"",
      farmer_id:u.farmerId||null, assigned_tanks:u.assignedTanks||[],
    }, reloadUserProfiles);
  }
  async function delUserProfile(id) {
    await supabase.from("user_profiles").delete().eq("id", id);
    setUserProfiles(p => p.filter(x => x.id !== id));
  }

  return (
    <Ctx.Provider value={{
      sheds, tanks, batches, water, feed, meds, sales, farmers, staff,
      techLogs, maint, power, monthly, feedInv, medInv,
      feedStock, medStock, generalInv,
      loading, dbReady, page, setPage, open, toggleMenu,
      addBatch,    updateBatch,    delBatch,
      addWater,    updateWater,    delWater,
      addFeed,     updateFeed,     delFeed,
      addMed,      updateMed,      delMed,
      addSale,     updateSale,     delSale,
      addFarmer,   updateFarmer,   delFarmer,
      addStaff,    updateStaff,    delStaff,
      addMaint,    updateMaint,    delMaint,
      addFeedStock,    updateFeedStock,    delFeedStock,
      addMedStock,     updateMedStock,     delMedStock,
      addGeneralInv,   updateGeneralInv,   delGeneralInv,
      userProfiles, addUserProfile, updateUserProfile, delUserProfile,
      addShed, updateShed, delShed,
      addTank, updateTank, delTank,
      reload: loadAll,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useApp = () => useContext(Ctx);
