/**
 * Stock Reinvestment Results Panel.
 * Shows stock portfolio metrics, combined net worth chart, and yearly summary.
 */

import { useMemo, useRef, useEffect, useState } from "react";
import type { StockSimulationResult, FullSimulationResult } from "@/lib/calculator";
import { formatNumber } from "@/lib/calculator";
import { ScrollArea } from "@/components/ui/scroll-area";
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

interface StockResultsPanelProps {
  stockResults: StockSimulationResult;
  propertyResults: FullSimulationResult;
}

type TabKey = "combined" | "stockGrowth" | "dividends" | "summary";

const TABS: { key: TabKey; label: string }[] = [
  { key: "combined", label: "Combined Net Worth" },
  { key: "stockGrowth", label: "Stock Portfolio" },
  { key: "dividends", label: "Dividend Income" },
  { key: "summary", label: "Yearly Summary" },
];

export default function StockResultsPanel({ stockResults, propertyResults }: StockResultsPanelProps) {
  const resultsRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("combined");

  useEffect(() => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [stockResults]);

  const labels = useMemo(() =>
    stockResults.yearlyData.map((d) => d.calendarYear.toString()),
    [stockResults]
  );

  // Combined Net Worth Chart
  const combinedChartData = useMemo(() => ({
    labels,
    datasets: [
      {
        label: "Combined Net Worth",
        data: stockResults.yearlyData.map((d) => Math.round(d.combinedNetWorth)),
        borderColor: "#5856d6",
        backgroundColor: "rgba(88,86,214,0.08)",
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 5,
        borderWidth: 2.5,
      },
      {
        label: "Property Net Equity",
        data: propertyResults.yearlyData.map((d) => Math.round(d.netEquity)),
        borderColor: "#0071e3",
        backgroundColor: "transparent",
        borderDash: [6, 3],
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 5,
        borderWidth: 2,
      },
      {
        label: "Stock Portfolio",
        data: stockResults.yearlyData.map((d) => Math.round(d.stockPortfolioValue)),
        borderColor: "#34c759",
        backgroundColor: "transparent",
        borderDash: [4, 4],
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 5,
        borderWidth: 2,
      },
    ],
  }), [labels, stockResults, propertyResults]);

  // Stock Portfolio Growth Chart
  const stockGrowthChartData = useMemo(() => ({
    labels,
    datasets: [
      {
        label: "Stock Portfolio Value",
        data: stockResults.yearlyData.map((d) => Math.round(d.stockPortfolioValue)),
        borderColor: "#34c759",
        backgroundColor: "rgba(52,199,89,0.08)",
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 5,
        borderWidth: 2.5,
      },
      {
        label: "Total Invested (Cost Basis)",
        data: stockResults.yearlyData.map((d) => Math.round(d.stockCostBasis)),
        borderColor: "#86868b",
        backgroundColor: "transparent",
        borderDash: [6, 3],
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 5,
        borderWidth: 1.5,
      },
    ],
  }), [labels, stockResults]);

  // Dividend Income Chart
  const dividendChartData = useMemo(() => ({
    labels: labels.slice(1),
    datasets: [
      {
        label: "Annual Dividend Income",
        data: stockResults.yearlyData.slice(1).map((d) => Math.round(d.annualDividendIncome)),
        backgroundColor: "rgba(52,199,89,0.6)",
        borderColor: "#34c759",
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: "Cash Flow Reinvested",
        data: stockResults.yearlyData.slice(1).map((d) => Math.round(d.cashFlowInvested)),
        backgroundColor: "rgba(0,113,227,0.4)",
        borderColor: "#0071e3",
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: "Cashback Invested",
        data: stockResults.yearlyData.slice(1).map((d) => Math.round(d.cashbackAmount)),
        backgroundColor: "rgba(255,149,0,0.5)",
        borderColor: "#ff9500",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }), [labels, stockResults]);

  const lineOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: {
        position: "top" as const,
        labels: { usePointStyle: true, pointStyle: "circle", padding: 16, font: { size: 12, family: "Inter, sans-serif" } },
      },
      tooltip: {
        backgroundColor: "rgba(29,29,31,0.92)",
        titleFont: { size: 12, family: "Inter, sans-serif" },
        bodyFont: { size: 12, family: "Inter, sans-serif" },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) =>
            `${ctx.dataset.label}: RM ${formatNumber(Math.round(ctx.parsed.y ?? 0))}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, family: "Inter, sans-serif" }, color: "#86868b", maxTicksLimit: 10 },
      },
      y: {
        grid: { color: "rgba(0,0,0,0.04)" },
        ticks: {
          font: { size: 11, family: "Inter, sans-serif" },
          color: "#86868b",
          callback: (value: string | number) => `RM ${formatNumber(Math.round(Number(value)))}`,
        },
      },
    },
  }), []);

  const barOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: {
        position: "top" as const,
        labels: { usePointStyle: true, pointStyle: "circle", padding: 16, font: { size: 12, family: "Inter, sans-serif" } },
      },
      tooltip: {
        backgroundColor: "rgba(29,29,31,0.92)",
        titleFont: { size: 12, family: "Inter, sans-serif" },
        bodyFont: { size: 12, family: "Inter, sans-serif" },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) =>
            `${ctx.dataset.label}: RM ${formatNumber(Math.round(ctx.parsed.y ?? 0))}`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { font: { size: 11, family: "Inter, sans-serif" }, color: "#86868b", maxTicksLimit: 10 },
      },
      y: {
        stacked: true,
        grid: { color: "rgba(0,0,0,0.04)" },
        ticks: {
          font: { size: 11, family: "Inter, sans-serif" },
          color: "#86868b",
          callback: (value: string | number) => `RM ${formatNumber(Math.round(Number(value)))}`,
        },
      },
    },
  }), []);

  const s10 = stockResults.stock10Year;
  const s20 = stockResults.stock20Year;
  const s30 = stockResults.stock30Year;

  // Combined net worth at milestones
  const combined10 = (propertyResults.yearlyData[10]?.netEquity ?? 0) + s10.portfolioValue;
  const combined20 = (propertyResults.yearlyData[20]?.netEquity ?? 0) + s20.portfolioValue;
  const combined30 = (propertyResults.yearlyData[30]?.netEquity ?? 0) + s30.portfolioValue;

  return (
    <div ref={resultsRef} className="space-y-6">
      {/* Section Title */}
      <h3 className="text-[22px] md:text-[28px] font-semibold text-[#1d1d1f] tracking-tight">
        Your Stock Reinvestment Portfolio
      </h3>

      {/* Metric Cards — Stock Portfolio at 10/20/30 years */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "10-Year Stock Portfolio", value: s10.portfolioValue, combined: combined10, dividends: s10.totalDividends },
          { label: "20-Year Stock Portfolio", value: s20.portfolioValue, combined: combined20, dividends: s20.totalDividends },
          { label: "30-Year Stock Portfolio", value: s30.portfolioValue, combined: combined30, dividends: s30.totalDividends },
        ].map((m) => (
          <div key={m.label} className="apple-card p-5 md:p-6">
            <p className="text-[12px] font-medium text-[#86868b] uppercase tracking-wider mb-1">
              {m.label}
            </p>
            <p className="text-[26px] md:text-[30px] font-semibold text-[#34c759] tracking-tight leading-tight">
              RM {formatNumber(Math.round(m.value))}
            </p>
            <div className="mt-2 pt-2 border-t border-[#f5f5f7] space-y-1">
              <p className="text-[12px] text-[#86868b]">
                Combined Net Worth: <span className="font-semibold text-[#5856d6]">RM {formatNumber(Math.round(m.combined))}</span>
              </p>
              <p className="text-[12px] text-[#86868b]">
                Total Dividends: <span className="font-medium text-[#1d1d1f]">RM {formatNumber(Math.round(m.dividends))}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Cashback Summary */}
      {stockResults.totalCashbackPerProperty > 0 && (
        <div className="apple-card p-5 bg-[#34c759]/5 border border-[#34c759]/15">
          <div className="flex flex-wrap items-center gap-4 text-[14px]">
            <span className="text-[#86868b]">Cashback per property:</span>
            <span className="font-semibold text-[#34c759]">RM {formatNumber(Math.round(stockResults.totalCashbackPerProperty))}</span>
            <span className="text-[#86868b]">×</span>
            <span className="text-[#86868b]">{propertyResults.yearlyData[30]?.propertiesOwned ?? 0} properties</span>
            <span className="text-[#86868b]">=</span>
            <span className="font-semibold text-[#34c759]">RM {formatNumber(Math.round(stockResults.totalCashbackAllProperties))} total cashback invested</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 bg-[#f5f5f7] rounded-[10px] overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`
              px-4 py-2 text-[13px] font-medium rounded-[8px] transition-all duration-200
              whitespace-nowrap shrink-0
              ${activeTab === tab.key
                ? "bg-white text-[#1d1d1f] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                : "text-[#86868b] hover:text-[#1d1d1f]"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="apple-card p-5 md:p-7">
        {activeTab === "combined" && (
          <div className="h-[360px] md:h-[420px]">
            <Line data={combinedChartData} options={lineOptions} />
          </div>
        )}

        {activeTab === "stockGrowth" && (
          <div className="h-[360px] md:h-[420px]">
            <Line data={stockGrowthChartData} options={lineOptions} />
          </div>
        )}

        {activeTab === "dividends" && (
          <div className="h-[360px] md:h-[420px]">
            <Bar data={dividendChartData} options={barOptions} />
          </div>
        )}

        {activeTab === "summary" && (
          <ScrollArea className="h-[420px]">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-[#e5e5ea]">
                  <th className="text-left py-2.5 px-3 text-[#86868b] font-medium">Year</th>
                  <th className="text-right py-2.5 px-3 text-[#86868b] font-medium">Cash Flow Invested</th>
                  <th className="text-right py-2.5 px-3 text-[#86868b] font-medium">Cashback</th>
                  <th className="text-right py-2.5 px-3 text-[#86868b] font-medium">Stock Value</th>
                  <th className="text-right py-2.5 px-3 text-[#86868b] font-medium">Unrealized Gain</th>
                  <th className="text-right py-2.5 px-3 text-[#86868b] font-medium">Annual Dividend</th>
                  <th className="text-right py-2.5 px-3 text-[#86868b] font-medium">Combined Net Worth</th>
                </tr>
              </thead>
              <tbody>
                {stockResults.yearlyData.map((row) => (
                  <tr
                    key={row.year}
                    className={`border-b border-[#f5f5f7] hover:bg-[#f5f5f7]/50 transition-colors
                      ${row.year === 10 || row.year === 20 || row.year === 30 ? "bg-[#0071e3]/3 font-medium" : ""}
                    `}
                  >
                    <td className="py-2.5 px-3 text-[#1d1d1f]">{row.calendarYear}</td>
                    <td className="py-2.5 px-3 text-right text-[#1d1d1f]">
                      {row.cashFlowInvested > 0 ? `RM ${formatNumber(Math.round(row.cashFlowInvested))}` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#ff9500]">
                      {row.cashbackAmount > 0 ? `RM ${formatNumber(Math.round(row.cashbackAmount))}` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#34c759] font-medium">
                      RM {formatNumber(Math.round(row.stockPortfolioValue))}
                    </td>
                    <td className={`py-2.5 px-3 text-right ${row.stockUnrealizedGain >= 0 ? "text-[#34c759]" : "text-[#ff3b30]"}`}>
                      RM {formatNumber(Math.round(row.stockUnrealizedGain))}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#1d1d1f]">
                      {row.annualDividendIncome > 0 ? `RM ${formatNumber(Math.round(row.annualDividendIncome))}` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#5856d6] font-semibold">
                      RM {formatNumber(Math.round(row.combinedNetWorth))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
