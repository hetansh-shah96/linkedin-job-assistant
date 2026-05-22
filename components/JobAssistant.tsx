'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

type Tab = 'screener' | 'cover' | 'gap' | 'tracker'
type Status = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected'

interface Job {
  id: number
  company: string
  role: string
  status: Status
  url?: string
  date_added: string
}

const STATUS_LABELS: Record<Status, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interview: 'Interview',
  offer: 'Offer 🎉',
  rejected: 'Rejected',
}

const STATUS_CLASSES: Record<Status, string> = {
  saved: 'status-saved',
  applied: 'status-applied',
  interview: 'status-interview',
  offer: 'status-offer',
  rejected: 'status-rejected',
}

function ScoreBadge({ text }: { text: string }) {
  const match = text.match(/(\d+)\s*\/\s*100/)
  if (!match) return null
  const score = parseInt(match[1])
  const cls = score >= 70 ? 'score-high' : score >= 45 ? 'score-mid' : 'score-low'
  const label = score >= 70 ? 'Good Fit' : score >= 45 ? 'Moderate Fit' : 'Low Fit'
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-3 ${cls}`}>
      {score}/100 — {label}
    </span>
  )
}

// ── RESUME UPLOAD FIELD ───────────────────────────────────────────────────────
async function extractText(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''

  if (ext === 'txt') {
    return await file.text()
  }

  if (ext === 'pdf') {
    const arrayBuffer = await file.arrayBuffer()
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const pages: string[] = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      pages.push(
        content.items
          .map((item) => ('str' in item ? (item as { str: string }).str : ''))
          .join(' '),
      )
    }
    return pages.join('\n')
  }

  if (ext === 'docx') {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/parse-resume', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.text) return data.text
    throw new Error(data.error ?? 'Failed to parse DOCX')
  }

  throw new Error('Unsupported file type. Use PDF, DOCX, or TXT.')
}

function ResumeField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const text = await extractText(file)
      if (text.trim()) onChange(text.trim())
      else alert('Could not extract text. Try pasting manually.')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to read file. Try pasting manually.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
        <button
          type="button"
          className="btn-ghost text-xs"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Parsing…' : '↑ Upload PDF / DOCX'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={handleFile}
        />
      </div>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}

function ResultBox({ text, showScore = false }: { text: string; showScore?: boolean }) {
  return (
    <div className="mt-4 card">
      {showScore && <ScoreBadge text={text} />}
      <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">{text}</pre>
    </div>
  )
}

// ── SCREENER TAB ──────────────────────────────────────────────────────────────
function ScreenerTab() {
  const [resume, setResume] = useState('')
  const [jd, setJd] = useState('')
  const [criteria, setCriteria] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const run = async () => {
    if (!resume || !jd) { alert('Please fill in both resume and job description.'); return }
    setLoading(true); setResult('')
    try {
      const res = await fetch('/api/screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume, jobDescription: jd, criteria }),
      })
      const data = await res.json()
      setResult(data.result ?? data.error)
    } catch { setResult('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">Paste her resume and a LinkedIn job description to get a fit score and honest verdict.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ResumeField
          label="Her resume / skills"
          value={resume}
          onChange={setResume}
          placeholder="Upload a PDF/DOCX or paste resume text here…"
        />
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Job description</label>
          <textarea value={jd} onChange={e => setJd(e.target.value)} placeholder="Paste the full LinkedIn job description..." />
        </div>
      </div>
      <div className="mt-4">
        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Her criteria / preferences (optional)</label>
        <textarea value={criteria} onChange={e => setCriteria(e.target.value)} placeholder="e.g. Remote only, min 8 LPA, Python required, no more than 5 yrs experience..." style={{ minHeight: '70px' }} />
      </div>
      <div className="flex justify-end mt-4">
        <button className="btn-primary" onClick={run} disabled={loading}>
          {loading && <span className="spinner" />}
          {loading ? 'Analyzing...' : 'Check Fit'}
        </button>
      </div>
      {result && <ResultBox text={result} showScore />}
    </div>
  )
}

// ── COVER LETTER TAB ──────────────────────────────────────────────────────────
function CoverLetterTab() {
  const [background, setBackground] = useState('')
  const [jd, setJd] = useState('')
  const [company, setCompany] = useState('')
  const [tone, setTone] = useState('professional')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const run = async () => {
    if (!background || !jd) { alert('Please fill in background and job description.'); return }
    setLoading(true); setResult('')
    try {
      const res = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ background, jobDescription: jd, company, tone }),
      })
      const data = await res.json()
      setResult(data.result ?? data.error)
    } catch { setResult('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  const copy = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">Generate a tailored cover letter for each job in seconds.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ResumeField
          label="Her name & background"
          value={background}
          onChange={setBackground}
          placeholder="Upload a PDF/DOCX or paste name, role, skills, achievements…"
        />
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Job description</label>
          <textarea value={jd} onChange={e => setJd(e.target.value)} placeholder="Paste the job description..." />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Company name</label>
          <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Zomato, Infosys, a startup..." />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Tone</label>
          <select value={tone} onChange={e => setTone(e.target.value)}>
            <option value="professional">Professional & formal</option>
            <option value="warm">Warm & conversational</option>
            <option value="confident">Confident & assertive</option>
            <option value="concise">Concise & direct</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <button className="btn-primary" onClick={run} disabled={loading}>
          {loading && <span className="spinner" />}
          {loading ? 'Generating...' : 'Generate Cover Letter'}
        </button>
      </div>
      {result && (
        <div className="mt-4 card">
          <div className="flex justify-end mb-2">
            <button className="btn-ghost text-sm" onClick={copy}>
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">{result}</pre>
        </div>
      )}
    </div>
  )
}

// ── GAP ANALYSIS TAB ──────────────────────────────────────────────────────────
function GapTab() {
  const [resume, setResume] = useState('')
  const [jd, setJd] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const run = async () => {
    if (!resume || !jd) { alert('Please fill in both resume and job description.'); return }
    setLoading(true); setResult('')
    try {
      const res = await fetch('/api/gap-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume, jobDescription: jd }),
      })
      const data = await res.json()
      setResult(data.result ?? data.error)
    } catch { setResult('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">Compare her resume against a job to find gaps and get actionable quick wins.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ResumeField
          label="Her current resume"
          value={resume}
          onChange={setResume}
          placeholder="Upload a PDF/DOCX or paste full resume here…"
        />
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Target job description</label>
          <textarea value={jd} onChange={e => setJd(e.target.value)} placeholder="Paste the job description she wants to target..." />
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <button className="btn-primary" onClick={run} disabled={loading}>
          {loading && <span className="spinner" />}
          {loading ? 'Analyzing...' : 'Analyze Gaps'}
        </button>
      </div>
      {result && <ResultBox text={result} showScore />}
    </div>
  )
}

// ── TRACKER TAB ───────────────────────────────────────────────────────────────
function TrackerTab() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState<Status>('saved')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/jobs')
      const data = await res.json()
      setJobs(data.jobs ?? [])
    } catch { /* silent */ }
    finally { setFetching(false) }
  }, [])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  const addJob = async () => {
    if (!company || !role) { alert('Please enter company and role.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, role, status, url: url || null }),
      })
      const data = await res.json()
      setJobs(prev => [data.job, ...prev])
      setCompany(''); setRole(''); setUrl(''); setStatus('saved')
    } catch { alert('Failed to add job.') }
    finally { setLoading(false) }
  }

  const updateStatus = async (id: number, newStatus: Status) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: newStatus } : j))
    await fetch('/api/jobs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    })
  }

  const removeJob = async (id: number) => {
    setJobs(prev => prev.filter(j => j.id !== id))
    await fetch('/api/jobs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">Track every application. Data is saved to your database — persists across sessions.</p>

      {/* Add job form */}
      <div className="card mb-5" style={{ background: '#F3F2EE' }}>
        <h3 className="text-sm font-semibold mb-3 text-gray-700">+ Add application</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Company</label>
            <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Google" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Role</label>
            <input type="text" value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Product Manager" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as Status)}>
              {(Object.keys(STATUS_LABELS) as Status[]).map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <button className="btn-primary" onClick={addJob} disabled={loading} style={{ borderRadius: '6px' }}>
            {loading ? 'Adding...' : 'Add'}
          </button>
        </div>
        <div className="mt-3">
          <label className="block text-xs text-gray-500 mb-1">LinkedIn URL (optional)</label>
          <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://linkedin.com/jobs/view/..." />
        </div>
      </div>

      {/* Jobs list */}
      {fetching ? (
        <p className="text-sm text-gray-400 text-center py-8">Loading applications...</p>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">💼</div>
          <p className="text-sm">No applications yet. Add one above!</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left p-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Company</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Role</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Added</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-3 font-medium">
                    {job.company}
                    {job.url && (
                      <a href={job.url} target="_blank" rel="noopener noreferrer"
                        className="ml-2 text-xs text-blue-600 hover:underline">↗</a>
                    )}
                  </td>
                  <td className="p-3 text-gray-500">{job.role}</td>
                  <td className="p-3">
                    <select
                      value={job.status}
                      onChange={e => updateStatus(job.id, e.target.value as Status)}
                      className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_CLASSES[job.status]}`}
                      style={{ width: 'auto' }}
                    >
                      {(Object.keys(STATUS_LABELS) as Status[]).map(s => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-gray-400 text-xs">{formatDate(job.date_added)}</td>
                  <td className="p-3">
                    <button onClick={() => removeJob(job.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
                      title="Remove">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'screener',  label: 'Job Fit',     icon: '🎯' },
  { id: 'cover',     label: 'Cover Letter', icon: '✍️' },
  { id: 'gap',       label: 'Resume Gap',  icon: '📊' },
  { id: 'tracker',   label: 'Tracker',     icon: '📋' },
]

export default function JobAssistant() {
  const [tab, setTab] = useState<Tab>('screener')

  return (
    <div className="card">
      {/* Tabs */}
      <div className="flex border-b border-gray-100 -mx-6 px-6 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id
                ? 'tab-active'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
            style={{ marginBottom: '-1px' }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      {tab === 'screener' && <ScreenerTab />}
      {tab === 'cover'    && <CoverLetterTab />}
      {tab === 'gap'      && <GapTab />}
      {tab === 'tracker'  && <TrackerTab />}
    </div>
  )
}
