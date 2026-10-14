const fs = require("node:fs")
const path = require("node:path")
const os = require("node:os")
const { spawn } = require("node:child_process")
const { loadEnvConfig } = require("@next/env")
const { PrismaClient } = require("@prisma/client")
const { encode } = require("next-auth/jwt")
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function main() {
  loadEnvConfig(process.cwd())
  const folder = path.resolve(".next-verify")
  fs.mkdirSync(folder, { recursive: true })
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "barber-ui-"))
  const browser = spawn(
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    [
      "--headless",
      "--disable-gpu",
      "--no-first-run",
      "--remote-debugging-port=9337",
      "--user-data-dir=" + profile,
      "about:blank",
    ],
    { windowsHide: true, stdio: "ignore" },
  )
  const db = new PrismaClient()
  let socket
  try {
    let tabs
    for (let i = 0; i < 40; i++) {
      try {
        tabs = await fetch("http://127.0.0.1:9337/json").then((r) => r.json())
        break
      } catch {
        await pause(250)
      }
    }
    if (!tabs) throw new Error("Chrome não iniciou.")
    socket = new WebSocket(
      tabs.find((tab) => tab.type === "page").webSocketDebuggerUrl,
    )
    await new Promise((resolve, reject) => {
      socket.onopen = resolve
      socket.onerror = reject
    })
    let id = 0
    const callbacks = new Map()
    socket.onmessage = (event) => {
      const result = JSON.parse(event.data)
      if (result.id && callbacks.has(result.id)) {
        const callback = callbacks.get(result.id)
        callbacks.delete(result.id)
        result.error
          ? callback.reject(new Error(result.error.message))
          : callback.resolve(result.result)
      }
    }
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const requestId = ++id
        callbacks.set(requestId, { resolve, reject })
        socket.send(JSON.stringify({ id: requestId, method, params }))
      })
    const evaluate = async (expression) => {
      const result = await send("Runtime.evaluate", {
        expression,
        returnByValue: true,
        awaitPromise: true,
      })
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
      return result.result.value
    }
    const navigate = async (url) => {
      await send("Page.navigate", { url })
      await pause(2000)
      await evaluate("document.fonts.ready.then(() => true)")
    }
    const capture = async (name) => {
      const shot = await send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: false,
      })
      fs.writeFileSync(
        path.join(folder, name + ".png"),
        Buffer.from(shot.data, "base64"),
      )
      const metrics = await evaluate(`(() => {
        const main = document.querySelector("main");
        const h = document.querySelector("h1");
        const input = document.querySelector('input[type="search"]');
        return { overflow: document.documentElement.scrollWidth > innerWidth, mainWidth: main?.getBoundingClientRect().width,
          titleFont: h && getComputedStyle(h).fontFamily, titleWeight: h && getComputedStyle(h).fontWeight,
          bodyFont: getComputedStyle(document.body).fontFamily, searchPadding: input && getComputedStyle(input).paddingLeft };
      })()`)
      console.log(name, JSON.stringify(metrics))
      if (metrics.overflow) throw new Error("Overflow horizontal em " + name)
    }
    const click = async (text) => {
      let clicked = false
      for (let attempt = 0; attempt < 40 && !clicked; attempt++) {
        clicked = await evaluate(
          `(() => { const b = [...document.querySelectorAll("button")].find((e) => e.textContent.trim() === ${JSON.stringify(text)}); if (!b) return false; b.click(); return true })()`,
        )
        if (!clicked) await pause(250)
      }
      if (!clicked) throw new Error("Botão não encontrado: " + text)
      await pause(1600)
    }
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    })
    await navigate("http://localhost:3000/barbearia-do-minhoca-g5kg")
    await capture("public-desktop")
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    })
    await capture("public-mobile")
    // An isolated five-minute localhost session for the unit explicitly requested by the user.
    // It never writes an account or a session to the database and is never printed.
    const shop = await db.barbershop.findUnique({
      where: { slug: "barbearia-do-minhoca-g5kg" },
      select: { ownerId: true },
    })
    if (!shop?.ownerId)
      throw new Error("Unidade sem proprietário para validar.")
    const token = await encode({
      secret: process.env.NEXTAUTH_SECRET,
      maxAge: 300,
      token: { id: shop.ownerId, sub: shop.ownerId, name: "Validação local" },
    })
    await send("Network.setCookie", {
      name: "next-auth.session-token",
      value: token,
      url: "http://localhost:3000",
      httpOnly: true,
      sameSite: "Lax",
    })
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    })
    await navigate("http://localhost:3000/barbearia-do-minhoca-g5kg/admin")
    if (process.argv.includes("--confirm")) {
      await click("Produtos (Estoque)")
      await click("Novo produto")
      await capture("confirm-product-dialog")
      console.log(
        "upload-button",
        await evaluate(
          "(() => {const b=document.querySelector('[data-ut-element=button]');return {text:b?.textContent,color:b&&getComputedStyle(b).color}})()",
        ),
      )
      await evaluate(
        "document.querySelector('[data-slot=dialog-close]').click()",
      )
      await click("Equipe")
      await capture("confirm-team")
      await click("Serviços")
      await evaluate(
        "document.querySelector('main button[data-variant=\"destructive\"]').click()",
      )
      await capture("confirm-delete-dialog")
      await click("Voltar")
      await evaluate("document.querySelector('header button.max-w-56').click()")
      await click("2. Horários")
      await capture("confirm-quick-hours")
      await send("Emulation.setDeviceMetricsOverride", {
        width: 390,
        height: 844,
        deviceScaleFactor: 1,
        mobile: true,
      })
      await capture("confirm-quick-hours-mobile")
      return
    }
    await capture("admin-overview")
    await click("Agenda")
    await capture("admin-agenda")
    const calendarTop = await evaluate(
      "document.querySelector('main .overflow-hidden.rounded-2xl')?.getBoundingClientRect().top",
    )
    console.log("agenda-calendar-top", calendarTop)
    await click("Novo agendamento")
    await capture("admin-new-booking-dialog")
    await evaluate("document.querySelector('[data-slot=dialog-close]').click()")
    await click("Mês")
    await capture("admin-month")
    await click("Financeiro")
    await capture("admin-finance")
    await click("Histórico")
    await capture("admin-history")
    await click("Mensagens e lembretes")
    await capture("admin-notifications")
    await click("Produtos (Estoque)")
    await click("Novo produto")
    const maskValue = await evaluate(
      `(() => {const input=[...document.querySelectorAll('[data-slot=dialog-content] input')].find(e=>e.value.startsWith('R$')); if(!input)return 'missing'; const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; set.call(input,'123456'); input.dispatchEvent(new Event('input',{bubbles:true})); return true})()`,
    )
    await pause(200)
    console.log(
      "money-mask",
      maskValue,
      await evaluate(
        "[...document.querySelectorAll('[data-slot=dialog-content] input')].find(e=>e.value.startsWith('R$'))?.value",
      ),
    )
    await capture("admin-product-dialog")
    const theme = await evaluate(
      "(() => { const d=document.querySelector('[data-slot=dialog-content]'); return {classes:d.className,primary:getComputedStyle(d).getPropertyValue('--primary'),width:d.getBoundingClientRect().width} })()",
    )
    console.log("dialog-theme", JSON.stringify(theme))
    await evaluate("document.querySelector('[data-slot=dialog-close]').click()")
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    })
    await capture("admin-mobile")
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    })
    await navigate("http://localhost:3000/admin/register")
    await capture("register-desktop")
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    })
    await capture("register-mobile")
    await navigate("http://localhost:3000/barbershops")
    await capture("catalog-mobile")
    await evaluate(
      "document.querySelector('[aria-label=\"Mostrar em faixa horizontal\"]').click()",
    )
    await pause(500)
    await capture("catalog-rail-mobile")
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    })
    await capture("catalog-desktop")
    await navigate("http://localhost:3000/?view=marketplace")
    await capture("marketplace-desktop")
    const canScroll = await evaluate(
      `(() => {const buttons=[...document.querySelectorAll('button')]; const arrow=buttons.find(b => b.getAttribute('aria-label')?.startsWith('Avançar')); if (!arrow) return 'missing'; arrow.click(); return true})()`,
    )
    console.log("marketplace-arrows", canScroll)
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    })
    await capture("marketplace-mobile")
    await navigate("http://localhost:3000/notifications")
    await capture("preferences-mobile")
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    })
    await navigate("http://localhost:3000/landing")
    await capture("landing-desktop")
    await evaluate(
      "document.getElementById('fluxo-em-movimento').scrollIntoView({block:'center'})",
    )
    await pause(1000)
    await capture("landing-motion-desktop")
    await evaluate(
      "document.querySelector('#fluxo-em-movimento button[data-slot=button]').click()",
    )
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    })
    await evaluate(
      "document.getElementById('fluxo-em-movimento').scrollIntoView({block:'center'})",
    )
    await capture("landing-motion-mobile")
    await send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    })
    await navigate("http://localhost:3000/landing")
    await evaluate(
      "document.getElementById('fluxo-em-movimento').scrollIntoView({block:'center'})",
    )
    await capture("landing-reduced-motion-mobile")
  } finally {
    if (socket) socket.close()
    browser.kill()
    await db.$disconnect()
  }
}
main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
