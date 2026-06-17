"use server"

import { db } from "@/lib/prisma"

/**
 * Gera um código OTP de 6 dígitos aleatório para o telefone fornecido,
 * salva no banco de dados na tabela VerificationToken (expira em 5 minutos)
 * e o imprime no console do servidor para testes.
 */
export async function generateOtpAction(phone: string) {
  if (!phone) {
    throw new Error("Número de telefone é obrigatório")
  }

  // Remove caracteres não numéricos do telefone para padronizar (ex: 11999999999)
  const cleanPhone = phone.replace(/\D/g, "")

  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    throw new Error("Número de telefone inválido. Insira o DDD + número.")
  }

  // 1. Limpa tokens antigos criados para este mesmo telefone
  await db.verificationToken.deleteMany({
    where: {
      identifier: cleanPhone,
    },
  })

  // 2. Gera um código de 6 dígitos aleatório
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString()

  // 3. Define o tempo de expiração para 5 minutos a partir de agora
  const expires = new Date(Date.now() + 5 * 60 * 1000)

  // 4. Salva o token na tabela VerificationToken
  await db.verificationToken.create({
    data: {
      identifier: cleanPhone,
      token: otpCode,
      expires,
    },
  })

  // 5. Exibe o código no terminal para testes (simulando o envio de SMS)
  console.log(`\n--- [MOCK SMS] ---`)
  console.log(`Para o telefone: ${cleanPhone}`)
  console.log(`Seu código de verificação é: ${otpCode}`)
  console.log(`------------------\n`)

  return { success: true }
}
