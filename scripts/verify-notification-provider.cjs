require("ts-node").register({ compilerOptions: { module: "CommonJS" } })
const assert = require("node:assert/strict")
const {
  notificationReadiness,
  sendNotification,
} = require("../src/lib/notification-provider.ts")
async function main() {
  // Entirely synthetic credentials, recipients and provider. No real HTTP send.
  Object.assign(process.env, {
    WHATSAPP_ACCESS_TOKEN: "mock-token",
    WHATSAPP_PHONE_NUMBER_ID: "mock-id",
    WHATSAPP_API_VERSION: "v-test",
    NEXTAUTH_URL: "https://example.com",
    WHATSAPP_REMINDER_TEMPLATE: "reminder",
    WHATSAPP_REVIEW_TEMPLATE: "review",
    WHATSAPP_RETURN_TEMPLATE: "return",
  })
  assert.equal(notificationReadiness().whatsappReminder, true)
  let calls = 0
  global.fetch = async (url, options) => {
    calls++
    const payload = JSON.parse(options.body)
    assert.match(url, /graph.facebook.com\/v-test\/mock-id\/messages/)
    assert.equal(payload.type, "template")
    assert.equal(payload.template.components[0].parameters.length, 4)
    assert.equal(
      payload.template.components[0].parameters[3].text,
      "https://example.com/notifications",
    )
    return {
      ok: true,
      json: async () => ({ messages: [{ id: "mock-accepted" }] }),
    }
  }
  const booking = {
    id: "fake",
    date: new Date("2026-10-14T18:00:00Z"),
    user: { name: "Cliente", email: null, phone: "11900000000" },
    service: {
      name: "Corte",
      barbershop: { name: "Barbearia", slug: "barbearia" },
    },
  }
  for (const kind of ["REMINDER", "REVIEW", "RETURN"])
    assert.equal(
      await sendNotification({
        key: "test",
        kind,
        channel: "WHATSAPP",
        destination: "5511900000000",
        booking,
      }),
      "mock-accepted",
    )
  assert.equal(calls, 3)
  global.fetch = async () => ({
    ok: false,
    status: 400,
    json: async () => ({ error: { message: "mock-error" } }),
  })
  await assert.rejects(
    () =>
      sendNotification({
        key: "test",
        kind: "REMINDER",
        channel: "WHATSAPP",
        destination: "5511900000000",
        booking,
      }),
    /HTTP 400/,
  )
  delete process.env.WHATSAPP_ACCESS_TOKEN
  assert.equal(notificationReadiness().whatsappReminder, false)
  await assert.rejects(
    () =>
      sendNotification({
        key: "test",
        kind: "REMINDER",
        channel: "WHATSAPP",
        destination: "5511900000000",
        booking,
      }),
    /não configurado/,
  )
  console.log(
    "Provedor WhatsApp: templates, 4 parâmetros, aceitação, erro e configuração testados com mock. Nenhum envio real.",
  )
}
main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
