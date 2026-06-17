"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { MenuIcon } from "lucide-react"
import { Sheet, SheetTrigger } from "@/components/ui/sheet"
import SidebarSheet from "./sidebar-sheet"
import Search from "./search"
import { useParams } from "next/navigation"

const Header = () => {
  const params = useParams()
  const slug = params?.slug
  const homeUrl = slug ? `/${slug}` : "/"

  return (
    <header>
      <Card>
        <CardContent className="flex flex-row items-center justify-between p-5">
          <Link href={homeUrl}>
            <Image
              src="/logo.png"
              alt="Logo da barbearia"
              height={18}
              width={120}
            />
          </Link>

          <div className="mx-6 hidden max-w-[680px] flex-1 md:block">
            <Search />
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline">
                <MenuIcon size={18} className="text-foreground" />
              </Button>
            </SheetTrigger>

            <SidebarSheet />
          </Sheet>
        </CardContent>
      </Card>
    </header>
  )
}

export default Header
