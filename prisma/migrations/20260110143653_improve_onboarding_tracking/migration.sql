-- AlterTable
ALTER TABLE "User" ADD COLUMN     "onboardingCompletedActions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "onboardingCurrentStep" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "onboardingSkipped" BOOLEAN NOT NULL DEFAULT false;
