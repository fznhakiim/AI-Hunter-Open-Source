import { StateGraph, Annotation, END, START } from "@langchain/langgraph";
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Force load .env.local from the current working directory and OVERRIDE any existing env vars
// This is critical because Next.js sometimes infers the wrong workspace root
dotenv.config({ 
  path: path.resolve(process.cwd(), '.env.local'),
  override: true 
});

// Define the State for our Agent
export const ScoutState = Annotation.Root({
  userId: Annotation<string>(),
  skills: Annotation<string[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  targetRepo: Annotation<string>({ reducer: (x, y) => y ?? x, default: () => "" }),
  githubQuery: Annotation<string>({ reducer: (x, y) => y ?? x, default: () => "" }),
  rawIssues: Annotation<any[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  evaluatedIssues: Annotation<any[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  logs: Annotation<string[]>({ reducer: (x, y) => x.concat(y), default: () => [] }),
});

// Step 1: Fetch Profile & Skills
async function fetchUserProfile(state: typeof ScoutState.State) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data } = await supabase
    .from('user_profile')
    .select('skills')
    .eq('user_id', state.userId)
    .single();
  
  let skills = data?.skills || [];
  if (!skills || skills.length === 0) {
    skills = ["TypeScript", "Next.js", "React", "PostgreSQL"];
  }

  return { skills, logs: ["Fetched user skills successfully."] };
}

// Step 2: Search GitHub
async function searchGithubIssues(state: typeof ScoutState.State) {
  const token = process.env.GITHUB_TOKEN;
  let query = "";
  
  if (state.targetRepo) {
    // Sniper Mode: Search in a specific repo
    const repo = state.targetRepo
      .replace(/https?:\/\/github\.com\//, "")
      .replace(/\.git$/, "")
      .replace(/\/$/, "")
      .trim();
    // Loosen constraints for Sniper mode: show ANY open issues
    query = `is:issue repo:${repo} state:open`;
    console.log(`[Node] searchGithubIssues: Sniper Mode targeting ${repo}`);
  } else {
    // Scout Mode: Search by skills
    const primarySkill = state.skills[0]?.toLowerCase() || "typescript";
    query = `is:issue language:${primarySkill} state:open label:"help wanted"`;
    console.log(`[Node] searchGithubIssues: Scout Mode for ${primarySkill}`);
  }
  
  const res = await fetch(`https://api.github.com/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=5`, {
    headers: {
      'Authorization': token ? `token ${token}` : '',
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'AI-Open-Source-Hunter'
    }
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    console.error(`[GitHub Error] HTTP ${res.status}:`, errData);
    throw new Error("Targeting system failure: Could not reach GitHub mission control.");
  }

  const data = await res.json();
  const rawIssues = data.items || [];
  
  if (rawIssues.length === 0 && state.targetRepo) {
    console.log(`[Node] searchGithubIssues: No issues found. Falling back to Repo Analysis for ${state.targetRepo}`);
    const repoPath = state.targetRepo
      .replace(/https?:\/\/github\.com\//, "")
      .replace(/\.git$/, "")
      .replace(/\/$/, "");
    
    // Fetch Repo Metadata + README
    const [repoRes, readmeRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${repoPath}`, { headers: { "Authorization": `Bearer ${token}`, "User-Agent": "AI-Open-Source-Hunter" } }),
      fetch(`https://api.github.com/repos/${repoPath}/readme`, { headers: { "Authorization": `Bearer ${token}`, "Accept": "application/vnd.github.v3.raw", "User-Agent": "AI-Open-Source-Hunter" } })
    ]);

    if (repoRes.ok) {
      const repoData = await repoRes.json();
      const readme = readmeRes.ok ? await readmeRes.text() : "No README available.";
      
      // Create a dummy issue that represents the Repo Analysis
      const analysisIssue = {
        html_url: repoData.html_url,
        title: `[ANALYSIS] ${repoData.full_name}`,
        body: `Analyze this repository. Tech Stack: ${repoData.language || "Unknown"}. Description: ${repoData.description || "None"}. README:\n${readme.substring(0, 2000)}`,
        repository_url: repoData.url,
        is_repo_analysis: true
      };
      
      return { rawIssues: [analysisIssue], githubQuery: "REPO_ANALYSIS", logs: [`No issues found. Performed Repo Analysis instead.`] };
    }
  }

  if (rawIssues.length === 0) {
    throw new Error(`No open issues found on GitHub for query: ${query}`);
  }
  
  return { rawIssues, githubQuery: query, logs: [`Found ${rawIssues.length} issues from GitHub.`] };
}

// Step 3: Evaluate with Manual Fetch (Proven stable for this key)
async function evaluateIssues(state: typeof ScoutState.State) {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("System configuration error: AI Brain not connected.");
  }

  const evaluatedIssues = [];

  for (const issue of state.rawIssues) {
    let repoName = "unknown/repo";
    if (issue.repository_url) {
      repoName = issue.repository_url.split('/').slice(-2).join('/');
    }

    const isAnalysis = issue.title.startsWith("[ANALYSIS]");
    const prompt = isAnalysis ? `
      You are an expert software architect. Perform a DEEP ANALYSIS of this GitHub repository.
      
      Repo: ${repoName}
      Context: ${issue.body}
      
      Return ONLY a JSON object with: 
      match_score: 100, 
      language: "REPO_INTEL", 
      ai_draft_solution: "TECHNICAL STACK:\\n• [Stack 1]\\n• [Stack 2]\\n\\nPROS & STRENGTHS:\\n• [Point 1]\\n• [Point 2]\\n\\nCONS & WEAKNESSES:\\n• [Point 1]\\n• [Point 2]\\n\\nFINAL VERDICT:\\n[One sentence summary]"
    ` : `
      Evaluate this GitHub issue for a developer with skills: ${state.skills.join(', ')}.
      
      Title: ${issue.title}
      Repo: ${repoName}
      Body: ${issue.body?.substring(0, 800) || ''}
      
      Return ONLY a JSON object with: 
      match_score (0-100), 
      language, 
      ai_draft_solution (Use bullet points for the solution steps and ensure clear section headers like 'PROPOSED PLAN:' and 'KEY CONSIDERATIONS:').
    `;

    // Add a small delay between issues to respect Free Tier Rate Limits (RPM)
    if (evaluatedIssues.length > 0) {
      await new Promise(r => setTimeout(r, 1500));
    }

    let attempts = 0;
    const maxAttempts = 3;
    let success = false;

    while (attempts < maxAttempts && !success) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        if (response.ok) {
          const result = await response.json();
          const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (text) {
            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanedText);
            evaluatedIssues.push({
              issue_url: issue.html_url,
              title: issue.title,
              repo_name: repoName.substring(0, 50),
              match_score: parsed.match_score || 0,
              ai_draft_solution: parsed.ai_draft_solution || "No draft available.",
              language: (parsed.language || "Unknown").substring(0, 50),
              status: 'open'
            });
            success = true;
          }
        } else if (response.status === 503 || response.status === 429) {
          attempts++;
          const waitTime = Math.pow(2, attempts) * 1000;
          console.warn(`[Gemini] Busy (${response.status}). Retrying in ${waitTime}ms... (Attempt ${attempts}/${maxAttempts})`);
          await new Promise(r => setTimeout(r, waitTime));
        } else {
          const errText = await response.text();
          console.error(`[Gemini Error] HTTP ${response.status}:`, errText);
          break; // Stop for other errors
        }
      } catch (e: any) {
        console.error("Gemini Fetch Error:", e.message);
        break;
      }
    }
  }

  return { evaluatedIssues, logs: [`Evaluated ${evaluatedIssues.length} issues.`] };
}

// Step 4: Store
async function storeIssues(state: typeof ScoutState.State) {
  if (state.evaluatedIssues.length === 0) return {};
  
  const serviceKey = (process.env.SUPABASE_SERVICE_KEY || "").trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabase = createClient(supabaseUrl, serviceKey);

  console.log(`[Node] storeIssues: Saving ${state.evaluatedIssues.length} issues for user ${state.userId}`);
  
  // 1. Fetch existing issues to protect statuses (saved/solved)
  const { data: existing } = await supabase
    .from('found_issues')
    .select('issue_url, status')
    .in('issue_url', state.evaluatedIssues.map(i => i.issue_url))
    .eq('user_id', state.userId);

  const statusMap = new Map(existing?.map(i => [i.issue_url, i.status]) || []);

  const { error } = await supabase.from('found_issues').upsert(
    state.evaluatedIssues.map(issue => {
      const currentStatus = statusMap.get(issue.issue_url);
      return { 
        issue_url: issue.issue_url,
        title: issue.title,
        repo_name: issue.repo_name,
        match_score: issue.match_score,
        ai_draft_solution: issue.ai_draft_solution,
        language: issue.language,
        user_id: state.userId,
        // PROTECT STATUS: If it was saved or solved, KEEP IT!
        status: (currentStatus === 'saved' || currentStatus === 'solved') ? currentStatus : 'found'
      };
    }),
    { onConflict: 'issue_url' }
  );

  if (error) {
    console.error("[CRITICAL] Supabase Store Error:", error);
    throw new Error(`Database Error: ${error.message}`);
  }
  return { logs: ["Stored issues successfully."] };
}

const workflow = new StateGraph(ScoutState)
  .addNode("fetchUserProfile", fetchUserProfile)
  .addNode("searchGithubIssues", searchGithubIssues)
  .addNode("evaluateIssues", evaluateIssues)
  .addNode("storeIssues", storeIssues)
  .addEdge(START, "fetchUserProfile")
  .addEdge("fetchUserProfile", "searchGithubIssues")
  .addEdge("searchGithubIssues", "evaluateIssues")
  .addEdge("evaluateIssues", "storeIssues")
  .addEdge("storeIssues", END);

export const scoutAgent = workflow.compile();
