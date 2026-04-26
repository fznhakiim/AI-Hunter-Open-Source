import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { Activity, Search, Terminal } from 'lucide-react'
import { ScoutButton } from '@/components/ScoutButton'
import { ExitButton } from '@/components/ExitButton'
import { Logo } from '@/components/Logo'
import { SniperInput } from '@/components/SniperInput'
import { IssueCard } from '@/components/IssueCard'
import { Badge } from '@/components/ui/badge'
import { SkillsEditor } from '@/components/SkillsEditor'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const currentStatus = params.status || 'found'

  const handleLogout = async () => {
    'use server'
    const supabaseClient = await createServerClient()
    await supabaseClient.auth.signOut()
    redirect('/login')
  }

  // Fetch user profile and skills (Using Service Role bypass for reliability)
  const serviceKey = (process.env.SUPABASE_SERVICE_KEY || "").trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const adminClient = createClient(supabaseUrl, serviceKey);

  const { data: profile, error: profileError } = await adminClient
    .from('user_profile')
    .select('skills')
    .eq('user_id', user.id)
    .maybeSingle()
  
  if (profileError) {
    console.error("[Dashboard] Profile Fetch Error:", profileError);
  }

  const rawSkills = profile?.skills || []
  const skills = rawSkills.length > 0 ? rawSkills : ["TypeScript", "React", "Next.js", "Tailwind"]
  
  console.log(`[Dashboard] User: ${user.id}, Skills Found: ${rawSkills.length}, Displaying: ${skills.join(', ')}`);

  // Fetch issues based on status tab
  let queryBuilder = supabase
    .from('found_issues')
    .select('*')
    .eq('user_id', user.id)

  if (currentStatus === 'intel') {
    // New repo analysis results
    queryBuilder = queryBuilder.eq('language', 'REPO_INTEL').eq('status', 'found')
  } else if (currentStatus === 'found') {
    // Active Feed: Issues only
    queryBuilder = queryBuilder.eq('status', 'found').neq('language', 'REPO_INTEL')
  } else {
    // Saved and Solved tabs: Show everything (Issues + Sniper Intel)
    queryBuilder = queryBuilder.eq('status', currentStatus)
  }

  const { data: issues } = await queryBuilder
    .order('match_score', { ascending: false })
    .limit(20)

  const foundIssues = issues || []

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 pb-20 relative font-sans selection:bg-lime-400 selection:text-black">
      
      {/* Navigation */}
      <header className="border-b border-zinc-800/80 bg-black/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-6 h-6" />
            <span className="font-black tracking-tighter uppercase text-sm italic">
              Hunter<span className="text-lime-400">_OS</span>
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-500 font-medium font-[family-name:var(--font-jetbrains-mono)]">
              usr: {user.email?.split('@')[0]}
            </span>
            <div className="h-4 w-px bg-zinc-800"></div>
            <form action={handleLogout}>
              <ExitButton />
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10 space-y-10">
        
        {/* Header Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border-b border-zinc-800 pb-10">
          <div className="lg:col-span-7">
            <h1 className="text-5xl font-bold tracking-tighter text-zinc-100">
              Operations Center.
            </h1>
            <p className="text-zinc-400 mt-4 text-sm max-w-xl font-[family-name:var(--font-jetbrains-mono)] leading-relaxed">
              <span className="text-lime-400">&gt;</span> Automated Open Source Hunter active. <br/>
              <span className="text-lime-400">&gt;</span> Deploying Sniper mode for targeted repository deep-dives. <br/>
              <span className="text-lime-400">&gt;</span> Monitoring GitHub for human-worthy contributions.
            </p>
          </div>
          
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-lg backdrop-blur-sm">
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4 font-[family-name:var(--font-jetbrains-mono)]">Sniper_Mode.v2</h3>
              <SniperInput />
              <p className="text-[10px] text-zinc-500 mt-3 font-[family-name:var(--font-jetbrains-mono)]">
                Target specific repositories to bypass skill filters.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            <div className="sticky top-24 space-y-6">
              <ScoutButton />

              <SkillsEditor key={skills.join(',')} initialSkills={skills} />

              <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-lg p-5">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 font-[family-name:var(--font-jetbrains-mono)]">Mission Status</h3>
                <div className="space-y-3">
                  <Link href="/dashboard?status=found" className={`flex items-center justify-between p-2 rounded transition-all cursor-pointer ${currentStatus === 'found' ? 'bg-lime-400 text-black' : 'text-zinc-400 hover:bg-zinc-800/50'}`}>
                    <span className="text-xs font-bold uppercase tracking-wider font-[family-name:var(--font-jetbrains-mono)]">Active Feed</span>
                    <Activity className="w-4 h-4" />
                  </Link>
                  <Link href="/dashboard?status=intel" className={`flex items-center justify-between p-2 rounded transition-all cursor-pointer ${currentStatus === 'intel' ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'text-zinc-400 hover:bg-zinc-800/50'}`}>
                    <span className="text-xs font-bold uppercase tracking-wider font-[family-name:var(--font-jetbrains-mono)]">Sniper Intel</span>
                    <Terminal className="w-4 h-4" />
                  </Link>
                  <Link href="/dashboard?status=saved" className={`flex items-center justify-between p-2 rounded transition-all cursor-pointer ${currentStatus === 'saved' ? 'bg-amber-400 text-black' : 'text-zinc-400 hover:bg-zinc-800/50'}`}>
                    <span className="text-xs font-bold uppercase tracking-wider font-[family-name:var(--font-jetbrains-mono)]">Saved Targets</span>
                    <Search className="w-4 h-4" />
                  </Link>
                  <Link href="/dashboard?status=solved" className={`flex items-center justify-between p-2 rounded transition-all cursor-pointer ${currentStatus === 'solved' ? 'bg-blue-400 text-black' : 'text-zinc-400 hover:bg-zinc-800/50'}`}>
                    <span className="text-xs font-bold uppercase tracking-wider font-[family-name:var(--font-jetbrains-mono)]">Missions Solved</span>
                    <Search className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-lg p-5">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 font-[family-name:var(--font-jetbrains-mono)]">Weaponry</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill: string) => (
                    <Badge key={skill} variant="secondary" className="bg-zinc-800/50 text-zinc-400 border-zinc-700/50 text-[10px] font-normal font-[family-name:var(--font-jetbrains-mono)]">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-9 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight text-zinc-300 uppercase font-[family-name:var(--font-jetbrains-mono)]">
                {currentStatus === 'found' ? 'Intelligence Feed' : 
                 currentStatus === 'intel' ? 'Sniper Intelligence' :
                 currentStatus === 'saved' ? 'Saved Intelligence' : 'Mission Archive'}
              </h2>
              <div className="text-[10px] text-zinc-500 font-bold font-[family-name:var(--font-jetbrains-mono)] uppercase tracking-widest">
                Showing {foundIssues.length} results
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {foundIssues.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-zinc-800 rounded-lg bg-zinc-900/10">
                  <Activity className="w-10 h-10 text-zinc-800 mx-auto mb-4" />
                  <p className="text-zinc-500 text-sm font-[family-name:var(--font-jetbrains-mono)]">
                    &gt; No data in this sector. <br/>
                    {currentStatus === 'found' ? 'Initiate Scout or Sniper to begin.' : 'Secure some targets first.'}
                  </p>
                </div>
              ) : (
                foundIssues.map((issue: any) => (
                  <IssueCard key={issue.id} issue={issue} />
                ))
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
