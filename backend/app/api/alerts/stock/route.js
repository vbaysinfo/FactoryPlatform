import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendSMS, formatMobile, SMS_TEMPLATES } from "@/lib/sms";

/**
 * POST /api/alerts/stock
 * Check feed and medicine inventory — send SMS if below minimum stock level
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { sendAlert = true } = body;

    // Check feed inventory
    const { data: feedItems } = await supabase
      .from("feed_inventory")
      .select("*")
      .filter("stock_kg", "lt", "min_stock");

    // Check medicine inventory
    const { data: medItems } = await supabase
      .from("medicine_inventory")
      .select("*")
      .filter("quantity", "lt", "min_stock");

    const lowStock = [
      ...(feedItems || []).map(i => ({ ...i, category: "Feed", qty: i.stock_kg, unit: "kg", name: `${i.brand} ${i.feed_type}`, min: i.min_stock })),
      ...(medItems  || []).map(i => ({ ...i, category: "Medicine", qty: i.quantity, min: i.min_stock })),
    ];

    if (!lowStock.length) {
      return NextResponse.json({ success: true, message: "All stock levels are adequate", count: 0 });
    }

    if (sendAlert) {
      const managerPhone = await getManagerPhone();
      for (const item of lowStock) {
        const msg = SMS_TEMPLATES.lowStock(item.name, item.category, item.qty, item.unit || "kg", item.min);
        if (managerPhone) await sendSMS(managerPhone, msg);
      }
    }

    return NextResponse.json({
      success: true,
      count: lowStock.length,
      lowStockItems: lowStock.map(i => ({
        name: i.name,
        category: i.category,
        current: i.qty,
        minimum: i.min,
        unit: i.unit || "kg",
        supplier: i.supplier,
        expiry: i.expiry_date,
      })),
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return POST(new Request("", { method: "POST", body: JSON.stringify({ sendAlert: false }) }));
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
