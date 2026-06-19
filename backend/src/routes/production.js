import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { injectTenant } from "../middleware/tenant.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();
router.use(requireAuth, injectTenant);

const DEFAULT_STAGES = [
  { stage_name: "Design Approval", stage_code: "design_approval", sort_order: 0 },
  { stage_name: "Pressing", stage_code: "pressing", sort_order: 1 },
  { stage_name: "Cutting", stage_code: "cutting", sort_order: 2 },
  { stage_name: "Edge Binding", stage_code: "edge_binding", sort_order: 3 },
  { stage_name: "Drilling/Boring", stage_code: "drilling", sort_order: 4 },
  { stage_name: "Assembly/Fitting", stage_code: "assembly", sort_order: 5 },
  { stage_name: "QC Check", stage_code: "qc_check", sort_order: 6 },
  { stage_name: "Packing", stage_code: "packing", sort_order: 7 },
];

router.get("/stages", async (req, res, next) => {
  try {
    let { data } = await supabaseAdmin.from("production_stages_config")
      .select("*").eq("tenant_id", req.tenantId).eq("is_active", true).order("sort_order");
    if (!data?.length) {
      const { data: inserted } = await supabaseAdmin.from("production_stages_config")
        .insert(DEFAULT_STAGES.map(s => ({ ...s, tenant_id: req.tenantId }))).select();
      data = inserted;
    }
    res.json(data);
  } catch (err) { next(err); }
});

router.get("/jobs", async (req, res, next) => {
  try {
    const { project_id, status } = req.query;
    let q = supabaseAdmin.from("production_jobs")
      .select("*, projects(name, clients(name)), rooms(room_name), production_stage_logs(*)")
      .eq("tenant_id", req.tenantId);
    if (project_id) q = q.eq("project_id", project_id);
    if (status) q = q.eq("status", status);
    q = q.order("created_at", { ascending: false });
    const { data, error } = await q;
    if (error) throw new AppError(error.message);
    res.json(data);
  } catch (err) { next(err); }
});

router.post("/jobs", async (req, res, next) => {
  try {
    const { room_id, project_id, priority } = req.body;
    if (!room_id || !project_id) throw new AppError("room_id and project_id required");

    const { count } = await supabaseAdmin.from("production_jobs").select("*", { count: "exact", head: true }).eq("tenant_id", req.tenantId);
    const job_code = `JOB-${String((count || 0) + 1).padStart(5, "0")}`;

    const { data: job, error } = await supabaseAdmin.from("production_jobs")
      .insert({ room_id, project_id, job_code, priority: priority || "normal", status: "pending", tenant_id: req.tenantId, released_at: new Date().toISOString() })
      .select().single();
    if (error) throw new AppError(error.message);

    const { data: stages } = await supabaseAdmin.from("production_stages_config")
      .select("*").eq("tenant_id", req.tenantId).eq("is_active", true).order("sort_order");
    const stagesToUse = stages?.length ? stages : DEFAULT_STAGES.map((s, i) => ({ ...s, id: String(i) }));

    await supabaseAdmin.from("production_stage_logs").insert(
      stagesToUse.map(s => ({ tenant_id: req.tenantId, job_id: job.id, stage_id: s.id || null, stage_name: s.stage_name, status: "pending" }))
    );

    await supabaseAdmin.from("rooms").update({ status: "released" }).eq("id", room_id);
    res.status(201).json(job);
  } catch (err) { next(err); }
});

router.get("/jobs/:id/stages", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from("production_stage_logs")
      .select("*, users(name)").eq("job_id", req.params.id).eq("tenant_id", req.tenantId).order("created_at");
    if (error) throw new AppError(error.message);
    res.json(data);
  } catch (err) { next(err); }
});

router.patch("/stage-logs/:id", async (req, res, next) => {
  try {
    const { status, assigned_to, qc_status, qc_notes, rework_reason, quantity_processed } = req.body;
    const updates = { status, assigned_to, qc_status, qc_notes, rework_reason, quantity_processed };
    if (status === "in_progress" && !updates.started_at) updates.started_at = new Date().toISOString();
    if (status === "completed") updates.completed_at = new Date().toISOString();
    const { data, error } = await supabaseAdmin.from("production_stage_logs")
      .update(updates).eq("id", req.params.id).eq("tenant_id", req.tenantId).select().single();
    if (error) throw new AppError(error.message);
    res.json(data);
  } catch (err) { next(err); }
});

export default router;
