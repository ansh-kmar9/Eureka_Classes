import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Search, Trash2, UserCog } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label } from "@/components/ui/field";
import { deleteUserPermanently, setTeacherRole } from "@/features/admin/actions";
import { StudentAvatar } from "@/features/students/components/student-card";
import { sanitizeSearch } from "@/lib/search";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("adminNav");
  return { title: t("teachers") };
}

function PersonRow({ person, children }: { person: Profile; children: React.ReactNode }) {
  return (
    <Card className="flex items-center gap-3 p-3 sm:p-4">
      <StudentAvatar student={person} />
      <div className="min-w-0 flex-1">
        <p className="break-words font-semibold">{person.full_name ?? person.email}</p>
        <p className="break-words text-sm text-muted-foreground">{person.email}</p>
      </div>
      {children}
    </Card>
  );
}

export default async function AdminTeachersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const t = await getTranslations("admin");
  const toasts = await getTranslations("toasts");
  const q = sanitizeSearch((await searchParams).q);
  const supabase = await createClient();

  const [{ data: teachers }, { data: matches }] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "teacher").order("full_name"),
    q.length >= 2
      ? supabase
          .from("profiles")
          .select("*")
          .eq("role", "student")
          .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
          .limit(10)
      : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("teachersTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("teachersSubtitle")}</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">{t("addTitle")}</h2>
        <form method="get" className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="q" className="sr-only">
              {t("searchLabel")}
            </Label>
            <Input id="q" name="q" type="search" defaultValue={q} placeholder={t("searchLabel")} />
          </div>
          <Button type="submit" size="icon" aria-label={t("search")}>
            <Search className="size-5" aria-hidden />
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">{t("searchHint")}</p>

        {matches && (
          <ul className="space-y-2">
            {matches.length === 0 ? (
              <li className="text-sm text-muted-foreground">{t("noResults")}</li>
            ) : (
              matches.map((person) => (
                <li key={person.id}>
                  <PersonRow person={person}>
                    <ActionButton
                      size="sm"
                      action={setTeacherRole.bind(null, person.id, true)}
                      successMessage={toasts("teacherAdded")}
                    >
                      {t("makeTeacher")}
                    </ActionButton>
                  </PersonRow>
                </li>
              ))
            )}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">{t("currentTitle")}</h2>
        {!teachers?.length ? (
          <EmptyState icon={UserCog} title={t("noTeachers")} />
        ) : (
          <ul className="space-y-2">
            {teachers.map((person) => (
              <li key={person.id}>
                <PersonRow person={person}>
                  <ActionButton
                    size="icon"
                    variant="ghost"
                    aria-label={t("deleteTeacher")}
                    action={deleteUserPermanently.bind(null, person.id)}
                    successMessage={toasts("userDeleted")}
                    confirm={{
                      title: t("deleteTeacherTitle"),
                      description: t("deleteTeacherBody"),
                      confirmLabel: t("deleteTeacher"),
                      cancelLabel: t("cancel"),
                    }}
                  >
                    <Trash2 className="size-4 text-danger" aria-hidden />
                  </ActionButton>
                  <ActionButton
                    size="sm"
                    variant="outline"
                    action={setTeacherRole.bind(null, person.id, false)}
                    successMessage={toasts("teacherRemoved")}
                    confirm={{
                      title: t("removeTitle"),
                      description: t("removeBody"),
                      confirmLabel: t("removeTeacher"),
                      cancelLabel: t("cancel"),
                    }}
                  >
                    {t("removeTeacher")}
                  </ActionButton>
                </PersonRow>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
