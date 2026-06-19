import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { calcDOC } from "@/lib/calculations";

/**
 * GET /api/dashboard/summary
 * Real-time computed dashboard stats
 */
export async function GET() {
  try {
    const [
      { data: batches },
      { data: tanks },
      { data: sales },
      { data: feedLogs },
      { data: waterReadings },
      { data: feedInv },
      { data: medInv },
    ] = await Promise.all([
      supabase.from("batches").select("*"),
      supabase.from("tanks").select("*"),
      supabase.from("sales").select("total, paid_amount, balance, status, date"),
      supabase.from("feed_logs").select("cost, qty_g, date").gte("date", thisMonth()),
      supabase.from("water_quality").select("*").gte("date", today()),
      supabase.from("feed_inventory").select("stock_kg, min_stock"),
      supabase.from("medicine_inventory").select("quantity, min_stock"),
    ]);

    const activeBatches  = (batches || []).filter(b => b.status === "active");
    const harvestReady   = (batches || []).filter(b => b.status === "harvest-ready");
    const harvested      = (batches || []).filter(b => b.status === "harvested");

    const totalBiomass   = activeBatches.reduce((a, b) => a + (b.biomass || 0), 0);
    const avgFCR         = activeBatches.length
      ? activeBatches.reduce((a, b) => a + (b.fcr || 0), 0) / activeBatches.length
      : 0;

    const tankStatus = {
      active:      (tanks || []).filter(t => t.status === "active").length,
      empty:       (tanks || []).filter(t => t.status === "empty").length,
      harvest:     (tanks || []).filter(t => t.status === "harvest").length,
      maintenance: (tanks || []).filter(t => t.status === "maintenance").length,
    };

    const monthRevenue   = (sales || []).filter(s => s.date >= thisMonth()).reduce((a, s) => a + (s.total || 0), 0);
    const pendingPayment = (sales || []).filter(s => s.status !== "paid").reduce((a, s) => a + (s.balance || 0), 0);

    const feedCostThisMonth = (feedLogs || []).reduce((a, f) => a + (f.cost || 0), 0);

    const lowStockFeed = (feedInv || []).filter(i => i.stock_kg < i.min_stock).length;
    const lowStockMed  = (medInv  || []).filter(i => i.quantity < i.min_stock).length;

    // Batches hitting harvest soon (within 3 days)
    const harvestingSoon = activeBatches.filter(b => {
      const doc = calcDOC(b.start_date);
      return doc >= 19 && doc < 22;
    });

    return NextResponse.json({
      batches: {
        active:       activeBatches.length,
        harvest_ready:harvestReady.length,
        harvested:    harvested.length,
        total:        (batches || []).length,
        harvesting_soon: harvestingSoon.length,
      },
      tanks: tankStatus,
      production: {
        total_biomass_kg: parseFloat(totalBiomass.toFixed(1)),
        avg_fcr:          parseFloat(avgFCR.toFixed(2)),
      },
      finance: {
        month_revenue:     monthRevenue,
        pending_payment:   pendingPayment,
        feed_cost_month:   feedCostThisMonth,
      },
      alerts: {
        harvest_ready:   harvestReady.length,
        low_stock_items: lowStockFeed + lowStockMed,
        pending_payments:(sales || []).filter(s => s.status !== "paid").length,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function thisMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
