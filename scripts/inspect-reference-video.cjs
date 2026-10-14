const fs = require("node:fs")
const os = require("node:os")
const path = require("node:path")
const { spawn } = require("node:child_process")
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function main() {
  const source = process.argv[2]
  if (!source) throw new Error("Informe o vídeo a inspecionar.")
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "barber-video-"))
  const folder = path.resolve(".next-verify")
  fs.mkdirSync(folder, { recursive: true })
  const browser = spawn(
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    [
      "--headless",
      "--no-first-run",
      "--remote-debugging-port=9338",
      "--user-data-dir=" + profile,
      "about:blank",
    ],
    { windowsHide: true, stdio: "ignore" },
  )
  let socket
  try {
    let tabs
    for (let i = 0; i < 40; i++) {
      try {
        tabs = await fetch("http://127.0.0.1:9338/json").then((r) => r.json())
        break
      } catch {
        await pause(250)
      }
    }
    socket = new WebSocket(
      tabs.find((t) => t.type === "page").webSocketDebuggerUrl,
    )
    await new Promise((resolve, reject) => {
      socket.onopen = resolve
      socket.onerror = reject
    })
    let id = 0
    const callbacks = new Map()
    socket.onmessage = (event) => {
      const r = JSON.parse(event.data)
      if (r.id && callbacks.has(r.id)) {
        const cb = callbacks.get(r.id)
        callbacks.delete(r.id)
        r.error ? cb.reject(new Error(r.error.message)) : cb.resolve(r.result)
      }
    }
    const send = (method, params) =>
      new Promise((resolve, reject) => {
        const requestId = ++id
        callbacks.set(requestId, { resolve, reject })
        socket.send(JSON.stringify({ id: requestId, method, params }))
      })
    const evaluate = async (expression) => {
      const r = await send("Runtime.evaluate", {
        expression,
        returnByValue: true,
        awaitPromise: true,
      })
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.text)
      return r.result.value
    }
    const data = fs.readFileSync(source).toString("base64")
    const duration = await evaluate(
      `new Promise((resolve,reject)=>{window.v=document.createElement('video');v.muted=true;v.src=${JSON.stringify("data:video/mp4;base64," + data)};v.onloadedmetadata=()=>resolve(v.duration);v.onerror=()=>reject(new Error('Vídeo indisponível'));document.body.append(v)})`,
    )
    for (const time of [
      0.1,
      Math.min(3, duration / 3),
      Math.min(7, duration * 0.7),
    ]) {
      const png = await evaluate(
        `new Promise(resolve=>{v.onseeked=()=>{const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d').drawImage(v,0,0);resolve(c.toDataURL('image/png'))};v.currentTime=${time}})`,
      )
      fs.writeFileSync(
        path.join(folder, `video-${time.toFixed(1)}.png`),
        Buffer.from(png.split(",")[1], "base64"),
      )
    }
    console.log(JSON.stringify({ duration, frames: 3, folder }))
  } finally {
    if (socket) socket.close()
    browser.kill()
  }
}
main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
