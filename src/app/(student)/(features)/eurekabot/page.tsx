import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireApprovedStudent } from "@/features/auth/guards";
import { EurekaBotChat } from "@/features/eurekabot/components/eurekabot-chat";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("studentNav");
  return { title: t("bot") };
}

export default async function EurekaBotPage() {
  await requireApprovedStudent();
  return <EurekaBotChat />;
}
