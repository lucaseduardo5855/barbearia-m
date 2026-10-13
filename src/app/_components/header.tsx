"use client"

import { BrandLogo } from "./brand-logo"
import Link from "next/link"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { MenuIcon } from "lucide-react"
import { Sheet, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import SidebarSheet from "./sidebar-sheet"
import Search from "./search"
import SignInDiaLog from "./sign-in-dialong"
import { useParams, usePathname } from "next/navigation"
import { useSession } from "next-auth/react"

const Header = () => {
  const params = useParams()
  const pathname = usePathname()
  const slug = params?.slug
  const homeUrl = slug ? `/${slug}` : "/?view=marketplace"
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card">
      <Card className="mx-auto max-w-7xl rounded-none border-0 bg-transparent py-0 shadow-none ring-0">
        <CardContent className="safe-area-x flex h-14 flex-row items-center justify-between gap-3 p-4 sm:px-6">
          <Link href={homeUrl}>
            <BrandLogo />
          </Link>

          {pathname !== "/barbershops" && (
            <div className="mx-2 hidden min-w-0 max-w-[680px] flex-1 md:mx-6 md:block">
              <Search />
            </div>
          )}

          <div className="flex items-center gap-2">
            {!slug && (
              <Link
                href="/landing"
                className="hidden rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:inline-flex"
              >
                Para barbearias
              </Link>
            )}

            {session?.user ? (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="hidden md:inline-flex"
              >
                <Link href="/bookings">Meus agendamentos</Link>
              </Button>
            ) : (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden md:inline-flex"
                  >
                    Entrar
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[90%] sm:max-w-md">
                  <SignInDiaLog />
                </DialogContent>
              </Dialog>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="Abrir menu">
                  <MenuIcon size={18} className="text-foreground" />
                </Button>
              </SheetTrigger>

              <SidebarSheet />
            </Sheet>
          </div>
        </CardContent>
      </Card>
    </header>
  )
}

export default Header
