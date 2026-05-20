# LinkedIn Job Assistant

AI-powered job application helper for LinkedIn. Built with Next.js, Groq (free AI), and Neon Postgres.

## Features
- 🎯 **Job Fit Screener** — score how well she matches a job (0–100)
- ✍️ **Cover Letter Generator** — tailored cover letter per job
- 📊 **Resume Gap Analyzer** — find skill gaps + actionable quick wins
- 📋 **Application Tracker** — persistent job tracking with Neon Postgres

---

## Deploy in 5 steps

### 1. Get a free Groq API key
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up (free)
3. Create an API key — copy it

### 2. Get a free Neon database
1. Go to [neon.tech](https://neon.tech)
2. Sign up (free)
3. Create a new project
4. Copy the **Connection string** (looks like `postgresql://user:pass@host/db?sslmode=require`)

### 3. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
gh repo create linkedin-job-assistant --public --push
# or push to an existing repo
```

### 4. Deploy on Railway
1. Go to [railway.app](https://railway.app) and sign in
2. Click **New Project → Deploy from GitHub repo**
3. Select your repo
4. Go to **Variables** tab and add:
   ```
   GROQ_API_KEY=gsk_your_key_here
   DATABASE_URL=postgresql://your_neon_connection_string
   ```
5. Railway auto-detects Next.js and deploys — takes ~2 minutes

### 5. Done!
Railway gives you a URL like `https://linkedin-job-assistant-production.up.railway.app`

Share that URL with your friend — the tracker data persists in Neon Postgres across all sessions.

---

## Local development

```bash
# Clone and install
npm install

# Create .env.local
cp .env.example .env.local
# Fill in GROQ_API_KEY and DATABASE_URL

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Stack
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **AI**: Groq (`llama-3.3-70b-versatile`) — free tier
- **Database**: Neon Postgres (serverless) — free tier
- **Hosting**: Railway
