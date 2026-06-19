import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { sendEmail, welcomeEmail } from "../services/email.js";

const router = Router();

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new AppError("Email and password required");

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
    if (error) throw new AppError(error.message, 401);

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("*, tenants(*)")
      .eq("auth_user_id", data.user.id)
      .single();

    if (!user) throw new AppError("User profile not found", 401);
    if (!user.is_active) throw new AppError("Account is disabled", 403);

    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, must_change_password: user.must_change_password },
      tenant: user.tenants
    });
  } catch (err) { next(err); }
});

// POST /api/auth/refresh
router.post("/refresh", async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) throw new AppError("Refresh token required");
    const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token });
    if (error) throw new AppError("Session expired. Please login again.", 401);
    res.json({ access_token: data.session.access_token, expires_at: data.session.expires_at });
  } catch (err) { next(err); }
});

// POST /api/auth/logout
router.post("/logout", requireAuth, async (req, res, next) => {
  try {
    await supabaseAdmin.auth.admin.signOut(req.token);
    res.json({ message: "Logged out successfully" });
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get("/me", requireAuth, (req, res) => {
  res.json({
    user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role, phone: req.user.phone },
    tenant: req.tenant
  });
});

// POST /api/auth/change-password
router.post("/change-password", requireAuth, async (req, res, next) => {
  try {
    const { new_password } = req.body;
    if (!new_password || new_password.length < 6) throw new AppError("Password must be at least 6 characters");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      (await supabaseAdmin.auth.getUser(req.token)).data.user.id,
      { password: new_password }
    );
    if (error) throw new AppError(error.message);
    await supabaseAdmin.from("users").update({ must_change_password: false }).eq("id", req.user.id);
    res.json({ message: "Password changed successfully" });
  } catch (err) { next(err); }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) throw new AppError("Email required");
    await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    });
    res.json({ message: "If this email exists, a reset link has been sent." });
  } catch (err) { next(err); }
});

export default router;
