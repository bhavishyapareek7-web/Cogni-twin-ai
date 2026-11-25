import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { BookOpen, Flame, GraduationCap, Loader2, Target, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addOrgMember, getOrgOverview, getTeacherOverview } from "@/lib/org.functions";

export const Route = createFileRoute("/_authenticated/teacher")({
  head: () => ({
    meta: [
      { title: "Teacher Dashboard — EduTwin AI" },
      {
        name: "description",
        content:
          "Track your students' lessons, mock tests and streaks, and manage your organization's members on EduTwin AI.",
      },
      { property: "og:title", content: "Teacher Dashboard — EduTwin AI" },
      {
        property: "og:description",
        content: "See how every student in your organization is progressing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TeacherDashboard,
});

function TeacherDashboard() {
  const queryClient = useQueryClient();
  const loadTeacher = useServerFn(getTeacherOverview);
  const loadOrg = useServerFn(getOrgOverview);
  const addMember = useServerFn(addOrgMember);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");

  const teacherQuery = useQuery({
    queryKey: ["teacher-overview"],
    queryFn: () => loadTeacher({}),
  });
  const orgQuery = useQuery({
    queryKey: ["org-overview"],
    queryFn: () => loadOrg({}),
  });

  const addMutation = useMutation({
    mutationFn: (input: { email: string; role: "student" | "teacher" }) =>
      addMember({ data: input }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("Member added to your organization");
        setEmail("");
        void queryClient.invalidateQueries({ queryKey: ["org-overview"] });
        void queryClient.invalidateQueries({ queryKey: ["teacher-overview"] });
      } else {
        toast.error(result.reason ?? "Could not add that member");
      }
    },
    onError: () => toast.error("Could not add that member"),
  });

  const students = teacherQuery.data?.students ?? [];
  const members = orgQuery.data?.members ?? [];
  const loading = teacherQuery.isLoading || orgQuery.isLoading;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-neural glow">
            <GraduationCap className="size-5 text-primary-foreground" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Teacher Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Every student's progress in one place.
            </p>
          </div>
        </div>

        <div className="panel mb-6 p-5">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <UserPlus className="size-4 text-accent" /> Add a member (organization admins)
          </h2>
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (email.trim()) addMutation.mutate({ email: email.trim(), role });
            }}
          >
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Member's login email"
              className="flex-1"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "student" | "teacher")}
              className="rounded-md border border-border bg-background px-3 text-sm"
              aria-label="Member role"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
            <Button type="submit" className="bg-neural" disabled={addMutation.isPending}>
              {addMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Add member
            </Button>
          </form>
        </div>

        {loading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : students.length === 0 && members.length === 0 ? (
          <div className="panel grid place-items-center gap-2 py-16 text-center">
            <Users className="size-8 text-muted-foreground" />
            <p className="font-medium">No students yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Once your organization admin adds students — or you add them above — their progress
              appears here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {students.length > 0 && (
              <section className="panel p-5">
                <h2 className="mb-4 text-lg font-semibold">My students</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="pb-2 pr-4 font-medium">Student</th>
                        <th className="pb-2 pr-4 font-medium">
                          <span className="flex items-center gap-1">
                            <BookOpen className="size-3.5" /> Lessons done
                          </span>
                        </th>
                        <th className="pb-2 pr-4 font-medium">
                          <span className="flex items-center gap-1">
                            <Target className="size-3.5" /> Tests
                          </span>
                        </th>
                        <th className="pb-2 pr-4 font-medium">Best score</th>
                        <th className="pb-2 font-medium">
                          <span className="flex items-center gap-1">
                            <Flame className="size-3.5" /> Streak
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s) => (
                        <tr key={s.memberId} className="border-b border-border/50 last:border-0">
                          <td className="py-2.5 pr-4 font-medium">{s.name}</td>
                          <td className="py-2.5 pr-4">{s.lessonsDone}</td>
                          <td className="py-2.5 pr-4">{s.testsTaken}</td>
                          <td className="py-2.5 pr-4">
                            {s.bestScore === null ? "—" : `${Math.round(s.bestScore)}%`}
                          </td>
                          <td className="py-2.5">{s.streakDays} days</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {members.length > 0 && (
              <section className="panel p-5">
                <h2 className="mb-4 text-lg font-semibold">Organization members</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="pb-2 pr-4 font-medium">Name</th>
                        <th className="pb-2 pr-4 font-medium">Role</th>
                        <th className="pb-2 pr-4 font-medium">Level</th>
                        <th className="pb-2 font-medium">Lessons done</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m) => (
                        <tr key={m.memberId} className="border-b border-border/50 last:border-0">
                          <td className="py-2.5 pr-4 font-medium">{m.name}</td>
                          <td className="py-2.5 pr-4 capitalize">{m.role}</td>
                          <td className="py-2.5 pr-4">{m.level}</td>
                          <td className="py-2.5">{m.lessonsDone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
