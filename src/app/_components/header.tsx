import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"

const Header = () => {
  return (
    <Card>
      <CardContent>
        <Image
          src="/logo.png"
          alt="Logo da barbearia"
          height={18}
          width={120}
        />
      </CardContent>
    </Card>
  )
}

export default Header
