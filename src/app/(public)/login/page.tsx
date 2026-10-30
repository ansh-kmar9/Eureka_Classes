import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signInWithGoogle } from "@/features/auth/actions";
import { safeNext } from "@/features/auth/utils";
import { GoogleIcon } from "@/features/marketing/components/google-icon";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: t("loginTitle"),
    robots: { index: false, follow: true },
  };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const t = await getTranslations("login");
  const errors = await getTranslations("errors");
  const { next, error } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-12 md:py-20">
      <Card className="p-6 text-center sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("subtitle")}
        </p>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-control bg-danger-soft px-3 py-2 text-sm text-danger"
          >
            {errors("oauth")}
          </p>
        )}

        <form action={signInWithGoogle} className="mt-6">
          <input type="hidden" name="next" value={safeNext(next)} />
          <Button type="submit" variant="outline" size="lg" className="w-full">
            <GoogleIcon className="size-5" />
            {t("google")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
