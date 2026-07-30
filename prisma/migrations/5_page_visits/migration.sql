-- CreateTable
CREATE TABLE "PageVisit" (
    "day" DATE NOT NULL,
    "kind" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PageVisit_pkey" PRIMARY KEY ("day","kind")
);
