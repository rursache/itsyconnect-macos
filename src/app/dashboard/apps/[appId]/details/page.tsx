"use client";

import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_APPS } from "@/lib/mock-data";

export default function AppDetailsPage() {
  const { appId } = useParams<{ appId: string }>();
  const app = MOCK_APPS.find((a) => a.id === appId);

  if (!app) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        App not found
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Identifiers (read-only) */}
      <section className="space-y-4">
        <h3 className="section-title">Identifiers</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ReadOnlyField label="Bundle ID" value={app.bundleId} mono />
          <ReadOnlyField label="SKU" value={app.sku} mono />
          <ReadOnlyField label="Primary language" value={app.primaryLocale} />
        </div>
      </section>

      {/* Categories */}
      <section className="space-y-4">
        <h3 className="section-title">Categories</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Primary category
            </label>
            <Select defaultValue="utilities">
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="utilities">Utilities</SelectItem>
                <SelectItem value="productivity">Productivity</SelectItem>
                <SelectItem value="lifestyle">Lifestyle</SelectItem>
                <SelectItem value="photo-video">Photo & Video</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Secondary category
            </label>
            <Select defaultValue="none">
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="utilities">Utilities</SelectItem>
                <SelectItem value="productivity">Productivity</SelectItem>
                <SelectItem value="lifestyle">Lifestyle</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Copyright */}
      <section className="space-y-4">
        <h3 className="section-title">Copyright</h3>
        <Input
          defaultValue="2026 Nick Ustinov"
          className="max-w-md text-sm"
        />
      </section>

      {/* Age rating */}
      <section className="space-y-4">
        <h3 className="section-title">Age rating</h3>
        <div className="flex gap-4">
          <Card className="w-32">
            <CardContent className="flex flex-col items-center justify-center py-4">
              <span className="text-2xl font-bold">4+</span>
              <span className="text-xs text-muted-foreground">
                173 territories
              </span>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* URLs */}
      <section className="space-y-4">
        <h3 className="section-title">URLs</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Support URL
            </label>
            <Input
              defaultValue="https://example.com/support"
              placeholder="https://..."
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Marketing URL
            </label>
            <Input
              defaultValue="https://example.com"
              placeholder="https://..."
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Privacy policy URL
            </label>
            <Input
              defaultValue="https://example.com/privacy"
              placeholder="https://..."
              className="font-mono text-sm"
            />
          </div>
        </div>
      </section>

      {/* Content rights */}
      <section className="space-y-4 pb-8">
        <h3 className="section-title">Content rights</h3>
        <p className="text-sm text-muted-foreground">
          Does not use third-party content.
        </p>
      </section>
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>
        {value}
      </p>
    </div>
  );
}
