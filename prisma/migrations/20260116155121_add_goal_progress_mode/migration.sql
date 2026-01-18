-- CreateEnum
CREATE TYPE "GoalProgressMode" AS ENUM ('INCOME_ADDS', 'EXPENSE_ADDS');

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "progressMode" "GoalProgressMode" NOT NULL DEFAULT 'INCOME_ADDS';
