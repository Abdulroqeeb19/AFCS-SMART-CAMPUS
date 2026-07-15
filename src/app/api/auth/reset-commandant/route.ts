import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-utils'

const DEV_RESET_SECRET = process.env.DEV_RESET_SECRET || ''

export async function POST(request: Request) {
  const body = await request.json()
  const { action, targetEmail, secret } = body

  if (!secret || secret !== DEV_RESET_SECRET) {
    return NextResponse.json({ error: 'Invalid or missing reset secret' }, { status: 403 })
  }

  const adminSupabase = createAdminClient()

  if (action === 'list-commandants') {
    const { data } = await adminSupabase
      .from('staff')
      .select('id, staff_id, full_name, email')
      .eq('role', 'commandant')
      .eq('is_active', true)

    return NextResponse.json({ commandants: data || [] })
  }

  if (action === 'demote-all-commandants') {
    const { data: commandants, error: findError } = await adminSupabase
      .from('staff')
      .select('id')
      .eq('role', 'commandant')

    if (findError) return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })

    if (!commandants || commandants.length === 0) {
      return NextResponse.json({ message: 'No commandants to demote', demoted: 0 })
    }

    const ids = commandants.map(s => s.id)
    const { error: updateError } = await adminSupabase
      .from('staff')
      .update({ role: 'admin', updated_at: new Date().toISOString() })
      .in('id', ids)

    if (updateError) return NextResponse.json({ error: 'Demotion failed' }, { status: 500 })

    return NextResponse.json({
      message: `Demoted ${ids.length} commandant(s) to admin`,
      demoted: ids.length,
    })
  }

  if (action === 'promote-to-commandant') {
    if (!targetEmail) {
      return NextResponse.json({ error: 'targetEmail is required' }, { status: 400 })
    }

    // Remove existing commandant first
    const { data: existingCommandants } = await adminSupabase
      .from('staff')
      .select('id')
      .eq('role', 'commandant')

    if (existingCommandants && existingCommandants.length > 0) {
      const ids = existingCommandants.map(s => s.id)
      await adminSupabase
        .from('staff')
        .update({ role: 'admin', updated_at: new Date().toISOString() })
        .in('id', ids)
    }

    const { data: target, error: findError } = await adminSupabase
      .from('staff')
      .select('id, email, full_name')
      .ilike('email', targetEmail)
      .eq('is_active', true)
      .single()

    if (findError || !target) {
      return NextResponse.json({ error: 'Target staff not found' }, { status: 404 })
    }

    const { error: promoteError } = await adminSupabase
      .from('staff')
      .update({ role: 'commandant', updated_at: new Date().toISOString() })
      .eq('id', target.id)

    if (promoteError) return NextResponse.json({ error: 'Promotion failed' }, { status: 500 })

    return NextResponse.json({
      message: `${target.full_name} is now Commandant`,
      staff: { id: target.id, email: target.email, full_name: target.full_name, role: 'commandant' },
    })
  }

  if (action === 'promote-me') {
    if (!targetEmail) {
      return NextResponse.json({ error: 'targetEmail is required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const admin = await requireAdmin(supabase, request)
    if (!admin) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 403 })
    }

    // Demote existing commandants
    const { data: existingCommandants } = await adminSupabase
      .from('staff')
      .select('id')
      .eq('role', 'commandant')

    if (existingCommandants && existingCommandants.length > 0) {
      const ids = existingCommandants.map(s => s.id)
      await adminSupabase
        .from('staff')
        .update({ role: 'admin', updated_at: new Date().toISOString() })
        .in('id', ids)
    }

    // Verify target matches authenticated user
    const { data: target } = await adminSupabase
      .from('staff')
      .select('id, email, full_name')
      .eq('id', admin.id)
      .single()

    if (!target) {
      return NextResponse.json({ error: 'Staff record not found' }, { status: 404 })
    }

    const { error: promoteError } = await adminSupabase
      .from('staff')
      .update({ role: 'commandant', updated_at: new Date().toISOString() })
      .eq('id', admin.id)

    if (promoteError) return NextResponse.json({ error: 'Promotion failed' }, { status: 500 })

    return NextResponse.json({
      message: `You are now Commandant. Please re-login.`,
      staff: { id: target.id, email: target.email, full_name: target.full_name, role: 'commandant' },
    })
  }

  return NextResponse.json({ error: 'Invalid action. Use: list-commandants, demote-all-commandants, promote-to-commandant, promote-me' }, { status: 400 })
}
