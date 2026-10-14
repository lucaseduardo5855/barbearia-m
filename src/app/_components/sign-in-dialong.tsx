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
import { signUpAction } from "../_actions/auth-actions"

type SignInDialogProps = {
  onLoginSuccess?: () => void
  redirectAfterLogin?: boolean
}

const SignInDiaLog = ({ onLoginSuccess, redirectAfterLogin = true }: SignInDialogProps) => {
  // Estado para controlar se está na tela de "login" ou "cadastro"
  const [mode, setMode] = useState<"login" | "register">("login")
  
  // Estados para os campos
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  
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

  // 1. Lógica do Envio de Cadastro (Sign Up)
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !email || !phone || !password) {
      toast.error("Todos os campos devem ser preenchidos para se cadastrar.")
      return
    }

    try {
      setLoading(true)
      const res = await signUpAction({
        name,
        email,
        phone,
        password,
      })

      if (res.success) {
        toast.success("Cadastro concluído. Agora entre com seu e-mail e senha.")
        // Limpa campos e muda para o modo login
        setPassword("")
        setMode("login")
      }
    } catch (error: any) {
      console.error(error)
      toast.error("Não foi possível criar sua conta. Verifique os dados e tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  // 2. Lógica do Envio de Login (Sign In)
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error("Informe seu e-mail e sua senha para entrar.")
      return
    }

    try {
      setLoading(true)
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (res?.error) {
        toast.error("E-mail ou senha incorretos. Confira os dados e tente novamente.")
        return
      }

      toast.success("Login efetuado com sucesso!")
      if (onLoginSuccess) {
        onLoginSuccess()
        return
      }

      if (!redirectAfterLogin) {
        return
      }

      const destinationResponse = await fetch("/api/auth/destination", { cache: "no-store" })
      const destinationData = await destinationResponse.json().catch(() => ({ destination: "/" }))
      window.location.assign(destinationData.destination || "/")
    } catch (error) {
      console.error(error)
      toast.error("Não foi possível entrar agora. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleLoginWithGoogleClick = () => signIn("google")
  const handleLoginWithFacebookClick = () => signIn("facebook")

  return (
    <div className="flex flex-col gap-4 py-2">
      <DialogHeader>
        <DialogTitle className="text-left font-bold text-xl">
          {mode === "login" ? "Entre na sua conta" : "Crie sua conta"}
        </DialogTitle>
        <DialogDescription className="text-left">
          {mode === "login"
            ? "Use seu e-mail e senha ou continue com uma rede social."
            : "Cadastre-se para acompanhar seus agendamentos."}
        </DialogDescription>
      </DialogHeader>

      {mode === "login" ? (
        // FORMULÁRIO DE LOGIN
        <div className="flex flex-col gap-4">
          <form onSubmit={handleSignInSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-muted-foreground">
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="bg-secondary border-none"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-muted-foreground">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="bg-secondary border-none"
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full font-bold">
              {loading ? "Entrando..." : "Entrar com E-mail"}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground underline font-semibold transition"
              onClick={() => {
                setMode("register")
                setPassword("")
              }}
              disabled={loading}
            >
              Ainda não tem conta? Criar conta
            </button>
          </div>
        </div>
      ) : (
        // FORMULÁRIO DE CADASTRO
        <div className="flex flex-col gap-4">
          <form onSubmit={handleSignUpSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-xs font-semibold text-muted-foreground">
                Nome completo
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Digite seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="bg-secondary border-none"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="emailReg" className="text-xs font-semibold text-muted-foreground">
                E-mail
              </label>
              <Input
                id="emailReg"
                type="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="bg-secondary border-none"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className="text-xs font-semibold text-muted-foreground">
                Celular
              </label>
              <Input
                id="phone"
                type="text"
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={handlePhoneChange}
                disabled={loading}
                className="bg-secondary border-none"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="passwordReg" className="text-xs font-semibold text-muted-foreground">
                Senha
              </label>
              <Input
                id="passwordReg"
                type="password"
                placeholder="No mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="bg-secondary border-none"
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full font-bold">
              {loading ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground underline font-semibold transition"
              onClick={() => {
                setMode("login")
                setPassword("")
              }}
              disabled={loading}
            >
              Já tem uma conta? Entrar
            </button>
          </div>
        </div>
      )}

      {/* Divisor */}
      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-secondary"></div>
        <span className="flex-shrink mx-4 text-muted-foreground text-xs font-semibold">ou continue com</span>
        <div className="flex-grow border-t border-secondary"></div>
      </div>

      {/* Botões Sociais em Grade */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          type="button"
          className="gap-2 font-bold w-full"
          onClick={handleLoginWithGoogleClick}
          disabled={loading}
        >
          <Image
            alt="Google logo"
            src="/Google.svg"
            width={18}
            height={18}
          />
          Continuar com Google
        </Button>

        <Button
          variant="outline"
          type="button"
          className="gap-2 font-bold w-full bg-info text-info-foreground hover:bg-info/85 border-none"
          onClick={handleLoginWithFacebookClick}
          disabled={loading}
        >
          <Image
            alt="Facebook logo"
            src="/facebook.svg"
            width={18}
            height={18}
          />
          Continuar com Facebook
        </Button>
      </div>
    </div>
  )
}

export default SignInDiaLog
