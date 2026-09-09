import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";

const APP_NAME = "What Can I Run — will it run? yes/no in 15s";
const APP_DESC = "Paste specs or pick your GPU — see which open-weight LLMs fit your VRAM, fix CUDA OOMs, copy Ollama commands. No signup. RTX, Mac, AMD, laptops.";
const SITE_URL = "https://myllmstack.vercel.app";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "description", content: APP_DESC },
      { name: "theme-color", content: "#0a0a0a" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "What Can I Run" },
      { property: "og:title", content: APP_NAME },
      { property: "og:description", content: APP_DESC },
      { property: "og:url", content: SITE_URL },
      { property: "og:image", content: `${SITE_URL}/og.jpg` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: APP_NAME },
      { name: "twitter:description", content: APP_DESC },
      { name: "twitter:image", content: `${SITE_URL}/og.jpg` },
    ],
    links: [
      { rel: "canonical", href: SITE_URL },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg text-fg font-mono">
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        {/* Vercel Web Analytics — page-view tracking for the live deployment.
            Same script the @vercel/analytics package injects; inlined as a tag
            so no extra dependency is needed. View counts in Vercel dashboard → Analytics. */}
        <script defer src="https://va.vercel-scripts.com/v1/script.js" />
        <Scripts />
      </body>
    </html>
  ),
});
