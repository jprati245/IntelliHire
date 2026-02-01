import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { questions, answers, jobRole, interviewType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Format Q&A pairs for evaluation
    const qaPairs = questions.map((q: any, i: number) => ({
      question: q.question,
      expectedTopics: q.expectedTopics,
      answer: answers[i] || "No answer provided"
    }));

    const systemPrompt = `You are an expert interview evaluator for ${jobRole} positions. Evaluate each answer objectively based on completeness, accuracy, communication clarity, and relevance. Score each answer from 0-100.`;

    const userPrompt = `Evaluate these ${interviewType} interview answers:\n\n${JSON.stringify(qaPairs, null, 2)}`;

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
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
