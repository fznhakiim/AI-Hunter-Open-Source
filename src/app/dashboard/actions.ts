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

export async function updateHunterSkills(skills: string[]) {
  try {
    const serviceKey = (process.env.SUPABASE_SERVICE_KEY || "").trim();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const adminClient = createClient(supabaseUrl, serviceKey, {
      global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) }
    });

    const userClient = await createServerClient()
    const { data: { user } } = await userClient.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const userName = user.user_metadata?.full_name || user.user_metadata?.user_name || 'Hunter'
    const githubHandle = user.user_metadata?.user_name || user.user_metadata?.preferred_username || 'hunter_unknown'
    console.log(`[Action] Saving skills for ${user.id}:`, JSON.stringify(skills));

    // Check if profile exists
    const { data: existingProfile } = await adminClient
      .from('user_profile')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    let dbError = null;

    if (existingProfile) {
      console.log(`[Action] Profile exists. FORCE UPDATING skills...`);
      const { error } = await adminClient
        .from('user_profile')
        .update({ 
          name: userName,
          github_handle: githubHandle,
          skills: skills, // Force update this column
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select();
      dbError = error;
    } else {
      console.log(`[Action] Profile NOT found. INSERTING new profile...`);
      const { error } = await adminClient
        .from('user_profile')
        .insert({ 
          user_id: user.id, 
          name: userName,
          github_handle: githubHandle,
          skills: skills,
          updated_at: new Date().toISOString()
        })
        .select();
      dbError = error;
    }

    if (dbError) {
      console.error('[Supabase Error] updateHunterSkills failed:', dbError);
      return { success: false, message: dbError.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    console.error('[Action Error] updateHunterSkills crashed:', error);
    return { success: false, message: error.message }
  }
}