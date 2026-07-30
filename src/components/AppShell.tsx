import { Link, useRouterState } from "@tanstack/react-router";
import { Brain, LayoutDashboard, Presentation, Dna } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Home", icon: Brain },
  { to: "/dashboard", label: "Twin", icon: LayoutDashboard },
  { to: "/genome", label: "Knowledge DNA", icon: Dna },
  { to: "/classroom", label: "Classroom", icon: Presentation },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:flex sm:justify-between sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-neural glow">
              <Brain className="size-5 text-primary-foreground" />
            </span>
            <span className="truncate text-lg font-semibold tracking-tight">
              Edu<span className="text-gradient">Twin</span> AI
            </span>
          </Link>
          <nav className="flex shrink-0 items-center gap-1 overflow-x-auto">
            {nav.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
