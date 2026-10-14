// Utilitário de Rate Limiting em memória para proteção de endpoints
// Bloqueia abusos, ataques de força bruta e sobrecarga de requisições.

interface RateLimitRecord {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitRecord>()

// Limpeza periódica automática para não acumular memória (a cada 5 minutos)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    rateLimitMap.forEach((record, key) => {
      if (now > record.resetTime) {
        rateLimitMap.delete(key)
      }
    })
  }, 5 * 60 * 1000)
}

export function rateLimit(key: string, limit: number = 30, windowMs: number = 60 * 1000): { success: boolean; remaining: number } {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs,
    })
    return { success: true, remaining: limit - 1 }
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0 }
  }

  record.count += 1
  return { success: true, remaining: limit - record.count }
}
