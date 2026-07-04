import { createFileRoute } from "@tanstack/react-router";
import { FileText, Download } from "lucide-react";
import { Sidebar } from "@/components/kernel/Sidebar";
import { TopBar } from "@/components/kernel/TopBar";
import { useSim } from "@/lib/simulation-context";
import { formatRuntime, roomLabel } from "@/lib/devices";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Kernel" },
      { name: "description", content: "Download smart office energy reports and device inventories." },
      { property: "og:title", content: "Reports — Kernel" },
      { property: "og:description", content: "Export energy and device reports from Kernel." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { devices, stats } = useSim();

  const downloadCsv = () => {
    const header = ["id", "name", "room", "type", "status", "power_w", "runtime_sec"];
    const rows = devices.map((d) => [d.id, d.name, roomLabel(d.room), d.type, d.status, d.powerDraw, d.runtimeSec]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `kernel-devices-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <TopBar />
        <div className="kernel-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10">
                <FileText className="h-4 w-4 text-primary" strokeWidth={2.2} />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-tight">Reports</div>
                <div className="text-[11px] text-muted-foreground">Live inventory snapshot</div>
              </div>
            </div>
            <button
              onClick={downloadCsv}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-violet px-3 py-2 text-xs font-semibold text-primary-foreground shadow-elegant hover:opacity-95 transition"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Devices" v={devices.length} />
            <Stat label="On now" v={stats.onCount} />
            <Stat label="Current draw" v={`${stats.totalPower} W`} />
            <Stat label="Total runtime" v={formatRuntime(devices.reduce((s, d) => s + d.runtimeSec, 0))} />
          </div>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, v }: { label: string; v: string | number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums tracking-tight">{v}</div>
    </div>
  );
}
