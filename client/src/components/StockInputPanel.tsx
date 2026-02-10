/**
 * Stock Reinvestment Input Panel.
 * Allows users to configure stock assumptions.
 * Cashback is auto-calculated from property inputs: loanAmount - purchasePrice (if positive).
 */

import { useState, useCallback, useEffect } from "react";
import type { StockInputs } from "@/lib/calculator";
import { formatNumber } from "@/lib/calculator";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, TrendingUp, DollarSign, ArrowRight } from "lucide-react";

interface StockInputPanelProps {
  purchasePrice: number;
  loanAmount: number;
  onCalculate: (inputs: StockInputs) => void;
  externalInputs?: StockInputs | null;
}

function FieldLabel({ children, tip }: { children: React.ReactNode; tip?: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <Label className="text-[13px] font-medium text-[#86868b]">{children}</Label>
      {tip && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="w-3.5 h-3.5 text-[#86868b]/60 hover:text-[#86868b] transition-colors" />
          </TooltipTrigger>
          <TooltipContent className="max-w-[240px] text-[13px]"><p>{tip}</p></TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

const DEFAULT_STOCK_INPUTS: StockInputs = {
  enableStockReinvestment: true,
  stockDividendYield: 6,
  stockDiscount: 20,
  stockAppreciation: 5,
  reinvestDividends: true,
};

export default function StockInputPanel({ purchasePrice, loanAmount, onCalculate, externalInputs }: StockInputPanelProps) {
  const [inputs, setInputs] = useState<StockInputs>(DEFAULT_STOCK_INPUTS);

  useEffect(() => {
    if (externalInputs) {
      setInputs({ ...DEFAULT_STOCK_INPUTS, ...externalInputs });
    }
  }, [externalInputs]);

  const updateInput = useCallback(
    (key: keyof StockInputs, value: number | boolean) => {
      setInputs((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleCalculate = useCallback(() => {
    onCalculate(inputs);
  }, [inputs, onCalculate]);

  const cashback = Math.max(0, loanAmount - purchasePrice);

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <div className="flex items-center gap-3 pb-2 border-b border-[#e5e5ea]">
        <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-[#34c759] to-[#30d158] flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-[22px] md:text-[28px] font-semibold text-[#1d1d1f] tracking-tight leading-tight">
            Stock Reinvestment Simulator
          </h2>
          <p className="text-[13px] md:text-[15px] text-[#86868b] mt-0.5 leading-relaxed">
            Reinvest positive cash flow and mortgage cashback into high-dividend stocks.
          </p>
        </div>
      </div>

      {/* Cashback Info Banner */}
      <div className={`
        rounded-[12px] p-4 border flex items-center gap-4
        ${cashback > 0
          ? "bg-[#34c759]/5 border-[#34c759]/20"
          : "bg-[#f5f5f7] border-[#e5e5ea]"
        }
      `}>
        <DollarSign className={`w-5 h-5 shrink-0 ${cashback > 0 ? "text-[#34c759]" : "text-[#86868b]"}`} />
        <div className="flex-1">
          <div className="flex items-center gap-2 text-[13px] flex-wrap">
            <span className="text-[#86868b]">Mortgage Cashback:</span>
            <span className="text-[#1d1d1f]">RM {formatNumber(Math.round(loanAmount))}</span>
            <span className="text-[#86868b]">−</span>
            <span className="text-[#1d1d1f]">RM {formatNumber(Math.round(purchasePrice))}</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#86868b]" />
            <span className={`font-semibold ${cashback > 0 ? "text-[#34c759]" : "text-[#86868b]"}`}>
              RM {formatNumber(Math.round(cashback))}
            </span>
            <span className="text-[#86868b]">per property</span>
          </div>
          {cashback > 0 && (
            <p className="text-[11px] text-[#34c759] mt-1">
              Cashback from each property is reinvested into stocks at time of purchase
            </p>
          )}
          {cashback === 0 && (
            <p className="text-[11px] text-[#86868b] mt-1">
              No cashback — loan amount ≤ purchase price. Only positive cash flow will be reinvested.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Stock Assumptions Card */}
        <div className="apple-card p-6 md:p-7">
          <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-5 tracking-tight">
            Stock Assumptions
          </h3>
          <div className="space-y-5">
            <div>
              <FieldLabel tip="Annual dividend yield of the high-dividend stocks you're investing in. Typical high-dividend stocks yield 5-8%.">
                Dividend Yield (%)
              </FieldLabel>
              <input
                type="number"
                value={inputs.stockDividendYield}
                onChange={(e) => updateInput("stockDividendYield", parseFloat(e.target.value) || 0)}
                min={0} max={20} step={0.5}
                className="apple-input w-full"
              />
            </div>

            <div>
              <FieldLabel tip="How much below market value you buy the stock. E.g., 20% means you buy at RM 0.80 for a stock worth RM 1.00.">
                Buy Below Market Value (%)
              </FieldLabel>
              <input
                type="number"
                value={inputs.stockDiscount}
                onChange={(e) => updateInput("stockDiscount", parseFloat(e.target.value) || 0)}
                min={0} max={50} step={5}
                className="apple-input w-full"
              />
            </div>

            <div>
              <FieldLabel tip="Expected annual stock price appreciation (capital growth). This is separate from dividends.">
                Annual Appreciation (%)
              </FieldLabel>
              <input
                type="number"
                value={inputs.stockAppreciation}
                onChange={(e) => updateInput("stockAppreciation", parseFloat(e.target.value) || 0)}
                min={0} max={20} step={0.5}
                className="apple-input w-full"
              />
            </div>
          </div>
        </div>

        {/* Reinvestment Strategy Card */}
        <div className="apple-card p-6 md:p-7">
          <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-5 tracking-tight">
            Reinvestment Strategy
          </h3>
          <div className="space-y-5">
            {/* DRIP Toggle */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="drip"
                checked={inputs.reinvestDividends}
                onCheckedChange={(checked) => updateInput("reinvestDividends", !!checked)}
                className="mt-0.5"
              />
              <div>
                <label htmlFor="drip" className="text-[14px] font-medium text-[#1d1d1f] cursor-pointer">
                  Reinvest dividends (DRIP)
                </label>
                <p className="text-[12px] text-[#86868b] mt-0.5">
                  {inputs.reinvestDividends
                    ? "Dividends are automatically reinvested to buy more shares"
                    : "Dividends are taken as cash income"
                  }
                </p>
              </div>
            </div>

            {/* Summary of investment sources */}
            <div className="rounded-[10px] bg-[#f5f5f7] p-4 space-y-3">
              <p className="text-[12px] font-medium text-[#86868b] uppercase tracking-wider">Investment Sources</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#86868b]">Positive Cash Flow</span>
                  <span className="text-[#34c759] font-medium">Auto-reinvested</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#86868b]">Mortgage Cashback</span>
                  <span className={`font-medium ${cashback > 0 ? "text-[#34c759]" : "text-[#86868b]"}`}>
                    {cashback > 0 ? `RM ${formatNumber(Math.round(cashback))}/property` : "None"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#86868b]">Dividend Reinvestment</span>
                  <span className={`font-medium ${inputs.reinvestDividends ? "text-[#34c759]" : "text-[#ff9500]"}`}>
                    {inputs.reinvestDividends ? "DRIP Active" : "Cash Out"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calculate Button */}
      <div className="flex justify-center">
        <button
          onClick={handleCalculate}
          className="
            px-12 py-3.5 text-[17px] font-medium text-white
            bg-gradient-to-r from-[#34c759] to-[#30d158]
            hover:from-[#2db84e] hover:to-[#28c04d]
            rounded-[12px] transition-all duration-200
            shadow-[0_2px_8px_rgba(52,199,89,0.25)]
            hover:shadow-[0_4px_16px_rgba(52,199,89,0.35)]
            hover:-translate-y-[1px]
            active:translate-y-0 active:shadow-[0_1px_4px_rgba(52,199,89,0.2)]
            focus:outline-none focus:ring-4 focus:ring-[#34c759]/20
          "
        >
          Calculate Stock Reinvestment
        </button>
      </div>
    </div>
  );
}
