import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import "./globals.css"

import { cn } from "@/lib/utils"
import { Toaster } from "sonner"
import { Card, CardContent } from "./_components/ui/card"
import Footer from "./_components/footer"
import AuthProvider from "./_providers/auth"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
})
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
})

export const metadata: Metadata = {
  title: "Barber-M | Gestão para barbearias",
  description: "Organize agenda, equipe, serviços, caixa e comissões em um só painel.",
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
      className={cn(geistSans.variable, geistMono.variable, "dark")}
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
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
