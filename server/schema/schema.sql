-- AccessMap Nairobi API: database schema
-- Run this once against an empty PostgreSQL database before starting the server.
-- Table and column names use mixed case, so they must stay in double quotes
-- everywhere they are used in SQL.

CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "ramp" BOOLEAN NOT NULL,
    "lift" BOOLEAN NOT NULL,
    "accessibleToilet" BOOLEAN NOT NULL,
    "accessibleParking" BOOLEAN NOT NULL,
    "tactilePaving" BOOLEAN NOT NULL,
    "wideCorridors" BOOLEAN NOT NULL,
    "audioAssistance" BOOLEAN NOT NULL,
    "staffAssistance" BOOLEAN NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL,
    "isSeeded" BOOLEAN NOT NULL DEFAULT true,
    "isCivic" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Venue_slug_key" ON "Venue"("slug");

CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "description" TEXT,
    "visitedAt" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "ramp" BOOLEAN NOT NULL,
    "lift" BOOLEAN NOT NULL,
    "accessibleToilet" BOOLEAN NOT NULL,
    "accessibleParking" BOOLEAN NOT NULL,
    "tactilePaving" BOOLEAN NOT NULL,
    "wideCorridors" BOOLEAN NOT NULL,
    "audioAssistance" BOOLEAN NOT NULL,
    "staffAssistance" BOOLEAN NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);