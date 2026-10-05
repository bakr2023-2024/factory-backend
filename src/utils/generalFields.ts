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
  date: z.iso
    .date({ message: "Invalid Date" })
    .transform((s) => new Date(`${s}T00:00:00.000Z`)),
  dateTime: z.iso.datetime({ message: "Invalid DateTime" }),
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
  quantity: z
    .number()
    .int()
    .min(1, { message: "quantity can only be a positive integer" }),
  unitPriceBody: z
    .number()
    .min(0.01, { message: "price can only be a positive number" }),
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
  Variant: Object.values(Prisma.VariantScalarFieldEnum),
  Supplier: Object.values(Prisma.SupplierScalarFieldEnum).filter(
    (key) => key !== "number",
  ),
  Customer: Object.values(Prisma.CustomerScalarFieldEnum).filter(
    (key) => key !== "number",
  ),
  Import: Object.values(Prisma.ImportScalarFieldEnum),
  Export: Object.values(Prisma.ExportScalarFieldEnum),
  ImportItem: Object.values(Prisma.ImportItemScalarFieldEnum),
  ExportItem: Object.values(Prisma.ExportItemScalarFieldEnum),
  User: [],
  StockMovement: [],
  Season: Object.values(Prisma.SeasonScalarFieldEnum),
  Week: Object.values(Prisma.WeekScalarFieldEnum),
  ProductionDay: Object.values(Prisma.ProductionDayScalarFieldEnum),
  ProductionEntry: [],
  ProductionBatch: [],
  Consumption: [],
};