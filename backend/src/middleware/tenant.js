import { AppError } from "./errorHandler.js";

export function injectTenant(req, res, next) {
  if (!req.tenant?.id) return next(new AppError("Tenant context missing", 400));
  req.tenantId = req.tenant.id;
  next();
}

export function requireActiveSubscription(req, res, next) {
  const { subscription_status } = req.tenant || {};
  if (subscription_status === "suspended" || subscription_status === "cancelled") {
    return next(new AppError("Subscription inactive. Please renew.", 402));
  }
  next();
}
