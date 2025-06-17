-- CreateTable
CREATE TABLE "UserModelUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "lastReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserModelUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserModelUsage_userId_modelId_idx" ON "UserModelUsage"("userId", "modelId");

-- CreateIndex
CREATE UNIQUE INDEX "UserModelUsage_userId_modelId_key" ON "UserModelUsage"("userId", "modelId");

-- AddForeignKey
ALTER TABLE "UserModelUsage" ADD CONSTRAINT "UserModelUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
