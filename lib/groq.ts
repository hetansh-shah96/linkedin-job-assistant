import Groq from 'groq-sdk'

if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY is not set')
}

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export const MODEL = 'llama-3.3-70b-versatile'

export async function chat(prompt: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: MODEL,
    temperature: 0.7,
    max_tokens: 1024,
  })
  return completion.choices[0]?.message?.content ?? 'No response generated.'
}
