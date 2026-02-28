import { ascFetch } from "./client";
import { buildIconUrl } from "./apps";
import { cacheGet, cacheSet, cacheInvalidatePrefix } from "@/lib/cache";

// ── TTLs ─────────────────────────────────────────────────────────

const BUILDS_TTL = 5 * 60 * 1000; // 5 min
const GROUPS_TTL = 15 * 60 * 1000; // 15 min
const GROUP_DETAIL_TTL = 5 * 60 * 1000; // 5 min
const INFO_TTL = 60 * 60 * 1000; // 1 hr

// ── Exported types (normalised, used by pages and API routes) ────

export interface TFBuild {
  id: string;
  buildNumber: string;
  versionString: string;
  platform: string;
  status: string;
  internalBuildState: string | null;
  externalBuildState: string | null;
  uploadedDate: string;
  expirationDate: string | null;
  expired: boolean;
  minOsVersion: string | null;
  whatsNew: string | null;
  whatsNewLocalizationId: string | null;
  groupIds: string[];
  iconUrl: string | null;
  installs: number;
  sessions: number;
  crashes: number;
}

export interface TFGroup {
  id: string;
  name: string;
  isInternal: boolean;
  testerCount: number;
  buildCount: number;
  publicLinkEnabled: boolean;
  publicLink: string | null;
  publicLinkLimit: number | null;
  publicLinkLimitEnabled: boolean;
  feedbackEnabled: boolean;
  hasAccessToAllBuilds: boolean;
  createdDate: string;
}

export interface TFTester {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  inviteType: string;
  state: string;
  sessions: number;
  crashes: number;
  feedbackCount: number;
}

export interface TFBetaAppLocalization {
  id: string;
  locale: string;
  description: string | null;
  feedbackEmail: string | null;
  marketingUrl: string | null;
  privacyPolicyUrl: string | null;
}

export interface TFBetaReviewDetail {
  id: string;
  contactFirstName: string | null;
  contactLastName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  demoAccountRequired: boolean;
  demoAccountName: string | null;
  demoAccountPassword: string | null;
  notes: string | null;
}

export interface TFBetaLicenseAgreement {
  id: string;
  agreementText: string | null;
}

export interface TFBetaAppInfo {
  localizations: TFBetaAppLocalization[];
  reviewDetail: TFBetaReviewDetail | null;
  licenseAgreement: TFBetaLicenseAgreement | null;
}

export interface TFGroupDetail {
  group: TFGroup;
  builds: TFBuild[];
  testers: TFTester[];
}

// ── Raw ASC response shapes ──────────────────────────────────────

interface AscJsonApiResource {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
  relationships?: Record<string, { data?: { id: string; type: string } | Array<{ id: string; type: string }> | null }>;
}

interface AscJsonApiResponse {
  data: AscJsonApiResource[] | AscJsonApiResource;
  included?: AscJsonApiResource[];
}

// ── Status derivation ────────────────────────────────────────────

function deriveBuildStatus(
  processingState: string,
  externalBuildState: string | null,
  internalBuildState: string | null,
  expired: boolean,
): string {
  if (processingState === "PROCESSING") return "Processing";
  if (processingState === "FAILED" || processingState === "INVALID") return "Invalid";
  if (expired) return "Expired";

  const state = externalBuildState ?? internalBuildState;
  switch (state) {
    case "IN_BETA_TESTING": return "Testing";
    case "READY_FOR_BETA_TESTING": return "Ready to test";
    case "IN_BETA_REVIEW": return "In beta review";
    case "READY_FOR_BETA_SUBMISSION": return "Ready to submit";
    case "MISSING_EXPORT_COMPLIANCE": return "Missing compliance";
    case "IN_EXPORT_COMPLIANCE_REVIEW": return "In compliance review";
    case "PROCESSING_EXCEPTION": return "Processing exception";
    case "EXPIRED": return "Expired";
    default: return state ?? "Unknown";
  }
}

// ── Builds ───────────────────────────────────────────────────────

export async function listBuilds(
  appId: string,
  forceRefresh = false,
  filters?: { platform?: string; versionString?: string },
): Promise<TFBuild[]> {
  const platform = filters?.platform;
  const versionString = filters?.versionString;
  const cacheKey = platform && versionString
    ? `tf-builds:${appId}:${platform}:${versionString}`
    : `tf-builds:${appId}`;

  if (!forceRefresh) {
    const cached = cacheGet<TFBuild[]>(cacheKey);
    if (cached) return cached;
  }

  const params = new URLSearchParams({
    "filter[app]": appId,
    sort: "-uploadedDate",
    limit: "200",
    include: "preReleaseVersion,buildBetaDetail,betaBuildLocalizations",
    "fields[preReleaseVersions]": "version,platform",
    "fields[buildBetaDetails]": "internalBuildState,externalBuildState",
    "fields[betaBuildLocalizations]": "whatsNew,locale",
  });

  if (platform) {
    params.set("filter[preReleaseVersion.platform]", platform);
  }
  if (versionString) {
    params.set("filter[preReleaseVersion.version]", versionString);
  }

  const response = await ascFetch<AscJsonApiResponse>(
    `/v1/builds?${params}`,
  );

  const dataArr = Array.isArray(response.data) ? response.data : [response.data];

  // Build included lookup maps
  const includedMap = new Map<string, AscJsonApiResource>();
  if (response.included) {
    for (const inc of response.included) {
      includedMap.set(`${inc.type}:${inc.id}`, inc);
    }
  }

  // Cross-reference builds to groups
  const buildToGroupIds = await resolveBuildGroupMap(appId);

  // Fetch build metrics in parallel
  const buildIds = dataArr
    .filter((b) => (b.attributes.processingState as string) === "VALID")
    .map((b) => b.id);
  const metricsMap = await fetchBuildMetrics(buildIds);

  const builds: TFBuild[] = dataArr.map((b) => {
    const attrs = b.attributes;

    // Resolve preReleaseVersion
    const prvRef = b.relationships?.preReleaseVersion?.data;
    const prvData = prvRef && !Array.isArray(prvRef)
      ? includedMap.get(`${prvRef.type}:${prvRef.id}`)
      : undefined;

    // Resolve buildBetaDetail
    const bbdRef = b.relationships?.buildBetaDetail?.data;
    const bbdData = bbdRef && !Array.isArray(bbdRef)
      ? includedMap.get(`${bbdRef.type}:${bbdRef.id}`)
      : undefined;

    // Resolve first betaBuildLocalization for whatsNew
    const bblRef = b.relationships?.betaBuildLocalizations?.data;
    const bblIds = Array.isArray(bblRef) ? bblRef : bblRef ? [bblRef] : [];
    const firstLocalization = bblIds.length > 0
      ? includedMap.get(`${bblIds[0].type}:${bblIds[0].id}`)
      : undefined;

    const processingState = attrs.processingState as string;
    const externalBuildState = bbdData?.attributes?.externalBuildState as string | null ?? null;
    const internalBuildState = bbdData?.attributes?.internalBuildState as string | null ?? null;
    const expired = (attrs.expired as boolean) ?? false;

    // Icon URL
    const iconToken = attrs.iconAssetToken as { templateUrl: string } | null;
    const iconUrl = iconToken?.templateUrl ? buildIconUrl(iconToken.templateUrl, 64) : null;

    const metrics = metricsMap.get(b.id);

    return {
      id: b.id,
      buildNumber: attrs.version as string,
      versionString: prvData?.attributes?.version as string ?? "",
      platform: prvData?.attributes?.platform as string ?? "IOS",
      status: deriveBuildStatus(processingState, externalBuildState, internalBuildState, expired),
      internalBuildState,
      externalBuildState,
      uploadedDate: attrs.uploadedDate as string,
      expirationDate: (attrs.expirationDate as string) ?? null,
      expired,
      minOsVersion: (attrs.minOsVersion as string) ?? null,
      whatsNew: (firstLocalization?.attributes?.whatsNew as string) ?? null,
      whatsNewLocalizationId: firstLocalization?.id ?? null,
      groupIds: buildToGroupIds.get(b.id) ?? [],
      iconUrl,
      installs: metrics?.installs ?? 0,
      sessions: metrics?.sessions ?? 0,
      crashes: metrics?.crashes ?? 0,
    };
  });

  cacheSet(cacheKey, builds, BUILDS_TTL);
  return builds;
}

// ── Build metrics ────────────────────────────────────────────────

interface BuildMetrics {
  installs: number;
  sessions: number;
  crashes: number;
}

async function fetchBuildMetrics(
  buildIds: string[],
): Promise<Map<string, BuildMetrics>> {
  const map = new Map<string, BuildMetrics>();
  if (buildIds.length === 0) return map;

  // Batch in groups of 10 to avoid overwhelming the API
  const batchSize = 10;
  for (let i = 0; i < buildIds.length; i += batchSize) {
    const batch = buildIds.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (id) => {
        try {
          const response = await ascFetch<Record<string, unknown>>(
            `/v1/builds/${id}/metrics/betaBuildUsages`,
          );
          let installs = 0, sessions = 0, crashes = 0;

          // Metrics endpoints return { data: [{ dataPoints: [{ values: { ... } }] }] }
          const dataArr = Array.isArray(response.data) ? response.data : [];
          for (const item of dataArr as Record<string, unknown>[]) {
            const dataPoints = Array.isArray(item.dataPoints) ? item.dataPoints : [];
            for (const dp of dataPoints as Record<string, unknown>[]) {
              const values = dp.values as Record<string, number> | undefined;
              if (values) {
                installs += values.installCount ?? 0;
                sessions += values.sessionCount ?? 0;
                crashes += values.crashCount ?? 0;
              }
            }
          }

          map.set(id, { installs, sessions, crashes });
        } catch (err) {
          // Metrics are best-effort – don't fail the whole build list
          console.warn(`[testflight] build ${id} metrics failed:`, err);
          map.set(id, { installs: 0, sessions: 0, crashes: 0 });
        }
      }),
    );
    // Log failures silently
    for (const r of results) {
      if (r.status === "rejected") {
        console.warn("[testflight] build metrics fetch failed:", r.reason);
      }
    }
  }

  return map;
}

// ── Groups ───────────────────────────────────────────────────────

export async function listGroups(
  appId: string,
  forceRefresh = false,
): Promise<TFGroup[]> {
  const cacheKey = `tf-groups:${appId}`;

  if (!forceRefresh) {
    const cached = cacheGet<TFGroup[]>(cacheKey);
    if (cached) return cached;
  }

  const params = new URLSearchParams({
    "filter[app]": appId,
    "fields[betaGroups]": "name,isInternalGroup,publicLinkEnabled,publicLink,publicLinkLimit,publicLinkLimitEnabled,feedbackEnabled,hasAccessToAllBuilds,createdDate",
    limit: "50",
  });

  const response = await ascFetch<AscJsonApiResponse>(
    `/v1/betaGroups?${params}`,
  );

  const dataArr = Array.isArray(response.data) ? response.data : [response.data];

  // Fetch tester and build counts per group in parallel
  const countResults = await Promise.allSettled(
    dataArr.map(async (g) => {
      const [testersRes, buildsRes] = await Promise.all([
        ascFetch<AscJsonApiResponse>(`/v1/betaGroups/${g.id}/betaTesters?limit=1`).catch(() => null),
        ascFetch<AscJsonApiResponse>(`/v1/betaGroups/${g.id}/builds?limit=1`).catch(() => null),
      ]);
      // ASC returns a meta.paging.total for list endpoints
      const testerCount = (testersRes as any)?.meta?.paging?.total ?? 0;
      const buildCount = (buildsRes as any)?.meta?.paging?.total ?? 0;
      return { groupId: g.id, testerCount, buildCount };
    }),
  );

  const countsMap = new Map<string, { testerCount: number; buildCount: number }>();
  for (const result of countResults) {
    if (result.status === "fulfilled") {
      countsMap.set(result.value.groupId, result.value);
    }
  }

  const groups: TFGroup[] = dataArr.map((g) => {
    const attrs = g.attributes;
    const counts = countsMap.get(g.id);
    return {
      id: g.id,
      name: attrs.name as string,
      isInternal: (attrs.isInternalGroup as boolean) ?? false,
      testerCount: counts?.testerCount ?? 0,
      buildCount: counts?.buildCount ?? 0,
      publicLinkEnabled: (attrs.publicLinkEnabled as boolean) ?? false,
      publicLink: (attrs.publicLink as string) ?? null,
      publicLinkLimit: (attrs.publicLinkLimit as number) ?? null,
      publicLinkLimitEnabled: (attrs.publicLinkLimitEnabled as boolean) ?? false,
      feedbackEnabled: (attrs.feedbackEnabled as boolean) ?? false,
      hasAccessToAllBuilds: (attrs.hasAccessToAllBuilds as boolean) ?? false,
      createdDate: attrs.createdDate as string,
    };
  });

  cacheSet(cacheKey, groups, GROUPS_TTL);
  return groups;
}

// ── Build-to-group cross-reference ───────────────────────────────
// The ASC endpoint /v1/builds/{id}/betaGroups returns empty (known quirk).
// Instead, for each group we fetch its builds and build the reverse map.

async function resolveBuildGroupMap(
  appId: string,
): Promise<Map<string, string[]>> {
  const groups = await listGroups(appId);
  const map = new Map<string, string[]>();

  const results = await Promise.allSettled(
    groups.map(async (group) => {
      const res = await ascFetch<AscJsonApiResponse>(
        `/v1/betaGroups/${group.id}/builds?fields[builds]=version&limit=200`,
      );
      const builds = Array.isArray(res.data) ? res.data : res.data ? [res.data] : [];
      return { groupId: group.id, buildIds: builds.map((b) => b.id) };
    }),
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      for (const buildId of result.value.buildIds) {
        const existing = map.get(buildId) ?? [];
        existing.push(result.value.groupId);
        map.set(buildId, existing);
      }
    }
  }

  return map;
}

// ── Group detail ─────────────────────────────────────────────────

export async function getGroupDetail(
  groupId: string,
  forceRefresh = false,
): Promise<TFGroupDetail | null> {
  const cacheKey = `tf-group:${groupId}`;

  if (!forceRefresh) {
    const cached = cacheGet<TFGroupDetail>(cacheKey);
    if (cached) return cached;
  }

  // Fetch group, its builds, and its testers in parallel
  const [groupRes, buildsRes, testersRes] = await Promise.all([
    ascFetch<AscJsonApiResponse>(
      `/v1/betaGroups/${groupId}?fields[betaGroups]=name,isInternalGroup,publicLinkEnabled,publicLink,publicLinkLimit,publicLinkLimitEnabled,feedbackEnabled,hasAccessToAllBuilds,createdDate`,
    ),
    ascFetch<AscJsonApiResponse>(
      `/v1/betaGroups/${groupId}/builds?fields[builds]=version,uploadedDate,processingState,expirationDate,expired,iconAssetToken&include=preReleaseVersion,buildBetaDetail&fields[preReleaseVersions]=version,platform&fields[buildBetaDetails]=internalBuildState,externalBuildState&limit=200&sort=-uploadedDate`,
    ),
    ascFetch<AscJsonApiResponse>(
      `/v1/betaGroups/${groupId}/betaTesters?fields[betaTesters]=firstName,lastName,email,inviteType,state&limit=200`,
    ),
  ]);

  // Parse group
  const gData = Array.isArray(groupRes.data) ? groupRes.data[0] : groupRes.data;
  if (!gData) return null;
  const gAttrs = gData.attributes;

  const testerDataArr = Array.isArray(testersRes.data) ? testersRes.data : testersRes.data ? [testersRes.data] : [];
  const buildDataArr = Array.isArray(buildsRes.data) ? buildsRes.data : buildsRes.data ? [buildsRes.data] : [];

  const group: TFGroup = {
    id: gData.id,
    name: gAttrs.name as string,
    isInternal: (gAttrs.isInternalGroup as boolean) ?? false,
    testerCount: testerDataArr.length,
    buildCount: buildDataArr.length,
    publicLinkEnabled: (gAttrs.publicLinkEnabled as boolean) ?? false,
    publicLink: (gAttrs.publicLink as string) ?? null,
    publicLinkLimit: (gAttrs.publicLinkLimit as number) ?? null,
    publicLinkLimitEnabled: (gAttrs.publicLinkLimitEnabled as boolean) ?? false,
    feedbackEnabled: (gAttrs.feedbackEnabled as boolean) ?? false,
    hasAccessToAllBuilds: (gAttrs.hasAccessToAllBuilds as boolean) ?? false,
    createdDate: gAttrs.createdDate as string,
  };

  // Parse builds
  const buildIncludedMap = new Map<string, AscJsonApiResource>();
  if (buildsRes.included) {
    for (const inc of buildsRes.included) {
      buildIncludedMap.set(`${inc.type}:${inc.id}`, inc);
    }
  }

  const builds: TFBuild[] = buildDataArr.map((b) => {
    const attrs = b.attributes;
    const prvRef = b.relationships?.preReleaseVersion?.data;
    const prvData = prvRef && !Array.isArray(prvRef)
      ? buildIncludedMap.get(`preReleaseVersions:${prvRef.id}`)
      : undefined;
    const bbdRef = b.relationships?.buildBetaDetail?.data;
    const bbdData = bbdRef && !Array.isArray(bbdRef)
      ? buildIncludedMap.get(`buildBetaDetails:${bbdRef.id}`)
      : undefined;

    const processingState = attrs.processingState as string;
    const externalBuildState = bbdData?.attributes?.externalBuildState as string | null ?? null;
    const internalBuildState = bbdData?.attributes?.internalBuildState as string | null ?? null;
    const expired = (attrs.expired as boolean) ?? false;
    const iconToken = attrs.iconAssetToken as { templateUrl: string } | null;

    return {
      id: b.id,
      buildNumber: attrs.version as string,
      versionString: prvData?.attributes?.version as string ?? "",
      platform: prvData?.attributes?.platform as string ?? "IOS",
      status: deriveBuildStatus(processingState, externalBuildState, internalBuildState, expired),
      internalBuildState,
      externalBuildState,
      uploadedDate: attrs.uploadedDate as string,
      expirationDate: (attrs.expirationDate as string) ?? null,
      expired,
      minOsVersion: null,
      whatsNew: null,
      whatsNewLocalizationId: null,
      groupIds: [groupId],
      iconUrl: iconToken?.templateUrl ? buildIconUrl(iconToken.templateUrl, 64) : null,
      installs: 0,
      sessions: 0,
      crashes: 0,
    };
  });

  // Parse testers
  const testers: TFTester[] = testerDataArr.map((t) => {
    const attrs = t.attributes;
    return {
      id: t.id,
      firstName: (attrs.firstName as string) ?? "Anonymous",
      lastName: (attrs.lastName as string) ?? "",
      email: (attrs.email as string) ?? null,
      inviteType: (attrs.inviteType as string) ?? "EMAIL",
      state: (attrs.state as string) ?? "NOT_INVITED",
      sessions: 0,
      crashes: 0,
      feedbackCount: 0,
    };
  });

  // Try to fetch tester metrics
  const testerMetrics = await fetchTesterMetrics(groupId);
  if (testerMetrics.size > 0) {
    for (const tester of testers) {
      const metrics = testerMetrics.get(tester.id);
      if (metrics) {
        tester.sessions = metrics.sessions;
        tester.crashes = metrics.crashes;
        tester.feedbackCount = metrics.feedbackCount;
      }
    }
  }

  const detail: TFGroupDetail = { group, builds, testers };
  cacheSet(cacheKey, detail, GROUP_DETAIL_TTL);
  return detail;
}

// ── Tester metrics ───────────────────────────────────────────────

interface TesterMetrics {
  sessions: number;
  crashes: number;
  feedbackCount: number;
}

async function fetchTesterMetrics(
  groupId: string,
): Promise<Map<string, TesterMetrics>> {
  const map = new Map<string, TesterMetrics>();

  try {
    const response = await ascFetch<AscJsonApiResponse>(
      `/v1/betaGroups/${groupId}/metrics/betaTesterUsages`,
    );
    const dataArr = Array.isArray(response.data) ? response.data : response.data ? [response.data] : [];
    for (const item of dataArr) {
      const attrs = item.attributes;
      map.set(item.id, {
        sessions: (attrs.sessionCount as number) ?? 0,
        crashes: (attrs.crashCount as number) ?? 0,
        feedbackCount: (attrs.feedbackCount as number) ?? 0,
      });
    }
  } catch {
    // Tester metrics are best-effort
  }

  return map;
}

// ── Beta app info ────────────────────────────────────────────────

export async function getBetaAppInfo(
  appId: string,
  forceRefresh = false,
): Promise<TFBetaAppInfo> {
  const cacheKey = `tf-info:${appId}`;

  if (!forceRefresh) {
    const cached = cacheGet<TFBetaAppInfo>(cacheKey);
    if (cached) return cached;
  }

  const [locRes, reviewRes, licenseRes] = await Promise.all([
    ascFetch<AscJsonApiResponse>(
      `/v1/betaAppLocalizations?filter[app]=${appId}&fields[betaAppLocalizations]=description,feedbackEmail,locale,marketingUrl,privacyPolicyUrl`,
    ),
    ascFetch<AscJsonApiResponse>(
      `/v1/betaAppReviewDetails?filter[app]=${appId}&fields[betaAppReviewDetails]=contactEmail,contactFirstName,contactLastName,contactPhone,demoAccountName,demoAccountPassword,demoAccountRequired,notes`,
    ),
    ascFetch<AscJsonApiResponse>(
      `/v1/betaLicenseAgreements?filter[app]=${appId}&fields[betaLicenseAgreements]=agreementText`,
    ),
  ]);

  // Localizations
  const locArr = Array.isArray(locRes.data) ? locRes.data : locRes.data ? [locRes.data] : [];
  const localizations: TFBetaAppLocalization[] = locArr.map((l) => ({
    id: l.id,
    locale: l.attributes.locale as string,
    description: (l.attributes.description as string) ?? null,
    feedbackEmail: (l.attributes.feedbackEmail as string) ?? null,
    marketingUrl: (l.attributes.marketingUrl as string) ?? null,
    privacyPolicyUrl: (l.attributes.privacyPolicyUrl as string) ?? null,
  }));

  // Review detail
  const reviewArr = Array.isArray(reviewRes.data) ? reviewRes.data : reviewRes.data ? [reviewRes.data] : [];
  const reviewData = reviewArr[0];
  const reviewDetail: TFBetaReviewDetail | null = reviewData
    ? {
        id: reviewData.id,
        contactFirstName: (reviewData.attributes.contactFirstName as string) ?? null,
        contactLastName: (reviewData.attributes.contactLastName as string) ?? null,
        contactPhone: (reviewData.attributes.contactPhone as string) ?? null,
        contactEmail: (reviewData.attributes.contactEmail as string) ?? null,
        demoAccountRequired: (reviewData.attributes.demoAccountRequired as boolean) ?? false,
        demoAccountName: (reviewData.attributes.demoAccountName as string) ?? null,
        demoAccountPassword: (reviewData.attributes.demoAccountPassword as string) ?? null,
        notes: (reviewData.attributes.notes as string) ?? null,
      }
    : null;

  // License agreement
  const licenseArr = Array.isArray(licenseRes.data) ? licenseRes.data : licenseRes.data ? [licenseRes.data] : [];
  const licenseData = licenseArr[0];
  const licenseAgreement: TFBetaLicenseAgreement | null = licenseData
    ? {
        id: licenseData.id,
        agreementText: (licenseData.attributes.agreementText as string) ?? null,
      }
    : null;

  const info: TFBetaAppInfo = { localizations, reviewDetail, licenseAgreement };
  cacheSet(cacheKey, info, INFO_TTL);
  return info;
}

// ── Mutations ────────────────────────────────────────────────────

export async function updateBetaBuildLocalization(
  locId: string,
  whatsNew: string,
): Promise<void> {
  await ascFetch(`/v1/betaBuildLocalizations/${locId}`, {
    method: "PATCH",
    body: JSON.stringify({
      data: {
        type: "betaBuildLocalizations",
        id: locId,
        attributes: { whatsNew },
      },
    }),
  });
  cacheInvalidatePrefix("tf-builds:");
}

export async function updateBetaAppLocalization(
  locId: string,
  fields: Partial<{
    description: string;
    feedbackEmail: string;
    marketingUrl: string;
    privacyPolicyUrl: string;
  }>,
): Promise<void> {
  await ascFetch(`/v1/betaAppLocalizations/${locId}`, {
    method: "PATCH",
    body: JSON.stringify({
      data: {
        type: "betaAppLocalizations",
        id: locId,
        attributes: fields,
      },
    }),
  });
  cacheInvalidatePrefix("tf-info:");
}

export async function updateBetaAppReviewDetail(
  detailId: string,
  fields: Partial<{
    contactFirstName: string;
    contactLastName: string;
    contactPhone: string;
    contactEmail: string;
    demoAccountRequired: boolean;
    demoAccountName: string;
    demoAccountPassword: string;
    notes: string;
  }>,
): Promise<void> {
  await ascFetch(`/v1/betaAppReviewDetails/${detailId}`, {
    method: "PATCH",
    body: JSON.stringify({
      data: {
        type: "betaAppReviewDetails",
        id: detailId,
        attributes: fields,
      },
    }),
  });
  cacheInvalidatePrefix("tf-info:");
}

export async function updateBetaLicenseAgreement(
  agreementId: string,
  agreementText: string,
): Promise<void> {
  await ascFetch(`/v1/betaLicenseAgreements/${agreementId}`, {
    method: "PATCH",
    body: JSON.stringify({
      data: {
        type: "betaLicenseAgreements",
        id: agreementId,
        attributes: { agreementText },
      },
    }),
  });
  cacheInvalidatePrefix("tf-info:");
}

// ── Build group mutations ─────────────────────────────────────────

export async function addBuildToGroups(
  buildId: string,
  groupIds: string[],
): Promise<void> {
  await ascFetch(`/v1/builds/${buildId}/relationships/betaGroups`, {
    method: "POST",
    body: JSON.stringify({
      data: groupIds.map((id) => ({ type: "betaGroups", id })),
    }),
  });
  cacheInvalidatePrefix("tf-builds:");
  cacheInvalidatePrefix("tf-groups:");
}

export async function removeBuildFromGroups(
  buildId: string,
  groupIds: string[],
): Promise<void> {
  await ascFetch(`/v1/builds/${buildId}/relationships/betaGroups`, {
    method: "DELETE",
    body: JSON.stringify({
      data: groupIds.map((id) => ({ type: "betaGroups", id })),
    }),
  });
  cacheInvalidatePrefix("tf-builds:");
  cacheInvalidatePrefix("tf-groups:");
}

// ── Individual testers on builds ──────────────────────────────────

export async function listBuildIndividualTesters(
  buildId: string,
): Promise<TFTester[]> {
  const response = await ascFetch<AscJsonApiResponse>(
    `/v1/builds/${buildId}/individualTesters?fields[betaTesters]=firstName,lastName,email,inviteType,state&limit=200`,
  );

  const dataArr = Array.isArray(response.data)
    ? response.data
    : response.data ? [response.data] : [];

  return dataArr.map((t) => {
    const attrs = t.attributes;
    return {
      id: t.id,
      firstName: (attrs.firstName as string) ?? "Anonymous",
      lastName: (attrs.lastName as string) ?? "",
      email: (attrs.email as string) ?? null,
      inviteType: (attrs.inviteType as string) ?? "EMAIL",
      state: (attrs.state as string) ?? "NOT_INVITED",
      sessions: 0,
      crashes: 0,
      feedbackCount: 0,
    };
  });
}

export async function addIndividualTestersToBuild(
  buildId: string,
  testerIds: string[],
): Promise<void> {
  await ascFetch(`/v1/builds/${buildId}/relationships/individualTesters`, {
    method: "POST",
    body: JSON.stringify({
      data: testerIds.map((id) => ({ type: "betaTesters", id })),
    }),
  });
}

export async function removeIndividualTestersFromBuild(
  buildId: string,
  testerIds: string[],
): Promise<void> {
  await ascFetch(`/v1/builds/${buildId}/relationships/individualTesters`, {
    method: "DELETE",
    body: JSON.stringify({
      data: testerIds.map((id) => ({ type: "betaTesters", id })),
    }),
  });
}

// ── App-level beta testers ────────────────────────────────────────

export async function listAppBetaTesters(
  appId: string,
): Promise<TFTester[]> {
  const response = await ascFetch<AscJsonApiResponse>(
    `/v1/betaTesters?filter[apps]=${appId}&fields[betaTesters]=firstName,lastName,email,inviteType,state&limit=200`,
  );

  const dataArr = Array.isArray(response.data)
    ? response.data
    : response.data ? [response.data] : [];

  return dataArr.map((t) => {
    const attrs = t.attributes;
    return {
      id: t.id,
      firstName: (attrs.firstName as string) ?? "Anonymous",
      lastName: (attrs.lastName as string) ?? "",
      email: (attrs.email as string) ?? null,
      inviteType: (attrs.inviteType as string) ?? "EMAIL",
      state: (attrs.state as string) ?? "NOT_INVITED",
      sessions: 0,
      crashes: 0,
      feedbackCount: 0,
    };
  });
}

export async function createBetaTester(
  appId: string,
  email: string,
  firstName?: string,
  lastName?: string,
): Promise<string> {
  const attributes: Record<string, string> = { email };
  if (firstName) attributes.firstName = firstName;
  if (lastName) attributes.lastName = lastName;

  const response = await ascFetch<{ data: { id: string } }>(
    `/v1/betaTesters`,
    {
      method: "POST",
      body: JSON.stringify({
        data: {
          type: "betaTesters",
          attributes,
          relationships: {
            apps: {
              data: [{ type: "apps", id: appId }],
            },
          },
        },
      }),
    },
  );

  return response.data.id;
}

// ── Cache invalidation helpers ───────────────────────────────────

export function invalidateTestFlightCache(appId: string): void {
  cacheInvalidatePrefix(`tf-builds:${appId}`);
  cacheInvalidatePrefix(`tf-groups:${appId}`);
  cacheInvalidatePrefix(`tf-info:${appId}`);
}
