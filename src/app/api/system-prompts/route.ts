import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-utils'
import type { Database } from '@/lib/database.types'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.from('system_prompts').select('*').order('category').order('label')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const { id, prompt_text, is_active } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const updates: Database['public']['Tables']['system_prompts']['Update'] = { updated_at: new Date().toISOString() }
  if (prompt_text !== undefined) updates.prompt_text = prompt_text
  if (is_active !== undefined) updates.is_active = is_active
  const { data, error } = await supabase.from('system_prompts').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const body = await request.json()
  if (!body.key || !body.label || !body.prompt_text) {
    return NextResponse.json({ error: 'key, label, and prompt_text required' }, { status: 400 })
  }
  const { data, error } = await supabase.from('system_prompts').insert({
    key: body.key, category: body.category || 'general', label: body.label,
    description: body.description || '', prompt_text: body.prompt_text, default_text: body.prompt_text,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
