-- Add claim token fields to User model (C4 - guest account claiming fix)
ALTER TABLE "User" ADD COLUMN "claimTokenHash" TEXT;
ALTER TABLE "User" ADD COLUMN "claimTokenExpiresAt" TIMESTAMP(3);

CREATE INDEX "User_claimTokenHash_idx" ON "User"("claimTokenHash");
