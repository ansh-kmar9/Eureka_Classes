import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Noto_Sans_Devanagari } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SkipLink } from "@/components/layout/skip-link";
import { ToastProvider } from "@/components/ui/toast";
import { site } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Only downloaded when a page actually shows Hindi text.
const devanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  display: "swap",
  preload: false,
});

// Display serif used for the "Eureka" wordmark only, so a single weight keeps it light.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: "700",
  style: "italic",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  applicationName: site.name,
  title: { default: site.name, template: `%s | ${site.name}` },
  appleWebApp: { capable: true, title: site.shortName, statusBarStyle: "default" },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_IN",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: site.name }],
  },
  twitter: { card: "summary" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${inter.variable} ${devanagari.variable} ${fraunces.variable}`}
    >
      <body className="min-h-dvh antialiased">
        <NextIntlClientProvider>
          <SkipLink />
          <ThemeProvider>
            <ToastProvider>{children}</ToastProvider>
          </ThemeProvider>
          <ServiceWorkerRegister />
          <InstallPrompt />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
