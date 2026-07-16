import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function client(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "log_mood",
  title: "Log mood",
  description: "Log a mood entry for the signed-in user.",
  inputSchema: {
    mood: z.string().min(1).describe("Short mood label (e.g. happy, anxious)."),
    mood_score: z.number().int().min(1).max(10).describe("1-10 score."),
    note: z.string().optional(),
  },
  annotations: { readOnlyHint: false, openWorldHint: false },
  handler: async ({ mood, mood_score, note }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await client(ctx)
      .from("mood_entries")
      .insert({ user_id: ctx.getUserId(), mood, mood_score, note })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: "Mood logged." }], structuredContent: { entry: data } };
  },
});
