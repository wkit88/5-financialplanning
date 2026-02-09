/*
 * Professional financial app — Google-style clean UI
 * Blue/white/black brand. Charts and tables below inputs.
 */

import { useMemo, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
}

export default function ResultsPanel({ results }: ResultsPanelProps) {
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [results]);

  const metrics = useMemo(() => [
    {
      label: "10-Year Net Equity",
      value: `RM ${formatNumber(results.results10.netEquity.toFixed(0))}`,
    },
    {
      label: "20-Year Net Equity",
      value: `RM ${formatNumber(results.results20.netEquity.toFixed(0))}`,
    },
    {
      label: "30-Year Net Equity",
      value: `RM ${formatNumber(results.results30.netEquity.toFixed(0))}`,
    },
    {
      label: "Properties Owned",
      value: String(results.results30.propertiesOwned),
    },
  ], [results]);

  // Equity Growth Chart
  const equityChartData = useMemo(() => ({
    labels: results.yearlyData.map((d) => String(d.calendarYear)),
    datasets: [
      {
        label: "Total Asset Value",
        data: results.yearlyData.map((d) => d.totalAssetValue),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.08)",
        borderWidth: 2.5,
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
      {
        label: "Total Loan Balance",
        data: results.yearlyData.map((d) => d.totalLoanBalance),
        borderColor: "#ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.06)",
        borderWidth: 2.5,
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
      {
        label: "Net Equity",
        data: results.yearlyData.map((d) => d.netEquity),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.06)",
        borderWidth: 2.5,
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  }), [results]);

  // Timeline Chart
  const timelineChartData = useMemo(() => ({
    labels: results.yearlyData.map((d) => String(d.calendarYear)),
    datasets: [{
      label: "Properties Owned",
      data: results.yearlyData.map((d) => d.propertiesOwned),
      backgroundColor: "rgba(245, 158, 11, 0.75)",
      borderColor: "#d97706",
      borderWidth: 1,
      borderRadius: 3,
    }],
  }), [results]);

  // Cash Flow Chart
  const cashflowChartData = useMemo(() => {
    const yearlySlice = results.yearlyData.slice(1);
    return {
      labels: yearlySlice.map((_, i) => String(i + 1)),
      datasets: [
        {
          label: "Rental Income",
          data: yearlySlice.map((d) => d.annualRentalIncome),
          backgroundColor: "rgba(16, 185, 129, 0.75)",
          borderColor: "#059669",
          borderWidth: 1,
          borderRadius: 2,
        },
        {
          label: "Mortgage Payments",
          data: yearlySlice.map((d) => d.annualMortgagePayment),
          backgroundColor: "rgba(239, 68, 68, 0.75)",
          borderColor: "#dc2626",
          borderWidth: 1,
          borderRadius: 2,
        },
        {
          label: "Net Cash Flow",
          data: yearlySlice.map((d) => d.annualCashFlow),
          backgroundColor: "rgba(37, 99, 235, 0.75)",
          borderColor: "#1d4ed8",
          borderWidth: 1,
          borderRadius: 2,
        },
      ],
    };
  }, [results]);

  const fontFamily = "'Roboto', sans-serif";
  const monoFont = "'Roboto Mono', monospace";

  const lineChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: "Net Equity Growth Over Time", font: { family: fontFamily, size: 14, weight: "500" as const }, color: "#1a1a1a", padding: { bottom: 16 } },
      legend: { position: "top" as const, labels: { font: { family: fontFamily, size: 12 }, padding: 16, usePointStyle: true, pointStyleWidth: 8 } },
      tooltip: {
        mode: "index" as const, intersect: false, backgroundColor: "#1a1a1a",
        titleFont: { family: fontFamily, size: 12 }, bodyFont: { family: monoFont, size: 11 },
        padding: 10, cornerRadius: 6,
        callbacks: { label: (ctx: any) => `${ctx.dataset.label}: RM ${formatNumber(ctx.raw.toFixed(0))}` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: fontFamily, size: 11 }, color: "#666", maxRotation: 45 }, title: { display: true, text: "Year", font: { family: fontFamily, size: 12 }, color: "#666" } },
      y: { grid: { color: "rgba(0,0,0,0.05)" }, ticks: { font: { family: monoFont, size: 11 }, color: "#666", callback: (v: any) => "RM " + formatNumber(Number(v)) }, title: { display: true, text: "Value (RM)", font: { family: fontFamily, size: 12 }, color: "#666" } },
    },
  }), []);

  const timelineOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: "Property Purchase Timeline", font: { family: fontFamily, size: 14, weight: "500" as const }, color: "#1a1a1a", padding: { bottom: 16 } },
      legend: { position: "top" as const, labels: { font: { family: fontFamily, size: 12 }, padding: 16, usePointStyle: true } },
      tooltip: { backgroundColor: "#1a1a1a", titleFont: { family: fontFamily, size: 12 }, bodyFont: { family: monoFont, size: 11 }, padding: 10, cornerRadius: 6 },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: fontFamily, size: 11 }, color: "#666", maxRotation: 45 }, title: { display: true, text: "Year", font: { family: fontFamily, size: 12 }, color: "#666" } },
      y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: monoFont, size: 11 }, color: "#666" }, grid: { color: "rgba(0,0,0,0.05)" }, title: { display: true, text: "Number of Properties", font: { family: fontFamily, size: 12 }, color: "#666" } },
    },
  }), []);

  const cashflowOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: "Annual Cash Flow Projection", font: { family: fontFamily, size: 14, weight: "500" as const }, color: "#1a1a1a", padding: { bottom: 16 } },
      legend: { position: "top" as const, labels: { font: { family: fontFamily, size: 12 }, padding: 16, usePointStyle: true } },
      tooltip: {
        backgroundColor: "#1a1a1a", titleFont: { family: fontFamily, size: 12 }, bodyFont: { family: monoFont, size: 11 },
        padding: 10, cornerRadius: 6,
        callbacks: { label: (ctx: any) => `${ctx.dataset.label}: RM ${formatNumber(ctx.raw.toFixed(0))}` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: fontFamily, size: 11 }, color: "#666" }, title: { display: true, text: "Years", font: { family: fontFamily, size: 12 }, color: "#666" } },
      y: { grid: { color: "rgba(0,0,0,0.05)" }, ticks: { font: { family: monoFont, size: 11 }, color: "#666", callback: (v: any) => "RM " + formatNumber(Number(v)) }, title: { display: true, text: "Amount (RM)", font: { family: fontFamily, size: 12 }, color: "#666" } },
    },
  }), []);

  return (
    <div ref={resultsRef} className="space-y-5">
      {/* Section Title */}
      <h2 className="text-xl font-medium text-gray-900 flex items-center gap-2">
        <span className="text-lg">📊</span>
        Your Property Investment Plan
      </h2>

      {/* Metric Cards — 4 across */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <Card key={i} className="shadow-sm border border-gray-100 text-center">
            <CardContent className="py-5 px-3">
              <p className="text-xs font-medium text-gray-500 mb-1.5">{m.label}</p>
              <p className="text-xl md:text-2xl font-medium text-blue-600 font-mono leading-tight">
                {m.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs: Charts + Table + Info */}
      <Card className="shadow-sm border border-gray-100">
        <CardContent className="p-0">
          <Tabs defaultValue="equity" className="w-full">
            <div className="px-4 pt-4 md:px-5 md:pt-5 border-b border-gray-100">
              <TabsList className="w-full flex flex-wrap h-auto gap-0 bg-transparent p-0 rounded-none">
                <TabsTrigger value="equity" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none px-4 py-2.5 text-sm font-medium text-gray-500">
                  Equity Growth
                </TabsTrigger>
                <TabsTrigger value="timeline" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none px-4 py-2.5 text-sm font-medium text-gray-500">
                  Purchase Timeline
                </TabsTrigger>
                <TabsTrigger value="cashflow" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none px-4 py-2.5 text-sm font-medium text-gray-500">
                  Cash Flow
                </TabsTrigger>
                <TabsTrigger value="summary" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none px-4 py-2.5 text-sm font-medium text-gray-500">
                  Yearly Summary
                </TabsTrigger>
                <TabsTrigger value="assumptions" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none px-4 py-2.5 text-sm font-medium text-gray-500">
                  Assumptions
                </TabsTrigger>
                <TabsTrigger value="calculations" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none px-4 py-2.5 text-sm font-medium text-gray-500">
                  Calculations
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-4 md:p-5">
              <TabsContent value="equity" className="mt-0">
                <div className="h-[300px] md:h-[380px]">
                  <Line data={equityChartData} options={lineChartOptions as any} />
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="mt-0">
                <div className="h-[300px] md:h-[380px]">
                  <Bar data={timelineChartData} options={timelineOptions as any} />
                </div>
              </TabsContent>

              <TabsContent value="cashflow" className="mt-0">
                <div className="h-[300px] md:h-[380px]">
                  <Bar data={cashflowChartData} options={cashflowOptions as any} />
                </div>
              </TabsContent>

              <TabsContent value="summary" className="mt-0">
                <ScrollArea className="h-[400px]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500">Year</th>
                        <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500">Properties</th>
                        <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-500">Asset Value</th>
                        <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-500">Loan Balance</th>
                        <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-500">Net Equity</th>
                        <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-500">Annual Cash Flow</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.yearlyData.map((row, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-2 px-3 font-mono text-xs text-gray-700">{row.calendarYear}</td>
                          <td className="py-2 px-3 font-mono text-xs text-gray-700">{row.propertiesOwned}</td>
                          <td className="py-2 px-3 font-mono text-xs text-right text-gray-700">RM {formatNumber(row.totalAssetValue.toFixed(0))}</td>
                          <td className="py-2 px-3 font-mono text-xs text-right text-red-600">RM {formatNumber(row.totalLoanBalance.toFixed(0))}</td>
                          <td className="py-2 px-3 font-mono text-xs text-right font-medium text-blue-600">RM {formatNumber(row.netEquity.toFixed(0))}</td>
                          <td className={`py-2 px-3 font-mono text-xs text-right ${row.annualCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
                            RM {formatNumber(row.annualCashFlow.toFixed(0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="assumptions" className="mt-0">
                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-md p-5">
                  <h3 className="text-base font-medium text-blue-700 mb-3">Calculation Assumptions</h3>
                  <ul className="space-y-2 text-sm text-gray-700 leading-relaxed list-disc list-inside">
                    <li>Rental income is FIXED at original property price × rental yield (no inflation adjustment)</li>
                    <li>Property appreciation is compounded annually</li>
                    <li>Loan interest rate remains constant throughout the loan tenure</li>
                    <li>No additional expenses beyond mortgage payments</li>
                    <li>Properties are purchased at regular intervals until maximum is reached</li>
                    <li>All properties have the same price and characteristics</li>
                    <li>No property sales during the investment period</li>
                    <li>Cash flow = Rental Income - Mortgage Installment (no other expenses)</li>
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="calculations" className="mt-0">
                <div className="bg-green-50 border-l-4 border-green-500 rounded-r-md p-5">
                  <h3 className="text-base font-medium text-green-700 mb-3">How Calculations Work</h3>
                  <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
                    <p><strong>Property Value Growth:</strong> Each property appreciates annually at the specified rate.</p>
                    <p><strong>Rental Income:</strong> FIXED at Original Price × Rental Yield (does not increase with property value)</p>
                    <p><strong>Mortgage Calculation:</strong> Fixed monthly payments calculated using standard amortization formula.</p>
                    <p><strong>Cash Flow:</strong> Annual rental income minus annual mortgage payments.</p>
                    <p><strong>Net Equity:</strong> Total property values minus total loan balances plus cumulative cash flow.</p>
                    <p><strong>Below Market Value:</strong> When enabled, you purchase at a discount but properties appreciate from full market value.</p>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
