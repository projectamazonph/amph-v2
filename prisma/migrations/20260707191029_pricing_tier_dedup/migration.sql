-- DropIndex
DROP INDEX "PricingTier_tier_key";

-- CreateIndex
CREATE INDEX "PricingTier_tier_idx" ON "PricingTier"("tier");
