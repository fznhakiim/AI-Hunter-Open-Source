'use client'

import { useFormStatus } from 'react-dom'
import { LogOut, Loader2 } from 'lucide-react'

export function ExitButton() {
  const { pending } = useFormStatus()

  return (
    <button 
      type="submit" 
      disabled={pending}
      className="text-xs font-[family-name:var(--font-jetbrains-mono)] text-zinc-400 hover:text-lime-400 flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait"
    >
      {pending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <LogOut className="w-3.5 h-3.5" />
      )}
      {pending ? "[EXITING...]" : "[EXIT]"}
    </button>
  )
}
