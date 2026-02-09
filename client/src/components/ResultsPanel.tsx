/*
 * Design: "Wealth Canvas" — Editorial Finance Magazine
 * Pull-quote style for key metrics, serif display, editorial layout
 * Charts as centerpiece, thin horizontal rules between sections
 */

import { useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TrendingUp,
  Building,
  BarChart3,
  Table2,
  BookOpen,
  Calculator,
} from "lucide-react";
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

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

interface ResultsPanelProps {
  results: FullSimulationResult;
}

export default function ResultsPanel({ results }: ResultsPanelProps) {
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [results]);

  const metrics = useMemo(
    () => [
      {
        label: "10-Year Net Equity",
        value: `RM ${formatNumber(results.results10.netEquity.toFixed(0))}`,
        color: "text-primary",
      },
      {
        label: "20-Year Net Equity",
        value: `RM ${formatNumber(results.results20.netEquity.toFixed(0))}`,
        color: "text-primary",
      },
      {
        label: "30-Year Net Equity",
        value: `RM ${formatNumber(results.results30.netEquity.toFixed(0))}`,
        color: "text-primary",
      },
      {
        label: "Properties Owned",
        value: String(results.results30.propertiesOwned),
        color: "text-amber-700",
      },
    ],
    [results]
  );

  // Equity Growth Chart Data
  const equityChartData = useMemo(() => {
    const labels = results.yearlyData.map((d) => String(d.calendarYear));
    return {
      labels,
      datasets: [
        {
          label: "Total Asset Value",
          data: results.yearlyData.map((d) => d.totalAssetValue),
          borderColor: "#166534",
          backgroundColor: "rgba(22, 101, 52, 0.08)",
          borderWidth: 2.5,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 5,
        },
        {
          label: "Total Loan Balance",
          data: results.yearlyData.map((d) => d.totalLoanBalance),
          borderColor: "#be123c",
          backgroundColor: "rgba(190, 18, 60, 0.06)",
          borderWidth: 2.5,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 5,
        },
        {
          label: "Net Equity",
          data: results.yearlyData.map((d) => d.netEquity),
          borderColor: "#b8860b",
          backgroundColor: "rgba(184, 134, 11, 0.08)",
          borderWidth: 2.5,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 5,
        },
      ],
    };
  }, [results]);

  // Timeline Chart Data
  const timelineChartData = useMemo(() => {
    const labels = results.yearlyData.map((d) => String(d.calendarYear));
    return {
      labels,
      datasets: [
        {
          label: "Properties Owned",
          data: results.yearlyData.map((d) => d.propertiesOwned),
          backgroundColor: "rgba(184, 134, 11, 0.7)",
          borderColor: "#b8860b",
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [results]);

  // Cash Flow Chart Data
  const cashflowChartData = useMemo(() => {
    const yearlySlice = results.yearlyData.slice(1); // skip year 0
    const labels = yearlySlice.map((_, i) => String(i + 1));
    return {
      labels,
      datasets: [
        {
          label: "Rental Income",
          data: yearlySlice.map((d) => d.annualRentalIncome),
          backgroundColor: "rgba(22, 101, 52, 0.7)",
          borderColor: "#166534",
          borderWidth: 1,
          borderRadius: 3,
        },
        {
          label: "Mortgage Payments",
          data: yearlySlice.map((d) => d.annualMortgagePayment),
          backgroundColor: "rgba(190, 18, 60, 0.7)",
          borderColor: "#be123c",
          borderWidth: 1,
          borderRadius: 3,
        },
        {
          label: "Net Cash Flow",
          data: yearlySlice.map((d) => d.annualCashFlow),
          backgroundColor: "rgba(37, 99, 235, 0.7)",
          borderColor: "#2563eb",
          borderWidth: 1,
          borderRadius: 3,
        },
      ],
    };
  }, [results]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top" as const,
          labels: {
            font: { family: "'Source Sans 3', sans-serif", size: 12 },
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 10,
          },
        },
        tooltip: {
          mode: "index" as const,
          intersect: false,
          backgroundColor: "#1a1a2e",
          titleFont: { family: "'Source Sans 3', sans-serif", size: 13 },
          bodyFont: { family: "'JetBrains Mono', monospace", size: 12 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: function (context: { dataset: { label: string }; raw: number }) {
              return `${context.dataset.label}: RM ${formatNumber(context.raw.toFixed(0))}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { family: "'Source Sans 3', sans-serif", size: 11 },
            maxRotation: 45,
          },
        },
        y: {
          grid: { color: "rgba(0,0,0,0.04)" },
          ticks: {
            font: { family: "'JetBrains Mono', monospace", size: 11 },
            callback: function (value: number | string) {
              return "RM " + formatNumber(Number(value));
            },
          },
        },
      },
    }),
    []
  );

  const timelineChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top" as const,
          labels: {
            font: { family: "'Source Sans 3', sans-serif", size: 12 },
            padding: 16,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: "#1a1a2e",
          titleFont: { family: "'Source Sans 3', sans-serif", size: 13 },
          bodyFont: { family: "'JetBrains Mono', monospace", size: 12 },
          padding: 12,
          cornerRadius: 8,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { family: "'Source Sans 3', sans-serif", size: 11 },
            maxRotation: 45,
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            font: { family: "'JetBrains Mono', monospace", size: 11 },
          },
          grid: { color: "rgba(0,0,0,0.04)" },
        },
      },
    }),
    []
  );

  return (
    <div ref={resultsRef} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Key Metrics */}
      <div>
        <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-6">
          Your Property Investment Plan
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, i) => (
            <Card
              key={i}
              className="border-0 shadow-sm text-center overflow-hidden group hover:shadow-md transition-all duration-300"
            >
              <CardContent className="pt-5 pb-5 px-4">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground font-body mb-2">
                  {metric.label}
                </p>
                <p
                  className={`font-display text-lg md:text-2xl font-bold ${metric.color} leading-tight`}
                >
                  {metric.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Charts & Data Tabs */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Tabs defaultValue="equity" className="w-full">
            <div className="px-4 pt-4 md:px-6 md:pt-6">
              <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-secondary/50 p-1 rounded-lg">
                <TabsTrigger
                  value="equity"
                  className="flex-1 min-w-[120px] gap-1.5 text-xs md:text-sm font-body data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Equity</span> Growth
                </TabsTrigger>
                <TabsTrigger
                  value="timeline"
                  className="flex-1 min-w-[120px] gap-1.5 text-xs md:text-sm font-body data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Building className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Purchase</span> Timeline
                </TabsTrigger>
                <TabsTrigger
                  value="cashflow"
                  className="flex-1 min-w-[120px] gap-1.5 text-xs md:text-sm font-body data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Cash Flow
                </TabsTrigger>
                <TabsTrigger
                  value="summary"
                  className="flex-1 min-w-[120px] gap-1.5 text-xs md:text-sm font-body data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Table2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Yearly</span> Summary
                </TabsTrigger>
                <TabsTrigger
                  value="assumptions"
                  className="flex-1 min-w-[120px] gap-1.5 text-xs md:text-sm font-body data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Assumptions
                </TabsTrigger>
                <TabsTrigger
                  value="calculations"
                  className="flex-1 min-w-[120px] gap-1.5 text-xs md:text-sm font-body data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  Calculations
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-4 md:p-6">
              {/* Equity Growth Chart */}
              <TabsContent value="equity" className="mt-0">
                <div className="h-[350px] md:h-[400px]">
                  <Line data={equityChartData} options={chartOptions as any} />
                </div>
              </TabsContent>

              {/* Purchase Timeline Chart */}
              <TabsContent value="timeline" className="mt-0">
                <div className="h-[350px] md:h-[400px]">
                  <Bar
                    data={timelineChartData}
                    options={timelineChartOptions as any}
                  />
                </div>
              </TabsContent>

              {/* Cash Flow Chart */}
              <TabsContent value="cashflow" className="mt-0">
                <div className="h-[350px] md:h-[400px]">
                  <Bar
                    data={cashflowChartData}
                    options={chartOptions as any}
                  />
                </div>
              </TabsContent>

              {/* Yearly Summary Table */}
              <TabsContent value="summary" className="mt-0">
                <ScrollArea className="h-[400px] md:h-[450px]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-card z-10">
                      <tr className="border-b-2 border-primary/20">
                        <th className="text-left py-3 px-3 text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground font-body">
                          Year
                        </th>
                        <th className="text-left py-3 px-3 text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground font-body">
                          Properties
                        </th>
                        <th className="text-right py-3 px-3 text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground font-body">
                          Asset Value
                        </th>
                        <th className="text-right py-3 px-3 text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground font-body">
                          Loan Balance
                        </th>
                        <th className="text-right py-3 px-3 text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground font-body">
                          Net Equity
                        </th>
                        <th className="text-right py-3 px-3 text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground font-body">
                          Annual Cash Flow
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.yearlyData.map((row, i) => (
                        <tr
                          key={i}
                          className="border-b border-border/40 hover:bg-secondary/30 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-mono text-xs">
                            {row.calendarYear}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-xs">
                            {row.propertiesOwned}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-xs text-right">
                            RM {formatNumber(row.totalAssetValue.toFixed(0))}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-xs text-right text-rose-700">
                            RM {formatNumber(row.totalLoanBalance.toFixed(0))}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-xs text-right font-semibold text-primary">
                            RM {formatNumber(row.netEquity.toFixed(0))}
                          </td>
                          <td
                            className={`py-2.5 px-3 font-mono text-xs text-right ${
                              row.annualCashFlow >= 0
                                ? "text-green-700"
                                : "text-rose-700"
                            }`}
                          >
                            RM {formatNumber(row.annualCashFlow.toFixed(0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </TabsContent>

              {/* Assumptions */}
              <TabsContent value="assumptions" className="mt-0">
                <div className="bg-primary/5 border-l-4 border-primary rounded-r-lg p-5 md:p-6">
                  <h3 className="font-display text-lg font-semibold text-primary mb-4">
                    Calculation Assumptions
                  </h3>
                  <ul className="space-y-3 text-sm font-body text-foreground/80 leading-relaxed">
                    <li className="flex gap-2">
                      <span className="text-primary mt-0.5 shrink-0">—</span>
                      Rental income is FIXED at original property price x rental
                      yield (no inflation adjustment)
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary mt-0.5 shrink-0">—</span>
                      Property appreciation is compounded annually
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary mt-0.5 shrink-0">—</span>
                      Loan interest rate remains constant throughout the loan
                      tenure
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary mt-0.5 shrink-0">—</span>
                      No additional expenses beyond mortgage payments
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary mt-0.5 shrink-0">—</span>
                      Properties are purchased at regular intervals until maximum
                      is reached
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary mt-0.5 shrink-0">—</span>
                      All properties have the same price and characteristics
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary mt-0.5 shrink-0">—</span>
                      No property sales during the investment period
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary mt-0.5 shrink-0">—</span>
                      Cash flow = Rental Income - Mortgage Installment (no other
                      expenses)
                    </li>
                  </ul>
                </div>
              </TabsContent>

              {/* Calculations */}
              <TabsContent value="calculations" className="mt-0">
                <div className="bg-green-50 border-l-4 border-green-600 rounded-r-lg p-5 md:p-6">
                  <h3 className="font-display text-lg font-semibold text-green-700 mb-4">
                    How Calculations Work
                  </h3>
                  <div className="space-y-4 text-sm font-body text-foreground/80 leading-relaxed">
                    <p>
                      <strong className="text-foreground">
                        Property Value Growth:
                      </strong>{" "}
                      Each property appreciates annually at the specified rate.
                    </p>
                    <p>
                      <strong className="text-foreground">
                        Rental Income:
                      </strong>{" "}
                      FIXED at Original Price x Rental Yield (does not increase
                      with property value)
                    </p>
                    <p>
                      <strong className="text-foreground">
                        Mortgage Calculation:
                      </strong>{" "}
                      Fixed monthly payments calculated using standard
                      amortization formula.
                    </p>
                    <p>
                      <strong className="text-foreground">Cash Flow:</strong>{" "}
                      Annual rental income minus annual mortgage payments.
                    </p>
                    <p>
                      <strong className="text-foreground">Net Equity:</strong>{" "}
                      Total property values minus total loan balances plus
                      cumulative cash flow.
                    </p>
                    <p>
                      <strong className="text-foreground">
                        Below Market Value:
                      </strong>{" "}
                      When enabled, you purchase at a discount but properties
                      appreciate from full market value.
                    </p>
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
