import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Define required skills for common tech roles
const roleSkillsMap: Record<string, string[]> = {
  "Frontend Developer": ["JavaScript", "TypeScript", "React", "HTML", "CSS", "Tailwind CSS", "Git", "REST APIs", "Responsive Design", "Testing", "Performance Optimization"],
  "Backend Developer": ["Node.js", "Python", "Java", "SQL", "REST APIs", "Database Design", "Authentication", "Caching", "Docker", "CI/CD", "Security"],
  "Full-Stack Developer": ["JavaScript", "TypeScript", "React", "Node.js", "SQL", "REST APIs", "Git", "Docker", "Testing", "Cloud Services", "Database Design"],
  "DevOps Engineer": ["Docker", "Kubernetes", "CI/CD", "AWS/GCP/Azure", "Linux", "Terraform", "Ansible", "Monitoring", "Scripting", "Networking", "Security"],
  "Data Scientist": ["Python", "Machine Learning", "Statistics", "SQL", "Pandas", "NumPy", "Data Visualization", "Deep Learning", "Feature Engineering", "A/B Testing"],
  "Data Analyst": ["SQL", "Python", "Excel", "Data Visualization", "Statistics", "Tableau/PowerBI", "ETL", "Data Cleaning", "Reporting", "Business Intelligence"],
  "ML Engineer": ["Python", "Machine Learning", "Deep Learning", "TensorFlow/PyTorch", "MLOps", "Docker", "Cloud ML Services", "Feature Engineering", "Model Deployment", "Data Pipelines"],
  "Mobile Developer": ["React Native", "iOS/Android", "JavaScript", "TypeScript", "REST APIs", "App Store Deployment", "Push Notifications", "Offline Storage", "Testing", "Performance"],
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

    const { targetRole, userSkills } = await req.json();
    
    // Validate input
    if (!targetRole || typeof targetRole !== 'string' || targetRole.length > 100) {
      return new Response(JSON.stringify({ error: "Invalid target role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (!Array.isArray(userSkills)) {
      return new Response(JSON.stringify({ error: "Invalid user skills format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Sanitize inputs
    const safeTargetRole = targetRole.substring(0, 100);
    const safeUserSkills = userSkills.slice(0, 50).map((s: any) => String(s).substring(0, 100));
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get required skills for the role (use predefined or generate via AI)
    let requiredSkills = roleSkillsMap[safeTargetRole];
    
    if (!requiredSkills) {
      // Generate required skills via AI for unknown roles
      const skillsResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a tech industry expert. List the top 10-12 most important skills for a given job role." },
            { role: "user", content: `List the essential skills for a ${safeTargetRole} position in 2024.` }
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "list_skills",
                description: "List required skills for a job role",
                parameters: {
                  type: "object",
                  properties: {
                    skills: {
                      type: "array",
                      items: { type: "string" },
                      description: "List of required skills"
                    }
                  },
                  required: ["skills"]
                }
              }
            }
          ],
          tool_choice: { type: "function", function: { name: "list_skills" } }
        }),
      });

      if (skillsResponse.ok) {
        const skillsData = await skillsResponse.json();
        if (skillsData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
          const args = JSON.parse(skillsData.choices[0].message.tool_calls[0].function.arguments);
          requiredSkills = args.skills || [];
        }
      }
      
      if (!requiredSkills || requiredSkills.length === 0) {
        requiredSkills = ["Technical Skills", "Communication", "Problem Solving", "Teamwork"];
      }
    }

    // Normalize skills for comparison
    const normalizedUserSkills = safeUserSkills.map((s: string) => s.toLowerCase().trim());
    const normalizedRequiredSkills = requiredSkills.map(s => s.toLowerCase().trim());

    // Find matching and missing skills
    const matchingSkills = requiredSkills.filter(skill => 
      normalizedUserSkills.some((us: string) => 
        us.includes(skill.toLowerCase()) || skill.toLowerCase().includes(us)
      )
    );
    
    const missingSkills = requiredSkills.filter(skill => 
      !normalizedUserSkills.some((us: string) => 
        us.includes(skill.toLowerCase()) || skill.toLowerCase().includes(us)
      )
    );

    const matchPercentage = Math.round((matchingSkills.length / requiredSkills.length) * 100);

    // Generate learning recommendations for missing skills
    const recommendationsResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a career coach specializing in tech careers. Provide actionable learning recommendations." },
          { role: "user", content: `For someone aiming to be a ${safeTargetRole}, suggest learning resources and priorities for these missing skills: ${missingSkills.join(", ")}` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_recommendations",
              description: "Provide learning recommendations for missing skills",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        skill: { type: "string" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        resources: { type: "array", items: { type: "string" } },
                        timeEstimate: { type: "string" }
                      },
                      required: ["skill", "priority", "resources", "timeEstimate"]
                    }
                  }
                },
                required: ["recommendations"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "provide_recommendations" } }
      }),
    });

    let recommendations: any[] = [];
    if (recommendationsResponse.ok) {
      const recData = await recommendationsResponse.json();
      if (recData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
        const args = JSON.parse(recData.choices[0].message.tool_calls[0].function.arguments);
        recommendations = args.recommendations || [];
      }
    }

    return new Response(JSON.stringify({
      targetRole: safeTargetRole,
      requiredSkills,
      userSkills: safeUserSkills,
      matchingSkills,
      missingSkills,
      matchPercentage,
      recommendations
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error analyzing skill gap:", error);
    return new Response(JSON.stringify({ error: "An error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
