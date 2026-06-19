import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { checkWaterQuality } from "@/lib/calculations";
import { sendSMS, formatMobile, SMS_TEMPLATES } from "@/lib/sms";

/**
 * GET /api/cron/water-check
 * Water quality check cron — runs every 6 hours
 * Checks latest readings and sends SMS for out-of-range parameters
 */
export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get readings from last 7 hours
    const since = new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString();
    const { data: readings } = await supabase
      .from("water_quality")
      .select("*, tanks(name, shed)")
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    const alerts = [];
    const managerPhone = await getManagerPhone();

    for (const reading of readings || []) {
      const violations = checkWaterQuality(reading);
      if (!violations.length) continue;

      const tankName = reading.tanks?.name || `Tank ${reading.t_id}`;
      alerts.push({ tank: tankName, violations });

      // Send SMS for critical violations only (avoid SMS flood)
      const critical = violations.filter(v => v.severity === "critical");
      if (critical.length && managerPhone) {
        const v = critical[0];
        const msg = SMS_TEMPLATES.waterAlert(tankName, v.param, v.value, v.limit, reading.shift);
        await sendSMS(managerPhone, msg);
      }
    }

    return NextResponse.json({
      success: true,
      checked: readings?.length || 0,
      violations_found: alerts.length,
      alerts,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

async function getManagerPhone() {
  const { data } = await supabase.from("staff").select("phone").eq("role", "Manager").eq("status", "active").limit(1).single();
  return data?.phone ? formatMobile(data.phone) : process.env.MANAGER_PHONE;
}
