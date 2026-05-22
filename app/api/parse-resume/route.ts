import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (ext !== 'docx') {
      return NextResponse.json({ error: 'Only DOCX files are handled server-side.' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const result = await mammoth.extractRawText({ buffer })
    const text = result.value.trim()

    if (!text) {
      return NextResponse.json(
        { error: 'Could not extract text. Try pasting the content manually.' },
        { status: 422 },
      )
    }

    return NextResponse.json({ text })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[parse-resume]', message)
    return NextResponse.json({ error: `Parse error: ${message}` }, { status: 500 })
  }
}
