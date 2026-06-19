import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { injectTenant } from "../middleware/tenant.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();
router.use(requireAuth, injectTenant);

router.get("/", async (req, res, next) => {
  try {
    const { status, client_id, type, page = 1, limit = 50, search } = req.query;
    let q = supabaseAdmin.from("projects")
      .select("*, clients(name, phone), rooms(id, room_name, status)", { count: "exact" })
      .eq("tenant_id", req.tenantId);
    if (status) q = q.eq("status", status);
    if (client_id) q = q.eq("client_id", client_id);
    if (type) q = q.eq("project_type", type);
    if (search) q = q.ilike("name", `%${search}%`);
    q = q.order("created_at", { ascending: false }).range((page-1)*limit, page*limit-1);
    const { data, count, error } = await q;
    if (error) throw new AppError(error.message);
    res.json({ data, total: count });
  } catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from("projects")
      .select("*, clients(*), rooms(*, units(id), cut_list_revisions(id, status, revision_number))")
      .eq("id", req.params.id).eq("tenant_id", req.tenantId).single();
    if (error) throw new AppError("Project not found", 404);
    res.json(data);
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, client_id, project_type, status, site_address, start_date, expected_completion, notes, assigned_manager } = req.body;
    if (!name || !client_id) throw new AppError("Name and client are required");
    const { count } = await supabaseAdmin.from("projects").select("*", { count: "exact", head: true }).eq("tenant_id", req.tenantId);
    const project_code = `PRJ-${String((count || 0) + 1).padStart(4, "0")}`;
    const { data, error } = await supabaseAdmin.from("projects")
      .insert({ name, client_id, project_type: project_type || "home", status: status || "inquiry", site_address, start_date, expected_completion, notes, assigned_manager, project_code, tenant_id: req.tenantId, created_by: req.user.id })
      .select().single();
    if (error) throw new AppError(error.message);
    res.status(201).json(data);
  } catch (err) { next(err); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from("projects")
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq("id", req.params.id).eq("tenant_id", req.tenantId).select().single();
    if (error) throw new AppError(error.message);
    res.json(data);
  } catch (err) { next(err); }
});

router.post("/:id/rooms", async (req, res, next) => {
  try {
    const { room_type, room_name, notes, floor_number, area_sqft } = req.body;
    if (!room_name) throw new AppError("Room name required");
    const { count } = await supabaseAdmin.from("rooms").select("*", { count: "exact", head: true }).eq("project_id", req.params.id);
    const { data, error } = await supabaseAdmin.from("rooms")
      .insert({ room_type, room_name, notes, floor_number, area_sqft, project_id: req.params.id, tenant_id: req.tenantId, sort_order: count || 0 })
      .select().single();
    if (error) throw new AppError(error.message);
    res.status(201).json(data);
  } catch (err) { next(err); }
});

router.get("/:id/rooms", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from("rooms")
      .select("*, units(*), cut_list_revisions(id, revision_number, status)")
      .eq("project_id", req.params.id).eq("tenant_id", req.tenantId).order("sort_order");
    if (error) throw new AppError(error.message);
    res.json(data);
  } catch (err) { next(err); }
});

export default router;
