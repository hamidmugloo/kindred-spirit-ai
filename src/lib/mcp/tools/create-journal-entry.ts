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
  name: "create_journal_entry",
  title: "Create journal entry",
  description: "Create a new journal entry for the signed-in user.",
  inputSchema: {
    content: z.string().min(1),
    title: z.string().optional(),
    prompt: z.string().optional(),
    mood_tag: z.string().optional(),
  },
  annotations: { readOnlyHint: false, openWorldHint: false },
  handler: async ({ content, title, prompt, mood_tag }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await client(ctx)
      .from("journal_entries")
      .insert({ user_id: ctx.getUserId(), content, title, prompt, mood_tag })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: "Journal entry created." }], structuredContent: { entry: data } };
  },
});
