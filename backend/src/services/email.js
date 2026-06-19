import nodemailer from "nodemailer";
import { logger } from "../utils/logger.js";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

export async function sendEmail({ to, subject, html, text }) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || "ModularPro <noreply@modular-pro.com>",
      to, subject, html, text
    });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`Email failed to ${to}: ${err.message}`);
    throw err;
  }
}

export function welcomeEmail({ ownerName, factoryName, email, tempPassword, loginUrl }) {
  return {
    to: email,
    subject: `Welcome to ModularPro - ${factoryName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <div style="background:linear-gradient(135deg,#3b82f6,#6366f1);padding:32px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="color:white;margin:0;font-size:24px">ModularPro</h1>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0">Factory Management Platform</p>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
          <h2 style="color:#1e293b">Welcome, ${ownerName}!</h2>
          <p style="color:#374151">Your factory workspace for <strong>${factoryName}</strong> is ready.</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0">
            <p style="margin:0 0 8px;color:#374151"><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
            <p style="margin:0 0 8px;color:#374151"><strong>Email:</strong> ${email}</p>
            <p style="margin:0;color:#374151"><strong>Temporary Password:</strong> <code style="background:#fffbeb;padding:2px 8px;border-radius:4px;font-family:monospace">${tempPassword}</code></p>
          </div>
          <p style="color:#dc2626;font-size:13px">Please change your password immediately after first login.</p>
          <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#6366f1);color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">
            Login to ModularPro
          </a>
          <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0">
          <p style="color:#94a3b8;font-size:12px">ModularPro - Interior Factory SaaS</p>
        </div>
      </div>
    `
  };
}

export function quotationEmail({ clientName, projectName, quotationNumber, amount, pdfUrl }) {
  return {
    subject: `Quotation ${quotationNumber} - ${projectName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2>Quotation for ${projectName}</h2>
        <p>Dear ${clientName},</p>
        <p>Please find attached the quotation <strong>${quotationNumber}</strong> for your project.</p>
        <p><strong>Total Amount:</strong> Rs.${amount?.toLocaleString("en-IN")}</p>
        ${pdfUrl ? `<p><a href="${pdfUrl}">Download Quotation PDF</a></p>` : ""}
        <p>Please review and let us know if you have any questions.</p>
      </div>
    `
  };
}

export function paymentReminderEmail({ clientName, invoiceNumber, amount, dueDate }) {
  return {
    subject: `Payment Reminder - Invoice ${invoiceNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2>Payment Reminder</h2>
        <p>Dear ${clientName},</p>
        <p>This is a friendly reminder that Invoice <strong>${invoiceNumber}</strong> for Rs.<strong>${amount?.toLocaleString("en-IN")}</strong> is due on ${dueDate}.</p>
        <p>Please make the payment at your earliest convenience.</p>
      </div>
    `
  };
}
