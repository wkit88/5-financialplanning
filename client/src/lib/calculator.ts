// ============================================================
// PropertyLab - Net Equity Calculator Engine
// All formulas preserved from the original HTML version
// + Annual expense per property (fixed RM or % of purchase price)
// ============================================================

export interface CalculatorInputs {
  purchasePrice: number;
  loanType: number; // 0.9 or 1.0
  maxProperties: number;
  belowMarketValue: boolean;
  discountPercentage: number; // e.g., 10 for 10%
  appreciationRate: number; // e.g., 3 for 3%
  rentalYield: number; // e.g., 8 for 8%
  interestRate: number; // e.g., 4 for 4%
  buyInterval: number; // years between purchases
  startingYear: number;
  loanTenure: number; // years
  expenseType: "fixed" | "percentage"; // fixed RM or % of purchase price
  expenseValue: number; // RM amount or percentage (e.g., 2 for 2%)
}

export interface YearlyData {
  year: number;
  calendarYear: number;
  propertiesOwned: number;
  totalAssetValue: number;
  totalLoanBalance: number;
  netEquity: number;
  annualCashFlow: number;
  cumulativeCashFlow: number;
  annualRentalIncome: number;
  annualMortgagePayment: number;
  annualExpense: number;
}

export interface SimulationResult {
  netEquity: number;
  totalAssetValue: number;
  totalLoanBalance: number;
  cumulativeCashFlow: number;
  propertiesOwned: number;
}

export interface FullSimulationResult {
  results10: SimulationResult;
  results20: SimulationResult;
  results30: SimulationResult;
  yearlyData: YearlyData[];
  monthlyPayment: number;
  loanAmount: number;
  marketValue: number;
  annualRentalIncome: number;
  annualExpensePerProperty: number;
}

/**
 * Calculate monthly mortgage payment using standard amortization formula.
 * Formula: P * r * (1+r)^n / ((1+r)^n - 1)
 */
function calculateMonthlyPayment(
  loanAmount: number,
  annualInterestRate: number,
  years: number
): number {
  const monthlyRate = annualInterestRate / 12;
  const numberOfPayments = years * 12;

  if (monthlyRate === 0) {
    return loanAmount / numberOfPayments;
  }

  return (
    (loanAmount *
      monthlyRate *
      Math.pow(1 + monthlyRate, numberOfPayments)) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
  );
}

/**
 * Calculate remaining loan balance at a given point in time.
 * Uses the standard remaining balance formula for amortizing loans.
 */
function calculateLoanBalance(
  loanAmount: number,
  _monthlyPayment: number,
  annualInterestRate: number,
  yearsPaid: number,
  loanTenureYears: number
): number {
  const monthlyRate = annualInterestRate / 12;
  const totalPayments = loanTenureYears * 12;
  const paymentsMade = Math.min(yearsPaid, loanTenureYears) * 12;

  if (monthlyRate === 0) {
    return Math.max(0, loanAmount - _monthlyPayment * paymentsMade);
  }

  const remainingBalance =
    (loanAmount *
      (Math.pow(1 + monthlyRate, totalPayments) -
        Math.pow(1 + monthlyRate, paymentsMade))) /
    (Math.pow(1 + monthlyRate, totalPayments) - 1);

  return Math.max(0, remainingBalance);
}

/**
 * Simulate portfolio growth over a given number of years.
 * Cash flow = Rental Income - Mortgage Payment - Annual Expense (per property)
 * Net Equity = Total Asset Value - Total Loan Balance + Cumulative Cash Flow
 */
function simulatePortfolio(
  years: number,
  _purchasePrice: number,
  marketValue: number,
  loanAmount: number,
  monthlyPayment: number,
  appreciationRate: number,
  annualRentalIncome: number,
  interestRate: number,
  buyInterval: number,
  maxProperties: number,
  _belowMarketValue: boolean,
  loanTenure: number,
  annualExpensePerProperty: number
): SimulationResult {
  let propertiesOwned = 0;
  let totalAssetValue = 0;
  let totalLoanBalance = 0;
  let cumulativeCashFlow = 0;

  for (let year = 1; year <= years; year++) {
    if (year % buyInterval === 1 || buyInterval === 1) {
      if (propertiesOwned < maxProperties) {
        propertiesOwned++;
      }
    }

    totalAssetValue = 0;
    totalLoanBalance = 0;
    let annualCashFlow = 0;

    for (let i = 0; i < propertiesOwned; i++) {
      const propertyAge = year - i * buyInterval;
      if (propertyAge > 0) {
        const propertyValue =
          marketValue * Math.pow(1 + appreciationRate, propertyAge);
        totalAssetValue += propertyValue;

        const loanBalance = calculateLoanBalance(
          loanAmount,
          monthlyPayment,
          interestRate,
          Math.min(propertyAge, loanTenure),
          loanTenure
        );
        totalLoanBalance += loanBalance;

        // Cash flow = rental - mortgage - expense
        const annualMortgagePayment = monthlyPayment * 12;
        const propertyCashFlow =
          annualRentalIncome - annualMortgagePayment - annualExpensePerProperty;
        annualCashFlow += propertyCashFlow;
      }
    }

    cumulativeCashFlow += annualCashFlow;
  }

  const netEquity = totalAssetValue - totalLoanBalance + cumulativeCashFlow;

  return {
    netEquity,
    totalAssetValue,
    totalLoanBalance,
    cumulativeCashFlow,
    propertiesOwned,
  };
}

/**
 * Generate year-by-year data for charts and tables.
 */
function generateYearlyData(
  years: number,
  _purchasePrice: number,
  marketValue: number,
  loanAmount: number,
  monthlyPayment: number,
  appreciationRate: number,
  annualRentalIncome: number,
  interestRate: number,
  buyInterval: number,
  maxProperties: number,
  startingYear: number,
  _belowMarketValue: boolean,
  loanTenure: number,
  annualExpensePerProperty: number
): YearlyData[] {
  const data: YearlyData[] = [];
  let propertiesOwned = 0;
  let cumulativeCashFlow = 0;

  for (let year = 0; year <= years; year++) {
    if (year > 0 && (year % buyInterval === 1 || buyInterval === 1)) {
      if (propertiesOwned < maxProperties) {
        propertiesOwned++;
      }
    }

    let totalAssetValue = 0;
    let totalLoanBalance = 0;
    let annualCashFlow = 0;

    for (let i = 0; i < propertiesOwned; i++) {
      const propertyAge = year - i * buyInterval;
      if (propertyAge >= 0) {
        const propertyValue =
          marketValue * Math.pow(1 + appreciationRate, propertyAge);
        totalAssetValue += propertyValue;

        const loanBalance = calculateLoanBalance(
          loanAmount,
          monthlyPayment,
          interestRate,
          Math.min(propertyAge, loanTenure),
          loanTenure
        );
        totalLoanBalance += loanBalance;

        if (propertyAge > 0) {
          const annualMortgagePaymentVal = monthlyPayment * 12;
          // Cash flow = rental - mortgage - expense
          const propertyCashFlow =
            annualRentalIncome - annualMortgagePaymentVal - annualExpensePerProperty;
          annualCashFlow += propertyCashFlow;
        }
      }
    }

    if (year > 0) {
      cumulativeCashFlow += annualCashFlow;
    }

    const netEquity = totalAssetValue - totalLoanBalance + cumulativeCashFlow;

    // Count active properties (those with propertyAge > 0) for expense display
    let activeProperties = 0;
    for (let i = 0; i < propertiesOwned; i++) {
      const propertyAge = year - i * buyInterval;
      if (propertyAge > 0) activeProperties++;
    }

    data.push({
      year,
      calendarYear: startingYear + year,
      propertiesOwned,
      totalAssetValue,
      totalLoanBalance,
      netEquity,
      annualCashFlow,
      cumulativeCashFlow,
      annualRentalIncome: propertiesOwned * annualRentalIncome,
      annualMortgagePayment: propertiesOwned * monthlyPayment * 12,
      annualExpense: activeProperties * annualExpensePerProperty,
    });
  }

  return data;
}

/**
 * Main calculation entry point.
 * Takes user inputs and returns all simulation results.
 */
export function calculatePropertyPlan(
  inputs: CalculatorInputs
): FullSimulationResult {
  const {
    purchasePrice,
    loanType,
    maxProperties,
    belowMarketValue,
    discountPercentage,
    appreciationRate: appreciationPct,
    rentalYield: rentalYieldPct,
    interestRate: interestPct,
    buyInterval,
    startingYear,
    loanTenure,
    expenseType,
    expenseValue,
  } = inputs;

  const appreciationRate = appreciationPct / 100;
  const rentalYield = rentalYieldPct / 100;
  const interestRate = interestPct / 100;
  const discountRate = belowMarketValue ? discountPercentage / 100 : 0;

  // Calculate market value from purchase price
  const marketValue = belowMarketValue
    ? purchasePrice / (1 - discountRate)
    : purchasePrice;

  // Calculate loan amount based on purchase price
  const loanAmount = purchasePrice * loanType;

  // Calculate monthly mortgage payment
  const monthlyPayment = calculateMonthlyPayment(
    loanAmount,
    interestRate,
    loanTenure
  );

  // Calculate FIXED annual rental income (based on original property price)
  const annualRentalIncome = purchasePrice * rentalYield;

  // Calculate annual expense per property
  const annualExpensePerProperty =
    expenseType === "fixed"
      ? expenseValue
      : purchasePrice * (expenseValue / 100);

  // Calculate net equity for 10, 20, and 30 years
  const results10 = simulatePortfolio(
    10, purchasePrice, marketValue, loanAmount, monthlyPayment,
    appreciationRate, annualRentalIncome, interestRate, buyInterval,
    maxProperties, belowMarketValue, loanTenure, annualExpensePerProperty
  );
  const results20 = simulatePortfolio(
    20, purchasePrice, marketValue, loanAmount, monthlyPayment,
    appreciationRate, annualRentalIncome, interestRate, buyInterval,
    maxProperties, belowMarketValue, loanTenure, annualExpensePerProperty
  );
  const results30 = simulatePortfolio(
    30, purchasePrice, marketValue, loanAmount, monthlyPayment,
    appreciationRate, annualRentalIncome, interestRate, buyInterval,
    maxProperties, belowMarketValue, loanTenure, annualExpensePerProperty
  );

  // Generate year-by-year data for charts and tables
  const yearlyData = generateYearlyData(
    30, purchasePrice, marketValue, loanAmount, monthlyPayment,
    appreciationRate, annualRentalIncome, interestRate, buyInterval,
    maxProperties, startingYear, belowMarketValue, loanTenure,
    annualExpensePerProperty
  );

  return {
    results10,
    results20,
    results30,
    yearlyData,
    monthlyPayment,
    loanAmount,
    marketValue,
    annualRentalIncome,
    annualExpensePerProperty,
  };
}

// ============================================================
// Stock Reinvestment Simulator
// ============================================================

export interface StockInputs {
  enableStockReinvestment: boolean;
  // Stock assumptions
  stockDividendYield: number; // e.g., 6 for 6%
  stockDiscount: number; // e.g., 20 for 20% below market value
  stockAppreciation: number; // e.g., 5 for 5% annual growth
  reinvestDividends: boolean; // DRIP — reinvest dividends or take as cash
  // Cashback calculation
  mortgageApprovedAmount: number; // Bank-approved mortgage amount
  // mortgageApprovedAmount > purchasePrice → cashback = difference
}

export interface StockYearlyData {
  year: number;
  calendarYear: number;
  // Cash flow reinvestment
  cashFlowInvested: number; // positive cash flow from property reinvested this year
  cumulativeCashFlowInvested: number;
  // Cashback lump sum
  cashbackAmount: number; // cashback from new property purchases this year
  // Dividend reinvestment
  dividendReinvested: number; // last year's dividend reinvested this year (DRIP)
  // Stock portfolio
  stockPortfolioValue: number;
  stockCostBasis: number; // total amount invested
  stockUnrealizedGain: number;
  annualDividendIncome: number;
  cumulativeDividends: number;
  // Combined
  combinedNetWorth: number; // property net equity + stock portfolio
}

export interface StockSimulationResult {
  yearlyData: StockYearlyData[];
  totalCashbackPerProperty: number; // cashback per property
  totalCashbackAllProperties: number; // total cashback across all properties
  stock10Year: { portfolioValue: number; totalDividends: number; totalInvested: number };
  stock20Year: { portfolioValue: number; totalDividends: number; totalInvested: number };
  stock30Year: { portfolioValue: number; totalDividends: number; totalInvested: number };
}

/**
 * Calculate stock reinvestment portfolio.
 * Two sources of investment:
 * 1. Cashback = mortgageApprovedAmount - purchasePrice (per property, if positive)
 *    Invested as lump sum when each property is purchased
 * 2. Positive annual cash flow from property portfolio reinvested into stocks
 *
 * Stock is bought at a discount (below market value).
 * Stocks appreciate annually and pay dividends.
 * Dividends can be reinvested (DRIP) or taken as cash.
 */
export function calculateStockReinvestment(
  stockInputs: StockInputs,
  propertyInputs: CalculatorInputs,
  propertyResult: FullSimulationResult
): StockSimulationResult {
  const {
    stockDividendYield: divYieldPct,
    stockDiscount: discountPct,
    stockAppreciation: appreciationPct,
    reinvestDividends,
    mortgageApprovedAmount,
  } = stockInputs;

  const divYield = divYieldPct / 100;
  const discount = discountPct / 100;
  const appreciation = appreciationPct / 100;

  // Cashback per property = mortgage approved - purchase price (only if positive)
  const cashbackPerProperty = Math.max(0, mortgageApprovedAmount - propertyInputs.purchasePrice);

  const years = 30;
  const yearlyData: StockYearlyData[] = [];
  let stockPortfolioValue = 0; // current market value of stock holdings
  let totalSharesOwned = 0; // track shares for accurate valuation
  let stockCostBasis = 0; // total amount invested
  let cumulativeDividends = 0;
  let cumulativeCashFlowInvested = 0;
  let currentStockPrice = 1; // normalized starting price
  const buyPrice = currentStockPrice * (1 - discount); // buy at discount

  // Track how many properties have been purchased so far
  // to know when new cashback lump sums come in
  let prevPropertiesOwned = 0;

  for (let year = 0; year <= years; year++) {
    const propYearData = propertyResult.yearlyData[year];
    if (!propYearData) break;

    // Stock price appreciates starting from Year 2
    // Year 1: buy at discount only, no capital growth yet
    if (year > 1) {
      currentStockPrice *= (1 + appreciation);
    }

    let cashFlowInvestedThisYear = 0;
    let cashbackThisYear = 0;
    let dividendReinvestedThisYear = 0;

    if (year > 0) {
      // 1. Cashback from newly purchased properties this year
      const newProperties = propYearData.propertiesOwned - prevPropertiesOwned;
      if (newProperties > 0 && cashbackPerProperty > 0) {
        cashbackThisYear = newProperties * cashbackPerProperty;
        // Buy stocks with cashback at current discounted price
        const currentBuyPrice = currentStockPrice * (1 - discount);
        const sharesBought = cashbackThisYear / currentBuyPrice;
        totalSharesOwned += sharesBought;
        stockCostBasis += cashbackThisYear;
      }

      // 2. Positive cash flow reinvested into stocks
      const annualCashFlow = propYearData.annualCashFlow;
      if (annualCashFlow > 0) {
        cashFlowInvestedThisYear = annualCashFlow;
        const currentBuyPrice = currentStockPrice * (1 - discount);
        const sharesBought = cashFlowInvestedThisYear / currentBuyPrice;
        totalSharesOwned += sharesBought;
        stockCostBasis += cashFlowInvestedThisYear;
        cumulativeCashFlowInvested += cashFlowInvestedThisYear;
      }

      // 3. Dividends (based on previous year's portfolio value)
      const annualDividend = stockPortfolioValue * divYield;
      cumulativeDividends += annualDividend;

      if (reinvestDividends && annualDividend > 0) {
        // DRIP — reinvest last year's dividends at current discounted price
        dividendReinvestedThisYear = annualDividend;
        const currentBuyPrice = currentStockPrice * (1 - discount);
        const sharesBought = annualDividend / currentBuyPrice;
        totalSharesOwned += sharesBought;
        stockCostBasis += annualDividend;
      }
    }

    prevPropertiesOwned = propYearData.propertiesOwned;

    // Update portfolio value
    stockPortfolioValue = totalSharesOwned * currentStockPrice;

    const combinedNetWorth = propYearData.netEquity + stockPortfolioValue;

    yearlyData.push({
      year,
      calendarYear: propYearData.calendarYear,
      cashFlowInvested: cashFlowInvestedThisYear,
      cumulativeCashFlowInvested,
      cashbackAmount: cashbackThisYear,
      dividendReinvested: dividendReinvestedThisYear,
      stockPortfolioValue,
      stockCostBasis,
      stockUnrealizedGain: stockPortfolioValue - stockCostBasis,
      annualDividendIncome: year > 0 ? stockPortfolioValue * divYield : 0,
      cumulativeDividends,
      combinedNetWorth,
    });
  }

  const getYearMetrics = (y: number) => {
    const d = yearlyData[y];
    return d
      ? { portfolioValue: d.stockPortfolioValue, totalDividends: d.cumulativeDividends, totalInvested: d.stockCostBasis }
      : { portfolioValue: 0, totalDividends: 0, totalInvested: 0 };
  };

  // Count total properties ever purchased for total cashback
  const totalProperties = propertyResult.yearlyData[years]?.propertiesOwned ?? 0;

  return {
    yearlyData,
    totalCashbackPerProperty: cashbackPerProperty,
    totalCashbackAllProperties: cashbackPerProperty * totalProperties,
    stock10Year: getYearMetrics(10),
    stock20Year: getYearMetrics(20),
    stock30Year: getYearMetrics(30),
  };
}

/**
 * Format a number with commas for display.
 */
export function formatNumber(num: number | string): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
