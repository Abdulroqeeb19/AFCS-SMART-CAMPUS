export function cacheResponse(response: Response, maxAge = 30, staleWhileRevalidate = 60): Response {
  response.headers.set('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`)
  return response
}

export function noCacheResponse(response: Response): Response {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  return response
}

export function jsonResponse(data: unknown, status = 200, cacheMaxAge?: number): Response {
  const body = JSON.stringify(data)
  const response = new Response(body, {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
  if (cacheMaxAge !== undefined) {
    cacheResponse(response, cacheMaxAge)
  } else {
    noCacheResponse(response)
  }
  return response
}
