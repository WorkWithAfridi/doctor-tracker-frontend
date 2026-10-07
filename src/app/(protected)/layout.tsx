import { AppShell } from "@/components/layout/app-shell";
import { Suspense } from "react";
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={<div className="boot-state">Opening your workspace…</div>}
    >
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
