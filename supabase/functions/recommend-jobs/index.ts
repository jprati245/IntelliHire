import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { skills, resumeScore, quizScore, interviewScore, preferences } = await req.json();
    
    // Validate and sanitize input
    const safeSkills = Array.isArray(skills) 
      ? skills.slice(0, 50).map((s: any) => String(s).substring(0, 100))
      : [];
    const safeResumeScore = Math.min(Math.max(0, Number(resumeScore) || 0), 100);
    const safeQuizScore = Math.min(Math.max(0, Number(quizScore) || 0), 100);
    const safeInterviewScore = Math.min(Math.max(0, Number(interviewScore) || 0), 100);
    const safePreferences = typeof preferences === 'string' ? preferences.substring(0, 500) : "Open to all tech roles";
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `Based on the following candidate profile, recommend the 6 most suitable job roles with relevance scores.

**Candidate Profile:**
- Technical Skills: ${safeSkills.join(", ") || "Not specified"}
- Resume Score: ${safeResumeScore}/100
- Quiz Score: ${safeQuizScore}/100
- Interview Score: ${safeInterviewScore}/100
- Preferences: ${safePreferences}

**Requirements:**
1. Analyze the skill set and scores to determine best-fit roles
2. Consider both current capabilities and growth potential
3. Include a mix of roles (some matching current level, some aspirational)
4. Provide actionable next steps for each role

Return a JSON object with this exact structure:
{
  "recommendations": [
    {
      "role": "Job Title",
      "company_types": ["Startup", "Enterprise", etc.],
      "relevance_score": 85,
      "salary_range": "$X - $Y",
      "match_reasons": ["Reason 1", "Reason 2"],
      "skill_gaps": ["Skill to learn 1", "Skill to learn 2"],
      "next_steps": ["Action 1", "Action 2"]
    }
  ],
  "overall_assessment": "Brief assessment of candidate's job readiness",
  "top_strengths": ["Strength 1", "Strength 2", "Strength 3"]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { 
            role: "system", 
            content: "You are an expert career counselor and job matching specialist. Always respond with valid JSON only, no markdown formatting." 
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to get job recommendations");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response format");
    }
    
    const recommendations = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(recommendations), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Job recommendation error:", error);
    return new Response(JSON.stringify({ 
      error: "An error occurred",
      recommendations: []
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
