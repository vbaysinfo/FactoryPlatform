import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { calcDOC } from "@/lib/calculations";

/**
 * POST /api/batches/doc-update
 * Auto-update DOC for ALL active batches based on today's date
 * Called daily by cron job
 */
export async function POST() {
  try {
    const { data: batches, error } = await supabase
      .from("batches")
      .select("id, batch_no, start_date, status, survival_rate, count")
      .in("status", ["active", "harvest-ready"]);

    if (error) throw error;

    const updates = [];
    const harvestReady = [];

    for (const batch of batches) {
      const doc    = calcDOC(batch.start_date);
      const status = doc >= 22 && batch.status === "active" ? "harvest-ready" : batch.status;

      await supabase.from("batches").update({ doc, status }).eq("id", batch.id);

      updates.push({ id: batch.id, batch_no: batch.batch_no, doc, status });
      if (status === "harvest-ready" && batch.status !== "harvest-ready") {
        harvestReady.push(batch);
      }
    }

    return NextResponse.json({
      success: true,
      updated: updates.length,
      newlyHarvestReady: harvestReady.length,
      batches: updates,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
