/*
 * Professional financial app — Google-style clean UI
 * Blue/white/black brand. Inputs in top grid (original layout).
 */

import { useState, useCallback } from "react";
import type { CalculatorInputs } from "@/lib/calculator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface InputPanelProps {
  onCalculate: (inputs: CalculatorInputs) => void;
}

export default function InputPanel({ onCalculate }: InputPanelProps) {
  const [inputs, setInputs] = useState<CalculatorInputs>({
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
  });

  const updateInput = useCallback(
    (key: keyof CalculatorInputs, value: number | boolean) => {
      setInputs((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleCalculate = useCallback(() => {
    onCalculate(inputs);
  }, [inputs, onCalculate]);

  const inputClass = "h-11 text-sm bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 font-mono";

  return (
    <div className="space-y-5">
      {/* 3-column grid matching original layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Property Details */}
        <Card className="shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-gray-900 flex items-center gap-2">
              <span className="text-lg">🎯</span>
              Property Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Purchase Price (RM)</Label>
              <Input
                type="number"
                value={inputs.purchasePrice}
                onChange={(e) => updateInput("purchasePrice", parseFloat(e.target.value) || 0)}
                min={100000}
                step={50000}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Loan Type</Label>
              <Select
                value={String(inputs.loanType)}
                onValueChange={(v) => updateInput("loanType", parseFloat(v))}
              >
                <SelectTrigger className="h-11 text-sm bg-white border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.9">90% Loan</SelectItem>
                  <SelectItem value="1">100% Loan (Full Financing)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <Label className="text-xs font-medium text-gray-500">Maximum Properties</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent><p>Maximum number of properties you plan to acquire</p></TooltipContent>
                </Tooltip>
              </div>
              <Input
                type="number"
                value={inputs.maxProperties}
                onChange={(e) => updateInput("maxProperties", parseInt(e.target.value) || 1)}
                min={1} max={50} step={1}
                className={inputClass}
              />
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <Checkbox
                id="belowMarket"
                checked={inputs.belowMarketValue}
                onCheckedChange={(checked) => updateInput("belowMarketValue", checked === true)}
              />
              <Label htmlFor="belowMarket" className="text-sm text-gray-700 cursor-pointer">
                Buy below market value
              </Label>
            </div>

            {inputs.belowMarketValue && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-1">
                  <Label className="text-xs font-medium text-gray-500">Purchase Discount (%)</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent><p>Percentage below market value (e.g., 10% means you buy at 90% of market value)</p></TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  type="number"
                  value={inputs.discountPercentage}
                  onChange={(e) => updateInput("discountPercentage", parseFloat(e.target.value) || 0)}
                  min={1} max={50} step={1}
                  className={inputClass}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Assumptions */}
        <Card className="shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-gray-900 flex items-center gap-2">
              <span className="text-lg">📈</span>
              Financial Assumptions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <Label className="text-xs font-medium text-gray-500">Annual Capital Appreciation (%)</Label>
                <Tooltip>
                  <TooltipTrigger asChild><Info className="w-3 h-3 text-gray-400" /></TooltipTrigger>
                  <TooltipContent><p>Average annual increase in property value</p></TooltipContent>
                </Tooltip>
              </div>
              <Input
                type="number"
                value={inputs.appreciationRate}
                onChange={(e) => updateInput("appreciationRate", parseFloat(e.target.value) || 0)}
                min={0} max={20} step={0.5}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <Label className="text-xs font-medium text-gray-500">Gross Rental Yield (%)</Label>
                <Tooltip>
                  <TooltipTrigger asChild><Info className="w-3 h-3 text-gray-400" /></TooltipTrigger>
                  <TooltipContent><p>Annual rental income as percentage of ORIGINAL property price (fixed, no inflation)</p></TooltipContent>
                </Tooltip>
              </div>
              <Input
                type="number"
                value={inputs.rentalYield}
                onChange={(e) => updateInput("rentalYield", parseFloat(e.target.value) || 0)}
                min={0} max={20} step={0.5}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <Label className="text-xs font-medium text-gray-500">Loan Interest Rate (%)</Label>
                <Tooltip>
                  <TooltipTrigger asChild><Info className="w-3 h-3 text-gray-400" /></TooltipTrigger>
                  <TooltipContent><p>Average mortgage interest rate</p></TooltipContent>
                </Tooltip>
              </div>
              <Input
                type="number"
                value={inputs.interestRate}
                onChange={(e) => updateInput("interestRate", parseFloat(e.target.value) || 0)}
                min={0} max={10} step={0.1}
                className={inputClass}
              />
            </div>
          </CardContent>
        </Card>

        {/* Purchase Plan */}
        <Card className="shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-gray-900 flex items-center gap-2">
              <span className="text-lg">📅</span>
              Purchase Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <Label className="text-xs font-medium text-gray-500">Purchase Interval (Years)</Label>
                <Tooltip>
                  <TooltipTrigger asChild><Info className="w-3 h-3 text-gray-400" /></TooltipTrigger>
                  <TooltipContent><p>How often you buy a new property (1 = every year)</p></TooltipContent>
                </Tooltip>
              </div>
              <Input
                type="number"
                value={inputs.buyInterval}
                onChange={(e) => updateInput("buyInterval", parseInt(e.target.value) || 1)}
                min={1} max={5} step={1}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Starting Year</Label>
              <Input
                type="number"
                value={inputs.startingYear}
                onChange={(e) => updateInput("startingYear", parseInt(e.target.value) || 2026)}
                min={2024} max={2050} step={1}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Loan Tenure (Years)</Label>
              <Input
                type="number"
                value={inputs.loanTenure}
                onChange={(e) => updateInput("loanTenure", parseInt(e.target.value) || 30)}
                min={10} max={35} step={5}
                className={inputClass}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calculate Button — full width below the grid */}
      <Card className="shadow-sm border border-gray-100">
        <CardContent className="p-4">
          <Button
            onClick={handleCalculate}
            className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            Calculate My Property Plan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
