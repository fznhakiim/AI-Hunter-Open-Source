'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'

export function LoginButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()

  return (
    <button 
      type="submit" 
      disabled={pending}
      className="w-full bg-lime-400 text-black hover:bg-lime-300 h-12 text-sm font-bold uppercase tracking-widest transition-colors rounded-none font-[family-name:var(--font-jetbrains-mono)] flex items-center justify-center cursor-pointer disabled:opacity-70 disabled:cursor-wait"
    >
      {pending ? (
        <>
          <Loader2 className="mr-3 h-5 w-5 animate-spin" />
          [ Authenticating... ]
        </>
      ) : (
        children
      )}
    </button>
  )
}
