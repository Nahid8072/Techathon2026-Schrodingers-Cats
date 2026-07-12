import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bell, Check, X } from "lucide-react";
import { Sidebar } from "@/components/kernel/Sidebar";
import { TopBar } from "@/components/kernel/TopBar";
import { useSim } from "@/lib/simulation-context";
import { formatTime } from "@/lib/devices";
import type { Alert } from "@/hooks/useSimulation";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts — Kernel" },
      { name: "description", content: "Review, acknowledge, and dismiss smart office alerts." },
      { property: "og:title", content: "Alerts — Kernel" },
      { property: "og:description", content: "All active alerts across your office." },
    ],
  }),
  component: AlertsPage,
});

type Sev = "all" | Alert["severity"];

const sevDot: Record<Alert["severity"], string> = {
  high: "bg-coral",
  med: "bg-amber",
  low: "bg-primary",
};

const sevBadge: Record<Alert["severity"], string> = {
  high: "bg-coral/15 text-coral",
  med: "bg-amber/20 text-amber",
  low: "bg-primary/15 text-primary",
};

function AlertsPage() {
  const { alerts } = useSim();
  const [sev, setSev] = useState<Sev>("all");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [acked, setAcked] = useState<Set<string>>(new Set());

  const filtered = useMemo(
    () =>
      alerts
        .filter((a) => !dismissed.has(a.id))
        .filter((a) => sev === "all" || a.severity === sev),
    [alerts, dismissed, sev],
  );

  const counts = useMemo(() => {
    const c = { high: 0, med: 0, low: 0 } as Record<Alert["severity"], number>;
    for (const a of alerts) if (!dismissed.has(a.id)) c[a.severity]++;
    return c;
  }, [alerts, dismissed]);

  const tabs: { v: Sev; l: string; n?: number }[] = [
    { v: "all", l: "All", n: alerts.length - dismissed.size },
    { v: "high", l: "High", n: counts.high },
    { v: "med", l: "Medium", n: counts.med },
    { v: "low", l: "Low", n: counts.low },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <TopBar />

        <div className="kernel-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-coral/15">
                <Bell className="h-4 w-4 text-coral" strokeWidth={2.2} />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-tight">Alerts</div>
                <div className="text-[11px] text-muted-foreground">{filtered.length} shown</div>
              </div>
            </div>
            <div className="inline-flex rounded-xl border border-border/70 bg-background/60 p-0.5">
              {tabs.map((t) => (
                <button
                  key={t.v}
                  onClick={() => setSev(t.v)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition",
                    sev === t.v ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.l}
                  {typeof t.n === "number" && (
                    <span className={cn(
                      "grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold",
                      sev === t.v ? "bg-white/25 text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}>{t.n}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {filtered.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border/70 p-10 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-mint/15">
                  <Check className="h-5 w-5 text-mint" />
                </div>
                <div className="mt-3 text-sm font-semibold">All clear</div>
                <div className="text-xs text-muted-foreground">No matching alerts.</div>
              </div>
            )}
            {filtered.map((a) => {
              const isAcked = acked.has(a.id);
              return (
                <div key={a.id} className={cn(
                  "grid grid-cols-[10px_1fr_auto_auto] items-center gap-3 rounded-2xl border border-border/60 bg-background/40 p-3 transition",
                  isAcked && "opacity-60",
                )}>
                  <span className={cn("h-2 w-2 rounded-full", sevDot[a.severity])} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-semibold tracking-tight">{a.title}</div>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", sevBadge[a.severity])}>
                        {a.severity}
                      </span>
                      {isAcked && (
                        <span className="rounded-full bg-mint/15 px-2 py-0.5 text-[10px] font-semibold text-mint">ACK</span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{a.detail}</div>
                  </div>
                  <div className="whitespace-nowrap text-[11px] tabular-nums text-muted-foreground">
                    {formatTime(a.at)}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setAcked((s) => new Set(s).add(a.id))}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-border/70 text-muted-foreground hover:bg-mint/10 hover:text-mint transition"
                      title="Acknowledge"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDismissed((s) => new Set(s).add(a.id))}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-border/70 text-muted-foreground hover:bg-coral/10 hover:text-coral transition"
                      title="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
