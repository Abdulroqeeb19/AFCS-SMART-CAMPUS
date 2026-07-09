const store = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): { allowed: boolean; resetInSeconds: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowSeconds * 1000 })
    return { allowed: true, resetInSeconds: windowSeconds }
  }

  entry.count++
  if (entry.count > maxRequests) {
    const resetInSeconds = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, resetInSeconds }
  }

  return { allowed: true, resetInSeconds: Math.ceil((entry.resetAt - now) / 1000) }
}

setInterval(() => {
  const now = Date.now()
  store.forEach((entry, key) => {
    if (now > entry.resetAt) store.delete(key)
  })
}, 60_000)
