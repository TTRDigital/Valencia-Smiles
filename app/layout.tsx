import type { Metadata, Viewport } from "next";
import { siteUrl } from "@/lib/site";

/*
 * Root layout is intentionally bare: the website's styles and chrome live in
 * app/(site) so the embedded Sanity Studio at /cms loads without them.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Valencia Smile Expert",
  formatDetection: { telephone: false, address: false, email: false },
  // The live site's favicon (44 x 49), used for every size as before.
  icons: { icon: "/images/uploads/2025/05/favicon.png", apple: "/images/uploads/2025/05/favicon.png" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-US">
      <body>{children}</body>
    </html>
  );
}
