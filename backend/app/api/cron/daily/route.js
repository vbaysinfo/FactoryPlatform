import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { calcDOC } from "@/lib/calculations";
import { sendSMS, formatMobile, SMS_TEMPLATES } from "@/lib/sms";

/**
 * GET /api/cron/daily
 * Master daily cron job — runs every morning at 7 AM
 * Configured in vercel.json
 *
 * Tasks:
 *  1. Update DOC for all active batches
 *  2. Check for harvest-ready batches → SMS alert
 *  3. Check low stock → SMS alert
 *  4. Send daily summary to manager
 */
export async function GET(req) {
  // Verify this is called by Vercel Cron (or internal call)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log = [];
  let totalAlerts = 0;

  try {
    // ── 1. Update DOC for all active batches ──────────────
    const { data: batches } = await supabase
      .from("batches")
      .select("*")
      .in("status", ["active", "harvest-ready"]);

    const newHarvestReady = [];
    for (const batch of batches || []) {
      const doc    = calcDOC(batch.start_date);
      const status = doc >= 22 && batch.status === "active" ? "harvest-ready" : batch.status;
      await supabase.from("batches").update({ doc, status }).eq("id", batch.id);
      if (status === "harvest-ready" && batch.status !== "harvest-ready") {
        newHarvestReady.push(batch);
        totalAlerts++;
      }
    }
    log.push(`DOC updated for ${batches?.length || 0} batches. ${newHarvestReady.length} newly harvest-ready.`);

    // ── 2. SMS for newly harvest-ready batches ────────────
    const managerPhone = await getManagerPhone();
    for (const batch of newHarvestReady) {
      const { data: tank } = await supabase.from("tanks").select("name").eq("id", batch.t_id).single();
      const msg = SMS_TEMPLATES.harvestReady(batch.batch_no, tank?.name || `T${batch.t_id}`, calcDOC(batch.start_date), batch.biomass?.toFixed(1) || "N/A");
      if (managerPhone) await sendSMS(managerPhone, msg);
      if (process.env.OWNER_PHONE) await sendSMS(formatMobile(process.env.OWNER_PHONE), msg);
    }

    // ── 3. Check low stock ────────────────────────────────
    const { data: lowFeed } = await supabase.from("feed_inventory").select("*").filter("stock_kg", "lt", "min_stock");
    const { data: lowMed  } = await supabase.from("medicine_inventory").select("*").filter("quantity", "lt", "min_stock");
    const lowItems = [...(lowFeed || []), ...(lowMed || [])];

    for (const item of lowItems) {
      const name = item.brand ? `${item.brand} ${item.feed_type}` : item.name;
      const qty  = item.stock_kg ?? item.quantity;
      const msg  = SMS_TEMPLATES.lowStock(name, item.brand ? "Feed" : "Medicine", qty, "kg", item.min_stock);
      if (managerPhone) await sendSMS(managerPhone, msg);
      totalAlerts++;
    }
    log.push(`Low stock check: ${lowItems.length} items below minimum.`);

    // ── 4. Daily summary SMS to manager ──────────────────
    const allActive      = (batches || []).filter(b => b.status === "active" || b.status === "harvest-ready");
    const harvestReadyAll= (batches || []).filter(b => b.status === "harvest-ready");
    const totalBiomass   = allActive.reduce((a, b) => a + (b.biomass || 0), 0);
    const today          = new Date().toLocaleDateString("en-IN");

    const summaryMsg = SMS_TEMPLATES.dailyReport(today, allActive.length, harvestReadyAll.length, totalBiomass.toFixed(1), totalAlerts);
    if (managerPhone) await sendSMS(managerPhone, summaryMsg);
    log.push(`Daily summary SMS sent to manager.`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      log,
      stats: {
        batchesUpdated: batches?.length || 0,
        newlyHarvestReady: newHarvestReady.length,
        lowStockItems: lowItems.length,
        totalAlerts,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message, log }, { status: 500 });
  }
}

async function getManagerPhone() {
  const { data } = await supabase.from("staff").select("phone").eq("role", "Manager").eq("status", "active").limit(1).single();
  return data?.phone ? formatMobile(data.phone) : process.env.MANAGER_PHONE;
}
