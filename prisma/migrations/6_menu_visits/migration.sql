-- CreateTable
CREATE TABLE "MenuVisit" (
    "day" DATE NOT NULL,
    "businessId" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MenuVisit_pkey" PRIMARY KEY ("day","businessId")
);

-- CreateIndex
CREATE INDEX "MenuVisit_businessId_idx" ON "MenuVisit"("businessId");

-- AddForeignKey
ALTER TABLE "MenuVisit" ADD CONSTRAINT "MenuVisit_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
