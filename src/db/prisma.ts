import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma } from "./generated/prisma/client";
(Prisma.Decimal.prototype as any).toJSON = function () {
  return this.toNumber();
};
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export default prisma;
