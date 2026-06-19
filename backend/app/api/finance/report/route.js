import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/finance/report?month=2024-06
 * Full P&L report for a given month (or all time)
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // e.g. "2024-06"
    const year  = searchParams.get("year");  // e.g. "2024"

    // ── Revenue from Sales ────────────────────────────────
    let salesQuery = supabase.from("sales").select("total, paid_amount, balance, status, date, farmer_id");
    if (month) {
      salesQuery = salesQuery.gte("date", `${month}-01`).lte("date", `${month}-31`);
    }
    const { data: sales } = await salesQuery;

    const totalRevenue  = (sales || []).reduce((a, s) => a + (s.total || 0), 0);
    const totalCollected= (sales || []).reduce((a, s) => a + (s.paid_amount || 0), 0);
    const totalPending  = (sales || []).reduce((a, s) => a + (s.balance || 0), 0);

    // ── Feed Cost ─────────────────────────────────────────
    let feedQuery = supabase.from("feed_logs").select("cost, date");
    if (month) feedQuery = feedQuery.gte("date", `${month}-01`).lte("date", `${month}-31`);
    const { data: feedLogs } = await feedQuery;
    const feedCost = (feedLogs || []).reduce((a, f) => a + (f.cost || 0), 0);

    // ── Medicine Cost ─────────────────────────────────────
    let medQuery = supabase.from("medicine_logs").select("cost, date");
    if (month) medQuery = medQuery.gte("date", `${month}-01`).lte("date", `${month}-31`);
    const { data: medLogs } = await medQuery;
    const medCost = (medLogs || []).reduce((a, m) => a + (m.cost || 0), 0);

    // ── Maintenance Cost ──────────────────────────────────
    let maintQuery = supabase.from("maintenance").select("cost, date");
    if (month) maintQuery = maintQuery.gte("date", `${month}-01`).lte("date", `${month}-31`);
    const { data: maint } = await maintQuery;
    const maintCost = (maint || []).reduce((a, m) => a + (m.cost || 0), 0);

    // ── Power Cost ────────────────────────────────────────
    let powerQuery = supabase.from("power_bills").select("amount, month, year");
    if (month) {
      const [y, m] = month.split("-");
      powerQuery = powerQuery.eq("year", parseInt(y));
    }
    const { data: power } = await powerQuery;
    const powerCost = (power || []).reduce((a, p) => a + (p.amount || 0), 0);

    // ── Staff Salary ──────────────────────────────────────
    const { data: staff } = await supabase.from("staff").select("salary").eq("status", "active");
    const salaryCost = (staff || []).reduce((a, s) => a + (s.salary || 0), 0);

    // ── Seed Cost (from batches started this month) ───────
    let batchQuery = supabase.from("batches").select("total_cost, start_date");
    if (month) batchQuery = batchQuery.gte("start_date", `${month}-01`).lte("start_date", `${month}-31`);
    const { data: batches } = await batchQuery;
    const seedCost = (batches || []).reduce((a, b) => a + (b.total_cost || 0), 0);

    // ── Summary ───────────────────────────────────────────
    const totalCost   = feedCost + medCost + maintCost + powerCost + salaryCost + seedCost;
    const grossProfit = totalRevenue - totalCost;
    const margin      = totalRevenue > 0 ? parseFloat(((grossProfit / totalRevenue) * 100).toFixed(1)) : 0;

    return NextResponse.json({
      period: month || year || "all-time",
      revenue: {
        total: totalRevenue,
        collected: totalCollected,
        pending: totalPending,
        invoices: sales?.length || 0,
      },
      costs: {
        total: totalCost,
        breakdown: {
          seed:        seedCost,
          feed:        feedCost,
          medicine:    medCost,
          maintenance: maintCost,
          power:       powerCost,
          salary:      salaryCost,
        },
      },
      profit: {
        gross:  grossProfit,
        margin: `${margin}%`,
        status: grossProfit > 0 ? "profit" : "loss",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
