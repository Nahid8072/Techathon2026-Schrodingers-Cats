import { ChevronDown, LogOut, Sun, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useClock } from "@/hooks/useClock";
import { useAuth, initialsOf } from "@/lib/auth";


export function TopBar() {
  const now = useClock();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const date = now.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
  const stamp = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const displayName = user?.name ?? "Guest";
  const initials = initialsOf(displayName);


  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 md:flex md:flex-wrap md:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-violet text-primary-foreground shadow-elegant">
          <Zap className="h-5 w-5" strokeWidth={2.4} />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl sm:text-2xl font-semibold tracking-tight">Kernel</h1>
          <p className="truncate text-xs text-muted-foreground">Smart Office · Monitoring System</p>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-3 rounded-full border border-border/60 bg-card/70 px-4 py-2 shadow-soft backdrop-blur-xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-mint animate-live-dot" />
          Live
        </span>
        <span className="h-4 w-px bg-border" />
        <span className="text-xs text-muted-foreground">Data last updated</span>
        <span className="text-xs font-medium tabular-nums text-foreground">{stamp}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-border/60 bg-card/70 px-3 py-2 shadow-soft backdrop-blur-xl">
          <Sun className="h-4 w-4 text-amber" />
          <div className="text-right">
            <div className="text-sm font-semibold tabular-nums leading-tight">{time}</div>
            <div className="text-[11px] text-muted-foreground leading-tight">{date}</div>
          </div>
        </div>
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card/70 px-3 py-2 shadow-soft backdrop-blur-xl hover:bg-accent/50 transition"
          >
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet to-primary text-primary-foreground text-xs font-semibold">
              {initials}
            </div>
            <div className="text-left leading-tight">
              <div className="text-sm font-semibold">{displayName}</div>
              <div className="text-[11px] text-muted-foreground truncate max-w-[140px]">{user?.email ?? "Not signed in"}</div>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-border/70 bg-card p-1.5 shadow-elegant animate-fade-in z-50">
              <div className="px-3 py-2">
                <div className="text-sm font-semibold truncate">{displayName}</div>
                <div className="text-[11px] text-muted-foreground truncate">{user?.email}</div>
              </div>
              <div className="my-1 h-px bg-border" />
              <button
                onClick={() => { logout(); navigate({ to: "/login", replace: true }); }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-coral hover:bg-coral/10 transition"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
