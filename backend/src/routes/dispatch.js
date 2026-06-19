import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { injectTenant } from "../middleware/tenant.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();
router.use(requireAuth, injectTenant);

router.get("/", async (req, res, next) => {
  try {
    const { project_id, status } = req.query;
    let q = supabaseAdmin.from("dispatch_orders").select("*, projects(name, clients(name)), dispatch_items(*), employees(name)").eq("tenant_id", req.tenantId);
    if (project_id) q = q.eq("project_id", project_id);
    if (status) q = q.eq("status", status);
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) throw new AppError(error.message);
    res.json(data);
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const { project_id, scheduled_date, vehicle_type, vehicle_number, driver_id, driver_contact, destination_address, delivery_notes, items } = req.body;
    if (!project_id) throw new AppError("Project required");
    const { count } = await supabaseAdmin.from("dispatch_orders").select("*", { count: "exact", head: true }).eq("tenant_id", req.tenantId);
    const dispatch_number = `DS-${String((count || 0) + 1).padStart(5, "0")}`;
    const { data: order, error } = await supabaseAdmin.from("dispatch_orders")
      .insert({ project_id, scheduled_date, vehicle_type, vehicle_number, driver_id, driver_contact, destination_address, delivery_notes, dispatch_number, status: "pending", total_items: items?.length || 0, tenant_id: req.tenantId, created_by: req.user.id })
      .select().single();
    if (error) throw new AppError(error.message);
    if (items?.length) {
      await supabaseAdmin.from("dispatch_items").insert(items.map(i => ({ ...i, dispatch_id: order.id })));
    }
    res.status(201).json(order);
  } catch (err) { next(err); }
});

router.patch("/:id/status", async (req, res, next) => {
  try {
    const { status, delivery_proof_url, receiver_name } = req.body;
    const updates = { status };
    if (status === "dispatched") updates.actual_dispatch_date = new Date().toISOString().split("T")[0];
    if (delivery_proof_url) updates.delivery_proof_url = delivery_proof_url;
    if (receiver_name) updates.receiver_name = receiver_name;
    const { data, error } = await supabaseAdmin.from("dispatch_orders")
      .update(updates).eq("id", req.params.id).eq("tenant_id", req.tenantId).select().single();
    if (error) throw new AppError(error.message);
    if (status === "delivered") {
      await supabaseAdmin.from("projects").update({ status: "dispatch_logged" }).eq("id", data.project_id);
    }
    res.json(data);
  } catch (err) { next(err); }
});

export default router;
