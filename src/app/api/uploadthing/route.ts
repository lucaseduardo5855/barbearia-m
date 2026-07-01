import { createRouteHandler } from "uploadthing/next"
import { ourFileRouter } from "./core"

// Cria as funções GET e POST que o Next.js usa para responder requisições de upload
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
})
