/**
 * Explore ASC Sales & Finance Reports for Itsyhome.
 * Run: npx tsx scripts/explore-sales.ts
 */

import * as jose from "jose";
import * as fs from "fs";
import * as zlib from "zlib";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const KEY_PATH = requireEnv("ASC_KEY_PATH");
const KEY_ID = requireEnv("ASC_KEY_ID");
const ISSUER_ID = requireEnv("ASC_ISSUER_ID");
const BASE = "https://api.appstoreconnect.apple.com";
const VENDOR_NUMBER = requireEnv("ASC_VENDOR_NUMBER");

async function makeToken(): Promise<string> {
  const keyPem = fs.readFileSync(KEY_PATH, "utf-8");
  const key = await jose.importPKCS8(keyPem, "ES256");
  const now = Math.floor(Date.now() / 1000);
  return new jose.SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: KEY_ID, typ: "JWT" })
    .setIssuer(ISSUER_ID)
    .setIssuedAt(now)
    .setExpirationTime(now + 20 * 60)
    .setAudience("appstoreconnect-v1")
    .sign(key);
}

async function fetchReport(
  token: string,
  params: Record<string, string>,
): Promise<string | null> {
  const qs = new URLSearchParams(params).toString();
  const url = `${BASE}/v1/salesReports?${qs}`;
  console.log(`  GET ${url.replace(BASE, "")}`);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/a-gzip" },
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`  HTTP ${res.status}: ${text.slice(0, 300)}`);
    return null;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  try {
    return zlib.gunzipSync(buf).toString("utf-8");
  } catch {
    return buf.toString("utf-8");
  }
}

async function fetchFinanceReport(
  token: string,
  params: Record<string, string>,
): Promise<string | null> {
  const qs = new URLSearchParams(params).toString();
  const url = `${BASE}/v1/financeReports?${qs}`;
  console.log(`  GET ${url.replace(BASE, "")}`);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/a-gzip" },
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`  HTTP ${res.status}: ${text.slice(0, 300)}`);
    return null;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  try {
    return zlib.gunzipSync(buf).toString("utf-8");
  } catch {
    return buf.toString("utf-8");
  }
}

function printReport(label: string, tsv: string | null) {
  if (!tsv) return;
  const lines = tsv.split("\n").filter((l) => l.trim());
  console.log(`\n=== ${label} ===`);
  console.log(`  Columns: ${lines[0]}`);
  console.log(`  Rows: ${lines.length - 1}`);
  for (const line of lines.slice(1, Math.min(6, lines.length))) {
    console.log(`  ${line}`);
  }
}

async function main() {
  const token = await makeToken();

  // --- Sales Reports ---
  // Types: SALES, PRE_ORDER, NEWSSTAND, SUBSCRIPTION, SUBSCRIPTION_EVENT, SUBSCRIBER, SUBSCRIPTION_OFFER_CODE_REDEMPTION
  // Subtypes: SUMMARY, DETAILED, OPT_IN
  // Frequencies: DAILY, WEEKLY, MONTHLY, YEARLY

  console.log("\n########## SALES REPORTS ##########\n");

  // Daily sales summary
  const dailySales = await fetchReport(token, {
    "filter[reportType]": "SALES",
    "filter[reportSubType]": "SUMMARY",
    "filter[frequency]": "DAILY",
    "filter[vendorNumber]": VENDOR_NUMBER,
    "filter[reportDate]": "2026-02-24",
  });
  printReport("Daily sales summary (2026-02-24)", dailySales);

  // Weekly sales summary
  const weeklySales = await fetchReport(token, {
    "filter[reportType]": "SALES",
    "filter[reportSubType]": "SUMMARY",
    "filter[frequency]": "WEEKLY",
    "filter[vendorNumber]": VENDOR_NUMBER,
    "filter[reportDate]": "2026-02-22",
  });
  printReport("Weekly sales summary (2026-02-22)", weeklySales);

  // Monthly sales summary
  const monthlySales = await fetchReport(token, {
    "filter[reportType]": "SALES",
    "filter[reportSubType]": "SUMMARY",
    "filter[frequency]": "MONTHLY",
    "filter[vendorNumber]": VENDOR_NUMBER,
    "filter[reportDate]": "2026-01",
  });
  printReport("Monthly sales summary (2026-01)", monthlySales);

  // Detailed daily sales
  const detailedSales = await fetchReport(token, {
    "filter[reportType]": "SALES",
    "filter[reportSubType]": "DETAILED",
    "filter[frequency]": "DAILY",
    "filter[vendorNumber]": VENDOR_NUMBER,
    "filter[reportDate]": "2026-02-24",
  });
  printReport("Daily sales detailed (2026-02-24)", detailedSales);

  // Subscription summary
  const subSummary = await fetchReport(token, {
    "filter[reportType]": "SUBSCRIPTION",
    "filter[reportSubType]": "SUMMARY",
    "filter[frequency]": "DAILY",
    "filter[vendorNumber]": VENDOR_NUMBER,
    "filter[reportDate]": "2026-02-24",
  });
  printReport("Subscription summary (2026-02-24)", subSummary);

  // Subscription event
  const subEvent = await fetchReport(token, {
    "filter[reportType]": "SUBSCRIPTION_EVENT",
    "filter[reportSubType]": "SUMMARY",
    "filter[frequency]": "DAILY",
    "filter[vendorNumber]": VENDOR_NUMBER,
    "filter[reportDate]": "2026-02-24",
  });
  printReport("Subscription event (2026-02-24)", subEvent);

  // Pre-order
  const preOrder = await fetchReport(token, {
    "filter[reportType]": "PRE_ORDER",
    "filter[reportSubType]": "SUMMARY",
    "filter[frequency]": "DAILY",
    "filter[vendorNumber]": VENDOR_NUMBER,
    "filter[reportDate]": "2026-02-24",
  });
  printReport("Pre-order (2026-02-24)", preOrder);

  console.log("\n\n########## FINANCE REPORTS ##########\n");

  // Finance reports – try recent months
  for (const month of ["2026-02", "2026-01", "2025-12"]) {
    const finance = await fetchFinanceReport(token, {
      "filter[reportType]": "FINANCIAL",
      "filter[regionCode]": "US",
      "filter[reportDate]": month,
      "filter[vendorNumber]": VENDOR_NUMBER,
    });
    printReport(`Finance US (${month})`, finance);
  }

  // Try other regions
  for (const region of ["EU", "GB", "CA", "AU", "JP"]) {
    const finance = await fetchFinanceReport(token, {
      "filter[reportType]": "FINANCIAL",
      "filter[regionCode]": region,
      "filter[reportDate]": "2026-01",
      "filter[vendorNumber]": VENDOR_NUMBER,
    });
    printReport(`Finance ${region} (2026-01)`, finance);
  }

  // Try to get vendor number from app info
  console.log("\n\n########## APP PRICING / IAP ##########\n");

  // List IAPs
  const APP_ID = requireEnv("ASC_APP_ID");
  const iapUrl = `${BASE}/v1/apps/${APP_ID}/inAppPurchasesV2?limit=10`;
  console.log(`  GET ${iapUrl.replace(BASE, "")}`);
  const iapRes = await fetch(iapUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (iapRes.ok) {
    const iapData = await iapRes.json();
    console.log(`  IAPs found: ${iapData.data?.length ?? 0}`);
    for (const iap of iapData.data ?? []) {
      console.log(
        `  - ${iap.attributes.name} (${iap.attributes.productId}) – ${iap.attributes.inAppPurchaseType} – ${iap.attributes.state}`,
      );
    }
  } else {
    console.error(`  HTTP ${iapRes.status}: ${(await iapRes.text()).slice(0, 200)}`);
  }

  // List subscription groups
  const subGroupUrl = `${BASE}/v1/apps/${APP_ID}/subscriptionGroups?limit=10`;
  console.log(`\n  GET ${subGroupUrl.replace(BASE, "")}`);
  const subGroupRes = await fetch(subGroupUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (subGroupRes.ok) {
    const subGroupData = await subGroupRes.json();
    console.log(`  Subscription groups: ${subGroupData.data?.length ?? 0}`);
    for (const sg of subGroupData.data ?? []) {
      console.log(`  - ${sg.attributes.referenceName}`);
    }
  } else {
    console.error(`  HTTP ${subGroupRes.status}`);
  }

  console.log("\n=== DONE ===");
}

main().catch(console.error);
