import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { portfolios } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const portfolioRouter = router({
  /** List all portfolios for the current user, newest first */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const rows = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.userId, ctx.user.id))
      .orderBy(desc(portfolios.updatedAt));

    return rows;
  }),

  /** Get a single portfolio by ID (must belong to current user) */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const rows = await db
        .select()
        .from(portfolios)
        .where(and(eq(portfolios.id, input.id), eq(portfolios.userId, ctx.user.id)))
        .limit(1);

      if (rows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Portfolio not found" });
      }

      return rows[0];
    }),

  /** Create a new portfolio */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        propertyInputs: z.any(),
        stockInputs: z.any().optional(),
        propertyResults: z.any(),
        stockResults: z.any().optional(),
        summary: z.any(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const result = await db.insert(portfolios).values({
        userId: ctx.user.id,
        name: input.name,
        propertyInputs: input.propertyInputs,
        stockInputs: input.stockInputs ?? null,
        propertyResults: input.propertyResults,
        stockResults: input.stockResults ?? null,
        summary: input.summary,
      });

      const insertId = result[0].insertId;
      return { id: insertId };
    }),

  /** Update an existing portfolio */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        propertyInputs: z.any().optional(),
        stockInputs: z.any().optional(),
        propertyResults: z.any().optional(),
        stockResults: z.any().optional(),
        summary: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify ownership
      const existing = await db
        .select({ id: portfolios.id })
        .from(portfolios)
        .where(and(eq(portfolios.id, input.id), eq(portfolios.userId, ctx.user.id)))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Portfolio not found" });
      }

      const updateSet: Record<string, unknown> = {};
      if (input.name !== undefined) updateSet.name = input.name;
      if (input.propertyInputs !== undefined) updateSet.propertyInputs = input.propertyInputs;
      if (input.stockInputs !== undefined) updateSet.stockInputs = input.stockInputs;
      if (input.propertyResults !== undefined) updateSet.propertyResults = input.propertyResults;
      if (input.stockResults !== undefined) updateSet.stockResults = input.stockResults;
      if (input.summary !== undefined) updateSet.summary = input.summary;

      if (Object.keys(updateSet).length > 0) {
        await db
          .update(portfolios)
          .set(updateSet)
          .where(eq(portfolios.id, input.id));
      }

      return { success: true };
    }),

  /** Rename a portfolio */
  rename: protectedProcedure
    .input(z.object({ id: z.number(), name: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const existing = await db
        .select({ id: portfolios.id })
        .from(portfolios)
        .where(and(eq(portfolios.id, input.id), eq(portfolios.userId, ctx.user.id)))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Portfolio not found" });
      }

      await db
        .update(portfolios)
        .set({ name: input.name })
        .where(eq(portfolios.id, input.id));

      return { success: true };
    }),

  /** Delete a portfolio */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const existing = await db
        .select({ id: portfolios.id })
        .from(portfolios)
        .where(and(eq(portfolios.id, input.id), eq(portfolios.userId, ctx.user.id)))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Portfolio not found" });
      }

      await db.delete(portfolios).where(eq(portfolios.id, input.id));

      return { success: true };
    }),
});
