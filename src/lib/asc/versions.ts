import {
  appsAppStoreVersionsGetToManyRelated,
  appStoreVersionsGetInstance,
  appStoreVersionsAppStoreVersionLocalizationsGetToManyRelated,
  appStoreVersionLocalizationsUpdateInstance,
} from "appstore-connect-sdk";
import { getASCClient } from "./client";

export interface VersionSummary {
  id: string;
  versionString: string;
  platform: string;
  appVersionState: string;
  createdDate: string;
}

export interface VersionLocalization {
  id: string;
  locale: string;
  description: string | null;
  keywords: string | null;
  marketingUrl: string | null;
  promotionalText: string | null;
  supportUrl: string | null;
  whatsNew: string | null;
}

export async function listVersions(appId: string): Promise<VersionSummary[]> {
  const client = await getASCClient();

  const res = await appsAppStoreVersionsGetToManyRelated({
    client,
    path: { id: appId },
    query: {
      "fields[appStoreVersions]": [
        "versionString",
        "platform",
        "appVersionState",
        "createdDate",
      ],
      limit: 200,
    },
  });

  if (res.error) {
    throw new Error(`ASC API error: ${res.response.status}`);
  }

  return (
    res.data?.data?.map((v) => ({
      id: v.id,
      versionString: (v.attributes?.versionString as string) ?? "",
      platform: (v.attributes?.platform as string) ?? "",
      appVersionState: (v.attributes?.appVersionState as string) ?? "",
      createdDate: (v.attributes?.createdDate as string) ?? "",
    })) ?? []
  );
}

export async function getVersion(versionId: string) {
  const client = await getASCClient();

  const res = await appStoreVersionsGetInstance({
    client,
    path: { id: versionId },
  });

  if (res.error) {
    throw new Error(`ASC API error: ${res.response.status}`);
  }

  return res.data?.data;
}

export async function listLocalizations(
  versionId: string
): Promise<VersionLocalization[]> {
  const client = await getASCClient();

  const res =
    await appStoreVersionsAppStoreVersionLocalizationsGetToManyRelated({
      client,
      path: { id: versionId },
      query: {
        "fields[appStoreVersionLocalizations]": [
          "locale",
          "description",
          "keywords",
          "marketingUrl",
          "promotionalText",
          "supportUrl",
          "whatsNew",
        ],
        limit: 200,
      },
    });

  if (res.error) {
    throw new Error(`ASC API error: ${res.response.status}`);
  }

  return (
    res.data?.data?.map((l) => ({
      id: l.id,
      locale: (l.attributes?.locale as string) ?? "",
      description: (l.attributes?.description as string) ?? null,
      keywords: (l.attributes?.keywords as string) ?? null,
      marketingUrl: (l.attributes?.marketingUrl as string) ?? null,
      promotionalText: (l.attributes?.promotionalText as string) ?? null,
      supportUrl: (l.attributes?.supportUrl as string) ?? null,
      whatsNew: (l.attributes?.whatsNew as string) ?? null,
    })) ?? []
  );
}

export interface LocalizationUpdate {
  description?: string | null;
  keywords?: string | null;
  marketingUrl?: string | null;
  promotionalText?: string | null;
  supportUrl?: string | null;
  whatsNew?: string | null;
}

export async function updateLocalization(
  localizationId: string,
  update: LocalizationUpdate
): Promise<void> {
  const client = await getASCClient();

  const res = await appStoreVersionLocalizationsUpdateInstance({
    client,
    path: { id: localizationId },
    body: {
      data: {
        type: "appStoreVersionLocalizations",
        id: localizationId,
        attributes: update,
      },
    },
  });

  if (res.error) {
    throw new Error(`ASC API error: ${res.response.status}`);
  }
}
