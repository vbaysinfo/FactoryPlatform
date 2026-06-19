import PDFDocument from "pdfkit";

function drawHeader(doc, tenant, title) {
  doc.fontSize(20).font("Helvetica-Bold").text(tenant?.name || "Company", 50, 50);
  doc.fontSize(10).font("Helvetica").fillColor("#555")
    .text(tenant?.address || "", 50, 75)
    .text(tenant?.phone || "", 50, 90)
    .text(tenant?.email || "", 50, 105);

  doc.fontSize(18).font("Helvetica-Bold").fillColor("#000")
    .text(title, 0, 50, { align: "right" });

  doc.moveTo(50, 130).lineTo(550, 130).strokeColor("#cccccc").stroke();
}

function drawPartyInfo(doc, client, project, refLabel, refValue, dateLabel, dateValue) {
  doc.fontSize(10).font("Helvetica-Bold").fillColor("#000").text("Bill To:", 50, 145);
  doc.font("Helvetica").fillColor("#333")
    .text(client?.name || "", 50, 160)
    .text(client?.email || "", 50, 175)
    .text(client?.phone || "", 50, 190)
    .text(client?.address || "", 50, 205);

  doc.font("Helvetica-Bold").fillColor("#000").text("Project:", 320, 145);
  doc.font("Helvetica").fillColor("#333").text(project?.name || "", 320, 160)
    .text(project?.site_address || "", 320, 175);

  doc.font("Helvetica-Bold").fillColor("#000")
    .text(`${refLabel}:`, 320, 200)
    .text(`${dateLabel}:`, 320, 215);
  doc.font("Helvetica").fillColor("#333")
    .text(refValue || "", 420, 200)
    .text(dateValue || "", 420, 215);
}

function drawLineItemsTable(doc, lineItems, startY) {
  const headers = ["#", "Description", "Qty", "Unit Price", "Total"];
  const colX = [50, 80, 360, 410, 470];
  let y = startY;

  doc.rect(50, y, 500, 20).fillColor("#f0f0f0").fill();
  doc.fillColor("#000").font("Helvetica-Bold").fontSize(9);
  headers.forEach((h, i) => doc.text(h, colX[i], y + 5, { width: colX[i + 1] ? colX[i + 1] - colX[i] - 4 : 80 }));

  y += 20;
  doc.font("Helvetica").fontSize(9).fillColor("#333");

  lineItems.forEach((item, idx) => {
    if (y > 700) { doc.addPage(); y = 50; }
    const bg = idx % 2 === 0 ? "#ffffff" : "#fafafa";
    doc.rect(50, y, 500, 18).fillColor(bg).fill();
    doc.fillColor("#333")
      .text(String(idx + 1), colX[0], y + 4)
      .text(item.description || "", colX[1], y + 4, { width: 275 })
      .text(String(item.quantity ?? ""), colX[2], y + 4)
      .text(formatCurrency(item.unit_price), colX[3], y + 4)
      .text(formatCurrency((item.quantity ?? 0) * (item.unit_price ?? 0)), colX[4], y + 4);
    y += 18;
  });

  doc.moveTo(50, y).lineTo(550, y).strokeColor("#cccccc").stroke();
  return y + 10;
}

function drawTotals(doc, subtotal, tax, total, y) {
  doc.font("Helvetica").fontSize(10).fillColor("#333")
    .text("Subtotal:", 380, y).text(formatCurrency(subtotal), 470, y);
  doc.text("Tax:", 380, y + 16).text(formatCurrency(tax), 470, y + 16);
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#000")
    .text("Total:", 380, y + 36).text(formatCurrency(total), 470, y + 36);
}

function formatCurrency(val) {
  return `$${(Number(val) || 0).toFixed(2)}`;
}

export function generateQuotationPDF({ tenant, client, project, quotation, lineItems }) {
  const doc = new PDFDocument({ margin: 50 });

  drawHeader(doc, tenant, "QUOTATION");
  drawPartyInfo(
    doc, client, project,
    "Quotation #", quotation.quotation_number,
    "Date", quotation.created_at ? new Date(quotation.created_at).toLocaleDateString() : ""
  );

  const tableEnd = drawLineItemsTable(doc, lineItems, 250);

  const subtotal = lineItems.reduce((s, i) => s + (i.quantity ?? 0) * (i.unit_price ?? 0), 0);
  const tax = quotation.tax_amount ?? 0;
  const total = quotation.total_amount ?? subtotal + tax;

  drawTotals(doc, subtotal, tax, total, tableEnd + 10);

  if (quotation.notes) {
    doc.font("Helvetica").fontSize(9).fillColor("#555")
      .text("Notes:", 50, tableEnd + 90)
      .text(quotation.notes, 50, tableEnd + 103, { width: 400 });
  }

  return doc;
}

export function generateInvoicePDF({ tenant, client, project, invoice, lineItems }) {
  const doc = new PDFDocument({ margin: 50 });

  drawHeader(doc, tenant, "INVOICE");
  drawPartyInfo(
    doc, client, project,
    "Invoice #", invoice.invoice_number,
    "Due Date", invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : ""
  );

  const tableEnd = drawLineItemsTable(doc, lineItems, 250);

  const subtotal = lineItems.reduce((s, i) => s + (i.quantity ?? 0) * (i.unit_price ?? 0), 0);
  const tax = invoice.tax_amount ?? 0;
  const total = invoice.total_amount ?? subtotal + tax;

  drawTotals(doc, subtotal, tax, total, tableEnd + 10);

  const statusColors = { paid: "#22c55e", unpaid: "#ef4444", partial: "#f59e0b" };
  const status = (invoice.payment_status || "unpaid").toLowerCase();
  doc.rect(400, 50, 100, 24).fillColor(statusColors[status] || "#888").fill();
  doc.fillColor("#fff").font("Helvetica-Bold").fontSize(11)
    .text(status.toUpperCase(), 400, 57, { width: 100, align: "center" });

  if (invoice.notes) {
    doc.font("Helvetica").fontSize(9).fillColor("#555")
      .text("Notes:", 50, tableEnd + 90)
      .text(invoice.notes, 50, tableEnd + 103, { width: 400 });
  }

  return doc;
}
