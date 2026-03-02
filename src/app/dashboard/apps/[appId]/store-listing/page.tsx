"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Lock } from "@phosphor-icons/react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-fetch";
import { useErrorReport } from "@/lib/error-report-context";
import type { SyncError } from "@/lib/api-helpers";
import { useApps } from "@/lib/apps-context";
import { useVersions } from "@/lib/versions-context";
import { useFormDirty } from "@/lib/form-dirty-context";
import { resolveVersion, EDITABLE_STATES } from "@/lib/asc/version-types";
import { useLocalizations } from "@/lib/hooks/use-localizations";
import type { AscLocalization } from "@/lib/asc/localizations";
import {
  localeName,
  sortLocales,
  FIELD_LIMITS,
  FIELD_MIN_LIMITS,
} from "@/lib/asc/locale-names";
import { useRegisterHeaderLocale } from "@/lib/header-locale-context";
import { useSubmissionChecklist } from "@/lib/submission-checklist-context";
import { useLocaleManagement } from "@/lib/hooks/use-locale-management";
import type { MagicWandLocaleProps } from "@/components/magic-wand-button";
import { BulkAIDialog, type BulkField } from "@/components/bulk-ai-dialog";
import { BulkAllAIDialog } from "@/components/bulk-all-ai-dialog";
import type { TFBuild } from "@/lib/asc/testflight/types";
import { type LocaleFields, emptyLocaleFields, LocaleFieldsSection } from "./_components/locale-fields";
import { VersionStringSection } from "./_components/version-string-section";
import { BuildSection } from "./_components/build-section";
import { ReleaseSettings } from "./_components/release-settings";
import { EmptyState } from "@/components/empty-state";


function buildLocaleData(
  localizations: AscLocalization[],
): Record<string, LocaleFields> {
  const data: Record<string, LocaleFields> = {};
  for (const loc of localizations) {
    data[loc.attributes.locale] = {
      description: loc.attributes.description ?? "",
      keywords: loc.attributes.keywords ?? "",
      whatsNew: loc.attributes.whatsNew ?? "",
      promotionalText: loc.attributes.promotionalText ?? "",
      supportUrl: loc.attributes.supportUrl ?? "",
      marketingUrl: loc.attributes.marketingUrl ?? "",
    };
  }
  return data;
}

export default function StoreListingPage() {
  const { appId } = useParams<{ appId: string }>();
  const searchParams = useSearchParams();
  const { apps } = useApps();
  const app = apps.find((a) => a.id === appId);
  const { versions, loading: versionsLoading, updateVersion } = useVersions();

  const selectedVersion = useMemo(
    () => resolveVersion(versions, searchParams.get("version")),
    [versions, searchParams],
  );
  const versionId = selectedVersion?.id ?? "";

  const readOnly = selectedVersion
    ? !EDITABLE_STATES.has(selectedVersion.attributes.appVersionState)
    : false;

  const { localizations, loading: locLoading } = useLocalizations(appId, versionId);

  const primaryLocale = app?.primaryLocale ?? "";

  const [localeData, setLocaleData] = useState<Record<string, LocaleFields>>({});

  const {
    locales, setLocales,
    selectedLocale, setSelectedLocale,
    changeLocale,
    otherSectionLocales,
  } = useLocaleManagement({ section: "store-listing", primaryLocale });

  const current = localeData[selectedLocale] ?? emptyLocaleFields();

  const wand: MagicWandLocaleProps = {
    locale: selectedLocale,
    baseLocale: locales[0] ?? "",
    localeData,
    appName: app?.name,
  };

  const { report: reportChecklist } = useSubmissionChecklist();
  const { setDirty, registerSave, registerDiscard, setValidationErrors } = useFormDirty();
  const { showAscError, showSyncErrors } = useErrorReport();

  const bulkFields: BulkField[] = [
    { key: "description", label: "Description", charLimit: FIELD_LIMITS.description },
    { key: "keywords", label: "Keywords", charLimit: FIELD_LIMITS.keywords },
    { key: "whatsNew", label: "What's new", charLimit: FIELD_LIMITS.whatsNew },
    { key: "promotionalText", label: "Promotional text", charLimit: FIELD_LIMITS.promotionalText },
  ];

  const [bulkMode, setBulkMode] = useState<"translate" | "copy" | null>(null);
  const [bulkAllMode, setBulkAllMode] = useState<{ mode: "translate" | "copy"; field?: string } | null>(null);

  function handleBulkApply(updates: Record<string, Record<string, string>>) {
    setLocaleData((prev) => {
      const next = { ...prev };
      for (const [locale, fields] of Object.entries(updates)) {
        next[locale] = { ...next[locale], ...fields } as LocaleFields;
      }
      return next;
    });
    setDirty(true);
    toast.success(
      bulkMode === "translate"
        ? "Translations applied to all locales"
        : "Copied to all locales",
    );
  }
  // Build picker state
  const [allBuilds, setAllBuilds] = useState<TFBuild[]>([]);
  const [selectedBuildId, setSelectedBuildId] = useState<string | null>(null);
  const originalBuildIdRef = useRef<string | null>(null);

  // Fetch all app builds for the picker
  useEffect(() => {
    if (!appId) return;
    fetch(`/api/apps/${appId}/testflight/builds`)
      .then((res) => (res.ok ? res.json() : { builds: [] }))
      .then((data) => setAllBuilds(data.builds ?? []))
      .catch(() => setAllBuilds([]));
  }, [appId]);

  const [releaseType, setReleaseType] = useState("manually");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [phasedRelease, setPhasedRelease] = useState(false);

  // Reset release settings when version changes (during render)
  const [prevVersionId, setPrevVersionId] = useState(versionId);
  if (versionId !== prevVersionId) {
    setPrevVersionId(versionId);
    if (selectedVersion) {
      const { releaseType: rt, earliestReleaseDate } = selectedVersion.attributes;
      if (rt === "SCHEDULED" || (rt === "AFTER_APPROVAL" && earliestReleaseDate)) {
        setReleaseType("after-date");
        if (earliestReleaseDate) setScheduledDate(new Date(earliestReleaseDate));
        else setScheduledDate(undefined);
      } else if (rt === "AFTER_APPROVAL") {
        setReleaseType("automatically");
        setScheduledDate(undefined);
      } else {
        setReleaseType("manually");
        setScheduledDate(undefined);
      }
      setPhasedRelease(selectedVersion.phasedRelease != null);

      const buildId = selectedVersion.build?.id ?? null;
      setSelectedBuildId(buildId);
      originalBuildIdRef.current = buildId;
    }
  }

  // Track original locale → localization ID mapping for diffing saves
  const originalLocaleIdsRef = useRef<Record<string, string>>({});

  // Reset locale data when localizations change (during render)
  const [prevLocalizations, setPrevLocalizations] = useState(localizations);
  if (localizations !== prevLocalizations) {
    setPrevLocalizations(localizations);
    const data = buildLocaleData(localizations);
    setLocaleData(data);
    const sorted = sortLocales(Object.keys(data), primaryLocale);
    setLocales(sorted);

    // Preserve current locale if still valid, else try URL param, else first
    setSelectedLocale((prev) => {
      if (prev && sorted.includes(prev)) return prev;
      const fromUrl = searchParams.get("locale");
      if (fromUrl && sorted.includes(fromUrl)) return fromUrl;
      return sorted[0] ?? "";
    });
    setDirty(false);
  }

  // Snapshot original locale → ID mapping for save diffing
  useEffect(() => {
    const ids: Record<string, string> = {};
    for (const loc of localizations) {
      ids[loc.attributes.locale] = loc.id;
    }
    originalLocaleIdsRef.current = ids;
  }, [localizations]);

  // Validate field limits across all locales
  useEffect(() => {
    const errors: string[] = [];
    const checked: [keyof LocaleFields, number][] = [
      ["description", FIELD_LIMITS.description],
      ["keywords", FIELD_LIMITS.keywords],
      ["whatsNew", FIELD_LIMITS.whatsNew],
      ["promotionalText", FIELD_LIMITS.promotionalText],
    ];
    const fieldLabels: Record<string, string> = {
      description: "Description",
      keywords: "Keywords",
      whatsNew: "What's new",
      promotionalText: "Promotional text",
    };
    for (const [locale, fields] of Object.entries(localeData)) {
      const name = localeName(locale);
      for (const [field, limit] of checked) {
        const len = fields[field].length;
        if (len > limit) {
          errors.push(`${fieldLabels[field]} (${len}/${limit}) in ${name}`);
        }
        const min = FIELD_MIN_LIMITS[field];
        if (min && len > 0 && len < min) {
          errors.push(`${fieldLabels[field]} must be at least ${min} characters in ${name}`);
        }
      }
    }
    setValidationErrors(errors);
  }, [localeData, setValidationErrors]);

  // Report submission checklist flags from primary locale
  useEffect(() => {
    const primary = localeData[primaryLocale];
    if (!primary) return;
    reportChecklist({
      hasDescription: (primary.description?.length ?? 0) > 0,
      hasWhatsNew: (primary.whatsNew?.length ?? 0) > 0,
      hasKeywords: (primary.keywords?.length ?? 0) > 0,
    });
  }, [localeData, primaryLocale, reportChecklist]);

  // Register save handler for the header Save button
  useEffect(() => {
    registerSave(async () => {
      const promises: Promise<void>[] = [];
      const allSyncErrors: SyncError[] = [];

      // When the version is read-only (live), only promotional text is
      // editable – send just that field to avoid ASC rejecting locked fields.
      const locPayload = readOnly
        ? Object.fromEntries(
            Object.entries(localeData).map(([locale, fields]) => [
              locale,
              { promotionalText: fields.promotionalText },
            ]),
          )
        : localeData;

      // Save localizations
      let locCreatedIds: Record<string, string> = {};
      promises.push(
        fetch(`/api/apps/${appId}/versions/${versionId}/localizations`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locales: locPayload,
            originalLocaleIds: originalLocaleIdsRef.current,
          }),
        }).then(async (res) => {
          const data = await res.json();
          if (!res.ok && !data.errors) throw new Error(data.error ?? "Save failed");
          if (data.errors?.length > 0) {
            allSyncErrors.push(...(data.errors as SyncError[]));
          }
          locCreatedIds = data.createdIds ?? {};
        }),
      );

      // Release settings are locked on live versions
      if (!readOnly) {
        const ascReleaseType = releaseType === "manually"
          ? "MANUAL"
          : releaseType === "after-date"
            ? "SCHEDULED"
            : "AFTER_APPROVAL";
        const earliestReleaseDate = releaseType === "after-date" && scheduledDate
          ? scheduledDate.toISOString()
          : null;

        promises.push(
          fetch(`/api/apps/${appId}/versions/${versionId}/release`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              releaseType: ascReleaseType,
              earliestReleaseDate,
              phasedRelease,
              phasedReleaseId: selectedVersion?.phasedRelease?.id ?? null,
            }),
          }).then(async (res) => {
            const data = await res.json();
            if (!res.ok && !data.errors) throw new Error(data.error ?? "Failed to save release settings");
            if (data.errors?.length > 0) {
              allSyncErrors.push(...(data.errors as SyncError[]));
            }
          }),
        );

        // Save build selection if changed
        if (selectedBuildId && selectedBuildId !== originalBuildIdRef.current) {
          promises.push(
            fetch(`/api/apps/${appId}/versions/${versionId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ buildId: selectedBuildId }),
            }).then(async (res) => {
              const data = await res.json();
              if (!res.ok) throw new Error(data.error ?? "Failed to save build selection");
            }),
          );
        }
      }

      try {
        await Promise.all(promises);
      } catch (err) {
        if (err instanceof ApiError && err.ascErrors?.length) {
          showAscError({
            message: err.message,
            ascErrors: err.ascErrors,
            ascMethod: err.ascMethod,
            ascPath: err.ascPath,
          });
        } else {
          toast.error(err instanceof Error ? err.message : "Save failed");
        }
        return;
      }

      if (allSyncErrors.length > 0) {
        showSyncErrors(allSyncErrors);
        return;
      }

      toast.success(readOnly ? "Promotional text saved" : "Store listing saved");

      // Update original snapshot with real IDs from created locales
      const ids = { ...originalLocaleIdsRef.current };
      for (const [locale, id] of Object.entries(locCreatedIds)) {
        ids[locale] = id;
      }
      for (const locale of Object.keys(ids)) {
        if (!localeData[locale]) delete ids[locale];
      }
      originalLocaleIdsRef.current = ids;

      // Update cached version with release settings + build
      if (!readOnly && selectedVersion) {
        const ascReleaseType = releaseType === "manually"
          ? "MANUAL"
          : releaseType === "after-date"
            ? "SCHEDULED"
            : "AFTER_APPROVAL";
        const earliestReleaseDate = releaseType === "after-date" && scheduledDate
          ? scheduledDate.toISOString()
          : null;

        // Find selected build from allBuilds to update the cached version
        const newBuild = selectedBuildId
          ? allBuilds.find((b) => b.id === selectedBuildId) ?? null
          : null;

        updateVersion(selectedVersion.id, (v) => ({
          ...v,
          attributes: {
            ...v.attributes,
            releaseType: ascReleaseType,
            earliestReleaseDate,
          },
          build: newBuild
            ? {
                id: newBuild.id,
                attributes: {
                  version: newBuild.buildNumber,
                  uploadedDate: newBuild.uploadedDate,
                  processingState: "VALID",
                  minOsVersion: newBuild.minOsVersion,
                  iconAssetToken: null,
                },
              }
            : v.build,
          phasedRelease: phasedRelease
            ? (v.phasedRelease ?? { id: "", attributes: { phasedReleaseState: "INACTIVE", currentDayNumber: null, startDate: null } })
            : null,
        }));

        // Update original ref so subsequent discards reflect the saved state
        if (selectedBuildId !== originalBuildIdRef.current) {
          originalBuildIdRef.current = selectedBuildId;
        }
      }

      setDirty(false);
    });
  }, [appId, versionId, localeData, readOnly, releaseType, scheduledDate, phasedRelease, selectedBuildId, allBuilds, selectedVersion, registerSave, setDirty, updateVersion, showAscError, showSyncErrors]);

  // Register discard handler for the header Discard button
  useEffect(() => {
    registerDiscard(() => {
      setLocaleData(buildLocaleData(localizations));
      if (selectedVersion) {
        const { releaseType: rt, earliestReleaseDate } = selectedVersion.attributes;
        if (rt === "SCHEDULED" || (rt === "AFTER_APPROVAL" && earliestReleaseDate)) {
          setReleaseType("after-date");
          if (earliestReleaseDate) setScheduledDate(new Date(earliestReleaseDate));
          else setScheduledDate(undefined);
        } else if (rt === "AFTER_APPROVAL") {
          setReleaseType("automatically");
          setScheduledDate(undefined);
        } else {
          setReleaseType("manually");
          setScheduledDate(undefined);
        }
        setPhasedRelease(selectedVersion.phasedRelease != null);
      }
      setSelectedBuildId(originalBuildIdRef.current);
    });
  }, [localizations, selectedVersion, registerDiscard]);

  function updateField(field: keyof LocaleFields, value: string) {
    setLocaleData((prev) => ({
      ...prev,
      [selectedLocale]: { ...prev[selectedLocale], [field]: value },
    }));
    setDirty(true);
  }

  function handleAddLocale(locale: string) {
    setLocaleData((prev) => {
      const base = prev[primaryLocale] ?? emptyLocaleFields();
      const next = { ...prev, [locale]: { ...base } };
      setLocales(sortLocales(Object.keys(next), primaryLocale));
      return next;
    });
    changeLocale(locale);
    setDirty(true);
    toast.success(`Added ${localeName(locale)}`);
  }

  function handleBulkAddLocales(codes: string[]) {
    setLocaleData((prev) => {
      const base = prev[primaryLocale] ?? emptyLocaleFields();
      const next = { ...prev };
      for (const code of codes) {
        if (!next[code]) next[code] = { ...base };
      }
      setLocales(sortLocales(Object.keys(next), primaryLocale));
      return next;
    });
    setDirty(true);
    toast.success(`Added ${codes.length} locales`);
  }

  function handleDeleteLocale(code: string) {
    const deletedData = localeData[code];
    setLocaleData((prev) => {
      const next = { ...prev };
      delete next[code];
      const sorted = sortLocales(Object.keys(next), primaryLocale);
      setLocales(sorted);
      if (selectedLocale === code) {
        changeLocale(sorted[0] ?? "");
      }
      return next;
    });
    setDirty(true);
    toast(`Removed ${localeName(code)}`, {
      action: {
        label: "Undo",
        onClick: () => {
          setLocaleData((prev) => {
            const next = { ...prev, [code]: deletedData ?? emptyLocaleFields() };
            setLocales(sortLocales(Object.keys(next), primaryLocale));
            return next;
          });
          setDirty(true);
        },
      },
    });
  }

  // Register locale picker in the header bar
  useRegisterHeaderLocale({
    locales,
    selectedLocale,
    primaryLocale,
    onLocaleChange: changeLocale,
    onLocaleAdd: handleAddLocale,
    onLocalesAdd: handleBulkAddLocales,
    onLocaleDelete: handleDeleteLocale,
    onBulkTranslate: () => setBulkMode("translate"),
    onBulkCopy: () => setBulkMode("copy"),
    onBulkTranslateAll: () => setBulkAllMode({ mode: "translate" }),
    onBulkCopyAll: () => setBulkAllMode({ mode: "copy" }),
    section: "store-listing",
    otherSectionLocales,
    readOnly,
  });

  if (!app) {
    return <EmptyState title="App not found" />;
  }

  if (versionsLoading || locLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <EmptyState
        title="No versions"
        description="Create a version to start editing your store listing."
      />
    );
  }

  const localeTag = selectedLocale && selectedLocale !== primaryLocale
    ? <span className="ml-1.5 inline-flex translate-y-[-1px] rounded bg-muted px-1.5 py-0.5 align-middle text-[11px] font-normal text-muted-foreground">{selectedLocale}</span>
    : null;

  return (
    <div className="space-y-6">
        {/* Read-only banner */}
        {readOnly && (
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            <Lock size={16} className="shrink-0" />
            This version is live – only promotional text can be updated
            without a new review.
          </div>
        )}

        {/* Version string */}
        <VersionStringSection
          appId={appId}
          version={selectedVersion}
          readOnly={readOnly}
          onUpdated={(newString) => {
            if (!selectedVersion) return;
            updateVersion(selectedVersion.id, (v) => ({
              ...v,
              attributes: { ...v.attributes, versionString: newString },
            }));
          }}
        />

        {locales.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No localizations for this version.
          </div>
        ) : (
          <LocaleFieldsSection
            current={current}
            localeTag={localeTag}
            readOnly={readOnly}
            onFieldChange={updateField}
            wand={wand}
            onBulkAllMode={(field) => setBulkAllMode({ mode: "translate", field })}
          />
        )}

        {/* Build */}
        <BuildSection
          allBuilds={allBuilds}
          selectedBuildId={selectedBuildId}
          versionBuild={selectedVersion?.build ?? null}
          versionString={selectedVersion?.attributes.versionString}
          onBuildChange={(id) => { setSelectedBuildId(id); setDirty(true); }}
          readOnly={readOnly}
        />

        <BulkAIDialog
          open={bulkMode !== null}
          onOpenChange={(open) => { if (!open) setBulkMode(null); }}
          mode={bulkMode ?? "copy"}
          targetLocale={selectedLocale}
          primaryLocale={primaryLocale}
          localeData={localeData}
          fields={bulkFields}
          appName={app?.name}
          onApply={handleBulkApply}
        />
        <BulkAllAIDialog
          open={bulkAllMode !== null}
          onOpenChange={(open) => { if (!open) setBulkAllMode(null); }}
          mode={bulkAllMode?.mode ?? "copy"}
          primaryLocale={primaryLocale}
          locales={locales}
          localeData={localeData}
          fields={bulkAllMode?.field ? bulkFields.filter((f) => f.key === bulkAllMode.field) : bulkFields}
          appName={app?.name}
          onApply={handleBulkApply}
        />

        {/* Release settings */}
        <ReleaseSettings
          releaseType={releaseType}
          onReleaseTypeChange={(v) => { setReleaseType(v); setDirty(true); }}
          scheduledDate={scheduledDate}
          onScheduledDateChange={(d) => { setScheduledDate(d); setDirty(true); }}
          phasedRelease={phasedRelease}
          onPhasedReleaseChange={(v) => { setPhasedRelease(v); setDirty(true); }}
          readOnly={readOnly}
        />
    </div>
  );
}
