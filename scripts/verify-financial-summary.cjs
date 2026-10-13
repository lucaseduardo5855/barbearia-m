const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const ts = require("typescript")
const Module = require("node:module")
const cache = new Map()
function load(file) {
  const resolved = path.resolve(file)
  if (cache.has(resolved)) return cache.get(resolved)
  const compiled = ts.transpileModule(fs.readFileSync(resolved, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText
  const mod = new Module(resolved, module)
  mod.filename = resolved
  mod.paths = Module._nodeModulePaths(path.dirname(resolved))
  const originalRequire = mod.require.bind(mod)
  mod.require = (name) =>
    name.startsWith(".")
      ? load(path.resolve(path.dirname(resolved), name + ".ts"))
      : originalRequire(name)
  mod._compile(compiled, resolved)
  cache.set(resolved, mod.exports)
  return mod.exports
}
const { summarizeFinance, bookingAmounts, parseStoredItems } = load(
  "src/lib/financial-summary.ts",
)
const { salesBreakdown } = load("src/lib/sales-breakdown.ts")
const date = new Date(2026, 9, 13, 14)
const booking = {
  id: "booking",
  date,
  status: "DONE",
  totalPrice: "90",
  serviceId: "beard",
  service: { id: "beard", name: "Barba", price: "30" },
  user: { id: "client" },
  barberId: "barber",
  barber: { commissionRate: "50" },
  barberCommissionAmount: "45",
  extraServices: JSON.stringify([{ id: "hair", name: "Cabelo", price: 40 }]),
  extraProducts: JSON.stringify([
    { id: "product", name: "Pomada", price: 20, quantity: 1 },
  ]),
}
const sales = [
  {
    id: "linked",
    bookingId: "booking",
    date,
    totalAmount: "20",
    commissionAmount: "10",
    productId: "product",
    productName: "Pomada",
    quantity: 1,
    clientName: "Cliente",
  },
  {
    id: "standalone",
    bookingId: null,
    date,
    totalAmount: "10",
    commissionAmount: "5",
    productId: "other",
    productName: "Óleo",
    quantity: 1,
    clientName: "Cliente",
  },
]
const transactions = [
  { date, type: "RECEITA", amount: "15" },
  { date, type: "DESPESA", amount: "10" },
  { date, type: "COMISSAO_PAGA", amount: "20" },
  { date, type: "VALE", amount: "5" },
]
const start = new Date(2026, 9, 1),
  end = new Date(2026, 9, 31, 23, 59, 59)
const summary = summarizeFinance(
  [
    booking,
    { ...booking, id: "open", status: "CONFIRMED" },
    { ...booking, id: "cancelled", status: "CANCELLED" },
  ],
  sales,
  transactions,
  start,
  end,
)
assert.equal(summary.serviceRevenue, 70)
assert.equal(summary.productRevenue, 30)
assert.equal(summary.revenue, 115)
assert.equal(summary.outflows, 35)
assert.equal(summary.balance, 80)
assert.equal(summary.pendingCommissions, 25)
assert.equal(summary.openRevenue, 90)
assert.equal(summary.projectedRevenue, 205)
assert.equal(summary.completed.length, 1)
assert.deepEqual(bookingAmounts({ ...booking, totalPrice: null }).total, 90)
assert.deepEqual(parseStoredItems("{invalid"), [])
assert.deepEqual(parseStoredItems("{}"), [])
const rows = salesBreakdown([booking], sales)
assert.equal(rows.find((r) => r.id === "beard").totalVendas, 30)
assert.equal(rows.find((r) => r.id === "hair").totalVendas, 40)
assert.equal(rows.find((r) => r.id === "product").totalVendas, 20)
assert.equal(
  rows.reduce((sum, row) => sum + row.totalVendas, 0),
  100,
)
const empty = summarizeFinance(
  [booking],
  sales,
  transactions,
  new Date(2026, 8, 1),
  new Date(2026, 8, 30),
)
assert.equal(empty.revenue, 0)
assert.equal(empty.balance, 0)
console.log(
  "OK: comanda, extras, produtos vinculados, receitas, despesas, comissões, vales e períodos.",
)
const unassigned = summarizeFinance(
  [{ ...booking, barberId: null, barber: null }],
  [],
  [],
  start,
  end,
)
assert.equal(unassigned.pendingCommissions, 0)
const { registrationSchema } = load("src/lib/registration-schema.ts")
const draft = {
  name: "Barbearia Teste",
  address: "Rua Teste, 10",
  phones: ["(42) 99999-0000"],
  description: "Descrição válida",
  imageUrl: "/logo.png",
  services: [
    { name: "Cabelo", price: "40,50" },
    { name: "Hidratação", price: "20" },
  ],
  openingHours: ["seg", "ter", "qua", "qui", "sex", "sab", "dom"].map(
    (key) => ({ key, active: key !== "dom", start: "09:00", end: "18:00" }),
  ),
}
const validated = registrationSchema.parse(draft)
assert.equal(validated.services[0].price, 40.5)
assert.equal(
  registrationSchema.safeParse({
    ...draft,
    services: [{ name: "Cabelo", price: "" }],
  }).success,
  false,
)
assert.equal(
  registrationSchema.safeParse({
    ...draft,
    services: [{ name: "Cabelo", price: "-1" }],
  }).success,
  false,
)
assert.equal(
  registrationSchema.safeParse({
    ...draft,
    openingHours: draft.openingHours.map((d) => ({
      ...d,
      start: "19:00",
      end: "09:00",
    })),
  }).success,
  false,
)
assert.equal(
  registrationSchema.safeParse({
    ...draft,
    openingHours: draft.openingHours.map((d) => ({ ...d, start: "99:00" })),
  }).success,
  false,
)
assert.equal(
  registrationSchema.safeParse({ ...draft, phones: ["123"] }).success,
  false,
)
assert.equal(
  registrationSchema.safeParse({ ...draft, barberEmail: "inválido" }).success,
  false,
)
console.log(
  "OK: cadastro, preços com vírgula, serviços personalizados, expediente e validação de contato.",
)
const { openingTimeSlots } = load("src/lib/opening-hours.ts")
const monday = new Date("2026-10-12T12:00:00-03:00")
assert.equal(openingTimeSlots(monday, null)[0], "09:00")
assert.equal(openingTimeSlots(monday, null).at(-1), "18:30")
assert.equal(
  openingTimeSlots(new Date("2026-10-18T12:00:00-03:00"), null).length,
  0,
)
const hours = JSON.stringify({
  seg: { active: true, start: "10:30", end: "12:00" },
})
assert.deepEqual(openingTimeSlots(monday, hours), ["10:30", "11:00", "11:30"])
console.log("OK: expediente, dias fechados e horários configurados.")
