import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  const isStaff = !!user?.email

  const hasToken = !!process.env.WHATSAPP_API_TOKEN
  const hasPhoneId = !!process.env.WHATSAPP_PHONE_NUMBER_ID
  const hasWebhook = !!(process.env.MAKE_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL)
  const hasTermii = !!process.env.TERMII_API_KEY
  const hasAfricasTalking = !!process.env.AFRICAS_TALKING_API_KEY

  if (!isStaff) {
    return NextResponse.json({
      status: hasToken && hasPhoneId || hasTermii || hasAfricasTalking ? 'operational' : 'unavailable',
      channels: ['sms', 'whatsapp'],
    })
  }

  const smsStatus: 'configured' | 'disabled' =
    hasTermii || hasAfricasTalking ? 'configured' : 'disabled'
  const whatsappStatus: 'configured' | 'partial' | 'disabled' =
    hasToken && hasPhoneId ? 'configured' : hasToken || hasPhoneId ? 'partial' : 'disabled'

  return NextResponse.json({
    status: smsStatus === 'configured' || whatsappStatus === 'configured' ? 'configured' : 'disabled',
    channels: {
      sms: smsStatus === 'configured',
      whatsapp: whatsappStatus === 'configured',
      webhook: hasWebhook,
    },
  })
}
