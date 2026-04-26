import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { ShieldCheck } from 'lucide-react'
import { LoginButton } from '@/components/LoginButton'
import { Logo } from '@/components/Logo'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/dashboard')
  }

  const signInWithGithub = async () => {
    'use server'
    const supabase = await createClient()
    const headerStore = await headers()
    const host = headerStore.get('host')
    const protocol = headerStore.get('x-forwarded-proto') || 'http'
    const origin = host ? `${protocol}://${host}` : 'http://localhost:3000'
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    })

    if (data.url) {
      redirect(data.url)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 flex flex-col items-center justify-center p-4 selection:bg-lime-400 selection:text-black font-sans">
      
      {/* Background terminal grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] -z-10"></div>
      
      <div className="max-w-md w-full relative">
        <div className="bg-black border-2 border-zinc-800 p-8 md:p-10 rounded-none relative">
          
          {/* Cyber accents */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-lime-400"></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-lime-400"></div>

          <div className="flex flex-col items-center text-center space-y-6 mb-10">
            <Logo className="w-20 h-20" />
            
            <div className="space-y-3">
              <h1 className="text-4xl font-black tracking-tighter text-zinc-100 uppercase italic">
                Hunter<span className="text-lime-400">_OS</span>
              </h1>
              <p className="text-zinc-500 text-[10px] leading-relaxed max-w-[280px] mx-auto font-[family-name:var(--font-jetbrains-mono)] uppercase tracking-widest">
                &gt; INITIALIZING TARGETING SYSTEM... <br/>
                &gt; CONNECT GITHUB TO START THE HUNT.
              </p>
            </div>
          </div>

          <form action={signInWithGithub}>
            <LoginButton>
              <Github className="mr-3 h-5 w-5" />
              [ Connect GitHub ]
            </LoginButton>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-800 flex items-center justify-center gap-2 text-xs text-zinc-500 font-medium tracking-wide">
            <ShieldCheck className="w-4 h-4 text-lime-500/80" />
            <span>Secure authentication via Supabase</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Github(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}
