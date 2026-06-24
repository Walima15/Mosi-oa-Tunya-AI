import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProfile } from "@/lib/data/user";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Fingerprint, Lock, Smartphone, ShieldCheck } from "lucide-react";

export default async function SettingsPage() {
  const profile = await getProfile();

  const kycVariant =
    profile?.kyc_status === "verified"
      ? "success"
      : profile?.kyc_status === "rejected"
        ? "danger"
        : "warning";

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title="Settings" description="Account, security and preferences" />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h3 className="font-semibold">Profile</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-muted">Name</p><p>{profile?.full_name ?? "—"}</p></div>
            <div><p className="text-muted">Email</p><p>{profile?.email ?? "—"}</p></div>
            <div><p className="text-muted">Role</p><p className="capitalize">{profile?.role ?? "—"}</p></div>
            <div><p className="text-muted">KYC</p><Badge variant={kycVariant}>{profile?.kyc_status ?? "unverified"}</Badge></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h3 className="font-semibold">Security</h3>
          {[
            { icon: Fingerprint, label: "Multi-factor authentication", enabled: profile?.mfa_enabled ?? false },
            { icon: Smartphone, label: "Biometric login", enabled: profile?.biometric_enabled ?? false },
            { icon: Lock, label: "End-to-end encryption", enabled: true },
            { icon: ShieldCheck, label: "Device management", enabled: false },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between rounded-xl bg-white/[0.03] p-4">
              <div className="flex items-center gap-3">
                <s.icon className="size-5 text-gold" />
                <span className="text-sm">{s.label}</span>
              </div>
              <Badge variant={s.enabled ? "success" : "muted"}>{s.enabled ? "Enabled" : "Disabled"}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between pt-6">
          <div>
            <h3 className="font-semibold">Session</h3>
            <p className="mt-1 text-sm text-muted">Sign out of your account on this device.</p>
          </div>
          <SignOutButton />
        </CardContent>
      </Card>
    </div>
  );
}
