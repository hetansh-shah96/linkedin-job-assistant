import { NextRequest, NextResponse } from 'next/server'
import { chat } from '@/lib/groq'

export async function POST(req: NextRequest) {
  try {
    const { resume, jobDescription } = await req.json()
    if (!resume || !jobDescription) {
      return NextResponse.json({ error: 'Resume and job description are required' }, { status: 400 })
    }

    const prompt = `You are a career coach. Do a detailed gap analysis between this candidate's resume and the target job.

RESUME:
${resume}

TARGET JOB DESCRIPTION:
${jobDescription}

Provide:
1. MATCH SCORE: X/100
2. SKILLS SHE HAS ✓: 4-5 matching skills/experiences
3. CRITICAL GAPS ✗: 3-4 required skills/experiences she's missing
4. NICE-TO-HAVE GAPS: 2-3 missing but not dealbreakers
5. QUICK WINS: 3 specific actions she can take in the next 1-4 weeks to close gaps (name actual certifications, tools, or keywords)
6. RESUME IMPROVEMENTS: 2-3 specific wording or formatting suggestions to better match this JD

Be specific and actionable.`

    const result = await chat(prompt)
    return NextResponse.json({ result })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to analyze gaps' }, { status: 500 })
  }
}
