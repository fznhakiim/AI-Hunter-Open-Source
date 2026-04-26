'use client'

import React, { useState, useTransition, useEffect } from 'react'
import { X, Plus, Save, Brain, Github } from 'lucide-react'
import { updateHunterSkills, syncGitHubSkills } from '@/app/dashboard/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function SkillsEditor({ initialSkills }: { initialSkills: string[] }) {
  const [skills, setSkills] = useState<string[]>(initialSkills || [])
  const [newSkill, setNewSkill] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Defensive: Update local state if props change (though key prop should handle this)
  useEffect(() => {
    if (initialSkills) setSkills(initialSkills)
  }, [initialSkills])

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove))
  }

  const handleAutoDetect = () => {
    startTransition(async () => {
      const result = await syncGitHubSkills()
      if (result.success && result.skills) {
        setSkills(result.skills)
        toast.success(`Found ${result.skills.length} skills from GitHub!`)
        router.refresh()
      } else {
        toast.error(`Auto-detect failed: ${result.message}`)
      }
    })
  }

  const handleSave = () => {
    startTransition(async () => {
      // Auto-add pending skill if user forgot to press Enter or '+'
      let skillsToSave = [...skills];
      if (newSkill.trim() && !skills.includes(newSkill.trim())) {
        skillsToSave.push(newSkill.trim());
        setSkills(skillsToSave);
        setNewSkill('');
      }

      const result = await updateHunterSkills(skillsToSave)
      if (result.success) {
        toast.success("Hunter profile updated successfully")
        router.refresh()
      } else {
        toast.error(`Update failed: ${result.message}`)
      }
    })
  }

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-lime-400" />
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-[family-name:var(--font-jetbrains-mono)]">
            Hunter_Skillset
          </h3>
        </div>
        <button
          onClick={handleAutoDetect}
          disabled={isPending}
          className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-lime-400 transition-colors uppercase tracking-wider font-bold cursor-pointer disabled:opacity-50"
          title="Auto-detect from GitHub public repos"
        >
          <Github className="w-3 h-3" />
          <span>Auto-Detect</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {skills.map(skill => (
          <span 
            key={skill} 
            className="flex items-center gap-1 px-2 py-1 bg-zinc-800 border border-zinc-700 text-[10px] font-bold text-lime-400 rounded group transition-all hover:border-lime-400/50 cursor-default"
          >
            {skill}
            <button 
              onClick={() => removeSkill(skill)}
              className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-white cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          placeholder="New Skill..."
          onKeyDown={(e) => e.key === 'Enter' && addSkill()}
          className="flex-1 bg-black border border-zinc-800 px-3 py-2 text-[10px] font-bold uppercase tracking-wider focus:border-lime-400 outline-none transition-all placeholder:text-zinc-700"
        />
        <button 
          onClick={addSkill}
          className="p-2 bg-zinc-800 border border-zinc-700 hover:border-lime-400 hover:text-lime-400 transition-all rounded cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={handleSave}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 py-2 bg-lime-400 text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-lime-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 cursor-pointer"
      >
        {isPending ? 'Syncing...' : (
          <>
            <Save className="w-3 h-3" />
            Sync Skills
          </>
        )}
      </button>
    </div>
  )
}
