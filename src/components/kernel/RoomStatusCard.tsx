import { Fan, Home, Lightbulb, Wifi } from "lucide-react";
import type { Device, RoomId } from "@/lib/devices";
import { formatTime, roomLabel } from "@/lib/devices";
import { cn } from "@/lib/utils";

interface Props {
  room: RoomId;
  devices: Device[];
  roomPower: number;
  onToggle: (id: string) => void;
}

const roomTone: Record<RoomId, { bg: string; text: string; icon: React.ElementType }> = {
  drawing: { bg: "bg-amber/15", text: "text-amber", icon: Home },
  work1: { bg: "bg-primary/15", text: "text-primary", icon: Wifi },
  work2: { bg: "bg-mint/15", text: "text-mint", icon: Home },
};

export function RoomStatusCard({ room, devices, roomPower, onToggle }: Props) {
  const tone = roomTone[room];
  const fans = devices.filter((d) => d.type === "fan");
  const lights = devices.filter((d) => d.type === "light");

  return (
    <div className="kernel-card overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elegant">
      <div className={cn("flex items-center gap-2 px-4 py-3", tone.bg)}>
        <tone.icon className={cn("h-4 w-4", tone.text)} strokeWidth={2.2} />
        <div className="font-semibold text-sm tracking-tight">{roomLabel(room)}</div>
      </div>
      <div className="p-4 space-y-3">
        <Section title="Fans" icon={Fan}>
          {fans.map((d) => (
            <Row key={d.id} d={d} onToggle={onToggle} />
          ))}
        </Section>
        <Section title="Lights" icon={Lightbulb}>
          {lights.map((d) => (
            <Row key={d.id} d={d} onToggle={onToggle} />
          ))}
        </Section>
      </div>
      <div
        className={cn(
          "border-t border-border/60 px-4 py-2.5 text-center text-sm font-semibold tabular-nums",
          tone.text,
        )}
      >
        Room Power: <span className="tracking-tight">{roomPower} W</span>
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ d, onToggle }: { d: Device; onToggle: (id: string) => void }) {
  const on = d.status === "on";
  return (
    <button
      onClick={() => onToggle(d.id)}
      className="grid w-full grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-accent/50"
    >
      {d.type === "fan" ? (
        <Fan className="h-3.5 w-3.5 text-muted-foreground" />
      ) : (
        <Lightbulb className="h-3.5 w-3.5 text-muted-foreground" />
      )}
      <span className="text-sm">{d.name}</span>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[10px] font-semibold",
          on ? "bg-mint/15 text-mint" : "bg-muted text-muted-foreground",
        )}
      >
        {on ? "ON" : "OFF"}
      </span>
      <span className="text-xs font-medium tabular-nums text-muted-foreground w-10 text-right">
        {on ? d.powerDraw : 0} W
      </span>
      <span className="text-xs tabular-nums text-muted-foreground w-14 text-right">
        {formatTime(d.lastChangedAt)}
      </span>
    </button>
  );
}
