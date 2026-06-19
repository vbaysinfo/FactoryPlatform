import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { checkWaterQuality } from "@/lib/calculations";
import { sendSMS, formatMobile, SMS_TEMPLATES } from "@/lib/sms";

/**
 * POST /api/water/check
 * Check water quality readings against safe thresholds
 * Sends SMS alert to manager if any parameter is out of range
 * Body: { readingId?: number } — check specific reading or latest from all tanks
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { readingId, sendAlert = true } = body;

    let query = supabase
      .from("water_quality")
      .select("*, tanks(name, shed)")
      .order("created_at", { ascending: false });

    if (readingId) {
      query = query.eq("id", readingId);
    } else {
      // Get latest reading per tank (last 3 hours)
      const since = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      query = query.gte("created_at", since);
    }

    const { data: readings, error } = await query;
    if (error) throw error;

    const alerts = [];

    for (const reading of readings || []) {
      const violations = checkWaterQuality(reading);
      if (violations.length > 0) {
        const tankName = reading.tanks?.name || `Tank ${reading.t_id}`;
        alerts.push({
          tank: tankName,
          shed: reading.tanks?.shed,
          date: reading.date,
          shift: reading.shift,
          violations,
        });

        // Send SMS for critical violations
        if (sendAlert) {
          const criticals = violations.filter(v => v.severity === "critical");
          const toAlert   = violations.filter(v => v.severity === "warning" || v.severity === "critical");

          if (toAlert.length > 0) {
            const managerPhone = await getManagerPhone();
            if (managerPhone) {
              const firstViolation = toAlert[0];
              const msg = SMS_TEMPLATES.waterAlert(
                tankName,
                firstViolation.param,
                firstViolation.value,
                firstViolation.limit,
                reading.shift
              );
              await sendSMS(managerPhone, msg);
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      checked: readings?.length || 0,
      alertsFound: alerts.length,
      alerts,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

async function getManagerPhone() {
  const { data } = await supabase
    .from("staff")
    .select("phone")
    .eq("role", "Manager")
    .eq("status", "active")
    .limit(1)
    .single();
  return data?.phone ? formatMobile(data.phone) : process.env.MANAGER_PHONE;
}
