"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GearSix, Key, Plugs, Trash, CheckCircle, XCircle, SpinnerGap } from "@phosphor-icons/react";
import { toast } from "sonner";

interface Credential {
  id: number;
  label: string;
  issuerId: string;
  keyId: string;
  isActive: boolean;
  createdAt: string;
}

export default function SettingsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchCredentials();
  }, []);

  async function fetchCredentials() {
    try {
      const res = await fetch("/api/credentials");
      const data = await res.json();
      setCredentials(data);
      setShowForm(data.length === 0);
    } catch {
      toast.error("Failed to load credentials");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await fetch("/api/credentials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      toast.success("Credential deleted");
      fetchCredentials();
    } catch {
      toast.error("Failed to delete credential");
    }
  }

  return (
    <div className="space-y-6 overflow-auto p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your App Store Connect credentials
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <SpinnerGap size={24} className="animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <>
          {credentials.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key size={20} />
                    <CardTitle>Active credentials</CardTitle>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Cancel" : "Replace credentials"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {credentials.map((cred) => (
                    <div
                      key={cred.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{cred.label}</span>
                          {cred.isActive && (
                            <Badge variant="default">Active</Badge>
                          )}
                        </div>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>Key ID: {cred.keyId}</span>
                          <span>Issuer: {cred.issuerId.slice(0, 8)}...</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(cred.id)}
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
                <TestConnectionButton />
              </CardContent>
            </Card>
          )}

          {showForm && <CredentialForm onSuccess={() => { setShowForm(false); fetchCredentials(); }} />}
        </>
      )}
    </div>
  );
}

function TestConnectionButton() {
  const [status, setStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");

  async function handleTest() {
    setStatus("testing");
    try {
      const res = await fetch("/api/credentials/test", { method: "POST" });
      setStatus(res.ok ? "ok" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="mt-4 flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleTest} disabled={status === "testing"}>
        <Plugs size={16} className="mr-2" />
        {status === "testing" ? "Testing..." : "Test connection"}
      </Button>
      {status === "ok" && (
        <span className="flex items-center gap-1 text-sm text-green-600">
          <CheckCircle size={16} weight="fill" /> Connected
        </span>
      )}
      {status === "error" && (
        <span className="flex items-center gap-1 text-sm text-destructive">
          <XCircle size={16} weight="fill" /> Connection failed
        </span>
      )}
    </div>
  );
}

function CredentialForm({ onSuccess }: { onSuccess: () => void }) {
  const [label, setLabel] = useState("Default");
  const [issuerId, setIssuerId] = useState("");
  const [keyId, setKeyId] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setPrivateKey(text);

    // Try to extract key ID from filename (AuthKey_XXXXXXXXXX.p8)
    const match = file.name.match(/AuthKey_(\w+)\.p8/);
    if (match && !keyId) {
      setKeyId(match[1]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, issuerId, keyId, privateKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      toast.success("Credentials saved and verified");
      onSuccess();
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <GearSix size={20} />
          <CardTitle>Add App Store Connect credentials</CardTitle>
        </div>
        <CardDescription>
          Create an API key in{" "}
          <a
            href="https://appstoreconnect.apple.com/access/integrations/api"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            App Store Connect &rarr; Integrations &rarr; App Store Connect API
          </a>
          . Download the .p8 file and enter the details below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. My Team"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="issuerId">Issuer ID</Label>
            <Input
              id="issuerId"
              value={issuerId}
              onChange={(e) => setIssuerId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              autoFocus
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="keyId">Key ID</Label>
            <Input
              id="keyId"
              value={keyId}
              onChange={(e) => setKeyId(e.target.value)}
              placeholder="XXXXXXXXXX"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p8file">Private key (.p8 file)</Label>
            <Input
              id="p8file"
              type="file"
              accept=".p8"
              onChange={handleFileUpload}
            />
            {privateKey && (
              <p className="text-xs text-muted-foreground">
                Key loaded ({privateKey.length} characters)
              </p>
            )}
            <Textarea
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder="Or paste the private key content here..."
              className="font-mono text-xs"
              rows={4}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <SpinnerGap size={16} className="mr-2 animate-spin" />
                Validating and saving...
              </>
            ) : (
              "Save and verify"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
