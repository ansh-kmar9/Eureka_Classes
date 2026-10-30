import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { isSignedIn } from "@/features/auth/queries";
import { Logo } from "./logo";
import { TopNav } from "./top-nav";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";
import { getPublicNavItems } from "./public-nav-items";

export async function PublicHeader() {
  const t = await getTranslations("nav");
  const signedIn = await isSignedIn();
  const items = await getPublicNavItems(signedIn);
  const links = items.slice(0, -1);
  const cta = items[items.length - 1];

  return (
    <header className="pt-safe sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Logo />
        <TopNav items={links} label={t("primary")} />
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
          <Link
            href={cta.href}
            className={buttonVariants({
              size: "md",
              className: "ml-1 hidden md:inline-flex",
            })}
          >
            {cta.label}
          </Link>
        </div>
      </div>
    </header>
  );
}
