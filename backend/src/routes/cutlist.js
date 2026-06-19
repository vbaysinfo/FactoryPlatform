import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { injectTenant } from "../middleware/tenant.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();
router.use(requireAuth, injectTenant);

router.get("/rooms/:roomId/revisions", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from("cut_list_revisions")
      .select("*, cut_list_panels(*)")
      .eq("room_id", req.params.roomId).eq("tenant_id", req.tenantId)
      .order("revision_number");
    if (error) throw new AppError(error.message);
    res.json(data);
  } catch (err) { next(err); }
});

router.post("/rooms/:roomId/revisions", async (req, res, next) => {
  try {
    const { count } = await supabaseAdmin.from("cut_list_revisions")
      .select("*", { count: "exact", head: true }).eq("room_id", req.params.roomId);
    const revNum = (count || 0) + 1;
    const { data, error } = await supabaseAdmin.from("cut_list_revisions")
      .insert({ room_id: req.params.roomId, tenant_id: req.tenantId, revision_number: revNum, status: "draft", created_by: req.user.id })
      .select().single();
    if (error) throw new AppError(error.message);
    await supabaseAdmin.from("rooms").update({ status: "cut_list_draft" }).eq("id", req.params.roomId);
    res.status(201).json(data);
  } catch (err) { next(err); }
});

router.get("/revisions/:revId/panels", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from("cut_list_panels")
      .select("*").eq("revision_id", req.params.revId).eq("tenant_id", req.tenantId).order("sort_order");
    if (error) throw new AppError(error.message);
    res.json(data);
  } catch (err) { next(err); }
});

router.post("/revisions/:revId/panels", async (req, res, next) => {
  try {
    const { panel_label, length_mm, width_mm, thickness_mm, material, finish, grain_direction,
      edge_band_top, edge_band_bottom, edge_band_left, edge_band_right, edge_band_type, quantity, unit_id } = req.body;
    if (!panel_label || !length_mm || !width_mm) throw new AppError("Label, Length, Width required");
    const { count } = await supabaseAdmin.from("cut_list_panels").select("*", { count: "exact", head: true }).eq("revision_id", req.params.revId);
    const { data, error } = await supabaseAdmin.from("cut_list_panels")
      .insert({ panel_label, length_mm, width_mm, thickness_mm: thickness_mm || 18, material, finish, grain_direction,
        edge_band_top: !!edge_band_top, edge_band_bottom: !!edge_band_bottom, edge_band_left: !!edge_band_left, edge_band_right: !!edge_band_right,
        edge_band_type, quantity: quantity || 1, unit_id, revision_id: req.params.revId, tenant_id: req.tenantId, sort_order: count || 0 })
      .select().single();
    if (error) throw new AppError(error.message);
    res.status(201).json(data);
  } catch (err) { next(err); }
});

router.patch("/panels/:id", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from("cut_list_panels")
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq("id", req.params.id).eq("tenant_id", req.tenantId).select().single();
    if (error) throw new AppError(error.message);
    res.json(data);
  } catch (err) { next(err); }
});

router.delete("/panels/:id", async (req, res, next) => {
  try {
    await supabaseAdmin.from("cut_list_panels").delete().eq("id", req.params.id).eq("tenant_id", req.tenantId);
    res.json({ message: "Panel deleted" });
  } catch (err) { next(err); }
});

router.post("/revisions/:revId/confirm", async (req, res, next) => {
  try {
    const { data: rev } = await supabaseAdmin.from("cut_list_revisions").select("room_id").eq("id", req.params.revId).single();
    await supabaseAdmin.from("cut_list_revisions")
      .update({ status: "confirmed", confirmed_by: req.user.id, confirmed_at: new Date().toISOString() })
      .eq("id", req.params.revId);
    await supabaseAdmin.from("rooms").update({ status: "designer_confirmed" }).eq("id", rev.room_id);
    res.json({ message: "Cut list confirmed by designer" });
  } catch (err) { next(err); }
});

router.post("/revisions/:revId/validate", async (req, res, next) => {
  try {
    const { pass, notes } = req.body;
    const { data: rev } = await supabaseAdmin.from("cut_list_revisions").select("room_id").eq("id", req.params.revId).single();
    await supabaseAdmin.from("cut_list_revisions")
      .update({ status: pass ? "validated" : "rejected", validated_by: req.user.id, validated_at: new Date().toISOString(), notes })
      .eq("id", req.params.revId);
    await supabaseAdmin.from("rooms").update({ status: pass ? "validated" : "cut_list_draft" }).eq("id", rev.room_id);
    res.json({ message: pass ? "Cut list validated" : "Cut list flagged for correction" });
  } catch (err) { next(err); }
});

router.get("/rooms/:roomId/export-csv", async (req, res, next) => {
  try {
    const { rev_id } = req.query;
    let q = supabaseAdmin.from("cut_list_panels").select("*").eq("tenant_id", req.tenantId);
    if (rev_id) q = q.eq("revision_id", rev_id);
    else {
      const { data: revs } = await supabaseAdmin.from("cut_list_revisions").select("id").eq("room_id", req.params.roomId).order("revision_number", { ascending: false }).limit(1);
      if (revs?.[0]) q = q.eq("revision_id", revs[0].id);
    }
    const { data: panels } = await q.order("sort_order");
    const headers = ["Panel Label","Length (mm)","Width (mm)","Thickness (mm)","Material","Finish","Grain","Edge Top","Edge Bottom","Edge Left","Edge Right","Quantity"];
    const rows = (panels || []).map(p => [
      p.panel_label, p.length_mm, p.width_mm, p.thickness_mm, p.material, p.finish || "",
      p.grain_direction || "", p.edge_band_top?"Y":"N", p.edge_band_bottom?"Y":"N",
      p.edge_band_left?"Y":"N", p.edge_band_right?"Y":"N", p.quantity
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="cut-list-${req.params.roomId}.csv"`);
    res.send(csv);
  } catch (err) { next(err); }
});

export default router;
