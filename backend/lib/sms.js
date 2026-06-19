import axios from "axios";

const MSG91_API_KEY   = process.env.MSG91_API_KEY;
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || "AQUANP";
const MSG91_ROUTE     = process.env.MSG91_ROUTE     || "4"; // transactional

/**
 * Send SMS via MSG91
 * @param {string|string[]} to  - Mobile number(s) with country code e.g. "919876543210"
 * @param {string} message      - SMS text (max 160 chars for single SMS)
 */
export async function sendSMS(to, message) {
  if (!MSG91_API_KEY) {
    console.warn("MSG91_API_KEY not set — SMS not sent:", message);
    return { success: false, reason: "API key not configured" };
  }

  const numbers = Array.isArray(to) ? to.join(",") : to;

  try {
    const res = await axios.get("https://api.msg91.com/api/sendhttp.php", {
      params: {
        authkey:  MSG91_API_KEY,
        mobiles:  numbers,
        message:  message,
        sender:   MSG91_SENDER_ID,
        route:    MSG91_ROUTE,
        country:  "91",
        unicode:  "0",
      },
    });
    console.log("SMS sent to", numbers, "→", res.data);
    return { success: true, data: res.data };
  } catch (err) {
    console.error("SMS error:", err.message);
    return { success: false, reason: err.message };
  }
}

/**
 * Format Indian mobile number to international format (91XXXXXXXXXX)
 */
export function formatMobile(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return "91" + digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return digits;
}

// ── Pre-built SMS templates ────────────────────────────────

export const SMS_TEMPLATES = {
  harvestReady: (batchNo, tankName, doc, biomass) =>
    `🦐 AquaNursery Alert: Batch ${batchNo} in Tank ${tankName} is HARVEST READY! DOC: ${doc} days, Biomass: ${biomass}kg. Please arrange harvest team.`,

  waterAlert: (tankName, param, value, limit, shift) =>
    `⚠️ AquaNursery Water Alert: Tank ${tankName} - ${param} is ${value} (limit: ${limit}) during ${shift} shift. Immediate action required!`,

  lowStock: (itemName, type, qty, unit, minStock) =>
    `📦 AquaNursery Stock Alert: ${itemName} (${type}) stock is LOW! Current: ${qty}${unit}, Minimum: ${minStock}${unit}. Please reorder immediately.`,

  paymentReminder: (farmerName, invoiceNo, amount, days) =>
    `💰 AquaNursery Payment Reminder: Dear ${farmerName}, Invoice ${invoiceNo} of Rs.${amount.toLocaleString("en-IN")} is pending for ${days} days. Please clear at earliest.`,

  dailyReport: (date, activeBatches, harvestReady, totalBiomass, alerts) =>
    `📊 AquaNursery Daily Report (${date}): Active Batches: ${activeBatches}, Harvest Ready: ${harvestReady}, Total Biomass: ${totalBiomass}kg, Alerts: ${alerts}. Have a great day!`,

  batchStarted: (batchNo, tankName, count, hatchery) =>
    `✅ AquaNursery: New batch ${batchNo} stocked in Tank ${tankName}. Seed: ${(count/1000).toFixed(0)}K from ${hatchery}. DOC tracking started.`,
};
