// Run this once to initialize the database: node lib/db-init.js
const { neon } = require('@neondatabase/serverless')
require('dotenv').config({ path: '.env.local' })

async function init() {
  const sql = neon(process.env.DATABASE_URL)
  await sql`
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      company TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'saved',
      url TEXT,
      date_added TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `
  console.log('✅ Database initialized successfully')
  process.exit(0)
}

init().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
