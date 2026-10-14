"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MapPinIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "./ui/button"

type Municipality = {
  nome: string
  microrregiao?: { mesorregiao?: { UF?: { sigla?: string } } }
}

export default function LocationFilter() {
  const router = useRouter()
  const params = useSearchParams()
  const [city, setCity] = useState(params.get("city") || "")
  const [state, setState] = useState(params.get("state") || "")
  const [cities, setCities] = useState<Municipality[]>([])
  const [focused, setFocused] = useState(false)
  const [locating, setLocating] = useState(false)

  const search = useCallback((nextCity = city, nextState = state) => {
    const query = new URLSearchParams()
    if (nextState) query.set("state", nextState)
    if (nextCity.trim()) query.set("city", nextCity.trim())
    router.push(`/?${query.toString()}`)
  }, [city, router, state])

  const loadCities = useCallback(async () => {
    if (cities.length) return

    try {
      const response = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome")
      if (!response.ok) throw new Error()
      setCities(await response.json())
    } catch {
      toast.error("Não foi possível carregar as cidades. Tente novamente.")
    }
  }, [cities.length])

  const selectCity = useCallback((name: string) => {
    const municipality = cities.find((item) => item.nome.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"))
    const uf = municipality?.microrregiao?.mesorregiao?.UF?.sigla || ""
    setCity(name)
    setState(uf)
    setFocused(false)
    search(name, uf)
  }, [cities, search])

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Seu navegador não oferece localização. Digite sua cidade para continuar.")
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`,
          )
          if (!response.ok) throw new Error()

          const data = await response.json()
          const nextCity = data.address?.city || data.address?.town || data.address?.municipality || data.address?.village
          const nextState = data.address?.["ISO3166-2-lvl4"]?.split("-")[1]

          if (!nextCity || !nextState) throw new Error()

          setCity(nextCity)
          setState(nextState)
          setFocused(false)
          search(nextCity, nextState)
          toast.success(`Mostrando barbearias em ${nextCity}.`)
        } catch {
          toast.error("Não conseguimos identificar sua cidade. Digite-a para continuar.")
        } finally {
          setLocating(false)
        }
      },
      () => {
        setLocating(false)
        toast.error("Permita a localização ou digite sua cidade para continuar.")
      },
    )
  }, [search])

  useEffect(() => {
    const hasLocationInUrl = Boolean(params.get("city") || params.get("state"))
    const alreadyAsked = window.sessionStorage.getItem("barber-m-location-requested")

    if (!hasLocationInUrl && !alreadyAsked) {
      window.sessionStorage.setItem("barber-m-location-requested", "true")
      requestLocation()
    }
  }, [params, requestLocation])

  const suggestions = city.length >= 2
    ? cities.filter((item) => item.nome.toLocaleLowerCase("pt-BR").includes(city.toLocaleLowerCase("pt-BR"))).slice(0, 8)
    : []

  return (
    <form onSubmit={(event) => { event.preventDefault(); search() }} className="relative mx-auto mt-5 flex w-full max-w-xl flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-center">
      <div className="relative min-w-0 flex-1">
        <MapPinIcon className="pointer-events-none absolute left-4 top-3.5 size-4 text-muted-foreground" />
        <label htmlFor="city-filter" className="sr-only">Filtrar barbearias por cidade</label>
        <input
          id="city-filter"
          value={city}
          onChange={(event) => {
            setCity(event.target.value)
            if (!event.target.value.trim()) setState("")
          }}
          onFocus={() => {
            setFocused(true)
            void loadCities()
          }}
          placeholder={locating ? "Identificando sua cidade..." : "Digite sua cidade"}
          className="h-11 w-full rounded-xl border border-border bg-card py-2 pl-10 pr-4 text-sm transition-colors focus:border-primary"
          aria-label="Filtrar barbearias por cidade"
          aria-busy={locating}
        />
        {focused && suggestions.length > 0 && (
          <div className="absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-border bg-popover p-1 shadow-lg">
            {suggestions.map((item) => {
              const uf = item.microrregiao?.mesorregiao?.UF?.sigla
              return (
                <button
                  type="button"
                  key={`${item.nome}-${uf}`}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    selectCity(item.nome)
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span>{item.nome}</span>
                  <span className="text-xs text-muted-foreground">{uf}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
      <Button type="submit" variant="secondary" className="h-11 shrink-0 rounded-xl px-5">Buscar por cidade</Button>
    </form>
  )
}
