import { supabaseAdmin } from "../config/supabase.js";
import { AppError } from "./errorHandler.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) throw new AppError("No token provided", 401);
    const token = header.split(" ")[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) throw new AppError("Invalid or expired token", 401);
    const { data: profile } = await supabaseAdmin
      .from("users").select("*, tenants(*)")
      .eq("auth_user_id", user.id).single();
    if (!profile) throw new AppError("User profile not found", 401);
    if (!profile.is_active) throw new AppError("Account disabled", 403);
    req.user = profile;
    req.tenant = profile.tenants;
    req.token = token;
    next();
  } catch (err) { next(err); }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) return next(new AppError(`Requires role: ${roles.join(" or ")}`, 403));
    next();
  };
}

export function requireSuperAdmin(req, res, next) {
  if (req.user?.role !== "super_admin") return next(new AppError("Super admin access required", 403));
  next();
}
