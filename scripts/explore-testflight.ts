/**
 * Explore ASC TestFlight / Beta Testing APIs for Itsyhome.
 * Run: npx tsx scripts/explore-testflight.ts
 */

import * as jose from "jose";
import * as fs from "fs";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const KEY_PATH = requireEnv("ASC_KEY_PATH");
const KEY_ID = requireEnv("ASC_KEY_ID");
const ISSUER_ID = requireEnv("ASC_ISSUER_ID");
const BASE = "https://api.appstoreconnect.apple.com";
const APP_ID = requireEnv("ASC_APP_ID");

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

async function get(token: string, path: string, params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  const url = `${BASE}${path}${qs}`;
  console.log(`\n  GET ${path}${qs}`);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`  HTTP ${res.status}: ${text.slice(0, 400)}`);
    return null;
  }
  return res.json();
}

function printSummary(label: string, data: any) {
  if (!data) {
    console.log(`  ${label}: NO DATA`);
    return;
  }
  const items = Array.isArray(data.data) ? data.data : data.data ? [data.data] : [];
  console.log(`  ${label}: ${items.length} item(s)`);
  for (const item of items.slice(0, 8)) {
    console.log(`    [${item.type}/${item.id}]`, JSON.stringify(item.attributes, null, 2));
    if (item.relationships) {
      console.log(`    rels: ${Object.keys(item.relationships).join(", ")}`);
    }
  }
  if (items.length > 8) console.log(`    ... and ${items.length - 8} more`);

  if (data.included?.length) {
    console.log(`  Included: ${data.included.length} resource(s)`);
    const byType: Record<string, number> = {};
    for (const inc of data.included) byType[inc.type] = (byType[inc.type] || 0) + 1;
    for (const [type, count] of Object.entries(byType)) console.log(`    ${type}: ${count}`);
    const seen = new Set<string>();
    for (const inc of data.included) {
      if (!seen.has(inc.type)) {
        seen.add(inc.type);
        console.log(`    Sample ${inc.type}:`, JSON.stringify(inc.attributes, null, 2));
      }
    }
  }
}

async function main() {
  const token = await makeToken();
  console.log("Token generated ✓\n");

  // ─────────────────────────────────────────────
  // 1. BUILDS (top-level with filter)
  // ─────────────────────────────────────────────
  console.log("═══ BUILDS ═══");

  const builds = await get(token, `/v1/builds`, {
    "filter[app]": APP_ID,
    "sort": "-uploadedDate",
    "limit": "10",
    "fields[builds]": "version,uploadedDate,processingState,minOsVersion,usesNonExemptEncryption,expirationDate,expired,computedMinMacOsVersion",
    "include": "preReleaseVersion,buildBetaDetail,app",
    "fields[preReleaseVersions]": "version,platform",
    "fields[buildBetaDetails]": "autoNotifyEnabled,internalBuildState,externalBuildState",
  });
  printSummary("Builds", builds);

  // ─────────────────────────────────────────────
  // 2. PRE-RELEASE VERSIONS
  // ─────────────────────────────────────────────
  console.log("\n═══ PRE-RELEASE VERSIONS ═══");

  const preReleaseVersions = await get(token, `/v1/preReleaseVersions`, {
    "filter[app]": APP_ID,
    "limit": "10",
    "sort": "-version",
    "fields[preReleaseVersions]": "version,platform",
    "include": "builds",
    "fields[builds]": "version,uploadedDate,processingState",
  });
  printSummary("Pre-release versions", preReleaseVersions);

  // ─────────────────────────────────────────────
  // 3. BETA GROUPS (top-level with filter)
  // ─────────────────────────────────────────────
  console.log("\n═══ BETA GROUPS ═══");

  const betaGroups = await get(token, `/v1/betaGroups`, {
    "filter[app]": APP_ID,
    "fields[betaGroups]": "name,isInternalGroup,publicLinkEnabled,publicLinkId,publicLink,publicLinkLimit,publicLinkLimitEnabled,feedbackEnabled,hasAccessToAllBuilds,iosBuildsAvailableForAppleSiliconMac,createdDate",
    "limit": "20",
  });
  printSummary("Beta groups", betaGroups);

  // ─────────────────────────────────────────────
  // 4. BETA TESTERS (top-level with filter)
  // ─────────────────────────────────────────────
  console.log("\n═══ BETA TESTERS ═══");

  const betaTesters = await get(token, `/v1/betaTesters`, {
    "filter[apps]": APP_ID,
    "fields[betaTesters]": "firstName,lastName,email,inviteType,state",
    "include": "betaGroups",
    "fields[betaGroups]": "name,isInternalGroup",
    "limit": "50",
  });
  printSummary("Beta testers", betaTesters);

  // ─────────────────────────────────────────────
  // 5. BETA APP REVIEW DETAIL
  // ─────────────────────────────────────────────
  console.log("\n═══ BETA APP REVIEW DETAIL ═══");

  const betaReview = await get(token, `/v1/betaAppReviewDetails`, {
    "filter[app]": APP_ID,
    "fields[betaAppReviewDetails]": "contactEmail,contactFirstName,contactLastName,contactPhone,demoAccountName,demoAccountPassword,demoAccountRequired,notes",
  });
  printSummary("Beta app review detail", betaReview);

  // ─────────────────────────────────────────────
  // 6. BETA APP LOCALIZATIONS
  // ─────────────────────────────────────────────
  console.log("\n═══ BETA APP LOCALIZATIONS ═══");

  const betaLocalizations = await get(token, `/v1/betaAppLocalizations`, {
    "filter[app]": APP_ID,
    "fields[betaAppLocalizations]": "description,feedbackEmail,locale,marketingUrl,privacyPolicyUrl,tvOsPrivacyPolicy",
  });
  printSummary("Beta app localizations", betaLocalizations);

  // ─────────────────────────────────────────────
  // 7. BETA LICENSE AGREEMENT
  // ─────────────────────────────────────────────
  console.log("\n═══ BETA LICENSE AGREEMENT ═══");

  const betaLicense = await get(token, `/v1/betaLicenseAgreements`, {
    "filter[app]": APP_ID,
    "fields[betaLicenseAgreements]": "agreementText",
  });
  printSummary("Beta license agreement", betaLicense);

  // ─────────────────────────────────────────────
  // 8. INDIVIDUAL BUILD DETAILS (first build)
  // ─────────────────────────────────────────────
  if (builds?.data?.[0]) {
    const buildId = builds.data[0].id;
    console.log(`\n═══ BUILD BETA DETAIL (build ${buildId}) ═══`);

    const buildBetaDetail = await get(token, `/v1/builds/${buildId}/buildBetaDetail`);
    printSummary("Build beta detail", buildBetaDetail);

    console.log(`\n═══ BETA BUILD LOCALIZATIONS (build ${buildId}) ═══`);
    const buildLocalizations = await get(token, `/v1/builds/${buildId}/betaBuildLocalizations`);
    printSummary("Beta build localizations", buildLocalizations);

    console.log(`\n═══ APP ENCRYPTION DECLARATION (build ${buildId}) ═══`);
    const encryption = await get(token, `/v1/builds/${buildId}/appEncryptionDeclaration`);
    printSummary("Encryption declaration", encryption);

    console.log(`\n═══ INDIVIDUAL TESTERS FOR BUILD (build ${buildId}) ═══`);
    const buildTesters = await get(token, `/v1/builds/${buildId}/individualTesters`);
    printSummary("Build individual testers", buildTesters);
  }

  // ─────────────────────────────────────────────
  // 9. BETA GROUP DETAILS (each group)
  // ─────────────────────────────────────────────
  if (betaGroups?.data?.length) {
    for (const group of betaGroups.data) {
      console.log(`\n═══ GROUP: "${group.attributes.name}" (${group.id}) ═══`);
      console.log(`  Attrs:`, JSON.stringify(group.attributes, null, 2));

      const groupBuilds = await get(token, `/v1/betaGroups/${group.id}/builds`, {
        "fields[builds]": "version,uploadedDate,processingState",
        "limit": "5",
        "sort": "-uploadedDate",
      });
      if (groupBuilds?.data?.length) {
        console.log(`  Builds: ${groupBuilds.data.length}`);
        for (const b of groupBuilds.data.slice(0, 3)) {
          console.log(`    ${b.attributes.version} – ${b.attributes.processingState} (${b.attributes.uploadedDate})`);
        }
      }

      const groupTesters = await get(token, `/v1/betaGroups/${group.id}/betaTesters`, {
        "fields[betaTesters]": "firstName,lastName,email,state",
        "limit": "50",
      });
      if (groupTesters?.data?.length) {
        console.log(`  Testers: ${groupTesters.data.length}`);
        for (const t of groupTesters.data.slice(0, 5)) {
          console.log(`    ${t.attributes.firstName} ${t.attributes.lastName} <${t.attributes.email}> – ${t.attributes.state}`);
        }
      }
    }
  }

  console.log("\n\n═══ DONE ═══");
}

main().catch(console.error);
