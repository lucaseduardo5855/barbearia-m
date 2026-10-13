"use client"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { CalendarCheck2, Check, Pause, Play, Scissors } from "lucide-react"
import { Button } from "@/components/ui/button"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

const captions = [
  "O cliente escolhe seu horário.",
  "A reserva aparece na agenda da equipe.",
  "O atendimento concluído compõe o caixa.",
]
export function LandingBookingMotion() {
  const root = useRef<HTMLElement>(null)
  const timeline = useRef<gsap.core.Timeline>()
  const inView = useRef(false)
  const [paused, setPaused] = useState(false)
  const [stage, setStage] = useState(0)
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  useGSAP(
    () => {
      const media = gsap.matchMedia()
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          paused: true,
          repeat: -1,
          repeatDelay: 1.6,
          defaults: { ease: "power3.inOut" },
        })
        timeline.current = tl
        tl.addLabel("choose")
          .call(() => setStage(0))
          .fromTo(
            ".booking-motion__request",
            { xPercent: -95, opacity: 0 },
            { xPercent: 0, opacity: 1, duration: 1.8 },
          )
          .to(
            ".booking-motion__request",
            { xPercent: 105, opacity: 0, duration: 1.5 },
            "+=0.7",
          )
          .addLabel("reserve")
          .call(() => setStage(1))
          .fromTo(
            ".booking-motion__sweep",
            { clipPath: "inset(0 100% 0 0)" },
            { clipPath: "inset(0 0% 0 0)", duration: 1.1 },
          )
          .fromTo(
            ".booking-motion__confirmation",
            { xPercent: -40, opacity: 0 },
            { xPercent: 0, opacity: 1, duration: 1.5 },
          )
          .addLabel("complete")
          .call(() => setStage(2))
          .fromTo(
            ".booking-motion__receipt",
            { y: 24, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.2 },
          )
          .to(
            [".booking-motion__confirmation", ".booking-motion__receipt"],
            { opacity: 0, duration: 0.7 },
            "+=1.8",
          )
        const sync = () => {
          if (inView.current && !document.hidden && !pausedRef.current)
            tl.play()
          else tl.pause()
        }
        const observer = new IntersectionObserver(
          ([entry]) => {
            inView.current = entry.isIntersecting
            sync()
          },
          { threshold: 0.2 },
        )
        if (root.current) observer.observe(root.current)
        document.addEventListener("visibilitychange", sync)
        return () => {
          observer.disconnect()
          document.removeEventListener("visibilitychange", sync)
          timeline.current = undefined
        }
      })
      return () => media.revert()
    },
    { scope: root },
  )
  useEffect(() => {
    if (paused) timeline.current?.pause()
    else if (inView.current && !document.hidden) timeline.current?.play()
  }, [paused])
  return (
    <section
      ref={root}
      id="fluxo-em-movimento"
      className="scroll-mt-24 px-5 py-20 sm:px-8 lg:px-10"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <h2 className="max-w-lg text-3xl tracking-tight sm:text-5xl">
            Da reserva ao atendimento, sem perder o fio.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
            Um mesmo atendimento conecta a página do cliente, a agenda dos
            profissionais e o movimento financeiro.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Image
              src="/avatar.png"
              alt="Profissional da barbearia"
              width={88}
              height={88}
              className="size-20 rounded-xl object-cover"
            />
            <p className="max-w-xs text-sm leading-6 text-muted-foreground">
              Menos interrupções na rotina de quem está na cadeira.
            </p>
          </div>
        </div>
        <div className="booking-motion rounded-2xl bg-[#e8f2ff] p-4 sm:p-7">
          <div
            className="relative flex h-72 items-center justify-center overflow-hidden rounded-xl bg-[#d7e9ff] sm:h-80"
            aria-label="Demonstração ilustrativa: reserva, confirmação e fechamento"
          >
            <div
              className="absolute inset-x-0 top-1/2 border-t border-dashed border-[#6389b6]/40"
              aria-hidden="true"
            />
            <div className="booking-motion__request absolute left-3 top-[40%] z-10 rounded-lg bg-white px-3 py-3 text-xs text-[#223449] sm:left-6">
              <span className="block">João · Corte + barba</span>
              <span className="mt-1 block text-[#52677f]">
                Hoje, 15:00 · R$ 70,00
              </span>
            </div>
            <div className="relative z-20 flex size-24 flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl bg-[#216cc5] text-white shadow-[0_16px_28px_rgb(28_70_119_/_0.18)]">
              <Scissors className="size-8" />
              <span className="text-xs">BARBER-M</span>
              <span className="booking-motion__sweep absolute inset-x-0 bottom-0 h-1 bg-[#a8d4ff]" />
            </div>
            <div className="booking-motion__confirmation absolute right-3 top-[24%] z-30 flex items-center gap-2 rounded-lg bg-white px-3 py-3 text-xs text-[#223449] sm:right-6">
              <CalendarCheck2 className="size-4 text-[#216cc5]" />
              <span>Horário confirmado</span>
            </div>
            <div className="booking-motion__receipt absolute bottom-5 left-4 z-30 flex items-center gap-2 rounded-lg bg-white px-3 py-3 text-xs text-[#223449]">
              <Check className="size-4 text-[#258261]" />
              Atendimento concluído · R$ 70,00
            </div>
            <Image
              src="/illustrations/barbershop-team.svg"
              alt=""
              width={230}
              height={180}
              className="absolute -bottom-1 -right-4 z-20 h-36 w-44 object-contain sm:h-44 sm:w-56"
            />
          </div>
          <p className="mt-5 min-h-12 text-center text-base text-[#223449]">
            {captions[stage]}
          </p>
          <div className="flex items-center justify-center gap-3">
            {captions.map((caption, index) => (
              <button
                key={caption}
                type="button"
                aria-label={caption}
                aria-pressed={stage === index}
                className={`flex size-8 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-[#216cc5] ${stage === index ? "text-[#216cc5]" : "text-[#52677f]"}`}
                onClick={() => {
                  setStage(index)
                  setPaused(true)
                  timeline.current?.seek(
                    ["choose", "reserve", "complete"][index],
                  )
                }}
              >
                <span
                  className={`size-2 rounded-full ${stage === index ? "bg-[#216cc5]" : "bg-[#a2bfdf]"}`}
                />
              </button>
            ))}
            <Button
              variant="ghost"
              onClick={() => setPaused((value) => !value)}
              aria-pressed={paused}
              className="text-sm text-[#223449]"
            >
              {paused ? (
                <Play className="size-4" />
              ) : (
                <Pause className="size-4" />
              )}
              {paused ? "Reproduzir" : "Pausar"}
            </Button>
          </div>
          <p className="mt-3 text-center text-xs text-[#52677f]">
            Dados ilustrativos ·{" "}
            <a
              href="https://storyset.com/illustration/barbershop-team/bro"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              Ilustração por Storyset
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
