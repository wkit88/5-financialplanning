/*
 * Apple-level UI/UX: floating shadow cards, filled inputs, generous spacing,
 * refined typography hierarchy, tactile button with hover lift.
 * Supports external inputs (for loading saved scenarios).
 * Includes monthly expense input (fixed RM or % of instalment).
 */

import { useState, useCallback, useEffect, useImperativeHandle, forwardRef } from "react";
import type { CalculatorInputs } from "@/lib/calculator";
import { calculateTenure } from "@/lib/calculator";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, AlertCircle } from "lucide-react";

interface InputPanelProps {
  onCalculate: (inputs: CalculatorInputs) => void;
  externalInputs?: CalculatorInputs | null;
}

export interface InputPanelRef {
  getInputs: () => CalculatorInputs;
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

const DEFAULT_INPUTS: CalculatorInputs = {
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
  expenseType: "percentage",
  expenseValue: 0,
};

const InputPanel = forwardRef<InputPanelRef, InputPanelProps>(
  ({ onCalculate, externalInputs }, ref) => {
    const [inputs, setInputs] = useState<CalculatorInputs>(DEFAULT_INPUTS);

    // When externalInputs change (scenario loaded), update local state
    useEffect(() => {
      if (externalInputs) {
        setInputs({
          ...DEFAULT_INPUTS,
          ...externalInputs,
          expenseType: externalInputs.expenseType || "percentage",
          expenseValue: externalInputs.expenseValue ?? 0,
        });
      }
    }, [externalInputs]);

    useImperativeHandle(ref, () => ({
      getInputs: () => inputs,
    }), [inputs]);

    const updateInput = useCallback(
      (key: keyof CalculatorInputs, value: number | boolean | string) => {
        setInputs((prev) => ({ ...prev, [key]: value }));
      },
      []
    );

    const handleCalculate = useCallback(() => {
      onCalculate(inputs);
    }, [inputs, onCalculate]);

    // Derived values
    const loanTenure = calculateTenure(inputs.age);
    const cashback = Math.max(0, inputs.loanAmount - inputs.purchasePrice);

    // Estimate monthly payment for expense preview
    const monthlyRate = (inputs.interestRate / 100) / 12;
    const numPayments = loanTenure * 12;
    const estimatedMonthlyPayment = monthlyRate === 0
      ? inputs.loanAmount / numPayments
      : (inputs.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);

    const monthlyExpense = inputs.expenseType === "fixed"
      ? inputs.expenseValue
      : estimatedMonthlyPayment * (inputs.expenseValue / 100);

    return (
      <div className="space-y-6">
        {/* Explanation note */}
        <div className="flex items-start gap-3 bg-[#f0f5ff] border border-[#0071e3]/10 rounded-[12px] px-5 py-4">
          <AlertCircle className="w-5 h-5 text-[#0071e3] mt-0.5 shrink-0" />
          <p className="text-[13px] text-[#424245] leading-relaxed">
            This simulator assumes you purchase multiple properties with the <strong>same purchase price</strong>, <strong>same market value</strong>, and <strong>same financial assumptions</strong> as defined below. Each property follows an identical loan, rental, and expense structure.
          </p>
        </div>

        {/* 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* Property Details */}
          <div className="apple-card p-6 md:p-7">
            <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-5 tracking-tight">
              Property Details
            </h3>
            <div className="space-y-5">
              <div>
                <FieldLabel tip="The price you pay for each property">Purchase Price (RM)</FieldLabel>
                <input
                  type="number"
                  value={inputs.purchasePrice}
                  onChange={(e) => updateInput("purchasePrice", parseFloat(e.target.value) || 0)}
                  min={100000}
                  step={50000}
                  className="apple-input w-full"
                />
              </div>

              <div>
                <FieldLabel tip="The actual market value of the property. If higher than purchase price, you're buying below market value.">
                  Current Market Value (RM)
                </FieldLabel>
                <input
                  type="number"
                  value={inputs.currentMarketValue}
                  onChange={(e) => updateInput("currentMarketValue", parseFloat(e.target.value) || 0)}
                  min={100000}
                  step={50000}
                  className="apple-input w-full"
                />
                {inputs.currentMarketValue > inputs.purchasePrice && (
                  <p className="text-[12px] text-[#34c759] mt-1.5 font-medium">
                    Buying {((1 - inputs.purchasePrice / inputs.currentMarketValue) * 100).toFixed(1)}% below market value
                  </p>
                )}
                {inputs.currentMarketValue < inputs.purchasePrice && (
                  <p className="text-[12px] text-[#ff9500] mt-1.5 font-medium">
                    Market value is below purchase price
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Financial Assumptions */}
          <div className="apple-card p-6 md:p-7">
            <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-5 tracking-tight">
              Financial Assumptions
            </h3>
            <div className="space-y-5">
              <div>
                <FieldLabel tip="Total loan amount from the bank per property">Loan Amount (RM)</FieldLabel>
                <input
                  type="number"
                  value={inputs.loanAmount}
                  onChange={(e) => updateInput("loanAmount", parseFloat(e.target.value) || 0)}
                  min={0}
                  step={50000}
                  className="apple-input w-full"
                />
                {cashback > 0 && (
                  <p className="text-[12px] text-[#34c759] mt-1.5 font-medium">
                    Cashback: RM {cashback.toLocaleString("en-MY")} per property (Loan &gt; Purchase Price)
                  </p>
                )}
                {inputs.loanAmount > 0 && (
                  <p className="text-[12px] text-[#86868b] mt-1">
                    LTV: {((inputs.loanAmount / inputs.currentMarketValue) * 100).toFixed(0)}% of market value
                  </p>
                )}
              </div>

              <div>
                <FieldLabel tip="Average mortgage interest rate">Loan Interest Rate (%)</FieldLabel>
                <input
                  type="number"
                  value={inputs.interestRate}
                  onChange={(e) => updateInput("interestRate", parseFloat(e.target.value) || 0)}
                  min={0} max={10} step={0.1}
                  className="apple-input w-full"
                />
              </div>

              <div>
                <FieldLabel tip="Average annual increase in property value">Annual Capital Appreciation (%)</FieldLabel>
                <input
                  type="number"
                  value={inputs.appreciationRate}
                  onChange={(e) => updateInput("appreciationRate", parseFloat(e.target.value) || 0)}
                  min={0} max={20} step={0.5}
                  className="apple-input w-full"
                />
              </div>

              <div>
                <FieldLabel tip="Annual rental income as percentage of ORIGINAL purchase price (fixed, no inflation)">
                  Gross Rental Yield (%)
                </FieldLabel>
                <input
                  type="number"
                  value={inputs.rentalYield}
                  onChange={(e) => updateInput("rentalYield", parseFloat(e.target.value) || 0)}
                  min={0} max={20} step={0.5}
                  className="apple-input w-full"
                />
              </div>

              {/* Monthly Expense */}
              <div className="pt-2 border-t border-[#f5f5f7]">
                <FieldLabel tip="Monthly expenses per property: maintenance, tax, insurance, management fees. % mode is based on monthly instalment amount.">
                  Monthly Expense / Property
                </FieldLabel>
                {/* Type toggle */}
                <div className="flex rounded-[8px] bg-[#f5f5f7] p-0.5 mb-3">
                  <button
                    type="button"
                    onClick={() => updateInput("expenseType", "fixed")}
                    className={`
                      flex-1 py-1.5 text-[13px] font-medium rounded-[7px] transition-all duration-200
                      ${inputs.expenseType === "fixed"
                        ? "bg-white text-[#1d1d1f] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                        : "text-[#86868b] hover:text-[#1d1d1f]"
                      }
                    `}
                  >
                    Fixed (RM)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateInput("expenseType", "percentage")}
                    className={`
                      flex-1 py-1.5 text-[13px] font-medium rounded-[7px] transition-all duration-200
                      ${inputs.expenseType === "percentage"
                        ? "bg-white text-[#1d1d1f] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                        : "text-[#86868b] hover:text-[#1d1d1f]"
                      }
                    `}
                  >
                    % of Instalment
                  </button>
                </div>
                <input
                  type="number"
                  value={inputs.expenseValue}
                  onChange={(e) => updateInput("expenseValue", parseFloat(e.target.value) || 0)}
                  min={0}
                  max={inputs.expenseType === "percentage" ? 50 : 10000}
                  step={inputs.expenseType === "percentage" ? 1 : 100}
                  placeholder={inputs.expenseType === "fixed" ? "e.g. 500" : "e.g. 10"}
                  className="apple-input w-full"
                />
                {inputs.expenseValue > 0 && (
                  <p className="text-[12px] text-[#86868b] mt-1.5">
                    = RM {monthlyExpense.toLocaleString("en-MY", { maximumFractionDigits: 0 })}/month
                    {" "}(RM {(monthlyExpense * 12).toLocaleString("en-MY", { maximumFractionDigits: 0 })}/year) per property
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Purchase Plan */}
          <div className="apple-card p-6 md:p-7">
            <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-5 tracking-tight">
              Purchase Plan
            </h3>
            <div className="space-y-5">
              <div>
                <FieldLabel tip="Maximum number of properties you plan to acquire">Maximum Properties</FieldLabel>
                <input
                  type="number"
                  value={inputs.maxProperties}
                  onChange={(e) => updateInput("maxProperties", parseInt(e.target.value) || 1)}
                  min={1} max={50} step={1}
                  className="apple-input w-full"
                />
              </div>

              <div>
                <FieldLabel tip="How often you buy a new property (1 = every year)">Purchase Interval (Years)</FieldLabel>
                <input
                  type="number"
                  value={inputs.buyInterval}
                  onChange={(e) => updateInput("buyInterval", parseInt(e.target.value) || 1)}
                  min={1} max={5} step={1}
                  className="apple-input w-full"
                />
              </div>

              <div>
                <FieldLabel>Starting Year</FieldLabel>
                <input
                  type="number"
                  value={inputs.startingYear}
                  onChange={(e) => updateInput("startingYear", parseInt(e.target.value) || 2026)}
                  min={2024} max={2050} step={1}
                  className="apple-input w-full"
                />
              </div>

              {/* Age-based tenure */}
              <div className="pt-2 border-t border-[#f5f5f7]">
                <FieldLabel tip="Loan tenure is auto-calculated: min(70 - your age, 35 years), minimum 5 years">
                  Your Current Age
                </FieldLabel>
                <input
                  type="number"
                  value={inputs.age}
                  onChange={(e) => updateInput("age", parseInt(e.target.value) || 25)}
                  min={18} max={65} step={1}
                  className="apple-input w-full"
                />
                <div className="mt-2 bg-[#f5f5f7] rounded-[8px] px-3 py-2">
                  <p className="text-[12px] text-[#86868b]">
                    Loan Tenure: <span className="font-semibold text-[#1d1d1f]">{loanTenure} years</span>
                  </p>
                  <p className="text-[11px] text-[#86868b] mt-0.5">
                    Formula: min(70 − {inputs.age}, 35) = {loanTenure}
                  </p>
                </div>
              </div>

              {/* Monthly instalment preview */}
              {inputs.loanAmount > 0 && (
                <div className="bg-[#f0f5ff] rounded-[8px] px-3 py-2">
                  <p className="text-[12px] text-[#86868b]">
                    Est. Monthly Instalment:
                  </p>
                  <p className="text-[15px] font-semibold text-[#0071e3]">
                    RM {estimatedMonthlyPayment.toLocaleString("en-MY", { maximumFractionDigits: 0 })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Calculate Button — Apple-style tactile */}
        <div className="flex justify-center">
          <button
            onClick={handleCalculate}
            className="
              px-12 py-3.5 text-[17px] font-medium text-white
              bg-[#0071e3] hover:bg-[#0077ed]
              rounded-[12px] transition-all duration-200
              shadow-[0_2px_8px_rgba(0,113,227,0.25)]
              hover:shadow-[0_4px_16px_rgba(0,113,227,0.35)]
              hover:-translate-y-[1px]
              active:translate-y-0 active:shadow-[0_1px_4px_rgba(0,113,227,0.2)]
              focus:outline-none focus:ring-4 focus:ring-[#0071e3]/20
            "
          >
            Calculate My Property Plan
          </button>
        </div>
      </div>
    );
  }
);

InputPanel.displayName = "InputPanel";
export default InputPanel;
