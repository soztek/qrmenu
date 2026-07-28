-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "coverUrl" TEXT,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "mapsUrl" TEXT,
ADD COLUMN     "wifiName" TEXT,
ADD COLUMN     "wifiPassword" TEXT,
ADD COLUMN     "workingHours" TEXT;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "imageUrl" TEXT;

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Review_businessId_isApproved_idx" ON "Review"("businessId", "isApproved");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

