import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "./logo";
import { site } from "@/lib/site";

export async function PublicFooter() {
  const t = await getTranslations("footer");
  const nav = await getTranslations("nav");

  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {t("tagline")}
          </p>
        </div>
        <nav aria-label={t("links")}>
          <h2 className="mb-3 text-sm font-semibold">{t("links")}</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {(["about", "features", "contact", "login"] as const).map((key) => (
              <li key={key}>
                <Link href={`/${key}`} className="hover:text-foreground">
                  {nav(key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="mb-3 text-sm font-semibold">{t("reach")}</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <a href={`tel:${site.contact.phone.replace(/\s/g, "")}`} className="hover:text-foreground">
                {site.contact.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.contact.email}`} className="hover:text-foreground">
                {site.contact.email}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
        {t("rights", { year: new Date().getFullYear(), name: site.name })}
      </div>
    </footer>
  );
}
