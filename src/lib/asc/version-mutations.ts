import { ascFetch } from "./client";
import { cacheInvalidate } from "@/lib/cache";

export async function updateVersionAttributes(
  versionId: string,
  attributes: {
    releaseType?: string;
    earliestReleaseDate?: string | null;
  },
): Promise<void> {
  await ascFetch(`/v1/appStoreVersions/${versionId}`, {
    method: "PATCH",
    body: JSON.stringify({
      data: {
        type: "appStoreVersions",
        id: versionId,
        attributes,
      },
    }),
  });
}

export async function enablePhasedRelease(versionId: string): Promise<void> {
  await ascFetch("/v1/appStoreVersionPhasedReleases", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "appStoreVersionPhasedReleases",
        attributes: { phasedReleaseState: "INACTIVE" },
        relationships: {
          appStoreVersion: {
            data: { type: "appStoreVersions", id: versionId },
          },
        },
      },
    }),
  });
}

export async function disablePhasedRelease(
  phasedReleaseId: string,
): Promise<void> {
  await ascFetch(`/v1/appStoreVersionPhasedReleases/${phasedReleaseId}`, {
    method: "DELETE",
  });
}

export function invalidateVersionsCache(appId: string): void {
  cacheInvalidate(`versions:${appId}`);
}
