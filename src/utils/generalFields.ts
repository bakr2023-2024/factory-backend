import z from "zod";
import { Prisma } from "../db/generated/prisma/client";
const strToNum = (message: string) => {
  return z
    .string()
    .refine((val) => val.trim() && !isNaN(Number(val)) && Number(val) > 0, {
      message,
    })
    .transform((val) => Number(val));
};
export const fields = {
  idParam: strToNum("ID can only be a positive integer"),
  idBody: z
    .number()
    .int()
    .min(1, { message: "ID can only be a positive integer" }),
  unitWeight: z
    .number()
    .min(0.1, { message: "unit weight must be above 0" })
    .default(1),
  name: z
    .string()
    .min(3, { message: "Name is too short" })
    .max(100, { message: "Name is too long" }),
  number: z
    .string()
    .min(5, { message: "Number is too short" })
    .max(40, { message: "Number is too long" }),
  quantity: z.number().int().min(1,{message:"quantity can only be a positive integer"}),
  unitPriceBody: z.number().min(0.01,{message:"price can only be a positive number"}),
  unitPriceParam: strToNum("price can only be a positive number"),
  paginate: (table: Prisma.ModelName) =>
    z.strictObject({
      page: strToNum("page can only be a positive integer").default(1),
      size: strToNum("size can only be a positive integer").default(20),
      createdFrom: z.iso.datetime().optional(),
      createdTo: z.iso.datetime().optional(),
      sortBy: z.enum(sortFields[table]).optional(),
      order: z.enum(Object.values(Prisma.SortOrder)).default("desc"),
    }),
};

const sortFields: Record<Prisma.ModelName, string[]> = {
  Item: Object.values(Prisma.ItemScalarFieldEnum),
  Variant: Object.values(Prisma.VariantScalarFieldEnum).filter(
    (key) => key !== "itemId",
  ),
  Supplier: Object.values(Prisma.SupplierScalarFieldEnum).filter(
    (key) => key !== "number",
  ),
  Customer: Object.values(Prisma.CustomerScalarFieldEnum).filter(
    (key) => key !== "number",
  ),
  Import: Object.values(Prisma.ImportScalarFieldEnum).filter(
    (key) => key != "supplierId",
  ),
  Export: Object.values(Prisma.ExportScalarFieldEnum).filter(
    (key) => key != "customerId",
  ),
  ImportItem: Object.values(Prisma.ImportItemScalarFieldEnum).filter(
    (key) => !["supplierId", "variantId"].includes(key),
  ),
  ExportItem: Object.values(Prisma.ExportItemScalarFieldEnum).filter(
    (key) => !["customerId", "variantId"].includes(key),
  ),
  User: [],
  StockMovement: [],
  Season: [],
  Week: [],
  ProductionDay: [],
  ProductionEntry: [],
  ProductionBatch: [],
  Consumption: [],
};