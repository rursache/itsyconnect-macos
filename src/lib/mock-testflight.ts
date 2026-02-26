/**
 * Mock TestFlight data for prototype pages.
 * All data is for app-001 (Weatherly).
 */

export interface MockTFBuild {
  id: string;
  appId: string;
  buildNumber: string;
  versionString: string;
  platform: "IOS" | "MAC_OS";
  status: "Testing" | "Ready to submit" | "Processing" | "Expired";
  expiryDate: string;
  uploadedDate: string;
  groupIds: string[];
  installs: number;
  sessions: number;
  crashes: number;
  whatsNew: string;
  testerCount: number;
}

export interface MockBetaGroup {
  id: string;
  appId: string;
  name: string;
  type: "Internal" | "External";
  shortLabel: "IN" | "EX" | "E2";
  testerCount: number;
  buildCount: number;
  publicLinkEnabled: boolean;
  publicLink: string | null;
}

export interface MockBetaTester {
  id: string;
  groupId: string;
  firstName: string;
  lastName: string;
  email: string;
  isPublicLink: boolean;
  status: "Installed" | "Accepted" | "Invited";
  statusDetail: string;
  sessions: number;
  crashes: number;
  feedbackCount: number;
  device: string;
}

export interface MockBetaAppLocalization {
  locale: string;
  description: string;
  feedbackEmail: string;
  marketingUrl: string;
  privacyPolicyUrl: string;
}

export interface MockBetaReviewDetail {
  contactFirstName: string;
  contactLastName: string;
  contactPhone: string;
  contactEmail: string;
  reviewNotes: string;
  signInRequired: boolean;
  demoUsername: string;
  demoPassword: string;
}

export interface MockFeedbackItem {
  id: string;
  appId: string;
  type: "screenshot" | "crash";
  message: string;
  email: string;
  platform: string;
  versionString: string;
  buildNumber: string;
  date: string;
}

// ---------- Builds ----------

export const MOCK_TF_BUILDS: MockTFBuild[] = [
  {
    id: "tfb-001",
    appId: "app-001",
    buildNumber: "142",
    versionString: "2.1.0",
    platform: "IOS",
    status: "Testing",
    expiryDate: "2026-05-20T14:30:00Z",
    uploadedDate: "2026-02-19T14:30:00Z",
    groupIds: ["grp-001", "grp-002"],
    installs: 34,
    sessions: 218,
    crashes: 3,
    whatsNew:
      "Added background weather refresh every 15 minutes. New precipitation graph with hourly breakdown. Fixed widget not updating after midnight. Improved severe weather alert detail view performance.",
    testerCount: 10,
  },
  {
    id: "tfb-002",
    appId: "app-001",
    buildNumber: "141",
    versionString: "2.1.0",
    platform: "IOS",
    status: "Testing",
    expiryDate: "2026-05-17T10:00:00Z",
    uploadedDate: "2026-02-16T10:00:00Z",
    groupIds: ["grp-001"],
    installs: 8,
    sessions: 42,
    crashes: 1,
    whatsNew:
      "Initial 2.1.0 beta. Radar/satellite view transitions rewritten for smoother animations. Dark mode contrast improvements for sunrise/sunset gradient card.",
    testerCount: 4,
  },
  {
    id: "tfb-003",
    appId: "app-001",
    buildNumber: "140",
    versionString: "2.1.0",
    platform: "IOS",
    status: "Expired",
    expiryDate: "2026-02-10T09:00:00Z",
    uploadedDate: "2025-11-13T09:00:00Z",
    groupIds: ["grp-001", "grp-002"],
    installs: 12,
    sessions: 89,
    crashes: 7,
    whatsNew:
      "Early alpha for 2.1.0. Testing new hourly forecast scroll behaviour and widget layout changes.",
    testerCount: 10,
  },
  {
    id: "tfb-004",
    appId: "app-001",
    buildNumber: "138",
    versionString: "2.0.1",
    platform: "IOS",
    status: "Ready to submit",
    expiryDate: "2026-04-30T10:00:00Z",
    uploadedDate: "2026-01-30T10:00:00Z",
    groupIds: ["grp-002", "grp-003"],
    installs: 56,
    sessions: 412,
    crashes: 2,
    whatsNew:
      "Bug fix release. Resolved crash when switching radar to satellite view while downloading map tiles. Fixed \"feels like\" temperature truncation on smaller widgets.",
    testerCount: 8,
  },
  {
    id: "tfb-005",
    appId: "app-001",
    buildNumber: "137",
    versionString: "2.0.1",
    platform: "IOS",
    status: "Expired",
    expiryDate: "2026-01-25T12:00:00Z",
    uploadedDate: "2025-10-28T12:00:00Z",
    groupIds: ["grp-001"],
    installs: 5,
    sessions: 18,
    crashes: 0,
    whatsNew:
      "Hotfix candidate for 2.0.1. Addressed memory leak in background location updates on iPhone 14 and earlier.",
    testerCount: 4,
  },
  {
    id: "tfb-006",
    appId: "app-001",
    buildNumber: "12",
    versionString: "1.0.0",
    platform: "MAC_OS",
    status: "Testing",
    expiryDate: "2026-04-14T11:00:00Z",
    uploadedDate: "2026-01-14T11:00:00Z",
    groupIds: ["grp-001"],
    installs: 3,
    sessions: 14,
    crashes: 0,
    whatsNew:
      "First macOS Catalyst build. Menu bar widget, keyboard shortcuts for switching forecast views. Known issue: window resize can clip the radar overlay.",
    testerCount: 4,
  },
  {
    id: "tfb-007",
    appId: "app-001",
    buildNumber: "139",
    versionString: "2.0.2",
    platform: "IOS",
    status: "Processing",
    expiryDate: "2026-05-25T08:00:00Z",
    uploadedDate: "2026-02-24T08:00:00Z",
    groupIds: [],
    installs: 0,
    sessions: 0,
    crashes: 0,
    whatsNew: "",
    testerCount: 0,
  },
  {
    id: "tfb-008",
    appId: "app-001",
    buildNumber: "11",
    versionString: "1.0.0",
    platform: "MAC_OS",
    status: "Expired",
    expiryDate: "2026-01-05T09:00:00Z",
    uploadedDate: "2025-10-08T09:00:00Z",
    groupIds: ["grp-001"],
    installs: 2,
    sessions: 6,
    crashes: 1,
    whatsNew:
      "Initial macOS beta. Core weather display and 7-day forecast. Notification support for severe weather alerts.",
    testerCount: 4,
  },
];

// ---------- Groups ----------

export const MOCK_BETA_GROUPS: MockBetaGroup[] = [
  {
    id: "grp-001",
    appId: "app-001",
    name: "App Store Connect users",
    type: "Internal",
    shortLabel: "IN",
    testerCount: 4,
    buildCount: 6,
    publicLinkEnabled: false,
    publicLink: null,
  },
  {
    id: "grp-002",
    appId: "app-001",
    name: "Beta testers",
    type: "External",
    shortLabel: "EX",
    testerCount: 6,
    buildCount: 3,
    publicLinkEnabled: true,
    publicLink: "https://testflight.apple.com/join/aBcDeFgH",
  },
  {
    id: "grp-003",
    appId: "app-001",
    name: "Press & reviewers",
    type: "External",
    shortLabel: "E2",
    testerCount: 2,
    buildCount: 1,
    publicLinkEnabled: false,
    publicLink: null,
  },
];

// ---------- Testers ----------

export const MOCK_BETA_TESTERS: MockBetaTester[] = [
  // Internal group (grp-001)
  {
    id: "tester-001",
    groupId: "grp-001",
    firstName: "Nick",
    lastName: "Ustinov",
    email: "nick@example.com",
    isPublicLink: false,
    status: "Installed",
    statusDetail: "Build 142 on iPhone 16 Pro",
    sessions: 84,
    crashes: 1,
    feedbackCount: 2,
    device: "iPhone 16 Pro",
  },
  {
    id: "tester-002",
    groupId: "grp-001",
    firstName: "Sarah",
    lastName: "Chen",
    email: "sarah@example.com",
    isPublicLink: false,
    status: "Installed",
    statusDetail: "Build 142 on iPhone 15",
    sessions: 42,
    crashes: 0,
    feedbackCount: 3,
    device: "iPhone 15",
  },
  {
    id: "tester-003",
    groupId: "grp-001",
    firstName: "Alex",
    lastName: "Kim",
    email: "alex@example.com",
    isPublicLink: false,
    status: "Accepted",
    statusDetail: "Accepted, not yet installed",
    sessions: 0,
    crashes: 0,
    feedbackCount: 0,
    device: "iPhone 14 Pro Max",
  },
  {
    id: "tester-004",
    groupId: "grp-001",
    firstName: "Maria",
    lastName: "Gonzalez",
    email: "maria@example.com",
    isPublicLink: false,
    status: "Invited",
    statusDetail: "Invitation sent 3 days ago",
    sessions: 0,
    crashes: 0,
    feedbackCount: 0,
    device: "iPad Pro 13\u2033",
  },
  // External group (grp-002)
  {
    id: "tester-005",
    groupId: "grp-002",
    firstName: "James",
    lastName: "Wright",
    email: "james.w@example.com",
    isPublicLink: false,
    status: "Installed",
    statusDetail: "Build 142 on iPhone 16",
    sessions: 31,
    crashes: 1,
    feedbackCount: 1,
    device: "iPhone 16",
  },
  {
    id: "tester-006",
    groupId: "grp-002",
    firstName: "Anonymous",
    lastName: "",
    email: "",
    isPublicLink: true,
    status: "Installed",
    statusDetail: "Build 142 via public link",
    sessions: 12,
    crashes: 0,
    feedbackCount: 0,
    device: "iPhone 15 Pro",
  },
  {
    id: "tester-007",
    groupId: "grp-002",
    firstName: "Anonymous",
    lastName: "",
    email: "",
    isPublicLink: true,
    status: "Installed",
    statusDetail: "Build 138 via public link",
    sessions: 8,
    crashes: 0,
    feedbackCount: 1,
    device: "iPhone 14",
  },
  {
    id: "tester-008",
    groupId: "grp-002",
    firstName: "Lena",
    lastName: "Petrov",
    email: "lena.p@example.com",
    isPublicLink: false,
    status: "Accepted",
    statusDetail: "Accepted, not yet installed",
    sessions: 0,
    crashes: 0,
    feedbackCount: 0,
    device: "iPhone 16 Pro Max",
  },
  {
    id: "tester-009",
    groupId: "grp-002",
    firstName: "Tom",
    lastName: "Bakker",
    email: "tom.b@example.com",
    isPublicLink: false,
    status: "Installed",
    statusDetail: "Build 142 on iPhone 15",
    sessions: 19,
    crashes: 1,
    feedbackCount: 0,
    device: "iPhone 15",
  },
  {
    id: "tester-010",
    groupId: "grp-002",
    firstName: "Yuki",
    lastName: "Tanaka",
    email: "yuki.t@example.com",
    isPublicLink: false,
    status: "Invited",
    statusDetail: "Invitation sent 1 day ago",
    sessions: 0,
    crashes: 0,
    feedbackCount: 0,
    device: "iPhone 16",
  },
  // External group (grp-003)
  {
    id: "tester-011",
    groupId: "grp-003",
    firstName: "Chris",
    lastName: "Miller",
    email: "chris@techblog.com",
    isPublicLink: false,
    status: "Installed",
    statusDetail: "Build 138 on iPhone 16 Pro",
    sessions: 7,
    crashes: 0,
    feedbackCount: 1,
    device: "iPhone 16 Pro",
  },
  {
    id: "tester-012",
    groupId: "grp-003",
    firstName: "Ava",
    lastName: "Robinson",
    email: "ava@appreviews.net",
    isPublicLink: false,
    status: "Accepted",
    statusDetail: "Accepted, not yet installed",
    sessions: 0,
    crashes: 0,
    feedbackCount: 0,
    device: "iPhone 15 Pro",
  },
];

// ---------- Beta app localizations ----------

export const MOCK_BETA_LOCALIZATIONS: MockBetaAppLocalization[] = [
  {
    locale: "en-US",
    description:
      "Try the latest Weatherly features before they go live. Your feedback helps us squash bugs and improve the experience for everyone.",
    feedbackEmail: "beta@weatherly.example.com",
    marketingUrl: "https://example.com/weatherly",
    privacyPolicyUrl: "https://example.com/weatherly/privacy",
  },
  {
    locale: "de-DE",
    description:
      "Testen Sie die neuesten Weatherly-Funktionen, bevor sie live gehen. Ihr Feedback hilft uns, Fehler zu beheben und das Erlebnis f\u00fcr alle zu verbessern.",
    feedbackEmail: "beta@weatherly.example.com",
    marketingUrl: "https://example.com/weatherly",
    privacyPolicyUrl: "https://example.com/weatherly/privacy",
  },
];

// ---------- Beta review detail ----------

export const MOCK_BETA_REVIEW_DETAIL: MockBetaReviewDetail = {
  contactFirstName: "Nick",
  contactLastName: "Ustinov",
  contactPhone: "+1 (555) 012-3456",
  contactEmail: "nick@example.com",
  reviewNotes:
    "This build adds background weather refresh and a new precipitation graph. No sign-in required for core features.",
  signInRequired: false,
  demoUsername: "",
  demoPassword: "",
};

// ---------- Feedback ----------

export const MOCK_FEEDBACK: MockFeedbackItem[] = [
  {
    id: "fb-001",
    appId: "app-001",
    type: "screenshot",
    message:
      "The precipitation graph overlaps the temperature label when the hourly forecast has more than 12 hours visible. See attached screenshot.",
    email: "nick@example.com",
    platform: "iOS 19.3",
    versionString: "2.1.0",
    buildNumber: "142",
    date: "2026-02-25T09:15:00Z",
  },
  {
    id: "fb-002",
    appId: "app-001",
    type: "crash",
    message:
      "Crash when switching from radar to satellite view while downloading map tiles. Happens every time on WiFi.",
    email: "james.w@example.com",
    platform: "iOS 19.3",
    versionString: "2.1.0",
    buildNumber: "142",
    date: "2026-02-24T14:20:00Z",
  },
  {
    id: "fb-003",
    appId: "app-001",
    type: "screenshot",
    message:
      "Widget shows yesterday\u2019s weather after midnight until the first background refresh. Expected to update at midnight.",
    email: "sarah@example.com",
    platform: "iOS 19.3",
    versionString: "2.1.0",
    buildNumber: "142",
    date: "2026-02-22T07:30:00Z",
  },
  {
    id: "fb-004",
    appId: "app-001",
    type: "screenshot",
    message:
      "The \"feels like\" temperature on the widget is cut off on smaller widget sizes. Only shows \"Feels li...\"",
    email: "",
    platform: "iOS 19.3",
    versionString: "2.1.0",
    buildNumber: "142",
    date: "2026-02-18T16:45:00Z",
  },
  {
    id: "fb-005",
    appId: "app-001",
    type: "crash",
    message:
      "App freezes for about 5 seconds when opening severe weather alert detail view. Sometimes recovers, sometimes crashes.",
    email: "tom.b@example.com",
    platform: "iOS 19.2",
    versionString: "2.0.1",
    buildNumber: "138",
    date: "2026-02-10T11:00:00Z",
  },
  {
    id: "fb-006",
    appId: "app-001",
    type: "screenshot",
    message:
      "Dark mode: the sunrise/sunset gradient card is almost invisible. Needs higher contrast or different colours for dark backgrounds.",
    email: "chris@techblog.com",
    platform: "iOS 19.3",
    versionString: "2.0.1",
    buildNumber: "138",
    date: "2026-01-28T20:00:00Z",
  },
];

// ---------- Helpers ----------

export function getTFBuild(buildId: string): MockTFBuild | undefined {
  return MOCK_TF_BUILDS.find((b) => b.id === buildId);
}

export function getAppTFBuilds(appId: string): MockTFBuild[] {
  return MOCK_TF_BUILDS.filter((b) => b.appId === appId).sort(
    (a, b) =>
      new Date(b.uploadedDate).getTime() - new Date(a.uploadedDate).getTime(),
  );
}

export function getAppGroups(appId: string): MockBetaGroup[] {
  return MOCK_BETA_GROUPS.filter((g) => g.appId === appId);
}

export function getGroup(groupId: string): MockBetaGroup | undefined {
  return MOCK_BETA_GROUPS.find((g) => g.id === groupId);
}

export function getGroupTesters(groupId: string): MockBetaTester[] {
  return MOCK_BETA_TESTERS.filter((t) => t.groupId === groupId);
}

export function getAppFeedback(appId: string): MockFeedbackItem[] {
  return MOCK_FEEDBACK.filter((f) => f.appId === appId).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}
