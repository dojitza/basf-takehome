CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'PHASE_OUT', 'DISCONTINUED', 'UNKNOWN');

CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT,
    "chemicalName" TEXT,
    "function" TEXT,
    "applicationArea" TEXT,
    "region" TEXT,
    "certifications" TEXT[],
    "status" "ProductStatus" NOT NULL,
    "launchYear" INTEGER,
    "description" TEXT,
    "presentInLatestImport" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "lastImportedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
