import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Profile } from "@/lib/supabase/types";
import { StatusBadge } from "./status-badge";
import { StudentActions } from "./student-actions";

export function StudentAvatar({ student }: { student: Pick<Profile, "full_name" | "email" | "avatar_url"> }) {
  const initial = (student.full_name ?? student.email).trim().charAt(0).toUpperCase();
  return (
    <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft font-bold text-primary">
      {student.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={student.avatar_url} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
      ) : (
        initial
      )}
    </span>
  );
}

export function StudentCard({ student }: { student: Profile }) {
  const common = useTranslations("common");
  const streams = useTranslations("streams");

  const classLine = student.class
    ? [common("classLabel", { n: student.class }), student.stream ? streams(student.stream) : null]
        .filter(Boolean)
        .join(" · ")
    : null;

  return (
    <Card className="space-y-3 p-3 sm:p-4">
      <Link
        href={`/teacher/students/${student.id}`}
        className="flex items-center gap-3 rounded-control"
      >
        <StudentAvatar student={student} />
        <div className="min-w-0 flex-1">
          <p className="break-words font-semibold">{student.full_name ?? student.email}</p>
          <p className="break-words text-sm text-muted-foreground">
            {[classLine, student.mobile].filter(Boolean).join(" · ") || student.email}
          </p>
        </div>
        <StatusBadge status={student.status} />
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </Link>
      {student.status === "pending" && <StudentActions student={student} size="sm" />}
    </Card>
  );
}
