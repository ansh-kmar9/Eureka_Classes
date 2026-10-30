import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { Megaphone, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteAnnouncement } from "@/features/announcements/actions";
import { AnnouncementForm } from "@/features/announcements/components/announcement-form";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("announcements");
  return { title: t("title") };
}

export default async function AnnouncementsPage() {
  const t = await getTranslations("announcements");
  const students = await getTranslations("students");
  const toasts = await getTranslations("toasts");
  const format = await getFormatter();
  const supabase = await createClient();

  const { data: announcements } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
      <AnnouncementForm />

      {!announcements?.length ? (
        <EmptyState icon={Megaphone} title={t("empty")} />
      ) : (
        <ul className="space-y-3">
          {announcements.map((item) => (
            <li key={item.id}>
              <Card className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-semibold">{item.title}</h2>
                    <p className="text-xs text-muted-foreground">
                      {t("posted", {
                        date: format.dateTime(new Date(item.created_at), {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }),
                      })}
                    </p>
                  </div>
                  <ActionButton
                    size="icon"
                    variant="ghost"
                    aria-label={t("delete")}
                    action={deleteAnnouncement.bind(null, item.id)}
                    successMessage={toasts("deleted")}
                    confirm={{
                      title: t("deleteTitle"),
                      description: t("deleteBody"),
                      confirmLabel: t("delete"),
                      cancelLabel: students("cancel"),
                    }}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </ActionButton>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
