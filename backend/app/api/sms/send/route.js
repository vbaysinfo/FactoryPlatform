import { NextResponse } from "next/server";
import { sendSMS, formatMobile } from "@/lib/sms";
import { supabase } from "@/lib/supabase";

/**
 * POST /api/sms/send
 * Send a custom SMS to a phone number or a staff/farmer
 * Body: {
 *   to: string | string[],       — mobile number(s) OR
 *   role?: string,               — send to all staff with this role
 *   farmerId?: number,           — send to specific farmer
 *   message: string
 * }
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { message, role, farmerId } = body;
    let { to } = body;

    if (!message) return NextResponse.json({ error: "message is required" }, { status: 400 });

    // Resolve recipients
    if (role) {
      const { data: staffList } = await supabase
        .from("staff")
        .select("phone, name")
        .eq("role", role)
        .eq("status", "active");
      to = (staffList || []).map(s => formatMobile(s.phone)).filter(Boolean);
    }

    if (farmerId) {
      const { data: farmer } = await supabase.from("farmers").select("phone, name").eq("id", farmerId).single();
      to = farmer?.phone ? [formatMobile(farmer.phone)] : [];
    }

    if (!to || (Array.isArray(to) && to.length === 0)) {
      return NextResponse.json({ error: "No valid recipients found" }, { status: 400 });
    }

    const result = await sendSMS(to, message);

    return NextResponse.json({
      success: result.success,
      recipients: Array.isArray(to) ? to.length : 1,
      message,
      result: result.data,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
