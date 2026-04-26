import { Target, Zap } from 'lucide-react'

export function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Outer target ring */}
      <div className="absolute inset-0 border-2 border-lime-400/30 rounded-full animate-pulse"></div>
      
      {/* Rotating segments */}
      <div className="absolute inset-[-4px] border-t-2 border-r-2 border-lime-400 rounded-full animate-[spin_3s_linear_infinite]"></div>
      
      {/* Center Icon */}
      <div className="relative bg-zinc-900 border border-zinc-700 p-2 rounded-lg shadow-[0_0_15px_rgba(163,230,35,0.2)]">
        <Target className="w-full h-full text-lime-400" />
        <Zap className="absolute -top-1 -right-1 w-3 h-3 text-lime-400 fill-lime-400 animate-bounce" />
      </div>
    </div>
  )
}
