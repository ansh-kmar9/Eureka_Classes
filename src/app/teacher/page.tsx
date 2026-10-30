import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ChevronRight, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { StudentCard } from "@/features/students/components/student-card";
import {
  StudentFilterBar,
  studentsHref,
} from "@/features/students/components/student-filters";
import {
  getStatusCounts,
  listStudents,
  PAGE_SIZE,
  parseStudentFilters,
} from "@/features/students/queries";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("teacherNav");
  return { title: t("students") };
}

export default async function TeacherStudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("students");
  const filters = parseStudentFilters(await searchParams);
  const supabase = await createClient();

  const [{ rows, total }, counts, requests] = await Promise.all([
    listStudents(filters),
    getStatusCounts(),
    supabase
      .from("class_change_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pendingRequests = requests.count ?? 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>

      {pendingRequests > 0 && (
        <Link href="/teacher/requests">
          <Card className="flex items-center justify-between gap-3 border-accent bg-accent-soft py-3 text-accent-foreground">
            <span className="text-sm font-medium">
              {t("requestsAlert", { count: pendingRequests })}
            </span>
            <ChevronRight className="size-4" aria-hidden />
          </Card>
        </Link>
      )}

      <StudentFilterBar filters={filters} counts={counts} />

      <p className="text-sm text-muted-foreground">{t("count", { count: total })}</p>

      {rows.length === 0 ? (
        <EmptyState icon={Users} title={t("emptyTitle")} description={t("empty")} />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {rows.map((student) => (
            <li key={student.id}>
              <StudentCard student={student} />
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={filters.page}
        pageCount={pageCount}
        hrefFor={(page) => studentsHref({ ...filters, page })}
      />
    </div>
  );
}
