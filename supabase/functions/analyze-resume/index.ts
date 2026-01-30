import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create client with user's token for RLS
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { analysisId, extractedText } = await req.json();

    if (!analysisId || !extractedText) {
      return new Response(JSON.stringify({ error: "Missing analysisId or extractedText" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for updates
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Update status to processing
    await supabaseAdmin
      .from("resume_analyses")
      .update({ analysis_status: "processing" })
      .eq("id", analysisId)
      .eq("user_id", user.id);

    // Call Lovable AI for analysis
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a professional resume analyzer. Analyze the resume text and extract:
1. Technical skills (programming languages, frameworks, tools, technologies)
2. Education summary (degrees, institutions, years)
3. Experience summary (job titles, companies, years of experience)
4. Resume score (0-100) based on:
   - Clarity and formatting (20 points)
   - Relevant technical skills (30 points)
   - Education relevance (20 points)
   - Experience depth (30 points)

Respond ONLY with valid JSON in this exact format:
{
  "technical_skills": ["skill1", "skill2", ...],
  "education_summary": "Brief education summary",
  "experience_summary": "Brief experience summary",
  "resume_score": 75
}`,
          },
          {
            role: "user",
            content: `Analyze this resume:\n\n${extractedText.substring(0, 8000)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_resume",
              description: "Analyze resume and extract structured data",
              parameters: {
                type: "object",
                properties: {
                  technical_skills: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of technical skills found in the resume",
                  },
                  education_summary: {
                    type: "string",
                    description: "Summary of education background",
                  },
                  experience_summary: {
                    type: "string",
                    description: "Summary of work experience",
                  },
                  resume_score: {
                    type: "integer",
                    minimum: 0,
                    maximum: 100,
                    description: "Overall resume quality score",
                  },
                },
                required: ["technical_skills", "education_summary", "experience_summary", "resume_score"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_resume" } },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        await supabaseAdmin
          .from("resume_analyses")
          .update({ analysis_status: "failed" })
          .eq("id", analysisId);
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (aiResponse.status === 402) {
        await supabaseAdmin
          .from("resume_analyses")
          .update({ analysis_status: "failed" })
          .eq("id", analysisId);
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    
    let analysisResult;
    if (aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      analysisResult = JSON.parse(aiData.choices[0].message.tool_calls[0].function.arguments);
    } else {
      throw new Error("Invalid AI response format");
    }

    // Update the analysis record
    const { error: updateError } = await supabaseAdmin
      .from("resume_analyses")
      .update({
        extracted_text: extractedText,
        technical_skills: analysisResult.technical_skills || [],
        education_summary: analysisResult.education_summary || "",
        experience_summary: analysisResult.experience_summary || "",
        resume_score: Math.min(100, Math.max(0, analysisResult.resume_score || 0)),
        analysis_status: "completed",
      })
      .eq("id", analysisId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Update error:", updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          technical_skills: analysisResult.technical_skills,
          education_summary: analysisResult.education_summary,
          experience_summary: analysisResult.experience_summary,
          resume_score: analysisResult.resume_score,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
