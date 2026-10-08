"use server"

import { db } from "@/lib/prisma"
import bcrypt from "bcryptjs"


export async function signUpAction(formData: {
  name: string
  email: string
  phone: string
  password: string
}) {
  const { name, phone, password } = formData
  const normalizedEmail = formData.email.trim().toLowerCase()

  if (!name || !normalizedEmail || !phone || !password) {
    throw new Error("Todos os campos são obrigatórios para realizar o cadastro.")
  }

  // Normaliza o telefone para salvar apenas os dígitos
  const cleanPhone = phone.replace(/\D/g, "")

  // 1. Verificar se o e-mail já está em uso
  const existingUserByEmail = await db.user.findFirst({
    where: { email: { equals: normalizedEmail, mode: "insensitive" } },
  })

  if (existingUserByEmail) {
    throw new Error("Este endereço de e-mail já está sendo utilizado por outra conta.")
  }

  // 2. Verificar se o telefone já está cadastrado
  const existingUserByPhone = await db.user.findUnique({
    where: { phone: cleanPhone },
  })

  if (existingUserByPhone) {
    throw new Error("Este número de telefone já está cadastrado em outra conta.")
  }

  // 3. Criptografar a senha do usuário
  // O número 10 (salt rounds) define o quão seguro e lento o hash será. 10 é o padrão recomendado.
  const hashedPassword = await bcrypt.hash(password, 10)

  // 4. Salvar o novo usuário no banco de dados com a senha criptografada
  const user = await db.user.create({
    data: {
      name,
      email: normalizedEmail,
      phone: cleanPhone,
      password: hashedPassword,
    },
  })

  return {
    success: true,
    userId: user.id,
  }
}
