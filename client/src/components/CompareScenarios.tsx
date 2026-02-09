/*
 * Side-by-side scenario comparison.
 * Shows metric deltas, overlay equity growth chart, and overlay cash flow chart.
 * Recalculates full simulation from saved inputs for chart data.
 */

import { useMemo } from "react";
import type { SavedScenario } from "@/hooks/useScenarios";
import { calculatePropertyPlan, formatNumber } from "@/lib/calculator";
import { X, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  Title, ChartTooltip, Legend, Filler
);

interface CompareScenariosProps {
  scenarioA: SavedScenario;
  scenarioB: SavedScenario;
  onClose: () => void;
}

function DeltaIndicator({ a, b }: { a: number; b: number }) {
  const diff = b - a;
  const pct = a !== 0 ? ((diff / Math.abs(a)) * 100) : 0;
  const isPositive = diff > 0;
  const isZero = Math.abs(diff) < 1;

  if (isZero) {
    return (
      <span className="inline-flex items-center gap-1 text-[12px] text-[#86868b]">
        <Minus className="w-3 h-3" /> Same
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 text-[12px] font-medium ${isPositive ? "text-[#34c759]" : "text-[#ff3b30]"}`}>
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isPositive ? "+" : ""}RM {formatNumber(Math.abs(diff).toFixed(0))}
      <span className="text-[11px] opacity-70">({isPositive ? "+" : ""}{pct.toFixed(1)}%)</span>
    </span>
  );
}

export default function CompareScenarios({ scenarioA, scenarioB, onClose }: CompareScenariosProps) {
  // Recalculate full results for chart data
  const fullA = useMemo(() => calculatePropertyPlan(scenarioA.inputs), [scenarioA]);
  const fullB = useMemo(() => calculatePropertyPlan(scenarioB.inputs), [scenarioB]);

  const fontFamily = "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif";

  // Metric rows
  const metricRows = useMemo(() => [
    {
      label: "10-Year Net Equity",
      a: scenarioA.results.equity10,
      b: scenarioB.results.equity10,
    },
    {
      label: "20-Year Net Equity",
      a: scenarioA.results.equity20,
      b: scenarioB.results.equity20,
    },
    {
      label: "30-Year Net Equity",
      a: scenarioA.results.equity30,
      b: scenarioB.results.equity30,
    },
    {
      label: "Properties Owned",
      a: scenarioA.results.propertiesOwned,
      b: scenarioB.results.propertiesOwned,
      isCount: true,
    },
    {
      label: "Monthly Payment",
      a: fullA.monthlyPayment,
      b: fullB.monthlyPayment,
    },
    {
      label: "Annual Rental Income",
      a: fullA.annualRentalIncome,
      b: fullB.annualRentalIncome,
    },
  ], [scenarioA, scenarioB, fullA, fullB]);

  // Input comparison rows
  const inputRows = useMemo(() => [
    { label: "Purchase Price", a: scenarioA.inputs.purchasePrice, b: scenarioB.inputs.purchasePrice, prefix: "RM " },
    { label: "Loan Type", a: scenarioA.inputs.loanType * 100, b: scenarioB.inputs.loanType * 100, suffix: "%" },
    { label: "Max Properties", a: scenarioA.inputs.maxProperties, b: scenarioB.inputs.maxProperties, isCount: true },
    { label: "Appreciation Rate", a: scenarioA.inputs.appreciationRate, b: scenarioB.inputs.appreciationRate, suffix: "%" },
    { label: "Rental Yield", a: scenarioA.inputs.rentalYield, b: scenarioB.inputs.rentalYield, suffix: "%" },
    { label: "Interest Rate", a: scenarioA.inputs.interestRate, b: scenarioB.inputs.interestRate, suffix: "%" },
    { label: "Buy Interval", a: scenarioA.inputs.buyInterval, b: scenarioB.inputs.buyInterval, suffix: " yr", isCount: true },
    { label: "Loan Tenure", a: scenarioA.inputs.loanTenure, b: scenarioB.inputs.loanTenure, suffix: " yr", isCount: true },
  ], [scenarioA, scenarioB]);

  // Equity Growth overlay chart
  const equityChartData = useMemo(() => {
    const maxLen = Math.max(fullA.yearlyData.length, fullB.yearlyData.length);
    const labels = Array.from({ length: maxLen }, (_, i) => {
      const yearA = fullA.yearlyData[i]?.calendarYear;
      const yearB = fullB.yearlyData[i]?.calendarYear;
      return String(yearA || yearB || i);
    });

    return {
      labels,
      datasets: [
        {
          label: `${scenarioA.name} — Net Equity`,
          data: fullA.yearlyData.map((d) => d.netEquity),
          borderColor: "#0071e3",
          backgroundColor: "rgba(0, 113, 227, 0.06)",
          borderWidth: 2.5,
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          borderDash: [] as number[],
        },
        {
          label: `${scenarioB.name} — Net Equity`,
          data: fullB.yearlyData.map((d) => d.netEquity),
          borderColor: "#ff9500",
          backgroundColor: "rgba(255, 149, 0, 0.06)",
          borderWidth: 2.5,
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          borderDash: [6, 3],
        },
      ],
    };
  }, [fullA, fullB, scenarioA.name, scenarioB.name]);

  // Cash Flow overlay chart
  const cashflowChartData = useMemo(() => {
    const sliceA = fullA.yearlyData.slice(1);
    const sliceB = fullB.yearlyData.slice(1);
    const maxLen = Math.max(sliceA.length, sliceB.length);
    const labels = Array.from({ length: maxLen }, (_, i) => String(i + 1));

    return {
      labels,
      datasets: [
        {
          label: `${scenarioA.name} — Cash Flow`,
          data: sliceA.map((d) => d.annualCashFlow),
          backgroundColor: "rgba(0, 113, 227, 0.6)",
          borderColor: "#0071e3",
          borderWidth: 0,
          borderRadius: 3,
        },
        {
          label: `${scenarioB.name} — Cash Flow`,
          data: sliceB.map((d) => d.annualCashFlow),
          backgroundColor: "rgba(255, 149, 0, 0.6)",
          borderColor: "#ff9500",
          borderWidth: 0,
          borderRadius: 3,
        },
      ],
    };
  }, [fullA, fullB, scenarioA.name, scenarioB.name]);

  const lineOpts = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: { family: fontFamily, size: 12, weight: "500" as const },
          color: "#86868b",
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 8,
          boxHeight: 8,
        },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        backgroundColor: "rgba(29, 29, 31, 0.95)",
        titleFont: { family: fontFamily, size: 13, weight: "600" as const },
        bodyFont: { family: fontFamily, size: 12 },
        padding: 14,
        cornerRadius: 10,
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: RM ${formatNumber(ctx.raw.toFixed(0))}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { font: { family: fontFamily, size: 11 }, color: "#86868b", maxRotation: 45 },
      },
      y: {
        grid: { color: "rgba(0,0,0,0.04)", drawBorder: false },
        border: { display: false },
        ticks: {
          font: { family: fontFamily, size: 11 },
          color: "#86868b",
          callback: (v: any) => "RM " + formatNumber(Number(v)),
        },
      },
    },
  }), []);

  const barOpts = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: { family: fontFamily, size: 12, weight: "500" as const },
          color: "#86868b",
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 8,
          boxHeight: 8,
        },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        backgroundColor: "rgba(29, 29, 31, 0.95)",
        titleFont: { family: fontFamily, size: 13, weight: "600" as const },
        bodyFont: { family: fontFamily, size: 12 },
        padding: 14,
        cornerRadius: 10,
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: RM ${formatNumber(ctx.raw.toFixed(0))}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { font: { family: fontFamily, size: 11 }, color: "#86868b" },
      },
      y: {
        grid: { color: "rgba(0,0,0,0.04)", drawBorder: false },
        border: { display: false },
        ticks: {
          font: { family: fontFamily, size: 11 },
          color: "#86868b",
          callback: (v: any) => "RM " + formatNumber(Number(v)),
        },
      },
    },
    barPercentage: 0.7,
    categoryPercentage: 0.8,
  }), []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[22px] font-semibold text-[#1d1d1f] tracking-tight">
          Scenario Comparison
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-[8px] text-[#86868b] hover:bg-[#f5f5f7] hover:text-[#1d1d1f] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scenario Labels */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2.5 px-4 py-3 bg-[#0071e3]/5 rounded-[10px] border border-[#0071e3]/15">
          <div className="w-3 h-3 rounded-full bg-[#0071e3] shrink-0" />
          <span className="text-[14px] font-medium text-[#1d1d1f] truncate">{scenarioA.name}</span>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-3 bg-[#ff9500]/5 rounded-[10px] border border-[#ff9500]/15">
          <div className="w-3 h-3 rounded-full bg-[#ff9500] shrink-0" />
          <span className="text-[14px] font-medium text-[#1d1d1f] truncate">{scenarioB.name}</span>
        </div>
      </div>

      {/* Key Metrics Comparison */}
      <div className="apple-card overflow-hidden">
        <div className="px-5 md:px-6 py-4 border-b border-[#f5f5f7]">
          <h3 className="text-[15px] font-semibold text-[#1d1d1f]">Key Metrics</h3>
        </div>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#f5f5f7]">
              <th className="text-left py-3 px-5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Metric</th>
              <th className="text-right py-3 px-4 text-[11px] font-semibold text-[#0071e3] uppercase tracking-wider">{scenarioA.name}</th>
              <th className="text-right py-3 px-4 text-[11px] font-semibold text-[#ff9500] uppercase tracking-wider">{scenarioB.name}</th>
              <th className="text-right py-3 px-5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Difference</th>
            </tr>
          </thead>
          <tbody>
            {metricRows.map((row, i) => (
              <tr key={i} className="border-b border-[#f5f5f7] last:border-b-0 hover:bg-[#f5f5f7]/40 transition-colors">
                <td className="py-3 px-5 text-[13px] text-[#1d1d1f] font-medium">{row.label}</td>
                <td className="py-3 px-4 text-[13px] text-right text-[#1d1d1f]">
                  {row.isCount ? row.a : `RM ${formatNumber(row.a.toFixed(0))}`}
                </td>
                <td className="py-3 px-4 text-[13px] text-right text-[#1d1d1f]">
                  {row.isCount ? row.b : `RM ${formatNumber(row.b.toFixed(0))}`}
                </td>
                <td className="py-3 px-5 text-right">
                  {row.isCount ? (
                    <span className="text-[12px] text-[#86868b]">{row.b - row.a === 0 ? "Same" : `${row.b - row.a > 0 ? "+" : ""}${row.b - row.a}`}</span>
                  ) : (
                    <DeltaIndicator a={row.a} b={row.b} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Input Parameters Comparison */}
      <div className="apple-card overflow-hidden">
        <div className="px-5 md:px-6 py-4 border-b border-[#f5f5f7]">
          <h3 className="text-[15px] font-semibold text-[#1d1d1f]">Input Parameters</h3>
        </div>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#f5f5f7]">
              <th className="text-left py-3 px-5 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Parameter</th>
              <th className="text-right py-3 px-4 text-[11px] font-semibold text-[#0071e3] uppercase tracking-wider">{scenarioA.name}</th>
              <th className="text-right py-3 px-4 text-[11px] font-semibold text-[#ff9500] uppercase tracking-wider">{scenarioB.name}</th>
            </tr>
          </thead>
          <tbody>
            {inputRows.map((row, i) => {
              const isDiff = row.a !== row.b;
              return (
                <tr key={i} className={`border-b border-[#f5f5f7] last:border-b-0 transition-colors ${isDiff ? "bg-[#ff9500]/[0.03]" : "hover:bg-[#f5f5f7]/40"}`}>
                  <td className="py-2.5 px-5 text-[13px] text-[#1d1d1f]">{row.label}</td>
                  <td className={`py-2.5 px-4 text-[13px] text-right ${isDiff ? "font-medium text-[#0071e3]" : "text-[#1d1d1f]"}`}>
                    {row.prefix || ""}{row.isCount ? row.a : formatNumber(row.a.toFixed(row.suffix === "%" ? 1 : 0))}{row.suffix || ""}
                  </td>
                  <td className={`py-2.5 px-4 text-[13px] text-right ${isDiff ? "font-medium text-[#ff9500]" : "text-[#1d1d1f]"}`}>
                    {row.prefix || ""}{row.isCount ? row.b : formatNumber(row.b.toFixed(row.suffix === "%" ? 1 : 0))}{row.suffix || ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Equity Growth Overlay Chart */}
      <div className="apple-card p-5 md:p-6">
        <h3 className="text-[15px] font-semibold text-[#1d1d1f] mb-4">Net Equity Growth</h3>
        <div className="h-[320px] md:h-[380px]">
          <Line data={equityChartData} options={lineOpts as any} />
        </div>
      </div>

      {/* Cash Flow Overlay Chart */}
      <div className="apple-card p-5 md:p-6">
        <h3 className="text-[15px] font-semibold text-[#1d1d1f] mb-4">Annual Cash Flow</h3>
        <div className="h-[320px] md:h-[380px]">
          <Bar data={cashflowChartData} options={barOpts as any} />
        </div>
      </div>
    </div>
  );
}
