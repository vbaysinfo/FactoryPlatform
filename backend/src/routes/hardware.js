import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { injectTenant } from "../middleware/tenant.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();
router.use(requireAuth, injectTenant);

router.get("/rooms/:roomId", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from("hardware_items")
      .select("*").eq("room_id", req.params.roomId).eq("tenant_id", req.tenantId).order("created_at");
    if (error) throw new AppError(error.message);
    res.json(data);
  } catch (err) { next(err); }
});

router.post("/rooms/:roomId", async (req, res, next) => {
  try {
    const { item_name, category, brand, model, specification, quantity, unit, unit_cost, notes } = req.body;
    if (!item_name) throw new AppError("Item name required");
    const { data, error } = await supabaseAdmin.from("hardware_items")
      .insert({ item_name, category, brand, model, specification, quantity: quantity || 1, unit: unit || "nos", unit_cost: unit_cost || 0,
        total_cost: (quantity || 1) * (unit_cost || 0), notes, room_id: req.params.roomId, tenant_id: req.tenantId })
      .select().single();
    if (error) throw new AppError(error.message);
    res.status(201).json(data);
  } catch (err) { next(err); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (updates.quantity || updates.unit_cost) {
      updates.total_cost = (updates.quantity || 1) * (updates.unit_cost || 0);
    }
    const { data, error } = await supabaseAdmin.from("hardware_items")
      .update(updates).eq("id", req.params.id).eq("tenant_id", req.tenantId).select().single();
    if (error) throw new AppError(error.message);
    res.json(data);
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await supabaseAdmin.from("hardware_items").delete().eq("id", req.params.id).eq("tenant_id", req.tenantId);
    res.json({ message: "Deleted" });
  } catch (err) { next(err); }
});

router.post("/rooms/:roomId/auto-suggest", async (req, res, next) => {
  try {
    const { data: room } = await supabaseAdmin.from("rooms").select("*").eq("id", req.params.roomId).single();
    const { data: revisions } = await supabaseAdmin.from("cut_list_revisions")
      .select("id").eq("room_id", req.params.roomId).in("status", ["confirmed","validated"]).order("revision_number", { ascending: false }).limit(1);
    if (!revisions?.length) throw new AppError("No confirmed cut list found. Please confirm cut list first.");

    const suggestions = [];
    if ((room.shutters || 0) > 0) {
      suggestions.push({ item_name: "Soft-close Hinge (165deg)", category: "hinge", quantity: room.shutters * 2, unit: "nos", unit_cost: 35, is_auto_suggested: true });
      suggestions.push({ item_name: "Hinge Mounting Plate", category: "hinge", quantity: room.shutters * 2, unit: "nos", unit_cost: 12, is_auto_suggested: true });
    }
    if ((room.drawers || 0) > 0) {
      suggestions.push({ item_name: "Telescopic Drawer Channel (450mm)", category: "drawer_channel", quantity: room.drawers, unit: "pairs", unit_cost: 280, is_auto_suggested: true });
    }

    if (suggestions.length) {
      const { data } = await supabaseAdmin.from("hardware_items").insert(
        suggestions.map(s => ({ ...s, total_cost: s.quantity * s.unit_cost, room_id: req.params.roomId, revision_id: revisions[0].id, tenant_id: req.tenantId }))
      ).select();
      res.json({ message: `${data.length} items auto-suggested`, data });
    } else {
      res.json({ message: "No auto-suggestions available", data: [] });
    }
  } catch (err) { next(err); }
});

router.post("/rooms/:roomId/confirm", async (req, res, next) => {
  try {
    await supabaseAdmin.from("rooms").update({ status: "hardware_confirmed" }).eq("id", req.params.roomId).eq("tenant_id", req.tenantId);
    res.json({ message: "Hardware list confirmed" });
  } catch (err) { next(err); }
});

export default router;
