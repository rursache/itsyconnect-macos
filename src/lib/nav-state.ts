const NAV_KEY = "nav-state";

interface NavState {
  lastUrl: string;
  apps: Record<string, string>;
}

function read(): NavState {
  try {
    const raw = localStorage.getItem(NAV_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Corrupted or unavailable – start fresh
  }
  return { lastUrl: "", apps: {} };
}

function write(state: NavState): void {
  try {
    localStorage.setItem(NAV_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable – silently skip
  }
}

const APP_PREFIX = "/dashboard/apps/";

export function saveNavigation(pathname: string, search: string): void {
  if (!pathname.startsWith(APP_PREFIX)) return;

  const rest = pathname.slice(APP_PREFIX.length); // "appId/subpath..."
  const slashIdx = rest.indexOf("/");
  const appId = slashIdx === -1 ? rest : rest.slice(0, slashIdx);
  if (!appId) return;

  const suffix = search ? `?${search}` : "";
  const subpath = slashIdx === -1 ? "" : rest.slice(slashIdx);

  const state = read();
  state.lastUrl = pathname + suffix;
  state.apps[appId] = subpath + suffix;
  write(state);
}

export function getLastUrl(): string | undefined {
  const { lastUrl } = read();
  return lastUrl && lastUrl.startsWith(APP_PREFIX) ? lastUrl : undefined;
}

export function getAppState(appId: string): string | undefined {
  const sub = read().apps[appId];
  return sub !== undefined ? sub : undefined;
}
