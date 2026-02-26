import { redirect } from "next/navigation";
import { MOCK_APPS } from "@/lib/mock-data";

export default function DashboardPage() {
  if (MOCK_APPS.length > 0) {
    redirect(`/dashboard/apps/${MOCK_APPS[0].id}`);
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-2xl font-bold tracking-tight">No apps yet</h1>
      <p className="mt-2 text-muted-foreground">
        Connect your App Store Connect credentials in Settings to see your apps.
      </p>
      <a
        href="/dashboard/settings"
        className="mt-4 text-sm text-primary underline-offset-4 hover:underline"
      >
        Go to settings
      </a>
    </div>
  );
}
