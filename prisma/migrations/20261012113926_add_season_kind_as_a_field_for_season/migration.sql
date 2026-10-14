-- CreateEnum
CREATE TYPE "SeasonKind" AS ENUM ('NORMAL', 'SPECIAL');

-- AlterTable
ALTER TABLE "Season" ADD COLUMN     "kind" "SeasonKind" DEFAULT 'NORMAL';
