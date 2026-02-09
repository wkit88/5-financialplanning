/*
 * Apple-level UI/UX: minimal header, warm gray bg, top-down flow.
 * No hero image. Clean, confident, understated.
 */

import { useState, useCallback, useEffect } from "react";
import InputPanel from "@/components/InputPanel";
import ResultsPanel from "@/components/ResultsPanel";
import {
  calculatePropertyPlan,
  type CalculatorInputs,
  type FullSimulationResult,
} from "@/lib/calculator";

export default function Home() {
  const [results, setResults] = useState<FullSimulationResult | null>(null);

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
    };
    setResults(calculatePropertyPlan(defaultInputs));
  }, []);

  const handleCalculate = useCallback((inputs: CalculatorInputs) => {
    const result = calculatePropertyPlan(inputs);
    setResults(result);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Header — Apple style */}
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
        <InputPanel onCalculate={handleCalculate} />
        {results && <ResultsPanel results={results} />}
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
