import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getTelegramBotToken(): Promise<string> {
  if (process.env.TELEGRAM_BOT_TOKEN) {
    return process.env.TELEGRAM_BOT_TOKEN
  }

  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase.from('settings').select('telegram_bot_token').maybeSingle()
    if (data?.telegram_bot_token) {
      process.env.TELEGRAM_BOT_TOKEN = data.telegram_bot_token
      return data.telegram_bot_token
    }
  } catch {}

  return ''
}
