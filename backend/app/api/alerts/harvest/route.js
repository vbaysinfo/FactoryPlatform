import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendSMS, formatMobile, SMS_TEMPLATES } from "@/lib/sms";

/**
 * POST /api/alerts/harvest
 * Find harvest-ready batches and send SMS alert to manager + owner
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { sendAlert = true } = body;

    const { data: batches, error } = await supabase
      .from("batches")
      .select("*, tanks(name, shed)")
      .in("status", ["harvest-ready"])
      .order("doc", { ascending: false });

    if (error) throw error;

    if (!batches?.length) {
      return NextResponse.json({ success: true, message: "No harvest-ready batches", count: 0 });
    }

    const notified = [];

    for (const batch of batches) {
      const tankName = batch.tanks?.name || `Tank ${batch.t_id}`;
      const msg = SMS_TEMPLATES.harvestReady(
        batch.batch_no,
        tankName,
        batch.doc,
        batch.biomass?.toFixed(1) || "N/A"
      );

      if (sendAlert) {
        // Alert manager
        const managerPhone = await getStaffPhone("Manager");
        if (managerPhone) await sendSMS(managerPhone, msg);

        // Alert owner/admin
        const ownerPhone = process.env.OWNER_PHONE;
        if (ownerPhone) await sendSMS(formatMobile(ownerPhone), msg);
      }

      notified.push({
        batch_no: batch.batch_no,
        tank: tankName,
        doc: batch.doc,
        biomass: batch.biomass,
        message: msg,
      });
    }

    return NextResponse.json({
      success: true,
      count: notified.length,
      batches: notified,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return POST(new Request("", { method: "POST", body: JSON.stringify({ sendAlert: false }) }));
}

async function getStaffPhone(role) {
  const { data } = await supabase
    .from("staff")
    .select("phone")
    .eq("role", role)
    .eq("status", "active")
    .limit(1)
    .single();
  return data?.phone ? formatMobile(data.phone) : null;
}
