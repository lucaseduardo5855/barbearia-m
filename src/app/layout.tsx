import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import "./globals.css"

import { cn } from "@/lib/utils"
import { Toaster } from "sonner"
import Footer from "./_components/footer"
import AuthProvider from "./_providers/auth"
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin"
import { extractRouterConfig } from "uploadthing/server"
import { ourFileRouter } from "./api/uploadthing/core"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
})
const inter = localFont({
  src: "./fonts/InterVariable.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
})
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
})

export const metadata: Metadata = {
  title: "Barber-M | Gestão para barbearias",
  description:
    "Organize agenda, equipe, serviços, caixa e comissões em um só painel.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0d0d17",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={cn(
        inter.variable,
        geistSans.variable,
        geistMono.variable,
        "dark",
      )}
    >
      <body className="app-ui antialiased">
        <AuthProvider>
          <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
          <div className="flex min-h-screen min-w-0 flex-col">
            <div className="min-w-0 flex-1">{children}</div>
            <div className="mt-auto">
              <Footer />
            </div>
          </div>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  )
}
