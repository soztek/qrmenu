-- AlterTable
ALTER TABLE "Business" ADD COLUMN "customDomain" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Business_customDomain_key" ON "Business"("customDomain");
