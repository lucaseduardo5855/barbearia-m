"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarDays, ChevronRight, MapPin } from "lucide-react"
import { toast } from "sonner"
import LottieLoader from "./ui/lottie-loader"

export default function RegionBanner() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Seu navegador não suporta geolocalização.")
      return
    }

    setLoading(true)
    toast.info("Solicitando permissão para acessar sua localização...")

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`
          )
          if (!response.ok) throw new Error()

          const data = await response.json()
          const nextCity =
            data.address?.city ||
            data.address?.town ||
            data.address?.municipality ||
            data.address?.village
          const nextState = data.address?.["ISO3166-2-lvl4"]?.split("-")[1]

          if (nextCity) {
            toast.success(`Localização identificada: ${nextCity}${nextState ? `, ${nextState}` : ""}`)
            const query = new URLSearchParams()
            if (nextState) query.set("state", nextState)
            query.set("city", nextCity)
            router.push(`/?${query.toString()}`)
          } else {
            toast.success("Localização permitida! Mostrando barbearias.")
            router.push("/barbershops")
          }
        } catch {
          toast.error("Não conseguimos identificar sua cidade. Tente digitar no campo de busca.")
        } finally {
          setLoading(false)
        }
      },
      (error) => {
        setLoading(false)
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Permissão de localização negada pelo navegador ou dispositivo.")
        } else {
          toast.error("Não foi possível obter sua localização atual.")
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  return (
    <button
      type="button"
      onClick={handleRequestLocation}
      disabled={loading}
      aria-label="Buscar barbearias na sua região com base na localização"
      className="group mt-8 flex w-full min-h-40 items-end justify-between overflow-hidden rounded-xl border border-border bg-card p-6 text-left text-foreground transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring sm:min-h-44 sm:p-7"
    >
      <div className="max-w-lg">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          {loading ? <LottieLoader size={18} /> : <CalendarDays className="size-4" />}
        </span>
        <h2 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
          Agende nos melhores da sua região.
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground flex items-center gap-1.5">
          <MapPin className="size-3.5 text-primary shrink-0" />
          <span>Toque aqui para usar sua localização atual e ver as barbearias mais próximas.</span>
        </p>
      </div>
      <span className="mb-1 flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform duration-200 group-hover:translate-x-1">
        {loading ? <LottieLoader size={18} /> : <ChevronRight className="size-4" />}
      </span>
    </button>
  )
}
