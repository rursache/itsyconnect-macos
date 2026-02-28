"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CircleNotch, ArrowClockwise, FloppyDisk } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useRegisterRefresh } from "@/lib/refresh-context";
import type {
  TFBetaAppInfo,
  TFBetaAppLocalization,
  TFBetaReviewDetail,
  TFBetaLicenseAgreement,
} from "@/lib/asc/testflight";

function CharCount({ value, limit }: { value: string; limit?: number }) {
  const count = value?.length ?? 0;
  if (!limit) return null;
  const over = count > limit;

  return (
    <span
      className={`text-xs tabular-nums ${over ? "font-medium text-destructive" : "text-muted-foreground"}`}
    >
      {count}/{limit}
    </span>
  );
}

export default function TestFlightInfoPage() {
  const { appId } = useParams<{ appId: string }>();

  const [info, setInfo] = useState<TFBetaAppInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editable state (initialised from fetched data)
  const [localization, setLocalization] = useState<TFBetaAppLocalization | null>(null);
  const [review, setReview] = useState<TFBetaReviewDetail | null>(null);
  const [licenseText, setLicenseText] = useState("");
  const [licenseAgreement, setLicenseAgreement] = useState<TFBetaLicenseAgreement | null>(null);

  // Saving states
  const [savingLoc, setSavingLoc] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [savingLicense, setSavingLicense] = useState(false);

  const fetchData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const qs = forceRefresh ? "?refresh=1" : "";
      const res = await fetch(`/api/apps/${appId}/testflight/info${qs}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Failed to fetch info (${res.status})`);
      }
      const data = await res.json();
      const fetchedInfo: TFBetaAppInfo = data.info;
      setInfo(fetchedInfo);

      // Initialise editable state
      if (fetchedInfo.localizations.length > 0) {
        setLocalization({ ...fetchedInfo.localizations[0] });
      }
      if (fetchedInfo.reviewDetail) {
        setReview({ ...fetchedInfo.reviewDetail });
      }
      setLicenseAgreement(fetchedInfo.licenseAgreement);
      setLicenseText(fetchedInfo.licenseAgreement?.agreementText ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch info");
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => fetchData(true), [fetchData]);
  useRegisterRefresh({ onRefresh: handleRefresh, busy: loading });

  function updateLocField(field: keyof TFBetaAppLocalization, value: string) {
    setLocalization((prev) => prev ? { ...prev, [field]: value } : prev);
  }

  function updateReviewField(field: keyof TFBetaReviewDetail, value: string | boolean) {
    setReview((prev) => prev ? { ...prev, [field]: value } : prev);
  }

  async function saveLocalization() {
    if (!localization) return;
    setSavingLoc(true);
    try {
      const res = await fetch(`/api/apps/${appId}/testflight/info`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateLocalization",
          localizationId: localization.id,
          fields: {
            description: localization.description ?? "",
            feedbackEmail: localization.feedbackEmail ?? "",
            marketingUrl: localization.marketingUrl ?? "",
            privacyPolicyUrl: localization.privacyPolicyUrl ?? "",
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save");
      }
      toast.success("Beta app information saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingLoc(false);
    }
  }

  async function saveReviewDetail() {
    if (!review) return;
    setSavingReview(true);
    try {
      const res = await fetch(`/api/apps/${appId}/testflight/info`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateReviewDetail",
          detailId: review.id,
          fields: {
            contactFirstName: review.contactFirstName ?? "",
            contactLastName: review.contactLastName ?? "",
            contactPhone: review.contactPhone ?? "",
            contactEmail: review.contactEmail ?? "",
            demoAccountRequired: review.demoAccountRequired,
            demoAccountName: review.demoAccountName ?? "",
            demoAccountPassword: review.demoAccountPassword ?? "",
            notes: review.notes ?? "",
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save");
      }
      toast.success("Review information saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingReview(false);
    }
  }

  async function saveLicense() {
    if (!licenseAgreement) return;
    setSavingLicense(true);
    try {
      const res = await fetch(`/api/apps/${appId}/testflight/info`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateLicense",
          agreementId: licenseAgreement.id,
          agreementText: licenseText,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save");
      }
      toast.success("License agreement saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingLicense(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <CircleNotch size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-sm text-muted-foreground">
        <p>{error}</p>
        <Button variant="outline" size="sm" onClick={() => fetchData()}>
          <ArrowClockwise size={14} className="mr-1.5" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Beta app information */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="section-title">Beta app information</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={saveLocalization}
            disabled={savingLoc || !localization}
          >
            {savingLoc ? (
              <CircleNotch size={14} className="mr-1.5 animate-spin" />
            ) : (
              <FloppyDisk size={14} className="mr-1.5" />
            )}
            Save
          </Button>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Description</label>
          <Card className="gap-0 py-0">
            <CardContent className="px-5 py-4">
              <Textarea
                value={localization?.description ?? ""}
                onChange={(e) => updateLocField("description", e.target.value)}
                placeholder="Describe what testers should try..."
                className="border-0 p-0 shadow-none focus-visible:ring-0 resize-none font-mono text-sm min-h-0 dark:bg-transparent"
              />
            </CardContent>
            <div className="flex items-center rounded-b-xl border-t bg-sidebar px-3 py-1.5">
              <CharCount value={localization?.description ?? ""} limit={4000} />
            </div>
          </Card>
        </div>

        {/* URLs */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Feedback email</label>
            <Input
              value={localization?.feedbackEmail ?? ""}
              onChange={(e) => updateLocField("feedbackEmail", e.target.value)}
              placeholder="beta@example.com"
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Marketing URL</label>
            <Input
              value={localization?.marketingUrl ?? ""}
              onChange={(e) => updateLocField("marketingUrl", e.target.value)}
              placeholder="https://example.com"
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm text-muted-foreground">Privacy policy URL</label>
            <Input
              value={localization?.privacyPolicyUrl ?? ""}
              onChange={(e) => updateLocField("privacyPolicyUrl", e.target.value)}
              placeholder="https://example.com/privacy"
              className="font-mono text-sm"
            />
          </div>
        </div>
      </section>

      {/* Beta app review information */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="section-title">Beta app review information</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={saveReviewDetail}
            disabled={savingReview || !review}
          >
            {savingReview ? (
              <CircleNotch size={14} className="mr-1.5 animate-spin" />
            ) : (
              <FloppyDisk size={14} className="mr-1.5" />
            )}
            Save
          </Button>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Contact fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">First name</label>
              <Input
                value={review?.contactFirstName ?? ""}
                onChange={(e) => updateReviewField("contactFirstName", e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Last name</label>
              <Input
                value={review?.contactLastName ?? ""}
                onChange={(e) => updateReviewField("contactLastName", e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Phone</label>
              <Input
                value={review?.contactPhone ?? ""}
                onChange={(e) => updateReviewField("contactPhone", e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Email</label>
              <Input
                value={review?.contactEmail ?? ""}
                onChange={(e) => updateReviewField("contactEmail", e.target.value)}
                type="email"
                className="font-mono text-sm"
              />
            </div>
          </div>

          {/* Review notes */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Review notes</label>
            <Card className="gap-0 py-0">
              <CardContent className="px-5 py-4">
                <Textarea
                  value={review?.notes ?? ""}
                  onChange={(e) => updateReviewField("notes", e.target.value)}
                  placeholder="Notes for the App Review team..."
                  className="border-0 p-0 shadow-none focus-visible:ring-0 resize-none font-mono text-sm min-h-0 dark:bg-transparent"
                />
              </CardContent>
              <div className="flex items-center rounded-b-xl border-t bg-sidebar px-3 py-1.5">
                <CharCount value={review?.notes ?? ""} limit={4000} />
              </div>
            </Card>
          </div>
        </div>

        {/* Sign-in required */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              id="sign-in-required"
              checked={review?.demoAccountRequired ?? false}
              onCheckedChange={(v) => updateReviewField("demoAccountRequired", v)}
            />
            <Label htmlFor="sign-in-required" className="text-sm">
              Sign-in required
            </Label>
          </div>
          {review?.demoAccountRequired && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Demo username</label>
                <Input
                  value={review.demoAccountName ?? ""}
                  onChange={(e) => updateReviewField("demoAccountName", e.target.value)}
                  placeholder="demo@example.com"
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Demo password</label>
                <Input
                  value={review.demoAccountPassword ?? ""}
                  onChange={(e) => updateReviewField("demoAccountPassword", e.target.value)}
                  type="password"
                  placeholder="Password"
                  className="font-mono text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* License agreement */}
      <section className="space-y-2 pb-8">
        <div className="flex items-center justify-between">
          <h3 className="section-title">License agreement</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={saveLicense}
            disabled={savingLicense || !licenseAgreement}
          >
            {savingLicense ? (
              <CircleNotch size={14} className="mr-1.5 animate-spin" />
            ) : (
              <FloppyDisk size={14} className="mr-1.5" />
            )}
            Save
          </Button>
        </div>
        <Card className="gap-0 py-0">
          <CardContent className="px-5 py-4">
            <Textarea
              value={licenseText}
              onChange={(e) => setLicenseText(e.target.value)}
              placeholder="Enter your license agreement text..."
              className="border-0 p-0 shadow-none focus-visible:ring-0 resize-none font-mono text-sm min-h-0 dark:bg-transparent"
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
