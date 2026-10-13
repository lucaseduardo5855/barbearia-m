"use client"

import { usePathname } from "next/navigation"

const Footer = () => {
  const pathname = usePathname()
  if (pathname.endsWith("/admin") || pathname === "/landing") return null
  return (
    <footer className="border-t border-border px-5 py-5 text-sm text-muted-foreground sm:px-8">
      © {new Date().getFullYear()} Barber-M
    </footer>
  )
}

export default Footer
