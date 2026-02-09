/*
 * Apple-level UI/UX: floating shadow cards, filled inputs, generous spacing,
 * refined typography hierarchy, tactile button with hover lift.
 * Supports external inputs (for loading saved scenarios).
 * Includes expense input (fixed RM or % of purchase price).
 */

import { useState, useCallback, useEffect, useImperativeHandle, forwardRef } from "react";
import type { CalculatorInputs } from "@/lib/calculator";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

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
  expenseType: "percentage",
  expenseValue: 0,
};

const InputPanel = forwardRef<InputPanelRef, InputPanelProps>(
  ({ onCalculate, externalInputs }, ref) => {
    const [inputs, setInputs] = useState<CalculatorInputs>(DEFAULT_INPUTS);

    // When externalInputs change (scenario loaded), update local state
    // Handle backward compatibility for saved scenarios without expense fields
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

    return (
      <div className="space-y-6">
        {/* 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* Property Details */}
          <div className="apple-card p-6 md:p-7">
            <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-5 tracking-tight">
              Property Details
            </h3>
            <div className="space-y-5">
              <div>
                <FieldLabel>Purchase Price (RM)</FieldLabel>
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
                <FieldLabel>Loan Type</FieldLabel>
                <select
                  value={String(inputs.loanType)}
                  onChange={(e) => updateInput("loanType", parseFloat(e.target.value))}
                  className="apple-input w-full"
                >
                  <option value="0.9">90% Loan</option>
                  <option value="1">100% Loan (Full Financing)</option>
                </select>
              </div>

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

              <div className="flex items-center gap-3 pt-1">
                <Checkbox
                  id="belowMarket"
                  checked={inputs.belowMarketValue}
                  onCheckedChange={(checked) => updateInput("belowMarketValue", checked === true)}
                  className="rounded-[5px] border-[#d2d2d7] data-[state=checked]:bg-[#0071e3] data-[state=checked]:border-[#0071e3]"
                />
                <Label htmlFor="belowMarket" className="text-[14px] text-[#1d1d1f] cursor-pointer select-none">
                  Buy below market value
                </Label>
              </div>

              {inputs.belowMarketValue && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                  <FieldLabel tip="Percentage below market value (e.g., 10% means you buy at 90% of market value)">
                    Purchase Discount (%)
                  </FieldLabel>
                  <input
                    type="number"
                    value={inputs.discountPercentage}
                    onChange={(e) => updateInput("discountPercentage", parseFloat(e.target.value) || 0)}
                    min={1} max={50} step={1}
                    className="apple-input w-full"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Financial Assumptions */}
          <div className="apple-card p-6 md:p-7">
            <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-5 tracking-tight">
              Financial Assumptions
            </h3>
            <div className="space-y-5">
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
                <FieldLabel tip="Annual rental income as percentage of ORIGINAL property price (fixed, no inflation)">
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

              {/* Annual Expense */}
              <div className="pt-2 border-t border-[#f5f5f7]">
                <FieldLabel tip="Annual expenses per property: maintenance, tax, insurance, management fees. Set to 0 to exclude.">
                  Annual Expense / Property
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
                    % of Price
                  </button>
                </div>
                <input
                  type="number"
                  value={inputs.expenseValue}
                  onChange={(e) => updateInput("expenseValue", parseFloat(e.target.value) || 0)}
                  min={0}
                  max={inputs.expenseType === "percentage" ? 20 : 100000}
                  step={inputs.expenseType === "percentage" ? 0.5 : 1000}
                  placeholder={inputs.expenseType === "fixed" ? "e.g. 5000" : "e.g. 2"}
                  className="apple-input w-full"
                />
                {inputs.expenseValue > 0 && (
                  <p className="text-[12px] text-[#86868b] mt-1.5">
                    = RM {(inputs.expenseType === "fixed"
                      ? inputs.expenseValue
                      : inputs.purchasePrice * (inputs.expenseValue / 100)
                    ).toLocaleString("en-MY", { maximumFractionDigits: 0 })}/year per property
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

              <div>
                <FieldLabel>Loan Tenure (Years)</FieldLabel>
                <input
                  type="number"
                  value={inputs.loanTenure}
                  onChange={(e) => updateInput("loanTenure", parseInt(e.target.value) || 30)}
                  min={10} max={35} step={5}
                  className="apple-input w-full"
                />
              </div>
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
