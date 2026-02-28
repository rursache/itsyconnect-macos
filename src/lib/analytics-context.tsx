"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AnalyticsData } from "@/lib/mock-analytics";

interface AnalyticsState {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  pending: boolean; // bg worker hasn't fetched this app yet
  refresh: () => void;
  meta: { fetchedAt: number; ttlMs: number } | null;
}

const AnalyticsContext = createContext<AnalyticsState | null>(null);

const POLL_INTERVAL = 3000;

export function AnalyticsProvider({
  appId,
  children,
}: {
  appId: string;
  children: ReactNode;
}) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [meta, setMeta] = useState<{ fetchedAt: number; ttlMs: number } | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async (refresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const qs = refresh ? "?refresh=true" : "";
      const res = await fetch(`/api/apps/${appId}/analytics${qs}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? `HTTP ${res.status}`);
        setPending(false);
        return;
      }

      if (json.pending) {
        setPending(true);
        setData(null);
        return;
      }

      setPending(false);
      setData(json.data);
      setMeta(json.meta ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch analytics");
      setPending(false);
    } finally {
      setLoading(false);
    }
  }, [appId]);

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Poll while pending (bg worker hasn't reached this app yet)
  useEffect(() => {
    if (!pending) return;

    pollTimer.current = setInterval(() => {
      fetchData();
    }, POLL_INTERVAL);

    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [pending, fetchData]);

  return (
    <AnalyticsContext.Provider
      value={{ data, loading, error, pending, refresh, meta }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics(): AnalyticsState {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }
  return ctx;
}
