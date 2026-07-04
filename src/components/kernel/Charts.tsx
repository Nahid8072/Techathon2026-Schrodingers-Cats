import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function EnergyTrendChart({ currentTotal }: { currentTotal: number }) {
  const [data, setData] = useState(() =>
    Array.from({ length: 12 }, (_, i) => ({
      t: `${(new Date().getHours() - 11 + i + 24) % 24}:00`,
      w: 300 + Math.round(Math.random() * 300),
    })),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setData((prev) => {
        const next = [...prev.slice(1), { t: `${new Date().getHours()}:00`, w: currentTotal }];
        return next;
      });
    }, 5000);
    return () => clearInterval(id);
  }, [currentTotal]);

  return (
    <div className="kernel-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold tracking-tight">Energy Trend</div>
          <div className="text-[11px] text-muted-foreground">Last 12 hours · Watts</div>
        </div>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: -18, right: 8, top: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="trend-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.55 0.19 275)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="oklch(0.55 0.19 275)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 6" stroke="oklch(0.9 0.008 260)" />
            <XAxis dataKey="t" tick={{ fontSize: 10, fill: "oklch(0.5 0.02 260)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "oklch(0.5 0.02 260)" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid oklch(0.9 0.008 260)",
                background: "white",
                fontSize: 12,
              }}
              formatter={(v) => [`${v} W`, "Power"]}
            />
            <Area
              type="monotone"
              dataKey="w"
              stroke="oklch(0.55 0.19 275)"
              strokeWidth={2.4}
              fill="url(#trend-grad)"
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function RoomCompareChart({
  perRoom,
}: {
  perRoom: { drawing: number; work1: number; work2: number };
}) {
  const data = [
    { room: "Drawing", w: perRoom.drawing, fill: "oklch(0.82 0.15 75)" },
    { room: "Work 1", w: perRoom.work1, fill: "oklch(0.55 0.19 275)" },
    { room: "Work 2", w: perRoom.work2, fill: "oklch(0.72 0.15 165)" },
  ];
  return (
    <div className="kernel-card p-5">
      <div className="mb-3">
        <div className="text-sm font-semibold tracking-tight">Room Comparison</div>
        <div className="text-[11px] text-muted-foreground">Current power draw per room</div>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: -18, right: 8, top: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 6" stroke="oklch(0.9 0.008 260)" vertical={false} />
            <XAxis dataKey="room" tick={{ fontSize: 11, fill: "oklch(0.5 0.02 260)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "oklch(0.5 0.02 260)" }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "oklch(0.95 0.01 270 / 0.5)" }}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid oklch(0.9 0.008 260)",
                background: "white",
                fontSize: 12,
              }}
              formatter={(v) => [`${v} W`, "Power"]}
            />
            <Bar dataKey="w" radius={[10, 10, 4, 4]} animationDuration={700} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
