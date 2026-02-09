/*
 * AI Financial Planner chat panel.
 * Slides in from the right. Uses the pre-built AIChatBox with custom styling.
 * Receives simulation context and auto-triggers initial analysis.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import type { FullSimulationResult, CalculatorInputs } from "@/lib/calculator";
import { formatNumber } from "@/lib/calculator";
import type { Message } from "@/components/AIChatBox";
import { AIChatBox } from "@/components/AIChatBox";
import { X, Sparkles } from "lucide-react";

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  results: FullSimulationResult | null;
  inputs: CalculatorInputs | null;
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

export default function AIChatPanel({
  isOpen,
  onClose,
  results,
  inputs,
}: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasAutoAnalyzed, setHasAutoAnalyzed] = useState(false);
  const lastContextRef = useRef<string>("");

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (response) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.content },
      ]);
    },
    onError: (error) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        },
      ]);
    },
  });

  // Auto-trigger analysis when panel opens with new results
  useEffect(() => {
    if (!isOpen || !results || !inputs) return;

    const contextKey = JSON.stringify({ inputs, r10: results.results10.netEquity });

    // Only auto-analyze if we have new data
    if (contextKey !== lastContextRef.current) {
      lastContextRef.current = contextKey;
      setHasAutoAnalyzed(false);
    }

    if (!hasAutoAnalyzed) {
      setHasAutoAnalyzed(true);
      const contextMsg = buildContextMessage(inputs, results);
      const userMessage: Message = { role: "user", content: contextMsg };
      setMessages([userMessage]);
      chatMutation.mutate({
        messages: [userMessage],
      });
    }
  }, [isOpen, results, inputs, hasAutoAnalyzed]);

  const handleSendMessage = useCallback(
    (content: string) => {
      const newMessages: Message[] = [
        ...messages,
        { role: "user", content },
      ];
      setMessages(newMessages);
      chatMutation.mutate({ messages: newMessages });
    },
    [messages, chatMutation]
  );

  // Reset when panel closes
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleNewAnalysis = useCallback(() => {
    if (!results || !inputs) return;
    lastContextRef.current = "";
    setHasAutoAnalyzed(false);
    setMessages([]);
  }, [results, inputs]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 transition-opacity duration-300"
          onClick={handleClose}
        />
      )}

      {/* Panel */}
      <div
        className={`
          fixed top-0 right-0 h-full z-50
          w-full sm:w-[440px] md:w-[480px]
          bg-white shadow-[-8px_0_32px_rgba(0,0,0,0.08)]
          transform transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e5ea]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0071e3] to-[#5856d6] flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[#1d1d1f] leading-tight">
                AI Financial Planner
              </h3>
              <p className="text-[11px] text-[#86868b] leading-tight mt-0.5">
                Powered by PropertyLab AI
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={handleNewAnalysis}
                className="text-[12px] font-medium text-[#0071e3] hover:text-[#0077ed] px-3 py-1.5 rounded-[8px] hover:bg-[#0071e3]/5 transition-colors"
              >
                New Analysis
              </button>
            )}
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full hover:bg-[#f5f5f7] flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-[#86868b]" />
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden">
          <AIChatBox
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={chatMutation.isPending}
            placeholder="Ask about your investment plan..."
            height="100%"
            emptyStateMessage="Run a simulation to get AI analysis"
            className="border-0 shadow-none rounded-none"
            suggestedPrompts={
              messages.length === 0
                ? []
                : [
                    "What if I reduce to 5 properties?",
                    "Is my cash flow sustainable?",
                    "Should I use 90% or 100% loan?",
                    "When will I break even?",
                  ]
            }
          />
        </div>
      </div>
    </>
  );
}
