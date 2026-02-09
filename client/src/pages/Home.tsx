/*
 * Professional financial app — Google-style clean UI
 * Blue/white/black brand. White background. No hero image.
 * Original layout: header → inputs grid → calculate button → results below.
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
    };
    setResults(calculatePropertyPlan(defaultInputs));
  }, []);

  const handleCalculate = useCallback((inputs: CalculatorInputs) => {
    const result = calculatePropertyPlan(inputs);
    setResults(result);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Clean Header — blue gradient, no image */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="container py-6 md:py-8 text-center">
          <h1 className="text-2xl md:text-3xl font-medium mb-1.5">
            🏠 Property Investment Net Equity Simulator
          </h1>
          <p className="text-sm md:text-base text-blue-100 font-light">
            Find out how your property portfolio grows over time
          </p>
        </div>
      </header>

      {/* Main Content — single column, top-down flow */}
      <main className="container py-6 md:py-8 space-y-6">
        {/* Input Section */}
        <InputPanel onCalculate={handleCalculate} />

        {/* Results Section */}
        {results && <ResultsPanel results={results} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200">
        <div className="container py-5 text-center">
          <p className="text-xs text-gray-400">
            Powered by PropertyLab · This calculator provides estimates only. Consult with a financial advisor for personalized advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
