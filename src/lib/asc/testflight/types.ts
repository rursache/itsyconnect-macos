// ── TTLs ─────────────────────────────────────────────────────────

export const BUILDS_TTL = 5 * 60 * 1000; // 5 min
export const GROUPS_TTL = 15 * 60 * 1000; // 15 min
export const GROUP_DETAIL_TTL = 5 * 60 * 1000; // 5 min
export const INFO_TTL = 60 * 60 * 1000; // 1 hr

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

export interface AscJsonApiResource {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
  relationships?: Record<string, { data?: { id: string; type: string } | Array<{ id: string; type: string }> | null }>;
}

export interface AscJsonApiResponse {
  data: AscJsonApiResource[] | AscJsonApiResource;
  included?: AscJsonApiResource[];
}

// ── Status derivation ────────────────────────────────────────────

export function deriveBuildStatus(
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
