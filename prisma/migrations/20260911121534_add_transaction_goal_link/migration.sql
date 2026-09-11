-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "goalId" TEXT;

-- CreateIndex
CREATE INDEX "Transaction_goalId_idx" ON "Transaction"("goalId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DataMigration: backfill Transaction.goalId from the category-based link,
-- but only for transactions that actually match the goal's progressMode
-- (INCOME_ADDS goals only count INCOME transactions, EXPENSE_ADDS only EXPENSE).
-- This makes the explicit link match what the old implicit logic *intended*,
-- not what it actually computed (see goals.ts vs notifications.ts divergence).
UPDATE "Transaction" t
SET "goalId" = c."goalId"
FROM "Category" c, "Goal" g
WHERE t."categoryId" = c.id
  AND c."goalId" IS NOT NULL
  AND g.id = c."goalId"
  AND t."goalId" IS NULL
  AND (
    (g."progressMode" = 'INCOME_ADDS' AND t."type" = 'INCOME')
    OR (g."progressMode" = 'EXPENSE_ADDS' AND t."type" = 'EXPENSE')
  );

-- Recompute currentAmount from the now-explicit transactions, so it reflects
-- one consistent definition instead of whichever of the two old code paths
-- last wrote to it.
UPDATE "Goal" g
SET "currentAmount" = COALESCE((
  SELECT SUM(ABS(t."amount"))
  FROM "Transaction" t
  WHERE t."goalId" = g.id
), 0);

-- Mark goals as COMPLETED if the recomputed amount already meets target,
-- matching the auto-complete rule in updateGoalFromTransaction.
UPDATE "Goal"
SET "status" = 'COMPLETED', "completedAt" = COALESCE("completedAt", now())
WHERE "status" = 'ACTIVE' AND "currentAmount" >= "targetAmount";
