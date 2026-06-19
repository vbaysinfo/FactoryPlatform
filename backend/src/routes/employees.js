import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { injectTenant } from "../middleware/tenant.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();
router.use(requireAuth, injectTenant);

router.get("/", async (req, res, next) => {
  try {
    const { role, is_active } = req.query;
    let q = supabaseAdmin.from("employees").select("*").eq("tenant_id", req.tenantId);
    if (role) q = q.eq("role", role);
    if (is_active !== undefined) q = q.eq("is_active", is_active === "true");
    const { data, error } = await q.order("name");
    if (error) throw new AppError(error.message);
    res.json(data);
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, employee_code, phone, email, role, department, date_of_joining, salary_type, basic_salary, address, emergency_contact, skills } = req.body;
    if (!name) throw new AppError("Name required");
    const { count } = await supabaseAdmin.from("employees").select("*", { count: "exact", head: true }).eq("tenant_id", req.tenantId);
    const code = employee_code || `EMP-${String((count || 0) + 1).padStart(3, "0")}`;
    const { data, error } = await supabaseAdmin.from("employees")
      .insert({ name, employee_code: code, phone, email, role, department, date_of_joining, salary_type, basic_salary, address, emergency_contact, skills, tenant_id: req.tenantId })
      .select().single();
    if (error) throw new AppError(error.message);
    res.status(201).json(data);
  } catch (err) { next(err); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from("employees")
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq("id", req.params.id).eq("tenant_id", req.tenantId).select().single();
    if (error) throw new AppError(error.message);
    res.json(data);
  } catch (err) { next(err); }
});

router.post("/:id/attendance", async (req, res, next) => {
  try {
    const { date, status, check_in, check_out, overtime_hours, notes } = req.body;
    if (!date) throw new AppError("Date required");
    const { data, error } = await supabaseAdmin.from("attendance")
      .upsert({ employee_id: req.params.id, date, status: status || "present", check_in, check_out, overtime_hours: overtime_hours || 0, notes, tenant_id: req.tenantId }, { onConflict: "employee_id,date" })
      .select().single();
    if (error) throw new AppError(error.message);
    res.json(data);
  } catch (err) { next(err); }
});

router.get("/:id/attendance", async (req, res, next) => {
  try {
    const { from_date, to_date } = req.query;
    let q = supabaseAdmin.from("attendance").select("*").eq("employee_id", req.params.id).eq("tenant_id", req.tenantId);
    if (from_date) q = q.gte("date", from_date);
    if (to_date) q = q.lte("date", to_date);
    const { data, error } = await q.order("date", { ascending: false });
    if (error) throw new AppError(error.message);
    res.json(data);
  } catch (err) { next(err); }
});

export default router;
