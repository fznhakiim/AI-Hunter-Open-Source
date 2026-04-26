'use client'

import { useState, useTransition } from 'react'
import { Terminal, Loader2, Target } from 'lucide-react'
import { runScoutAction } from '@/app/dashboard/actions'
import { toast } from 'sonner'
import { TerminalOverlay } from './TerminalOverlay'
import { useRouter } from 'next/navigation'

export function ScoutButton() {
  const [isPending, startTransition] = useTransition()
  const [showOverlay, setShowOverlay] = useState(false)
  const router = useRouter()

  const handleScan = () => {
    setShowOverlay(true)
    startTransition(async () => {
      const result = await runScoutAction()
      setShowOverlay(false)
      
      if (result.success && result.count !== undefined) {
        if (result.count > 0) {
          toast.success(`Agent returned! Found ${result.count} high-value bounties.`)
          router.push('/dashboard?status=found')
        } else {
          toast.info("Scan complete. No new bounties matched your profile right now.")
        }
      } else {
        toast.error(`Scan failed: ${result.message || 'Unknown error'}`)
      }
    })
  }

  return (
    <>
      <TerminalOverlay isOpen={showOverlay} logs={[]} />
      <button 
        onClick={handleScan}
        disabled={isPending}
        className="w-full bg-lime-400 hover:bg-lime-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(163,230,53,0.4)] text-black h-12 px-8 transition-all duration-300 rounded-sm font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 font-[family-name:var(--font-jetbrains-mono)] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:-translate-y-0 disabled:hover:shadow-none"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 text-black animate-spin" />
        ) : (
          <Terminal className="w-4 h-4 text-black" />
        )}
        {isPending ? "Executing_Scan..." : "[Initialize Scout]"}
      </button>
    </>
  )
}
