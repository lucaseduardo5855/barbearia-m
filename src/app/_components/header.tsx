import Image from "next/image"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { MenuIcon } from "lucide-react"
import { Sheet, SheetTrigger } from "@/components/ui/sheet"
import SidebarSheet from "./sidebar-sheet"

const Header = () => {
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
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline">
              <MenuIcon size={18} className="text-foreground" />
            </Button>
          </SheetTrigger>

          {/* O componente filho que criamos */}
          <SidebarSheet />
        </Sheet>
      </CardContent>
    </Card>
  )
}

export default Header
