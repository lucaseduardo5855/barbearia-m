"use client" // Indica que este componente é um componente do lado do cliente, permitindo o uso de hooks e interatividade

import { SmartphoneIcon } from "lucide-react"
import { Button } from "./ui/button"
import { toast } from "sonner"

interface PhoneItemProps {
  phone: string
}

const PhoneItem = ({ phone }: PhoneItemProps) => {
  //função para copiar o número de telefone para a área de transferência
  const handleCopyPhoneClick = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone)
      toast.success("Telefone copiado para a área de transferência.")
    } catch {
      toast.error("Não foi possível copiar o telefone. Tente novamente.")
    }
  }

  return (
    <div className="flex items-center justify-between">
      {/* ESQUERDA */}
      <div className="flex items-center gap-2">
        <SmartphoneIcon size={18} />
        <p className="text-sm">{phone}</p>
      </div>

      {/* DIREITA */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleCopyPhoneClick(phone)}
      >
        Copiar
      </Button>
    </div>
  )
}

export default PhoneItem
