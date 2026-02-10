/*
 * Apple-level UI/UX: bold hero metrics, pill-style segmented tabs,
 * floating shadow cards, refined chart styling, generous spacing.
 */

import { useMemo, useRef, useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FullSimulationResult } from "@/lib/calculator";
import { formatNumber } from "@/lib/calculator";
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

interface ResultsPanelProps {
  results: FullSimulationResult;
  purchasePrice?: number;
  loanAmount?: number;
  onReinvestToStock?: () => void;
}

type TabKey = "equity" | "timeline" | "cashflow" | "summary" | "assumptions" | "calculations";

const TABS: { key: TabKey; label: string }[] = [
  { key: "equity", label: "Equity Growth" },
  { key: "timeline", label: "Purchase Timeline" },
  { key: "cashflow", label: "Cash Flow" },
  { key: "summary", label: "Yearly Summary" },
  { key: "assumptions", label: "Assumptions" },
  { key: "calculations", label: "Calculations" },
];

export default function ResultsPanel({ results, purchasePrice, loanAmount, onReinvestToStock }: ResultsPanelProps) {
  const resultsRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("equity");

  useEffect(() => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [results]);

  const metrics = useMemo(() => [
    { label: "10-Year Net Equity", value: formatNumber(results.results10.netEquity.toFixed(0)), prefix: "RM" },
    { label: "20-Year Net Equity", value: formatNumber(results.results20.netEquity.toFixed(0)), prefix: "RM" },
    { label: "30-Year Net Equity", value: formatNumber(results.results30.netEquity.toFixed(0)), prefix: "RM" },
    { label: "Properties Owned", value: String(results.results30.propertiesOwned), prefix: "" },
  ], [results]);

  const fontFamily = "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif";
  const sansFont = "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif";

  // Equity Growth Chart
  const equityChartData = useMemo(() => ({
    labels: results.yearlyData.map((d) => String(d.calendarYear)),
    datasets: [
      {
        label: "Total Asset Value",
        data: results.yearlyData.map((d) => d.totalAssetValue),
        borderColor: "#0071e3",
        backgroundColor: "rgba(0, 113, 227, 0.06)",
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: "#0071e3",
      },
      {
        label: "Total Loan Balance",
        data: results.yearlyData.map((d) => d.totalLoanBalance),
        borderColor: "#ff3b30",
        backgroundColor: "rgba(255, 59, 48, 0.04)",
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: "#ff3b30",
      },
      {
        label: "Net Equity",
        data: results.yearlyData.map((d) => d.netEquity),
        borderColor: "#34c759",
        backgroundColor: "rgba(52, 199, 89, 0.04)",
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: "#34c759",
      },
    ],
  }), [results]);

  // Timeline Chart
  const timelineChartData = useMemo(() => ({
    labels: results.yearlyData.map((d) => String(d.calendarYear)),
    datasets: [{
      label: "Properties Owned",
      data: results.yearlyData.map((d) => d.propertiesOwned),
      backgroundColor: "rgba(255, 149, 0, 0.7)",
      borderColor: "#ff9500",
      borderWidth: 0,
      borderRadius: 6,
    }],
  }), [results]);

  // Cash Flow Chart
  const cashflowChartData = useMemo(() => {
    const yearlySlice = results.yearlyData.slice(1);
    const hasExpense = results.annualExpensePerProperty > 0;
    const datasets: any[] = [
      {
        label: "Rental Income",
        data: yearlySlice.map((d) => d.annualRentalIncome),
        backgroundColor: "rgba(52, 199, 89, 0.7)",
        borderColor: "#34c759",
        borderWidth: 0,
        borderRadius: 4,
      },
      {
        label: "Mortgage Payments",
        data: yearlySlice.map((d) => d.annualMortgagePayment),
        backgroundColor: "rgba(255, 59, 48, 0.7)",
        borderColor: "#ff3b30",
        borderWidth: 0,
        borderRadius: 4,
      },
    ];
    if (hasExpense) {
      datasets.push({
        label: "Annual Expenses",
        data: yearlySlice.map((d) => d.annualExpense),
        backgroundColor: "rgba(255, 149, 0, 0.7)",
        borderColor: "#ff9500",
        borderWidth: 0,
        borderRadius: 4,
      });
    }
    datasets.push({
      label: "Net Cash Flow",
      data: yearlySlice.map((d) => d.annualCashFlow),
      backgroundColor: "rgba(0, 113, 227, 0.7)",
      borderColor: "#0071e3",
      borderWidth: 0,
      borderRadius: 4,
    });
    return {
      labels: yearlySlice.map((_, i) => String(i + 1)),
      datasets,
    };
  }, [results]);

  const makeChartOptions = (title: string, yLabel: string, isBar = false) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: false },
      legend: {
        position: "top" as const,
        align: "center" as const,
        labels: {
          font: { family: fontFamily, size: 12, weight: "500" as const },
          color: "#86868b",
          padding: 20,
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
        bodyFont: { family: sansFont, size: 12 },
        padding: 14,
        cornerRadius: 10,
        displayColors: true,
        boxPadding: 4,
        callbacks: {
          label: (ctx: any) => {
            if (title === "Purchase Timeline") return `${ctx.dataset.label}: ${ctx.raw}`;
            return `${ctx.dataset.label}: RM ${formatNumber(ctx.raw.toFixed(0))}`;
          },
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
        ...(title === "Purchase Timeline" ? { beginAtZero: true, ticks: { stepSize: 1, font: { family: sansFont, size: 11 }, color: "#86868b" } } : {
          ticks: {
            font: { family: sansFont, size: 11 },
            color: "#86868b",
            callback: (v: any) => "RM " + formatNumber(Number(v)),
          },
        }),
      },
    },
    ...(isBar ? { barPercentage: 0.7, categoryPercentage: 0.8 } : {}),
  });

  const lineOpts = useMemo(() => makeChartOptions("Equity Growth", "Value (RM)"), []);
  const timelineOpts = useMemo(() => makeChartOptions("Purchase Timeline", "Properties", true), []);
  const cashflowOpts = useMemo(() => makeChartOptions("Cash Flow", "Amount (RM)", true), []);

  return (
    <div ref={resultsRef} className="space-y-6">
      {/* Section Title */}
      <h2 className="text-[22px] font-semibold text-[#1d1d1f] tracking-tight">
        Your Property Investment Plan
      </h2>

      {/* Metric Cards — bold hero numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <div
            key={i}
            className="apple-card p-5 md:p-6 text-center border-t-[3px] border-t-[#0071e3]"
          >
            <p className="text-[12px] font-medium text-[#86868b] tracking-wide uppercase mb-2">
              {m.label}
            </p>
            <p className="text-[26px] md:text-[30px] font-semibold text-[#1d1d1f] leading-none tracking-tight">
              {m.prefix && <span className="text-[18px] md:text-[20px] font-medium text-[#86868b] mr-1">{m.prefix}</span>}
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts & Data — Apple pill tabs */}
      <div className="apple-card overflow-hidden">
        {/* Pill Tabs (Segmented Control) */}
        <div className="p-5 md:p-6 pb-0">
          <div className="inline-flex flex-wrap gap-1 bg-[#f5f5f7] p-1 rounded-[10px]">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  px-4 py-2 text-[13px] font-medium rounded-[8px] transition-all duration-200
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
        </div>

        <div className="p-5 md:p-6">
          {/* Equity Growth */}
          {activeTab === "equity" && (
            <div className="h-[320px] md:h-[400px]">
              <Line data={equityChartData} options={lineOpts as any} />
            </div>
          )}

          {/* Purchase Timeline */}
          {activeTab === "timeline" && (
            <div className="h-[320px] md:h-[400px]">
              <Bar data={timelineChartData} options={timelineOpts as any} />
            </div>
          )}

          {/* Cash Flow */}
          {activeTab === "cashflow" && (
            <div className="h-[320px] md:h-[400px]">
              <Bar data={cashflowChartData} options={cashflowOpts as any} />
            </div>
          )}

          {/* Yearly Summary Table */}
          {activeTab === "summary" && (
            <ScrollArea className="h-[420px]">
              <table className="w-full text-[13px]">
                <thead className="sticky top-0 bg-white z-10">
                  <tr>
                    <th className="text-left py-3 px-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider border-b-2 border-[#e5e5ea]">Year</th>
                    <th className="text-left py-3 px-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider border-b-2 border-[#e5e5ea]">Properties</th>
                    <th className="text-right py-3 px-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider border-b-2 border-[#e5e5ea]">Asset Value</th>
                    <th className="text-right py-3 px-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider border-b-2 border-[#e5e5ea]">Loan Balance</th>
                    <th className="text-right py-3 px-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider border-b-2 border-[#e5e5ea]">Net Equity</th>
                    <th className="text-right py-3 px-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider border-b-2 border-[#e5e5ea]">Expenses</th>
                    <th className="text-right py-3 px-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider border-b-2 border-[#e5e5ea]">Annual Cash Flow</th>
                  </tr>
                </thead>
                <tbody>
                  {results.yearlyData.map((row, i) => (
                    <tr key={i} className="border-b border-[#f5f5f7] hover:bg-[#f5f5f7]/60 transition-colors">
                      <td className="py-2.5 px-3 text-[13px] text-[#1d1d1f]">{row.calendarYear}</td>
                      <td className="py-2.5 px-3 text-[13px] text-[#1d1d1f]">{row.propertiesOwned}</td>
                      <td className="py-2.5 px-3 text-[13px] text-right text-[#1d1d1f]">RM {formatNumber(row.totalAssetValue.toFixed(0))}</td>
                      <td className="py-2.5 px-3 text-[13px] text-right text-[#ff3b30]">RM {formatNumber(row.totalLoanBalance.toFixed(0))}</td>
                      <td className="py-2.5 px-3 text-[13px] text-right font-semibold text-[#0071e3]">RM {formatNumber(row.netEquity.toFixed(0))}</td>
                      <td className="py-2.5 px-3 text-[13px] text-right text-[#ff9500]">RM {formatNumber(row.annualExpense.toFixed(0))}</td>
                      <td className={`py-2.5 px-3 text-[13px] text-right ${row.annualCashFlow >= 0 ? "text-[#34c759]" : "text-[#ff3b30]"}`}>
                        RM {formatNumber(row.annualCashFlow.toFixed(0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          )}

          {/* Assumptions */}
          {activeTab === "assumptions" && (
            <div className="bg-[#f5f5f7] rounded-[12px] p-6">
              <h3 className="text-[15px] font-semibold text-[#1d1d1f] mb-4">Calculation Assumptions</h3>
              <ul className="space-y-2.5 text-[14px] text-[#424245] leading-relaxed">
                <li className="flex gap-2.5"><span className="text-[#0071e3] shrink-0">•</span>Rental income is FIXED at original property price × rental yield (no inflation adjustment)</li>
                <li className="flex gap-2.5"><span className="text-[#0071e3] shrink-0">•</span>Property appreciation is compounded annually</li>
                <li className="flex gap-2.5"><span className="text-[#0071e3] shrink-0">•</span>Loan interest rate remains constant throughout the loan tenure</li>
                <li className="flex gap-2.5"><span className="text-[#0071e3] shrink-0">•</span>Annual expenses per property{results.annualExpensePerProperty > 0 ? `: RM ${formatNumber(results.annualExpensePerProperty.toFixed(0))}/year` : " not included (set to 0)"}</li>
                <li className="flex gap-2.5"><span className="text-[#0071e3] shrink-0">•</span>Properties are purchased at regular intervals until maximum is reached</li>
                <li className="flex gap-2.5"><span className="text-[#0071e3] shrink-0">•</span>All properties have the same price and characteristics</li>
                <li className="flex gap-2.5"><span className="text-[#0071e3] shrink-0">•</span>No property sales during the investment period</li>
                <li className="flex gap-2.5"><span className="text-[#0071e3] shrink-0">•</span>Cash flow = Rental Income − Mortgage Installment − Annual Expenses (per property)</li>
              </ul>
            </div>
          )}

          {/* Calculations */}
          {activeTab === "calculations" && (
            <div className="bg-[#f5f5f7] rounded-[12px] p-6">
              <h3 className="text-[15px] font-semibold text-[#1d1d1f] mb-4">How Calculations Work</h3>
              <div className="space-y-3 text-[14px] text-[#424245] leading-relaxed">
                <p><strong className="text-[#1d1d1f]">Property Value Growth:</strong> Each property appreciates annually at the specified rate.</p>
                <p><strong className="text-[#1d1d1f]">Rental Income:</strong> FIXED at Original Price × Rental Yield (does not increase with property value)</p>
                <p><strong className="text-[#1d1d1f]">Mortgage Calculation:</strong> Fixed monthly payments calculated using standard amortization formula.</p>
                <p><strong className="text-[#1d1d1f]">Cash Flow:</strong> Annual rental income minus annual mortgage payments minus annual expenses (per property).</p>
                <p><strong className="text-[#1d1d1f]">Annual Expense:</strong> {results.annualExpensePerProperty > 0 ? `RM ${formatNumber(results.annualExpensePerProperty.toFixed(0))} per property per year (covers maintenance, tax, insurance, management fees).` : "Not included (set to 0)."}</p>
                <p><strong className="text-[#1d1d1f]">Net Equity:</strong> Total property values minus total loan balances plus cumulative cash flow. Since cash flow already deducts expenses, net equity naturally reflects the impact of all costs.</p>
                <p><strong className="text-[#1d1d1f]">Below Market Value:</strong> When enabled, you purchase at a discount but properties appreciate from full market value.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== Cash Flow & Cashback Summary ===== */}
      <CashFlowSummaryTable
        results={results}
        purchasePrice={purchasePrice}
        loanAmount={loanAmount}
        onReinvestToStock={onReinvestToStock}
      />
    </div>
  );
}

/* ---------- Cash Flow & Cashback Summary Table ---------- */
function CashFlowSummaryTable({
  results,
  purchasePrice,
  loanAmount,
  onReinvestToStock,
}: {
  results: FullSimulationResult;
  purchasePrice?: number;
  loanAmount?: number;
  onReinvestToStock?: () => void;
}) {
  const cashbackPerProperty = Math.max(0, (loanAmount ?? 0) - (purchasePrice ?? 0));
  const yearlyData = results.yearlyData;

  // Build summary rows for milestone years
  const milestoneYears = [1, 5, 10, 15, 20, 25, 30];
  const rows = milestoneYears
    .map((yr) => yearlyData.find((d) => d.year === yr))
    .filter(Boolean) as typeof yearlyData;

  // Calculate cumulative cashback: each time a new property is purchased, cashback is received
  const getCumulativeCashback = (year: number) => {
    const row = yearlyData.find((d) => d.year === year);
    if (!row) return 0;
    return row.propertiesOwned * cashbackPerProperty;
  };

  return (
    <div className="apple-card overflow-hidden">
      <div className="p-5 md:p-6">
        <h3 className="text-[16px] font-semibold text-[#1d1d1f] mb-1">
          Cash Flow & Cashback Summary
        </h3>
        <p className="text-[13px] text-[#86868b] mb-5">
          Available funds from your property portfolio that can be reinvested into stocks.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr>
                <th className="text-left py-3 px-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider border-b-2 border-[#e5e5ea]">Year</th>
                <th className="text-right py-3 px-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider border-b-2 border-[#e5e5ea]">Properties</th>
                <th className="text-right py-3 px-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider border-b-2 border-[#e5e5ea]">Annual Cash Flow</th>
                <th className="text-right py-3 px-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider border-b-2 border-[#e5e5ea]">Cumulative Cash Flow</th>
                <th className="text-right py-3 px-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider border-b-2 border-[#e5e5ea]">Cashback / Property</th>
                <th className="text-right py-3 px-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider border-b-2 border-[#e5e5ea]">Total Cashback</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.year} className="border-b border-[#f5f5f7] hover:bg-[#f5f5f7]/60 transition-colors">
                  <td className="py-2.5 px-3 text-[13px] font-medium text-[#1d1d1f]">{row.calendarYear}</td>
                  <td className="py-2.5 px-3 text-[13px] text-right text-[#1d1d1f]">{row.propertiesOwned}</td>
                  <td className={`py-2.5 px-3 text-[13px] text-right font-medium ${row.annualCashFlow >= 0 ? "text-[#34c759]" : "text-[#ff3b30]"}`}>
                    RM {formatNumber(row.annualCashFlow.toFixed(0))}
                  </td>
                  <td className={`py-2.5 px-3 text-[13px] text-right ${row.cumulativeCashFlow >= 0 ? "text-[#34c759]" : "text-[#ff3b30]"}`}>
                    RM {formatNumber(row.cumulativeCashFlow.toFixed(0))}
                  </td>
                  <td className="py-2.5 px-3 text-[13px] text-right text-[#0071e3]">
                    RM {formatNumber(cashbackPerProperty)}
                  </td>
                  <td className="py-2.5 px-3 text-[13px] text-right font-medium text-[#0071e3]">
                    RM {formatNumber(getCumulativeCashback(row.year))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Reinvest to Stock Button */}
        {onReinvestToStock && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={onReinvestToStock}
              className="
                flex items-center gap-2.5 px-8 py-3 text-[15px] font-semibold
                text-white bg-gradient-to-r from-[#34c759] to-[#30b350]
                hover:from-[#30b350] hover:to-[#2da048]
                rounded-[12px] transition-all duration-200
                shadow-[0_4px_14px_rgba(52,199,89,0.35)]
                hover:shadow-[0_6px_20px_rgba(52,199,89,0.45)]
                hover:-translate-y-[1px]
                active:translate-y-0
              "
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              Reinvest to Stock
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
