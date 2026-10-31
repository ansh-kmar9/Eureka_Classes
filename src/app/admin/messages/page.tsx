import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { Inbox, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteMessage, markMessageRead } from "@/features/admin/actions";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("adminNav");
  return { title: t("messages") };
}

export default async function AdminMessagesPage() {
  const t = await getTranslations("admin");
  const toasts = await getTranslations("toasts");
  const format = await getFormatter();
  const supabase = await createClient();

  const { data: messages } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">{t("messagesTitle")}</h1>

      {!messages?.length ? (
        <EmptyState icon={Inbox} title={t("noMessages")} />
      ) : (
        <ul className="space-y-3">
          {messages.map((item) => (
            <li key={item.id}>
              <Card className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-semibold">
                      <span className="break-words">{item.name}</span>
                      {!item.is_read && <Badge tone="primary">{t("new")}</Badge>}
                    </p>
                    <p className="break-all text-sm text-muted-foreground">
                      <a href={`mailto:${item.email}`} className="hover:underline">
                        {item.email}
                      </a>
                      {item.phone && (
                        <>
                          {" · "}
                          <a href={`tel:${item.phone}`} className="hover:underline">
                            {item.phone}
                          </a>
                        </>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {format.dateTime(new Date(item.created_at), {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <ActionButton
                    size="icon"
                    variant="ghost"
                    aria-label={t("delete")}
                    action={deleteMessage.bind(null, item.id)}
                    successMessage={toasts("deleted")}
                    confirm={{
                      title: t("deleteTitle"),
                      description: t("deleteBody"),
                      confirmLabel: t("delete"),
                      cancelLabel: t("cancel"),
                    }}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </ActionButton>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{item.message}</p>
                <ActionButton
                  size="sm"
                  variant="outline"
                  action={markMessageRead.bind(null, item.id, !item.is_read)}
                  successMessage={item.is_read ? toasts("markedUnread") : toasts("markedRead")}
                >
                  {item.is_read ? t("markUnread") : t("markRead")}
                </ActionButton>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
