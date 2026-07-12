import { Zap } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import type { RoomId } from "@/lib/devices";
import { roomLabel } from "@/lib/devices";

interface Props {
  total: number;
  perRoom: Record<RoomId, number>;
  max?: number;
}

export function PowerGauge({ total, perRoom, max = 900 }: Props) {
  const v = useCountUp(total);
  const pct = Math.min(1, total / max);
  // Semicircle: from angle 180 -> 360 (or -180 -> 0)
  const r = 90;
  const cx = 130;
  const cy = 120;
  const start = polar(cx, cy, r, 180);
  const end = polar(cx, cy, r, 180 + pct * 180);
  const largeArc = pct > 0.5 ? 1 : 0;
  const arcPath = `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;

  return (
    <div className="kernel-card p-5">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber/20">
          <Zap className="h-4 w-4 text-amber" strokeWidth={2.2} />
        </div>
        <div className="text-sm font-semibold tracking-tight">Total Power Consumption</div>
      </div>

      <div className="relative mx-auto mt-2 w-[260px]">
        <svg viewBox="0 0 260 160" className="w-full">
          <defs>
            <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6ee7a7" />
              <stop offset="50%" stopColor="#f5c86a" />
              <stop offset="100%" stopColor="#f97a5c" />
            </linearGradient>
          </defs>
          {/* track */}
          <path
            d={`M ${polar(cx, cy, r, 180).x} ${polar(cx, cy, r, 180).y} A ${r} ${r} 0 1 1 ${
              polar(cx, cy, r, 360).x
            } ${polar(cx, cy, r, 360).y}`}
            stroke="#eceef2"
            strokeWidth={14}
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={arcPath}
            stroke="url(#gauge-grad)"
            strokeWidth={14}
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-semibold tracking-tight tabular-nums">
              {Math.round(v)}
            </span>
            <span className="text-sm font-medium text-muted-foreground">W</span>
          </div>
          <div className="text-[11px] text-muted-foreground">Total Office Power</div>
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-mint/15 px-2 py-0.5 text-[10px] font-semibold text-mint">
            <span className="h-1.5 w-1.5 rounded-full bg-mint animate-live-dot" />
            Live
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {(Object.keys(perRoom) as RoomId[]).map((r, i) => (
          <div key={r} className="rounded-2xl border border-border/60 bg-background/60 p-2.5 text-center">
            <div className="text-[10px] font-medium text-muted-foreground truncate">
              {roomLabel(r)}
            </div>
            <div
              className={`mt-0.5 text-sm font-semibold tabular-nums ${
                ["text-amber", "text-primary", "text-mint"][i]
              }`}
            >
              {perRoom[r]} W
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}
