-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "ua" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Visit_createdAt_idx" ON "Visit"("createdAt");

-- CreateIndex
CREATE INDEX "Visit_ip_idx" ON "Visit"("ip");

-- CreateIndex
CREATE INDEX "Visit_path_idx" ON "Visit"("path");
