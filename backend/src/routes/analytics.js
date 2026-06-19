import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { injectTenant } from "../middleware/tenant.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();
router.use(requireAuth, injectTenant);

router.get("/dashboard", async (req, res, next) => {
  try {
    const tid = req.tenantId;
    const [
      { count: totalClients },
      { count: totalProjects },
      { count: activeJobs },
      { count: pendingDispatch },
      { data: invoices },
      { data: expenses },
      { data: recentProjects }
    ] = await Promise.all([
      supabaseAdmin.from("clients").select("*", { count: "exact", head: true }).eq("tenant_id", tid).eq("is_active", true),
      supabaseAdmin.from("projects").select("*", { count: "exact", head: true }).eq("tenant_id", tid),
      supabaseAdmin.from("production_jobs").select("*", { count: "exact", head: true }).eq("tenant_id", tid).eq("status", "in_progress"),
      supabaseAdmin.from("dispatch_orders").select("*", { count: "exact", head: true }).eq("tenant_id", tid).in("status", ["pending","scheduled"]),
      supabaseAdmin.from("invoices").select("grand_total, amount_paid, amount_due, status, invoice_date").eq("tenant_id", tid),
      supabaseAdmin.from("expenses").select("amount, category, expense_date").eq("tenant_id", tid),
      supabaseAdmin.from("projects").select("*, clients(name)").eq("tenant_id", tid).order("created_at", { ascending: false }).limit(5)
    ]);

    const totalInvoiced = (invoices || []).reduce((s, i) => s + (i.grand_total || 0), 0);
    const totalReceived = (invoices || []).reduce((s, i) => s + (i.amount_paid || 0), 0);
    const totalDue = (invoices || []).reduce((s, i) => s + (i.amount_due || 0), 0);
    const totalExpenses = (expenses || []).reduce((s, e) => s + (e.amount || 0), 0);

    res.json({
      kpis: { totalClients, totalProjects, activeJobs, pendingDispatch, totalInvoiced, totalReceived, totalDue, totalExpenses },
      recentProjects
    });
  } catch (err) { next(err); }
});

router.get("/revenue", async (req, res, next) => {
  try {
    const { months = 6 } = req.query;
    const { data: invoices } = await supabaseAdmin.from("invoices")
      .select("grand_total, amount_paid, invoice_date").eq("tenant_id", req.tenantId);
    const result = {};
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      result[key] = { month: key, invoiced: 0, received: 0 };
    }
    (invoices || []).forEach(inv => {
      if (!inv.invoice_date) return;
      const key = inv.invoice_date.slice(0, 7);
      if (result[key]) { result[key].invoiced += inv.grand_total || 0; result[key].received += inv.amount_paid || 0; }
    });
    res.json(Object.values(result));
  } catch (err) { next(err); }
});

router.get("/project-status", async (req, res, next) => {
  try {
    const { data } = await supabaseAdmin.from("projects").select("status").eq("tenant_id", req.tenantId);
    const counts = {};
    (data || []).forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1; });
    res.json(Object.entries(counts).map(([name, value]) => ({ name, value })));
  } catch (err) { next(err); }
});

router.get("/expense-breakdown", async (req, res, next) => {
  try {
    const { data } = await supabaseAdmin.from("expenses").select("category, amount").eq("tenant_id", req.tenantId);
    const totals = {};
    (data || []).forEach(e => { totals[e.category] = (totals[e.category] || 0) + (e.amount || 0); });
    res.json(Object.entries(totals).map(([name, value]) => ({ name, value })));
  } catch (err) { next(err); }
});

router.get("/production-performance", async (req, res, next) => {
  try {
    const { data: logs } = await supabaseAdmin.from("production_stage_logs")
      .select("stage_name, status, started_at, completed_at").eq("tenant_id", req.tenantId);
    const stages = {};
    (logs || []).forEach(log => {
      if (!stages[log.stage_name]) stages[log.stage_name] = { name: log.stage_name, completed: 0, pending: 0, rework: 0, avgHours: 0, totalHours: 0, count: 0 };
      stages[log.stage_name][log.status === "completed" ? "completed" : log.status === "rework" ? "rework" : "pending"]++;
      if (log.started_at && log.completed_at) {
        const hrs = (new Date(log.completed_at) - new Date(log.started_at)) / 3600000;
        stages[log.stage_name].totalHours += hrs;
        stages[log.stage_name].count++;
        stages[log.stage_name].avgHours = stages[log.stage_name].totalHours / stages[log.stage_name].count;
      }
    });
    res.json(Object.values(stages));
  } catch (err) { next(err); }
});

export default router;
