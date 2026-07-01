"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/app/_components/ui/input"
import { Button } from "@/app/_components/ui/button"
import { registerBarbershop } from "@/app/_actions/register-barbershop"
import { toast } from "sonner"
import Image from "next/image"
import { CheckIcon, UserIcon, UsersIcon, BuildingIcon, StoreIcon, X } from "lucide-react"
import ProfileCard from "@/app/_components/profilecard"
import { UploadButton } from "@/app/_lib/uploadthing"

const fontStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
  .font-outfit {
    font-family: 'Outfit', sans-serif;
  }
`

export default function RegisterBarbershopPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Controle de passos (1: Perfil, 2: Dados Básicos, 3: Localização, 4: Serviços, 5: Expediente, 6: Convite)
  const [step, setStep] = useState(1)

  // --- ESTADOS DO FORMULÁRIO ---
  // Passo 1: Perfil
  const [businessProfile, setBusinessProfile] = useState<"alone" | "team" | "small" | "medium" | "">("")
  const [heardFrom, setHeardFrom] = useState("")

  // Passo 2: Sobre o Negócio
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [welcomeMessage, setWelcomeMessage] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [bannerUrl, setBannerUrl] = useState("")
  const [instagramUrl, setInstagramUrl] = useState("")

  // Passo 3: Localização
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")

  // Passo 4: Serviços sugeridos
  const [cortePrice, setCortePrice] = useState("40.00")
  const [barbaPrice, setBarbaPrice] = useState("30.00")
  const [sobrancelhaPrice, setSobrancelhaPrice] = useState("20.00")

  // Passo 5: Expediente
  const [workDays, setWorkDays] = useState(["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"])

  // Passo 6: Convite
  const [barberName, setBarberName] = useState("")

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (!name || !address || !phone || !description || !imageUrl) {
      toast.error("Por favor, preencha todas as informações obrigatórias nos passos anteriores.")
      setStep(2) // Volta para o passo dos dados obrigatórios
      return
    }

    try {
      setIsSubmitting(true)

      const barbershop = await registerBarbershop({
        name,
        address,
        phones: [phone],
        description,
        imageUrl,
        bannerUrl: bannerUrl || undefined,
        welcomeMessage: welcomeMessage || undefined,
        instagramUrl: instagramUrl || undefined,
        cortePrice,
        barbaPrice,
        sobrancelhaPrice,
        barberName: barberName || undefined,
      })

      toast.success("Barbearia cadastrada com sucesso! Iniciando seu período de testes de 7 dias.")
      router.push(`/${barbershop.slug}/admin`)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Erro ao cadastrar a barbearia. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Lista dos Passos da Barra Lateral (Mapeando com a estética do Gendo)
  const stepsList = [
    { id: 1, title: "Perfil do Negócio", desc: "Escolha o modelo do seu negócio" },
    { id: 2, title: "Sobre o seu negócio", desc: "Começando a conhecer sua barbearia" },
    { id: 3, title: "Localização", desc: "Endereço e contato do estabelecimento" },
    { id: 4, title: "Serviços sugeridos", desc: "Defina os preços básicos de serviços" },
    { id: 5, title: "Expediente", desc: "Dias e horários de atendimento" },
    { id: 6, title: "Convite", desc: "Convide seus colaboradores" }
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: fontStyle }} />
      <div className="min-h-screen bg-background text-foreground grid grid-cols-1 md:grid-cols-12 overflow-hidden font-outfit">

        {/* PAINEL ESQUERDO: Estilo Gendo Roxo Premium */}
        <section className="hidden md:flex md:col-span-5 bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] p-12 flex-col justify-between relative text-white select-none">
          <div className="absolute top-0 right-0 opacity-15 w-80 h-80 rounded-full bg-white/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 left-10 opacity-10 w-96 h-96 rounded-full bg-white/30 blur-2xl pointer-events-none" />

          <div className="space-y-6 z-10">
            <Image src="/logo.png" alt="FSW Barber" width={130} height={22} className="invert brightness-0" />
            <div className="space-y-3 pt-4">
              <h2 className="text-4xl font-extrabold tracking-tight leading-tight max-w-sm">
                Poucos passos para transformar seu negócio
              </h2>
            </div>
          </div>

          {/* Lista de Passos Lateral */}
          <div className="relative flex flex-col justify-center my-auto pl-2 py-8 z-10">
            <div className="absolute left-[22px] top-8 bottom-8 w-0.5 bg-white/25 -z-10" />

            <div className="space-y-5">
              {stepsList.map((s) => {
                const isActive = step === s.id
                const isCompleted = step > s.id
                return (
                  <div key={s.id} className="flex items-center gap-4">

                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base border-2 transition-all duration-300 shrink-0 ${isCompleted
                      ? "bg-white text-[#4f46e5] border-white shadow-lg"
                      : isActive
                        ? "bg-white/20 text-white border-white scale-105 shadow-md font-extrabold"
                        : "bg-transparent text-white/50 border-white/30"
                      }`}>
                      {isCompleted ? <CheckIcon className="w-5 h-5 stroke-[3.5]" /> : s.id}
                    </div>

                    <div>
                      <p className={`text-base font-bold transition-all duration-300 leading-tight ${isActive ? "text-white" : isCompleted ? "text-white/90" : "text-white/40"
                        }`}>
                        {s.title}
                      </p>
                      <p className={`text-xs transition-all duration-300 ${isActive ? "text-white/80" : isCompleted ? "text-white/60" : "text-white/30"
                        }`}>
                        {s.desc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="text-xs text-white/60 z-10 font-medium">
            © FSW Barber SaaS • Período de Testes de 7 Dias
          </div>
        </section>

        {/* PAINEL DIREITO: Formulário Interativo com as Etapas */}
        <section className="col-span-12 md:col-span-7 flex flex-col justify-center p-6 md:p-16 overflow-y-auto">
          <div className="max-w-xl mx-auto w-full space-y-6">

            {/* Header Responsivo para Mobile */}
            <div className="flex flex-col items-center text-center md:hidden mb-4">
              <Image src="/logo.png" alt="FSW Barber" width={110} height={18} className="object-contain mb-3" />
              <h2 className="text-xl font-bold text-white">Configurar sua Barbearia</h2>
              <span className="text-[10px] bg-primary/20 text-primary px-3 py-0.5 rounded-full font-bold uppercase tracking-wider mt-2">
                Passo {step} de 6
              </span>
            </div>

            {/* Cabeçalho da Etapa Corrente */}
            <div>
              <h3 className="text-2xl font-extrabold tracking-tight text-white hidden md:block">
                {step === 1 && "Com qual perfil você se encaixa?"}
                {step === 2 && "Sobre o seu negócio"}
                {step === 3 && "Onde fica?"}
                {step === 4 && "Serviços sugeridos"}
                {step === 5 && "Horário de funcionamento"}
                {step === 6 && "Convide sua equipe"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1.5">
                {step === 1 && "Para começar, é importante que você escolha o modelo que mais se encaixa ao seu negócio."}
                {step === 2 && "Preencha o nome, logo e descrição da sua barbearia para configurarmos sua página."}
                {step === 3 && "Conte-nos onde é seu negócio. Esta localização posicionará você nas ferramentas de busca."}
                {step === 4 && "De acordo com o seu negócio, pré-definimos alguns preços e serviços. Você pode ajustá-los."}
                {step === 5 && "Para finalizar, configure os dias e horários de atendimento da sua barbearia."}
                {step === 6 && "Adicione outros profissionais para compartilhar sua agenda e recursos da barbearia."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* ETAPA 1: ESCOLHA DE PERFIL (Estilo Gendo Cards) */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Card 1: Trabalho Sozinho */}
                    <ProfileCard
                      id="alone"
                      selectedProfile={businessProfile}
                      onSelect={setBusinessProfile}
                      icon={UserIcon}
                      title="Trabalho Sozinho"
                      description="Atendimento individual"
                    />

                    {/* Card 2: Microempresa */}
                    <ProfileCard
                      id="team"
                      selectedProfile={businessProfile}
                      onSelect={setBusinessProfile}
                      icon={UsersIcon}
                      title="Microempresa"
                      description="Entre 1 a 4 funcionários"
                    />

                    {/* Card 3: Pequena Empresa */}
                    <ProfileCard
                      id="small"
                      selectedProfile={businessProfile}
                      onSelect={setBusinessProfile}
                      icon={StoreIcon}
                      title="Pequena empresa"
                      description="Entre 5 a 10 funcionários"
                    />


                    {/* Card 4: Média / Grande Empresa */}
                    <ProfileCard
                      id="medium"
                      selectedProfile={businessProfile}
                      onSelect={setBusinessProfile}
                      icon={BuildingIcon}
                      title="Média ou Grande Empresa"
                      description="Acima de 10 funcionários"
                    />
                  </div>

                  {/* Campo complementar: Onde nos conheceu? */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wide">Onde nos conheceu?</label>
                    <select
                      value={heardFrom}
                      onChange={(e) => setHeardFrom(e.target.value)}
                      className="w-full py-3.5 px-3 rounded-lg border border-secondary bg-secondary/15 text-sm outline-none text-white focus:border-primary"
                    >
                      <option value="" disabled hidden className="bg-background text-foreground">Selecione uma categoria</option>
                      <option value="instagram" className="bg-background text-foreground">Instagram</option>
                      <option value="facebook" className="bg-background text-foreground">Facebook</option>
                      <option value="google" className="bg-background text-foreground">Google / Busca</option>
                      <option value="indication" className="bg-background text-foreground">Indicação de Amigo</option>
                    </select>
                  </div>

                  <Button
                    type="button"
                    className="w-full py-6 text-sm font-extrabold mt-4"
                    onClick={() => {
                      if (!businessProfile) {
                        toast.error("Por favor, selecione um perfil para continuar.")
                        return
                      }
                      setStep(2)
                    }}
                  >
                    Continuar
                  </Button>
                </div>
              )}

              {/* ETAPA 2: SOBRE O NEGÓCIO */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wide">Nome da Barbearia *</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="py-5 bg-secondary/20 border-secondary focus-visible:ring-primary focus-visible:border-primary text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wide">Mensagem de Boas-Vindas</label>
                    <Input
                      placeholder="Ex: Estilo e tradição com os melhores profissionais"
                      value={welcomeMessage}
                      onChange={(e) => setWelcomeMessage(e.target.value)}
                      className="py-5 bg-secondary/20 border-secondary text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wide">Descrição / Sobre a Barbearia *</label>
                    <textarea
                      className="w-full min-h-[90px] rounded-lg border border-secondary bg-secondary/15 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary text-white"
                      placeholder="Conte um pouco sobre as especialidades da barbearia..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Upload de Logo */}
                    <div className="space-y-1.5 flex flex-col justify-end">
                      <label className="text-xs font-bold text-gray-300 uppercase tracking-wide">Logo da Barbearia *</label>
                      {imageUrl ? (
                        <div className="relative w-full h-[46px] border border-primary/30 rounded-lg overflow-hidden flex items-center justify-between px-3 bg-primary/5">
                          <span className="text-xs text-primary font-medium truncate max-w-[80%]">Logo enviada!</span>
                          <button 
                            type="button" 
                            onClick={() => setImageUrl("")} 
                            className="bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <UploadButton
                          endpoint="imageUploader"
                          onClientUploadComplete={(res) => {
                            if (res?.[0]) {
                              setImageUrl(res[0].url)
                              toast.success("Logo enviada com sucesso!")
                            }
                          }}
                          onUploadError={(error: Error) => {
                            toast.error(`Erro: ${error.message}`)
                          }}
                          content={{
                            button({ ready }) {
                              if (ready) return "Enviar Logo"
                              return "Carregando..."
                            },
                            allowedContent: "PNG, JPG (até 4MB)"
                          }}
                          appearance={{
                            button: "bg-primary text-black font-extrabold text-xs py-3 w-full rounded-lg hover:bg-primary/95 transition-all cursor-pointer",
                            allowedContent: "text-[10px] text-gray-400 mt-1 text-center"
                          }}
                        />
                      )}
                    </div>

                    {/* Upload de Banner */}
                    <div className="space-y-1.5 flex flex-col justify-end">
                      <label className="text-xs font-bold text-gray-300 uppercase tracking-wide">Banner de Capa</label>
                      {bannerUrl ? (
                        <div className="relative w-full h-[46px] border border-primary/30 rounded-lg overflow-hidden flex items-center justify-between px-3 bg-primary/5">
                          <span className="text-xs text-primary font-medium truncate max-w-[80%]">Banner enviado!</span>
                          <button 
                            type="button" 
                            onClick={() => setBannerUrl("")} 
                            className="bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <UploadButton
                          endpoint="imageUploader"
                          onClientUploadComplete={(res) => {
                            if (res?.[0]) {
                              setBannerUrl(res[0].url)
                              toast.success("Banner enviado com sucesso!")
                            }
                          }}
                          onUploadError={(error: Error) => {
                            toast.error(`Erro: ${error.message}`)
                          }}
                          content={{
                            button({ ready }) {
                              if (ready) return "Enviar Banner"
                              return "Carregando..."
                            },
                            allowedContent: "PNG, JPG (até 4MB)"
                          }}
                          appearance={{
                            button: "bg-[#4f46e5] text-white font-extrabold text-xs py-3 w-full rounded-lg hover:bg-[#5a52e6] transition-all cursor-pointer",
                            allowedContent: "text-[10px] text-gray-400 mt-1 text-center"
                          }}
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wide">Instagram da Barbearia</label>
                    <Input
                      placeholder="Ex: https://instagram.com/sua_barbearia"
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                      className="py-5 bg-secondary/20 border-secondary text-sm"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 py-6 text-sm"
                      onClick={() => setStep(1)}
                    >
                      Voltar
                    </Button>
                    <Button
                      type="button"
                      className="flex-1 py-6 text-sm font-bold"
                      onClick={() => {
                        if (!name || !description || !imageUrl) {
                          toast.error("Preencha o nome, descrição e logo para continuar.")
                          return
                        }
                        setStep(3)
                      }}
                    >
                      Continuar
                    </Button>
                  </div>
                </div>
              )}

              {/* ETAPA 3: LOCALIZAÇÃO */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wide">Digite seu endereço... *</label>
                    <Input
                      placeholder="Ex: Avenida dos Cortes, 123 - Centro"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                      className="py-5 bg-secondary/20 border-secondary text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wide">Telefone / WhatsApp de Contato *</label>
                    <Input
                      placeholder="Ex: (11) 98765-4321"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="py-5 bg-secondary/20 border-secondary text-sm"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 py-6 text-sm"
                      onClick={() => setStep(2)}
                    >
                      Voltar
                    </Button>
                    <Button
                      type="button"
                      className="flex-1 py-6 text-sm font-bold"
                      onClick={() => {
                        if (!address || !phone) {
                          toast.error("Preencha o endereço e telefone para continuar.")
                          return
                        }
                        setStep(4)
                      }}
                    >
                      Continuar
                    </Button>
                  </div>
                </div>
              )}

              {/* ETAPA 4: SERVIÇOS SUGERIDOS */}
              {step === 4 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <p className="text-xs text-muted-foreground">Defina o preço dos serviços que serão oferecidos aos clientes:</p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 bg-secondary/20 border border-secondary rounded-lg">
                      <div>
                        <h4 className="text-sm font-bold text-white">Corte de Cabelo</h4>
                        <p className="text-xs text-gray-400">Tempo estimado: 30 minutos</p>
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          value={cortePrice}
                          onChange={(e) => setCortePrice(e.target.value)}
                          className="h-9 text-center bg-black/40 text-sm font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-secondary/20 border border-secondary rounded-lg">
                      <div>
                        <h4 className="text-sm font-bold text-white">Barba</h4>
                        <p className="text-xs text-gray-400">Tempo estimado: 30 minutos</p>
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          value={barbaPrice}
                          onChange={(e) => setBarbaPrice(e.target.value)}
                          className="h-9 text-center bg-black/40 text-sm font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-secondary/20 border border-secondary rounded-lg">
                      <div>
                        <h4 className="text-sm font-bold text-white">Sobrancelha</h4>
                        <p className="text-xs text-gray-400">Tempo estimado: 15 minutos</p>
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          value={sobrancelhaPrice}
                          onChange={(e) => setSobrancelhaPrice(e.target.value)}
                          className="h-9 text-center bg-black/40 text-sm font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 py-6 text-sm"
                      onClick={() => setStep(3)}
                    >
                      Voltar
                    </Button>
                    <Button
                      type="button"
                      className="flex-1 py-6 text-sm font-bold"
                      onClick={() => setStep(5)}
                    >
                      Salvar e Continuar
                    </Button>
                  </div>
                </div>
              )}

              {/* ETAPA 5: EXPEDIENTE */}
              {step === 5 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <p className="text-xs text-muted-foreground">Selecione os dias da semana que sua barbearia estará aberta:</p>

                  <div className="grid grid-cols-2 gap-2">
                    {["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"].map((day) => {
                      const isSelected = workDays.includes(day)
                      return (
                        <button
                          key={day}
                          type="button"
                          className={`p-3 text-xs font-bold rounded-lg border transition-all text-center ${isSelected
                            ? "bg-primary/20 text-primary border-primary"
                            : "bg-secondary/15 border-secondary text-gray-400 hover:border-gray-500"
                            }`}
                          onClick={() => {
                            if (isSelected) {
                              setWorkDays(workDays.filter(d => d !== day))
                            } else {
                              setWorkDays([...workDays, day])
                            }
                          }}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 py-6 text-sm"
                      onClick={() => setStep(4)}
                    >
                      Voltar
                    </Button>
                    <Button
                      type="button"
                      className="flex-1 py-6 text-sm font-bold"
                      onClick={() => {
                        // Se no passo 1 escolheu "Trabalho sozinho", envia o formulário diretamente
                        if (businessProfile === "alone") {
                          handleSubmit()
                        } else {
                          setStep(6)
                        }
                      }}
                    >
                      Continuar
                    </Button>
                  </div>
                </div>
              )}

              {/* ETAPA 6: CONVITE DE EQUIPE */}
              {step === 6 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wide">Nome do Primeiro Barbeiro (Opcional)</label>
                    <Input
                      placeholder="Ex: Roberto Barbeiro / Nome do seu colega"
                      value={barberName}
                      onChange={(e) => setBarberName(e.target.value)}
                      className="py-5 bg-secondary/20 border-secondary text-sm"
                    />
                    <p className="text-[10px] text-gray-500">Você poderá gerenciar e convidar mais profissionais no seu painel depois.</p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 py-6 text-sm"
                      onClick={() => setStep(5)}
                    >
                      Voltar
                    </Button>
                    <button id="submit-onboarding" type="submit" className="hidden" />
                    <Button
                      type="submit"
                      className="flex-1 py-6 text-sm font-extrabold bg-[#4f46e5] hover:bg-[#5a52e6] text-white"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Finalizando..." : "Finalizar e Entrar"}
                    </Button>
                  </div>
                </div>
              )}

            </form>

          </div>
        </section>

      </div>
    </>
  )
}
