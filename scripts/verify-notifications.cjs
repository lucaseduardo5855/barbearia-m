require("ts-node").register({ compilerOptions: { module: "CommonJS" } })
const assert = require("node:assert/strict")
const {
  planNotifications,
  whatsappNumber,
  defaultCommunicationOptions,
  notificationText,
} = require("../src/lib/notification-plan.ts")
const now = new Date("2026-10-13T12:00:00-03:00")
const day = 86_400_000
const options = {
  ...defaultCommunicationOptions,
  emailReminderEnabled: true,
  whatsappReminderEnabled: true,
  reviewWhatsappEnabled: true,
  returnWhatsappEnabled: true,
}
const booking = {
  id: "booking",
  date: new Date(now.getTime() + 4 * 3_600_000),
  completedAt: null,
  status: "CONFIRMED",
  emailReminderConsent: true,
  whatsappReminderConsent: true,
  marketingConsent: true,
  user: {
    id: "client",
    name: "Cliente",
    email: "example@example.com",
    phone: "(11) 90000-0000",
  },
  service: {
    name: "Cabelo",
    barbershop: { id: "shop", name: "Barbearia", slug: "barbearia" },
  },
}
assert.equal(
  planNotifications([booking], defaultCommunicationOptions, now).length,
  0,
)
assert.equal(planNotifications([booking], options, now).length, 2)
assert.equal(
  planNotifications([{ ...booking, status: "CANCELLED" }], options, now).length,
  0,
)
assert.equal(
  planNotifications(
    [{ ...booking, date: new Date(now.getTime() + 2 * day) }],
    options,
    now,
  ).length,
  0,
)
assert.equal(
  planNotifications(
    [{ ...booking, date: new Date(now.getTime() - 1) }],
    options,
    now,
  ).length,
  0,
)
assert.equal(
  planNotifications(
    [
      {
        ...booking,
        emailReminderConsent: false,
        whatsappReminderConsent: false,
      },
    ],
    options,
    now,
  ).length,
  0,
)
const done = {
  ...booking,
  status: "DONE",
  date: new Date(now.getTime() - 31 * day),
  completedAt: new Date(now.getTime() - 30 * day),
}
assert.equal(planNotifications([done], options, now)[0].kind, "RETURN")
assert.equal(
  planNotifications([done, { ...booking, id: "future" }], options, now).filter(
    (j) => j.kind === "RETURN",
  ).length,
  0,
)
assert.equal(
  planNotifications(
    [
      done,
      { ...done, id: "recent", completedAt: new Date(now.getTime() - 3 * day) },
    ],
    options,
    now,
  ).length,
  0,
)
assert.equal(
  planNotifications([{ ...done, marketingConsent: false }], options, now)
    .length,
  0,
)
assert.equal(
  planNotifications([{ ...done, completedAt: null }], options, now).length,
  0,
)
assert.equal(
  planNotifications(
    [{ ...done, completedAt: new Date(now.getTime() - day) }],
    options,
    now,
  )[0].kind,
  "REVIEW",
)
assert.equal(whatsappNumber("(11) 90000-0000"), "5511900000000")
assert.equal(whatsappNumber("5511900000000"), "5511900000000")
assert.equal(whatsappNumber("555"), null)
const jobs = planNotifications([booking], options, now)
assert.notEqual(jobs[0].key, jobs[1].key)
assert.match(notificationText(jobs[0]), /Barbearia/)
console.log("Notificações: 16 cenários validados; nenhum envio real.")
