/*
 * Home page — two-tab layout: Property Investment Simulator + AI Financial Planner.
 * AI tab is grayed out before calculation, lights up with gradient glow after.
 * AI analysis auto-triggers in background on Calculate.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import InputPanel, { type InputPanelRef } from "@/components/InputPanel";
import ResultsPanel from "@/components/ResultsPanel";
import SavedScenarios from "@/components/SavedScenarios";
import CompareScenarios from "@/components/CompareScenarios";
import AIChatPanel, { type AIChatPanelRef, type AIStatus } from "@/components/AIChatPanel";
import {
  calculatePropertyPlan,
  type CalculatorInputs,
  type FullSimulationResult,
} from "@/lib/calculator";
import { useScenarios, type SavedScenario } from "@/hooks/useScenarios";
import { toast } from "sonner";
import { Bookmark, Sparkles, BarChart3 } from "lucide-react";

type ActiveTab = "simulator" | "ai";

export default function Home() {
  const [results, setResults] = useState<FullSimulationResult | null>(null);
  const [lastInputs, setLastInputs] = useState<CalculatorInputs | null>(null);
  const [externalInputs, setExternalInputs] = useState<CalculatorInputs | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [compareA, setCompareA] = useState<SavedScenario | null>(null);
  const [compareB, setCompareB] = useState<SavedScenario | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("simulator");
  const [hasUserCalculated, setHasUserCalculated] = useState(false);
  const [aiGlowPulse, setAiGlowPulse] = useState(false);
  const [aiStatus, setAiStatus] = useState<AIStatus>("idle");
  const inputPanelRef = useRef<InputPanelRef>(null);
  const compareRef = useRef<HTMLDivElement>(null);
  const aiChatRef = useRef<AIChatPanelRef>(null);

  const { scenarios, saveScenario, deleteScenario, renameScenario } = useScenarios();

  // Run default calculation on mount (silent — no AI trigger)
  useEffect(() => {
    const defaultInputs: CalculatorInputs = {
      purchasePrice: 500000,
      loanType: 1.0,
      maxProperties: 10,
      belowMarketValue: false,
      discountPercentage: 10,
      appreciationRate: 3,
      rentalYield: 8,
      interestRate: 4,
      buyInterval: 1,
      startingYear: 2026,
      loanTenure: 30,
      expenseType: "percentage" as const,
      expenseValue: 0,
    };
    const result = calculatePropertyPlan(defaultInputs);
    setResults(result);
    setLastInputs(defaultInputs);
  }, []);

  const handleCalculate = useCallback((inputs: CalculatorInputs) => {
    const result = calculatePropertyPlan(inputs);
    setResults(result);
    setLastInputs(inputs);
    setHasUserCalculated(true);

    // Auto-trigger AI analysis in background
    setTimeout(() => {
      aiChatRef.current?.triggerAnalysis(inputs, result);
      // Pulse the AI tab to signal it's ready
      setAiGlowPulse(true);
      setTimeout(() => setAiGlowPulse(false), 3000);
    }, 100);
  }, []);

  const handleLoadScenario = useCallback((inputs: CalculatorInputs) => {
    setExternalInputs({ ...inputs });
    const result = calculatePropertyPlan(inputs);
    setResults(result);
    setLastInputs(inputs);
    setHasUserCalculated(true);
    toast.success("Scenario loaded — inputs updated and recalculated.");
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Auto-trigger AI for loaded scenario too
    setTimeout(() => {
      aiChatRef.current?.triggerAnalysis(inputs, result);
      setAiGlowPulse(true);
      setTimeout(() => setAiGlowPulse(false), 3000);
    }, 100);
  }, []);

  const handleSave = useCallback(() => {
    if (!scenarioName.trim() || !lastInputs || !results) return;
    saveScenario(scenarioName, lastInputs, results);
    setShowSaveDialog(false);
    setScenarioName("");
    toast.success(`Scenario "${scenarioName.trim()}" saved.`);
  }, [scenarioName, lastInputs, results, saveScenario]);

  const handleDelete = useCallback((id: string) => {
    deleteScenario(id);
    if (compareA?.id === id || compareB?.id === id) {
      setCompareA(null);
      setCompareB(null);
    }
    toast("Scenario deleted.");
  }, [deleteScenario, compareA, compareB]);

  const handleCompare = useCallback((a: SavedScenario, b: SavedScenario) => {
    setCompareA(a);
    setCompareB(b);
    setTimeout(() => {
      compareRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, []);

  const handleCloseCompare = useCallback(() => {
    setCompareA(null);
    setCompareB(null);
  }, []);

  const aiIsLoading = aiStatus === "loading";
  const aiIsReady = aiStatus === "ready";

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Header */}
      <header className="bg-white border-b border-[#e5e5ea]">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-[#0071e3] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div>
              <h1 className="text-[17px] font-semibold text-[#1d1d1f] tracking-tight leading-tight">
                PropertyLab
              </h1>
              <p className="text-[12px] text-[#86868b] leading-tight">
                Net Equity Simulator
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation — right below header */}
      <div className="bg-white border-b border-[#e5e5ea]">
        <div className="container">
          <div className="flex items-center gap-1 pt-2">
            {/* Simulator Tab */}
            <button
              onClick={() => setActiveTab("simulator")}
              className={`
                flex items-center gap-2 px-5 py-3 text-[14px] font-medium
                border-b-2 transition-all duration-300 -mb-[1px]
                ${
                  activeTab === "simulator"
                    ? "text-[#0071e3] border-[#0071e3]"
                    : "text-[#86868b] border-transparent hover:text-[#1d1d1f] hover:border-[#d2d2d7]"
                }
              `}
            >
              <BarChart3 className="w-4 h-4" />
              Property Investment Simulator
            </button>

            {/* AI Planner Tab */}
            <button
              onClick={() => {
                if (hasUserCalculated) {
                  setActiveTab("ai");
                } else {
                  toast("Calculate your plan first to unlock AI analysis.", {
                    icon: "✨",
                  });
                }
              }}
              className={`
                relative flex items-center gap-2 px-5 py-3 text-[14px] font-medium
                border-b-2 transition-all duration-300 -mb-[1px]
                ${
                  !hasUserCalculated
                    ? "text-[#c7c7cc] border-transparent cursor-default"
                    : activeTab === "ai"
                    ? "text-transparent bg-clip-text bg-gradient-to-r from-[#0071e3] to-[#5856d6] border-[#0071e3]"
                    : "text-[#86868b] border-transparent hover:text-[#1d1d1f] hover:border-[#d2d2d7]"
                }
                ${aiGlowPulse && hasUserCalculated ? "animate-ai-tab-glow" : ""}
              `}
            >
              {/* Gradient glow background when ready */}
              {hasUserCalculated && activeTab !== "ai" && (
                <span
                  className={`
                    absolute inset-0 rounded-t-lg
                    bg-gradient-to-r from-[#0071e3]/5 to-[#5856d6]/5
                    transition-opacity duration-500
                    ${aiGlowPulse ? "opacity-100" : "opacity-0"}
                  `}
                />
              )}
              <Sparkles
                className={`w-4 h-4 relative z-10 ${
                  !hasUserCalculated
                    ? "text-[#c7c7cc]"
                    : activeTab === "ai"
                    ? "text-[#0071e3]"
                    : aiIsLoading
                    ? "text-[#0071e3] animate-pulse"
                    : aiIsReady
                    ? "text-[#0071e3]"
                    : "text-[#86868b]"
                }`}
              />
              <span className="relative z-10">
                AI Financial Planner
              </span>
              {/* Status badge */}
              {hasUserCalculated && activeTab !== "ai" && (
                <span
                  className={`
                    relative z-10 text-[10px] font-semibold px-2 py-0.5 rounded-full
                    transition-all duration-300
                    ${
                      aiIsLoading
                        ? "bg-[#0071e3]/10 text-[#0071e3] animate-pulse"
                        : aiIsReady
                        ? "bg-gradient-to-r from-[#0071e3] to-[#5856d6] text-white shadow-[0_2px_8px_rgba(0,113,227,0.3)]"
                        : "bg-[#f5f5f7] text-[#86868b]"
                    }
                  `}
                >
                  {aiIsLoading ? "Thinking..." : aiIsReady ? "Ready" : ""}
                </span>
              )}
              {/* "Calculate first" hint */}
              {!hasUserCalculated && (
                <span className="relative z-10 text-[10px] text-[#c7c7cc] font-normal">
                  Calculate first
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Simulator Tab Content */}
      <div className={activeTab === "simulator" ? "block" : "hidden"}>
        {/* Page Title */}
        <div className="container pt-8 pb-2">
          <h2 className="text-[28px] md:text-[34px] font-semibold text-[#1d1d1f] tracking-tight leading-tight">
            Property Investment Simulator
          </h2>
          <p className="text-[15px] md:text-[17px] text-[#86868b] mt-2 leading-relaxed">
            Model your portfolio growth over 10, 20, and 30 years.
          </p>
        </div>

        <main className="container py-6 md:py-8 space-y-8">
          <InputPanel
            ref={inputPanelRef}
            onCalculate={handleCalculate}
            externalInputs={externalInputs}
          />

          {/* Save Scenario Button */}
          {results && lastInputs && (
            <div className="flex flex-wrap justify-center gap-3">
              {!showSaveDialog ? (
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="
                    flex items-center gap-2 px-6 py-2.5 text-[14px] font-medium
                    text-[#0071e3] bg-[#0071e3]/5 hover:bg-[#0071e3]/10
                    rounded-[10px] transition-all duration-200
                    border border-[#0071e3]/15
                  "
                >
                  <Bookmark className="w-4 h-4" />
                  Save This Scenario
                </button>
              ) : (
                <div className="apple-card p-5 w-full max-w-md animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <p className="text-[15px] font-medium text-[#1d1d1f] mb-3">Name your scenario</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={scenarioName}
                      onChange={(e) => setScenarioName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSave();
                        if (e.key === "Escape") {
                          setShowSaveDialog(false);
                          setScenarioName("");
                        }
                      }}
                      placeholder="e.g. Conservative 3% growth"
                      autoFocus
                      className="apple-input flex-1 text-[14px]"
                    />
                    <button
                      onClick={handleSave}
                      disabled={!scenarioName.trim()}
                      className="
                        px-5 py-2.5 text-[14px] font-medium text-white
                        bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-40 disabled:cursor-not-allowed
                        rounded-[10px] transition-all duration-200
                        shadow-[0_2px_6px_rgba(0,113,227,0.2)]
                      "
                    >
                      Save
                    </button>
                    <button
                      onClick={() => { setShowSaveDialog(false); setScenarioName(""); }}
                      className="
                        px-4 py-2.5 text-[14px] font-medium text-[#86868b]
                        bg-[#f5f5f7] hover:bg-[#e5e5ea]
                        rounded-[10px] transition-all duration-200
                      "
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {results && <ResultsPanel results={results} />}

          {/* Saved Scenarios */}
          <SavedScenarios
            scenarios={scenarios}
            onLoad={handleLoadScenario}
            onDelete={handleDelete}
            onRename={renameScenario}
            onCompare={handleCompare}
          />

          {/* Side-by-Side Comparison */}
          {compareA && compareB && (
            <div ref={compareRef}>
              <CompareScenarios
                scenarioA={compareA}
                scenarioB={compareB}
                onClose={handleCloseCompare}
              />
            </div>
          )}
        </main>
      </div>

      {/* AI Planner Tab Content */}
      <div className={activeTab === "ai" ? "block" : "hidden"}>
        <div className="container py-6 md:py-8">
          <div className="max-w-3xl mx-auto">
            <AIChatPanel
              ref={aiChatRef}
              results={results}
              inputs={lastInputs}
              onStatusChange={setAiStatus}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#e5e5ea] bg-white">
        <div className="container py-6 text-center">
          <p className="text-[12px] text-[#86868b]">
            PropertyLab · This calculator provides estimates only. Consult with a financial advisor for personalized advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
