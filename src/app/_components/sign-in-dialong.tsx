"use client"

import { useState } from "react"
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { signIn } from "next-auth/react"
import Image from "next/image"
import { toast } from "sonner"
import { generateOtpAction } from "../_actions/otp"

const SignInDiaLog = () => {
  const [step, setStep] = useState<1 | 2>(1)
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)

  // Formata o número de telefone brasileiro: (XX) XXXXX-XXXX
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    }
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setPhone(formatted)
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanPhone = phone.replace(/\D/g, "")

    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      toast.error("Insira um número de telefone válido com DDD.")
      return
    }

    try {
      setLoading(true)
      await generateOtpAction(cleanPhone)
      toast.success("Código enviado! Verifique o console do servidor.")
      setStep(2)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Erro ao enviar código. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (code.length !== 6) {
      toast.error("O código de verificação deve ter 6 dígitos.")
      return
    }

    try {
      setLoading(true)
      const res = await signIn("credentials", {
        phone,
        code,
        redirect: false,
      })

      if (res?.error) {
        toast.error("Código incorreto ou expirado. Tente novamente.")
        return
      }

      toast.success("Login realizado com sucesso!")
      // O NextAuth atualiza o estado da sessão automaticamente e o Dialog fechará
      window.location.reload()
    } catch (error) {
      console.error(error)
      toast.error("Erro ao verificar código.")
    } finally {
      setLoading(false)
    }
  }

  const handleLoginWithGoogleClick = () => signIn("google")

  return (
    <div className="flex flex-col gap-4 py-2">
      <DialogHeader>
        <DialogTitle className="text-left font-bold text-xl">
          {step === 1 ? "Faça login na plataforma" : "Digite o código enviado"}
        </DialogTitle>
        <DialogDescription className="text-left">
          {step === 1
            ? "Escolha como deseja se conectar para agendar seus serviços."
            : `Enviamos um código de 6 dígitos para o número ${phone}.`}
        </DialogDescription>
      </DialogHeader>

      {step === 1 ? (
        <div className="flex flex-col gap-4">
          {/* Formulário de Login por Telefone */}
          <form onSubmit={handleSendOtp} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className="text-xs font-semibold text-gray-400">
                Número de Celular
              </label>
              <Input
                id="phone"
                type="text"
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={handlePhoneChange}
                disabled={loading}
                className="bg-secondary border-none"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full font-bold">
              {loading ? "Enviando..." : "Receber código via SMS"}
            </Button>
          </form>

          {/* Divisor */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-secondary"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-xs font-semibold">ou</span>
            <div className="flex-grow border-t border-secondary"></div>
          </div>

          {/* Botão Google */}
          <Button
            variant="outline"
            type="button"
            className="gap-2 font-bold w-full"
            onClick={handleLoginWithGoogleClick}
            disabled={loading}
          >
            <Image
              alt="Fazer login com o Google"
              src="/Google.svg"
              width={18}
              height={18}
            />
            Google
          </Button>
        </div>
      ) : (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="code" className="text-xs font-semibold text-gray-400">
              Código de Verificação (6 dígitos)
            </label>
            <Input
              id="code"
              type="text"
              maxLength={6}
              placeholder="Digite os 6 dígitos"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              disabled={loading}
              className="bg-secondary border-none tracking-widest text-center text-lg font-bold"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full font-bold">
            {loading ? "Verificando..." : "Confirmar e Entrar"}
          </Button>
          <Button
            variant="ghost"
            type="button"
            className="w-full text-xs text-gray-400 hover:text-white"
            onClick={() => setStep(1)}
            disabled={loading}
          >
            Corrigir número de telefone
          </Button>
        </form>
      )}
    </div>
  )
}

export default SignInDiaLog
