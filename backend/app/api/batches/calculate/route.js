import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { calcDOC, calcFCR, calcBiomass, calcDaysToHarvest, calcCostPerKg } from "@/lib/calculations";

/**
 * POST /api/batches/calculate
 * Recalculate FCR, biomass, DOC, survival rate for one or all active batches
 * Body: { batchId?: number }  — omit batchId to process all active batches
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { batchId } = body;

    // Fetch batches
    let query = supabase.from("batches").select("*").in("status", ["active", "harvest-ready"]);
    if (batchId) query = query.eq("id", batchId);
    const { data: batches, error: bErr } = await query;
    if (bErr) throw bErr;

    const results = [];

    for (const batch of batches) {
      // Recalculate DOC
      const doc = calcDOC(batch.start_date);

      // Sum feed from feed_logs
      const { data: feedLogs } = await supabase
        .from("feed_logs")
        .select("qty_g")
        .eq("t_id", batch.t_id);
      const totalFeedKg = (feedLogs || []).reduce((a, f) => a + (f.qty_g || 0), 0) / 1000;

      // Calculate biomass
      const biomass = calcBiomass(batch.count, batch.survival_rate || 80, getAvgWeight(doc));

      // Calculate FCR
      const fcr = calcFCR(totalFeedKg, biomass);

      // Days to harvest
      const daysToHarvest = calcDaysToHarvest(batch.start_date, 25);

      // Cost per kg
      const costPerKg = calcCostPerKg(batch.total_cost, biomass);

      // Determine status
      let status = batch.status;
      if (doc >= 22 && status === "active") status = "harvest-ready";

      // Update batch in DB
      const { error: uErr } = await supabase
        .from("batches")
        .update({ doc, biomass, feed_kg: totalFeedKg, fcr, status })
        .eq("id", batch.id);

      if (uErr) console.error("Update error batch", batch.id, uErr.message);

      results.push({
        id: batch.id,
        batch_no: batch.batch_no,
        doc,
        biomass,
        feed_kg: totalFeedKg,
        fcr,
        status,
        days_to_harvest: daysToHarvest,
        cost_per_kg: costPerKg,
      });
    }

    return NextResponse.json({ success: true, updated: results.length, results });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/batches/calculate?batchId=1
 * Get calculated stats for a batch without saving
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId");
    if (!batchId) return NextResponse.json({ error: "batchId required" }, { status: 400 });

    const { data: batch, error } = await supabase.from("batches").select("*").eq("id", batchId).single();
    if (error) throw error;

    const doc          = calcDOC(batch.start_date);
    const biomass      = calcBiomass(batch.count, batch.survival_rate || 80, getAvgWeight(doc));
    const daysToHarvest= calcDaysToHarvest(batch.start_date, 25);

    const { data: feedLogs } = await supabase.from("feed_logs").select("qty_g").eq("t_id", batch.t_id);
    const totalFeedKg = (feedLogs || []).reduce((a, f) => a + (f.qty_g || 0), 0) / 1000;
    const fcr         = calcFCR(totalFeedKg, biomass);
    const costPerKg   = calcCostPerKg(batch.total_cost, biomass);

    return NextResponse.json({
      batch_no: batch.batch_no,
      doc, biomass, fcr,
      feed_kg: totalFeedKg,
      days_to_harvest: daysToHarvest,
      cost_per_kg: costPerKg,
      survival_rate: batch.survival_rate,
      status: doc >= 22 ? "harvest-ready" : batch.status,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Average shrimp weight (grams) by DOC — standard growth curve
function getAvgWeight(doc) {
  if (doc <= 5)  return 0.002;
  if (doc <= 10) return 0.05;
  if (doc <= 15) return 0.3;
  if (doc <= 20) return 1.5;
  if (doc <= 25) return 4.0;
  if (doc <= 30) return 8.0;
  return 12.0;
}
