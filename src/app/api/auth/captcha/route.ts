import { NextResponse } from 'next/server'
import crypto from 'node:crypto'

const SECRET = process.env.CAPTCHA_SECRET || process.env.NEXTAUTH_SECRET || 'afcs-math-captcha-fallback'

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export async function GET() {
  const num1 = randomInt(5, 25)
  const num2 = randomInt(1, 15)
  const ops: ('+' | '-')[] = ['+', '-']
  const operator = ops[randomInt(0, 1)]
  const answer = operator === '+' ? num1 + num2 : num1 - num2
  const question = `What is ${num1} ${operator} ${num2}?`

  const token = crypto.createHmac('sha256', SECRET).update(String(answer)).digest('hex')

  return NextResponse.json({ question, token })
}
