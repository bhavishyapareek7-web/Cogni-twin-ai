import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Brain,
  LayoutDashboard,
  Presentation,
  Dna,
  LogOut,
  Loader2,
  Lightbulb,
  Layers,
  Target,
  CalendarDays,
  Crown,
  ShieldCheck,
  BookOpen,
  BarChart3,
} from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getAccess } from "@/lib/entitlements.functions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Twin", icon: LayoutDashboard, premium: false },
  { to: "/genome", label: "Knowledge DNA", icon: Dna, premium: false },
  { to: "/classroom", label: "Classroom", icon: Presentation, premium: false },
  { to: "/doubts", label: "Doubts", icon: Lightbulb, premium: false },
  { to: "/revise", label: "Revise", icon: Layers, premium: false },
  { to: "/tests", label: "Tests", icon: Target, premium: false },
  { to: "/planner", label: "Planner", icon: CalendarDays, premium: false },
  { to: "/companion", label: "Book", icon: BookOpen, premium: true },
  { to: "/insights", label: "Insights", icon: BarChart3, premium: true },
  { to: "/premium", label: "Premium", icon: Crown, premium: false },
] as const;



export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
    staleTime: 30_000,
  });

  const loadAccess = useServerFn(getAccess);
  const { data: access } = useQuery({
    queryKey: ["access"],
    queryFn: () => loadAccess({}),
    enabled: !!user,
    staleTime: 60_000,
  });


  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

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
          <div className="flex shrink-0 items-center gap-2">
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
              {access?.isAdmin && (
                <Link
                  to="/admin"
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors",
                    pathname === "/admin"
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  <ShieldCheck className="size-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}
            </nav>
            {isLoading ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : user ? (
              <Button
                size="sm"
                variant="outline"
                onClick={signOut}
                className="ml-1"
                aria-label="Sign out"
              >
                <LogOut className="size-4" />
                <span className="ml-1 hidden sm:inline">Sign out</span>
              </Button>
            ) : (
              <Button size="sm" className="ml-1 bg-neural" asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-border/70 py-6 text-center text-xs text-muted-foreground">
        made with <span className="text-destructive">❤</span> by bhavishya
      </footer>

    </div>
  );
}
