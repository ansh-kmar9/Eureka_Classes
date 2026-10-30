import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Profile } from "@/lib/supabase/types";
import { Logo } from "./logo";
import { TopNav } from "./top-nav";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";
import type { NavItem } from "./icons";

/** Header for signed-in areas (student, teacher, admin). */
export async function AppHeader({
  items,
  navLabel,
  profile,
  homeHref,
  profileHref = "/profile",
  actions,
}: {
  items: NavItem[];
  navLabel: string;
  profile: Pick<Profile, "full_name" | "avatar_url" | "email">;
  homeHref: string;
  profileHref?: string;
  /** Extra header buttons, shown before the language and theme switches. */
  actions?: React.ReactNode;
}) {
  const t = await getTranslations("common");
  const initial = (profile.full_name ?? profile.email).trim().charAt(0).toUpperCase();

  return (
    <header className="pt-safe sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Logo href={homeHref} />
        <TopNav items={items} label={navLabel} />
        <div className="flex items-center gap-1">
          {actions}
          <LanguageSwitcher />
          <ThemeToggle />
          <Link
            href={profileHref}
            aria-label={t("profile")}
            className="ml-1 flex size-10 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-sm font-bold text-primary"
          >
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt=""
                referrerPolicy="no-referrer"
                className="size-full object-cover"
              />
            ) : (
              initial
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
