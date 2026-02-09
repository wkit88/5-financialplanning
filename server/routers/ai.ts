import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM, type Message } from "../_core/llm";

const SYSTEM_PROMPT = `You are PropertyLab AI — a professional, friendly property investment financial planner.

You have access to the user's simulation data. When the user runs a calculation, you receive their full simulation context including:
- All input parameters (purchase price, loan type, appreciation rate, rental yield, interest rate, expenses, etc.)
- Key results (10-year, 20-year, 30-year net equity, total asset value, loan balance, cumulative cash flow)
- Year-by-year breakdown data

Your role:
1. **Analyze** their property investment plan — identify strengths, risks, and opportunities
2. **Advise** on optimizations — suggest changes to inputs that could improve outcomes
3. **Educate** — explain concepts like leverage, compounding, cash flow management, and risk
4. **Compare** — when asked, help them think through different scenarios
5. **Be honest** — flag unrealistic assumptions (e.g., 20% appreciation is very aggressive)

Guidelines:
- Use RM (Malaysian Ringgit) for all currency references
- Format large numbers with commas (e.g., RM 1,234,567)
- Be concise but thorough — use bullet points and bold text for key insights
- When giving the initial analysis, structure it as:
  • **Portfolio Overview** (quick summary of their plan)
  • **Key Strengths** (what's working well)
  • **Risk Factors** (what to watch out for)
  • **Recommendations** (specific, actionable suggestions)
- For follow-up questions, be conversational and direct
- Never give absolute financial advice — always frame as "based on this simulation" and remind them to consult a licensed financial advisor for actual investment decisions
- Keep responses focused and practical — this is a tool for Malaysian property investors

IMPORTANT: At the end of EVERY response, you MUST include a section with exactly 3 follow-up suggestions the user might want to ask next. Format them as a JSON block at the very end of your response, after all your analysis text, like this:

\`\`\`suggestions
["What if I change to 90% loan instead?", "How can I improve my cash flow?", "What's the risk if interest rates rise to 6%?"]
\`\`\`

The suggestions should be:
- Contextually relevant to what was just discussed
- Actionable and specific to their simulation
- Varied (mix of "what if", risk analysis, and optimization questions)
- Short (under 50 characters each ideally)`;

const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

function parseSuggestions(content: string): { text: string; suggestions: string[] } {
  const suggestionsMatch = content.match(/```suggestions\s*\n?\s*(\[[\s\S]*?\])\s*\n?\s*```/);
  if (suggestionsMatch) {
    try {
      const suggestions = JSON.parse(suggestionsMatch[1]);
      const text = content.replace(/```suggestions[\s\S]*?```/, "").trim();
      return { text, suggestions };
    } catch {
      return { text: content, suggestions: [] };
    }
  }
  return { text: content, suggestions: [] };
}

export const aiRouter = router({
  chat: publicProcedure
    .input(
      z.object({
        messages: z.array(messageSchema),
      })
    )
    .mutation(async ({ input }) => {
      const llmMessages: Message[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...input.messages
          .filter((m) => m.role !== "system")
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
      ];

      const result = await invokeLLM({
        messages: llmMessages,
      });

      const rawContent = result.choices?.[0]?.message?.content;
      if (!rawContent || typeof rawContent !== "string") {
        throw new Error("No response from AI");
      }

      const { text, suggestions } = parseSuggestions(rawContent);

      return { content: text, suggestions };
    }),
});
