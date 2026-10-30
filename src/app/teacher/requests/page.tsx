import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { ArrowRight, Inbox } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { BackLink } from "@/components/ui/back-link";
import { decideClassChange } from "@/features/students/actions";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("requests");
  return { title: t("title") };
}

export default async function ClassRequestsPage() {
  const t = await getTranslations("requests");
  const toasts = await getTranslations("toasts");
  const students = await getTranslations("students");
  const common = await getTranslations("common");
  const streams = await getTranslations("streams");
  const boards = await getTranslations("boards");
  const format = await getFormatter();
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("class_change_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const ids = [...new Set(requests?.map((r) => r.student_id))];
  const { data: profiles } = ids.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", ids)
    : { data: [] };
  const nameOf = new Map(profiles?.map((p) => [p.id, p.full_name ?? p.email]));

  const label = (board: string | null, klass: number | null, stream: string | null) =>
    klass
      ? [
          board ? boards(board as "cbse") : null,
          common("classLabel", { n: klass }),
          stream ? streams(stream as "science") : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : "-";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <BackLink href="/teacher">{students("back")}</BackLink>
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>

      {!requests?.length ? (
        <EmptyState icon={Inbox} title={t("empty")} />
      ) : (
        <ul className="space-y-3">
          {requests.map((request) => (
            <li key={request.id}>
              <Card className="space-y-3">
                <div>
                  <p className="font-semibold">{nameOf.get(request.student_id)}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("requested", {
                      date: format.dateTime(new Date(request.created_at), { dateStyle: "medium" }),
                    })}
                  </p>
                </div>
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-full bg-surface-muted px-3 py-1">
                    {label(null, request.from_class, null)}
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
                  <span className="rounded-full bg-primary-soft px-3 py-1 font-medium text-primary">
                    {label(request.to_board, request.to_class, request.to_stream)}
                  </span>
                </p>
                <div className="flex gap-2">
                  <ActionButton
                    size="sm"
                    action={decideClassChange.bind(null, request.id, true)}
                    successMessage={toasts("requestApproved")}
                  >
                    {t("approve")}
                  </ActionButton>
                  <ActionButton
                    size="sm"
                    variant="outline"
                    action={decideClassChange.bind(null, request.id, false)}
                    successMessage={toasts("requestRejected")}
                  >
                    {t("reject")}
                  </ActionButton>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
