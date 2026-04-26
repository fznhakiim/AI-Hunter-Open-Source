'use client'

import React, { useTransition, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Code2, ExternalLink, Activity, Bookmark, CheckCircle2, RotateCcw } from 'lucide-react'
import { updateIssueStatus } from '@/app/dashboard/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

interface IssueCardProps {
  issue: any
}

export function IssueCard({ issue }: IssueCardProps) {
  const [isPending, startTransition] = useTransition()
  const [isVisible, setIsVisible] = React.useState(true)
  const router = useRouter()

  if (!isVisible) return null;

  const handleStatusUpdate = (status: 'saved' | 'solved' | 'found') => {
    // Optimistic hide: Hide immediately for instant feel
    setIsVisible(false)
    
    startTransition(async () => {
      const result = await updateIssueStatus(issue.id, status)
      if (result.success) {
        toast.success(`Mission status updated: ${status.toUpperCase()}`)
        router.refresh()
      } else {
        setIsVisible(true) // Show back if failed
        toast.error(`Update failed: ${result.message}`)
      }
    })
  }

  return (
    <div className={`bg-black border border-zinc-800 hover:border-lime-400/40 hover:shadow-[0_0_20px_rgba(163,230,53,0.05)] transition-all duration-300 group rounded-lg overflow-hidden relative ${isPending ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
      
      {/* Indicator Bar */}
      <div className={`absolute top-0 left-0 w-1 h-full transition-all duration-300 ${
        issue.status === 'saved' ? 'bg-amber-400' : 
        issue.status === 'solved' ? 'bg-blue-400' : 'bg-lime-400 opacity-0 group-hover:opacity-100'
      }`}></div>
      
      <div className="p-6 pl-8">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-3 w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-zinc-900 text-lime-400 border border-lime-400/20 rounded-sm font-[family-name:var(--font-jetbrains-mono)] text-[10px] tracking-wider uppercase inline-flex">
                  {issue.language || 'Code'}
                </Badge>
                {issue.status !== 'found' && (
                  <Badge className={`rounded-sm font-[family-name:var(--font-jetbrains-mono)] text-[10px] tracking-wider uppercase inline-flex ${
                    issue.status === 'saved' ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' : 'bg-blue-400/10 text-blue-400 border-blue-400/20'
                  }`}>
                    {issue.status}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-[family-name:var(--font-jetbrains-mono)]">Match</span>
                <span className={`text-lg font-bold font-[family-name:var(--font-jetbrains-mono)] ${issue.match_score >= 80 ? 'text-lime-400' : 'text-zinc-300'}`}>
                  {issue.match_score}%
                </span>
              </div>
            </div>
            
            <h3 className="text-lg font-bold leading-snug text-zinc-100 group-hover:text-lime-400 transition-colors">
              {issue.title}
            </h3>
            
            <div className="text-zinc-500 flex items-center gap-2 text-sm font-[family-name:var(--font-jetbrains-mono)]">
              <Code2 className="w-4 h-4" /> {issue.repo_name}
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-zinc-900/40 border-t border-zinc-800 p-6">
        <div className="flex items-start gap-3">
          <Activity className="w-4 h-4 text-lime-400 mt-0.5 shrink-0" />
          <div className="space-y-4 w-full">
            <div className="font-[family-name:var(--font-jetbrains-mono)] text-[11px] leading-relaxed text-zinc-400">
              <span className="text-zinc-500 font-bold mb-3 block border-b border-zinc-800 pb-2">&gt; AI_SOLUTION_DRAFT:</span>
              <div className="markdown-container">
                <ReactMarkdown>
                  {issue.ai_draft_solution}
                </ReactMarkdown>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {issue.status !== 'saved' && issue.status !== 'solved' && (
                  <button 
                    onClick={() => handleStatusUpdate('saved')}
                    className="p-2 text-zinc-500 hover:text-amber-400 transition-colors cursor-pointer"
                    title="Save for later"
                  >
                    <Bookmark className="w-5 h-5" />
                  </button>
                )}
                {issue.status !== 'solved' && (
                  <button 
                    onClick={() => handleStatusUpdate('solved')}
                    className="p-2 text-zinc-500 hover:text-blue-400 transition-colors cursor-pointer"
                    title="Mark as solved"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                )}
                {issue.status !== 'found' && (
                  <button 
                    onClick={() => handleStatusUpdate('found')}
                    className="p-2 text-zinc-500 hover:text-zinc-100 transition-colors cursor-pointer"
                    title="Move back to feed"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                )}
              </div>

              <a 
                href={issue.issue_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-black bg-lime-400 hover:bg-lime-300 px-4 py-2 rounded-sm transition-all font-[family-name:var(--font-jetbrains-mono)]"
              >
                Engage Target <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
