export type RoomId = "drawing" | "work1" | "work2";
export type DeviceType = "fan" | "light";
export type DeviceStatus = "on" | "off";

export interface Device {
  id: string;
  room: RoomId;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  powerDraw: number; // W when on
  lastChangedAt: number; // epoch ms
  runtimeSec: number; // accumulated ON time
}

export const ROOMS: { id: RoomId; label: string; accent: string }[] = [
  { id: "drawing", label: "Drawing Room", accent: "amber" },
  { id: "work1", label: "Work Room 1", accent: "violet" },
  { id: "work2", label: "Work Room 2", accent: "mint" },
];

export const roomLabel = (id: RoomId) => ROOMS.find((r) => r.id === id)!.label;

const FAN_W = 60;
const LIGHT_W = 15;

function seedDevices(): Device[] {
  const now = Date.now();
  const list: Device[] = [];
  const specs: { room: RoomId; onPattern: boolean[] }[] = [
    // fans then lights per room; pattern indexes: fan1,fan2,light1,light2,light3
    { room: "drawing", onPattern: [true, true, true, true, true] },
    { room: "work1", onPattern: [true, false, true, true, false] },
    { room: "work2", onPattern: [true, true, true, true, true] },
  ];
  for (const s of specs) {
    for (let i = 0; i < 2; i++) {
      const on = s.onPattern[i];
      list.push({
        id: `${s.room}-fan-${i + 1}`,
        room: s.room,
        name: `Fan ${i + 1}`,
        type: "fan",
        status: on ? "on" : "off",
        powerDraw: FAN_W,
        lastChangedAt: now - Math.floor(Math.random() * 3_600_000),
        runtimeSec: on ? 3600 + Math.floor(Math.random() * 7200) : 0,
      });
    }
    for (let i = 0; i < 3; i++) {
      const on = s.onPattern[2 + i];
      list.push({
        id: `${s.room}-light-${i + 1}`,
        room: s.room,
        name: `Light ${i + 1}`,
        type: "light",
        status: on ? "on" : "off",
        powerDraw: LIGHT_W,
        lastChangedAt: now - Math.floor(Math.random() * 3_600_000),
        runtimeSec: on ? 1800 + Math.floor(Math.random() * 5400) : 0,
      });
    }
  }
  return list;
}

export const initialDevices = seedDevices();

export function formatRuntime(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}h ${rm}m`;
}

export function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
