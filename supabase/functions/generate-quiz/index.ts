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

    const { category, topic, count = 5, difficulty } = await req.json();
    
    // Validate input
    if (!category || typeof category !== 'string' || category.length > 100) {
      return new Response(JSON.stringify({ error: "Invalid category" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const safeCount = Math.min(Math.max(1, Number(count) || 5), 20);
    const safeCategory = category.substring(0, 100);
    const safeTopic = topic ? String(topic).substring(0, 100) : '';
    const safeDifficulty = ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : '';

    const difficultyText = safeDifficulty ? ` at ${safeDifficulty} difficulty level` : '';
    const topicText = safeTopic ? ` focusing on ${safeTopic}` : '';
    
    const systemPrompt = `You are a quiz question generator for technical assessments. Generate exactly ${safeCount} multiple-choice questions about ${safeCategory}${topicText}${difficultyText}. Each question should have exactly 4 options with only one correct answer.`;

    const userPrompt = `Generate ${safeCount} MCQ questions for ${safeCategory}${topicText}${difficultyText}. Return valid JSON only.`;

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
              name: "generate_questions",
              description: "Generate multiple choice quiz questions",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string", description: "The question text" },
                        options: { 
                          type: "array", 
                          items: { type: "string" },
                          description: "Exactly 4 answer options"
                        },
                        correct_answer: { 
                          type: "integer", 
                          description: "Index of correct answer (0-3)" 
                        },
                        explanation: { 
                          type: "string", 
                          description: "Brief explanation of the correct answer" 
                        }
                      },
                      required: ["question", "options", "correct_answer", "explanation"]
                    }
                  }
                },
                required: ["questions"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_questions" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let questions = [];

    // Parse tool call response
    if (data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      const args = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
      questions = args.questions || [];
    } else if (data.choices?.[0]?.message?.content) {
      // Fallback: try to parse from content
      const content = data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        questions = parsed.questions || [];
      }
    }

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating quiz:", error);
    return new Response(JSON.stringify({ error: "An error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
