-- CreateTable
CREATE TABLE "contractors" (
    "id" TEXT NOT NULL,
    "anonName" TEXT NOT NULL,
    "categories" TEXT[],
    "city" TEXT NOT NULL,
    "cityImputed" BOOLEAN NOT NULL DEFAULT false,
    "synthetic" BOOLEAN NOT NULL DEFAULT false,
    "priceFromKzt" INTEGER NOT NULL,
    "priceImputed" BOOLEAN NOT NULL DEFAULT false,
    "eventFormats" TEXT[],
    "languages" TEXT[],
    "maxHours" INTEGER,
    "busyDates" TEXT[],
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contractors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrichments" (
    "contractorId" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "signals" TEXT[],
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrichments_pkey" PRIMARY KEY ("contractorId")
);

-- CreateTable
CREATE TABLE "explanation_cache" (
    "id" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "factsUsed" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "explanation_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contractors_city_idx" ON "contractors"("city");

-- CreateIndex
CREATE INDEX "explanation_cache_requestHash_idx" ON "explanation_cache"("requestHash");

-- CreateIndex
CREATE UNIQUE INDEX "explanation_cache_requestHash_contractorId_key" ON "explanation_cache"("requestHash", "contractorId");

-- AddForeignKey
ALTER TABLE "enrichments" ADD CONSTRAINT "enrichments_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "contractors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
