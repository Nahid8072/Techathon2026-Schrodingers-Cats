import { useState } from "react";
import type { Device, RoomId } from "@/lib/devices";
import { formatRuntime, formatTime, roomLabel } from "@/lib/devices";
import { cn } from "@/lib/utils";

interface FloorMapProps {
  devices: Device[];
  onToggle: (id: string) => void;
}

// SVG viewBox 1000x620 — hand-crafted top-view based on reference floor plan.
// Coordinate system: 3 rooms side-by-side, hallway below, entry at bottom center.

// device positions per room
const LAYOUT: Record<RoomId, {
  bounds: { x: number; y: number; w: number; h: number };
  floor: "warm" | "cool" | "wood";
  fans: { x: number; y: number }[];
  lights: { x: number; y: number }[];
}> = {
  drawing: {
    bounds: { x: 30, y: 30, w: 300, h: 440 },
    floor: "warm",
    fans: [
      { x: 180, y: 175 },
      { x: 180, y: 355 },
    ],
    lights: [
      { x: 90, y: 100 },
      { x: 270, y: 100 },
      { x: 90, y: 430 },
    ],
  },
  work1: {
    bounds: { x: 340, y: 30, w: 320, h: 440 },
    floor: "cool",
    fans: [
      { x: 500, y: 175 },
      { x: 500, y: 355 },
    ],
    lights: [
      { x: 410, y: 100 },
      { x: 590, y: 100 },
      { x: 500, y: 440 },
    ],
  },
  work2: {
    bounds: { x: 670, y: 30, w: 300, h: 440 },
    floor: "wood",
    fans: [
      { x: 820, y: 175 },
      { x: 820, y: 355 },
    ],
    lights: [
      { x: 730, y: 100 },
      { x: 910, y: 100 },
      { x: 820, y: 440 },
    ],
  },
};

const FLOOR_FILL: Record<"warm" | "cool" | "wood", string> = {
  warm: "url(#floor-warm)",
  cool: "url(#floor-cool)",
  wood: "url(#floor-wood)",
};

function Fan({ x, y, on, id, onEnter, onLeave, onClick }: {
  x: number; y: number; on: boolean; id: string;
  onEnter: (id: string, cx: number, cy: number) => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  const bladePath = "M0,-8 C 14,-24 40,-16 46,-4 C 34,-4 18,-2 6,-2 Z";
  return (
    <g
      transform={`translate(${x},${y})`}
      className="cursor-pointer"
      onMouseEnter={(e) => onEnter(id, e.clientX, e.clientY)}
      onMouseMove={(e) => onEnter(id, e.clientX, e.clientY)}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      {/* rotating blades — local origin (0,0) IS the hub */}
      <g>
        {on && (
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            from="0 0 0"
            to="360 0 0"
            dur="1.6s"
            repeatCount="indefinite"
            additive="replace"
          />
        )}
        <path d={bladePath} fill="#2b1e15" opacity="0.92" />
        <path d={bladePath} fill="#2b1e15" opacity="0.92" transform="rotate(120)" />
        <path d={bladePath} fill="#2b1e15" opacity="0.92" transform="rotate(240)" />
      </g>
      {/* stationary hub, on top of blades */}
      <circle r={9} fill="#3a2a20" />
      <circle r={4} fill="#1a1310" />
      {/* hover ring */}
      <circle r={30} fill="transparent" />
    </g>
  );
}

function Light({ x, y, on, id, onEnter, onLeave, onClick }: {
  x: number; y: number; on: boolean; id: string;
  onEnter: (id: string, cx: number, cy: number) => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  return (
    <g
      transform={`translate(${x},${y})`}
      className="cursor-pointer"
      onMouseEnter={(e) => onEnter(id, e.clientX, e.clientY)}
      onMouseMove={(e) => onEnter(id, e.clientX, e.clientY)}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      {on && (
        <>
          <circle r={44} fill="url(#glow)" className="animate-glow-pulse" />
          <circle r={22} fill="url(#glow)" />
        </>
      )}
      <circle
        r={10}
        fill={on ? "#fff2c8" : "#d9d5cc"}
        stroke={on ? "#f5c86a" : "#a8a49a"}
        strokeWidth={1.5}
      />
      <circle r={5} fill={on ? "#fff8dc" : "#eeeae0"} />
    </g>
  );
}

// Furniture pieces (static)
function DrawingRoomFurniture() {
  return (
    <g>
      {/* sofa */}
      <g transform="translate(60,215)">
        <rect x={0} y={0} width={80} height={110} rx={10} fill="#e8dcc7" stroke="#c9b89a" />
        <rect x={-6} y={-6} width={20} height={122} rx={6} fill="#d9c7ab" />
        <rect x={72} y={-6} width={20} height={122} rx={6} fill="#d9c7ab" />
        <rect x={4} y={-2} width={72} height={16} rx={4} fill="#d9c7ab" />
      </g>
      {/* armchair */}
      <g transform="translate(75,360)">
        <rect x={0} y={0} width={55} height={55} rx={10} fill="#e8dcc7" stroke="#c9b89a" />
        <rect x={-5} y={-5} width={15} height={65} rx={5} fill="#d9c7ab" />
        <rect x={45} y={-5} width={15} height={65} rx={5} fill="#d9c7ab" />
      </g>
      {/* rug + coffee table */}
      <rect x={165} y={240} width={130} height={90} rx={8} fill="#d8c4a0" opacity="0.55" />
      <rect x={200} y={265} width={60} height={40} rx={4} fill="#8b6a45" />
      {/* plant */}
      <g transform="translate(230,60)">
        <circle r={12} fill="#5b8a4a" />
        <circle cx={-6} cy={-4} r={7} fill="#6ea355" />
        <circle cx={6} cy={-2} r={6} fill="#7ab260" />
      </g>
      <text x={180} y={265} textAnchor="middle" fontSize={13} fontWeight={600}
            fill="#6b5842" letterSpacing="1.5" opacity="0.9">DRAWING ROOM</text>
    </g>
  );
}

function WorkRoomDesks({ ox, oy }: { ox: number; oy: number }) {
  // 4 desk clusters (2x2)
  const positions = [
    { x: 0, y: 0 },
    { x: 120, y: 0 },
    { x: 0, y: 210 },
    { x: 120, y: 210 },
  ];
  return (
    <g transform={`translate(${ox},${oy})`}>
      {positions.map((p, i) => (
        <g key={i} transform={`translate(${p.x},${p.y})`}>
          {/* chair */}
          <rect x={16} y={-2} width={30} height={22} rx={4} fill="#2a2a2e" />
          <rect x={18} y={0} width={26} height={16} rx={3} fill="#3d3d42" />
          {/* desk */}
          <rect x={0} y={22} width={90} height={44} rx={4} fill="#a97c50" stroke="#7c5a38" />
          {/* monitor */}
          <rect x={22} y={30} width={30} height={20} rx={2} fill="#1a1a20" />
          <rect x={24} y={32} width={26} height={14} rx={1} fill="#2f2f36" />
          {/* plant */}
          <circle cx={78} cy={38} r={4} fill="#6ea355" />
        </g>
      ))}
    </g>
  );
}

function WaterDispenser({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-10} y={0} width={20} height={26} rx={3} fill="#dfe7ee" stroke="#9fb3c6" />
      <ellipse cx={0} cy={-2} rx={9} ry={5} fill="#7ec2e6" />
      <rect x={-4} y={12} width={8} height={4} rx={1} fill="#4a90b8" />
    </g>
  );
}

export function FloorMap({ devices, onToggle }: FloorMapProps) {
  const [tip, setTip] = useState<{ id: string; x: number; y: number } | null>(null);
  const byId = new Map(devices.map((d) => [d.id, d]));

  const handleEnter = (id: string, cx: number, cy: number) => setTip({ id, x: cx, y: cy });
  const handleLeave = () => setTip(null);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-white/80 to-white/40 p-3 shadow-elegant backdrop-blur-xl">
      <svg viewBox="0 0 1000 620" className="w-full h-auto select-none">
        <defs>
          <linearGradient id="floor-warm" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f2e6ce" />
            <stop offset="100%" stopColor="#ead9b8" />
          </linearGradient>
          <linearGradient id="floor-cool" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f4f5f7" />
            <stop offset="100%" stopColor="#e5e8ec" />
          </linearGradient>
          <linearGradient id="floor-wood" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e0c39a" />
            <stop offset="100%" stopColor="#c9a273" />
          </linearGradient>
          <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#ffd580" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#ffb84a" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#ffb84a" stopOpacity="0" />
          </radialGradient>
          <pattern id="wood-grain" width="8" height="60" patternUnits="userSpaceOnUse">
            <rect width="8" height="60" fill="transparent" />
            <line x1="0" y1="0" x2="0" y2="60" stroke="#00000012" strokeWidth="0.5" />
          </pattern>
        </defs>

        {/* Hallway */}
        <rect x={30} y={480} width={940} height={110} rx={6} fill="#f0e4cb" stroke="#c9b89a" />
        <WaterDispenser x={900} y={520} />

        {/* Rooms */}
        {(Object.keys(LAYOUT) as RoomId[]).map((room) => {
          const L = LAYOUT[room];
          return (
            <g key={room}>
              <rect
                x={L.bounds.x}
                y={L.bounds.y}
                width={L.bounds.w}
                height={L.bounds.h}
                rx={4}
                fill={FLOOR_FILL[L.floor]}
                stroke="#9aa0a6"
                strokeWidth={3}
              />
              {L.floor === "wood" && (
                <rect
                  x={L.bounds.x}
                  y={L.bounds.y}
                  width={L.bounds.w}
                  height={L.bounds.h}
                  rx={4}
                  fill="url(#wood-grain)"
                />
              )}
            </g>
          );
        })}

        {/* Windows on top wall */}
        {[
          [80, 240], [400, 580], [720, 940],
        ].map(([x1, x2], i) => (
          <g key={i}>
            <line x1={x1} y1={30} x2={x2} y2={30} stroke="#7fb8d4" strokeWidth={6} />
            <line x1={x1} y1={30} x2={x2} y2={30} stroke="#c8e4f0" strokeWidth={2} />
          </g>
        ))}

        {/* Doors (arcs at bottom of each room to hallway) */}
        {[
          { x: 170, y: 470 },
          { x: 480, y: 470 },
          { x: 810, y: 470 },
        ].map((d, i) => (
          <g key={i}>
            <path
              d={`M ${d.x} ${d.y} a 40 40 0 0 1 40 -40`}
              stroke="#7c7f86"
              strokeWidth={1.2}
              fill="none"
              strokeDasharray="2 3"
            />
            <line x1={d.x} y1={d.y} x2={d.x + 40} y2={d.y} stroke="#5a5d63" strokeWidth={2.5} />
          </g>
        ))}

        {/* Furniture */}
        <DrawingRoomFurniture />
        <WorkRoomDesks ox={370} oy={70} />
        <WorkRoomDesks ox={700} oy={70} />

        {/* Room labels */}
        <text x={500} y={260} textAnchor="middle" fontSize={13} fontWeight={600}
              fill="#5a6270" letterSpacing="1.5">WORK ROOM 1</text>
        <text x={820} y={260} textAnchor="middle" fontSize={13} fontWeight={600}
              fill="#6b5333" letterSpacing="1.5">WORK ROOM 2</text>

        {/* Devices */}
        {(Object.keys(LAYOUT) as RoomId[]).map((room) => {
          const L = LAYOUT[room];
          return (
            <g key={`dev-${room}`}>
              {L.fans.map((p, i) => {
                const id = `${room}-fan-${i + 1}`;
                const d = byId.get(id);
                return (
                  <Fan
                    key={id}
                    x={p.x}
                    y={p.y}
                    on={d?.status === "on"}
                    id={id}
                    onEnter={handleEnter}
                    onLeave={handleLeave}
                    onClick={() => onToggle(id)}
                  />
                );
              })}
              {L.lights.map((p, i) => {
                const id = `${room}-light-${i + 1}`;
                const d = byId.get(id);
                return (
                  <Light
                    key={id}
                    x={p.x}
                    y={p.y}
                    on={d?.status === "on"}
                    id={id}
                    onEnter={handleEnter}
                    onLeave={handleLeave}
                    onClick={() => onToggle(id)}
                  />
                );
              })}
            </g>
          );
        })}

        {/* Entry */}
        <g transform="translate(490,585)">
          <path d="M 0 20 L 10 5 L 20 20 Z" fill="#5a5d63" />
          <text x={10} y={38} textAnchor="middle" fontSize={11} fontWeight={600}
                fill="#5a5d63" letterSpacing="1.5">ENTRY</text>
        </g>
      </svg>

      {/* Tooltip */}
      {tip && (() => {
        const d = byId.get(tip.id);
        if (!d) return null;
        return (
          <div
            className="pointer-events-none fixed z-50 kernel-card p-3 text-xs animate-fade-in"
            style={{ left: tip.x + 14, top: tip.y + 14, minWidth: 200 }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold text-sm tracking-tight">{d.name}</div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  d.status === "on"
                    ? "bg-mint/15 text-mint"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {d.status.toUpperCase()}
              </span>
            </div>
            <div className="mt-1 text-muted-foreground">{roomLabel(d.room)}</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <div className="text-muted-foreground">Power</div>
                <div className="font-medium tabular-nums">
                  {d.status === "on" ? d.powerDraw : 0} W
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Runtime</div>
                <div className="font-medium tabular-nums">{formatRuntime(d.runtimeSec)}</div>
              </div>
              <div className="col-span-2">
                <div className="text-muted-foreground">Last updated</div>
                <div className="font-medium tabular-nums">{formatTime(d.lastChangedAt)}</div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
