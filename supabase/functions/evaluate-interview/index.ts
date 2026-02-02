import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
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

    const { questions, answers, jobRole, interviewType } = await req.json();
    
    // Validate input
    if (!Array.isArray(questions) || questions.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid questions format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (!Array.isArray(answers)) {
      return new Response(JSON.stringify({ error: "Invalid answers format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (!jobRole || typeof jobRole !== 'string' || jobRole.length > 100) {
      return new Response(JSON.stringify({ error: "Invalid job role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const safeJobRole = jobRole.substring(0, 100);
    const safeInterviewType = ['hr', 'technical'].includes(interviewType) ? interviewType : 'general';

    // Format Q&A pairs for evaluation with sanitized data
    const qaPairs = questions.slice(0, 20).map((q: any, i: number) => ({
      question: String(q.question || '').substring(0, 500),
      expectedTopics: Array.isArray(q.expectedTopics) ? q.expectedTopics.slice(0, 10).map((t: any) => String(t).substring(0, 100)) : [],
      answer: String(answers[i] || "No answer provided").substring(0, 2000)
    }));

    const systemPrompt = `You are an expert interview evaluator for ${safeJobRole} positions. Evaluate each answer objectively based on completeness, accuracy, communication clarity, and relevance. Score each answer from 0-100.`;

    const userPrompt = `Evaluate these ${safeInterviewType} interview answers:\n\n${JSON.stringify(qaPairs, null, 2)}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "evaluate_answers",
              description: "Evaluate interview answers and provide scores",
              parameters: {
                type: "object",
                properties: {
                  evaluations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        score: { 
                          type: "integer", 
                          minimum: 0, 
                          maximum: 100,
                          description: "Score from 0-100" 
                        },
                        strengths: { 
                          type: "array", 
                          items: { type: "string" },
                          description: "What the candidate did well" 
                        },
                        improvements: { 
                          type: "array", 
                          items: { type: "string" },
                          description: "Areas for improvement" 
                        },
                        feedback: { 
                          type: "string", 
                          description: "Detailed feedback on the answer" 
                        }
                      },
                      required: ["score", "strengths", "improvements", "feedback"]
                    }
                  },
                  overallScore: {
                    type: "integer",
                    minimum: 0,
                    maximum: 100,
                    description: "Overall interview score"
                  },
                  overallFeedback: {
                    type: "string",
                    description: "Overall interview performance summary"
                  },
                  recommendation: {
                    type: "string",
                    enum: ["Strong Hire", "Hire", "Maybe", "No Hire"],
                    description: "Hiring recommendation"
                  }
                },
                required: ["evaluations", "overallScore", "overallFeedback", "recommendation"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "evaluate_answers" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let result = {
      evaluations: [],
      overallScore: 0,
      overallFeedback: "",
      recommendation: "Maybe"
    };

    if (data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      result = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
    } else if (data.choices?.[0]?.message?.content) {
      const content = data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error evaluating interview:", error);
    return new Response(JSON.stringify({ error: "An error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
