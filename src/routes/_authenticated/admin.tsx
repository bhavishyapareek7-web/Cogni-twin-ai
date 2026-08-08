import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Crown,
  Loader2,
  ScrollText,
  Search,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAccess, claimSuperAdmin } from "@/lib/entitlements.functions";
import {
  adminBulkGrant,
  adminGrantPremium,
  adminListUsers,
  adminOverview,
  adminRevokePremium,
  adminSetFeatureFlag,
  adminSetSuspended,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Control Center — EduTwin AI" },
      {
        name: "description",
        content:
          "Administrator dashboard for EduTwin AI: membership overview, user management, Premium grants, feature switches and audit logs.",
      },
      { property: "og:title", content: "Admin Control Center — EduTwin AI" },
      { property: "og:description", content: "Manage learners, Premium access and feature flags." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

const PRESETS = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "180 days", days: 180 },
  { label: "1 year", days: 365 },
  { label: "Lifetime", days: 0 },
];

function AdminPage() {
  const qc = useQueryClient();
  const loadAccess = useServerFn(getAccess);
  const claim = useServerFn(claimSuperAdmin);
  const overview = useServerFn(adminOverview);
  const listUsers = useServerFn(adminListUsers);
  const grant = useServerFn(adminGrantPremium);
  const revoke = useServerFn(adminRevokePremium);
  const bulk = useServerFn(adminBulkGrant);
  const setFlag = useServerFn(adminSetFeatureFlag);
  const setSuspended = useServerFn(adminSetSuspended);

  const [query, setQuery] = useState("");
  const [email, setEmail] = useState("");
  const [days, setDays] = useState(30);
  const [reason, setReason] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [bulkResults, setBulkResults] = useState<Array<{ email: string; status: string }>>([]);

  const access = useQuery({ queryKey: ["access"], queryFn: () => loadAccess({}) });
  const isAdmin = access.data?.isAdmin ?? false;
  const isSuper = access.data?.roles.includes("super_admin") ?? false;

  const stats = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => overview({}),
    enabled: isAdmin,
  });
  const users = useQuery({
    queryKey: ["admin-users", query],
    queryFn: () => listUsers({ data: { query } }),
    enabled: isAdmin,
  });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin-users"] });
    void qc.invalidateQueries({ queryKey: ["admin-overview"] });
  };

  const claimMutation = useMutation({
    mutationFn: () => claim({}),
    onSuccess: () => {
      toast.success("You are now Super Admin.");
      void qc.invalidateQueries({ queryKey: ["access"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const grantMutation = useMutation({
    mutationFn: () =>
      grant({
        data: {
          email,
          plan: days === 0 ? "lifetime" : "premium",
          days,
          ...(reason ? { reason } : {}),
        },
      }),
    onSuccess: () => {
      toast.success(`Premium granted to ${email}.`);
      setEmail("");
      setReason("");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeMutation = useMutation({
    mutationFn: (userId: string) => revoke({ data: { userId } }),
    onSuccess: () => {
      toast.success("Premium revoked — learning data kept.");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const suspendMutation = useMutation({
    mutationFn: (v: { userId: string; suspended: boolean }) => setSuspended({ data: v }),
    onSuccess: () => {
      toast.success("Account status updated.");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkMutation = useMutation({
    mutationFn: () =>
      bulk({
        data: {
          emails: bulkText
            .split(/[\s,;]+/)
            .map((s) => s.trim())
            .filter((s) => s.includes("@")),
          plan: days === 0 ? "lifetime" : "premium",
          days,
        },
      }),
    onSuccess: (res) => {
      setBulkResults(res.results);
      toast.success("Bulk grant finished.");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const flagMutation = useMutation({
    mutationFn: (v: { feature: string; enabled: boolean }) => setFlag({ data: v }),
    onSuccess: () => {
      toast.success("Feature switch updated.");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cards = useMemo(() => {
    const t = stats.data?.totals;
    return [
      { label: "Total learners", value: t?.users ?? "—" },
      { label: "Premium", value: t?.premium ?? "—" },
      { label: "Free", value: t?.free ?? "—" },
      { label: "New this week", value: t?.newThisWeek ?? "—" },
      { label: "Expiring in 7d", value: t?.expiringSoon ?? "—" },
      { label: "Classroom sessions", value: t?.classroomSessions ?? "—" },
      { label: "Mock tests", value: t?.mockTests ?? "—" },
    ];
  }, [stats.data]);

  if (access.isLoading) {
    return (
      <AppShell>
        <div className="grid min-h-[50vh] place-items-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
          <div className="panel space-y-3 p-6 text-center">
            <ShieldCheck className="mx-auto size-6 text-muted-foreground" />
            <h1 className="text-xl font-bold">Administrator access required</h1>
            <p className="text-sm text-muted-foreground">
              This area is restricted. If you are setting up EduTwin AI for the first time and no
              administrator exists yet, you can claim the Super Admin role once.
            </p>
            <Button
              className="bg-neural"
              disabled={claimMutation.isPending}
              onClick={() => claimMutation.mutate()}
            >
              {claimMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Crown className="mr-2 size-4" />
              )}
              Claim Super Admin
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6">
        <header>
          <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <ShieldCheck className="size-3.5" /> {access.data?.roles.join(", ")}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Admin <span className="text-gradient">Control Center</span>
          </h1>
        </header>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {cards.map((c) => (
            <div key={c.label} className="panel p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{c.label}</p>
              <p className="mt-2 text-2xl font-bold">{c.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="panel p-5">
            <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <Crown className="size-3.5" /> Grant Premium
            </p>
            <div className="mt-3 space-y-3">
              <Input
                placeholder="learner@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setDays(p.days)}
                    className={
                      days === p.days
                        ? "rounded-full border border-primary/50 bg-primary/15 px-3 py-1 text-xs"
                        : "rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground"
                    }
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <Input
                placeholder="Reason (internal)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <Button
                className="bg-neural"
                disabled={!email.includes("@") || grantMutation.isPending}
                onClick={() => grantMutation.mutate()}
              >
                {grantMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Grant Premium
              </Button>
            </div>

            <p className="mt-6 text-xs uppercase tracking-widest text-muted-foreground">
              Bulk grant (paste emails)
            </p>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={4}
              placeholder={"student1@example.com\nstudent2@example.com"}
              className="mt-2 w-full rounded-xl border border-border bg-surface p-3 text-sm outline-none focus:border-primary/60"
            />
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              disabled={!bulkText.includes("@") || bulkMutation.isPending}
              onClick={() => bulkMutation.mutate()}
            >
              {bulkMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Run bulk grant
            </Button>
            {bulkResults.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                {bulkResults.map((r) => (
                  <li key={r.email}>
                    {r.email} — {r.status}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel p-5">
            <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <ToggleRight className="size-3.5" /> Feature switches
            </p>
            <ul className="mt-3 space-y-2">
              {(stats.data?.flags ?? []).map((f) => (
                <li
                  key={f.feature}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                >
                  <span className="truncate">{f.feature}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={flagMutation.isPending}
                    onClick={() =>
                      flagMutation.mutate({ feature: f.feature, enabled: !f.enabled })
                    }
                  >
                    {f.enabled ? (
                      <>
                        <ToggleRight className="size-4 text-mastered" /> On
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="size-4 text-muted-foreground" /> Off
                      </>
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <Users className="size-3.5" /> Learners
            </p>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                className="w-64 pl-9"
                placeholder="Search email or name"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">Learner</th>
                  <th className="py-2 pr-3">Plan</th>
                  <th className="py-2 pr-3">Expires</th>
                  <th className="py-2 pr-3">Roles</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(users.data ?? []).map((u) => (
                  <tr key={u.id} className="border-t border-border/70">
                    <td className="py-2 pr-3">
                      <span className="block">{u.displayName ?? "—"}</span>
                      <span className="block text-xs text-muted-foreground">{u.email}</span>
                    </td>
                    <td className="py-2 pr-3">
                      {u.premium ? (
                        <span className="rounded-full border border-mastered/50 bg-mastered/15 px-2 py-0.5 text-xs">
                          {u.plan}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">free</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground">
                      {u.expiresAt ? u.expiresAt.slice(0, 10) : u.premium ? "never" : "—"}
                    </td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground">
                      {u.roles.join(", ") || "—"}
                    </td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEmail(u.email);
                            toast.info("Email filled in — choose a duration and grant.");
                          }}
                        >
                          Grant
                        </Button>
                        {u.premium && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={revokeMutation.isPending}
                            onClick={() => revokeMutation.mutate(u.id)}
                          >
                            Revoke
                          </Button>
                        )}
                        {isSuper && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={suspendMutation.isPending}
                            onClick={() =>
                              suspendMutation.mutate({ userId: u.id, suspended: !u.suspended })
                            }
                          >
                            {u.suspended ? "Restore" : "Suspend"}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.isLoading && (
              <Loader2 className="mt-3 size-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </section>

        <section className="panel p-5">
          <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <ScrollText className="size-3.5" /> Audit log
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {(stats.data?.logs ?? []).map((l) => (
              <li key={l.id} className="flex flex-wrap gap-2 border-b border-border/60 pb-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(l.created_at).toLocaleString()}
                </span>
                <span className="font-medium">{l.action}</span>
                <span className="text-xs text-muted-foreground">
                  {JSON.stringify(l.metadata)}
                </span>
              </li>
            ))}
            {!stats.data?.logs?.length && (
              <li className="text-sm text-muted-foreground">No admin actions recorded yet.</li>
            )}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
