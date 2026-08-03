-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('instagram', 'facebook', 'tiktok', 'google_business');

-- CreateEnum
CREATE TYPE "SocialAccountStatus" AS ENUM ('active', 'expired', 'revoked');

-- CreateEnum
CREATE TYPE "SocialPostStatus" AS ENUM ('draft', 'pending_approval', 'approved', 'scheduled', 'publishing', 'published', 'failed', 'rejected');

-- CreateEnum
CREATE TYPE "SocialPostType" AS ENUM ('product', 'restaurant', 'menu', 'campaign', 'qr_menu', 'educational', 'customer_acquisition', 'special_day', 'auto');

-- CreateTable
CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL DEFAULT 'instagram',
    "status" "SocialAccountStatus" NOT NULL DEFAULT 'active',
    "providerUserId" TEXT NOT NULL,
    "username" TEXT,
    "displayName" TEXT,
    "profilePictureUrl" TEXT,
    "pageId" TEXT,
    "accessTokenEnc" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "accountId" TEXT,
    "platform" "SocialPlatform" NOT NULL DEFAULT 'instagram',
    "type" "SocialPostType" NOT NULL DEFAULT 'product',
    "status" "SocialPostStatus" NOT NULL DEFAULT 'draft',
    "menuItemId" TEXT,
    "title" TEXT,
    "body" TEXT,
    "cta" TEXT,
    "caption" TEXT,
    "hashtags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "imageUrl" TEXT,
    "sourceImageUrl" TEXT,
    "imageConcept" TEXT,
    "format" TEXT NOT NULL DEFAULT 'portrait',
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "externalPostId" TEXT,
    "permalink" TEXT,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "aiModel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialSchedule" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "postsPerWeek" INTEGER NOT NULL DEFAULT 3,
    "types" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "plan" JSONB,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Istanbul',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialSettings" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "brandTone" TEXT,
    "defaultHashtags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "includeQrLink" BOOLEAN NOT NULL DEFAULT true,
    "includeLogo" BOOLEAN NOT NULL DEFAULT true,
    "autoPublish" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialTemplate" (
    "id" TEXT NOT NULL,
    "businessId" TEXT,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SocialAccount_businessId_idx" ON "SocialAccount"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccount_businessId_platform_key" ON "SocialAccount"("businessId", "platform");

-- CreateIndex
CREATE INDEX "SocialPost_businessId_status_idx" ON "SocialPost"("businessId", "status");

-- CreateIndex
CREATE INDEX "SocialPost_scheduledAt_idx" ON "SocialPost"("scheduledAt");

-- CreateIndex
CREATE INDEX "SocialPost_accountId_idx" ON "SocialPost"("accountId");

-- CreateIndex
CREATE INDEX "SocialPost_menuItemId_idx" ON "SocialPost"("menuItemId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialSchedule_businessId_key" ON "SocialSchedule"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialSettings_businessId_key" ON "SocialSettings"("businessId");

-- CreateIndex
CREATE INDEX "SocialTemplate_businessId_idx" ON "SocialTemplate"("businessId");

-- AddForeignKey
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SocialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialSchedule" ADD CONSTRAINT "SocialSchedule_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialSettings" ADD CONSTRAINT "SocialSettings_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialTemplate" ADD CONSTRAINT "SocialTemplate_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
