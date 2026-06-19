import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { injectTenant } from "../middleware/tenant.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();
router.use(requireAuth, injectTenant);

router.get("/machines", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from("machines").select("*").eq("tenant_id", req.tenantId).eq("is_active", true).order("name");
    if (error) throw new AppError(error.message);
    res.json(data);
  } catch (err) { next(err); }
});

router.post("/machines", async (req, res, next) => {
  try {
    const { name, machine_code, type, brand, model, serial_number, purchase_date, purchase_cost, location, service_interval_days } = req.body;
    if (!name) throw new AppError("Machine name required");
    const { data, error } = await supabaseAdmin.from("machines")
      .insert({ name, machine_code, type, brand, model, serial_number, purchase_date, purchase_cost, location, service_interval_days: service_interval_days || 90, tenant_id: req.tenantId })
      .select().single();
    if (error) throw new AppError(error.message);
    res.status(201).json(data);
  } catch (err) { next(err); }
});

router.patch("/machines/:id", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from("machines")
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq("id", req.params.id).eq("tenant_id", req.tenantId).select().single();
    if (error) throw new AppError(error.message);
    res.json(data);
  } catch (err) { next(err); }
});

router.get("/logs", async (req, res, next) => {
  try {
    const { machine_id, type } = req.query;
    let q = supabaseAdmin.from("maintenance_logs").select("*, machines(name)").eq("tenant_id", req.tenantId);
    if (machine_id) q = q.eq("machine_id", machine_id);
    if (type) q = q.eq("type", type);
    const { data, error } = await q.order("created_at", { ascending: false }).limit(100);
    if (error) throw new AppError(error.message);
    res.json(data);
  } catch (err) { next(err); }
});

router.post("/logs", async (req, res, next) => {
  try {
    const { machine_id, type, description, vendor, cost, downtime_hours, started_at, next_service_date, notes } = req.body;
    if (!machine_id || !description) throw new AppError("machine_id and description required");
    const { data, error } = await supabaseAdmin.from("maintenance_logs")
      .insert({ machine_id, type: type || "preventive", description, vendor, cost: cost || 0, downtime_hours: downtime_hours || 0, started_at, next_service_date, notes, tenant_id: req.tenantId, status: "completed", completed_at: new Date().toISOString() })
      .select().single();
    if (error) throw new AppError(error.message);
    if (next_service_date) {
      await supabaseAdmin.from("machines").update({ last_service_date: new Date().toISOString().split("T")[0], next_service_date }).eq("id", machine_id);
    }
    res.status(201).json(data);
  } catch (err) { next(err); }
});

export default router;
