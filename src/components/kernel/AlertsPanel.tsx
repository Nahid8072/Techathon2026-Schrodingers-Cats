import { Bell, ChevronRight } from "lucide-react";
import type { Alert } from "@/hooks/useSimulation";
import { formatTime } from "@/lib/devices";
import { cn } from "@/lib/utils";

const sevDot: Record<Alert["severity"], string> = {
  high: "bg-coral",
  med: "bg-amber",
  low: "bg-primary",
};

export function AlertsPanel({ alerts }: { alerts: Alert[] }) {
  return (
    <div className="kernel-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-coral" strokeWidth={2.2} />
          <div className="text-sm font-semibold tracking-tight">Active Alerts</div>
        </div>
        <span className="grid h-6 min-w-6 place-items-center rounded-full bg-coral px-1.5 text-[11px] font-semibold text-white">
          {alerts.length}
        </span>
      </div>
      <div className="mt-3 space-y-3">
        {alerts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
            All systems nominal.
          </div>
        )}
        {alerts.map((a) => (
          <div key={a.id} className="grid grid-cols-[10px_1fr_auto] items-start gap-2.5">
            <span className={cn("mt-1.5 h-2 w-2 rounded-full", sevDot[a.severity])} />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold tracking-tight">{a.title}</div>
              <div className="text-[11px] leading-relaxed text-muted-foreground">
                {a.detail}
              </div>
            </div>
            <div className="whitespace-nowrap text-[11px] tabular-nums text-muted-foreground">
              {formatTime(a.at)}
            </div>
          </div>
        ))}
      </div>
      <button className="mt-3 flex w-full items-center justify-between rounded-2xl border border-border/60 bg-background/60 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent/60 transition">
        View all alerts
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
