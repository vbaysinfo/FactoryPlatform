import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { calcBatchPnL, calcCostPerKg, calcExpectedRevenue } from "@/lib/calculations";

/**
 * GET /api/finance/batch?batchId=1
 * Detailed P&L for a single batch
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId");
    if (!batchId) return NextResponse.json({ error: "batchId required" }, { status: 400 });

    const { data: batch, error } = await supabase.from("batches").select("*").eq("id", batchId).single();
    if (error) throw error;

    // Feed cost for this batch's tank
    const { data: feedLogs } = await supabase.from("feed_logs").select("cost, qty_g").eq("t_id", batch.t_id);
    const feedCost   = (feedLogs || []).reduce((a, f) => a + (f.cost || 0), 0);
    const totalFeedKg= (feedLogs || []).reduce((a, f) => a + (f.qty_g || 0), 0) / 1000;

    // Medicine cost
    const { data: medLogs } = await supabase.from("medicine_logs").select("cost").eq("t_id", batch.t_id);
    const medCost = (medLogs || []).reduce((a, m) => a + (m.cost || 0), 0);

    // Sale amount
    const { data: sales } = await supabase.from("sales").select("total, paid_amount, balance, status").eq("batch_id", batchId);
    const saleAmount  = (sales || []).reduce((a, s) => a + (s.total || 0), 0);
    const collected   = (sales || []).reduce((a, s) => a + (s.paid_amount || 0), 0);
    const outstanding = (sales || []).reduce((a, s) => a + (s.balance || 0), 0);

    const pnl = calcBatchPnL({
      seedCost:  batch.total_cost,
      feedCost,
      medCost,
      saleAmount,
    });

    const costPerKg       = calcCostPerKg(pnl.totalCost, batch.biomass || 0);
    const expectedRevenue = batch.biomass ? calcExpectedRevenue(batch.biomass, 150) : 0; // 150 Rs/kg estimate

    return NextResponse.json({
      batch_no: batch.batch_no,
      tank_id:  batch.t_id,
      status:   batch.status,
      doc:      batch.doc,
      biomass:  batch.biomass,
      feed_kg:  totalFeedKg,
      fcr:      batch.fcr,
      costs: {
        seed:     batch.total_cost,
        feed:     feedCost,
        medicine: medCost,
        total:    pnl.totalCost,
        per_kg:   costPerKg,
      },
      revenue: {
        actual:      saleAmount,
        collected,
        outstanding,
        expected:    expectedRevenue,
      },
      profit: {
        amount: pnl.profit,
        margin: `${pnl.margin}%`,
        status: pnl.profit >= 0 ? "profit" : "loss",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
