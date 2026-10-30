import { getTranslations } from "next-intl/server";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { getPublicNavItems } from "@/components/layout/public-nav-items";
import { isSignedIn } from "@/features/auth/queries";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("nav");
  const items = await getPublicNavItems(await isSignedIn());

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      {/* Bottom padding keeps content clear of the fixed mobile nav. */}
      <main id="main" tabIndex={-1} className="flex-1 pb-20 outline-none md:pb-0">
        {children}
      </main>
      <div className="pb-16 md:pb-0">
        <PublicFooter />
      </div>
      <BottomNav items={items} label={t("mobile")} />
    </div>
  );
}
