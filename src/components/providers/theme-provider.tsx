"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

const BROWSER_BAR = { light: "#f6f7fb", dark: "#000000" } as const;

/**
 * Colours the phone's status bar and address bar to match the theme chosen in the app.
 * The page's own tags only follow the phone's setting, so choosing Dark inside the app while the
 * phone is set to Light would leave a light bar above a black page. Renders nothing.
 */
function BrowserBarColor() {
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    if (!resolvedTheme) return;
    const color = resolvedTheme === "dark" ? BROWSER_BAR.dark : BROWSER_BAR.light;
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((tag) => tag.setAttribute("content", color));
    // The path is listed because a page change can write fresh tags.
  }, [resolvedTheme, pathname]);

  return null;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="eureka-theme"
    >
      <BrowserBarColor />
      {children}
    </NextThemesProvider>
  );
}
