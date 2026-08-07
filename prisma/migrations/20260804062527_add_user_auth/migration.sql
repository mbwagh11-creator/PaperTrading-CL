-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "passwordSalt" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "instrumentKey" TEXT,
    "side" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "entryPrice" REAL NOT NULL,
    "exitPrice" REAL,
    "stopLoss" REAL,
    "target" REAL,
    "currentPrice" REAL,
    "pnl" REAL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    CONSTRAINT "Trade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Instrument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instrumentKey" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "tradingSymbol" TEXT NOT NULL,
    "name" TEXT,
    "instrumentType" TEXT,
    "strikePrice" REAL,
    "expiry" TEXT,
    "lotSize" INTEGER,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UpstoxSession" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "accessToken" TEXT NOT NULL,
    "userName" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Trade_status_idx" ON "Trade"("status");

-- CreateIndex
CREATE INDEX "Trade_symbol_idx" ON "Trade"("symbol");

-- CreateIndex
CREATE INDEX "Trade_userId_idx" ON "Trade"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Instrument_instrumentKey_key" ON "Instrument"("instrumentKey");

-- CreateIndex
CREATE INDEX "Instrument_tradingSymbol_idx" ON "Instrument"("tradingSymbol");

-- CreateIndex
CREATE INDEX "Instrument_exchange_idx" ON "Instrument"("exchange");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
