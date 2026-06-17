import { PrismaAdapter } from "@auth/prisma-adapter"
import { AuthOptions } from "next-auth"
import { db } from "@/lib/prisma"
import type { Adapter } from "next-auth/adapters"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(db) as Adapter,
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        phone: { label: "Phone", type: "text" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.code) {
          return null
        }

        const cleanPhone = credentials.phone.replace(/\D/g, "")
        const code = credentials.code

        // 1. Busca token ativo no banco de dados
        const verificationToken = await db.verificationToken.findFirst({
          where: {
            identifier: cleanPhone,
            token: code,
            expires: {
              gte: new Date(),
            },
          },
        })

        if (!verificationToken) {
          return null
        }

        // 2. Deleta o token consumido
        await db.verificationToken.delete({
          where: {
            identifier_token: {
              identifier: cleanPhone,
              token: code,
            },
          },
        })

        // 3. Busca ou cria o usuário pelo número de telefone
        let user = await db.user.findUnique({
          where: {
            phone: cleanPhone,
          },
        })

        if (!user) {
          user = await db.user.create({
            data: {
              phone: cleanPhone,
              name: `Cliente - ${cleanPhone.slice(-4)}`,
            },
          })
        }

        return {
          id: user.id,
          name: user.name,
          phone: user.phone,
        } as any
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.phone = (user as any).phone
      }
      return token
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id,
        phone: token.phone,
      } as any
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
