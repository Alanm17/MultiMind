/*
  Warnings:

  - A unique constraint covering the columns `[sessionId]` on the table `MemorySummary` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "MemorySummary_sessionId_key" ON "MemorySummary"("sessionId");
