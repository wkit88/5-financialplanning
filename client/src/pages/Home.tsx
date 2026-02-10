/*
 * Home page — 3 top-level tabs: Property Investment, Stock Investment, Combined Portfolio.
 * Property tab: inputs, results, cash flow summary table, "Reinvest to Stock" button.
 * Stock tab: stock inputs + stock results.
 * Combined tab: merged property + stock overview.
 * AI Financial Planner slides in from the right.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Bookmark, Sparkles, X, Home as HomeIcon, TrendingUp, PieChart, Save, ArrowLeft } from "lucide-react";

type MainTab = "property" | "stock" | "combined";

export default function Home() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [activeMainTab, setActiveMainTab] = useState<MainTab>("property");
  const [showPortfolioSaveDialog, setShowPortfolioSaveDialog] = useState(false);
  const [portfolioName, setPortfolioName] = useState("");
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
    setLastStockInputs(null);

    // Auto-trigger AI analysis in background (property only, no stock yet)
    setTimeout(() => {
      aiChatRef.current?.triggerAnalysis(inputs, result, null, null);
      setAiGlowPulse(true);
      setTimeout(() => setAiGlowPulse(false), 4000);
    }, 100);
  }, []);

  const handleStockCalculate = useCallback((stockInputs: StockInputs) => {
    if (!lastInputs || !results) return;
    const stockResult = calculateStockReinvestment(stockInputs, lastInputs, results);
    setStockResults(stockResult);
    setLastStockInputs(stockInputs);

    // Re-trigger AI analysis with combined property + stock data
    setTimeout(() => {
      aiChatRef.current?.triggerAnalysis(lastInputs, results, stockInputs, stockResult);
      setAiGlowPulse(true);
      setTimeout(() => setAiGlowPulse(false), 4000);
    }, 100);
  }, [lastInputs, results]);

  const handleLoadScenario = useCallback((inputs: CalculatorInputs) => {
    setExternalInputs({ ...inputs });
    const result = calculatePropertyPlan(inputs);
    setResults(result);
    setLastInputs(inputs);
    setHasUserCalculated(true);
    setStockResults(null);
    setActiveMainTab("property");
    toast.success("Scenario loaded — inputs updated and recalculated.");
    window.scrollTo({ top: 0, behavior: "smooth" });

    setTimeout(() => {
      aiChatRef.current?.triggerAnalysis(inputs, result, null, null);
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

  const handleReinvestToStock = useCallback(() => {
    setActiveMainTab("stock");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Portfolio save mutation
  const savePortfolioMutation = trpc.portfolio.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Portfolio "${portfolioName.trim()}" saved!`);
      setShowPortfolioSaveDialog(false);
      setPortfolioName("");
      navigate(`/portfolio/${data.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSaveAsPortfolio = useCallback(() => {
    if (!portfolioName.trim() || !lastInputs || !results) return;
    const summary: Record<string, number> = {
      purchasePrice: lastInputs.purchasePrice,
      equity10: results.results10.netEquity,
      equity20: results.results20.netEquity,
      equity30: results.results30.netEquity,
      properties: results.results30.propertiesOwned,
    };
    if (stockResults) {
      summary.stockValue30 = stockResults.stock30Year.portfolioValue;
      summary.combined30 = results.results30.netEquity + stockResults.stock30Year.portfolioValue;
    }
    savePortfolioMutation.mutate({
      name: portfolioName.trim(),
      propertyInputs: lastInputs,
      stockInputs: lastStockInputs ?? undefined,
      propertyResults: results,
      stockResults: stockResults ?? undefined,
      summary,
    });
  }, [portfolioName, lastInputs, results, lastStockInputs, stockResults, savePortfolioMutation, navigate]);

  const aiIsLoading = aiStatus === "loading";
  const aiIsReady = aiStatus === "ready";

  const MAIN_TABS: { key: MainTab; label: string; icon: typeof HomeIcon; disabled?: boolean }[] = [
    { key: "property", label: "Property Investment", icon: HomeIcon },
    { key: "stock", label: "Stock Investment", icon: TrendingUp, disabled: !hasUserCalculated },
    { key: "combined", label: "Combined Portfolio", icon: PieChart, disabled: !stockResults },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Header */}
      <header className="bg-white border-b border-[#e5e5ea]">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
              title="Back to Portfolios"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
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
                Portfolio Simulator
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">

          {/* AI Financial Planner Button — in header */}
          <button
            onClick={handleAiButtonClick}
            className={`
              relative flex items-center gap-2 px-4 py-2 rounded-[10px]
              text-[13px] font-medium transition-all duration-300
              shrink-0
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
              className={`w-3.5 h-3.5 ${
                !hasUserCalculated
                  ? "text-[#c7c7cc]"
                  : aiIsLoading
                  ? "text-[#0071e3] animate-spin"
                  : aiIsReady
                  ? "text-white"
                  : "text-[#0071e3]"
              }`}
            />
            <span className="hidden sm:inline">AI Financial Planner</span>
            <span className="sm:hidden">AI</span>
            {hasUserCalculated && aiIsLoading && (
              <span className="text-[10px] font-semibold bg-white/80 text-[#0071e3] px-1.5 py-0.5 rounded-full">
                Thinking...
              </span>
            )}
            {hasUserCalculated && aiIsReady && (
              <span className="text-[10px] font-semibold bg-white/20 text-white px-1.5 py-0.5 rounded-full">
                Ready
              </span>
            )}
          </button>

            {/* Save as Portfolio Button */}
            {isAuthenticated && hasUserCalculated && results && lastInputs && (
              <button
                onClick={() => setShowPortfolioSaveDialog(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-medium text-[#34c759] bg-[#34c759]/5 border border-[#34c759]/15 hover:bg-[#34c759]/10 transition-all duration-200 shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Save Portfolio</span>
                <span className="sm:hidden">Save</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ===== Top-Level Tab Navigation ===== */}
      <div className="bg-white border-b border-[#e5e5ea] sticky top-0 z-30">
        <div className="container">
          <nav className="flex gap-0 -mb-px">
            {MAIN_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeMainTab === tab.key;
              const isDisabled = tab.disabled;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    if (isDisabled) {
                      if (tab.key === "stock") toast("Calculate your property plan first.", { icon: "📊" });
                      if (tab.key === "combined") toast("Calculate stock reinvestment first to see combined portfolio.", { icon: "📊" });
                      return;
                    }
                    setActiveMainTab(tab.key);
                  }}
                  className={`
                    flex items-center gap-2 px-5 py-3.5 text-[14px] font-medium
                    border-b-2 transition-all duration-200
                    ${isActive
                      ? "border-[#0071e3] text-[#0071e3]"
                      : isDisabled
                      ? "border-transparent text-[#c7c7cc] cursor-default"
                      : "border-transparent text-[#86868b] hover:text-[#1d1d1f] hover:border-[#d2d2d7]"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container py-6 md:py-8 space-y-8">

        {/* ========== TAB 1: Property Investment ========== */}
        {activeMainTab === "property" && (
          <>
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

            {results && (
              <ResultsPanel
                results={results}
                purchasePrice={lastInputs?.purchasePrice}
                loanAmount={lastInputs?.loanAmount}
                onReinvestToStock={hasUserCalculated ? handleReinvestToStock : undefined}
              />
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
          </>
        )}

        {/* ========== TAB 2: Stock Investment ========== */}
        {activeMainTab === "stock" && results && lastInputs && (
          <>
            <StockInputPanel
              purchasePrice={lastInputs.purchasePrice}
              loanAmount={lastInputs.loanAmount}
              onCalculate={handleStockCalculate}
            />

            {stockResults && lastStockInputs && (
              <StockResultsPanel
                stockResults={stockResults}
                propertyResults={results}
                stockInputs={lastStockInputs}
                purchasePrice={lastInputs.purchasePrice}
                loanAmount={lastInputs.loanAmount}
              />
            )}

            {!stockResults && (
              <div className="apple-card p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-[#34c759]/10 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-[#34c759]" />
                </div>
                <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-2">
                  Stock Reinvestment Simulator
                </h3>
                <p className="text-[14px] text-[#86868b] max-w-md mx-auto leading-relaxed">
                  Configure your stock assumptions above and click Calculate to see how reinvesting property cash flow and mortgage cashback into high-dividend stocks can accelerate your wealth.
                </p>
              </div>
            )}
          </>
        )}

        {/* ========== TAB 3: Combined Portfolio ========== */}
        {activeMainTab === "combined" && results && stockResults && lastStockInputs && lastInputs && (
          <CombinedPortfolioView
            propertyResults={results}
            stockResults={stockResults}
            stockInputs={lastStockInputs}
            propertyInputs={lastInputs}
          />
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
            stockResults={stockResults}
            stockInputs={lastStockInputs}
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

      {/* Save as Portfolio Dialog */}
      <Dialog open={showPortfolioSaveDialog} onOpenChange={setShowPortfolioSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold text-[#1d1d1f]">Save as Portfolio</DialogTitle>
          </DialogHeader>
          <p className="text-[14px] text-[#86868b] mt-1">
            Save your current property{stockResults ? " and stock" : ""} analysis as a portfolio for future reference.
          </p>
          <Input
            value={portfolioName}
            onChange={(e) => setPortfolioName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && portfolioName.trim()) handleSaveAsPortfolio();
            }}
            placeholder="e.g. Conservative Growth Plan"
            className="mt-3"
            autoFocus
          />
          <div className="mt-2 p-3 bg-[#f5f5f7] rounded-lg text-[12px] text-[#86868b] space-y-1">
            <p>Property: <strong className="text-[#1d1d1f]">RM {results ? Math.round(results.results30.netEquity).toLocaleString() : 0}</strong> equity at 30 years</p>
            {stockResults && (
              <p>Stock: <strong className="text-[#34c759]">RM {Math.round(stockResults.stock30Year.portfolioValue).toLocaleString()}</strong> portfolio at 30 years</p>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowPortfolioSaveDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#34c759] hover:bg-[#2db84e] text-white"
              disabled={!portfolioName.trim() || savePortfolioMutation.isPending}
              onClick={handleSaveAsPortfolio}
            >
              {savePortfolioMutation.isPending ? "Saving..." : "Save Portfolio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ========== Combined Portfolio View ========== */
import { formatNumber } from "@/lib/calculator";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  ChartTitle, ChartTooltip, ChartLegend, Filler
);

function CombinedPortfolioView({
  propertyResults,
  stockResults,
  stockInputs,
  propertyInputs,
}: {
  propertyResults: FullSimulationResult;
  stockResults: StockSimulationResult;
  stockInputs: StockInputs;
  propertyInputs: CalculatorInputs;
}) {
  const s10 = stockResults.stock10Year;
  const s20 = stockResults.stock20Year;
  const s30 = stockResults.stock30Year;
  const p10 = propertyResults.results10;
  const p20 = propertyResults.results20;
  const p30 = propertyResults.results30;

  const combined10 = p10.netEquity + s10.portfolioValue;
  const combined20 = p20.netEquity + s20.portfolioValue;
  const combined30 = p30.netEquity + s30.portfolioValue;

  const lastStock = stockResults.yearlyData[stockResults.yearlyData.length - 1];

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <div>
        <h2 className="text-[22px] md:text-[28px] font-semibold text-[#1d1d1f] tracking-tight">
          Combined Portfolio Overview
        </h2>
        <p className="text-[14px] text-[#86868b] mt-1">
          Your total wealth from property investment and stock reinvestment combined.
        </p>
      </div>

      {/* Combined Net Worth Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "10-Year Combined", combined: combined10, property: p10.netEquity, stock: s10.portfolioValue },
          { label: "20-Year Combined", combined: combined20, property: p20.netEquity, stock: s20.portfolioValue },
          { label: "30-Year Combined", combined: combined30, property: p30.netEquity, stock: s30.portfolioValue },
        ].map((m) => (
          <div key={m.label} className="apple-card p-5 md:p-6 border-t-[3px] border-t-[#5856d6]">
            <p className="text-[12px] font-medium text-[#86868b] uppercase tracking-wider mb-2">
              {m.label}
            </p>
            <p className="text-[26px] md:text-[30px] font-semibold text-[#5856d6] tracking-tight leading-none">
              <span className="text-[18px] md:text-[20px] font-medium text-[#86868b] mr-1">RM</span>
              {formatNumber(Math.round(m.combined))}
            </p>
            <div className="mt-3 pt-3 border-t border-[#f5f5f7] grid grid-cols-2 gap-2">
              <div>
                <p className="text-[11px] text-[#86868b]">Property</p>
                <p className="text-[14px] font-semibold text-[#0071e3]">RM {formatNumber(Math.round(m.property))}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#86868b]">Stock</p>
                <p className="text-[14px] font-semibold text-[#34c759]">RM {formatNumber(Math.round(m.stock))}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Allocation Breakdown */}
      <div className="apple-card p-5 md:p-6">
        <h3 className="text-[16px] font-semibold text-[#1d1d1f] mb-4">30-Year Wealth Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-[#0071e3]/5 rounded-[12px]">
            <p className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1">Property Equity</p>
            <p className="text-[20px] font-semibold text-[#0071e3]">RM {formatNumber(Math.round(p30.netEquity))}</p>
            <p className="text-[12px] text-[#86868b] mt-1">{combined30 > 0 ? ((p30.netEquity / combined30) * 100).toFixed(1) : 0}% of total</p>
          </div>
          <div className="text-center p-4 bg-[#34c759]/5 rounded-[12px]">
            <p className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1">Stock Portfolio</p>
            <p className="text-[20px] font-semibold text-[#34c759]">RM {formatNumber(Math.round(s30.portfolioValue))}</p>
            <p className="text-[12px] text-[#86868b] mt-1">{combined30 > 0 ? ((s30.portfolioValue / combined30) * 100).toFixed(1) : 0}% of total</p>
          </div>
          <div className="text-center p-4 bg-[#ff9500]/5 rounded-[12px]">
            <p className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1">Total Dividends</p>
            <p className="text-[20px] font-semibold text-[#ff9500]">RM {formatNumber(Math.round(lastStock?.cumulativeDividends ?? 0))}</p>
            <p className="text-[12px] text-[#86868b] mt-1">Cumulative income</p>
          </div>
          <div className="text-center p-4 bg-[#5856d6]/5 rounded-[12px]">
            <p className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1">Properties Owned</p>
            <p className="text-[20px] font-semibold text-[#5856d6]">{p30.propertiesOwned}</p>
            <p className="text-[12px] text-[#86868b] mt-1">Total assets: RM {formatNumber(Math.round(p30.totalAssetValue))}</p>
          </div>
        </div>
      </div>

      {/* Combined Growth Chart */}
      <div className="apple-card p-5 md:p-6">
        <h3 className="text-[16px] font-semibold text-[#1d1d1f] mb-1">Portfolio Growth Over Time</h3>
        <p className="text-[13px] text-[#86868b] mb-4">Property equity, stock value, and combined net worth across 30 years.</p>
        <div className="h-[360px] md:h-[420px]">
          <Line
            data={{
              labels: stockResults.yearlyData.map((d) => String(d.calendarYear)),
              datasets: [
                {
                  label: "Combined Net Worth",
                  data: stockResults.yearlyData.map((d) => d.combinedNetWorth),
                  borderColor: "#5856d6",
                  backgroundColor: "rgba(88, 86, 214, 0.06)",
                  borderWidth: 3,
                  fill: true,
                  tension: 0.4,
                  pointRadius: 0,
                  pointHoverRadius: 6,
                  pointHoverBackgroundColor: "#5856d6",
                  order: 0,
                },
                {
                  label: "Stock Portfolio",
                  data: stockResults.yearlyData.map((d) => d.stockPortfolioValue),
                  borderColor: "#34c759",
                  backgroundColor: "rgba(52, 199, 89, 0.04)",
                  borderWidth: 2.5,
                  fill: true,
                  tension: 0.4,
                  pointRadius: 0,
                  pointHoverRadius: 5,
                  pointHoverBackgroundColor: "#34c759",
                  order: 1,
                },
                {
                  label: "Property Equity",
                  data: stockResults.yearlyData.map((d) => d.propertyNetEquity),
                  borderColor: "#0071e3",
                  backgroundColor: "rgba(0, 113, 227, 0.04)",
                  borderWidth: 2.5,
                  fill: true,
                  tension: 0.4,
                  pointRadius: 0,
                  pointHoverRadius: 5,
                  pointHoverBackgroundColor: "#0071e3",
                  order: 2,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: {
                mode: "index" as const,
                intersect: false,
              },
              plugins: {
                title: { display: false },
                legend: {
                  position: "top" as const,
                  align: "center" as const,
                  labels: {
                    font: { family: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", size: 12, weight: 500 },
                    color: "#86868b",
                    padding: 20,
                    usePointStyle: true,
                    pointStyleWidth: 8,
                    boxHeight: 8,
                  },
                },
                tooltip: {
                  mode: "index" as const,
                  intersect: false,
                  backgroundColor: "rgba(29, 29, 31, 0.95)",
                  titleFont: { family: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", size: 13, weight: "bold" as const },
                  bodyFont: { family: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", size: 12 },
                  padding: 14,
                  cornerRadius: 10,
                  displayColors: true,
                  boxPadding: 4,
                  callbacks: {
                    label: (ctx: any) => `${ctx.dataset.label}: RM ${formatNumber(ctx.raw.toFixed(0))}`,
                  },
                },
              },
              scales: {
                x: {
                  grid: { display: false },
                  border: { display: false },
                  ticks: {
                    font: { family: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", size: 11 },
                    color: "#86868b",
                    maxRotation: 45,
                  },
                },
                y: {
                  grid: { color: "rgba(0,0,0,0.04)" },
                  border: { display: false },
                  ticks: {
                    font: { family: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", size: 11 },
                    color: "#86868b",
                    callback: (v: any) => "RM " + formatNumber(Number(v)),
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Year-by-Year Combined Summary */}
      <div className="apple-card overflow-hidden">
        <div className="p-5 md:p-6">
          <h3 className="text-[16px] font-semibold text-[#1d1d1f] mb-4">Year-by-Year Combined Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr>
                  <th className="text-left py-3 px-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider border-b-2 border-[#e5e5ea]">Year</th>
                  <th className="text-right py-3 px-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider border-b-2 border-[#e5e5ea]">Properties</th>
                  <th className="text-right py-3 px-3 text-[11px] font-semibold text-[#0071e3] uppercase tracking-wider border-b-2 border-[#e5e5ea]">Property Equity</th>
                  <th className="text-right py-3 px-3 text-[11px] font-semibold text-[#34c759] uppercase tracking-wider border-b-2 border-[#e5e5ea]">Stock Value</th>
                  <th className="text-right py-3 px-3 text-[11px] font-semibold text-[#ff9500] uppercase tracking-wider border-b-2 border-[#e5e5ea]">Annual Dividend</th>
                  <th className="text-right py-3 px-3 text-[11px] font-semibold text-[#5856d6] uppercase tracking-wider border-b-2 border-[#e5e5ea]">Combined Net Worth</th>
                </tr>
              </thead>
              <tbody>
                {stockResults.yearlyData.map((sRow) => {
                  const pRow = propertyResults.yearlyData.find((d) => d.year === sRow.year);
                  if (!pRow) return null;
                  const isMilestone = sRow.year === 10 || sRow.year === 20 || sRow.year === 30;
                  return (
                    <tr
                      key={sRow.year}
                      className={`border-b border-[#f5f5f7] hover:bg-[#f5f5f7]/60 transition-colors
                        ${isMilestone ? "bg-[#5856d6]/3 font-medium" : ""}
                      `}
                    >
                      <td className="py-2.5 px-3 text-[13px] text-[#1d1d1f]">{sRow.calendarYear}</td>
                      <td className="py-2.5 px-3 text-[13px] text-right text-[#1d1d1f]">{pRow.propertiesOwned}</td>
                      <td className="py-2.5 px-3 text-[13px] text-right text-[#0071e3]">RM {formatNumber(Math.round(pRow.netEquity))}</td>
                      <td className="py-2.5 px-3 text-[13px] text-right text-[#34c759]">RM {formatNumber(Math.round(sRow.stockPortfolioValue))}</td>
                      <td className="py-2.5 px-3 text-[13px] text-right text-[#ff9500]">
                        {sRow.annualDividendIncome > 0 ? `RM ${formatNumber(Math.round(sRow.annualDividendIncome))}` : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-[13px] text-right font-semibold text-[#5856d6]">
                        RM {formatNumber(Math.round(sRow.combinedNetWorth))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Key Assumptions */}
      <div className="apple-card p-5 md:p-6">
        <h3 className="text-[16px] font-semibold text-[#1d1d1f] mb-4">Key Assumptions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-[13px] font-semibold text-[#0071e3] uppercase tracking-wider mb-3">Property</h4>
            <div className="space-y-2 text-[14px] text-[#424245]">
              <p>Purchase Price: <strong>RM {formatNumber(propertyInputs.purchasePrice)}</strong></p>
              <p>Appreciation: <strong>{propertyInputs.appreciationRate}%</strong> per year</p>
              <p>Rental Yield: <strong>{propertyInputs.rentalYield}%</strong></p>
              <p>Interest Rate: <strong>{propertyInputs.interestRate}%</strong></p>
              <p>Max Properties: <strong>{propertyInputs.maxProperties}</strong></p>
            </div>
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-[#34c759] uppercase tracking-wider mb-3">Stock</h4>
            <div className="space-y-2 text-[14px] text-[#424245]">
              <p>Dividend Yield: <strong>{stockInputs.stockDividendYield}%</strong></p>
              <p>Buy Discount: <strong>{stockInputs.stockDiscount}%</strong> below market</p>
              <p>Appreciation: <strong>{stockInputs.stockAppreciation}%</strong> per year</p>
              <p>DRIP: <strong>{stockInputs.reinvestDividends ? "Enabled" : "Disabled"}</strong></p>
              <p>Cashback/Property: <strong>RM {formatNumber(Math.max(0, propertyInputs.loanAmount - propertyInputs.purchasePrice))}</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
