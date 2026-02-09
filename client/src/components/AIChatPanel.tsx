/*
 * AI Financial Planner — inline chat section.
 * Auto-triggers analysis on calculate. Shows recommendation chips after each response.
 * Exposed via ref so parent can trigger analysis externally.
 * Reports loading/ready status to parent via onStatusChange callback.
 */

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { trpc } from "@/lib/trpc";
import type { FullSimulationResult, CalculatorInputs } from "@/lib/calculator";
import { formatNumber } from "@/lib/calculator";
import { Sparkles, Send, RotateCcw } from "lucide-react";
import { Streamdown } from "streamdown";
import { ScrollArea } from "@/components/ui/scroll-area";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AIStatus = "idle" | "loading" | "ready" | "error";

export interface AIChatPanelRef {
  triggerAnalysis: (inputs: CalculatorInputs, results: FullSimulationResult) => void;
}

interface AIChatPanelProps {
  results: FullSimulationResult | null;
  inputs: CalculatorInputs | null;
  onStatusChange?: (status: AIStatus) => void;
}

function buildContextMessage(
  inputs: CalculatorInputs,
  results: FullSimulationResult
): string {
  const expensePerProperty =
    inputs.expenseType === "fixed"
      ? inputs.expenseValue
      : inputs.purchasePrice * (inputs.expenseValue / 100);

  return `Here is my current property investment simulation:

**Input Parameters:**
- Purchase Price: RM ${formatNumber(inputs.purchasePrice)}
- Loan Type: ${inputs.loanType === 1 ? "100% (Full Financing)" : "90%"}
- Max Properties: ${inputs.maxProperties}
- Below Market Value: ${inputs.belowMarketValue ? `Yes (${inputs.discountPercentage}% discount)` : "No"}
- Annual Appreciation: ${inputs.appreciationRate}%
- Gross Rental Yield: ${inputs.rentalYield}%
- Loan Interest Rate: ${inputs.interestRate}%
- Purchase Interval: Every ${inputs.buyInterval} year(s)
- Starting Year: ${inputs.startingYear}
- Loan Tenure: ${inputs.loanTenure} years
- Annual Expense/Property: RM ${formatNumber(expensePerProperty.toFixed(0))} (${inputs.expenseType === "fixed" ? "fixed" : `${inputs.expenseValue}% of price`})

**Key Results:**
- 10-Year Net Equity: RM ${formatNumber(results.results10.netEquity.toFixed(0))}
- 20-Year Net Equity: RM ${formatNumber(results.results20.netEquity.toFixed(0))}
- 30-Year Net Equity: RM ${formatNumber(results.results30.netEquity.toFixed(0))}
- Properties Owned (30Y): ${results.results30.propertiesOwned}
- Monthly Mortgage Payment: RM ${formatNumber(results.monthlyPayment.toFixed(0))}
- Annual Rental Income/Property: RM ${formatNumber(results.annualRentalIncome.toFixed(0))}
- Loan Amount/Property: RM ${formatNumber(results.loanAmount.toFixed(0))}
- Market Value/Property: RM ${formatNumber(results.marketValue.toFixed(0))}
- 30-Year Cumulative Cash Flow: RM ${formatNumber(results.results30.cumulativeCashFlow.toFixed(0))}
- 30-Year Total Asset Value: RM ${formatNumber(results.results30.totalAssetValue.toFixed(0))}
- 30-Year Total Loan Balance: RM ${formatNumber(results.results30.totalLoanBalance.toFixed(0))}

Please analyze my property investment plan and provide your professional assessment.`;
}

const AIChatPanel = forwardRef<AIChatPanelRef, AIChatPanelProps>(
  ({ results, inputs, onStatusChange }, ref) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [input, setInput] = useState("");
    const [status, setStatus] = useState<AIStatus>("idle");
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Notify parent of status changes
    const updateStatus = useCallback(
      (newStatus: AIStatus) => {
        setStatus(newStatus);
        onStatusChange?.(newStatus);
      },
      [onStatusChange]
    );

    const chatMutation = trpc.ai.chat.useMutation({
      onSuccess: (response) => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response.content },
        ]);
        setSuggestions(response.suggestions || []);
        updateStatus("ready");
      },
      onError: (error) => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
          },
        ]);
        setSuggestions([]);
        updateStatus("error");
      },
    });

    // Expose trigger method to parent
    useImperativeHandle(ref, () => ({
      triggerAnalysis: (newInputs: CalculatorInputs, newResults: FullSimulationResult) => {
        const contextMsg = buildContextMessage(newInputs, newResults);
        const userMessage: Message = { role: "user", content: contextMsg };
        setMessages([userMessage]);
        setSuggestions([]);
        updateStatus("loading");
        chatMutation.mutate({ messages: [userMessage] });
      },
    }));

    // Scroll to bottom when messages change
    useEffect(() => {
      if (scrollRef.current) {
        const viewport = scrollRef.current.querySelector(
          "[data-radix-scroll-area-viewport]"
        ) as HTMLDivElement;
        if (viewport) {
          requestAnimationFrame(() => {
            viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
          });
        }
      }
    }, [messages, chatMutation.isPending, suggestions]);

    const handleSend = useCallback(
      (content: string) => {
        if (!content.trim() || chatMutation.isPending) return;
        const newMessages: Message[] = [
          ...messages,
          { role: "user", content: content.trim() },
        ];
        setMessages(newMessages);
        setSuggestions([]);
        setInput("");
        updateStatus("loading");
        chatMutation.mutate({ messages: newMessages });
      },
      [messages, chatMutation, updateStatus]
    );

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSend(input);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend(input);
      }
    };

    const handleNewAnalysis = useCallback(() => {
      if (!results || !inputs) return;
      const contextMsg = buildContextMessage(inputs, results);
      const userMessage: Message = { role: "user", content: contextMsg };
      setMessages([userMessage]);
      setSuggestions([]);
      updateStatus("loading");
      chatMutation.mutate({ messages: [userMessage] });
    }, [results, inputs, chatMutation, updateStatus]);

    const displayMessages = messages.filter((m) => m.role !== "system");
    // Hide the first user message (context dump) — show AI response directly
    const visibleMessages =
      displayMessages.length > 0 && displayMessages[0].role === "user"
        ? displayMessages.slice(1)
        : displayMessages;

    return (
      <div className="apple-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5ea]/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0071e3] to-[#5856d6] flex items-center justify-center shadow-[0_2px_8px_rgba(0,113,227,0.3)]">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[#1d1d1f] leading-tight">
                AI Financial Planner
              </h3>
              <p className="text-[11px] text-[#86868b] leading-tight mt-0.5">
                {status === "loading"
                  ? "AI is thinking..."
                  : status === "ready"
                  ? "Analysis ready"
                  : "Powered by PropertyLab AI"}
              </p>
            </div>
          </div>
          {messages.length > 1 && (
            <button
              onClick={handleNewAnalysis}
              className="flex items-center gap-1.5 text-[12px] font-medium text-[#0071e3] hover:text-[#0077ed] px-3 py-1.5 rounded-[8px] hover:bg-[#0071e3]/5 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Re-analyze
            </button>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="max-h-[500px] overflow-hidden">
          <ScrollArea className="h-full max-h-[500px]">
            <div className="p-6 space-y-5">
              {visibleMessages.map((message, index) => (
                <div key={index}>
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none text-[14px] text-[#1d1d1f] leading-relaxed">
                      <Streamdown>{message.content}</Streamdown>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <div className="flex items-start gap-2 max-w-[85%]">
                        <div className="bg-[#0071e3] text-white rounded-[14px] rounded-tr-[4px] px-4 py-2.5 text-[14px]">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Loading state */}
              {chatMutation.isPending && (
                <div className="flex items-center gap-3 py-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0071e3] to-[#5856d6] flex items-center justify-center animate-pulse">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="text-[14px] text-[#86868b] flex items-center gap-1">
                    AI is thinking
                    <span className="inline-flex">
                      <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                      <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                      <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Recommendation Chips */}
              {suggestions.length > 0 && !chatMutation.isPending && (
                <div className="pt-2">
                  <p className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-2.5">
                    Suggested follow-ups
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(suggestion)}
                        className="
                          text-[13px] font-medium text-[#0071e3]
                          bg-[#0071e3]/5 hover:bg-[#0071e3]/10
                          border border-[#0071e3]/15 hover:border-[#0071e3]/25
                          rounded-full px-4 py-2
                          transition-all duration-200
                          hover:-translate-y-[1px]
                          active:translate-y-0
                        "
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Input Area */}
        {(visibleMessages.length > 0 || chatMutation.isPending) && (
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 px-5 py-4 border-t border-[#e5e5ea]/60 bg-[#fafafa]"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your investment plan..."
              rows={1}
              className="
                flex-1 resize-none min-h-[38px] max-h-[100px]
                text-[14px] text-[#1d1d1f] placeholder-[#86868b]
                bg-white border border-[#d2d2d7] rounded-[10px]
                px-3.5 py-2
                focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3]
                transition-all duration-200
              "
            />
            <button
              type="submit"
              disabled={!input.trim() || chatMutation.isPending}
              className="
                w-[38px] h-[38px] rounded-[10px] shrink-0
                bg-[#0071e3] hover:bg-[#0077ed]
                disabled:bg-[#d2d2d7] disabled:cursor-not-allowed
                flex items-center justify-center
                transition-all duration-200
              "
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </form>
        )}
      </div>
    );
  }
);

AIChatPanel.displayName = "AIChatPanel";
export default AIChatPanel;
