import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { BarChart3, Zap, TrendingUp, Leaf } from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Sidebar } from "@/components/kernel/Sidebar";
import { TopBar } from "@/components/kernel/TopBar";
import { EnergyTrendChart, RoomCompareChart } from "@/components/kernel/Charts";
import { KpiCard } from "@/components/kernel/KpiCard";
import { useSim } from "@/lib/simulation-context";
import { roomLabel } from "@/lib/devices";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Kernel" },
      { name: "description", content: "Energy trends, room comparisons, and top consumers across your smart office." },
      { property: "og:title", content: "Analytics — Kernel" },
      { property: "og:description", content: "Insight into your office energy consumption." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { devices, stats } = useSim();

  const typeBreakdown = useMemo(() => {
    const fans = devices.filter((d) => d.type === "fan" && d.status === "on").reduce((s, d) => s + d.powerDraw, 0);
    const lights = devices.filter((d) => d.type === "light" && d.status === "on").reduce((s, d) => s + d.powerDraw, 0);
    return [
      { name: "Fans", value: fans, fill: "oklch(0.55 0.19 275)" },
      { name: "Lights", value: lights, fill: "oklch(0.82 0.15 75)" },
    ];
  }, [devices]);

  const topConsumers = useMemo(() => {
    return [...devices]
      .filter((d) => d.status === "on")
      .sort((a, b) => b.runtimeSec - a.runtimeSec)
      .slice(0, 6);
  }, [devices]);

  const peak = 900;
  const savings = Math.max(0, peak - stats.totalPower);
  const efficiency = Math.round((1 - stats.totalPower / peak) * 100);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <TopBar />

        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10">
            <BarChart3 className="h-4 w-4 text-primary" strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Analytics</h2>
            <p className="text-xs text-muted-foreground">Live power and usage insights</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={Zap} label="Current Draw" value={stats.totalPower} suffix="W" tone="amber" />
          <KpiCard icon={TrendingUp} label="Peak Baseline" value={peak} suffix="W" tone="violet" />
          <KpiCard icon={Leaf} label="Saved vs Peak" value={savings} suffix="W" tone="mint" />
          <KpiCard icon={BarChart3} label="Efficiency" value={efficiency} suffix="%" tone="mint" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EnergyTrendChart currentTotal={stats.totalPower} />
          <RoomCompareChart perRoom={stats.perRoom} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-6">
          <div className="kernel-card p-5">
            <div className="text-sm font-semibold tracking-tight">Power by Device Type</div>
            <div className="text-[11px] text-muted-foreground">Currently drawing</div>
            <div className="h-56 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeBreakdown} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {typeBreakdown.map((e) => <Cell key={e.name} fill={e.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${v} W`, "Power"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.9 0.008 260)", background: "white", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex justify-center gap-4 text-xs">
              {typeBreakdown.map((t) => (
                <div key={t.name} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: t.fill }} />
                  <span className="text-muted-foreground">{t.name}</span>
                  <span className="font-medium tabular-nums">{t.value}W</span>
                </div>
              ))}
            </div>
          </div>

          <div className="kernel-card p-5">
            <div className="text-sm font-semibold tracking-tight">Top Consumers by Runtime</div>
            <div className="text-[11px] text-muted-foreground">Devices currently on</div>
            <div className="mt-3 space-y-2">
              {topConsumers.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
                  No devices currently on.
                </div>
              )}
              {topConsumers.map((d) => {
                const pct = Math.min(100, (d.runtimeSec / (8 * 3600)) * 100);
                return (
                  <div key={d.id} className="rounded-xl border border-border/60 bg-background/40 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="font-medium">{d.name}</div>
                      <div className="text-xs text-muted-foreground">{roomLabel(d.room)}</div>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-violet" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-1 flex justify-between text-[11px] tabular-nums text-muted-foreground">
                      <span>{Math.round(d.runtimeSec / 60)} min today</span>
                      <span>{d.powerDraw} W</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
