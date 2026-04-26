'use client'

import { useState, useTransition } from 'react'
import { Target, Loader2 } from 'lucide-react'
import { runScoutAction } from '@/app/dashboard/actions'
import { toast } from 'sonner'
import { TerminalOverlay } from './TerminalOverlay'
import { useRouter } from 'next/navigation'

export function SniperInput() {
  const [repoUrl, setRepoUrl] = useState('')
  const [isPending, startTransition] = useTransition()
  const [showOverlay, setShowOverlay] = useState(false)
  const router = useRouter()

  const handleSniperScan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!repoUrl) return

    setShowOverlay(true)
    startTransition(async () => {
      const result = await runScoutAction(repoUrl)
      setShowOverlay(false)
      
      if (result.success) {
        toast.success(result.message)
        setRepoUrl('')
        router.push('/dashboard?status=found')
      } else {
        toast.error(`Sniper failed: ${result.message}`)
      }
    })
  }

  return (
    <>
      <TerminalOverlay isOpen={showOverlay} logs={[]} />
      <form onSubmit={handleSniperScan} className="flex gap-2">
        <div className="relative flex-1">
          <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="Enter repo URL (e.g. facebook/react)"
            className="w-full bg-black border border-zinc-800 focus:border-lime-400/50 outline-none h-11 pl-10 pr-4 text-sm font-[family-name:var(--font-jetbrains-mono)] rounded-sm transition-all"
            disabled={isPending}
          />
        </div>
        <button 
          type="submit"
          disabled={isPending || !repoUrl}
          className="bg-zinc-800 hover:bg-zinc-700 text-lime-400 border border-zinc-700 h-11 px-6 rounded-sm transition-all text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deploy Sniper"}
        </button>
      </form>
    </>
  )
}
