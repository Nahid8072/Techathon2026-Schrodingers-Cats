import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Cpu, Fan, Lightbulb, Search, Power } from "lucide-react";
import { Sidebar } from "@/components/kernel/Sidebar";
import { TopBar } from "@/components/kernel/TopBar";
import { useSim } from "@/lib/simulation-context";
import { ROOMS, formatRuntime, formatTime, roomLabel, type Device, type RoomId } from "@/lib/devices";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/devices")({
  head: () => ({
    meta: [
      { title: "Devices — Kernel" },
      { name: "description", content: "Manage every fan and light across your office with live status, power draw, and runtime metrics." },
      { property: "og:title", content: "Devices — Kernel" },
      { property: "og:description", content: "Control and monitor every device in your smart office." },
    ],
  }),
  component: DevicesPage,
});

type Filter = "all" | "on" | "off";
type TypeFilter = "all" | "fan" | "light";
type RoomFilter = "all" | RoomId;

function DevicesPage() {
  const { devices, toggle } = useSim();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Filter>("all");
  const [type, setType] = useState<TypeFilter>("all");
  const [room, setRoom] = useState<RoomFilter>("all");

  const filtered = useMemo(() => {
    return devices.filter((d) => {
      if (status !== "all" && d.status !== status) return false;
      if (type !== "all" && d.type !== type) return false;
      if (room !== "all" && d.room !== room) return false;
      if (q && !`${d.name} ${roomLabel(d.room)}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [devices, q, status, type, room]);

  const turnOffAll = () => {
    filtered.filter((d) => d.status === "on").forEach((d) => toggle(d.id));
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
                <Cpu className="h-4 w-4 text-primary" strokeWidth={2.2} />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-tight">All Devices</div>
                <div className="text-[11px] text-muted-foreground">
                  {filtered.length} of {devices.length} shown
                </div>
              </div>
            </div>
            <button
              onClick={turnOffAll}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-background/60 px-3 py-1.5 text-xs font-medium hover:bg-accent/60 transition"
            >
              <Power className="h-3.5 w-3.5" />
              Turn off visible
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search device or room…"
                className="w-full rounded-xl border border-border/70 bg-background/60 pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>
            <Segmented
              value={room}
              onChange={setRoom}
              options={[{ v: "all", l: "All rooms" }, ...ROOMS.map((r) => ({ v: r.id as RoomFilter, l: r.label }))]}
            />
            <Segmented
              value={type}
              onChange={setType}
              options={[
                { v: "all", l: "All" },
                { v: "fan", l: "Fans" },
                { v: "light", l: "Lights" },
              ]}
            />
            <Segmented
              value={status}
              onChange={setStatus}
              options={[
                { v: "all", l: "Any" },
                { v: "on", l: "On" },
                { v: "off", l: "Off" },
              ]}
            />
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold">Device</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Room</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Power</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Runtime</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Last change</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Toggle</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <DeviceRow key={d.id} d={d} onToggle={toggle} />
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No devices match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function DeviceRow({ d, onToggle }: { d: Device; onToggle: (id: string) => void }) {
  const on = d.status === "on";
  const Icon = d.type === "fan" ? Fan : Lightbulb;
  return (
    <tr className="border-t border-border/50 hover:bg-accent/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={cn("grid h-7 w-7 place-items-center rounded-lg", on ? "bg-mint/15 text-mint" : "bg-muted text-muted-foreground")}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="font-medium">{d.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{roomLabel(d.room)}</td>
      <td className="px-4 py-3">
        <span className={cn(
          "rounded-full px-2 py-0.5 text-[10px] font-semibold",
          on ? "bg-mint/15 text-mint" : "bg-muted text-muted-foreground",
        )}>{on ? "ON" : "OFF"}</span>
      </td>
      <td className="px-4 py-3 text-right tabular-nums">{on ? d.powerDraw : 0} W</td>
      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatRuntime(d.runtimeSec)}</td>
      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatTime(d.lastChangedAt)}</td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={() => onToggle(d.id)}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
            on ? "bg-mint" : "bg-muted",
          )}
          aria-label={`Toggle ${d.name}`}
        >
          <span className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white shadow-soft transition-transform",
            on ? "translate-x-5" : "translate-x-0.5",
          )} />
        </button>
      </td>
    </tr>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { v: T; l: string }[];
}) {
  return (
    <div className="inline-flex rounded-xl border border-border/70 bg-background/60 p-0.5">
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-lg transition",
            value === o.v ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}
