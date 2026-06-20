import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { logger } from "./utils/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.js";
import tenantRoutes from "./routes/tenants.js";
import clientRoutes from "./routes/clients.js";
import projectRoutes from "./routes/projects.js";
import cutlistRoutes from "./routes/cutlist.js";
import hardwareRoutes from "./routes/hardware.js";
import quotationRoutes from "./routes/quotations.js";
import productionRoutes from "./routes/production.js";
import inventoryRoutes from "./routes/inventory.js";
import employeeRoutes from "./routes/employees.js";
import maintenanceRoutes from "./routes/maintenance.js";
import dispatchRoutes from "./routes/dispatch.js";
import accountingRoutes from "./routes/accounting.js";
import analyticsRoutes from "./routes/analytics.js";
import pdfRoutes from "./routes/pdf.js";
import adminRoutes from "./routes/admin.js";
import uploadRoutes from "./routes/upload.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","X-Tenant-ID"]
}));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500, message: { error: "Too many requests" } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: "Too many auth attempts" } });
app.use(limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined", { stream: { write: msg => logger.info(msg.trim()) } }));

app.get("/health", (_req, res) => res.json({ status: "ok", version: "1.0.0", time: new Date().toISOString() }));

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/cutlist", cutlistRoutes);
app.use("/api/hardware", hardwareRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/production", productionRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/dispatch", dispatchRoutes);
app.use("/api/accounting", accountingRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/pdf", pdfRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);

app.use((_req, res) => res.status(404).json({ error: "Route not found" }));
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`ModularPro API running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
});

export default app;
