import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getBetaAppInfo,
  updateBetaAppLocalization,
  updateBetaAppReviewDetail,
  updateBetaLicenseAgreement,
} from "@/lib/asc/testflight";
import { hasCredentials } from "@/lib/asc/client";
import { cacheGetMeta } from "@/lib/cache";
import { getMockBetaAppInfo } from "@/lib/mock-testflight";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ appId: string }> },
) {
  const { appId } = await params;
  const url = new URL(request.url);
  const forceRefresh = url.searchParams.get("refresh") === "1";

  if (!hasCredentials()) {
    const info = getMockBetaAppInfo(appId);
    return NextResponse.json({ info, meta: null });
  }

  try {
    const info = await getBetaAppInfo(appId, forceRefresh);
    const meta = cacheGetMeta(`tf-info:${appId}`);
    return NextResponse.json({ info, meta });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

const localizationSchema = z.object({
  action: z.literal("updateLocalization"),
  localizationId: z.string().min(1),
  fields: z.object({
    description: z.string().max(4000).optional(),
    feedbackEmail: z.string().optional(),
    marketingUrl: z.string().optional(),
    privacyPolicyUrl: z.string().optional(),
  }),
});

const reviewDetailSchema = z.object({
  action: z.literal("updateReviewDetail"),
  detailId: z.string().min(1),
  fields: z.object({
    contactFirstName: z.string().optional(),
    contactLastName: z.string().optional(),
    contactPhone: z.string().optional(),
    contactEmail: z.string().optional(),
    demoAccountRequired: z.boolean().optional(),
    demoAccountName: z.string().optional(),
    demoAccountPassword: z.string().optional(),
    notes: z.string().max(4000).optional(),
  }),
});

const licenseSchema = z.object({
  action: z.literal("updateLicense"),
  agreementId: z.string().min(1),
  agreementText: z.string(),
});

const patchSchema = z.discriminatedUnion("action", [
  localizationSchema,
  reviewDetailSchema,
  licenseSchema,
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ appId: string }> },
) {
  await params;

  if (!hasCredentials()) {
    return NextResponse.json({ error: "No ASC credentials" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    if (parsed.data.action === "updateLocalization") {
      await updateBetaAppLocalization(parsed.data.localizationId, parsed.data.fields);
      return NextResponse.json({ ok: true });
    }

    if (parsed.data.action === "updateReviewDetail") {
      await updateBetaAppReviewDetail(parsed.data.detailId, parsed.data.fields);
      return NextResponse.json({ ok: true });
    }

    // updateLicense
    await updateBetaLicenseAgreement(parsed.data.agreementId, parsed.data.agreementText);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
