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

/**
 * Format a number with commas for display.
 */
export function formatNumber(num: number | string): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
