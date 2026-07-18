import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAuthStaff } from '@/lib/auth-utils'
import { rateLimit } from '@/lib/rate-limit'

const DEFAULT_PROVIDER = process.env.AI_PROVIDER || 'openai'
const AI_API_KEY = process.env.AI_API_KEY || ''
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini'
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/+$/, '')
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3:4b'

const SYSTEM_PROMPT = `You are AFCS AI, the official AI assistant for Air Force Comprehensive School, Igbara-Oke (AFCS Smart Campus). You help administrators, commandants, and teachers with:

1. **Attendance analytics** — query today's staff/student attendance, check who is present/late/absent, view class-level breakdowns
2. **Student information** — look up student details by name or class
3. **Staff information** — find staff members, their roles, contact info
4. **Timetable** — check today's schedule, upcoming periods, what class a teacher has next
5. **Academic terms** — current term dates
6. **Parade & duties** — parade schedules, task assignments
7. **General school admin** — answer questions about school operations

RULES:
- Answer concisely and professionally. Use Nigerian English conventions.
- When asked about data, ALWAYS use the available functions to query the database — do not make up information.
- If a function returns no results, say so clearly.
- Format responses with markdown for readability (bold for emphasis, bullet points for lists).
- The school's motto is "Knowledge and Integrity."
- The commandant is the head of the school. Teachers are addressed as "Mr.", "Mrs.", or "Miss" as appropriate.
- If you don't have access to certain data or a function doesn't exist for the query, say "I don't have access to that information yet" rather than guessing.`

const FUNCTIONS = [
  {
    name: 'get_attendance_stats',
    description: 'Get today\'s attendance statistics for staff or students',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['staff', 'students'], description: 'Which attendance to query' },
      },
      required: ['type'],
    },
  },
  {
    name: 'get_student_by_name',
    description: 'Search for a student by full or partial name',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Student full name or partial name' },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_students_by_class',
    description: 'Get all students in a given class',
    parameters: {
      type: 'object',
      properties: {
        class_name: { type: 'string', description: 'Class name (e.g., SS1, SS2, JSS1)' },
      },
      required: ['class_name'],
    },
  },
  {
    name: 'get_staff_by_name',
    description: 'Search for a staff member by full or partial name',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Staff full name or partial name' },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_staff_by_role',
    description: 'Get all staff members with a specific role',
    parameters: {
      type: 'object',
      properties: {
        role: { type: 'string', enum: ['admin', 'commandant', 'teacher', 'staff'], description: 'Role to filter by' },
      },
      required: ['role'],
    },
  },
  {
    name: 'get_current_term',
    description: 'Get the current academic term information',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_timetable_for_today',
    description: 'Get today\'s timetable entries, optionally filtered by teacher',
    parameters: {
      type: 'object',
      properties: {
        teacher_id: { type: 'string', description: 'Optional teacher UUID to filter by' },
      },
      required: [],
    },
  },
  {
    name: 'get_next_period',
    description: 'Get the next upcoming class period today',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_today_parades',
    description: 'Get parade schedules for today',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_notification_summary',
    description: 'Get a summary of recent notifications sent',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of recent notifications to fetch (default 10)' },
      },
      required: [],
    },
  },
]

async function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const supabase = await createServerSupabaseClient()

  switch (name) {
    case 'get_attendance_stats': {
      const type = args.type as string
      if (type === 'staff') {
        const { data } = await supabase.from('daily_reports').select('*').order('date', { ascending: false }).limit(1).maybeSingle()
        return data || { message: 'No staff attendance data available today' }
      }
      const { data: studentReport } = await supabase.from('student_daily_reports').select('*').order('date', { ascending: false }).limit(1).maybeSingle()
      if (studentReport) return studentReport
      const today = new Date().toISOString().split('T')[0]
      const { data: records } = await supabase.from('student_attendance').select('*, student:student_id(id, full_name, class)').eq('date', today)
      if (!records?.length) return { message: 'No student attendance recorded today' }
      const present = records.filter((r) => r.status === 'present').length
      const late = records.filter((r) => r.status === 'late').length
      const absent = records.filter((r) => r.status === 'absent').length
      return { date: today, total_students: records.length, present, late, absent, records: records.slice(0, 20) }
    }

    case 'get_student_by_name': {
      const name = args.name as string
      const { data } = await supabase.from('students').select('*').ilike('full_name', `%${name}%`).limit(10)
      return data?.length ? data : { message: `No student found matching "${name}"` }
    }

    case 'get_students_by_class': {
      const className = args.class_name as string
      const { data } = await supabase.from('students').select('*').ilike('class', `%${className}%`).limit(50)
      return data?.length ? data : { message: `No students found in class "${className}"` }
    }

    case 'get_staff_by_name': {
      const name = args.name as string
      const { data } = await supabase.from('staff').select('*').ilike('full_name', `%${name}%`).limit(10)
      return data?.length ? data : { message: `No staff found matching "${name}"` }
    }

    case 'get_staff_by_role': {
      const role = args.role as string
      const { data } = await supabase.from('staff').select('*').eq('role', role).limit(50)
      return data?.length ? data : { message: `No staff found with role "${role}"` }
    }

    case 'get_current_term': {
      const { data } = await supabase.from('academic_terms').select('*').eq('is_current', true).maybeSingle()
      return data || { message: 'No current academic term set' }
    }

    case 'get_timetable_for_today': {
      const teacherId = args.teacher_id as string | undefined
      const dayOfWeek = new Date().getDay() || 5
      let query = supabase
        .from('timetable_entries')
        .select('*, class:class_id(name, arm), subject:subject_id(name), teacher:teacher_id(id, full_name)')
        .eq('day_of_week', dayOfWeek)
      if (teacherId) query = query.eq('teacher_id', teacherId)
      const { data } = await query.order('period_number').limit(20)
      return data?.length ? data : { message: 'No timetable entries for today' }
    }

    case 'get_next_period': {
      const dayOfWeek = new Date().getDay() || 5
      const now = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
      const { data: slots } = await supabase.from('time_slots').select('*').eq('day_of_week', dayOfWeek).order('period_number')
      if (!slots?.length) return { message: 'No time slots defined for today' }
      for (const slot of slots) {
        if (now < slot.start_time.slice(0, 5)) {
          const { data: entries } = await supabase
            .from('timetable_entries')
            .select('*, class:class_id(name, arm), subject:subject_id(name), teacher:teacher_id(id, full_name)')
            .eq('day_of_week', dayOfWeek)
            .eq('period_number', slot.period_number)
          return { period: slot.period_number, start: slot.start_time.slice(0, 5), end: slot.end_time.slice(0, 5), is_break: slot.is_break, is_assembly: slot.is_assembly, entries: entries || [] }
        }
      }
      return { message: 'No more periods today' }
    }

    case 'get_today_parades': {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase.from('parades').select('*, conductor:conductor_id(id, staff_id, full_name)').eq('date', today).limit(5)
      return data?.length ? data : { message: 'No parades scheduled for today' }
    }

    case 'get_notification_summary': {
      const limit = (args.limit as number) || 10
      const { data } = await supabase.from('notification_logs').select('*').order('created_at', { ascending: false }).limit(limit)
      return data?.length ? data : { message: 'No notifications sent yet' }
    }

    default:
      return { error: `Unknown function: ${name}` }
  }
}

function buildGeminiPayload(messages: { role: string; content: string }[], toolResults?: { name: string; result: unknown }[]) {
  const contents: { role: string; parts: { text?: string; functionResponse?: { name: string; response: unknown } }[] }[] = []

  for (const msg of messages) {
    if (msg.role === 'system') continue
    const parts = [{ text: msg.content }]
    contents.push({ role: msg.role === 'assistant' ? 'model' : 'user', parts })
  }

  if (toolResults?.length) {
    for (const tr of toolResults) {
      contents.push({
        role: 'function',
        parts: [{ functionResponse: { name: tr.name, response: tr.result } }],
      })
    }
  }

  return {
    contents,
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    tools: FUNCTIONS.map((f) => ({
      functionDeclarations: [{
        name: f.name,
        description: f.description,
        parameters: f.parameters,
      }],
    })),
  }
}

function buildOpenAIPayload(messages: { role: string; content: string; name?: string }[], toolResults?: { name: string; result: unknown }[], model?: string) {
  const msgs: { role: string; content: string; name?: string }[] = [{ role: 'system', content: SYSTEM_PROMPT }]

  for (const msg of messages) {
    if (msg.role === 'system') continue
    msgs.push({ role: msg.role, content: msg.content, name: msg.name })
  }

  if (toolResults?.length) {
    for (const tr of toolResults) {
      msgs.push({ role: 'tool', content: JSON.stringify(tr.result), name: tr.name })
    }
  }

  return {
    model: model || AI_MODEL || 'gpt-4o-mini',
    messages: msgs,
    tools: FUNCTIONS.map((f) => ({
      type: 'function' as const,
      function: { name: f.name, description: f.description, parameters: f.parameters },
    })),
    tool_choice: 'auto' as const,
  }
}

async function callGemini(messages: { role: string; content: string }[]): Promise<{ content: string }> {
  const currentMessages = [...messages]
  const key = GEMINI_API_KEY || AI_API_KEY
  const model = GEMINI_MODEL

  const payload = buildGeminiPayload(currentMessages)
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error: ${res.status} — ${err}`)
  }

  const data = await res.json()
  const candidate = data.candidates?.[0]
  if (!candidate) throw new Error('No response from Gemini')

  const parts = candidate.content?.parts || []
  const textParts = parts.filter((p: { text?: string }) => p.text).map((p: { text: string }) => p.text).join('')
  const functionCalls = parts.filter((p: { functionCall?: unknown }) => p.functionCall)

  if (!functionCalls.length) {
    return { content: textParts || 'No response generated.' }
  }

  const toolResults: { name: string; result: unknown }[] = []
  for (const fc of functionCalls) {
    const name = fc.functionCall.name
    const args = fc.functionCall.args || {}
    const result = await executeTool(name, args)
    toolResults.push({ name, result })
  }

  const followUpPayload = buildGeminiPayload(currentMessages, toolResults)
  const followUpRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(followUpPayload),
  })

  if (!followUpRes.ok) {
    const err = await followUpRes.text()
    throw new Error(`Gemini follow-up error: ${followUpRes.status} — ${err}`)
  }

  const followUpData = await followUpRes.json()
  const followUpCandidate = followUpData.candidates?.[0]
  const followUpText = followUpCandidate?.content?.parts?.filter((p: { text?: string }) => p.text).map((p: { text: string }) => p.text).join('') || ''

  return { content: followUpText || 'Processed your request.' }
}

async function callOpenAI(messages: { role: string; content: string }[], maxTurns = 5): Promise<{ content: string }> {
  const currentMessages: { role: string; content: string; name?: string }[] = [...messages]
  const model = AI_MODEL || 'gpt-4o-mini'

  for (let turn = 0; turn < maxTurns; turn++) {
    const payload = buildOpenAIPayload(currentMessages, undefined, model)
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`OpenAI API error: ${res.status} — ${err}`)
    }

    const data = await res.json()
    const choice = data.choices?.[0]
    if (!choice) throw new Error('No response from OpenAI')

    const message = choice.message

    if (!message.tool_calls?.length) {
      return { content: message.content || 'No response generated.' }
    }

    const toolResults: { name: string; result: unknown }[] = []
    currentMessages.push({ role: 'assistant', content: message.content || '' })

    for (const tc of message.tool_calls) {
      const name = tc.function.name
      const args = JSON.parse(tc.function.arguments)
      const result = await executeTool(name, args)
      toolResults.push({ name, result })
      currentMessages.push({ role: 'tool', content: JSON.stringify(result), name })
    }
  }

  return { content: 'Request completed after multiple processing steps.' }
}

async function callOllama(messages: { role: string; content: string }[], maxTurns = 5): Promise<{ content: string }> {
  const currentMessages: { role: string; content: string; name?: string }[] = [...messages]

  for (let turn = 0; turn < maxTurns; turn++) {
    const payload = buildOpenAIPayload(currentMessages, undefined, OLLAMA_MODEL)
    const res = await fetch(`${OLLAMA_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Ollama API error: ${res.status} — ${err}`)
    }

    const data = await res.json()
    const choice = data.choices?.[0]
    if (!choice) throw new Error('No response from Ollama')

    const message = choice.message

    if (!message.tool_calls?.length) {
      return { content: message.content || 'No response generated.' }
    }

    const toolResults: { name: string; result: unknown }[] = []
    currentMessages.push({ role: 'assistant', content: message.content || '' })

    for (const tc of message.tool_calls) {
      const name = tc.function.name
      const args = JSON.parse(tc.function.arguments)
      const result = await executeTool(name, args)
      toolResults.push({ name, result })
      currentMessages.push({ role: 'tool', content: JSON.stringify(result), name })
    }
  }

  return { content: 'Request completed after multiple processing steps.' }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const auth = await getAuthStaff(supabase, request)
    if (!auth) return NextResponse.json({ error: 'Authentication required' }, { status: 403 })

    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const limit = await rateLimit(`${auth.id}:${ip}`, 20, 60)
    if (!limit.allowed) {
      return NextResponse.json({ error: `Rate limit exceeded. Try again in ${limit.resetInSeconds}s` }, { status: 429 })
    }

    const body = await request.json()
    const messages: { role: string; content: string }[] = body.messages
    const provider: string = body.provider || DEFAULT_PROVIDER

    if (!messages?.length) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 })
    }

    let result: { content: string }

    if (provider === 'openai') {
      if (!AI_API_KEY) {
        return NextResponse.json({ error: 'OpenAI not configured. Set AI_API_KEY in environment variables.' }, { status: 503 })
      }
      result = await callOpenAI(messages)
    } else if (provider === 'ollama') {
      result = await callOllama(messages)
    } else {
      if (!GEMINI_API_KEY && !AI_API_KEY) {
        return NextResponse.json({ error: 'Gemini not configured. Set GEMINI_API_KEY in environment variables.' }, { status: 503 })
      }
      result = await callGemini(messages)
    }

    return NextResponse.json({ role: 'assistant', content: result.content })
  } catch (err) {
    console.error('AI chat error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'AI request failed' }, { status: 500 })
  }
}
