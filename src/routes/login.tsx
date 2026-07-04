import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Zap, Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Kernel" },
      { name: "description", content: "Sign in to the Kernel smart office monitoring dashboard." },
      { property: "og:title", content: "Sign in — Kernel" },
      { property: "og:description", content: "Access your Kernel dashboard." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, ready, login } = useAuth();
  const navigate = useNavigate();
  const location = useRouterState({ select: (r) => r.location });
  const redirect = (location.search as { redirect?: string })?.redirect || "/";

  const [email, setEmail] = useState("admin@kernel.io");
  const [password, setPassword] = useState("demo");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user) navigate({ to: redirect, replace: true });
  }, [ready, user, navigate, redirect]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = login(email, password);
    setBusy(false);
    if (!res.ok) setError(res.error);
    else navigate({ to: redirect, replace: true });
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-violet text-primary-foreground shadow-elegant">
            <Zap className="h-6 w-6" strokeWidth={2.4} />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Welcome to Kernel</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your smart office monitoring dashboard
          </p>
        </div>

        <form onSubmit={onSubmit} className="kernel-card p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border/70 bg-background/60 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                placeholder="you@company.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border/70 bg-background/60 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-coral/30 bg-coral/10 px-3 py-2 text-xs text-coral">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant transition hover:opacity-95 disabled:opacity-60"
          >
            Sign in
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>

          <p className="text-center text-[11px] text-muted-foreground">
            Demo build · any email + 4+ char password works
          </p>
        </form>
      </div>
    </div>
  );
}
