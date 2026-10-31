import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Compass } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isSignedIn } from "@/features/auth/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("notFound");
  return { title: t("title") };
}

/** Shown for any address that does not exist, and whenever a page calls notFound(). */
export default async function NotFound() {
  const t = await getTranslations("notFound");
  const nav = await getTranslations("nav");
  const signedIn = await isSignedIn();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-10">
      <Logo showName />

      <Card className="w-full max-w-md space-y-5 p-6 text-center sm:p-8">
        <div className="relative mx-auto flex size-16 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Compass className="size-8" aria-hidden />
        </div>
        <p className="brand-gradient font-display text-7xl font-bold italic leading-none tracking-tight">
          404
        </p>
        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("body")}</p>
        </div>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link href="/" className={buttonVariants({ size: "lg" })}>
            {t("home")}
          </Link>
          <Link
            href={signedIn ? "/dashboard" : "/login"}
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            {signedIn ? t("dashboard") : nav("login")}
          </Link>
        </div>
      </Card>
    </main>
  );
}
