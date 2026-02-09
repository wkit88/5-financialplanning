/*
 * Home page — integrates InputPanel, ResultsPanel, SavedScenarios, and CompareScenarios.
 * Save dialog appears after calculation. Load scenario populates inputs.
 * Compare mode shows side-by-side comparison of two selected scenarios.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import InputPanel, { type InputPanelRef } from "@/components/InputPanel";
import ResultsPanel from "@/components/ResultsPanel";
import SavedScenarios from "@/components/SavedScenarios";
import CompareScenarios from "@/components/CompareScenarios";
import {
  calculatePropertyPlan,
  type CalculatorInputs,
  type FullSimulationResult,
} from "@/lib/calculator";
import { useScenarios, type SavedScenario } from "@/hooks/useScenarios";
import { toast } from "sonner";
import { Bookmark } from "lucide-react";

export default function Home() {
  const [results, setResults] = useState<FullSimulationResult | null>(null);
  const [lastInputs, setLastInputs] = useState<CalculatorInputs | null>(null);
  const [externalInputs, setExternalInputs] = useState<CalculatorInputs | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [compareA, setCompareA] = useState<SavedScenario | null>(null);
  const [compareB, setCompareB] = useState<SavedScenario | null>(null);
  const inputPanelRef = useRef<InputPanelRef>(null);
  const compareRef = useRef<HTMLDivElement>(null);

  const { scenarios, saveScenario, deleteScenario, renameScenario } = useScenarios();

  // Run default calculation on mount
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
  }, []);

  const handleLoadScenario = useCallback((inputs: CalculatorInputs) => {
    setExternalInputs({ ...inputs });
    const result = calculatePropertyPlan(inputs);
    setResults(result);
    setLastInputs(inputs);
    toast.success("Scenario loaded — inputs updated and recalculated.");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    // If deleting a scenario that's in comparison, close comparison
    if (compareA?.id === id || compareB?.id === id) {
      setCompareA(null);
      setCompareB(null);
    }
    toast("Scenario deleted.");
  }, [deleteScenario, compareA, compareB]);

  const handleCompare = useCallback((a: SavedScenario, b: SavedScenario) => {
    setCompareA(a);
    setCompareB(b);
    // Scroll to comparison after a brief delay for render
    setTimeout(() => {
      compareRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, []);

  const handleCloseCompare = useCallback(() => {
    setCompareA(null);
    setCompareB(null);
  }, []);

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

      {/* Page Title */}
      <div className="container pt-8 pb-2">
        <h2 className="text-[28px] md:text-[34px] font-semibold text-[#1d1d1f] tracking-tight leading-tight">
          Property Investment Simulator
        </h2>
        <p className="text-[15px] md:text-[17px] text-[#86868b] mt-2 leading-relaxed">
          Model your portfolio growth over 10, 20, and 30 years.
        </p>
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
          <div className="flex justify-center">
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
