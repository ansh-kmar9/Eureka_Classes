import { PreferenceSync } from "@/features/profile/components/preference-sync";
import type { Profile } from "@/lib/supabase/types";
import { AppHeader } from "./app-header";
import { BottomNav } from "./bottom-nav";
import type { NavItem } from "./icons";

/** Common frame for every signed-in area: header, content column and mobile bottom nav. */
export function AppShell({
  profile,
  items,
  navLabel,
  homeHref,
  profileHref,
  headerActions,
  children,
}: {
  profile: Profile;
  items: NavItem[];
  navLabel: string;
  homeHref: string;
  profileHref?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PreferenceSync language={profile.language} theme={profile.theme} />
      <AppHeader
        items={items}
        navLabel={navLabel}
        profile={profile}
        homeHref={homeHref}
        profileHref={profileHref}
        actions={headerActions}
      />
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 outline-none md:pb-10">
        {children}
      </main>
      <BottomNav items={items} label={navLabel} />
    </div>
  );
}
