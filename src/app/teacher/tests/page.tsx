import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BookMarked, ChevronRight, Eye, EyeOff, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  addSubject,
  addTopic,
  deleteTopic,
  setSubjectActive,
  setTopicActive,
} from "@/features/catalog/actions";
import { AddNameForm } from "@/features/catalog/components/add-name-form";
import { CreateTestButton } from "@/features/catalog/components/create-test-button";
import { ScopeFilter } from "@/features/catalog/components/scope-filter";
import { parseCatalogScope } from "@/features/catalog/scope";
import { PRACTICE_QUESTION_COUNT } from "@/features/tests/schemas";
import { getCatalog, type TopicEntry } from "@/features/tests/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("testsAdmin");
  return { title: t("title") };
}

function TestStatus({ entry, labels }: { entry: TopicEntry; labels: Record<string, string> }) {
  if (!entry.test) return <Badge>{labels.noTest}</Badge>;
  if (entry.test.is_published) return <Badge tone="success">{labels.published}</Badge>;
  return (
    <Badge tone="accent">
      {labels.draft} {entry.questionCount}/{PRACTICE_QUESTION_COUNT}
    </Badge>
  );
}

export default async function TeacherTestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("testsAdmin");
  const c = await getTranslations("catalog");
  const toasts = await getTranslations("toasts");
  const streams = await getTranslations("streams");
  const scope = parseCatalogScope(await searchParams);
  const subjects = await getCatalog(scope);

  const labels = {
    noTest: t("noTest"),
    published: t("published"),
    draft: t("draft"),
  };
  const scopeInput = {
    board: scope.board,
    class: String(scope.class),
    stream: scope.stream ?? "",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("intro")}</p>
      </div>

      <ScopeFilter basePath="/teacher/tests" scope={scope} />

      {subjects.length === 0 ? (
        <EmptyState icon={BookMarked} title={c("noSubjects")} description={c("noSubjectsBody")} />
      ) : (
        <ul className="space-y-3">
          {subjects.map(({ subject, topics }) => {
            const published = topics.filter((entry) => entry.test?.is_published).length;
            return (
              <li key={subject.id}>
                <Card className="p-0">
                  <details className="group">
                    <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3">
                      <ChevronRight
                        className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{subject.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {c("publishedOf", { done: published, total: topics.length })}
                        </p>
                      </div>
                      {subject.stream && <Badge>{streams(subject.stream)}</Badge>}
                      {!subject.is_active && <Badge tone="danger">{c("hidden")}</Badge>}
                    </summary>

                    <div className="space-y-3 border-t border-border p-4">
                      {topics.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{c("noTopics")}</p>
                      ) : (
                        <ul className="divide-y divide-border">
                          {topics.map((entry) => (
                            <li
                              key={entry.topic.id}
                              className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5"
                            >
                              <div className="min-w-0 flex-1 basis-48">
                                <p
                                  className={
                                    entry.topic.is_active
                                      ? "font-medium"
                                      : "font-medium text-muted-foreground line-through"
                                  }
                                >
                                  {entry.topic.name}
                                </p>
                                <div className="mt-1">
                                  <TestStatus entry={entry} labels={labels} />
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {entry.test ? (
                                  <Link
                                    href={`/teacher/tests/${entry.test.id}`}
                                    className="flex h-9 items-center rounded-control border border-border bg-surface px-3 text-sm font-semibold hover:bg-surface-muted"
                                  >
                                    {c("openTest")}
                                  </Link>
                                ) : (
                                  <CreateTestButton topicId={entry.topic.id} />
                                )}
                                <ActionButton
                                  size="icon"
                                  variant="ghost"
                                  aria-label={entry.topic.is_active ? c("hide") : c("show")}
                                  action={setTopicActive.bind(null, entry.topic.id, !entry.topic.is_active)}
                                  successMessage={toasts("updated")}
                                >
                                  {entry.topic.is_active ? (
                                    <EyeOff className="size-4" aria-hidden />
                                  ) : (
                                    <Eye className="size-4" aria-hidden />
                                  )}
                                </ActionButton>
                                {!entry.test && (
                                  <ActionButton
                                    size="icon"
                                    variant="ghost"
                                    aria-label={c("deleteTopic")}
                                    action={deleteTopic.bind(null, entry.topic.id)}
                                    successMessage={toasts("deleted")}
                                    confirm={{
                                      title: c("deleteTopicTitle"),
                                      description: c("deleteTopicBody"),
                                      confirmLabel: c("deleteTopic"),
                                      cancelLabel: c("cancel"),
                                    }}
                                  >
                                    <Trash2 className="size-4" aria-hidden />
                                  </ActionButton>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}

                      <AddNameForm
                        label={c("newTopic")}
                        placeholder={c("newTopic")}
                        maxLength={120}
                        submit={addTopic.bind(null, subject.id)}
                      />

                      <ActionButton
                        size="sm"
                        variant="outline"
                        action={setSubjectActive.bind(null, subject.id, !subject.is_active)}
                        successMessage={toasts("updated")}
                      >
                        {subject.is_active ? c("hideSubject") : c("showSubject")}
                      </ActionButton>
                    </div>
                  </details>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Card className="space-y-3 p-4 sm:p-5">
        <h2 className="font-semibold">{c("addSubjectTitle")}</h2>
        <p className="text-sm text-muted-foreground">{c("addSubjectHint")}</p>
        <AddNameForm
          label={c("newSubject")}
          placeholder={c("newSubject")}
          maxLength={60}
          submit={addSubject.bind(null, scopeInput)}
        />
      </Card>
    </div>
  );
}
