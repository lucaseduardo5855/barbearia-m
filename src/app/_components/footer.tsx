import { Card, CardContent } from "./ui/card"

const Footer = () => {
  return (
    <footer>
      <Card className="mt-10 px-2 py-6">
        <CardContent>
          <p className="text-sm text-gray-400">
            © 2026 Copyright <span className="font-bold">Barberia-M</span>
          </p>
        </CardContent>
      </Card>
    </footer>
  )
}

export default Footer
