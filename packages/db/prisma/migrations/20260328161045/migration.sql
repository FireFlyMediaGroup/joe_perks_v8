-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ROASTER_ADMIN', 'ORG_ADMIN', 'PLATFORM_ADMIN');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RoasterStatus" AS ENUM ('ONBOARDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "OrgApplicationStatus" AS ENUM ('PENDING_PLATFORM_REVIEW', 'PENDING_ROASTER_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RoasterOrgRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');

-- CreateEnum
CREATE TYPE "OrgStatus" AS ENUM ('ONBOARDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RoastLevel" AS ENUM ('LIGHT', 'MEDIUM', 'MEDIUM_DARK', 'DARK');

-- CreateEnum
CREATE TYPE "GrindOption" AS ENUM ('WHOLE_BEAN', 'GROUND_DRIP', 'GROUND_ESPRESSO', 'GROUND_FRENCH_PRESS');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ENDED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'HELD', 'TRANSFERRED', 'FAILED');

-- CreateEnum
CREATE TYPE "FulfillerType" AS ENUM ('ROASTER', 'PLATFORM');

-- CreateEnum
CREATE TYPE "StripeOnboardingStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'COMPLETE', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "DebtReason" AS ENUM ('DISPUTE_LOSS', 'CHARGEBACK', 'MANUAL_ADJUSTMENT', 'PLATFORM_FEE');

-- CreateEnum
CREATE TYPE "OrderEventType" AS ENUM ('ORDER_CREATED', 'PAYMENT_INTENT_CREATED', 'PAYMENT_SUCCEEDED', 'PAYMENT_FAILED', 'ORDER_CONFIRMED', 'FULFILLMENT_VIEWED', 'SHIPPED', 'DELIVERED', 'REFUND_INITIATED', 'REFUND_COMPLETED', 'CANCELLED', 'DISPUTE_OPENED', 'DISPUTE_CLOSED', 'SLA_WARNING', 'SLA_BREACH', 'NOTE_ADDED');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('BUYER', 'ROASTER', 'ORG', 'ADMIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "MagicLinkPurpose" AS ENUM ('ORDER_FULFILLMENT', 'ORG_APPROVAL', 'ROASTER_REVIEW');

-- CreateEnum
CREATE TYPE "FaultType" AS ENUM ('ROASTER', 'PLATFORM', 'BUYER_FRAUD', 'UNCLEAR');

-- CreateEnum
CREATE TYPE "DisputeOutcome" AS ENUM ('WON', 'LOST', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL,
    "platformFeePct" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "platformFeeFloor" INTEGER NOT NULL DEFAULT 100,
    "orgPctMin" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "orgPctMax" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "orgPctDefault" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "slaWarnHours" INTEGER NOT NULL DEFAULT 24,
    "slaBreachHours" INTEGER NOT NULL DEFAULT 48,
    "slaCriticalHours" INTEGER NOT NULL DEFAULT 72,
    "slaAutoRefundHours" INTEGER NOT NULL DEFAULT 96,
    "payoutHoldDays" INTEGER NOT NULL DEFAULT 7,
    "disputeFeeCents" INTEGER NOT NULL DEFAULT 1500,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderSequence" (
    "id" TEXT NOT NULL,
    "nextVal" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OrderSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "externalAuthId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "roasterId" TEXT,
    "orgId" TEXT,
    "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoasterApplication" (
    "id" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL,
    "email" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "termsAgreedAt" TIMESTAMP(3) NOT NULL,
    "termsVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoasterApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Roaster" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" "RoasterStatus" NOT NULL,
    "email" TEXT NOT NULL,
    "stripeAccountId" TEXT NOT NULL,
    "stripeOnboarding" "StripeOnboardingStatus" NOT NULL,
    "chargesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "payoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "fulfillerType" "FulfillerType" NOT NULL,
    "disputeCount90d" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Roaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoasterShippingRate" (
    "id" TEXT NOT NULL,
    "roasterId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "carrier" TEXT NOT NULL,
    "flatRate" INTEGER NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoasterShippingRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoasterDebt" (
    "id" TEXT NOT NULL,
    "roasterId" TEXT NOT NULL,
    "orderId" TEXT,
    "amount" INTEGER NOT NULL,
    "reason" "DebtReason" NOT NULL,
    "settled" BOOLEAN NOT NULL DEFAULT false,
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoasterDebt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgApplication" (
    "id" TEXT NOT NULL,
    "status" "OrgApplicationStatus" NOT NULL,
    "email" TEXT NOT NULL,
    "desiredSlug" TEXT NOT NULL,
    "desiredOrgPct" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoasterOrgRequest" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "roasterId" TEXT NOT NULL,
    "status" "RoasterOrgRequestStatus" NOT NULL,
    "priority" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoasterOrgRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Org" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" "OrgStatus" NOT NULL,
    "email" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "stripeAccountId" TEXT NOT NULL,
    "stripeOnboarding" "StripeOnboardingStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Org_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "roasterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roastLevel" "RoastLevel" NOT NULL,
    "status" "ProductStatus" NOT NULL,
    "isCollab" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT,
    "sizeOz" INTEGER NOT NULL,
    "grind" "GrindOption" NOT NULL,
    "wholesalePrice" INTEGER NOT NULL,
    "retailPrice" INTEGER NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CampaignStatus" NOT NULL,
    "orgPct" DOUBLE PRECISION NOT NULL,
    "goalCents" INTEGER,
    "totalRaised" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignItem" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "retailPrice" INTEGER NOT NULL,
    "wholesalePrice" INTEGER NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Buyer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Buyer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "roasterId" TEXT NOT NULL,
    "buyerId" TEXT,
    "fulfillerType" "FulfillerType" NOT NULL,
    "productSubtotal" INTEGER NOT NULL,
    "shippingAmount" INTEGER NOT NULL,
    "grossAmount" INTEGER NOT NULL,
    "stripeFee" INTEGER NOT NULL,
    "orgPctSnapshot" DOUBLE PRECISION NOT NULL,
    "orgAmount" INTEGER NOT NULL,
    "platformAmount" INTEGER NOT NULL,
    "roasterAmount" INTEGER NOT NULL,
    "roasterTotal" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "fulfillBy" TIMESTAMP(3) NOT NULL,
    "payoutStatus" "PayoutStatus" NOT NULL,
    "payoutEligibleAt" TIMESTAMP(3),
    "stripePiId" TEXT NOT NULL,
    "stripeChargeId" TEXT,
    "stripeTransferId" TEXT,
    "stripeOrgTransfer" TEXT,
    "transferGroup" TEXT NOT NULL,
    "trackingNumber" TEXT,
    "carrier" TEXT,
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "buyerIp" TEXT NOT NULL,
    "isCollab" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "variantDesc" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "lineTotal" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "eventType" "OrderEventType" NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "actorId" TEXT,
    "payload" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisputeRecord" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "stripeDisputeId" TEXT NOT NULL,
    "faultAttribution" "FaultType",
    "evidenceSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "outcome" "DisputeOutcome",
    "respondBy" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisputeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagicLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "purpose" "MagicLinkPurpose" NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "payload" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MagicLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "providerId" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeEvent" (
    "id" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_externalAuthId_key" ON "User"("externalAuthId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_roasterId_idx" ON "User"("roasterId");

-- CreateIndex
CREATE INDEX "User_orgId_idx" ON "User"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "RoasterApplication_email_key" ON "RoasterApplication"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Roaster_applicationId_key" ON "Roaster"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "Roaster_email_key" ON "Roaster"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Roaster_stripeAccountId_key" ON "Roaster"("stripeAccountId");

-- CreateIndex
CREATE INDEX "RoasterShippingRate_roasterId_idx" ON "RoasterShippingRate"("roasterId");

-- CreateIndex
CREATE INDEX "RoasterDebt_roasterId_idx" ON "RoasterDebt"("roasterId");

-- CreateIndex
CREATE INDEX "RoasterDebt_orderId_idx" ON "RoasterDebt"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "OrgApplication_email_key" ON "OrgApplication"("email");

-- CreateIndex
CREATE UNIQUE INDEX "OrgApplication_desiredSlug_key" ON "OrgApplication"("desiredSlug");

-- CreateIndex
CREATE INDEX "RoasterOrgRequest_roasterId_idx" ON "RoasterOrgRequest"("roasterId");

-- CreateIndex
CREATE UNIQUE INDEX "RoasterOrgRequest_applicationId_roasterId_key" ON "RoasterOrgRequest"("applicationId", "roasterId");

-- CreateIndex
CREATE UNIQUE INDEX "Org_applicationId_key" ON "Org"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "Org_email_key" ON "Org"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Org_slug_key" ON "Org"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Org_stripeAccountId_key" ON "Org"("stripeAccountId");

-- CreateIndex
CREATE INDEX "Product_roasterId_idx" ON "Product"("roasterId");

-- CreateIndex
CREATE INDEX "Product_deletedAt_idx" ON "Product"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE INDEX "ProductVariant_deletedAt_idx" ON "ProductVariant"("deletedAt");

-- CreateIndex
CREATE INDEX "Campaign_orgId_idx" ON "Campaign"("orgId");

-- CreateIndex
CREATE INDEX "CampaignItem_campaignId_idx" ON "CampaignItem"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignItem_campaignId_variantId_key" ON "CampaignItem"("campaignId", "variantId");

-- CreateIndex
CREATE UNIQUE INDEX "Buyer_email_key" ON "Buyer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripePiId_key" ON "Order"("stripePiId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripeChargeId_key" ON "Order"("stripeChargeId");

-- CreateIndex
CREATE INDEX "Order_campaignId_idx" ON "Order"("campaignId");

-- CreateIndex
CREATE INDEX "Order_roasterId_idx" ON "Order"("roasterId");

-- CreateIndex
CREATE INDEX "Order_buyerId_idx" ON "Order"("buyerId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderEvent_orderId_idx" ON "OrderEvent"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "DisputeRecord_orderId_key" ON "DisputeRecord"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "DisputeRecord_stripeDisputeId_key" ON "DisputeRecord"("stripeDisputeId");

-- CreateIndex
CREATE UNIQUE INDEX "MagicLink_token_key" ON "MagicLink"("token");

-- CreateIndex
CREATE INDEX "MagicLink_token_idx" ON "MagicLink"("token");

-- CreateIndex
CREATE INDEX "EmailLog_entityId_idx" ON "EmailLog"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailLog_entityType_entityId_template_key" ON "EmailLog"("entityType", "entityId", "template");

-- CreateIndex
CREATE UNIQUE INDEX "StripeEvent_stripeEventId_key" ON "StripeEvent"("stripeEventId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roasterId_fkey" FOREIGN KEY ("roasterId") REFERENCES "Roaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Roaster" ADD CONSTRAINT "Roaster_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "RoasterApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoasterShippingRate" ADD CONSTRAINT "RoasterShippingRate_roasterId_fkey" FOREIGN KEY ("roasterId") REFERENCES "Roaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoasterDebt" ADD CONSTRAINT "RoasterDebt_roasterId_fkey" FOREIGN KEY ("roasterId") REFERENCES "Roaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoasterDebt" ADD CONSTRAINT "RoasterDebt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoasterOrgRequest" ADD CONSTRAINT "RoasterOrgRequest_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "OrgApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoasterOrgRequest" ADD CONSTRAINT "RoasterOrgRequest_roasterId_fkey" FOREIGN KEY ("roasterId") REFERENCES "Roaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Org" ADD CONSTRAINT "Org_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "OrgApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_roasterId_fkey" FOREIGN KEY ("roasterId") REFERENCES "Roaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignItem" ADD CONSTRAINT "CampaignItem_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignItem" ADD CONSTRAINT "CampaignItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignItem" ADD CONSTRAINT "CampaignItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_roasterId_fkey" FOREIGN KEY ("roasterId") REFERENCES "Roaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeRecord" ADD CONSTRAINT "DisputeRecord_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
