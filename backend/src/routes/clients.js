import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { injectTenant } from "../middleware/tenant.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();
router.use(requireAuth, injectTenant);

// GET /api/clients
router.get("/", async (req, res, next) => {
  try {
    const { search, is_active, page = 1, limit = 50 } = req.query;
    let q = supabaseAdmin.from("clients").select("*, projects(id)", { count: "exact" }).eq("tenant_id", req.tenantId);
    if (search) q = q.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    if (is_active !== undefined) q = q.eq("is_active", is_active === "true");
    q = q.order("created_at", { ascending: false }).range((page-1)*limit, page*limit-1);
    const { data, count, error } = await q;
    if (error) throw new AppError(error.message);
    res.json({ data, total: count });
  } catch (err) { next(err); }
});

// GET /api/clients/:id
router.get("/:id", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from("clients")
      .select("*, projects(id, name, status, created_at)")
      .eq("id", req.params.id).eq("tenant_id", req.tenantId).single();
    if (error) throw new AppError("Client not found", 404);
    res.json(data);
  } catch (err) { next(err); }
});

// POST /api/clients
router.post("/", async (req, res, next) => {
  try {
    const { name, contact_person, phone, email, address, city, state, pincode, gst_number, pan_number, notes } = req.body;
    if (!name) throw new AppError("Client name is required");
    const { data, error } = await supabaseAdmin.from("clients")
      .insert({ name, contact_person, phone, email, address, city, state, pincode, gst_number, pan_number, notes, tenant_id: req.tenantId, created_by: req.user.id })
      .select().single();
    if (error) throw new AppError(error.message);
    res.status(201).json(data);
  } catch (err) { next(err); }
});

// PATCH /api/clients/:id
router.patch("/:id", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from("clients")
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq("id", req.params.id).eq("tenant_id", req.tenantId).select().single();
    if (error) throw new AppError(error.message);
    res.json(data);
  } catch (err) { next(err); }
});

// DELETE /api/clients/:id - soft delete
router.delete("/:id", async (req, res, next) => {
  try {
    await supabaseAdmin.from("clients").update({ is_active: false }).eq("id", req.params.id).eq("tenant_id", req.tenantId);
    res.json({ message: "Client deactivated" });
  } catch (err) { next(err); }
});

export default router;
