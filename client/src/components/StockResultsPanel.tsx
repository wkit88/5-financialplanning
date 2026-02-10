/**
 * Stock Reinvestment Results Panel.
 * Shows stock portfolio metrics, combined net worth chart, and yearly summary.
 */

import { useMemo, useRef, useEffect, useState } from "react";
import type { StockSimulationResult, FullSimulationResult, StockInputs } from "@/lib/calculator";
import { formatNumber } from "@/lib/calculator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
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
  stockInputs: StockInputs;
  purchasePrice: number;
  loanAmount: number;
}

type TabKey = "combined" | "stockGrowth" | "dividends" | "summary" | "assumptions" | "calculations";

const TABS: { key: TabKey; label: string }[] = [
  { key: "combined", label: "Combined Net Worth" },
  { key: "stockGrowth", label: "Stock Portfolio" },
  { key: "dividends", label: "Dividend Income" },
  { key: "summary", label: "Yearly Summary" },
  { key: "assumptions", label: "Assumptions" },
  { key: "calculations", label: "Calculations" },
];

export default function StockResultsPanel({ stockResults, propertyResults, stockInputs, purchasePrice, loanAmount }: StockResultsPanelProps) {
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

        {activeTab === "assumptions" && (
          <div className="bg-[#f5f5f7] rounded-[12px] p-6">
            <h3 className="text-[15px] font-semibold text-[#1d1d1f] mb-4">Stock Reinvestment Assumptions</h3>
            <ul className="space-y-2.5 text-[14px] text-[#424245] leading-relaxed">
              <li className="flex gap-2.5"><span className="text-[#34c759] shrink-0">•</span>Stocks are purchased at <strong>{stockInputs.stockDiscount}% below market value</strong> (discount price)</li>
              <li className="flex gap-2.5"><span className="text-[#34c759] shrink-0">•</span>In Year 1, stock price has <strong>no capital appreciation</strong> — you only benefit from the buy discount</li>
              <li className="flex gap-2.5"><span className="text-[#34c759] shrink-0">•</span>Stock price appreciation of <strong>{stockInputs.stockAppreciation}% per year</strong> begins from Year 2 onwards, compounded annually</li>
              <li className="flex gap-2.5"><span className="text-[#34c759] shrink-0">•</span>Annual dividend yield is <strong>{stockInputs.stockDividendYield}%</strong> based on end-of-previous-year portfolio value</li>
              <li className="flex gap-2.5"><span className="text-[#34c759] shrink-0">•</span>Dividends are {stockInputs.reinvestDividends ? <strong>reinvested (DRIP active) — last year’s dividend is used to buy more shares this year at the discounted price</strong> : <strong>taken as cash (DRIP off) — dividends are not reinvested</strong>}</li>
              <li className="flex gap-2.5"><span className="text-[#34c759] shrink-0">•</span><strong>Property Cash Flow</strong> column shows the positive annual cash flow from your property portfolio that is reinvested into stocks each year</li>
              <li className="flex gap-2.5"><span className="text-[#34c759] shrink-0">•</span><strong>Dividend Reinvested</strong> column shows last year’s dividend income that is reinvested this year to buy more shares (only when DRIP is active)</li>
              <li className="flex gap-2.5"><span className="text-[#34c759] shrink-0">•</span>Cashback per property: <strong>RM {formatNumber(Math.round(stockResults.totalCashbackPerProperty))}</strong> (Loan Amount RM {formatNumber(Math.round(loanAmount))} − Purchase Price RM {formatNumber(Math.round(purchasePrice))})</li>
              <li className="flex gap-2.5"><span className="text-[#34c759] shrink-0">•</span>Only <strong>positive</strong> annual cash flow from properties is reinvested (negative cash flow is not covered)</li>
              <li className="flex gap-2.5"><span className="text-[#34c759] shrink-0">•</span>All stock purchases (from cash flow, cashback, and DRIP) are made at the discounted price</li>
              <li className="flex gap-2.5"><span className="text-[#34c759] shrink-0">•</span>No stock sales during the investment period — buy and hold strategy</li>
              <li className="flex gap-2.5"><span className="text-[#34c759] shrink-0">•</span>No brokerage fees, taxes, or transaction costs are included</li>
            </ul>
          </div>
        )}

        {activeTab === "calculations" && (
          <div className="bg-[#f5f5f7] rounded-[12px] p-6">
            <h3 className="text-[15px] font-semibold text-[#1d1d1f] mb-4">How Stock Calculations Work</h3>
            <div className="space-y-4 text-[14px] text-[#424245] leading-relaxed">
              <div>
                <p className="font-semibold text-[#1d1d1f] mb-1">1. Cashback Calculation</p>
                <p>Cashback = Mortgage Approved Amount − Property Purchase Price. If the bank approves a mortgage higher than the purchase price, the difference is your cashback. Each new property generates a cashback lump sum that is immediately invested into stocks.</p>
                <p className="mt-1 text-[13px] text-[#86868b]">Example: Loan Amount RM {formatNumber(Math.round(loanAmount))} − Price RM {formatNumber(Math.round(purchasePrice))} = <span className="text-[#34c759] font-medium">RM {formatNumber(Math.round(stockResults.totalCashbackPerProperty))}</span> cashback per property</p>
              </div>
              <div>
                <p className="font-semibold text-[#1d1d1f] mb-1">2. Buy Price (Below Market Value)</p>
                <p>You buy stocks at a {stockInputs.stockDiscount}% discount. If the stock’s market price is RM 1.00, you pay RM {(1 - stockInputs.stockDiscount / 100).toFixed(2)}. This creates an immediate unrealized gain.</p>
                <p className="mt-1 text-[13px] text-[#86868b]">Buy Price = Stock Price × (1 − {stockInputs.stockDiscount}%) = Stock Price × {(1 - stockInputs.stockDiscount / 100).toFixed(2)}</p>
              </div>
              <div>
                <p className="font-semibold text-[#1d1d1f] mb-1">3. Shares Purchased</p>
                <p>Each investment (cashback, cash flow, or DRIP dividend) buys shares at the current discounted price. Shares = Investment Amount ÷ Current Buy Price.</p>
              </div>
              <div>
                <p className="font-semibold text-[#1d1d1f] mb-1">4. Stock Price Appreciation</p>
                <p>The stock price stays flat in Year 1 (you only benefit from the discount). From Year 2 onwards, the stock price grows at {stockInputs.stockAppreciation}% per year, compounded annually.</p>
                <p className="mt-1 text-[13px] text-[#86868b]">Year 1 Price = 1.00 (no growth) → Year 2 Price = 1.00 × 1.{String(stockInputs.stockAppreciation).padStart(2, '0')} = {(1 * (1 + stockInputs.stockAppreciation / 100)).toFixed(2)}</p>
              </div>
              <div>
                <p className="font-semibold text-[#1d1d1f] mb-1">5. Portfolio Value</p>
                <p>Portfolio Value = Total Shares Owned × Current Stock Price. As the stock price appreciates and you accumulate more shares, the portfolio compounds.</p>
              </div>
              <div>
                <p className="font-semibold text-[#1d1d1f] mb-1">6. Dividend Income & Reinvestment (DRIP)</p>
                <p>Annual Dividend = Previous Year’s Portfolio Value × {stockInputs.stockDividendYield}%. {stockInputs.reinvestDividends ? "Dividends are reinvested (DRIP) — last year’s dividend income is used this year to buy more shares at the discounted price, creating a compounding effect. The \"Dividend Reinvested\" column in the table shows exactly how much was reinvested each year." : "Dividends are taken as cash income and not reinvested."}</p>
                <p className="mt-1 text-[13px] text-[#86868b]">The \"Property Cash Flow\" column shows positive cash flow from your property investment that is reinvested into stocks. The \"Dividend Reinvested\" column shows last year’s dividend used to buy more shares this year.</p>
              </div>
              <div>
                <p className="font-semibold text-[#1d1d1f] mb-1">7. Unrealized Gain</p>
                <p>Unrealized Gain = Portfolio Value − Cost Basis. The cost basis is the total amount of money invested (cashback + cash flow + reinvested dividends). The gain comes from both the buy discount and stock price appreciation.</p>
              </div>
              <div>
                <p className="font-semibold text-[#1d1d1f] mb-1">8. Combined Net Worth</p>
                <p>Combined Net Worth = Property Net Equity + Stock Portfolio Value. This gives you the total wealth picture from both property and stock investments.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "summary" && (
          <ScrollArea className="h-[420px]">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-[#e5e5ea]">
                  <th className="text-left py-2.5 px-2 text-[#86868b] font-medium">Year</th>
                  <th className="text-right py-2.5 px-2 text-[#86868b] font-medium">
                    <span className="inline-flex items-center gap-1 justify-end">
                      Property Cash Flow
                      <Tooltip><TooltipTrigger asChild><Info className="w-3 h-3 text-[#86868b] cursor-help shrink-0" /></TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[240px] text-xs"><p>Positive annual cash flow from your property portfolio (Rental Income − Mortgage − Expenses) reinvested into stocks.</p></TooltipContent></Tooltip>
                    </span>
                  </th>
                  <th className="text-right py-2.5 px-2 text-[#86868b] font-medium">
                    <span className="inline-flex items-center gap-1 justify-end">
                      Cashback
                      <Tooltip><TooltipTrigger asChild><Info className="w-3 h-3 text-[#86868b] cursor-help shrink-0" /></TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[240px] text-xs"><p>Mortgage Approved − Purchase Price. Lump sum invested when each new property is purchased.</p></TooltipContent></Tooltip>
                    </span>
                  </th>
                  <th className="text-right py-2.5 px-2 text-[#86868b] font-medium">
                    <span className="inline-flex items-center gap-1 justify-end">
                      Div. Reinvested
                      <Tooltip><TooltipTrigger asChild><Info className="w-3 h-3 text-[#86868b] cursor-help shrink-0" /></TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[240px] text-xs"><p>Last year’s dividend income reinvested this year to buy more shares at discounted price (DRIP).</p></TooltipContent></Tooltip>
                    </span>
                  </th>
                  <th className="text-right py-2.5 px-2 text-[#86868b] font-medium">
                    <span className="inline-flex items-center gap-1 justify-end">
                      Stock Value
                      <Tooltip><TooltipTrigger asChild><Info className="w-3 h-3 text-[#86868b] cursor-help shrink-0" /></TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[240px] text-xs"><p>Total Shares Owned × Current Stock Price. Includes shares from cash flow, cashback, and DRIP.</p></TooltipContent></Tooltip>
                    </span>
                  </th>
                  <th className="text-right py-2.5 px-2 text-[#86868b] font-medium">
                    <span className="inline-flex items-center gap-1 justify-end">
                      Unrealized Gain
                      <Tooltip><TooltipTrigger asChild><Info className="w-3 h-3 text-[#86868b] cursor-help shrink-0" /></TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[240px] text-xs"><p>Stock Value − Cost Basis. Gain from buying at discount + stock price appreciation.</p></TooltipContent></Tooltip>
                    </span>
                  </th>
                  <th className="text-right py-2.5 px-2 text-[#86868b] font-medium">
                    <span className="inline-flex items-center gap-1 justify-end">
                      Annual Div.
                      <Tooltip><TooltipTrigger asChild><Info className="w-3 h-3 text-[#86868b] cursor-help shrink-0" /></TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[240px] text-xs"><p>This year’s dividend = End-of-year Stock Value × Dividend Yield ({stockInputs.stockDividendYield}%).</p></TooltipContent></Tooltip>
                    </span>
                  </th>
                  <th className="text-right py-2.5 px-2 text-[#86868b] font-medium">
                    <span className="inline-flex items-center gap-1 justify-end">
                      Prop. Equity
                      <Tooltip><TooltipTrigger asChild><Info className="w-3 h-3 text-[#86868b] cursor-help shrink-0" /></TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[240px] text-xs"><p>Property Net Equity = Total Asset Value − Total Loan Balance + Cumulative Cash Flow (from property section).</p></TooltipContent></Tooltip>
                    </span>
                  </th>
                  <th className="text-right py-2.5 px-2 text-[#86868b] font-medium">
                    <span className="inline-flex items-center gap-1 justify-end">
                      Combined
                      <Tooltip><TooltipTrigger asChild><Info className="w-3 h-3 text-[#86868b] cursor-help shrink-0" /></TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[240px] text-xs"><p>Combined Net Worth = Property Net Equity + Stock Portfolio Value. Your total wealth from both investments.</p></TooltipContent></Tooltip>
                    </span>
                  </th>
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
                    <td className="py-2.5 px-2 text-[#1d1d1f]">{row.calendarYear}</td>
                    <td className="py-2.5 px-2 text-right text-[#1d1d1f]">
                      {row.cashFlowInvested > 0 ? `RM ${formatNumber(Math.round(row.cashFlowInvested))}` : "—"}
                    </td>
                    <td className="py-2.5 px-2 text-right text-[#ff9500]">
                      {row.cashbackAmount > 0 ? `RM ${formatNumber(Math.round(row.cashbackAmount))}` : "—"}
                    </td>
                    <td className="py-2.5 px-2 text-right text-[#5856d6]">
                      {row.dividendReinvested > 0 ? `RM ${formatNumber(Math.round(row.dividendReinvested))}` : "—"}
                    </td>
                    <td className="py-2.5 px-2 text-right text-[#34c759] font-medium">
                      RM {formatNumber(Math.round(row.stockPortfolioValue))}
                    </td>
                    <td className={`py-2.5 px-2 text-right ${row.stockUnrealizedGain >= 0 ? "text-[#34c759]" : "text-[#ff3b30]"}`}>
                      RM {formatNumber(Math.round(row.stockUnrealizedGain))}
                    </td>
                    <td className="py-2.5 px-2 text-right text-[#1d1d1f]">
                      {row.annualDividendIncome > 0 ? `RM ${formatNumber(Math.round(row.annualDividendIncome))}` : "—"}
                    </td>
                    <td className="py-2.5 px-2 text-right text-[#0071e3]">
                      RM {formatNumber(Math.round(row.propertyNetEquity))}
                    </td>
                    <td className="py-2.5 px-2 text-right text-[#5856d6] font-semibold">
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
