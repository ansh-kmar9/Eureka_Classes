import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Trash2 } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { Card } from "@/components/ui/card";
import { BackLink } from "@/components/ui/back-link";
import { StatusBadge } from "@/features/students/components/status-badge";
import { StudentAvatar } from "@/features/students/components/student-card";
import { StudentActions } from "@/features/students/components/student-actions";
import { requireStaff } from "@/features/auth/guards";
import { deleteUserPermanently } from "@/features/admin/actions";
import { getStudent } from "@/features/students/queries";

export const metadata: Metadata = { title: "Student" };

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewer = await requireStaff();
  const student = await getStudent(id);
  if (!student) notFound();

  const t = await getTranslations("students");
  const common = await getTranslations("common");
  const streams = await getTranslations("streams");
  const boards = await getTranslations("boards");
  const format = await getFormatter();
  const isAdmin = viewer.role === "admin";
  const name = student.full_name ?? student.email;

  // After a successful delete this student no longer exists, so go back to the list.
  async function removeStudent() {
    "use server";
    const result = await deleteUserPermanently(id);
    if (result.ok) redirect("/teacher");
    return result;
  }

  const date = (value: string | null) =>
    value ? format.dateTime(new Date(value), { dateStyle: "medium" }) : null;

  const details = [
    { label: t("email"), value: student.email },
    { label: t("mobile"), value: student.mobile },
    { label: t("age"), value: student.age },
    { label: t("board"), value: student.board ? boards(student.board) : null },
    { label: t("class"), value: student.class ? common("classLabel", { n: student.class }) : null },
    { label: t("stream"), value: student.stream ? streams(student.stream) : null },
    { label: t("joined"), value: date(student.created_at) },
    { label: t("approvedOn"), value: date(student.approved_at) },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <BackLink href="/teacher">{t("back")}</BackLink>

      <Card className="space-y-4">
        <div className="flex items-center gap-4">
          <StudentAvatar student={student} />
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-xl font-bold">{student.full_name ?? student.email}</h1>
            <div className="mt-1">
              <StatusBadge status={student.status} />
            </div>
          </div>
        </div>
        <StudentActions student={student} />
      </Card>

      <Card>
        <dl className="divide-y divide-border text-sm">
          {details.map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-4 py-2.5">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="min-w-0 break-words text-right font-medium">{value ?? "-"}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {isAdmin && (
        <Card className="space-y-3 border-danger">
          <h2 className="font-semibold text-danger">{t("dangerTitle")}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("deleteHint")}</p>
          <ActionButton
            variant="danger"
            action={removeStudent}
            confirm={{
              title: t("deleteConfirmTitle", { name }),
              description: t("deleteConfirmBody"),
              confirmLabel: t("deletePermanent"),
              cancelLabel: t("cancel"),
            }}
          >
            <Trash2 className="size-4" aria-hidden />
            {t("deletePermanent")}
          </ActionButton>
        </Card>
      )}
    </div>
  );
}
