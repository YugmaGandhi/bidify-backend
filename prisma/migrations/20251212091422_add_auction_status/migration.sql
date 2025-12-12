-- CreateEnum
CREATE TYPE "AuctionStatus" AS ENUM ('ACTIVE', 'CLOSED', 'SOLD');

-- AlterTable
ALTER TABLE "auctions" ADD COLUMN     "status" "AuctionStatus" NOT NULL DEFAULT 'ACTIVE';
