/*
 * Design: "Wealth Canvas" — Editorial Finance Magazine
 * Color: Forest green primary, warm off-white bg, charcoal text
 * Typography: Playfair Display headers, Source Sans 3 body
 * Style: Thin horizontal rules, small-caps labels, generous whitespace
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
import { Building2, TrendingUp, CalendarDays, Info, Calculator } from "lucide-react";

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

  return (
    <div className="space-y-6">
      {/* Property Details Card */}
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-xl tracking-tight flex items-center gap-2.5 text-foreground">
            <Building2 className="w-5 h-5 text-primary" />
            Property Details
          </CardTitle>
          <div className="h-px bg-gradient-to-r from-primary/30 via-primary/10 to-transparent mt-2" />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground font-body">
              Purchase Price (RM)
            </Label>
            <Input
              type="number"
              value={inputs.purchasePrice}
              onChange={(e) =>
                updateInput("purchasePrice", parseFloat(e.target.value) || 0)
              }
              min={100000}
              step={50000}
              className="font-mono text-base h-11 bg-secondary/30 border-border/60 focus:bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground font-body">
              Loan Type
            </Label>
            <Select
              value={String(inputs.loanType)}
              onValueChange={(v) => updateInput("loanType", parseFloat(v))}
            >
              <SelectTrigger className="h-11 bg-secondary/30 border-border/60 font-body">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.9">90% Loan</SelectItem>
                <SelectItem value="1">100% Loan (Full Financing)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground font-body">
                Maximum Properties
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-muted-foreground/60" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Maximum number of properties you plan to acquire</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              type="number"
              value={inputs.maxProperties}
              onChange={(e) =>
                updateInput("maxProperties", parseInt(e.target.value) || 1)
              }
              min={1}
              max={50}
              step={1}
              className="font-mono text-base h-11 bg-secondary/30 border-border/60 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-3 py-1">
            <Checkbox
              id="belowMarket"
              checked={inputs.belowMarketValue}
              onCheckedChange={(checked) =>
                updateInput("belowMarketValue", checked === true)
              }
            />
            <Label
              htmlFor="belowMarket"
              className="text-sm font-medium font-body cursor-pointer"
            >
              Buy below market value
            </Label>
          </div>

          {inputs.belowMarketValue && (
            <div className="space-y-2 pl-1 border-l-2 border-primary/20 ml-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-1.5 pl-3">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground font-body">
                  Purchase Discount (%)
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-muted-foreground/60" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Percentage below market value (e.g., 10% means you buy at
                      90% of market value)
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="pl-3">
                <Input
                  type="number"
                  value={inputs.discountPercentage}
                  onChange={(e) =>
                    updateInput(
                      "discountPercentage",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  min={1}
                  max={50}
                  step={1}
                  className="font-mono text-base h-11 bg-secondary/30 border-border/60 focus:bg-white"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Assumptions Card */}
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-xl tracking-tight flex items-center gap-2.5 text-foreground">
            <TrendingUp className="w-5 h-5 text-primary" />
            Financial Assumptions
          </CardTitle>
          <div className="h-px bg-gradient-to-r from-primary/30 via-primary/10 to-transparent mt-2" />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground font-body">
                Annual Capital Appreciation (%)
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-muted-foreground/60" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Average annual increase in property value</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              type="number"
              value={inputs.appreciationRate}
              onChange={(e) =>
                updateInput(
                  "appreciationRate",
                  parseFloat(e.target.value) || 0
                )
              }
              min={0}
              max={20}
              step={0.5}
              className="font-mono text-base h-11 bg-secondary/30 border-border/60 focus:bg-white"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground font-body">
                Gross Rental Yield (%)
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-muted-foreground/60" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Annual rental income as percentage of ORIGINAL property price
                    (fixed, no inflation)
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              type="number"
              value={inputs.rentalYield}
              onChange={(e) =>
                updateInput("rentalYield", parseFloat(e.target.value) || 0)
              }
              min={0}
              max={20}
              step={0.5}
              className="font-mono text-base h-11 bg-secondary/30 border-border/60 focus:bg-white"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground font-body">
                Loan Interest Rate (%)
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-muted-foreground/60" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Average mortgage interest rate</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              type="number"
              value={inputs.interestRate}
              onChange={(e) =>
                updateInput("interestRate", parseFloat(e.target.value) || 0)
              }
              min={0}
              max={10}
              step={0.1}
              className="font-mono text-base h-11 bg-secondary/30 border-border/60 focus:bg-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Purchase Plan Card */}
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-xl tracking-tight flex items-center gap-2.5 text-foreground">
            <CalendarDays className="w-5 h-5 text-primary" />
            Purchase Plan
          </CardTitle>
          <div className="h-px bg-gradient-to-r from-primary/30 via-primary/10 to-transparent mt-2" />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground font-body">
                Purchase Interval (Years)
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-muted-foreground/60" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>How often you buy a new property (1 = every year)</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              type="number"
              value={inputs.buyInterval}
              onChange={(e) =>
                updateInput("buyInterval", parseInt(e.target.value) || 1)
              }
              min={1}
              max={5}
              step={1}
              className="font-mono text-base h-11 bg-secondary/30 border-border/60 focus:bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground font-body">
              Starting Year
            </Label>
            <Input
              type="number"
              value={inputs.startingYear}
              onChange={(e) =>
                updateInput("startingYear", parseInt(e.target.value) || 2026)
              }
              min={2024}
              max={2050}
              step={1}
              className="font-mono text-base h-11 bg-secondary/30 border-border/60 focus:bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground font-body">
              Loan Tenure (Years)
            </Label>
            <Input
              type="number"
              value={inputs.loanTenure}
              onChange={(e) =>
                updateInput("loanTenure", parseInt(e.target.value) || 30)
              }
              min={10}
              max={35}
              step={5}
              className="font-mono text-base h-11 bg-secondary/30 border-border/60 focus:bg-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Calculate Button */}
      <Button
        onClick={handleCalculate}
        className="w-full h-14 text-lg font-display font-semibold tracking-wide shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
        size="lg"
      >
        <Calculator className="w-5 h-5 mr-2" />
        Calculate My Property Plan
      </Button>
    </div>
  );
}
