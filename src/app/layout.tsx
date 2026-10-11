import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { APP_FRASE, APP_NAME } from "@/lib/constantes";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_FRASE,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={inter.className}>
      <body className="min-h-dvh">
        {children}
        <Toaster richColors={false} position="top-center" />
      </body>
    </html>
  );
}
