const { loadEnvConfig } = require("@next/env")
const { Resend } = require("resend")
const { createHash } = require("node:crypto")
loadEnvConfig(process.cwd())
const args = process.argv.slice(2)
const email = args[args.indexOf("--email") + 1]
async function main() {
  if (!args.includes("--email") || !email || !email.includes("@"))
    throw new Error("Informe --email com o destinatário do teste.")
  if (!args.includes("--send")) {
    console.log(
      "SIMULADO: nenhum e-mail enviado. Use --send para o teste autorizado.",
    )
    return
  }
  if (!process.env.RESEND_API_KEY)
    throw new Error("RESEND_API_KEY não configurada.")
  const hash = createHash("sha256")
    .update(email + new Date().toISOString().slice(0, 10))
    .digest("hex")
    .slice(0, 16)
  const result = await new Resend(process.env.RESEND_API_KEY).emails.send(
    {
      from: process.env.EMAIL_FROM || "Barber-M <onboarding@resend.dev>",
      to: email,
      subject: "Teste de notificação — Barber-M",
      html: "<h2>Teste de notificação Barber-M</h2><p>Este é o teste de e-mail solicitado.</p><p>O lembrete real mostrará barbearia, serviço, profissional, data e horário.</p><p>Esta mensagem é uma demonstração e não representa um novo agendamento.</p>",
    },
    { idempotencyKey: "barber-m-test-" + hash },
  )
  if (result.error) throw new Error(result.error.message)
  console.log(JSON.stringify({ accepted: true, providerId: result.data.id }))
}
main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
