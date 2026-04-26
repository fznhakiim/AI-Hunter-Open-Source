'use client'

import { useEffect, useState } from 'react'
import { Terminal, ShieldCheck, Activity, Cpu } from 'lucide-react'

interface TerminalOverlayProps {
  isOpen: boolean
  logs: string[]
}

export function TerminalOverlay({ isOpen }: TerminalOverlayProps) {
  const [fakeLogs, setFakeLogs] = useState<string[]>([])
  const [progress, setProgress] = useState(0)

  const steps = [
    "[SYS] INITIALIZING_SCOUT_PROTOCOL...",
    "[SYS] ESTABLISHING_ENCRYPTED_TUNNEL...",
    "[NET] ACCESSING_GITHUB_API_V3...",
    "[INTEL] FILTERING_OPEN_ISSUES_FOR_HUMAN_ELIGIBILITY...",
    "[AI] AWAKENING_GEMMA_BRAIN_MODULE...",
    "[AI] PERFORMING_DEEP_SEMANTIC_ANALYSIS...",
    "[DB] SYNCING_INTELLIGENCE_TO_MAIN_FRAME...",
    "[SYS] OPERATION_COMPLETE_REVALIDATING_CACHE..."
  ]

  useEffect(() => {
    if (isOpen) {
      setFakeLogs([])
      setProgress(0)
      let currentStep = 0
      
      const interval = setInterval(() => {
        if (currentStep < steps.length) {
          setFakeLogs(prev => [...prev, steps[currentStep]])
          setProgress(Math.min(((currentStep + 1) / steps.length) * 100, 95))
          currentStep++
        }
      }, 8000) // Pace it for roughly 60-80 seconds total

      return () => clearInterval(interval)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[#050505] border border-lime-400/30 rounded-lg shadow-[0_0_50px_rgba(163,230,53,0.1)] overflow-hidden">
        
        {/* Header */}
        <div className="bg-zinc-900/80 border-b border-zinc-800 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-lime-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-[family-name:var(--font-jetbrains-mono)]">Agent_Execution_Console</span>
          </div>
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-zinc-800"></div>
            <div className="w-2 h-2 rounded-full bg-zinc-800"></div>
            <div className="w-2 h-2 rounded-full bg-lime-400/50"></div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          
          {/* Main Status */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-lime-400/20 blur-xl rounded-full animate-pulse"></div>
              <div className="relative bg-zinc-900 p-4 rounded-full border border-lime-400/20">
                <Cpu className="w-8 h-8 text-lime-400 animate-spin-slow" />
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-zinc-100 font-[family-name:var(--font-jetbrains-mono)] tracking-tighter uppercase">Analyzing Targets</h2>
              <div className="flex items-center gap-2 text-xs text-lime-400/70 font-[family-name:var(--font-jetbrains-mono)]">
                <Activity className="w-3 h-3" />
                <span>Gemma_Brain_Processing...</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-[family-name:var(--font-jetbrains-mono)]">Deployment Progress</span>
              <span className="text-sm font-bold text-lime-400 font-[family-name:var(--font-jetbrains-mono)]">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              <div 
                className="h-full bg-lime-400 transition-all duration-500 shadow-[0_0_15px_rgba(163,230,53,0.5)]"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Terminal Logs */}
          <div className="bg-black/50 border border-zinc-800/50 rounded p-4 h-48 overflow-y-auto font-[family-name:var(--font-jetbrains-mono)] text-[11px] space-y-2">
            {fakeLogs.map((log, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-zinc-600">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                <span className={i === fakeLogs.length - 1 ? "text-lime-400 animate-pulse" : "text-zinc-400"}>
                  {log}
                </span>
              </div>
            ))}
            {fakeLogs.length < steps.length && (
              <div className="flex gap-3 items-center">
                <span className="text-zinc-600">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                <span className="w-1.5 h-3 bg-lime-400 animate-pulse"></span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-zinc-600 italic text-[10px] justify-center">
            <ShieldCheck className="w-3 h-3" />
            <span>Secure session active. Agent bypass RLS enabled.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
