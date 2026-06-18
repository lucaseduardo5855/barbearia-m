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

const SignInDiaLog = () => {
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
        toast.success("Cadastro realizado com sucesso! Agora você pode fazer login.")
        // Limpa campos e muda para o modo login
        setPassword("")
        setMode("login")
      }
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Erro ao efetuar o cadastro. Verifique os dados.")
    } finally {
      setLoading(false)
    }
  }

  // 2. Lógica do Envio de Login (Sign In)
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error("Preencha o e-mail e a senha.")
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
        toast.error("Credenciais incorretas ou inválidas. Tente novamente.")
        return
      }

      toast.success("Login efetuado com sucesso!")
      window.location.reload()
    } catch (error) {
      console.error(error)
      toast.error("Erro inesperado ao realizar login.")
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
          {mode === "login" ? "Faça login na plataforma" : "Crie a sua conta"}
        </DialogTitle>
        <DialogDescription className="text-left">
          {mode === "login"
            ? "Conecte-se com e-mail e senha ou use redes sociais."
            : "Insira seus dados abaixo para se cadastrar de forma simples."}
        </DialogDescription>
      </DialogHeader>

      {mode === "login" ? (
        // FORMULÁRIO DE LOGIN
        <div className="flex flex-col gap-4">
          <form onSubmit={handleSignInSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-gray-400">
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
              <label htmlFor="password" className="text-xs font-semibold text-gray-400">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Inserir Senha"
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
              className="text-xs text-gray-400 hover:text-white underline font-semibold transition"
              onClick={() => {
                setMode("register")
                setPassword("")
              }}
              disabled={loading}
            >
              Não possui conta? Cadastre-se gratuitamente
            </button>
          </div>
        </div>
      ) : (
        // FORMULÁRIO DE CADASTRO
        <div className="flex flex-col gap-4">
          <form onSubmit={handleSignUpSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-xs font-semibold text-gray-400">
                Nome Completo
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
              <label htmlFor="emailReg" className="text-xs font-semibold text-gray-400">
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
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="passwordReg" className="text-xs font-semibold text-gray-400">
                Crie uma Senha
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
              {loading ? "Cadastrando..." : "Confirmar e Cadastrar"}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              className="text-xs text-gray-400 hover:text-white underline font-semibold transition"
              onClick={() => {
                setMode("login")
                setPassword("")
              }}
              disabled={loading}
            >
              Já tem uma conta? Voltar ao login
            </button>
          </div>
        </div>
      )}

      {/* Divisor */}
      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-secondary"></div>
        <span className="flex-shrink mx-4 text-gray-400 text-xs font-semibold">ou conecte-se com</span>
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
          Google
        </Button>

        <Button
          variant="outline"
          type="button"
          className="gap-2 font-bold w-full bg-[#1877F2] text-white hover:bg-[#166fe5] border-none"
          onClick={handleLoginWithFacebookClick}
          disabled={loading}
        >
          <Image
            alt="Facebook logo"
            src="/facebook.svg"
            width={18}
            height={18}
          />
          Facebook
        </Button>
      </div>
    </div>
  )
}

export default SignInDiaLog
