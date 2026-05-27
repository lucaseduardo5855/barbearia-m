"use client"

import Image from "next/image"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { CalendarIcon, HomeIcon, LogOutIcon, MenuIcon } from "lucide-react"
import { useState } from "react"
import quickSearchOptions from "../_constants/search"
import { Avatar, AvatarImage } from "./ui/avatar"
import Link from "next/link"
import SidebarSheet from "./sidebar-sheet"

const Header = () => {
  const [open, setOpen] = useState(false)

  return (
    <Card>
      <CardContent className="flex flex-row items-center justify-between p-5">
        <Image
          src="/logo.png"
          alt="Logo da barbearia"
          height={18}
          width={120}
        />
        {/* Menu Hamburger para dispositivos móveis */}
        <Button
          size="icon"
          variant="outline"
          onClick={() => setOpen((v) => !v)}
        >
          <MenuIcon size={18} className="text-foreground" />
        </Button>
        <SidebarSheet open={open} onClose={() => setOpen(false)} />
      </CardContent>
    </Card>
  )
}

//composition pattern
export default Header
