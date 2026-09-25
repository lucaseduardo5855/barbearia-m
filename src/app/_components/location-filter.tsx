"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "./ui/button"
import { LocateFixedIcon, MapPinIcon } from "lucide-react"
import { toast } from "sonner"

type Municipality = { nome: string; microrregiao?: { mesorregiao?: { UF?: { sigla?: string } } } }

export default function LocationFilter() {
  const router = useRouter()
  const params = useSearchParams()
  const [city, setCity] = useState(params.get("city") || "")
  const [state, setState] = useState(params.get("state") || "")
  const [cities, setCities] = useState<Municipality[]>([])
  const [focused, setFocused] = useState(false)
  const [locating, setLocating] = useState(false)

  async function loadCities() {
    if (cities.length) return
    try {
      const response = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome")
      if (!response.ok) throw new Error()
      setCities(await response.json())
    } catch { toast.error("Não foi possível carregar as cidades.") }
  }
  function search(nextCity = city, nextState = state) {
    const query = new URLSearchParams()
    if (nextState) query.set("state", nextState)
    if (nextCity.trim()) query.set("city", nextCity.trim())
    router.push(`/?${query.toString()}`)
  }
  function selectCity(name: string) {
    const municipality = cities.find((item) => item.nome.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"))
    const uf = municipality?.microrregiao?.mesorregiao?.UF?.sigla || ""
    setCity(name); setState(uf); setFocused(false); search(name, uf)
  }
  function useMyLocation() {
    if (!navigator.geolocation) return toast.error("Localização não disponível neste navegador.")
    setLocating(true)
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`)
        const data = await response.json(); const nextCity = data.address?.city || data.address?.town || data.address?.municipality || data.address?.village
        const nextState = data.address?.['ISO3166-2-lvl4']?.split('-')[1]
        if (!nextCity || !nextState) throw new Error()
        setCity(nextCity); setState(nextState); setFocused(false); search(nextCity, nextState)
      } catch { toast.error("Não foi possível identificar sua cidade.") } finally { setLocating(false) }
    }, () => { setLocating(false); toast.error("Permita o acesso à localização para continuar.") })
  }
  const suggestions = city.length >= 2 ? cities.filter((item) => item.nome.toLocaleLowerCase("pt-BR").includes(city.toLocaleLowerCase("pt-BR"))).slice(0, 8) : []
  return <form onSubmit={(event) => { event.preventDefault(); search() }} className="relative mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
    <div className="relative min-w-0 flex-1">
      <MapPinIcon className="pointer-events-none absolute left-4 top-3.5 size-4 text-muted-foreground" />
      <input value={city} onChange={(event) => { setCity(event.target.value); if (!event.target.value.trim()) setState("") }} onFocus={() => { setFocused(true); loadCities() }} placeholder="Digite sua cidade" className="h-11 w-full rounded-full border border-border bg-card py-2 pl-10 pr-4 text-sm" aria-label="Cidade" />
      {focused && suggestions.length > 0 && <div className="absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-border bg-popover p-1 shadow-lg">
        {suggestions.map((item) => { const uf = item.microrregiao?.mesorregiao?.UF?.sigla; return <button type="button" key={`${item.nome}-${uf}`} onMouseDown={(event) => { event.preventDefault(); selectCity(item.nome) }} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"><span>{item.nome}</span><span className="text-xs text-muted-foreground">{uf}</span></button> })}
      </div>}
    </div>
    <Button type="submit" variant="secondary" className="h-11 rounded-full px-6">Buscar</Button>
    {focused && <Button type="button" variant="ghost" className="h-11 rounded-full px-4 text-muted-foreground" onClick={useMyLocation} disabled={locating}><LocateFixedIcon className="mr-2 size-4" />{locating ? "Localizando..." : "Perto de mim"}</Button>}
  </form>
}
