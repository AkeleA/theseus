-- CreateTable
CREATE TABLE "Url" (
    "code" CHAR(9) NOT NULL,
    "longUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Url_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "ClickDaily" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ClickDaily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Url_createdAt_idx" ON "Url"("createdAt");

-- CreateIndex
CREATE INDEX "Url_createdBy_idx" ON "Url"("createdBy");

-- CreateIndex
CREATE INDEX "ClickDaily_day_idx" ON "ClickDaily"("day");

-- CreateIndex
CREATE UNIQUE INDEX "ClickDaily_code_day_key" ON "ClickDaily"("code", "day");
