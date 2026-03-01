export type {
  TFBuild,
  TFGroup,
  TFTester,
  TFBetaAppLocalization,
  TFBetaReviewDetail,
  TFBetaLicenseAgreement,
  TFBetaAppInfo,
  TFGroupDetail,
} from "./types";

export {
  listBuilds,
  fetchBuildMetrics,
  updateBetaBuildLocalization,
  addBuildToGroups,
  removeBuildFromGroups,
  submitForBetaReview,
  expireBuild,
  declareExportCompliance,
  notifyTesters,
} from "./builds";
export { listGroups, getGroupDetail, fetchTesterMetrics, createGroup, deleteGroup } from "./groups";
export {
  listBuildIndividualTesters,
  listAppBetaTesters,
  addIndividualTestersToBuild,
  removeIndividualTestersFromBuild,
  addTestersToGroup,
  removeTestersFromGroup,
  createBetaTester,
  sendBetaTesterInvitations,
} from "./testers";
export {
  getBetaAppInfo,
  updateBetaAppLocalization,
  updateBetaAppReviewDetail,
  updateBetaLicenseAgreement,
} from "./info";

// ── Cache invalidation (touches caches across domains) ───────────

import { cacheInvalidatePrefix } from "@/lib/cache";

export function invalidateTestFlightCache(appId: string): void {
  cacheInvalidatePrefix(`tf-builds:${appId}`);
  cacheInvalidatePrefix(`tf-groups:${appId}`);
  cacheInvalidatePrefix(`tf-info:${appId}`);
}
