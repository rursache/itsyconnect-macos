"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { AppWindow, CalendarBlank, Lock, PencilSimple, SpinnerGap } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useApps } from "@/lib/apps-context";
import { useVersions } from "@/lib/versions-context";
import { useFormDirty } from "@/lib/form-dirty-context";
import { resolveVersion, EDITABLE_STATES, STATE_DOT_COLORS, stateLabel } from "@/lib/asc/version-types";
import { useLocalizations } from "@/lib/hooks/use-localizations";
import type { AscLocalization } from "@/lib/asc/localizations";
import {
  localeName,
  sortLocales,
  FIELD_LIMITS,
} from "@/lib/asc/locale-names";
import { CharCount } from "@/components/char-count";
import { useSectionLocales } from "@/lib/section-locales-context";
import { useRegisterHeaderLocale } from "@/lib/header-locale-context";


interface LocaleFields {
  description: string;
  keywords: string;
  whatsNew: string;
  promotionalText: string;
  supportUrl: string;
  marketingUrl: string;
}

function emptyLocaleFields(): LocaleFields {
  return {
    description: "",
    keywords: "",
    whatsNew: "",
    promotionalText: "",
    supportUrl: "",
    marketingUrl: "",
  };
}

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
  const router = useRouter();
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
  const [locales, setLocales] = useState<string[]>([]);
  const [selectedLocale, setSelectedLocale] = useState(
    () => searchParams.get("locale") ?? "",
  );

  const current = localeData[selectedLocale] ?? emptyLocaleFields();

  const changeLocale = useCallback(
    (code: string) => {
      setSelectedLocale(code);
      const next = new URLSearchParams(searchParams.toString());
      next.set("locale", code);
      router.replace(`?${next.toString()}`, { scroll: false });
    },
    [searchParams, router],
  );

  const { setDirty, registerSave, setValidationErrors } = useFormDirty();
  const [releaseType, setReleaseType] = useState("manually");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [phasedRelease, setPhasedRelease] = useState(false);

  // Initialize release settings from version data
  useEffect(() => {
    if (!selectedVersion) return;
    const { releaseType: rt, earliestReleaseDate } = selectedVersion.attributes;
    if (rt === "SCHEDULED" || (rt === "AFTER_APPROVAL" && earliestReleaseDate)) {
      setReleaseType("after-date");
      if (earliestReleaseDate) setScheduledDate(new Date(earliestReleaseDate));
    } else if (rt === "AFTER_APPROVAL") {
      setReleaseType("automatically");
    } else {
      setReleaseType("manually");
    }
    setPhasedRelease(selectedVersion.phasedRelease != null);
  }, [selectedVersion]);

  // Track original locale → localization ID mapping for diffing saves
  const originalLocaleIdsRef = useRef<Record<string, string>>({});

  const { reportLocales, otherSectionLocales } = useSectionLocales("store-listing");

  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  // Reset locale data when localizations change
  useEffect(() => {
    const data = buildLocaleData(localizations);
    setLocaleData(data);
    const sorted = sortLocales(Object.keys(data), primaryLocale);
    setLocales(sorted);

    // Preserve current locale if still valid, else try URL param, else first
    setSelectedLocale((prev) => {
      if (prev && sorted.includes(prev)) return prev;
      const fromUrl = searchParamsRef.current.get("locale");
      if (fromUrl && sorted.includes(fromUrl)) return fromUrl;
      return sorted[0] ?? "";
    });
    setDirty(false);

    // Snapshot original locale → ID mapping for save diffing
    const ids: Record<string, string> = {};
    for (const loc of localizations) {
      ids[loc.attributes.locale] = loc.id;
    }
    originalLocaleIdsRef.current = ids;
  }, [localizations, primaryLocale, setDirty]);

  // Report locales to cross-section context
  useEffect(() => {
    reportLocales(locales);
  }, [locales, reportLocales]);

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
      }
    }
    setValidationErrors(errors);
  }, [localeData, setValidationErrors]);

  // Register save handler for the header Save button
  useEffect(() => {
    registerSave(async () => {
      const promises: Promise<void>[] = [];
      const allErrors: string[] = [];

      // Save localizations
      let locCreatedIds: Record<string, string> = {};
      promises.push(
        fetch(`/api/apps/${appId}/versions/${versionId}/localizations`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locales: localeData,
            originalLocaleIds: originalLocaleIdsRef.current,
          }),
        }).then(async (res) => {
          const data = await res.json();
          if (!res.ok && !data.errors) throw new Error(data.error ?? "Save failed");
          if (data.errors?.length > 0) {
            allErrors.push(...data.errors);
          }
          locCreatedIds = data.createdIds ?? {};
        }),
      );

      // Save release settings
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
            allErrors.push(...data.errors);
          }
        }),
      );

      try {
        await Promise.all(promises);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
        return;
      }

      if (allErrors.length > 0) {
        toast.warning(`Saved with ${allErrors.length} error(s)`);
      } else {
        toast.success("Store listing saved");
      }

      // Update original snapshot with real IDs from created locales
      const ids = { ...originalLocaleIdsRef.current };
      for (const [locale, id] of Object.entries(locCreatedIds)) {
        ids[locale] = id;
      }
      for (const locale of Object.keys(ids)) {
        if (!localeData[locale]) delete ids[locale];
      }
      originalLocaleIdsRef.current = ids;

      // Update cached version with release settings
      if (selectedVersion) {
        updateVersion(selectedVersion.id, (v) => ({
          ...v,
          attributes: {
            ...v.attributes,
            releaseType: ascReleaseType,
            earliestReleaseDate,
          },
          phasedRelease: phasedRelease
            ? (v.phasedRelease ?? { id: "", attributes: { phasedReleaseState: "INACTIVE", currentDayNumber: null, startDate: null } })
            : null,
        }));
      }

      setDirty(false);
    });
  }, [appId, versionId, localeData, releaseType, scheduledDate, phasedRelease, selectedVersion, registerSave, setDirty, updateVersion]);

  const updateField = useCallback(
    (field: keyof LocaleFields, value: string) => {
      setLocaleData((prev) => ({
        ...prev,
        [selectedLocale]: { ...prev[selectedLocale], [field]: value },
      }));
      setDirty(true);
    },
    [selectedLocale, setDirty]
  );

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
    section: "store-listing",
    otherSectionLocales,
    readOnly,
  });

  if (!app) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        App not found
      </div>
    );
  }

  if (versionsLoading || locLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <SpinnerGap size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-lg font-medium">No versions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a version to start editing your store listing.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Read-only banner */}
        {readOnly && (
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            <Lock size={16} className="shrink-0" />
            This version is live – showing what was submitted. Select an
            editable version to make changes.
          </div>
        )}

        {/* Version string */}
        <section className="space-y-2">
          <h3 className="section-title">Version</h3>
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xl font-bold tracking-tight">
              {selectedVersion?.attributes.versionString ?? "–"}
            </span>
            {!readOnly && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground"
                onClick={() =>
                  toast.info("Version editing not available in prototype")
                }
              >
                <PencilSimple size={14} />
              </Button>
            )}
            {selectedVersion && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span
                  className={`size-1.5 shrink-0 rounded-full ${STATE_DOT_COLORS[selectedVersion.attributes.appVersionState] ?? "bg-muted-foreground"}`}
                />
                {stateLabel(selectedVersion.attributes.appVersionState)}
              </span>
            )}
          </div>
        </section>

        {locales.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No localizations for this version.
          </div>
        ) : (
          <>
            {/* What's new */}
            <section className="space-y-2">
              <h3 className="section-title">What&apos;s new</h3>
              <Card className="gap-0 py-0">
                <CardContent className="px-5 py-4">
                  <Textarea
                    value={current.whatsNew}
                    onChange={(e) => updateField("whatsNew", e.target.value)}
                    readOnly={readOnly}
                    placeholder="Describe what's new in this version..."
                    className="border-0 p-0 shadow-none focus-visible:ring-0 resize-none text-sm min-h-0"
                  />
                </CardContent>
                <div className="flex items-center rounded-b-xl border-t bg-sidebar px-3 py-1.5">
                  <CharCount
                    value={current.whatsNew}
                    limit={FIELD_LIMITS.whatsNew}
                  />
                </div>
              </Card>
            </section>

            {/* Promotional text */}
            <section className="space-y-2">
              <h3 className="section-title">Promotional text</h3>
              <Card className="gap-0 py-0">
                <CardContent className="px-5 py-4">
                  <Textarea
                    value={current.promotionalText}
                    onChange={(e) =>
                      updateField("promotionalText", e.target.value)
                    }
                    readOnly={readOnly}
                    placeholder="Inform App Store visitors of current features..."
                    className="border-0 p-0 shadow-none focus-visible:ring-0 resize-none text-sm min-h-0"
                  />
                </CardContent>
                <div className="flex items-center rounded-b-xl border-t bg-sidebar px-3 py-1.5">
                  <CharCount
                    value={current.promotionalText}
                    limit={FIELD_LIMITS.promotionalText}
                  />
                </div>
              </Card>
            </section>

            {/* Description */}
            <section className="space-y-2">
              <h3 className="section-title">Description</h3>
              <Card className="gap-0 py-0">
                <CardContent className="px-5 py-4">
                  <Textarea
                    value={current.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    readOnly={readOnly}
                    placeholder="Describe your app..."
                    className="border-0 p-0 shadow-none focus-visible:ring-0 resize-none text-sm min-h-0"
                  />
                </CardContent>
                <div className="flex items-center rounded-b-xl border-t bg-sidebar px-3 py-1.5">
                  <CharCount
                    value={current.description}
                    limit={FIELD_LIMITS.description}
                  />
                </div>
              </Card>
            </section>

            {/* Keywords */}
            <section className="space-y-2">
              <h3 className="section-title">Keywords</h3>
              <Card className="gap-0 py-0">
                <CardContent className="px-5 py-4">
                  <Input
                    value={current.keywords}
                    onChange={(e) => updateField("keywords", e.target.value)}
                    readOnly={readOnly}
                    placeholder="keyword1,keyword2,keyword3"
                    className="border-0 p-0 shadow-none focus-visible:ring-0 text-sm h-auto"
                  />
                </CardContent>
                <div className="flex items-center rounded-b-xl border-t bg-sidebar px-3 py-1.5">
                  <CharCount
                    value={current.keywords}
                    limit={FIELD_LIMITS.keywords}
                  />
                </div>
              </Card>
            </section>

            {/* URLs */}
            <section className="space-y-2">
              <h3 className="section-title">URLs</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    Support URL
                  </label>
                  <Input
                    dir="ltr"
                    value={current.supportUrl}
                    onChange={(e) => updateField("supportUrl", e.target.value)}
                    readOnly={readOnly}
                    placeholder="https://..."
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    Marketing URL
                  </label>
                  <Input
                    dir="ltr"
                    value={current.marketingUrl}
                    onChange={(e) => updateField("marketingUrl", e.target.value)}
                    readOnly={readOnly}
                    placeholder="https://..."
                    className="text-sm"
                  />
                </div>
              </div>
            </section>

          </>
        )}

        {/* Build */}
        <BuildSection version={selectedVersion} />

        {/* Release settings */}
        <section className="space-y-6">
          <h3 className="section-title">Release settings</h3>

          <div className="space-y-3">
            <p className="text-sm font-medium">Release method</p>
            <Tabs
              value={releaseType}
              onValueChange={readOnly ? undefined : (v) => { setReleaseType(v); setDirty(true); }}
              className="w-full max-w-md"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="automatically" disabled={readOnly}>
                  Automatic
                </TabsTrigger>
                <TabsTrigger value="manually" disabled={readOnly}>
                  Manual
                </TabsTrigger>
                <TabsTrigger value="after-date" disabled={readOnly}>
                  Scheduled
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-sm text-muted-foreground">
              {releaseType === "automatically" &&
                "Goes live as soon as App Review approves it."}
              {releaseType === "manually" &&
                "Stays on hold after approval – you decide when to release."}
              {releaseType === "after-date" &&
                "Released on a date you choose, after approval."}
            </p>
            {releaseType === "after-date" && (
              <div className="pt-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={readOnly}
                      className="w-full max-w-xs justify-start gap-2 font-normal"
                    >
                      <CalendarBlank size={16} className="text-muted-foreground" />
                      {scheduledDate
                        ? scheduledDate.toLocaleString(undefined, {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Pick a release date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={(date) => {
                        if (!date) return;
                        // Preserve existing time or default to noon local
                        const prev = scheduledDate;
                        date.setHours(prev?.getHours() ?? 12, prev?.getMinutes() ?? 0, 0, 0);
                        setScheduledDate(date);
                        setDirty(true);
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                    <div className="border-t px-3 py-2">
                      <Label className="text-xs text-muted-foreground">Time</Label>
                      <Input
                        type="time"
                        value={scheduledDate
                          ? `${String(scheduledDate.getHours()).padStart(2, "0")}:${String(scheduledDate.getMinutes()).padStart(2, "0")}`
                          : "12:00"}
                        onChange={(e) => {
                          const [h, m] = e.target.value.split(":").map(Number);
                          setScheduledDate((prev) => {
                            const d = prev ? new Date(prev) : new Date();
                            d.setHours(h, m, 0, 0);
                            return d;
                          });
                          setDirty(true);
                        }}
                        className="mt-1 h-8 text-sm"
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Phased rollout</p>
            <p className="text-sm text-muted-foreground">
              Gradually roll out to users over 7 days. Only affects automatic
              updates – manual downloads get the new version immediately.
            </p>
            <div className="flex items-center gap-3">
              <Switch
                checked={phasedRelease}
                onCheckedChange={(v) => { setPhasedRelease(v); setDirty(true); }}
                disabled={readOnly}
              />
              <Label className="text-sm">Enable 7-day phased rollout</Label>
            </div>
          </div>
        </section>
    </div>
  );
}

function BuildSection({ version }: { version?: { build: { id: string; attributes: { version: string; uploadedDate: string } } | null; attributes: { versionString: string } } }) {
  const build = version?.build;

  return (
    <section className="space-y-2">
      <h3 className="section-title">Build</h3>
      {build ? (
        <div className="flex items-center gap-4 rounded-lg border p-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-sm">
            <AppWindow size={20} weight="fill" />
          </div>
          <div>
            <p className="font-semibold">Build {build.attributes.version}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(build.attributes.uploadedDate).toLocaleString(undefined, {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              &middot; Version {version?.attributes.versionString}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No build attached to this version yet.
        </div>
      )}
    </section>
  );
}
