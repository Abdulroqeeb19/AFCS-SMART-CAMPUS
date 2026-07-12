const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const migrationPath = path.resolve(__dirname, '..', 'src/db/migrations/025_automation_engine.sql')

async function main() {
  const dbUrl = process.env.SUPABASE_DATABASE_URL
  if (!dbUrl) {
    console.error(`
SUPABASE_DATABASE_URL not set. Run the SQL manually in Supabase SQL Editor:

  1. Go to https://supabase.com/dashboard/project/neezlomqvqprrxgzmxjb/sql/new
  2. Paste the content of:
     src/db/migrations/025_automation_engine.sql
  3. Click "Run"

Or set the env var and re-run:
  $env:SUPABASE_DATABASE_URL = "postgresql://postgres:PASSWORD@db.neezlomqvqprrxgzmxjb.supabase.co:5432/postgres"
  node scripts/migrate-025.js
`)
    process.exit(1)
  }

  const sql = fs.readFileSync(migrationPath, 'utf8')
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  const client = new Client({ connectionString: dbUrl })
  await client.connect()
  console.log(`Connected. Running ${statements.length} statements...`)

  for (const stmt of statements) {
    try {
      await client.query(stmt + ';')
      console.log(`  OK: ${stmt.substring(0, 80)}...`)
    } catch (err) {
      if (err.message.includes('already exists') || err.message.includes('does not exist')) {
        console.log(`  SKIP: ${stmt.substring(0, 80)}...`)
      } else {
        console.error(`  FAIL: ${err.message}`)
        console.error(`  SQL: ${stmt}`)
      }
    }
  }

  await client.end()
  console.log('\nMigration 025 applied successfully.')
}

main().catch(err => { console.error(err); process.exit(1) })
