import { NextRequest, NextResponse } from 'next/server'
import { chat } from '@/lib/groq'

export async function POST(req: NextRequest) {
  try {
    const { resume, jobDescription, criteria } = await req.json()
    if (!resume || !jobDescription) {
      return NextResponse.json({ error: 'Resume and job description are required' }, { status: 400 })
    }

    const prompt = `You are a job fit screener. Analyze if this candidate meets the job requirements.

CANDIDATE RESUME/SKILLS:
${resume}

JOB DESCRIPTION:
${jobDescription}

${criteria ? `CANDIDATE'S CRITERIA/PREFERENCES:\n${criteria}` : ''}

Provide a structured analysis:
1. MATCH SCORE: X/100
2. STRENGTHS: 3-4 bullet points where she meets/exceeds requirements
3. GAPS: 2-3 bullet points where she falls short
4. CRITERIA CHECK: Does the job meet her stated preferences? (if criteria provided)
5. VERDICT: Should she apply? (Yes / Yes with caveats / No) with a 1-2 sentence reason.

Be direct and honest.`

    const result = await chat(prompt)
    return NextResponse.json({ result })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to analyze job fit' }, { status: 500 })
  }
}
