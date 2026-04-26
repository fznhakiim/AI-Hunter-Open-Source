# 🎯 AI Open Source Hunter

An advanced agentic platform to discover, evaluate, and track high-value open-source issues and repository intelligence.

## 🚀 Features

- **Automated Scout Mode:** Scan GitHub for issues matching your tech stack.
- **Sniper Mode:** Deep-dive into specific repositories to get tech stack analysis, pros, cons, and contribution verdicts.
- **Intelligence Feed:** Real-time stream of evaluated opportunities with AI-generated solution drafts.
- **Mission Control:** Save targets for later and track your solved missions.

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **AI Brain:** Google Gemma 3 (27B) via LangGraph
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS + Shadcn UI
- **Icons:** Lucide React

## 🚦 Getting Started

1. **Clone the repo**
2. **Install dependencies:** `npm install`
3. **Setup Environment Variables:** Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `GEMINI_API_KEY`
   - `GITHUB_TOKEN`
4. **Run Dev Server:** `npm run dev`

## 📡 Deployment

Deploy seamlessly on **Vercel**. Ensure all environment variables are added to the Vercel project settings.

---
Built with ⚡ by AI Open Source Hunter
