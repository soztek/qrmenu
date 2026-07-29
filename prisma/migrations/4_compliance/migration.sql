-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "allergens" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "calories" INTEGER,
ADD COLUMN     "carbs" DECIMAL(5,1),
ADD COLUMN     "containsAlcohol" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "containsPork" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fat" DECIMAL(5,1),
ADD COLUMN     "meatType" TEXT,
ADD COLUMN     "protein" DECIMAL(5,1);

