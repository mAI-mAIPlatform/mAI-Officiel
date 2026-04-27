import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cookies } from "next/headers";
import { appLogoOptions } from "@/lib/logo-options";

import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import { SessionGuard } from "@/components/security/session-guard";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { BrandProvider } from "@/components/brand-provider";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const faviconId = cookieStore.get("mai-app-favicon")?.value ?? "logo";
  const faviconSrc = appLogoOptions.find((l) => l.id === faviconId)?.src ?? "/images/logo.png";

  return {
    metadataBase: new URL("https://mai-officiel.vercel.app"),
    title: "mAI",
    description: "Avec mAI, passez à la vitesse supérieure !",
    icons: {
      icon: faviconSrc,
      shortcut: faviconSrc,
      apple: faviconSrc,
    },
  };
}

export const viewport = {
  maximumScale: 1,
};

const LIGHT_THEME_COLOR = "hsl(220 30% 98%)";
const DARK_THEME_COLOR = "hsl(243 28% 7%)";
const THEME_COLOR_SCRIPT = `\
(function() {
  const html = document.documentElement;
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    const isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  const observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className="font-sans"
      lang="fr"
      suppressHydrationWarning
    >
      <head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: "Required"
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
      </head>
      <body className="antialiased">
        <BrandProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            disableTransitionOnChange
            enableSystem
          >
            <SessionProvider
              basePath={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/auth`}
            >
              <TooltipProvider>
                <RegisterServiceWorker />
                <SessionGuard />
                {children}
              </TooltipProvider>
            </SessionProvider>
          </ThemeProvider>
        </BrandProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
