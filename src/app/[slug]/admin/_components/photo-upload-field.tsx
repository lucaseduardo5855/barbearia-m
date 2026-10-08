"use client"

import Image from "next/image"
import { ImagePlus, X } from "lucide-react"
import { toast } from "sonner"
import { UploadButton } from "@/app/_lib/uploadthing"
import { Button } from "@/app/_components/ui/button"

type PhotoUploadFieldProps = {
  label: string
  value: string
  onChange: (url: string) => void
  alt: string
  required?: boolean
  disabled?: boolean
  helperText?: string
}

export function PhotoUploadField({
  label,
  value,
  onChange,
  alt,
  required = false,
  disabled = false,
  helperText = "PNG ou JPG, até 4 MB",
}: PhotoUploadFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-muted-foreground">
        {label}{required ? " *" : ""}
      </label>

      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/55 p-2">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-card">
            <Image src={value} alt={alt} fill sizes="48px" className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground">Foto selecionada</p>
            <p className="truncate text-[11px] text-muted-foreground">Pronta para salvar</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onChange("")}
            disabled={disabled}
            aria-label={`Remover ${label.toLowerCase()}`}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/35 p-3">
          <UploadButton
            endpoint="imageUploader"
            onClientUploadComplete={(result) => {
              if (result?.[0]) {
                onChange(result[0].url)
                toast.success("Foto enviada. Salve as alterações para aplicar.")
              }
            }}
            onUploadError={() => {
              toast.error("Não foi possível enviar a foto. Tente novamente.")
            }}
            content={{
              button: ({ ready }) => (ready ? "Selecionar foto" : "Preparando envio..."),
              allowedContent: helperText,
            }}
            appearance={{
              button:
                "h-11 w-full rounded-lg border border-border bg-card text-xs font-semibold text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              allowedContent: "mt-2 text-center text-[10px] text-muted-foreground",
            }}
          />
          <div className="pointer-events-none mt-2 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
            <ImagePlus className="size-3" /> Escolha uma imagem do seu dispositivo
          </div>
        </div>
      )}
    </div>
  )
}
