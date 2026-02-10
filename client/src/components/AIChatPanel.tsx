/*
 * AI Financial Planner — slide-in chat panel from the right.
 * Auto-triggers analysis on calculate. Shows recommendation chips after each response.
 * Includes goal-based reverse planner mode.
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
import { formatNumber, calculateTenure } from "@/lib/calculator";
import { Sparkles, Send, RotateCcw, Target } from "lucide-react";
import { Streamdown } from "streamdown";

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
  isSlideIn?: boolean;
}

function buildContextMessage(
  inputs: CalculatorInputs,
  results: FullSimulationResult
): string {
  const loanTenure = calculateTenure(inputs.age);
  const monthlyRate = (inputs.interestRate / 100) / 12;
  const numPayments = loanTenure * 12;
  const monthlyInstalment = monthlyRate === 0
    ? inputs.loanAmount / numPayments
    : (inputs.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  const monthlyExpense = inputs.expenseType === "fixed"
    ? inputs.expenseValue
    : monthlyInstalment * (inputs.expenseValue / 100);
  const cashback = Math.max(0, inputs.loanAmount - inputs.purchasePrice);
  const belowMV = inputs.currentMarketValue > inputs.purchasePrice;
  const discountPct = belowMV ? ((1 - inputs.purchasePrice / inputs.currentMarketValue) * 100).toFixed(1) : "0";

  return `Here is my current property investment simulation:

**Input Parameters:**
- Purchase Price: RM ${formatNumber(inputs.purchasePrice)}
- Current Market Value: RM ${formatNumber(inputs.currentMarketValue)}
- Below Market Value: ${belowMV ? `Yes (${discountPct}% discount)` : "No"}
- Loan Amount: RM ${formatNumber(inputs.loanAmount)} (LTV: ${((inputs.loanAmount / inputs.currentMarketValue) * 100).toFixed(0)}%)
- Cashback per Property: RM ${formatNumber(cashback)}
- Max Properties: ${inputs.maxProperties}
- Annual Appreciation: ${inputs.appreciationRate}%
- Gross Rental Yield: ${inputs.rentalYield}%
- Loan Interest Rate: ${inputs.interestRate}%
- Purchase Interval: Every ${inputs.buyInterval} year(s)
- Starting Year: ${inputs.startingYear}
- Age: ${inputs.age} → Loan Tenure: ${loanTenure} years
- Monthly Expense/Property: RM ${formatNumber(monthlyExpense.toFixed(0))} (${inputs.expenseType === "fixed" ? "fixed" : `${inputs.expenseValue}% of instalment`})

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

// Goal-based reverse planner quick prompts
const GOAL_PROMPTS = [
  "I want RM 5M net equity in 15 years",
  "I want RM 10M net equity in 20 years",
  "I want positive cash flow from year 1",
];

const AIChatPanel = forwardRef<AIChatPanelRef, AIChatPanelProps>(
  ({ results, inputs, onStatusChange, isSlideIn = false }, ref) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [input, setInput] = useState("");
    const [status, setStatus] = useState<AIStatus>("idle");
    const [showGoalPlanner, setShowGoalPlanner] = useState(false);
    const [goalInput, setGoalInput] = useState("");
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
        setShowGoalPlanner(false);
        updateStatus("loading");
        chatMutation.mutate({ messages: [userMessage] });
      },
    }));

    // Scroll to bottom when messages change
    useEffect(() => {
      if (scrollRef.current) {
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTo({
              top: scrollRef.current.scrollHeight,
              behavior: "smooth",
            });
          }
        });
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
        setShowGoalPlanner(false);
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
      setShowGoalPlanner(false);
      updateStatus("loading");
      chatMutation.mutate({ messages: [userMessage] });
    }, [results, inputs, chatMutation, updateStatus]);

    const handleGoalSubmit = useCallback(
      (goal: string) => {
        if (!goal.trim() || !results || !inputs) return;
        const contextMsg = buildContextMessage(inputs, results);
        const goalMessage = `${contextMsg}

---

**MY GOAL:** ${goal.trim()}

Based on my current simulation above, please reverse-engineer and suggest the optimal input parameters I should use to achieve this goal. Tell me specifically what I should change (purchase price, number of properties, appreciation rate, rental yield, loan type, purchase interval, etc.) and explain why. Show me the expected outcome with your suggested changes.`;

        const userMessage: Message = { role: "user", content: goalMessage };
        setMessages([userMessage]);
        setSuggestions([]);
        setShowGoalPlanner(false);
        setGoalInput("");
        updateStatus("loading");
        chatMutation.mutate({ messages: [userMessage] });
      },
      [results, inputs, chatMutation, updateStatus]
    );

    const displayMessages = messages.filter((m) => m.role !== "system");
    // Hide the first user message (context dump) — show AI response directly
    const visibleMessages =
      displayMessages.length > 0 && displayMessages[0].role === "user"
        ? displayMessages.slice(1)
        : displayMessages;

    const hasMessages = visibleMessages.length > 0 || chatMutation.isPending;

    return (
      <div className={`flex flex-col ${isSlideIn ? "h-full" : ""}`}>
        {/* Messages Area */}
        <div
          ref={scrollRef}
          className={`flex-1 overflow-y-auto ${isSlideIn ? "" : "max-h-[500px]"}`}
        >
          <div className="p-6 space-y-5">
            {/* Empty state — before any analysis */}
            {!hasMessages && !showGoalPlanner && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0071e3]/10 to-[#5856d6]/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-[#0071e3]" />
                </div>
                <h4 className="text-[16px] font-semibold text-[#1d1d1f] mb-1">
                  AI Financial Planner
                </h4>
                <p className="text-[13px] text-[#86868b] max-w-[280px] leading-relaxed">
                  {results
                    ? "Your analysis is being prepared. It will appear here shortly."
                    : "Calculate your property plan first, then I'll analyze it for you."}
                </p>
              </div>
            )}

            {/* Chat messages */}
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
              <div className="pt-3 pb-1">
                <p className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-3">
                  Suggested follow-ups
                </p>
                <div className="flex flex-col gap-2">
                  {suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(suggestion)}
                      className="
                        text-left text-[13px] font-medium text-[#0071e3]
                        bg-[#0071e3]/5 hover:bg-[#0071e3]/10
                        border border-[#0071e3]/15 hover:border-[#0071e3]/25
                        rounded-[10px] px-4 py-3
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

            {/* Goal-Based Reverse Planner */}
            {showGoalPlanner && (
              <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="bg-gradient-to-br from-[#0071e3]/5 to-[#5856d6]/5 rounded-[14px] p-5 border border-[#0071e3]/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-[#0071e3]" />
                    <h4 className="text-[14px] font-semibold text-[#1d1d1f]">
                      Goal-Based Reverse Planner
                    </h4>
                  </div>
                  <p className="text-[12px] text-[#86868b] mb-4 leading-relaxed">
                    Tell me your investment goal and I'll suggest the optimal parameters to achieve it.
                  </p>

                  {/* Quick goal presets */}
                  <div className="flex flex-col gap-2 mb-4">
                    {GOAL_PROMPTS.map((goal, i) => (
                      <button
                        key={i}
                        onClick={() => handleGoalSubmit(goal)}
                        disabled={chatMutation.isPending}
                        className="
                          text-left text-[13px] font-medium text-[#0071e3]
                          bg-white hover:bg-[#0071e3]/5
                          border border-[#0071e3]/15 hover:border-[#0071e3]/25
                          rounded-[10px] px-4 py-2.5
                          transition-all duration-200
                          disabled:opacity-50
                        "
                      >
                        {goal}
                      </button>
                    ))}
                  </div>

                  {/* Custom goal input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleGoalSubmit(goalInput);
                      }}
                      placeholder="Or type your own goal..."
                      className="
                        flex-1 text-[13px] text-[#1d1d1f] placeholder-[#86868b]
                        bg-white border border-[#d2d2d7] rounded-[10px]
                        px-3.5 py-2.5
                        focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3]
                        transition-all duration-200
                      "
                    />
                    <button
                      onClick={() => handleGoalSubmit(goalInput)}
                      disabled={!goalInput.trim() || chatMutation.isPending}
                      className="
                        px-4 py-2.5 text-[13px] font-medium text-white
                        bg-[#0071e3] hover:bg-[#0077ed]
                        disabled:opacity-40 disabled:cursor-not-allowed
                        rounded-[10px] transition-all duration-200
                      "
                    >
                      Go
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="shrink-0 border-t border-[#e5e5ea]/60 bg-[#fafafa]">
          {/* Action buttons row */}
          {hasMessages && !chatMutation.isPending && (
            <div className="flex items-center gap-2 px-5 pt-3">
              <button
                onClick={handleNewAnalysis}
                className="flex items-center gap-1.5 text-[12px] font-medium text-[#86868b] hover:text-[#0071e3] px-3 py-1.5 rounded-[8px] hover:bg-[#0071e3]/5 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Re-analyze
              </button>
              <button
                onClick={() => setShowGoalPlanner(!showGoalPlanner)}
                className={`
                  flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-[8px] transition-colors
                  ${
                    showGoalPlanner
                      ? "text-[#0071e3] bg-[#0071e3]/10"
                      : "text-[#86868b] hover:text-[#0071e3] hover:bg-[#0071e3]/5"
                  }
                `}
              >
                <Target className="w-3 h-3" />
                Goal Planner
              </button>
            </div>
          )}

          {/* Text input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 px-5 py-3"
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
        </div>
      </div>
    );
  }
);

AIChatPanel.displayName = "AIChatPanel";
export default AIChatPanel;
