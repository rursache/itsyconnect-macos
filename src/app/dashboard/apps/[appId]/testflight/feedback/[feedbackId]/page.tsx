"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BatteryHigh,
  Camera,
  Copy,
  Desktop,
  DeviceMobile,
  Globe,
  GlobeSimple,
  Package,
  WarningCircle,
  CircleNotch,
  ArrowClockwise,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import type { MockFeedbackItem } from "@/lib/mock-testflight";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FeedbackDetailPage() {
  const { appId, feedbackId } = useParams<{
    appId: string;
    feedbackId: string;
  }>();

  const [item, setItem] = useState<MockFeedbackItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/apps/${appId}/testflight/feedback`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Failed to fetch feedback (${res.status})`);
      }
      const data = await res.json();
      const found = (data.feedback as MockFeedbackItem[]).find(
        (f) => f.id === feedbackId,
      );
      setItem(found ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch feedback");
    } finally {
      setLoading(false);
    }
  }, [appId, feedbackId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  if (!item) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Feedback not found
      </div>
    );
  }

  const specs = [
    {
      icon: Package,
      label: "App version",
      value: `${item.versionString} (${item.buildNumber})`,
    },
    {
      icon: GlobeSimple,
      label: "Bundle ID",
      value: item.bundleId,
    },
    {
      icon: Desktop,
      label: "Platform",
      value: item.platform,
    },
    {
      icon: Globe,
      label: "Locale",
      value: item.locale,
    },
    {
      icon: DeviceMobile,
      label: "Device",
      value: item.device,
    },
    {
      icon: BatteryHigh,
      label: "Battery",
      value: `${item.battery}%`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Badge
          variant={item.type === "crash" ? "destructive" : "secondary"}
          className="gap-1.5 text-xs font-normal"
        >
          {item.type === "screenshot" ? (
            <Camera size={12} />
          ) : (
            <WarningCircle size={12} />
          )}
          {item.type === "screenshot" ? "Screenshot" : "Crash"}
        </Badge>
      </div>

      {/* Date */}
      <section className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Date
        </p>
        <p className="text-lg font-semibold">{formatDateTime(item.date)}</p>
      </section>

      {/* Comment */}
      <Card className="bg-muted/50">
        <CardContent className="space-y-1 py-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Comment
          </p>
          <p className="text-sm leading-relaxed">{item.message}</p>
        </CardContent>
      </Card>

      {/* Specs */}
      <Card className="bg-muted/50">
        <CardContent className="space-y-0 py-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Specs
          </p>
          <div className="divide-y divide-dotted">
            {specs.map((spec) => (
              <div
                key={spec.label}
                className="flex items-center justify-between py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <spec.icon
                    size={16}
                    className="shrink-0 text-muted-foreground"
                  />
                  <span className="text-sm font-medium">{spec.label}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {spec.value}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Email */}
      {item.email && (
        <Card className="bg-muted/50">
          <CardContent className="space-y-2 py-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Email
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto gap-1.5 px-2 py-1 text-xs text-muted-foreground"
                onClick={() => {
                  navigator.clipboard.writeText(item.email);
                  toast.success("Email copied to clipboard");
                }}
              >
                <Copy size={12} />
                Copy
              </Button>
            </div>
            <p className="text-sm text-blue-600">{item.email}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
