import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { injectTenant } from "../middleware/tenant.js";
import { generateQuotationPDF, generateInvoicePDF } from "../services/pdf.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();
router.use(requireAuth, injectTenant);

router.get("/quotation/:id", async (req, res, next) => {
  try {
    const { data: q, error } = await supabaseAdmin.from("quotations")
      .select("*, projects(name, site_address, clients(*)), quotation_line_items(*)")
      .eq("id", req.params.id).eq("tenant_id", req.tenantId).single();
    if (error) throw new AppError("Quotation not found", 404);

    const doc = generateQuotationPDF({
      tenant: req.tenant, client: q.projects.clients,
      project: q.projects, quotation: q, lineItems: q.quotation_line_items || []
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="quotation-${q.quotation_number}.pdf"`);
    doc.pipe(res);
    doc.end();
  } catch (err) { next(err); }
});

router.get("/invoice/:id", async (req, res, next) => {
  try {
    const { data: inv, error } = await supabaseAdmin.from("invoices")
      .select("*, projects(name), clients(*), invoice_line_items(*)")
      .eq("id", req.params.id).eq("tenant_id", req.tenantId).single();
    if (error) throw new AppError("Invoice not found", 404);

    const doc = generateInvoicePDF({
      tenant: req.tenant, client: inv.clients,
      project: inv.projects, invoice: inv, lineItems: inv.invoice_line_items || []
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="invoice-${inv.invoice_number}.pdf"`);
    doc.pipe(res);
    doc.end();
  } catch (err) { next(err); }
});

export default router;
