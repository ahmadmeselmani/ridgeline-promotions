-- CreateTable
CREATE TABLE "Rulebook" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "resolution" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Promotion" (
    "rulebookName" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "audience" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL,
    "appliesTo" JSONB NOT NULL,
    "schedule" JSONB NOT NULL,
    "venueIds" JSONB,
    "venueOverrides" JSONB NOT NULL,
    "stacksWith" JSONB NOT NULL,

    PRIMARY KEY ("rulebookName", "promotionId"),
    CONSTRAINT "Promotion_rulebookName_fkey" FOREIGN KEY ("rulebookName") REFERENCES "Rulebook" ("name") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PriceOverride" (
    "seq" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "venueId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quotedCents" INTEGER NOT NULL,
    "chargedCents" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "PriceOverride_venueId_idx" ON "PriceOverride"("venueId");
