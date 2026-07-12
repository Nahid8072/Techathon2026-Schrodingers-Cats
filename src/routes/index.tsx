import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  BatteryCharging,
  Bell,
  Cpu,
  Leaf,
  Zap,
} from "lucide-react";
import { Sidebar } from "@/components/kernel/Sidebar";
import { TopBar } from "@/components/kernel/TopBar";
import { KpiCard } from "@/components/kernel/KpiCard";
import { FloorMap } from "@/components/kernel/FloorMap";
import { RoomStatusCard } from "@/components/kernel/RoomStatusCard";
import { PowerGauge } from "@/components/kernel/PowerGauge";
import { AlertsPanel } from "@/components/kernel/AlertsPanel";
import { OfficeHoursCard } from "@/components/kernel/OfficeHoursCard";
import { EnergyTrendChart, RoomCompareChart } from "@/components/kernel/Charts";
import { useSim } from "@/lib/simulation-context";
import { ROOMS } from "@/lib/devices";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kernel — Smart Office Monitoring" },
      {
        name: "description",
        content:
          "Kernel is an Apple-inspired smart office monitoring dashboard with a live digital twin of your floor plan, real-time device status, and energy analytics.",
      },
      { property: "og:title", content: "Kernel — Smart Office Monitoring" },
      {
        property: "og:description",
        content:
          "Live digital twin of your office floor plan with real-time device control, power analytics, and alerts.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { devices, toggle, stats, alerts } = useSim();
  const savings = Math.max(0, 900 - stats.totalPower);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <TopBar />

        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
          <KpiCard
            icon={Zap}
            label="Total Power"
            value={stats.totalPower}
            suffix="W"
            hint="Live consumption"
            tone="amber"
          />
          <KpiCard
            icon={Cpu}
            label="Active Devices"
            value={stats.activeDevices}
            hint="Across 3 rooms"
            tone="violet"
          />
          <KpiCard
            icon={Activity}
            label="Devices ON"
            value={stats.onCount}
            suffix={`/ ${stats.activeDevices}`}
            hint="Currently running"
            tone="mint"
          />
          <KpiCard
            icon={Bell}
            label="Alerts"
            value={alerts.length}
            hint="Needs attention"
            tone="coral"
          />
          <KpiCard
            icon={Leaf}
            label="Energy Saved"
            value={savings}
            suffix="W"
            hint="Vs. peak baseline"
            tone="mint"
          />
        </div>

        {/* Map + right rail */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6">
          <div className="space-y-6 min-w-0">
            <FloorMap devices={devices} onToggle={toggle} />

            {/* Device status by room */}
            <div className="kernel-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-mint/15">
                    <Activity className="h-4 w-4 text-mint" strokeWidth={2.2} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold tracking-tight">
                      Live Device Status
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {stats.activeDevices} Devices
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-mint" /> ON
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/50" /> OFF
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ROOMS.map((r) => (
                  <RoomStatusCard
                    key={r.id}
                    room={r.id}
                    devices={devices.filter((d) => d.room === r.id)}
                    roomPower={stats.perRoom[r.id]}
                    onToggle={toggle}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EnergyTrendChart currentTotal={stats.totalPower} />
              <RoomCompareChart perRoom={stats.perRoom} />
            </div>
          </div>

          <div className="space-y-6">
            <PowerGauge total={stats.totalPower} perRoom={stats.perRoom} />
            <AlertsPanel alerts={alerts} />
            <OfficeHoursCard />
            <div className="kernel-card p-5">
              <div className="flex items-center gap-2">
                <BatteryCharging className="h-4 w-4 text-mint" strokeWidth={2.2} />
                <div className="text-sm font-semibold tracking-tight">Efficiency</div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-semibold tabular-nums tracking-tight">
                    {Math.round((1 - stats.totalPower / 900) * 100)}%
                  </span>
                  <span className="text-xs text-muted-foreground">below peak</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-mint to-primary transition-all duration-700"
                    style={{
                      width: `${Math.max(4, Math.min(100, (1 - stats.totalPower / 900) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="pt-4 pb-2 text-center text-[11px] text-muted-foreground">
          Kernel · Smart Office Monitoring · Data refreshes every second
        </footer>
      </main>
    </div>
  );
}
