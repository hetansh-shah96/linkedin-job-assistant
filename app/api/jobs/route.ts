import { NextRequest, NextResponse } from 'next/server'
import { sql, initDB } from '@/lib/db'

// Ensure table exists on first request
let initialized = false
async function ensureDB() {
  if (!initialized) {
    await initDB()
    initialized = true
  }
}

// GET all jobs
export async function GET() {
  try {
    await ensureDB()
    const jobs = await sql`SELECT * FROM jobs ORDER BY date_added DESC`
    return NextResponse.json({ jobs })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
  }
}

// POST create job
export async function POST(req: NextRequest) {
  try {
    await ensureDB()
    const { company, role, status, url } = await req.json()
    if (!company || !role) {
      return NextResponse.json({ error: 'Company and role are required' }, { status: 400 })
    }
    const [job] = await sql`
      INSERT INTO jobs (company, role, status, url)
      VALUES (${company}, ${role}, ${status ?? 'saved'}, ${url ?? null})
      RETURNING *
    `
    return NextResponse.json({ job })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
  }
}

// PATCH update job status
export async function PATCH(req: NextRequest) {
  try {
    await ensureDB()
    const { id, status } = await req.json()
    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 })
    }
    const [job] = await sql`
      UPDATE jobs SET status = ${status} WHERE id = ${id} RETURNING *
    `
    return NextResponse.json({ job })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 })
  }
}

// DELETE job
export async function DELETE(req: NextRequest) {
  try {
    await ensureDB()
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    await sql`DELETE FROM jobs WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 })
  }
}
