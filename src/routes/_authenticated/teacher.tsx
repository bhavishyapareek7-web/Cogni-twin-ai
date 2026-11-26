import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  BookOpen,
  Flame,
  GraduationCap,
  Link2,
  Loader2,
  Target,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addOrgMember,
  assignStudentToTeacher,
  getOrgOverview,
  getTeacherOverview,
  removeTeacherAssignment,
} from "@/lib/org.functions";

export const Route = createFileRoute("/_authenticated/teacher")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Teacher Dashboard — EduTwin AI" },
      {
        name: "description",
        content:
          "Track your assigned students' lessons, mock tests and streaks, and manage your organization's members on EduTwin AI.",
      },
      { property: "og:title", content: "Teacher Dashboard — EduTwin AI" },
      {
        property: "og:description",
        content: "See how every student assigned to you is progressing.",
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
  const assignStudent = useServerFn(assignStudentToTeacher);
  const removeAssignment = useServerFn(removeTeacherAssignment);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [teacherId, setTeacherId] = useState("");
  const [studentId, setStudentId] = useState("");

  const teacherQuery = useQuery({
    queryKey: ["teacher-overview"],
    queryFn: () => loadTeacher({}),
  });
  const orgQuery = useQuery({
    queryKey: ["org-overview"],
    queryFn: () => loadOrg({}),
  });

  const refreshOverview = () => {
    void queryClient.invalidateQueries({ queryKey: ["org-overview"] });
    void queryClient.invalidateQueries({ queryKey: ["teacher-overview"] });
  };

  const addMutation = useMutation({
    mutationFn: (input: { email: string; role: "student" | "teacher" }) =>
      addMember({ data: input }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("Member added to your organization");
        setEmail("");
        refreshOverview();
      } else {
        toast.error(result.reason ?? "Could not add that member");
      }
    },
    onError: () => toast.error("Could not add that member"),
  });

  const assignMutation = useMutation({
    mutationFn: () => assignStudent({ data: { teacherId, studentId } }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("Student assigned to teacher");
        setTeacherId("");
        setStudentId("");
        refreshOverview();
      } else {
        toast.error(result.reason ?? "Could not assign that student");
      }
    },
    onError: () => toast.error("Could not assign that student"),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeAssignment({ data: { id } }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("Assignment removed");
        refreshOverview();
      } else {
        toast.error(result.reason ?? "Could not remove that assignment");
      }
    },
    onError: () => toast.error("Could not remove that assignment"),
  });

  const students = teacherQuery.data?.students ?? [];
  const members = orgQuery.data?.members ?? [];
  const assignments = orgQuery.data?.assignments ?? [];
  const isOrgAdmin = orgQuery.data?.isOrgAdmin ?? false;
  const orgTeachers = members.filter((member) => member.role === "teacher");
  const orgStudents = members.filter((member) => member.role === "student");
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
              Progress for the students assigned to you.
            </p>
          </div>
        </div>

        {isOrgAdmin && (
          <div className="panel mb-6 p-5">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <UserPlus className="size-4 text-accent" /> Add a member (organization admins)
          </h2>
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              if (email.trim()) addMutation.mutate({ email: email.trim(), role });
            }}
          >
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Member's login email"
              className="flex-1"
            />
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as "student" | "teacher")}
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
        )}

        {isOrgAdmin && members.length > 0 && (
          <div className="panel mb-6 p-5">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Link2 className="size-4 text-accent" /> Assign a student to a teacher
            </h2>
            <p className="mb-3 text-sm text-muted-foreground">
              Teachers see only the students assigned here.
            </p>
            <form
              className="flex flex-col gap-2 lg:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                if (!teacherId || !studentId) {
                  toast.error("Choose both a teacher and a student.");
                  return;
                }
                assignMutation.mutate();
              }}
            >
              <select
                value={teacherId}
                onChange={(event) => setTeacherId(event.target.value)}
                className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                aria-label="Teacher to assign"
              >
                <option value="">Choose teacher</option>
                {orgTeachers.map((teacher) => (
                  <option key={teacher.memberId} value={teacher.memberId}>
                    {teacher.name}
                  </option>
                ))}
              </select>
              <select
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
                className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                aria-label="Student to assign"
              >
                <option value="">Choose student</option>
                {orgStudents.map((student) => (
                  <option key={student.memberId} value={student.memberId}>
                    {student.name}
                  </option>
                ))}
              </select>
              <Button
                type="submit"
                className="bg-neural"
                disabled={assignMutation.isPending || !orgTeachers.length || !orgStudents.length}
              >
                {assignMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Assign student
              </Button>
            </form>

            {assignments.length > 0 && (
              <ul className="mt-4 space-y-2">
                {assignments.map((assignment) => (
                  <li
                    key={assignment.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                  >
                    <span>
                      <span className="font-medium">{assignment.studentName}</span>
                      <span className="text-muted-foreground"> → {assignment.teacherName}</span>
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label={`Remove ${assignment.studentName} from ${assignment.teacherName}`}
                      disabled={removeMutation.isPending}
                      onClick={() => removeMutation.mutate(assignment.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {loading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : students.length === 0 && members.length === 0 ? (
          <div className="panel grid place-items-center gap-2 py-16 text-center">
            <Users className="size-8 text-muted-foreground" />
            <p className="font-medium">No assigned students yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Your organization admin needs to assign students to you. Their progress will then
              appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="panel p-5">
              <h2 className="mb-4 text-lg font-semibold">My assigned students</h2>
              {students.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No students are assigned to your teacher account yet.
                </p>
              ) : (
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
                      {students.map((student) => (
                        <tr key={student.memberId} className="border-b border-border/50 last:border-0">
                          <td className="py-2.5 pr-4 font-medium">{student.name}</td>
                          <td className="py-2.5 pr-4">{student.lessonsDone}</td>
                          <td className="py-2.5 pr-4">{student.testsTaken}</td>
                          <td className="py-2.5 pr-4">
                            {student.bestScore === null ? "—" : `${Math.round(student.bestScore)}%`}
                          </td>
                          <td className="py-2.5">{student.streakDays} days</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

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
                      {members.map((member) => (
                        <tr key={member.memberId} className="border-b border-border/50 last:border-0">
                          <td className="py-2.5 pr-4 font-medium">{member.name}</td>
                          <td className="py-2.5 pr-4 capitalize">{member.role}</td>
                          <td className="py-2.5 pr-4">{member.level}</td>
                          <td className="py-2.5">{member.lessonsDone}</td>
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
