import { createUploadthing, type FileRouter } from "uploadthing/next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/_lib/auth"

const f = createUploadthing()

export const ourFileRouter = {
  // Define um roteador para uploads de imagens (limite de 4MB por imagem)
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    // Middleware roda no servidor antes do upload acontecer
    .middleware(async () => {
      const session = await getServerSession(authOptions)
      
      // Se não estiver logado, barra o upload por segurança
      if (!session || !session.user) {
        throw new Error("Não autorizado!")
      }

      return { userId: (session.user as any).id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload finalizado para o usuário:", metadata.userId)
      console.log("Link do arquivo salvo:", file.url)
      return { uploadedBy: metadata.userId, url: file.url }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
