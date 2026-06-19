import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth, requireSuperAdmin } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { sendEmail, welcomeEmail } from "../services/email.js";

const router = Router();
router.use(requireAuth, requireSuperAdmin);

// B1: Create new tenant
router.post("/tenants", async (req, res, next) => {
  try {
    const { factory_name, owner_name, owner_email, owner_phone, address, gst_number, plan, trial_days } = req.body;
    if (!factory_name || !owner_name || !owner_email) throw new AppError("factory_name, owner_name, owner_email required");

    // Create tenant record
    const trial_end = new Date(Date.now() + (trial_days || 14) * 86400000).toISOString().split("T")[0];
    const { data: tenant, error: tErr } = await supabaseAdmin.from("tenants")
      .insert({ factory_name, owner_name, owner_email, owner_phone, address, gst_number, plan: plan || "basic", subscription_status: "trial", trial_end })
      .select().single();
    if (tErr) throw new AppError(tErr.message);

    // Generate temp password
    const tempPassword = `MP${Math.random().toString(36).slice(-6).toUpperCase()}#1`;

    // Create Supabase auth user
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: owner_email, password: tempPassword, email_confirm: true,
      user_metadata: { name: owner_name, factory_name, role: "tenant_admin" }
    });
    if (authErr) throw new AppError(authErr.message);

    // Create user profile
    await supabaseAdmin.from("users").insert({
      auth_user_id: authData.user.id, tenant_id: tenant.id, name: owner_name,
      email: owner_email, phone: owner_phone, role: "tenant_admin",
      must_change_password: true, is_active: true
    });

    // Send welcome email
    try {
      await sendEmail(welcomeEmail({
        ownerName: owner_name, factoryName: factory_name, email: owner_email,
        tempPassword, loginUrl: `${process.env.FRONTEND_URL}/login`
      }));
    } catch (emailErr) {
      console.error("Email send failed:", emailErr.message);
    }

    res.status(201).json({ tenant, tempPassword, message: "Tenant created and welcome email sent" });
  } catch (err) { next(err); }
});

// B3: Tenant overview dashboard
router.get("/overview", async (req, res, next) => {
  try {
    const { data: tenants } = await supabaseAdmin.from("tenants").select("*").order("created_at", { ascending: false });
    const now = new Date();
    const summary = await Promise.all((tenants || []).map(async (t) => {
      const [
        { count: projects },
        { count: clients },
        { count: employees },
        { count: activeJobs },
        { data: lastUser }
      ] = await Promise.all([
        supabaseAdmin.from("projects").select("*", { count: "exact", head: true }).eq("tenant_id", t.id),
        supabaseAdmin.from("clients").select("*", { count: "exact", head: true }).eq("tenant_id", t.id).eq("is_active", true),
        supabaseAdmin.from("employees").select("*", { count: "exact", head: true }).eq("tenant_id", t.id).eq("is_active", true),
        supabaseAdmin.from("production_jobs").select("*", { count: "exact", head: true }).eq("tenant_id", t.id).eq("status", "in_progress"),
        supabaseAdmin.from("users").select("updated_at").eq("tenant_id", t.id).order("updated_at", { ascending: false }).limit(1)
      ]);
      return { ...t, stats: { projects, clients, employees, activeJobs }, lastActivity: lastUser?.[0]?.updated_at };
    }));
    res.json(summary);
  } catch (err) { next(err); }
});

// B4: Business volume per tenant
router.get("/tenants/:id/volume", async (req, res, next) => {
  try {
    const tid = req.params.id;
    const { month } = req.query;
    const startDate = month ? `${month}-01` : new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
    const [
      { count: ordersCreated },
      { data: invoices },
      { data: payments },
      { count: jobsCompleted },
      { count: activeJobs },
    ] = await Promise.all([
      supabaseAdmin.from("projects").select("*", { count: "exact", head: true }).eq("tenant_id", tid).gte("created_at", startDate),
      supabaseAdmin.from("invoices").select("grand_total").eq("tenant_id", tid).gte("invoice_date", startDate),
      supabaseAdmin.from("payments").select("amount").eq("tenant_id", tid).gte("payment_date", startDate),
      supabaseAdmin.from("production_jobs").select("*", { count: "exact", head: true }).eq("tenant_id", tid).eq("status", "completed").gte("created_at", startDate),
      supabaseAdmin.from("production_jobs").select("*", { count: "exact", head: true }).eq("tenant_id", tid).eq("status", "in_progress"),
    ]);
    res.json({
      ordersCreated, jobsCompleted, activeJobs,
      totalInvoiced: (invoices || []).reduce((s, i) => s + (i.grand_total || 0), 0),
      totalReceived: (payments || []).reduce((s, p) => s + (p.amount || 0), 0),
    });
  } catch (err) { next(err); }
});

// B5: Platform-wide analytics
router.get("/platform-analytics", async (req, res, next) => {
  try {
    const [
      { count: totalTenants },
      { count: activeTenants },
      { count: trialTenants },
      { data: plans }
    ] = await Promise.all([
      supabaseAdmin.from("tenants").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("tenants").select("*", { count: "exact", head: true }).eq("subscription_status", "active"),
      supabaseAdmin.from("tenants").select("*", { count: "exact", head: true }).eq("subscription_status", "trial"),
      supabaseAdmin.from("tenants").select("plan")
    ]);
    const planDist = {};
    (plans || []).forEach(t => { planDist[t.plan] = (planDist[t.plan] || 0) + 1; });
    res.json({ totalTenants, activeTenants, trialTenants, planDistribution: planDist });
  } catch (err) { next(err); }
});

// B6: Tenant management
router.patch("/tenants/:id/suspend", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from("tenants").update({ subscription_status: "suspended", is_active: false }).eq("id", req.params.id).select().single();
    if (error) throw new AppError(error.message);
    res.json(data);
  } catch (err) { next(err); }
});

router.patch("/tenants/:id/activate", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from("tenants").update({ subscription_status: "active", is_active: true }).eq("id", req.params.id).select().single();
    if (error) throw new AppError(error.message);
    res.json(data);
  } catch (err) { next(err); }
});

// Password reset for tenant user
router.post("/tenants/:id/reset-password", async (req, res, next) => {
  try {
    const { user_email } = req.body;
    if (!user_email) throw new AppError("user_email required");
    await supabaseAdmin.auth.resetPasswordForEmail(user_email, { redirectTo: `${process.env.FRONTEND_URL}/reset-password` });
    res.json({ message: "Password reset email sent" });
  } catch (err) { next(err); }
});

export default router;
