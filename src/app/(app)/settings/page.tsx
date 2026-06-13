import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { demoUser } from "@/lib/demo-data";
import { Fingerprint, Lock, Smartphone, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title="Settings" description="Account, security and preferences" />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h3 className="font-semibold">Profile</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-muted">Name</p><p>{demoUser.full_name}</p></div>
            <div><p className="text-muted">Email</p><p>{demoUser.email}</p></div>
            <div><p className="text-muted">Role</p><p className="capitalize">{demoUser.role}</p></div>
            <div><p className="text-muted">KYC</p><Badge variant="success">{demoUser.kyc_status}</Badge></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h3 className="font-semibold">Security</h3>
          {[
            { icon: Fingerprint, label: "Multi-factor authentication", enabled: true },
            { icon: Smartphone, label: "Biometric login", enabled: true },
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
    </div>
  );
}
