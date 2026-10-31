import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ChevronRight, ExternalLink, FileText, Library, PlayCircle } from "lucide-react";
import { BackLink } from "@/components/ui/back-link";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireApprovedStudent } from "@/features/auth/guards";
import { groupBySubject, listMaterials } from "@/features/materials/queries";
import { getLinkKind } from "@/lib/links";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("materials");
  return { title: t("title") };
}

export default async function StudyMaterialPage() {
  await requireApprovedStudent();
  const t = await getTranslations("materials");
  const common = await getTranslations("common");
  const groups = groupBySubject(await listMaterials());

  return (
    <div className="space-y-6">
      <BackLink href="/dashboard">{common("backToDashboard")}</BackLink>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {groups.length === 0 ? (
        <EmptyState icon={Library} title={t("emptyTitle")} description={t("emptyBody")} />
      ) : (
        groups.map(([subject, items]) => (
          <section key={subject} className="space-y-3">
            <h2 className="text-lg font-semibold">{subject}</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {items.map((item) => {
                const kind = getLinkKind(item.url);
                const Icon = kind === "youtube" ? PlayCircle : FileText;
                const card = (
                  <Card className="flex items-center gap-3 p-3 transition-colors hover:bg-surface-muted sm:p-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 break-words font-medium">{item.title}</span>
                    {kind === "external" ? (
                      <ExternalLink className="size-4 shrink-0 text-muted-foreground" aria-label={t("openExternal")} />
                    ) : (
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    )}
                  </Card>
                );
                return (
                  <li key={item.id}>
                    {/* PDFs and YouTube videos open inside the app; other links open in a new tab. */}
                    {kind === "external" ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="block rounded-card">
                        {card}
                      </a>
                    ) : (
                      <Link href={`/study-material/${item.id}`} className="block rounded-card">
                        {card}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
