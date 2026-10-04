import type { Metadata } from "next";
import "./globals.css";
import { getTheme } from "@/lib/api";
import { CartProvider } from "@/components/CartProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Chatbot } from "@/components/Chatbot";

export async function generateMetadata(): Promise<Metadata> {
  const theme = await getTheme();
  return {
    title: theme.shopName,
    description: theme.tagline,
    icons: { icon: theme.iconUrl }
  };
}

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
        <CartProvider iconUrl={theme.iconUrl}>
          <Header shopName={theme.shopName} iconUrl={theme.iconUrl} />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <Footer shopName={theme.shopName} tagline={theme.tagline} />
          <Chatbot shopName={theme.shopName} />
        </CartProvider>
      </body>
    </html>
  );
}
