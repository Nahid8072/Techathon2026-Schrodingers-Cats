import { Clock } from "lucide-react";
import { useClock } from "@/hooks/useClock";

export function OfficeHoursCard() {
  const now = useClock();
  const h = now.getHours();
  const inside = h >= 9 && h < 17;
  return (
    <div className="kernel-card p-5">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" strokeWidth={2.2} />
        <div className="text-sm font-semibold tracking-tight">Office Hours</div>
      </div>
      <div
        className={`mt-3 rounded-2xl border p-3 text-center ${
          inside ? "border-mint/30 bg-mint/10" : "border-coral/30 bg-coral/10"
        }`}
      >
        <div className="inline-flex items-center gap-2 text-sm font-semibold">
          <span
            className={`h-2 w-2 rounded-full ${inside ? "bg-mint" : "bg-coral"} animate-live-dot`}
          />
          {inside ? "Inside Office Hours" : "Outside Office Hours"}
        </div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">
          Office Hours: 9:00 AM – 5:00 PM
        </div>
      </div>
      <div className="mt-2 rounded-2xl bg-background/60 border border-border/60 p-2.5 text-center text-xs text-muted-foreground">
        Current Time:{" "}
        <span className="font-semibold text-foreground tabular-nums">
          {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
      </div>
    </div>
  );
}
