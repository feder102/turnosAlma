-- DropIndex
DROP INDEX "Payment_stripeSessionId_key";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "stripePaymentIntentId",
DROP COLUMN "stripeSessionId",
ADD COLUMN     "mpPaymentId" TEXT,
ALTER COLUMN "provider" SET DEFAULT 'mercadopago';

-- CreateIndex
CREATE UNIQUE INDEX "Payment_mpPaymentId_key" ON "Payment"("mpPaymentId");
