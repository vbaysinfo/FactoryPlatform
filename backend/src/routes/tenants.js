import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth, requireSuperAdmin } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();
router.use(requireAuth);

router.get("/my", (req, res) => res.json(req.tenant));

router.patch("/my", async (req, res, next) => {
  try {
    const allowed = ["factory_name","owner_name","owner_phone","address","gst_number","logo_url"];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const { data, error } = await supabaseAdmin.from("tenants").update(updates).eq("id", req.tenant.id).select().single();
    if (error) throw new AppError(error.message);
    res.json(data);
  } catch (err) { next(err); }
});

router.get("/", requireSuperAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, plan, search } = req.query;
    let q = supabaseAdmin.from("tenants").select("*", { count: "exact" });
    if (status) q = q.eq("subscription_status", status);
    if (plan) q = q.eq("plan", plan);
    if (search) q = q.ilike("factory_name", `%${search}%`);
    q = q.order("created_at", { ascending: false }).range((page-1)*limit, page*limit-1);
    const { data, count, error } = await q;
    if (error) throw new AppError(error.message);
    res.json({ data, total: count, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
});

router.get("/:id", requireSuperAdmin, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from("tenants").select("*, users(id,name,email,role,is_active)").eq("id", req.params.id).single();
    if (error) throw new AppError("Tenant not found", 404);
    res.json(data);
  } catch (err) { next(err); }
});

router.patch("/:id", requireSuperAdmin, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from("tenants").update(req.body).eq("id", req.params.id).select().single();
    if (error) throw new AppError(error.message);
    res.json(data);
  } catch (err) { next(err); }
});

export default router;
