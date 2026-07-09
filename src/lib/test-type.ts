import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabase = createClient<Database>('http://localhost', 'key')

async function test() {
  const { data } = await supabase.from('staff').select('*')
  // data should be Staff.Row[] — access a property
  if (data) {
    const first = data[0]
    const name: string = first.full_name
    const email: string = first.email
  }

  const { data: depts } = await supabase.from('departments').select('*')
  if (depts) {
    const first = depts[0]
    const n: string = first.name
  }
}