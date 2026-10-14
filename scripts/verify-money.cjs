require("ts-node").register({ compilerOptions: { module: "CommonJS" } })
const assert = require("node:assert/strict")
const {
  moneyFromDigits,
  validateMoney,
  MAX_MONEY,
} = require("../src/lib/money.ts")
const { formatBRL } = require("../src/lib/formatters.ts")
const { productData } = require("../src/lib/product-schema.ts")
assert.equal(moneyFromDigits("1234"), 12.34)
assert.equal(moneyFromDigits("R$ 1.234,56"), 1234.56)
assert.equal(moneyFromDigits(""), 0)
assert.equal(moneyFromDigits("999999999999999"), MAX_MONEY)
assert.equal(validateMoney(0.1 + 0.2), 0.3)
assert.throws(() => validateMoney(283222323), /limite/)
assert.throws(() => validateMoney(-5), /negativo/)
assert.throws(() => validateMoney(NaN))
assert.throws(() => validateMoney(Infinity))
assert.throws(() => validateMoney(12.345), /duas casas/)
assert.throws(() => validateMoney(0, "Preço", false), /maior que zero/)
assert.match(formatBRL(1234.56), /1\.234,56/)
assert.equal(formatBRL(-0), formatBRL(0))
const base = {
  name: " Pomada ",
  price: 30,
  stock: 10,
  minStock: 3,
  costPrice: 0,
}
assert.equal(productData(base).name, "Pomada")
assert.equal(productData(base).costPrice, 0)
assert.throws(() => productData({ ...base, stock: 1.5 }), /inteiro/)
assert.throws(() => productData({ ...base, price: 283222323 }), /limite/)
assert.throws(() => productData({ ...base, minStock: -1 }))
console.log(
  "Dinheiro e produtos: 18 cenários validados, sem gravações no banco.",
)
