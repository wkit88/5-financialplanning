/*
 * Design: "Wealth Canvas" — Editorial Finance Magazine
 * Layout: Hero banner → Sidebar inputs + Main results (magazine-style)
 * Color: Forest green primary, warm off-white bg, charcoal text, gold accents
 * Typography: Playfair Display headers, Source Sans 3 body, JetBrains Mono data
 */

import { useState, useCallback, useEffect } from "react";
import InputPanel from "@/components/InputPanel";
import ResultsPanel from "@/components/ResultsPanel";
import {
  calculatePropertyPlan,
  type CalculatorInputs,
  type FullSimulationResult,
} from "@/lib/calculator";
import { motion, AnimatePresence } from "framer-motion";
import { Building2 } from "lucide-react";

const HERO_IMAGE =
  "https://private-us-east-1.manuscdn.com/sessionFile/rxOgm3BRlAltV98wh6ez4U/sandbox/kAE1qYe6Kid2by2KpWXNdA-img-1_1770658203000_na1fn_aGVyby1wcm9wZXJ0eQ.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvcnhPZ20zQlJsQWx0Vjk4d2g2ZXo0VS9zYW5kYm94L2tBRTFxWWU2S2lkMmJ5MktwV1hOZEEtaW1nLTFfMTc3MDY1ODIwMzAwMF9uYTFmbl9hR1Z5Ynkxd2NtOXdaWEowZVEuanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=X0LHGplHcIKRfsqawOVF44yVxOCx54xup~SxcrVNiWoBSsmlyma-sre6Dvf-JWi9MVXZEfbDDYmW-qwJLQ0pSLMinpU9ZLqpUau9tdmIwaYRPSzi3oGr9GGO11tjxXWD0j9Tg5EAWcKfb~~3OJOTD7qX-DNSBx74K8AhBXubcERHG4iB4ys5NOsPydAViy6FX~d~zh-789h6ZK9NFPjVN37RmrV8zEgFvtt1NMMuQjAS-3-4suCMvfOC10KoeLqGa2kmn7Perm5PnRC-m99BPUtG~JSPgHaxgzXcsSusDeS5it13hgPLh1REXWOell-vydCbyUXZro9v10e-5FSZ1g__";

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
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={HERO_IMAGE}
            alt="Luxury residential neighborhood"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        </div>
        <div className="relative container py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70 font-body">
                PropertyLab
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-4">
              Net Equity
              <br />
              <span className="text-amber-300">Simulator</span>
            </h1>
            <p className="text-base md:text-lg text-white/80 font-body font-light leading-relaxed max-w-lg">
              Discover how your property portfolio grows over time. Model
              multiple properties, financing options, and market scenarios.
            </p>
          </motion.div>
        </div>
        {/* Decorative bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent" />
      </header>

      {/* Main Content */}
      <main className="container py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Left: Input Panel (Sidebar on desktop) */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-4 xl:col-span-4"
          >
            <div className="lg:sticky lg:top-6">
              <InputPanel onCalculate={handleCalculate} />
            </div>
          </motion.aside>

          {/* Right: Results Panel */}
          <div className="lg:col-span-8 xl:col-span-8">
            <AnimatePresence mode="wait">
              {results && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <ResultsPanel results={results} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-display font-semibold text-foreground">
                PropertyLab
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-body text-center md:text-right max-w-md">
              This calculator provides estimates only. Consult with a financial
              advisor for personalized advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
