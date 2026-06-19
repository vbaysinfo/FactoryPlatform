import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendSMS, formatMobile, SMS_TEMPLATES } from "@/lib/sms";

/**
 * POST /api/alerts/payment
 * Send payment reminders to farmers with pending/partial payments
 * Body: { daysPending?: number } — only remind if overdue by X days (default 7)
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { daysPending = 7, sendAlert = true } = body;

    const { data: sales, error } = await supabase
      .from("sales")
      .select("*, farmers(name, phone)")
      .in("status", ["pending", "partial"])
      .order("date", { ascending: true });

    if (error) throw error;

    const today    = new Date();
    const reminders = [];

    for (const sale of sales || []) {
      const saleDate  = new Date(sale.date);
      const daysDiff  = Math.floor((today - saleDate) / (1000 * 60 * 60 * 24));

      if (daysDiff < daysPending) continue;

      const farmerName  = sale.farmers?.name || "Farmer";
      const farmerPhone = sale.farmers?.phone;
      const balance     = sale.balance || (sale.total - (sale.paid_amount || 0));

      const msg = SMS_TEMPLATES.paymentReminder(
        farmerName,
        sale.invoice_no,
        balance,
        daysDiff
      );

      if (sendAlert && farmerPhone) {
        await sendSMS(formatMobile(farmerPhone), msg);
      }

      reminders.push({
        invoice: sale.invoice_no,
        farmer: farmerName,
        phone: farmerPhone,
        balance,
        days_pending: daysDiff,
        sale_date: sale.date,
        status: sale.status,
        sms_sent: sendAlert && !!farmerPhone,
      });
    }

    return NextResponse.json({
      success: true,
      totalPending: sales?.length || 0,
      reminderseSent: reminders.length,
      reminders,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return POST(new Request("", { method: "POST", body: JSON.stringify({ sendAlert: false }) }));
}
