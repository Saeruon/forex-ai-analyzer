# ◈ SARUON — AI Forex Market Analyzer v2.0

React app that runs a 7-step ICT/SMC analysis on a selected pair using the Anthropic Claude API with live web search.

**⚠ EDUCATIONAL ONLY — NOT FINANCIAL ADVICE**

---

## 🇰🇭 ការដំឡើង (Setup)

### 1. តម្រូវការ (Requirements)
- Node.js 18+ (https://nodejs.org)
- Anthropic API key (https://console.anthropic.com)
- VS Code

### 2. ដំឡើង dependencies
```bash
npm install
```

### 3. បង្កើត .env file (សំខាន់!)
```bash
cp .env.example .env
```
បើក `.env` រួចដាក់ API key **មួយក្នុងចំណោមពីរ**:

**Option 1 — FREE (Google AI Studio):**
- ចូល https://aistudio.google.com/apikey → Create API key
```
GEMINI_API_KEY=AIzaxxxxxxxx
```

**Option 2 — Anthropic (paid):**
```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
```
> ⚠ **កុំ commit `.env` ទៅ GitHub!** (`.gitignore` បានការពាររួចហើយ)

### 4. Run (development)
```bash
npm run dev
```
- Frontend: http://localhost:5173
- API proxy: http://localhost:3001

### 5. Build (production)
```bash
npm run build
npm start
```

---

## 🏗 Architecture

```
Browser (React/Vite :5173)
   │  POST /api/claude
   ▼
Express proxy (:3001)  ←  ANTHROPIC_API_KEY from .env
   │
   ▼
api.anthropic.com  (claude-sonnet-4-6 + web_search)
```

The API key lives **only** on the server (`server/index.js`). The browser never sees it.

## 📁 Structure

```
├── src/
│   ├── App.jsx        ← main UI + 7-step signal logic
│   └── main.jsx       ← React entry point
├── server/
│   └── index.js       ← Express proxy (holds API key)
├── index.html
├── vite.config.js     ← dev proxy /api → :3001
├── .env.example       ← copy to .env
└── .gitignore         ← excludes .env, node_modules, dist
```

## 🚀 Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: SARUON AI Forex Analyzer v2.0"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/forex-ai-analyzer.git
git push -u origin main
```

## ⚠ Notes
- Web search tool usage is billed per search on your Anthropic account.
- Each "ANALYZE" click = 1 API call + web searches.

---

## 🌐 Deploy ទៅ Vercel (Free)

1. Push project ទៅ GitHub (ជំហានខាងលើ)
2. ចូល https://vercel.com → **Add New → Project** → Import repo `forex-ai-analyzer`
3. Framework: **Vite** (auto-detect)
4. **Environment Variables** → បន្ថែម:
   - Name: `GEMINI_API_KEY` (free) ឬ `ANTHROPIC_API_KEY`
5. ចុច **Deploy** → បាន URL ដូចជា `https://forex-ai-analyzer.vercel.app`

> `api/analyze.js` ជា serverless function សម្រាប់ Vercel — key នៅ server-side ដដែល មិន leak ទៅ browser ទេ។
> Web search analysis អាចយូរ 20–40s ⇒ `maxDuration: 60` ត្រូវបានកំណត់ក្នុង `vercel.json` (Hobby plan គាំទ្រដល់ 60s)។
