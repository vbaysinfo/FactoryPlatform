import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { injectTenant } from "../middleware/tenant.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();
router.use(requireAuth, injectTenant);

// Invoices
router.get("/invoices", async (req, res, next) => {
  try {
    const { project_id, client_id, status, type } = req.query;
    let q = supabaseAdmin.from("invoices").select("*, projects(name), clients(name), invoice_line_items(*)").eq("tenant_id", req.tenantId);
    if (project_id) q = q.eq("project_id", project_id);
    if (client_id) q = q.eq("client_id", client_id);
    if (status) q = q.eq("status", status);
    if (type) q = q.eq("invoice_type", type);
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) throw new AppError(error.message);
    res.json(data);
  } catch (err) { next(err); }
});

router.post("/invoices", async (req, res, next) => {
  try {
    const { project_id, client_id, invoice_type, line_items, discount_amount, gst_percent, due_date, payment_terms, notes } = req.body;
    if (!project_id || !client_id) throw new AppError("project_id and client_id required");
    const { count } = await supabaseAdmin.from("invoices").select("*", { count: "exact", head: true }).eq("tenant_id", req.tenantId);
    const invoice_number = `INV-${String((count || 0) + 1).padStart(5, "0")}`;
    const subtotal = (line_items || []).reduce((s, i) => s + (i.quantity || 1) * (i.unit_price || 0), 0);
    const disc = parseFloat(discount_amount || 0);
    const taxable = subtotal - disc;
    const gst_pct = parseFloat(gst_percent || 18);
    const gst_amount = taxable * gst_pct / 100;
    const grand_total = taxable + gst_amount;
    const { data: inv, error } = await supabaseAdmin.from("invoices")
      .insert({ project_id, client_id, invoice_type, invoice_number, subtotal, discount_amount: disc, gst_percent: gst_pct, gst_amount, grand_total, amount_due: grand_total, due_date, payment_terms, notes, status: "draft", invoice_date: new Date().toISOString().split("T")[0], tenant_id: req.tenantId, created_by: req.user.id })
      .select().single();
    if (error) throw new AppError(error.message);
    if (line_items?.length) {
      await supabaseAdmin.from("invoice_line_items").insert(
        line_items.map((li, i) => ({ ...li, total: (li.quantity || 1) * (li.unit_price || 0), invoice_id: inv.id, sort_order: i }))
      );
    }
    res.status(201).json(inv);
  } catch (err) { next(err); }
});

// Payments
router.get("/payments", async (req, res, next) => {
  try {
    const { invoice_id, client_id, from_date, to_date } = req.query;
    let q = supabaseAdmin.from("payments").select("*, invoices(invoice_number), clients(name)").eq("tenant_id", req.tenantId);
    if (invoice_id) q = q.eq("invoice_id", invoice_id);
    if (client_id) q = q.eq("client_id", client_id);
    if (from_date) q = q.gte("payment_date", from_date);
    if (to_date) q = q.lte("payment_date", to_date);
    const { data, error } = await q.order("payment_date", { ascending: false });
    if (error) throw new AppError(error.message);
    res.json(data);
  } catch (err) { next(err); }
});

router.post("/payments", async (req, res, next) => {
  try {
    const { invoice_id, amount, payment_date, payment_mode, reference_number, notes } = req.body;
    if (!invoice_id || !amount) throw new AppError("invoice_id and amount required");
    const { data: inv } = await supabaseAdmin.from("invoices").select("*").eq("id", invoice_id).single();
    if (!inv) throw new AppError("Invoice not found", 404);
    const amt = parseFloat(amount);
    const newPaid = (inv.amount_paid || 0) + amt;
    const newDue = Math.max(0, inv.grand_total - newPaid);
    const newStatus = newDue <= 0 ? "paid" : "partial";
    const { count } = await supabaseAdmin.from("payments").select("*", { count: "exact", head: true }).eq("tenant_id", req.tenantId);
    const payment_number = `PMT-${String((count || 0) + 1).padStart(5, "0")}`;
    const { data: pmt, error } = await supabaseAdmin.from("payments")
      .insert({ invoice_id, project_id: inv.project_id, client_id: inv.client_id, payment_number, amount: amt, payment_date: payment_date || new Date().toISOString().split("T")[0], payment_mode, reference_number, notes, tenant_id: req.tenantId, received_by: req.user.id })
      .select().single();
    if (error) throw new AppError(error.message);
    await supabaseAdmin.from("invoices").update({ amount_paid: newPaid, amount_due: newDue, status: newStatus }).eq("id", invoice_id);
    if (newStatus === "paid") {
      await supabaseAdmin.from("projects").update({ status: "payment_received" }).eq("id", inv.project_id);
    }
    res.status(201).json(pmt);
  } catch (err) { next(err); }
});

// Expenses
router.get("/expenses", async (req, res, next) => {
  try {
    const { category, project_id, from_date, to_date } = req.query;
    let q = supabaseAdmin.from("expenses").select("*").eq("tenant_id", req.tenantId);
    if (category) q = q.eq("category", category);
    if (project_id) q = q.eq("project_id", project_id);
    if (from_date) q = q.gte("expense_date", from_date);
    if (to_date) q = q.lte("expense_date", to_date);
    const { data, error } = await q.order("expense_date", { ascending: false }).limit(200);
    if (error) throw new AppError(error.message);
    res.json(data);
  } catch (err) { next(err); }
});

router.post("/expenses", async (req, res, next) => {
  try {
    const { category, description, amount, expense_date, vendor_name, invoice_number, payment_mode, project_id, notes } = req.body;
    if (!description || !amount) throw new AppError("Description and amount required");
    const { data, error } = await supabaseAdmin.from("expenses")
      .insert({ category, description, amount: parseFloat(amount), expense_date: expense_date || new Date().toISOString().split("T")[0], vendor_name, invoice_number, payment_mode, project_id, notes, tenant_id: req.tenantId, created_by: req.user.id })
      .select().single();
    if (error) throw new AppError(error.message);
    res.status(201).json(data);
  } catch (err) { next(err); }
});

// GST Summary export
router.get("/gst-summary", async (req, res, next) => {
  try {
    const { from_date, to_date } = req.query;
    let q = supabaseAdmin.from("invoices").select("*, clients(name, gst_number), invoice_line_items(*)").eq("tenant_id", req.tenantId);
    if (from_date) q = q.gte("invoice_date", from_date);
    if (to_date) q = q.lte("invoice_date", to_date);
    const { data, error } = await q;
    if (error) throw new AppError(error.message);
    const summary = { total_invoiced: 0, total_gst: 0, cgst: 0, sgst: 0, invoices: data.length };
    data.forEach(inv => {
      summary.total_invoiced += inv.grand_total || 0;
      summary.total_gst += inv.gst_amount || 0;
      summary.cgst += (inv.gst_amount || 0) / 2;
      summary.sgst += (inv.gst_amount || 0) / 2;
    });
    res.json({ summary, invoices: data });
  } catch (err) { next(err); }
});

export default router;
