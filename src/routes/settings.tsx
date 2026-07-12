import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Settings as SettingsIcon, Moon, Sun, Bell, User, Clock, AlertTriangle } from "lucide-react";
import { Sidebar } from "@/components/kernel/Sidebar";
import { TopBar } from "@/components/kernel/TopBar";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Kernel" },
      { name: "description", content: "Profile, preferences, office hours, and notifications for your Kernel dashboard." },
      { property: "og:title", content: "Settings — Kernel" },
      { property: "og:description", content: "Configure your Kernel workspace." },
    ],
  }),
  component: SettingsPage,
});

const PREFS_KEY = "kernel.prefs";

interface Prefs {
  theme: "light" | "dark";
  clock24: boolean;
  tempUnit: "C" | "F";
  officeStart: number;
  officeEnd: number;
  notifyOffHours: boolean;
  notifyLongRun: boolean;
  notifyEmail: boolean;
}

const DEFAULT_PREFS: Prefs = {
  theme: "light",
  clock24: false,
  tempUnit: "C",
  officeStart: 9,
  officeEnd: 17,
  notifyOffHours: true,
  notifyLongRun: true,
  notifyEmail: false,
};

function loadPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

function SettingsPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  useEffect(() => {
    if (prefs.theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [prefs.theme]);

  const savePrefs = (next: Prefs) => {
    setPrefs(next);
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    setSaved("Preferences saved");
    setTimeout(() => setSaved(null), 1600);
  };

  const saveProfile = () => {
    setSaved("Profile updated");
    setTimeout(() => setSaved(null), 1600);
  };

  const resetSim = () => {
    if (!confirm("Reload the page to reset the simulation?")) return;
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <TopBar />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10">
              <SettingsIcon className="h-4 w-4 text-primary" strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Settings</h2>
              <p className="text-xs text-muted-foreground">Manage your workspace preferences</p>
            </div>
          </div>
          {saved && (
            <div className="rounded-full bg-mint/15 px-3 py-1 text-xs font-medium text-mint animate-fade-in">
              {saved}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card icon={User} title="Profile" desc="Displayed across the dashboard">
            <Field label="Name">
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Email">
              <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
            </Field>
            <button onClick={saveProfile} className={primaryBtn}>Save profile</button>
          </Card>

          <Card icon={prefs.theme === "dark" ? Moon : Sun} title="Preferences" desc="Appearance and units">
            <Toggle
              label="Dark mode"
              hint="Switch the entire dashboard theme"
              on={prefs.theme === "dark"}
              onChange={(v) => savePrefs({ ...prefs, theme: v ? "dark" : "light" })}
            />
            <Toggle
              label="24-hour clock"
              hint="Use 24-hour time format"
              on={prefs.clock24}
              onChange={(v) => savePrefs({ ...prefs, clock24: v })}
            />
            <Field label="Temperature unit">
              <div className="inline-flex rounded-xl border border-border/70 bg-background/60 p-0.5">
                {(["C", "F"] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => savePrefs({ ...prefs, tempUnit: u })}
                    className={cn(
                      "px-4 py-1.5 text-xs font-medium rounded-lg transition",
                      prefs.tempUnit === u ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                    )}
                  >°{u}</button>
                ))}
              </div>
            </Field>
          </Card>

          <Card icon={Clock} title="Office Hours" desc="Used for off-hours alerts">
            <Field label={`Start: ${prefs.officeStart}:00`}>
              <input
                type="range" min={0} max={23} value={prefs.officeStart}
                onChange={(e) => savePrefs({ ...prefs, officeStart: Number(e.target.value) })}
                className="w-full accent-primary"
              />
            </Field>
            <Field label={`End: ${prefs.officeEnd}:00`}>
              <input
                type="range" min={1} max={24} value={prefs.officeEnd}
                onChange={(e) => savePrefs({ ...prefs, officeEnd: Number(e.target.value) })}
                className="w-full accent-primary"
              />
            </Field>
            <div className="rounded-xl border border-border/60 bg-background/40 p-3 text-xs text-muted-foreground">
              Alerts flag devices running outside {prefs.officeStart}:00 – {prefs.officeEnd}:00.
            </div>
          </Card>

          <Card icon={Bell} title="Notifications" desc="What to alert you about">
            <Toggle label="Off-hours activity" hint="Devices on outside office hours" on={prefs.notifyOffHours} onChange={(v) => savePrefs({ ...prefs, notifyOffHours: v })} />
            <Toggle label="Long-running rooms" hint="All devices on > 2h" on={prefs.notifyLongRun} onChange={(v) => savePrefs({ ...prefs, notifyLongRun: v })} />
            <Toggle label="Email digest" hint="Weekly summary to your inbox" on={prefs.notifyEmail} onChange={(v) => savePrefs({ ...prefs, notifyEmail: v })} />
          </Card>

          <Card icon={AlertTriangle} title="Danger zone" desc="Destructive actions">
            <button
              onClick={resetSim}
              className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-2 text-sm font-medium text-coral hover:bg-coral/15 transition"
            >
              Reset simulation
            </button>
            <p className="text-[11px] text-muted-foreground">
              Reloads the page and reseeds device state. Your profile stays.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition";
const primaryBtn = "self-start rounded-xl bg-gradient-to-r from-primary to-violet px-4 py-2 text-sm font-semibold text-primary-foreground shadow-elegant hover:opacity-95 transition";

function Card({ icon: Icon, title, desc, children }: {
  icon: React.ElementType; title: string; desc: string; children: React.ReactNode;
}) {
  return (
    <div className="kernel-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10">
          <Icon className="h-4 w-4 text-primary" strokeWidth={2.2} />
        </div>
        <div>
          <div className="text-sm font-semibold tracking-tight">{title}</div>
          <div className="text-[11px] text-muted-foreground">{desc}</div>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, hint, on, onChange }: {
  label: string; hint?: string; on: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
      </div>
      <button
        onClick={() => onChange(!on)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          on ? "bg-primary" : "bg-muted",
        )}
      >
        <span className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow-soft transition-transform",
          on ? "translate-x-5" : "translate-x-0.5",
        )} />
      </button>
    </div>
  );
}
