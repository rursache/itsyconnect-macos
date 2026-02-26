import { appsGetCollection, appsGetInstance } from "appstore-connect-sdk";
import { getASCClient } from "./client";

export interface AppSummary {
  id: string;
  name: string;
  bundleId: string;
  sku: string;
  primaryLocale: string;
}

function toAppSummary(app: { id: string; attributes?: Record<string, unknown> }): AppSummary {
  return {
    id: app.id,
    name: (app.attributes?.name as string) ?? "",
    bundleId: (app.attributes?.bundleId as string) ?? "",
    sku: (app.attributes?.sku as string) ?? "",
    primaryLocale: (app.attributes?.primaryLocale as string) ?? "",
  };
}

export async function listApps(): Promise<AppSummary[]> {
  const client = await getASCClient();

  const res = await appsGetCollection({
    client,
    query: {
      "fields[apps]": ["name", "bundleId", "sku", "primaryLocale"],
      limit: 200,
    },
  });

  if (res.error) {
    throw new Error(`ASC API error: ${res.response.status}`);
  }

  return res.data?.data?.map(toAppSummary) ?? [];
}

export async function getApp(appId: string) {
  const client = await getASCClient();

  const res = await appsGetInstance({
    client,
    path: { id: appId },
  });

  if (res.error) {
    throw new Error(`ASC API error: ${res.response.status}`);
  }

  return res.data?.data;
}
