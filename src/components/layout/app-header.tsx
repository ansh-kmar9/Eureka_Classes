import { getTranslations } from "next-intl/server";
import type { Profile } from "@/lib/supabase/types";
import { Logo } from "./logo";
import { TopNav } from "./top-nav";
import { LanguageSwitcher } from "./language-switcher";
import { ProfileMenu } from "./profile-menu";
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

  return (
    <header className="pt-safe sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Logo href={homeHref} />
        <TopNav items={items} label={navLabel} />
        <div className="flex items-center gap-1">
          {actions}
          <LanguageSwitcher />
          <ThemeToggle />
          <ProfileMenu
            name={profile.full_name}
            email={profile.email}
            avatarUrl={profile.avatar_url}
            profileHref={profileHref}
            labels={{ menu: t("accountMenu"), profile: t("profile"), signOut: t("signOut") }}
          />
        </div>
      </div>
    </header>
  );
}
