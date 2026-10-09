import type { Metadata } from "next";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Shell } from "@/components/shell";
import { getProducts } from "@/lib/catalogue";
export const metadata: Metadata = {
  title: {
    default: "Voyage Advent | A world of taste",
    template: "%s | Voyage Advent",
  },
  description:
    "Discover premium spirits, wines, beers and everyday favourites at Voyage Advent. Explore the collection and arrange your order with our team.",
  robots: { index: true, follow: true },
  icons: { icon: "/images/logo.png" },
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let products: Awaited<ReturnType<typeof getProducts>> = [];
  try {
    products = await getProducts();
  } catch {
    /* Page surfaces catalogue errors. Never fall back to stale prices. */
  }
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Providers>
          <Shell products={products}>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
