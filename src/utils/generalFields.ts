import z from "zod";
import { Prisma } from "../db/generated/prisma/client";
const strToNum = (message: string, isInt = false) => {
  return z
    .string()
    .refine(
      (val) => {
        const n = Number(val.trim());
        return n && !isNaN(n) && n >= 0 && (!isInt || Number.isInteger(n));
      },
      { message },
    )
    .transform((val) => Number(val));
};
export const fields = {
  date: z.iso
    .date({ message: "Invalid Date" })
    .transform((s) => new Date(`${s}T00:00:00.000Z`)),
  dateTime: z.iso.datetime({ message: "Invalid DateTime" }),
  name: z
    .string()
    .min(3, { message: "Name is too short" })
    .max(100, { message: "Name is too long" }),
  number: z
    .string()
    .min(5, { message: "Number is too short" })
    .max(40, { message: "Number is too long" }),
  doubleBody: (message: string = "value can only be a positive number") =>
    z.number().min(0, { message }),
  integerBody: (message: string = "value can only be a positive integer") =>
    z.number().int().min(0, { message }),
  doubleParam: (message: string = "value can only be a positive number") =>
    strToNum(message),
  integerParam: (message: string = "value can only be a positive integer") =>
    strToNum(message),
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
  StockMovement: Object.values(Prisma.StockMovementScalarFieldEnum),
  Season: Object.values(Prisma.SeasonScalarFieldEnum),
  Week: Object.values(Prisma.WeekScalarFieldEnum),
  ProductionDay: Object.values(Prisma.ProductionDayScalarFieldEnum),
  ProductionEntry: Object.values(Prisma.ProductionEntryScalarFieldEnum),
  ProductionBatch: Object.values(Prisma.ProductionBatchScalarFieldEnum),
  Consumption: Object.values(Prisma.ConsumptionScalarFieldEnum),
  CustomerReturn: Object.values(Prisma.CustomerReturnScalarFieldEnum),
  SupplierReturn: Object.values(Prisma.SupplierReturnScalarFieldEnum),
  SupplierReturnItem: Object.values(Prisma.SupplierReturnItemScalarFieldEnum),
  CustomerReturnItem: Object.values(Prisma.CustomerReturnItemScalarFieldEnum),
  Laborer: Object.values(Prisma.LaborerScalarFieldEnum),
  Rate: Object.values(Prisma.RateScalarFieldEnum),
  Attendance: Object.values(Prisma.AttendanceScalarFieldEnum),
  Loan: Object.values(Prisma.LoanScalarFieldEnum),
  LoanPayment: Object.values(Prisma.LoanPaymentScalarFieldEnum),
  Payment: Object.values(Prisma.PaymentScalarFieldEnum),
};