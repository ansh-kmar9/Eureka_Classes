import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireApprovedStudent } from "@/features/auth/guards";
import { YouTubePlayer } from "@/features/courses/components/youtube-player";
import { PdfViewer } from "@/features/documents/components/pdf-viewer";
import { createClient } from "@/lib/supabase/server";
import { getLinkKind } from "@/lib/links";
import { parseYouTubeId } from "@/lib/youtube";
import { BackLink } from "@/components/ui/back-link";

export const metadata: Metadata = { title: "Study material" };

export default async function MaterialViewerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireApprovedStudent();
  const { id } = await params;

  // Row-level security limits this to material for the student's own class.
  const supabase = await createClient();
  const { data: material } = await supabase
    .from("study_materials")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!material) notFound();

  const kind = getLinkKind(material.url);
  if (kind === "external") redirect(material.url);

  const t = await getTranslations("materials");
  const videoId = kind === "youtube" ? parseYouTubeId(material.url) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <BackLink href="/study-material">{t("back")}</BackLink>
      <h1 className="text-2xl font-bold tracking-tight">{material.title}</h1>
      {videoId ? (
        <YouTubePlayer videoId={videoId} title={material.title} />
      ) : (
        <PdfViewer url={material.url} title={material.title} />
      )}
    </div>
  );
}
