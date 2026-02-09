import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the LLM module
const mockInvokeLLM = vi.fn();
vi.mock("./_core/llm", () => ({
  invokeLLM: (...args: any[]) => mockInvokeLLM(...args),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

function makeLLMResponse(content: string) {
  return {
    id: "test-id",
    created: Date.now(),
    model: "gemini-2.5-flash",
    choices: [
      {
        index: 0,
        message: { role: "assistant", content },
        finish_reason: "stop",
      },
    ],
    usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
  };
}

describe("ai.chat", () => {
  beforeEach(() => {
    mockInvokeLLM.mockReset();
  });

  it("returns AI response content for valid messages", async () => {
    mockInvokeLLM.mockResolvedValueOnce(
      makeLLMResponse("Based on your simulation, your portfolio shows strong growth potential.")
    );

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.chat({
      messages: [
        {
          role: "user",
          content: "Analyze my property investment plan with 10 properties at RM 500,000 each.",
        },
      ],
    });

    expect(result).toHaveProperty("content");
    expect(typeof result.content).toBe("string");
    expect(result.content.length).toBeGreaterThan(0);
    expect(result).toHaveProperty("suggestions");
  });

  it("parses suggestions from the response", async () => {
    const responseWithSuggestions = `Here is my analysis.

**Portfolio Overview**
Your plan is solid.

\`\`\`suggestions
["What if I use 90% loan?", "How to improve cash flow?", "What if rates rise?"]
\`\`\``;

    mockInvokeLLM.mockResolvedValueOnce(makeLLMResponse(responseWithSuggestions));

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.chat({
      messages: [{ role: "user", content: "Analyze my plan." }],
    });

    expect(result.content).toContain("Portfolio Overview");
    expect(result.content).not.toContain("```suggestions");
    expect(result.suggestions).toHaveLength(3);
    expect(result.suggestions[0]).toBe("What if I use 90% loan?");
  });

  it("returns empty suggestions when LLM omits the block", async () => {
    mockInvokeLLM.mockResolvedValueOnce(
      makeLLMResponse("Simple response without suggestions.")
    );

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.chat({
      messages: [{ role: "user", content: "What if I reduce to 5 properties?" }],
    });

    expect(result.content).toBe("Simple response without suggestions.");
    expect(result.suggestions).toHaveLength(0);
  });

  it("filters out system messages from input", async () => {
    mockInvokeLLM.mockResolvedValueOnce(
      makeLLMResponse("Hello! How can I help?")
    );

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await caller.ai.chat({
      messages: [
        { role: "system", content: "This should be filtered out" },
        { role: "user", content: "Hello" },
      ],
    });

    expect(mockInvokeLLM).toHaveBeenCalledTimes(1);
    const callArgs = mockInvokeLLM.mock.calls[0][0];
    // First message should be the system prompt from our router
    expect(callArgs.messages[0].role).toBe("system");
    expect(callArgs.messages[0].content).toContain("PropertyLab AI");
    // Second message should be the user message (system from input filtered)
    expect(callArgs.messages[1].role).toBe("user");
    expect(callArgs.messages[1].content).toBe("Hello");
  });

  it("throws error when LLM returns no content", async () => {
    mockInvokeLLM.mockResolvedValueOnce({
      choices: [{ message: { content: null } }],
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.ai.chat({
        messages: [{ role: "user", content: "test" }],
      })
    ).rejects.toThrow("No response from AI");
  });
});
