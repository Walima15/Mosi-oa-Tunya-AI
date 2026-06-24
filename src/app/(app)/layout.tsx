import { AppShell } from "@/components/layout/app-shell";
import { getProfile } from "@/lib/data/user";
import { isDemoMode } from "@/lib/config";
import { demoUser } from "@/lib/demo-data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();

  const user = profile
    ? { full_name: profile.full_name, role: profile.role, kyc_status: profile.kyc_status }
    : { full_name: demoUser.full_name, role: demoUser.role, kyc_status: demoUser.kyc_status };

  return (
    <AppShell user={user} demo={isDemoMode}>
      {children}
    </AppShell>
  );
}
