import { NextRequest, NextResponse } from 'next/server'
import { chat } from '@/lib/groq'

export async function POST(req: NextRequest) {
  try {
    const { background, jobDescription, company, tone } = await req.json()
    if (!background || !jobDescription) {
      return NextResponse.json({ error: 'Background and job description are required' }, { status: 400 })
    }

    const prompt = `Write a compelling cover letter for a job application.

CANDIDATE BACKGROUND:
${background}

JOB DESCRIPTION:
${jobDescription}

${company ? `COMPANY: ${company}` : ''}
TONE: ${tone || 'professional'}

Instructions:
- Keep it under 300 words
- Do not use generic openers like "I am writing to apply"
- Highlight 2-3 specific, relevant achievements
- Show enthusiasm for the role without being sycophantic
- End with a confident call to action
- Match the specified tone throughout

Write only the cover letter text, ready to copy-paste.`

    const result = await chat(prompt)
    return NextResponse.json({ result })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to generate cover letter' }, { status: 500 })
  }
}
