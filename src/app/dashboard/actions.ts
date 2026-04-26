'use server'

import { scoutAgent } from '@/lib/agent/scout'
import { revalidatePath } from 'next/cache'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function runScoutAction(targetRepo?: string) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("Unauthorized")
    }

    console.log("Triggering Agent for User:", user.id, targetRepo ? `(Sniper Mode: ${targetRepo})` : "(Scout Mode)")
    
    // Invoke the agent
    const result = await scoutAgent.invoke({ 
      userId: user.id,
      targetRepo: targetRepo || ""
    })
    
    // Revalidate the dashboard
    revalidatePath('/dashboard')

    return { 
      success: true, 
      count: result.evaluatedIssues?.length || 0,
      logs: result.logs || [],
      message: targetRepo 
        ? `Sniper analysis complete. Found ${result.evaluatedIssues?.length || 0} issues in ${targetRepo}.`
        : `Scout scan complete. Found ${result.evaluatedIssues?.length || 0} matches for your profile.`
    }
  } catch (error: any) {
    console.error("Scout Action Error:", error)
    return { success: false, message: error.message || "Failed to execute scout." }
  }
}

export async function updateIssueStatus(issueId: string, status: 'saved' | 'solved' | 'found') {
  try {
    // Use Service Role to bypass RLS for reliability, but still filter by user_id
    const serviceKey = (process.env.SUPABASE_SERVICE_KEY || "").trim();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabase = createClient(supabaseUrl, serviceKey);
    
    // Get current user to verify ownership
    const userClient = await createServerClient()
    const { data: { user } } = await userClient.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    console.log(`[Action] updateIssueStatus: Bypassing RLS for user ${user.id} on issue ${issueId}`);

    const { data, error } = await supabase
      .from('found_issues')
      .update({ status })
      .eq('id', issueId)
      .eq('user_id', user.id) // Ensure ownership
      .select()

    if (error) {
      console.error("[Supabase Error] updateIssueStatus failed:", error);
      return { success: false, message: error.message }
    }

    console.log(`[Action] updateIssueStatus success. Rows updated: ${data?.length || 0}`);
    
    revalidatePath('/dashboard', 'layout')
    return { success: true }
  } catch (error: any) {
    console.error("[Action Error] updateIssueStatus crashed:", error);
    return { success: false, message: error.message }
  }
}
