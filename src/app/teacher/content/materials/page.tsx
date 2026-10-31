import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ExternalLink, Library, Plus, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ClassFilter, parseClassParam } from "@/features/content/components/class-filter";
import { AudienceLabel } from "@/features/content/components/audience-label";
import { deleteMaterial } from "@/features/materials/actions";
import { listMaterials } from "@/features/materials/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("content.materials");
  return { title: t("title") };
}

export default async function TeacherMaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const t = await getTranslations("content");
  const toasts = await getTranslations("toasts");
  const classFilter = parseClassParam((await searchParams).class);

  const materials = await listMaterials(classFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{t("materials.title")}</h1>
        <Link href="/teacher/content/materials/new" className={buttonVariants({ size: "sm" })}>
          <Plus className="size-4" aria-hidden />
          {t("materials.new")}
        </Link>
      </div>

      <ClassFilter basePath="/teacher/content/materials" selected={classFilter} />

      {materials.length === 0 ? (
        <EmptyState icon={Library} title={t("materials.empty")} />
      ) : (
        <ul className="space-y-2">
          {materials.map((item) => (
            <li key={item.id}>
              <Card className="flex items-center gap-3 p-3 sm:p-4">
                <div className="min-w-0 flex-1">
                  <p className="break-words font-medium">{item.title}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <Badge tone="primary">{item.subject}</Badge>
                    <Badge>
                      <AudienceLabel classNumber={item.class} stream={item.stream} />
                    </Badge>
                  </div>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("materials.open")}
                  className="flex size-11 items-center justify-center rounded-control text-muted-foreground hover:bg-surface-muted"
                >
                  <ExternalLink className="size-4" aria-hidden />
                </a>
                <ActionButton
                  size="icon"
                  variant="ghost"
                  aria-label={t("materials.delete")}
                  action={deleteMaterial.bind(null, item.id)}
                  successMessage={toasts("deleted")}
                  confirm={{
                    title: t("materials.deleteTitle"),
                    description: t("materials.deleteBody"),
                    confirmLabel: t("materials.delete"),
                    cancelLabel: t("cancel"),
                  }}
                >
                  <Trash2 className="size-4" aria-hidden />
                </ActionButton>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
