-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'accepted', 'preparing', 'ready', 'served', 'cancelled', 'rejected');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('unpaid', 'payment_requested', 'paid', 'partially_paid', 'refunded');

-- CreateEnum
CREATE TYPE "TableSessionStatus" AS ENUM ('active', 'payment_requested', 'closed');

-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('qr_menu');

-- CreateEnum
CREATE TYPE "OrderAcceptMode" AS ENUM ('staff', 'auto');

-- CreateEnum
CREATE TYPE "ServiceRequestType" AS ENUM ('waiter', 'bill', 'water', 'cleaning', 'other');

-- CreateEnum
CREATE TYPE "ServiceRequestStatus" AS ENUM ('pending', 'acknowledged', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "StockStatus" AS ENUM ('in_stock', 'out_of_stock', 'disabled');

-- AlterTable (RestaurantTable — QR token yönetimi)
ALTER TABLE "RestaurantTable"
  ADD COLUMN "branchId" TEXT,
  ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "lastUsedAt" TIMESTAMP(3);

-- AlterTable (MenuItem — sipariş alanları)
ALTER TABLE "MenuItem"
  ADD COLUMN "discountPrice" DECIMAL(10,2),
  ADD COLUMN "prepMinutes" INTEGER,
  ADD COLUMN "stockQty" INTEGER,
  ADD COLUMN "stockStatus" "StockStatus" NOT NULL DEFAULT 'in_stock',
  ADD COLUMN "isOrderable" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "stationId" TEXT;

-- CreateTable
CREATE TABLE "OrderSettings" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "branchId" TEXT,
    "qrOrderingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "acceptMode" "OrderAcceptMode" NOT NULL DEFAULT 'staff',
    "callWaiterEnabled" BOOLEAN NOT NULL DEFAULT true,
    "requestBillEnabled" BOOLEAN NOT NULL DEFAULT true,
    "askCustomerName" BOOLEAN NOT NULL DEFAULT false,
    "allowNotes" BOOLEAN NOT NULL DEFAULT true,
    "serviceRequestTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "minOrderTotal" DECIMAL(10,2),
    "acceptFrom" TEXT,
    "acceptTo" TEXT,
    "prepWarnMins" INTEGER NOT NULL DEFAULT 15,
    "soundEnabled" BOOLEAN NOT NULL DEFAULT true,
    "kitchenEnabled" BOOLEAN NOT NULL DEFAULT true,
    "stockControl" BOOLEAN NOT NULL DEFAULT true,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TableSession" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "branchId" TEXT,
    "status" "TableSessionStatus" NOT NULL DEFAULT 'active',
    "customerName" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "closedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TableSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "branchId" TEXT,
    "tableId" TEXT,
    "sessionId" TEXT,
    "tableLabel" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "source" "OrderSource" NOT NULL DEFAULT 'qr_menu',
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'unpaid',
    "paymentMethod" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "customerName" TEXT,
    "note" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "readyAt" TIMESTAMP(3),
    "servedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "menuItemId" TEXT,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "taxRate" DECIMAL(5,2),
    "lineTotal" DECIMAL(10,2) NOT NULL,
    "note" TEXT,
    "stationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItemModifier" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "groupName" TEXT,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "OrderItemModifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromStatus" "OrderStatus",
    "toStatus" "OrderStatus" NOT NULL,
    "byUserId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "tableId" TEXT,
    "tableLabel" TEXT,
    "sessionId" TEXT,
    "type" "ServiceRequestType" NOT NULL,
    "status" "ServiceRequestStatus" NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "handledById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KitchenStation" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KitchenStation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModifierGroup" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "minSelect" INTEGER NOT NULL DEFAULT 0,
    "maxSelect" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModifierGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModifierOption" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceDelta" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ModifierOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrintJob" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "printedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "PrintJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderSettings_businessId_key" ON "OrderSettings"("businessId");
CREATE INDEX "TableSession_businessId_status_idx" ON "TableSession"("businessId", "status");
CREATE INDEX "TableSession_tableId_status_idx" ON "TableSession"("tableId", "status");
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");
CREATE UNIQUE INDEX "Order_businessId_code_key" ON "Order"("businessId", "code");
CREATE INDEX "Order_businessId_status_idx" ON "Order"("businessId", "status");
CREATE INDEX "Order_businessId_paymentStatus_idx" ON "Order"("businessId", "paymentStatus");
CREATE INDEX "Order_sessionId_idx" ON "Order"("sessionId");
CREATE INDEX "Order_tableId_idx" ON "Order"("tableId");
CREATE INDEX "Order_businessId_createdAt_idx" ON "Order"("businessId", "createdAt");
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItemModifier_orderItemId_idx" ON "OrderItemModifier"("orderItemId");
CREATE INDEX "OrderEvent_orderId_idx" ON "OrderEvent"("orderId");
CREATE INDEX "ServiceRequest_businessId_status_idx" ON "ServiceRequest"("businessId", "status");
CREATE INDEX "KitchenStation_businessId_idx" ON "KitchenStation"("businessId");
CREATE INDEX "ModifierGroup_menuItemId_idx" ON "ModifierGroup"("menuItemId");
CREATE INDEX "ModifierOption_groupId_idx" ON "ModifierOption"("groupId");
CREATE INDEX "PrintJob_orderId_idx" ON "PrintJob"("orderId");
CREATE INDEX "MenuItem_stationId_idx" ON "MenuItem"("stationId");

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "KitchenStation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderSettings" ADD CONSTRAINT "OrderSettings_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TableSession" ADD CONSTRAINT "TableSession_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TableSession" ADD CONSTRAINT "TableSession_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "RestaurantTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "RestaurantTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TableSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItemModifier" ADD CONSTRAINT "OrderItemModifier_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "RestaurantTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TableSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "KitchenStation" ADD CONSTRAINT "KitchenStation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ModifierGroup" ADD CONSTRAINT "ModifierGroup_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ModifierOption" ADD CONSTRAINT "ModifierOption_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ModifierGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrintJob" ADD CONSTRAINT "PrintJob_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
