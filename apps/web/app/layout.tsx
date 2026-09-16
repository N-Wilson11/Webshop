import type { Metadata } from "next";
import "./globals.css";
import { getTheme } from "@/lib/api";
import { CartProvider } from "@/components/CartProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Cookie Corner",
  description: "Freshly baked cookies, delivered to your door."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await getTheme();

  const themeStyle = `
    :root {
      --color-primary: ${theme.colors.primary};
      --color-secondary: ${theme.colors.secondary};
      --color-accent: ${theme.colors.accent};
      --color-background: ${theme.colors.background};
      --color-text: ${theme.colors.text};
    }
  `;

  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeStyle }} />
      </head>
      <body className="min-h-screen font-sans">
        <CartProvider>
          <Header shopName={theme.shopName} />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <Footer shopName={theme.shopName} tagline={theme.tagline} />
        </CartProvider>
      </body>
    </html>
  );
}
