-- CreateTable
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
