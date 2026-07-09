const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const migrationFile = process.argv[2]
if (!migrationFile) {
  console.error('Usage: node scripts/run-migration.js <migration-file>')
  console.error('Example: node scripts/run-migration.js src/db/migrations/020_restore_rls_for_prod.sql')
  process.exit(1)
}

const dbUrl = process.env.SUPABASE_DATABASE_URL
if (!dbUrl) {
  console.error(`
ERROR: SUPABASE_DATABASE_URL environment variable is not set.

To get your database connection string:
1. Go to https://supabase.com/dashboard/project/neezlomqvqprrxgzmxjb/settings/database
2. Under "Connection string", copy the "URI" (NOT the pooler one)
3. It looks like: postgresql://postgres:xxxxxxxx@db.neezlomqvqprrxgzmxjb.supabase.co:5432/postgres
4. Set it: $env:SUPABASE_DATABASE_URL="postgresql://..."
5. Run this script again
`)
  process.exit(1)
}

async function run() {
  const sql = fs.readFileSync(path.resolve(migrationFile), 'utf8')
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  const client = new Client({ connectionString: dbUrl })
  await client.connect()
  console.log(`Connected to database. Running ${statements.length} statements...`)

  for (const stmt of statements) {
    try {
      await client.query(stmt)
      console.log(`  OK: ${stmt.substring(0, 80)}...`)
    } catch (err) {
      if (err.message.includes('already exists') || err.message.includes('does not exist')) {
        console.log(`  SKIP (idempotent): ${stmt.substring(0, 80)}...`)
      } else {
        console.error(`  FAIL: ${err.message}`)
        console.error(`  SQL: ${stmt}`)
      }
    }
  }

  await client.end()
  console.log('\nMigration complete.')
}

run().catch(err => { console.error(err); process.exit(1) })
