import { createContext, useContext, type ReactNode } from "react";
import { useSimulation, type Alert } from "@/hooks/useSimulation";
import type { Device, RoomId } from "@/lib/devices";

export interface SimValue {
  devices: Device[];
  toggle: (id: string) => void;
  stats: {
    totalPower: number;
    onCount: number;
    perRoom: Record<RoomId, number>;
    activeDevices: number;
  };
  alerts: Alert[];
  now: number;
}

const SimulationContext = createContext<SimValue | undefined>(undefined);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const value = useSimulation();
  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}

export function useSim(): SimValue {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error("useSim must be used within SimulationProvider");
  return ctx;
}

