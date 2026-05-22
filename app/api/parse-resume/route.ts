import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'

export const runtime = 'nodejs'

const ACCEPTED = ['pdf', 'docx', 'txt']

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ACCEPTED.includes(ext)) {
      return NextResponse.json({ error: 'Unsupported file type. Use PDF, DOCX, or TXT.' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    let text = ''

    if (ext === 'pdf') {
      // require() at call-time avoids ESM/CJS interop issues with this CJS-only module
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>
      const data = await pdfParse(buffer)
      text = data.text
    } else if (ext === 'docx') {
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else {
      text = buffer.toString('utf-8')
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: 'Could not extract text from file. Try a different PDF or paste the text manually.' },
        { status: 422 },
      )
    }

    return NextResponse.json({ text: text.trim() })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[parse-resume]', message)
    return NextResponse.json({ error: `Parse error: ${message}` }, { status: 500 })
  }
}
