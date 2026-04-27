import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const MIJEDU_KNOWLEDGE = `
## Mijedu Knowledge Base

**What is Mijedu?**
Mijedu is a student-focused social platform that empowers students to connect, learn, and create businesses within their campus communities.

**What does Mijedu mean?**
Mijedu is derived from local language roots meaning "community" and "education" — reflecting its mission to blend social connection with learning.

**Founder:** Kenneth M. Saukila
**Contact:** mijeduhelp@gmail.com

**Mission & Goal:**
Empower students to connect, learn, and create businesses. Mijedu provides a community marketplace called "Bwalo" where students can list and sell products, join tribes (campus groups), earn points, and engage with peers.

**MVP Features:**
- **Tribes**: Campus-based groups (colleges, departments). Students join a tribe during signup. Tribes have their own feeds and leaderboards.
- **Posts & Reactions**: Students create posts (text, images, videos). Others can react with a "vibe" (heart) button. Posts with 10+ reactions can spawn discussion rooms.
- **Bwalo (Marketplace)**: Students can request a shop (approved by super admin), then list products. Brands can also list products directly.
- **Student Shops**: Students submit a shop request → super admin approves → shop office is created → products listed in Bwalo.
- **Rooms**: Discussion rooms created from popular posts. Messages have delivery ticks. Rooms expire after 24 hours of inactivity.
- **Points & Leaderboard**: Students earn points for engagement (posting, reacting, commenting). Individual and tribe leaderboards track rankings.
- **Roles**: user (student), tribe_admin (manages a tribe), super_admin (platform admin), vip_brand (brand partner).
- **Notifications**: Users receive notifications for reactions, comments, shop approvals, and other events.
- **AI Assistant**: Mijedu AI helps answer questions about the platform, tribes, and features. Limited to 3 queries per session.
- **Verification**: Students can verify their identity by uploading a student ID.
- **Stories**: 24-hour expiring visual stories similar to social media stories.

**Data Safety:**
Mijedu uses industry-standard security practices including row-level security, encrypted connections, and authentication tokens. Your data is protected and only accessible to you and authorized administrators.

**What Mijedu AI can help with:**
- Questions about Mijedu features, tribes, roles, points, marketplace
- How to use the platform
- Information about the founder and mission
- General guidance about the MVP
- When a course document is provided, help students understand their course material

**What Mijedu AI cannot help with:**
- Features not yet in the MVP (respond: "This feature is not yet available in the current MVP.")
- Non-Mijedu topics (respond: "I can only help with questions about Mijedu. For other topics, please use a general AI assistant.")
`;

const SYSTEM_PROMPT = `You are Mijedu AI, the official assistant for the Mijedu student platform. You are helpful, concise, and friendly.

${MIJEDU_KNOWLEDGE}

**Rules:**
1. Only answer questions about Mijedu's mission, goal, founder, contact, tribes, roles, and MVP features.
2. If asked about a feature not in the MVP, respond: "This feature is not yet available in the current MVP. Stay tuned for updates!"
3. If asked about non-Mijedu topics, politely redirect: "I'm Mijedu AI — I can help with questions about the Mijedu platform. For other topics, try a general assistant."
4. Keep answers concise (2-4 sentences max unless detail is needed).
5. Reference the founder (Kenneth M. Saukila) and contact (mijeduhelp@gmail.com) when relevant.
6. Be encouraging and supportive of student entrepreneurship.
7. When in tutor mode with course documents, help students understand their course material based on the provided document context.
`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ─── Auth check ──────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { query, courseId, history } = await req.json();

    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemPrompt = SYSTEM_PROMPT;

    if (courseId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const sb = createClient(supabaseUrl, serviceKey);

        const { data: docs } = await sb
          .from("course_documents")
          .select("title, file_url, course_name")
          .eq("id", courseId);

        if (docs && docs.length > 0) {
          const docContext = docs.map(d => `- Document: "${d.title}" (Course: ${d.course_name || 'Unknown'})`).join("\n");
          systemPrompt += `\n\n**Student's Course Documents:**\n${docContext}\n\nHelp the student understand their course material based on these documents. You are now in tutor mode.`;
        }
      } catch (e) {
        console.error("Failed to fetch course docs:", e);
      }
    }

    const messages: { role: string; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    if (Array.isArray(history)) {
      for (const msg of history.slice(-6)) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    messages.push({ role: "user", content: query });

    const response = await fetch("https://ai.gateway.lovable.dev/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        stream: true,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit reached. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI service quota exceeded. Contact mijeduhelp@gmail.com for support." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI API error:", errText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    console.error("Edge function error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
