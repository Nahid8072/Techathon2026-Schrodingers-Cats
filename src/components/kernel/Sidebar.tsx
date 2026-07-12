import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutGrid,
  Cpu,
  BarChart3,
  Bell,
  FileText,
  Settings,
  LogOut,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";


const items = [
  { title: "Dashboard", url: "/", icon: LayoutGrid },
  { title: "Devices", url: "/devices", icon: Cpu },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Alerts", url: "/alerts", icon: Bell, badge: 3 },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const { logout } = useAuth();
  const onLogout = () => {
    logout();
    navigate({ to: "/login", replace: true });
  };


  return (
    <aside className="hidden md:flex sticky top-0 h-screen w-[92px] shrink-0 flex-col items-center gap-1 border-r border-border/60 bg-sidebar/70 backdrop-blur-xl py-6">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-primary to-violet text-primary-foreground shadow-elegant">
        <Zap className="h-5 w-5" strokeWidth={2.4} />
      </div>

      <nav className="flex flex-1 flex-col items-center gap-1.5 pt-2">
        {items.map((item) => {
          const active = pathname === item.url;
          return (
            <Link
              key={item.title}
              to={item.url}
              className={cn(
                "group relative flex w-16 flex-col items-center gap-1 rounded-2xl px-1 py-2.5 text-[11px] font-medium transition-all",
                active
                  ? "bg-accent text-primary shadow-soft"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <span className="relative">
                <item.icon className="h-[22px] w-[22px]" strokeWidth={1.8} />
                {item.badge ? (
                  <span className="absolute -right-2 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-coral px-1 text-[10px] font-semibold text-white">
                    {item.badge}
                  </span>
                ) : null}
              </span>
              <span className="tracking-tight">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <button onClick={onLogout} className="mb-1 flex w-16 flex-col items-center gap-1 rounded-2xl px-1 py-2.5 text-[11px] font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground">
        <LogOut className="h-[22px] w-[22px]" strokeWidth={1.8} />
        Logout
      </button>
    </aside>
  );
}
