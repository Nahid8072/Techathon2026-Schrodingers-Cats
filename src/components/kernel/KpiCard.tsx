import { useCountUp } from "@/hooks/useCountUp";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  suffix?: string;
  hint?: string;
  tone?: "violet" | "mint" | "amber" | "coral";
  decimals?: number;
}

const toneMap = {
  violet: { bg: "from-primary/15 to-violet/5", ic: "text-primary", ring: "bg-primary/10" },
  mint: { bg: "from-mint/20 to-mint/5", ic: "text-mint", ring: "bg-mint/15" },
  amber: { bg: "from-amber/25 to-amber/5", ic: "text-amber", ring: "bg-amber/20" },
  coral: { bg: "from-coral/20 to-coral/5", ic: "text-coral", ring: "bg-coral/15" },
};

export function KpiCard({
  icon: Icon,
  label,
  value,
  suffix,
  hint,
  tone = "violet",
  decimals = 0,
}: KpiCardProps) {
  const v = useCountUp(value);
  const t = toneMap[tone];
  return (
    <div className="group kernel-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elegant">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br",
            t.bg,
          )}
        >
          <Icon className={cn("h-5 w-5", t.ic)} strokeWidth={2} />
        </div>
        <div className="text-xs font-medium text-muted-foreground tracking-tight">{label}</div>
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-semibold tracking-tight tabular-nums">
          {v.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })}
        </span>
        {suffix ? <span className="text-sm font-medium text-muted-foreground">{suffix}</span> : null}
      </div>
      {hint ? <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div> : null}
    </div>
  );
}
