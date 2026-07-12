import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { initialDevices, type Device, type RoomId } from "@/lib/devices";

export interface Alert {
  id: string;
  severity: "high" | "med" | "low";
  title: string;
  detail: string;
  at: number;
}

export function useSimulation() {
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [now, setNow] = useState<number>(Date.now());
  const allOnSince = useRef<Record<RoomId, number | null>>({
    drawing: Date.now() - 2.2 * 3600 * 1000,
    work1: null,
    work2: Date.now() - 1.1 * 3600 * 1000,
  });

  // tick every second: accumulate runtime + occasional random flip
  useEffect(() => {
    const t = setInterval(() => {
      const t0 = Date.now();
      setNow(t0);
      setDevices((prev) => {
        const next = prev.map((d) =>
          d.status === "on" ? { ...d, runtimeSec: d.runtimeSec + 1 } : d,
        );
        // ~ every 12s randomly flip a device
        if (Math.random() < 1 / 12) {
          const i = Math.floor(Math.random() * next.length);
          const d = next[i];
          next[i] = {
            ...d,
            status: d.status === "on" ? "off" : "on",
            lastChangedAt: t0,
            runtimeSec: d.status === "on" ? d.runtimeSec : 0,
          };
        }
        // update allOnSince trackers
        for (const room of ["drawing", "work1", "work2"] as RoomId[]) {
          const inRoom = next.filter((x) => x.room === room);
          const allOn = inRoom.every((x) => x.status === "on");
          if (allOn && allOnSince.current[room] == null) {
            allOnSince.current[room] = t0;
          } else if (!allOn) {
            allOnSince.current[room] = null;
          }
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const toggle = useCallback((id: string) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status: d.status === "on" ? "off" : "on",
              lastChangedAt: Date.now(),
              runtimeSec: d.status === "on" ? d.runtimeSec : 0,
            }
          : d,
      ),
    );
  }, []);

  const stats = useMemo(() => {
    const totalPower = devices.reduce((s, d) => s + (d.status === "on" ? d.powerDraw : 0), 0);
    const onCount = devices.filter((d) => d.status === "on").length;
    const perRoom: Record<RoomId, number> = { drawing: 0, work1: 0, work2: 0 };
    for (const d of devices) if (d.status === "on") perRoom[d.room] += d.powerDraw;
    return { totalPower, onCount, perRoom, activeDevices: devices.length };
  }, [devices]);

  const alerts: Alert[] = useMemo(() => {
    const a: Alert[] = [];
    const hour = new Date(now).getHours();
    const outsideHours = hour < 9 || hour >= 17;
    // long-run all-on rooms
    for (const room of ["drawing", "work1", "work2"] as RoomId[]) {
      const since = allOnSince.current[room];
      if (since && now - since > 2 * 3600 * 1000) {
        const hrs = ((now - since) / 3600000).toFixed(1);
        a.push({
          id: `${room}-allon`,
          severity: "high",
          title: `${roomLabelShort(room)} — All devices ON`,
          detail: `All 5 devices ON for ${hrs}h`,
          at: since,
        });
      }
    }
    // outside-hours ON devices (limit to a few)
    if (outsideHours) {
      const onDevices = devices.filter((d) => d.status === "on").slice(0, 3);
      for (const d of onDevices) {
        a.push({
          id: `oh-${d.id}`,
          severity: "med",
          title: `${roomLabelShort(d.room)} — ${d.name} ON`,
          detail: `Device is ON outside office hours (9 AM–5 PM)`,
          at: d.lastChangedAt,
        });
      }
    } else {
      // add a couple of illustrative recent alerts to keep UI populated
      const recent = [...devices]
        .sort((x, y) => y.lastChangedAt - x.lastChangedAt)
        .slice(0, 2);
      for (const d of recent) {
        if (d.status === "on") {
          a.push({
            id: `recent-${d.id}`,
            severity: "low",
            title: `${roomLabelShort(d.room)} — ${d.name} turned ON`,
            detail: `Recent state change`,
            at: d.lastChangedAt,
          });
        }
      }
    }
    return a.sort((x, y) => y.at - x.at).slice(0, 6);
  }, [devices, now]);

  return { devices, toggle, stats, alerts, now };
}

function roomLabelShort(r: RoomId) {
  return r === "drawing" ? "Drawing Room" : r === "work1" ? "Work Room 1" : "Work Room 2";
}
