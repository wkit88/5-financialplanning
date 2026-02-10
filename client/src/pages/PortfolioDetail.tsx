/**
 * Portfolio Detail page — displays a saved portfolio's property + stock analysis.
 * Read-only view of the data that was saved. Uses the same visual components as the simulator.
 */

import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import ResultsPanel from "@/components/ResultsPanel";
import StockResultsPanel from "@/components/StockResultsPanel";
import {
  formatNumber,
  type CalculatorInputs,
  type FullSimulationResult,
  type StockInputs,
  type StockSimulationResult,
} from "@/lib/calculator";
import {
  ArrowLeft,
  Building2,
  TrendingUp,
  PieChart,
  Loader2,
  Home as HomeIcon,
  Calendar,
  Pencil,
} from "lucide-react";
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  ChartTitle, ChartTooltip, ChartLegend, Filler
);

type DetailTab = "property" | "stock" | "combined";

export default function PortfolioDetail() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/portfolio/:id");
  const portfolioId = params?.id ? parseInt(params.id, 10) : null;
  const { isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<DetailTab>("property");
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameName, setRenameName] = useState("");

  const { data: portfolio, isLoading, refetch } = trpc.portfolio.get.useQuery(
    { id: portfolioId! },
    { enabled: !!portfolioId && isAuthenticated }
  );

  const renameMutation = trpc.portfolio.rename.useMutation({
    onSuccess: () => {
      toast.success("Portfolio renamed");
      setRenameOpen(false);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const propertyInputs = portfolio?.propertyInputs as CalculatorInputs | null;
  const propertyResults = portfolio?.propertyResults as FullSimulationResult | null;
  const stockInputs = portfolio?.stockInputs as StockInputs | null;
  const stockResults = portfolio?.stockResults as StockSimulationResult | null;

  const hasStock = !!stockResults;

  const TABS: { key: DetailTab; label: string; icon: typeof HomeIcon; disabled?: boolean }[] = [
    { key: "property", label: "Property Investment", icon: HomeIcon },
    { key: "stock", label: "Stock Investment", icon: TrendingUp, disabled: !hasStock },
    { key: "combined", label: "Combined Portfolio", icon: PieChart, disabled: !hasStock },
  ];

  if (isLoading || !portfolio) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0071e3] animate-spin mb-3" />
        <p className="text-[#86868b] text-[14px]">Loading portfolio...</p>
      </div>
    );
  }

  const summary = portfolio.summary as any;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-[#e5e5ea]">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
              title="Back to Portfolios"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-[#0071e3] to-[#34c759] flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[17px] font-semibold text-[#1d1d1f] tracking-tight leading-tight">
                  {portfolio.name}
                </h1>
                <button
                  onClick={() => {
                    setRenameName(portfolio.name);
                    setRenameOpen(true);
                  }}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[#86868b] hover:text-[#0071e3] hover:bg-[#0071e3]/5 transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
              <p className="text-[12px] text-[#86868b] leading-tight flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Saved {new Date(portfolio.createdAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-[#e5e5ea] sticky top-0 z-30">
        <div className="container">
          <nav className="flex gap-0 -mb-px">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              const isDisabled = tab.disabled;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    if (isDisabled) {
                      toast("Stock data not available for this portfolio.", { icon: "📊" });
                      return;
                    }
                    setActiveTab(tab.key);
                  }}
                  className={`
                    flex items-center gap-2 px-5 py-3.5 text-[14px] font-medium
                    border-b-2 transition-all duration-200
                    ${isActive
                      ? "border-[#0071e3] text-[#0071e3]"
                      : isDisabled
                      ? "border-transparent text-[#c7c7cc] cursor-default"
                      : "border-transparent text-[#86868b] hover:text-[#1d1d1f] hover:border-[#d2d2d7]"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container py-6 md:py-8 space-y-8">
        {/* Property Tab */}
        {activeTab === "property" && propertyResults && propertyInputs && (
          <>
            {/* Quick Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="apple-card p-4">
                <p className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1">Purchase Price</p>
                <p className="text-[18px] font-semibold text-[#1d1d1f]">RM {formatNumber(propertyInputs.purchasePrice)}</p>
              </div>
              <div className="apple-card p-4">
                <p className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1">Properties</p>
                <p className="text-[18px] font-semibold text-[#1d1d1f]">{propertyResults.results30.propertiesOwned}</p>
              </div>
              <div className="apple-card p-4">
                <p className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1">30-Year Equity</p>
                <p className="text-[18px] font-semibold text-[#0071e3]">RM {formatNumber(Math.round(propertyResults.results30.netEquity))}</p>
              </div>
              <div className="apple-card p-4">
                <p className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1">Loan Tenure</p>
                <p className="text-[18px] font-semibold text-[#1d1d1f]">{propertyResults.loanTenure} years</p>
              </div>
            </div>

            <ResultsPanel
              results={propertyResults}
              purchasePrice={propertyInputs.purchasePrice}
              loanAmount={propertyInputs.loanAmount}
            />

            {/* Key Assumptions */}
            <div className="apple-card p-5 md:p-6">
              <h3 className="text-[16px] font-semibold text-[#1d1d1f] mb-4">Property Assumptions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[14px]">
                <div><span className="text-[#86868b]">Appreciation:</span> <strong>{propertyInputs.appreciationRate}%</strong></div>
                <div><span className="text-[#86868b]">Rental Yield:</span> <strong>{propertyInputs.rentalYield}%</strong></div>
                <div><span className="text-[#86868b]">Interest Rate:</span> <strong>{propertyInputs.interestRate}%</strong></div>
                <div><span className="text-[#86868b]">Buy Interval:</span> <strong>{propertyInputs.buyInterval} yr</strong></div>
              </div>
            </div>
          </>
        )}

        {/* Stock Tab */}
        {activeTab === "stock" && stockResults && stockInputs && propertyResults && propertyInputs && (
          <>
            <StockResultsPanel
              stockResults={stockResults}
              propertyResults={propertyResults}
              stockInputs={stockInputs}
              purchasePrice={propertyInputs.purchasePrice}
              loanAmount={propertyInputs.loanAmount}
            />

            {/* Stock Assumptions */}
            <div className="apple-card p-5 md:p-6">
              <h3 className="text-[16px] font-semibold text-[#1d1d1f] mb-4">Stock Assumptions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[14px]">
                <div><span className="text-[#86868b]">Dividend Yield:</span> <strong>{stockInputs.stockDividendYield}%</strong></div>
                <div><span className="text-[#86868b]">Buy Discount:</span> <strong>{stockInputs.stockDiscount}%</strong></div>
                <div><span className="text-[#86868b]">Appreciation:</span> <strong>{stockInputs.stockAppreciation}%</strong></div>
                <div><span className="text-[#86868b]">DRIP:</span> <strong>{stockInputs.reinvestDividends ? "Enabled" : "Disabled"}</strong></div>
              </div>
            </div>
          </>
        )}

        {/* Combined Tab */}
        {activeTab === "combined" && propertyResults && stockResults && stockInputs && propertyInputs && (
          <CombinedView
            propertyResults={propertyResults}
            stockResults={stockResults}
            stockInputs={stockInputs}
            propertyInputs={propertyInputs}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e5e5ea] bg-white">
        <div className="container py-6 text-center">
          <p className="text-[12px] text-[#86868b]">
            PropertyLab · This portfolio was saved as a snapshot. Values are estimates only.
          </p>
        </div>
      </footer>

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Portfolio</DialogTitle>
          </DialogHeader>
          <Input
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && renameName.trim() && portfolioId) {
                renameMutation.mutate({ id: portfolioId, name: renameName.trim() });
              }
            }}
            placeholder="Portfolio name"
            className="mt-2"
            autoFocus
          />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setRenameOpen(false)}>Cancel</Button>
            <Button
              className="bg-[#0071e3] hover:bg-[#0077ED] text-white"
              disabled={!renameName.trim() || renameMutation.isPending}
              onClick={() => {
                if (portfolioId && renameName.trim()) {
                  renameMutation.mutate({ id: portfolioId, name: renameName.trim() });
                }
              }}
            >
              {renameMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ========== Combined View (reused from Home.tsx pattern) ========== */
function CombinedView({
  propertyResults,
  stockResults,
  stockInputs,
  propertyInputs,
}: {
  propertyResults: FullSimulationResult;
  stockResults: StockSimulationResult;
  stockInputs: StockInputs;
  propertyInputs: CalculatorInputs;
}) {
  const s10 = stockResults.stock10Year;
  const s20 = stockResults.stock20Year;
  const s30 = stockResults.stock30Year;
  const p10 = propertyResults.results10;
  const p20 = propertyResults.results20;
  const p30 = propertyResults.results30;

  const combined10 = p10.netEquity + s10.portfolioValue;
  const combined20 = p20.netEquity + s20.portfolioValue;
  const combined30 = p30.netEquity + s30.portfolioValue;

  const lastStock = stockResults.yearlyData[stockResults.yearlyData.length - 1];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[22px] md:text-[28px] font-semibold text-[#1d1d1f] tracking-tight">
          Combined Portfolio Overview
        </h2>
        <p className="text-[14px] text-[#86868b] mt-1">
          Your total wealth from property investment and stock reinvestment combined.
        </p>
      </div>

      {/* Combined Net Worth Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "10-Year Combined", combined: combined10, property: p10.netEquity, stock: s10.portfolioValue },
          { label: "20-Year Combined", combined: combined20, property: p20.netEquity, stock: s20.portfolioValue },
          { label: "30-Year Combined", combined: combined30, property: p30.netEquity, stock: s30.portfolioValue },
        ].map((m) => (
          <div key={m.label} className="apple-card p-5 md:p-6 border-t-[3px] border-t-[#5856d6]">
            <p className="text-[12px] font-medium text-[#86868b] uppercase tracking-wider mb-2">{m.label}</p>
            <p className="text-[26px] md:text-[30px] font-semibold text-[#5856d6] tracking-tight leading-none">
              <span className="text-[18px] md:text-[20px] font-medium text-[#86868b] mr-1">RM</span>
              {formatNumber(Math.round(m.combined))}
            </p>
            <div className="mt-3 pt-3 border-t border-[#f5f5f7] grid grid-cols-2 gap-2">
              <div>
                <p className="text-[11px] text-[#86868b]">Property</p>
                <p className="text-[14px] font-semibold text-[#0071e3]">RM {formatNumber(Math.round(m.property))}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#86868b]">Stock</p>
                <p className="text-[14px] font-semibold text-[#34c759]">RM {formatNumber(Math.round(m.stock))}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Portfolio Growth Chart */}
      <div className="apple-card p-5 md:p-6">
        <h3 className="text-[16px] font-semibold text-[#1d1d1f] mb-1">Portfolio Growth Over Time</h3>
        <p className="text-[13px] text-[#86868b] mb-4">Property equity, stock value, and combined net worth across 30 years.</p>
        <div className="h-[360px] md:h-[420px]">
          <Line
            data={{
              labels: stockResults.yearlyData.map((d) => String(d.calendarYear)),
              datasets: [
                {
                  label: "Combined Net Worth",
                  data: stockResults.yearlyData.map((d) => d.combinedNetWorth),
                  borderColor: "#5856d6",
                  backgroundColor: "rgba(88, 86, 214, 0.06)",
                  borderWidth: 3,
                  fill: true,
                  tension: 0.4,
                  pointRadius: 0,
                  pointHoverRadius: 6,
                  pointHoverBackgroundColor: "#5856d6",
                  order: 0,
                },
                {
                  label: "Stock Portfolio",
                  data: stockResults.yearlyData.map((d) => d.stockPortfolioValue),
                  borderColor: "#34c759",
                  backgroundColor: "rgba(52, 199, 89, 0.04)",
                  borderWidth: 2.5,
                  fill: true,
                  tension: 0.4,
                  pointRadius: 0,
                  pointHoverRadius: 5,
                  pointHoverBackgroundColor: "#34c759",
                  order: 1,
                },
                {
                  label: "Property Equity",
                  data: stockResults.yearlyData.map((d) => d.propertyNetEquity),
                  borderColor: "#0071e3",
                  backgroundColor: "rgba(0, 113, 227, 0.04)",
                  borderWidth: 2.5,
                  fill: true,
                  tension: 0.4,
                  pointRadius: 0,
                  pointHoverRadius: 5,
                  pointHoverBackgroundColor: "#0071e3",
                  order: 2,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: { mode: "index" as const, intersect: false },
              plugins: {
                title: { display: false },
                legend: {
                  position: "top" as const,
                  align: "center" as const,
                  labels: {
                    font: { family: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", size: 12, weight: 500 },
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
                  titleFont: { family: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", size: 13, weight: "bold" as const },
                  bodyFont: { family: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", size: 12 },
                  padding: 14,
                  cornerRadius: 10,
                  displayColors: true,
                  boxPadding: 4,
                  callbacks: {
                    label: (ctx: any) => `${ctx.dataset.label}: RM ${formatNumber(ctx.raw.toFixed(0))}`,
                  },
                },
              },
              scales: {
                x: {
                  grid: { display: false },
                  border: { display: false },
                  ticks: {
                    font: { family: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", size: 11 },
                    color: "#86868b",
                    maxRotation: 45,
                  },
                },
                y: {
                  grid: { color: "rgba(0,0,0,0.04)" },
                  border: { display: false },
                  ticks: {
                    font: { family: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", size: 11 },
                    color: "#86868b",
                    callback: (v: any) => "RM " + formatNumber(Number(v)),
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Year-by-Year Table */}
      <div className="apple-card overflow-hidden">
        <div className="p-5 md:p-6">
          <h3 className="text-[16px] font-semibold text-[#1d1d1f] mb-4">Year-by-Year Combined Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr>
                  <th className="text-left py-3 px-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider border-b-2 border-[#e5e5ea]">Year</th>
                  <th className="text-right py-3 px-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider border-b-2 border-[#e5e5ea]">Properties</th>
                  <th className="text-right py-3 px-3 text-[11px] font-semibold text-[#0071e3] uppercase tracking-wider border-b-2 border-[#e5e5ea]">Property Equity</th>
                  <th className="text-right py-3 px-3 text-[11px] font-semibold text-[#34c759] uppercase tracking-wider border-b-2 border-[#e5e5ea]">Stock Value</th>
                  <th className="text-right py-3 px-3 text-[11px] font-semibold text-[#ff9500] uppercase tracking-wider border-b-2 border-[#e5e5ea]">Annual Dividend</th>
                  <th className="text-right py-3 px-3 text-[11px] font-semibold text-[#5856d6] uppercase tracking-wider border-b-2 border-[#e5e5ea]">Combined Net Worth</th>
                </tr>
              </thead>
              <tbody>
                {stockResults.yearlyData.map((sRow) => {
                  const pRow = propertyResults.yearlyData.find((d) => d.year === sRow.year);
                  if (!pRow) return null;
                  const isMilestone = sRow.year === 10 || sRow.year === 20 || sRow.year === 30;
                  return (
                    <tr
                      key={sRow.year}
                      className={`border-b border-[#f5f5f7] hover:bg-[#f5f5f7]/60 transition-colors
                        ${isMilestone ? "bg-[#5856d6]/3 font-medium" : ""}
                      `}
                    >
                      <td className="py-2.5 px-3 text-[13px] text-[#1d1d1f]">{sRow.calendarYear}</td>
                      <td className="py-2.5 px-3 text-[13px] text-right text-[#1d1d1f]">{pRow.propertiesOwned}</td>
                      <td className="py-2.5 px-3 text-[13px] text-right text-[#0071e3]">RM {formatNumber(Math.round(pRow.netEquity))}</td>
                      <td className="py-2.5 px-3 text-[13px] text-right text-[#34c759]">RM {formatNumber(Math.round(sRow.stockPortfolioValue))}</td>
                      <td className="py-2.5 px-3 text-[13px] text-right text-[#ff9500]">
                        {sRow.annualDividendIncome > 0 ? `RM ${formatNumber(Math.round(sRow.annualDividendIncome))}` : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-[13px] text-right font-semibold text-[#5856d6]">
                        RM {formatNumber(Math.round(sRow.combinedNetWorth))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Key Assumptions */}
      <div className="apple-card p-5 md:p-6">
        <h3 className="text-[16px] font-semibold text-[#1d1d1f] mb-4">Key Assumptions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-[13px] font-semibold text-[#0071e3] uppercase tracking-wider mb-3">Property</h4>
            <div className="space-y-2 text-[14px] text-[#424245]">
              <p>Purchase Price: <strong>RM {formatNumber(propertyInputs.purchasePrice)}</strong></p>
              <p>Appreciation: <strong>{propertyInputs.appreciationRate}%</strong> per year</p>
              <p>Rental Yield: <strong>{propertyInputs.rentalYield}%</strong></p>
              <p>Interest Rate: <strong>{propertyInputs.interestRate}%</strong></p>
              <p>Max Properties: <strong>{propertyInputs.maxProperties}</strong></p>
            </div>
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-[#34c759] uppercase tracking-wider mb-3">Stock</h4>
            <div className="space-y-2 text-[14px] text-[#424245]">
              <p>Dividend Yield: <strong>{stockInputs.stockDividendYield}%</strong></p>
              <p>Buy Discount: <strong>{stockInputs.stockDiscount}%</strong> below market</p>
              <p>Appreciation: <strong>{stockInputs.stockAppreciation}%</strong> per year</p>
              <p>DRIP: <strong>{stockInputs.reinvestDividends ? "Enabled" : "Disabled"}</strong></p>
              <p>Cashback/Property: <strong>RM {formatNumber(Math.max(0, propertyInputs.loanAmount - propertyInputs.purchasePrice))}</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
