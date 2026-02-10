/*
 * Home page — single-page layout with slide-in AI chat panel from the right.
 * AI button sits next to the page title. Grayed before calculation, glowing after.
 * AI analysis auto-triggers in background on Calculate.
 * Stock Reinvestment section appears after property results.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import InputPanel, { type InputPanelRef } from "@/components/InputPanel";
import ResultsPanel from "@/components/ResultsPanel";
import StockInputPanel from "@/components/StockInputPanel";
import StockResultsPanel from "@/components/StockResultsPanel";
import SavedScenarios from "@/components/SavedScenarios";
import CompareScenarios from "@/components/CompareScenarios";
import AIChatPanel, { type AIChatPanelRef, type AIStatus } from "@/components/AIChatPanel";
import {
  calculatePropertyPlan,
  calculateStockReinvestment,
  type CalculatorInputs,
  type FullSimulationResult,
  type StockInputs,
  type StockSimulationResult,
} from "@/lib/calculator";
import { useScenarios, type SavedScenario } from "@/hooks/useScenarios";
import { toast } from "sonner";
import { Bookmark, Sparkles, X } from "lucide-react";

export default function Home() {
  const [results, setResults] = useState<FullSimulationResult | null>(null);
  const [lastInputs, setLastInputs] = useState<CalculatorInputs | null>(null);
  const [externalInputs, setExternalInputs] = useState<CalculatorInputs | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [compareA, setCompareA] = useState<SavedScenario | null>(null);
  const [compareB, setCompareB] = useState<SavedScenario | null>(null);
  const [hasUserCalculated, setHasUserCalculated] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState<AIStatus>("idle");
  const [aiGlowPulse, setAiGlowPulse] = useState(false);
  const inputPanelRef = useRef<InputPanelRef>(null);
  const compareRef = useRef<HTMLDivElement>(null);
  const aiChatRef = useRef<AIChatPanelRef>(null);

  // Stock reinvestment state
  const [stockResults, setStockResults] = useState<StockSimulationResult | null>(null);
  const [lastStockInputs, setLastStockInputs] = useState<StockInputs | null>(null);

  const { scenarios, saveScenario, deleteScenario, renameScenario } = useScenarios();

  // Run default calculation on mount (silent — no AI trigger)
  useEffect(() => {
    const defaultInputs: CalculatorInputs = {
      purchasePrice: 500000,
      currentMarketValue: 600000,
      loanAmount: 600000,
      maxProperties: 10,
      appreciationRate: 3,
      rentalYield: 8,
      interestRate: 4,
      buyInterval: 1,
      startingYear: 2026,
      age: 30,
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
    // Reset stock results when property plan changes
    setStockResults(null);

    // Auto-trigger AI analysis in background
    setTimeout(() => {
      aiChatRef.current?.triggerAnalysis(inputs, result);
      setAiGlowPulse(true);
      setTimeout(() => setAiGlowPulse(false), 4000);
    }, 100);
  }, []);

  const handleStockCalculate = useCallback((stockInputs: StockInputs) => {
    if (!lastInputs || !results) return;
    const stockResult = calculateStockReinvestment(stockInputs, lastInputs, results);
    setStockResults(stockResult);
    setLastStockInputs(stockInputs);
  }, [lastInputs, results]);

  const handleLoadScenario = useCallback((inputs: CalculatorInputs) => {
    setExternalInputs({ ...inputs });
    const result = calculatePropertyPlan(inputs);
    setResults(result);
    setLastInputs(inputs);
    setHasUserCalculated(true);
    setStockResults(null);
    toast.success("Scenario loaded — inputs updated and recalculated.");
    window.scrollTo({ top: 0, behavior: "smooth" });

    setTimeout(() => {
      aiChatRef.current?.triggerAnalysis(inputs, result);
      setAiGlowPulse(true);
      setTimeout(() => setAiGlowPulse(false), 4000);
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

  const handleAiButtonClick = () => {
    if (!hasUserCalculated) {
      toast("Calculate your plan first to unlock AI analysis.", { icon: "✨" });
      return;
    }
    setAiPanelOpen(true);
  };

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

      {/* Page Title + AI Button */}
      <div className="container pt-8 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-[28px] md:text-[34px] font-semibold text-[#1d1d1f] tracking-tight leading-tight">
              Property Investment Simulator
            </h2>
            <p className="text-[15px] md:text-[17px] text-[#86868b] mt-2 leading-relaxed">
              Model your portfolio growth over 10, 20, and 30 years.
            </p>
          </div>

          {/* AI Financial Planner Button — next to title */}
          <button
            onClick={handleAiButtonClick}
            className={`
              relative flex items-center gap-2.5 px-5 py-2.5 rounded-[12px]
              text-[14px] font-medium transition-all duration-300
              shrink-0 self-start sm:self-center
              ${
                !hasUserCalculated
                  ? "bg-[#f5f5f7] text-[#c7c7cc] cursor-default border border-[#e5e5ea]"
                  : aiIsLoading
                  ? "bg-gradient-to-r from-[#0071e3]/10 to-[#5856d6]/10 text-[#0071e3] border border-[#0071e3]/20 animate-pulse"
                  : aiIsReady
                  ? "bg-gradient-to-r from-[#0071e3] to-[#5856d6] text-white shadow-[0_4px_16px_rgba(0,113,227,0.35)] hover:shadow-[0_6px_24px_rgba(0,113,227,0.45)] hover:-translate-y-[1px] cursor-pointer"
                  : "bg-[#0071e3]/5 text-[#0071e3] border border-[#0071e3]/15 hover:bg-[#0071e3]/10 cursor-pointer"
              }
              ${aiGlowPulse && hasUserCalculated ? "animate-ai-tab-glow" : ""}
            `}
          >
            <Sparkles
              className={`w-4 h-4 ${
                !hasUserCalculated
                  ? "text-[#c7c7cc]"
                  : aiIsLoading
                  ? "text-[#0071e3] animate-spin"
                  : aiIsReady
                  ? "text-white"
                  : "text-[#0071e3]"
              }`}
            />
            <span>AI Financial Planner</span>
            {!hasUserCalculated && (
              <span className="text-[10px] text-[#c7c7cc] font-normal ml-1">
                Calculate first
              </span>
            )}
            {hasUserCalculated && aiIsLoading && (
              <span className="text-[10px] font-semibold bg-white/80 text-[#0071e3] px-2 py-0.5 rounded-full">
                Thinking...
              </span>
            )}
            {hasUserCalculated && aiIsReady && (
              <span className="text-[10px] font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full">
                Ready
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
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

        {/* ========== Stock Reinvestment Section ========== */}
        {results && lastInputs && (
          <>
            <div className="pt-4">
              <StockInputPanel
                purchasePrice={lastInputs.purchasePrice}
                loanAmount={lastInputs.loanAmount}
                onCalculate={handleStockCalculate}
              />
            </div>

            {stockResults && (
              <StockResultsPanel
                stockResults={stockResults}
                propertyResults={results}
                stockInputs={lastStockInputs!}
                purchasePrice={lastInputs?.purchasePrice ?? 500000}
                loanAmount={lastInputs?.loanAmount ?? 600000}
              />
            )}
          </>
        )}

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

      {/* Slide-in AI Chat Panel from the Right */}
      <div
        className={`
          fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40
          transition-opacity duration-300
          ${aiPanelOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
        onClick={() => setAiPanelOpen(false)}
      />

      <div
        className={`
          fixed top-0 right-0 h-full w-full max-w-[480px] z-50
          bg-white shadow-[-8px_0_30px_rgba(0,0,0,0.12)]
          transform transition-transform duration-300 ease-out
          ${aiPanelOpen ? "translate-x-0" : "translate-x-full"}
          flex flex-col
        `}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5ea] bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0071e3] to-[#5856d6] flex items-center justify-center shadow-[0_2px_8px_rgba(0,113,227,0.3)]">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[#1d1d1f] leading-tight">
                AI Financial Planner
              </h3>
              <p className="text-[11px] text-[#86868b] leading-tight mt-0.5">
                {aiIsLoading
                  ? "AI is thinking..."
                  : aiIsReady
                  ? "Analysis ready"
                  : "Powered by PropertyLab AI"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setAiPanelOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <AIChatPanel
            ref={aiChatRef}
            results={results}
            inputs={lastInputs}
            onStatusChange={setAiStatus}
            isSlideIn={true}
          />
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
