-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "feedbackComment" TEXT,
ADD COLUMN     "feedbackIsPositive" BOOLEAN,
ADD COLUMN     "feedbackReason" TEXT[] DEFAULT ARRAY[]::TEXT[];
