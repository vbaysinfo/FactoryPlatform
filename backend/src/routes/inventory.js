import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { injectTenant } from "../middleware/tenant.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();
router.use(requireAuth, injectTenant);

router.get("/items", async (req, res, next) => {
  try {
    const { category_id, low_stock } = req.query;
    let q = supabaseAdmin.from("inventory_items").select("*, inventory_categories(name, type)").eq("tenant_id", req.tenantId).eq("is_active", true);
    if (category_id) q = q.eq("category_id", category_id);
    const { data, error } = await q.order("name");
    if (error) throw new AppError(error.message);
    const result = low_stock === "true" ? data.filter(i => i.current_stock <= i.reorder_level) : data;
    res.json(result);
  } catch (err) { next(err); }
});

router.post("/items", async (req, res, next) => {
  try {
    const { name, item_code, brand, description, category_id, unit, unit_cost, current_stock, reorder_level, max_stock, supplier_name, supplier_contact, location } = req.body;
    if (!name) throw new AppError("Item name required");
    const { data, error } = await supabaseAdmin.from("inventory_items")
      .insert({ name, item_code, brand, description, category_id, unit: unit || "nos", unit_cost: unit_cost || 0, current_stock: current_stock || 0, reorder_level: reorder_level || 0, max_stock, supplier_name, supplier_contact, location, tenant_id: req.tenantId })
      .select().single();
    if (error) throw new AppError(error.message);
    res.status(201).json(data);
  } catch (err) { next(err); }
});

router.patch("/items/:id", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from("inventory_items")
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq("id", req.params.id).eq("tenant_id", req.tenantId).select().single();
    if (error) throw new AppError(error.message);
    res.json(data);
  } catch (err) { next(err); }
});

router.post("/transactions", async (req, res, next) => {
  try {
    const { item_id, transaction_type, quantity, unit_cost, project_id, room_id, notes, supplier_name, invoice_number } = req.body;
    if (!item_id || !quantity || !transaction_type) throw new AppError("item_id, quantity, transaction_type required");
    const qty = parseFloat(quantity);
    const cost = parseFloat(unit_cost || 0);
    const { data: txn, error } = await supabaseAdmin.from("inventory_transactions")
      .insert({ item_id, transaction_type, quantity: qty, unit_cost: cost, total_cost: qty * cost, project_id, room_id, notes, supplier_name, invoice_number, tenant_id: req.tenantId, performed_by: req.user.id, transaction_date: new Date().toISOString().split("T")[0] })
      .select().single();
    if (error) throw new AppError(error.message);
    const delta = ["purchase","return"].includes(transaction_type) ? qty : -qty;
    const { data: item } = await supabaseAdmin.from("inventory_items").select("current_stock").eq("id", item_id).single();
    await supabaseAdmin.from("inventory_items").update({ current_stock: (item?.current_stock || 0) + delta }).eq("id", item_id);
    res.status(201).json(txn);
  } catch (err) { next(err); }
});

router.get("/transactions", async (req, res, next) => {
  try {
    const { item_id, type, from_date, to_date } = req.query;
    let q = supabaseAdmin.from("inventory_transactions").select("*, inventory_items(name, unit)").eq("tenant_id", req.tenantId);
    if (item_id) q = q.eq("item_id", item_id);
    if (type) q = q.eq("transaction_type", type);
    if (from_date) q = q.gte("transaction_date", from_date);
    if (to_date) q = q.lte("transaction_date", to_date);
    const { data, error } = await q.order("transaction_date", { ascending: false }).limit(100);
    if (error) throw new AppError(error.message);
    res.json(data);
  } catch (err) { next(err); }
});

router.get("/categories", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from("inventory_categories").select("*").eq("tenant_id", req.tenantId).order("name");
    if (error) throw new AppError(error.message);
    res.json(data);
  } catch (err) { next(err); }
});

router.post("/categories", async (req, res, next) => {
  try {
    const { name, type } = req.body;
    if (!name) throw new AppError("Name required");
    const { data, error } = await supabaseAdmin.from("inventory_categories").insert({ name, type, tenant_id: req.tenantId }).select().single();
    if (error) throw new AppError(error.message);
    res.status(201).json(data);
  } catch (err) { next(err); }
});

export default router;
