import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    id: "test-id",
    created: Date.now(),
    model: "gemini-2.5-flash",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: "Based on your simulation, your portfolio shows strong growth potential.",
        },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: 100,
      completion_tokens: 50,
      total_tokens: 150,
    },
  }),
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

describe("ai.chat", () => {
  it("returns AI response content for valid messages", async () => {
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
  });

  it("handles conversation with multiple messages", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.chat({
      messages: [
        {
          role: "user",
          content: "Here is my simulation data...",
        },
        {
          role: "assistant",
          content: "Your portfolio looks good.",
        },
        {
          role: "user",
          content: "What if I reduce to 5 properties?",
        },
      ],
    });

    expect(result).toHaveProperty("content");
    expect(typeof result.content).toBe("string");
  });

  it("filters out system messages from input", async () => {
    const { invokeLLM } = await import("./_core/llm");
    (invokeLLM as any).mockClear();
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await caller.ai.chat({
      messages: [
        {
          role: "system",
          content: "This should be filtered out",
        },
        {
          role: "user",
          content: "Hello",
        },
      ],
    });

    // The invokeLLM should have been called with system prompt + user message only
    expect(invokeLLM).toHaveBeenCalledTimes(1);
    const callArgs = (invokeLLM as any).mock.calls[0][0];
    // First message should be the system prompt (from our router), not the input system message
    expect(callArgs.messages[0].role).toBe("system");
    expect(callArgs.messages[0].content).toContain("PropertyLab AI");
    // Second message should be the user message (system from input should be filtered)
    expect(callArgs.messages[1].role).toBe("user");
    expect(callArgs.messages[1].content).toBe("Hello");
  });
});
