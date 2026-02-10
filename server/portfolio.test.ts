import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module
const mockPortfolios: any[] = [];
let insertIdCounter = 1;

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: () => ({
      from: () => ({
        where: (condition: any) => ({
          orderBy: () => Promise.resolve(mockPortfolios),
          limit: () => Promise.resolve(mockPortfolios.filter((p: any) => true)),
        }),
      }),
    }),
    insert: () => ({
      values: () => Promise.resolve([{ insertId: insertIdCounter++ }]),
    }),
    update: () => ({
      set: () => ({
        where: () => Promise.resolve([]),
      }),
    }),
    delete: () => ({
      where: () => Promise.resolve([]),
    }),
  }),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

function createAuthContext(userId = 1): TrpcContext {
  return {
    user: {
      id: userId,
      openId: "test-user-open-id",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "oauth",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

const samplePropertyInputs = {
  purchasePrice: 500000,
  currentMarketValue: 600000,
  loanAmount: 600000,
  maxProperties: 10,
  appreciationRate: 3,
  rentalYield: 8,
  interestRate: 4,
  buyInterval: 1,
  startingYear: 2026,
  age: 30,
  expenseType: "percentage",
  expenseValue: 0,
};

const samplePropertyResults = {
  results10: { netEquity: 1000000, totalAssetValue: 2000000, totalLoanBalance: 1000000, cumulativeCashFlow: 50000, propertiesOwned: 5 },
  results20: { netEquity: 3000000, totalAssetValue: 5000000, totalLoanBalance: 2000000, cumulativeCashFlow: 200000, propertiesOwned: 10 },
  results30: { netEquity: 8000000, totalAssetValue: 10000000, totalLoanBalance: 2000000, cumulativeCashFlow: 500000, propertiesOwned: 10 },
  yearlyData: [],
  monthlyPayment: 2500,
  loanAmount: 600000,
  marketValue: 600000,
  annualRentalIncome: 48000,
  annualExpensePerProperty: 0,
  loanTenure: 35,
  monthlyExpensePerProperty: 0,
};

const sampleSummary = {
  purchasePrice: 500000,
  equity10: 1000000,
  equity20: 3000000,
  equity30: 8000000,
  properties: 10,
};

describe("portfolio router", () => {
  const caller = appRouter.createCaller;

  beforeEach(() => {
    mockPortfolios.length = 0;
    insertIdCounter = 1;
  });

  describe("portfolio.create", () => {
    it("should create a portfolio for authenticated user", async () => {
      const ctx = createAuthContext();
      const trpc = caller(ctx);

      const result = await trpc.portfolio.create({
        name: "Test Portfolio",
        propertyInputs: samplePropertyInputs,
        propertyResults: samplePropertyResults,
        summary: sampleSummary,
      });

      expect(result).toHaveProperty("id");
      expect(typeof result.id).toBe("number");
    });

    it("should reject unauthenticated create", async () => {
      const ctx = createUnauthContext();
      const trpc = caller(ctx);

      await expect(
        trpc.portfolio.create({
          name: "Test Portfolio",
          propertyInputs: samplePropertyInputs,
          propertyResults: samplePropertyResults,
          summary: sampleSummary,
        })
      ).rejects.toThrow();
    });

    it("should reject empty portfolio name", async () => {
      const ctx = createAuthContext();
      const trpc = caller(ctx);

      await expect(
        trpc.portfolio.create({
          name: "",
          propertyInputs: samplePropertyInputs,
          propertyResults: samplePropertyResults,
          summary: sampleSummary,
        })
      ).rejects.toThrow();
    });

    it("should accept portfolio with stock data", async () => {
      const ctx = createAuthContext();
      const trpc = caller(ctx);

      const result = await trpc.portfolio.create({
        name: "Full Portfolio",
        propertyInputs: samplePropertyInputs,
        stockInputs: { enableStockReinvestment: true, stockDividendYield: 6, stockDiscount: 20, stockAppreciation: 5, reinvestDividends: true },
        propertyResults: samplePropertyResults,
        stockResults: { yearlyData: [], totalCashbackPerProperty: 100000, totalCashbackAllProperties: 1000000, stock10Year: { portfolioValue: 500000, totalDividends: 50000, totalInvested: 400000 }, stock20Year: { portfolioValue: 1500000, totalDividends: 200000, totalInvested: 800000 }, stock30Year: { portfolioValue: 4000000, totalDividends: 500000, totalInvested: 1200000 } },
        summary: { ...sampleSummary, stockValue30: 4000000, combined30: 12000000 },
      });

      expect(result).toHaveProperty("id");
    });
  });

  describe("portfolio.list", () => {
    it("should list portfolios for authenticated user", async () => {
      const ctx = createAuthContext();
      const trpc = caller(ctx);

      const result = await trpc.portfolio.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should reject unauthenticated list", async () => {
      const ctx = createUnauthContext();
      const trpc = caller(ctx);

      await expect(trpc.portfolio.list()).rejects.toThrow();
    });
  });

  describe("portfolio.delete", () => {
    it("should reject unauthenticated delete", async () => {
      const ctx = createUnauthContext();
      const trpc = caller(ctx);

      await expect(trpc.portfolio.delete({ id: 1 })).rejects.toThrow();
    });
  });

  describe("portfolio.rename", () => {
    it("should reject unauthenticated rename", async () => {
      const ctx = createUnauthContext();
      const trpc = caller(ctx);

      await expect(trpc.portfolio.rename({ id: 1, name: "New Name" })).rejects.toThrow();
    });

    it("should reject empty name", async () => {
      const ctx = createAuthContext();
      const trpc = caller(ctx);

      await expect(trpc.portfolio.rename({ id: 1, name: "" })).rejects.toThrow();
    });
  });
});
