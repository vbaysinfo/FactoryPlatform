import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { injectTenant } from "../middleware/tenant.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();
router.use(requireAuth, injectTenant);

router.get("/", async (req, res, next) => {
  try {
    const { project_id, status, type } = req.query;
    let q = supabaseAdmin.from("quotations")
      .select("*, projects(name, clients(name)), quotation_line_items(*)")
      .eq("tenant_id", req.tenantId);
    if (project_id) q = q.eq("project_id", project_id);
    if (status) q = q.eq("status", status);
    if (type) q = q.eq("type", type);
    q = q.order("created_at", { ascending: false });
    const { data, error } = await q;
    if (error) throw new AppError(error.message);
    res.json(data);
  } catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from("quotations")
      .select("*, projects(name, site_address, clients(*)), quotation_line_items(*)")
      .eq("id", req.params.id).eq("tenant_id", req.tenantId).single();
    if (error) throw new AppError("Not found", 404);
    res.json(data);
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const { project_id, type, line_items, discount_percent, gst_percent, advance_percent, validity_days, payment_terms, notes } = req.body;
    if (!project_id) throw new AppError("Project required");
    const { count } = await supabaseAdmin.from("quotations").select("*", { count: "exact", head: true }).eq("tenant_id", req.tenantId);
    const quotation_number = `QT-${String((count || 0) + 1).padStart(5, "0")}`;
    const subtotal = (line_items || []).reduce((s, i) => s + (i.quantity || 1) * (i.unit_price || 0), 0);
    const disc_pct = parseFloat(discount_percent || 0);
    const discount_amount = subtotal * disc_pct / 100;
    const taxable = subtotal - discount_amount;
    const gst_pct = parseFloat(gst_percent || 18);
    const gst_amount = taxable * gst_pct / 100;
    const grand_total = taxable + gst_amount;
    const valid_until = validity_days ? new Date(Date.now() + validity_days * 86400000).toISOString().split("T")[0] : null;

    const { data: q, error } = await supabaseAdmin.from("quotations")
      .insert({ project_id, type: type || "quotation", quotation_number, subtotal, discount_percent: disc_pct, discount_amount, gst_percent: gst_pct, gst_amount, grand_total, advance_percent, validity_days, valid_until, payment_terms, notes, tenant_id: req.tenantId, created_by: req.user.id })
      .select().single();
    if (error) throw new AppError(error.message);

    if (line_items?.length) {
      await supabaseAdmin.from("quotation_line_items").insert(
        line_items.map((li, i) => ({ ...li, total: (li.quantity || 1) * (li.unit_price || 0), quotation_id: q.id, sort_order: i }))
      );
    }
    res.status(201).json(q);
  } catch (err) { next(err); }
});

router.patch("/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;
    const updates = { status };
    if (status === "sent") updates.sent_at = new Date().toISOString();
    if (status === "accepted") updates.accepted_at = new Date().toISOString();
    const { data, error } = await supabaseAdmin.from("quotations")
      .update(updates).eq("id", req.params.id).eq("tenant_id", req.tenantId).select().single();
    if (error) throw new AppError(error.message);
    if (status === "accepted") {
      await supabaseAdmin.from("projects").update({ status: "client_accepted" }).eq("id", data.project_id);
    }
    res.json(data);
  } catch (err) { next(err); }
});

export default router;
