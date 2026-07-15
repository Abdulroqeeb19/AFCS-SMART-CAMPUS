import { NextResponse } from 'next/server'
import crypto from 'node:crypto'

const SECRET = process.env.CAPTCHA_SECRET || process.env.NEXTAUTH_SECRET

const challenges = new Map<string, number>()

const CHALLENGE_TTL = 5 * 60 * 1000
const CLEANUP_INTERVAL = 60 * 1000

setInterval(() => {
  const now = Date.now()
  for (const [key, ts] of challenges) {
    if (now - ts > CHALLENGE_TTL) challenges.delete(key)
  }
}, CLEANUP_INTERVAL)

export async function GET() {
  const num1 = crypto.randomInt(5, 26)
  const num2 = crypto.randomInt(1, 16)
  const operator = crypto.randomInt(0, 2) === 0 ? '+' : '-'
  const answer = operator === '+' ? num1 + num2 : num1 - num2
  const question = `What is ${num1} ${operator} ${num2}?`

  const nonce = crypto.randomBytes(16).toString('hex')
  const token = crypto
    .createHmac('sha256', SECRET || 'required-captcha-secret-must-be-set')
    .update(`${nonce}:${answer}`)
    .digest('hex')

  challenges.set(`${token}:${nonce}`, Date.now())

  return NextResponse.json({ question, token, nonce })
}

export function verifyCaptcha(token: string, nonce: string, answer: string): boolean {
  const key = `${token}:${nonce}`
  const ts = challenges.get(key)
  if (!ts) return false
  if (Date.now() - ts > CHALLENGE_TTL) {
    challenges.delete(key)
    return false
  }
  challenges.delete(key)

  const expected = crypto
    .createHmac('sha256', SECRET || 'required-captcha-secret-must-be-set')
    .update(`${nonce}:${answer.trim()}`)
    .digest('hex')

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token))
}
