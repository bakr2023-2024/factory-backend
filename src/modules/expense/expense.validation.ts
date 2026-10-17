import z from "zod";
import { fields } from "../../utils/generalFields";
import { ExpenseType } from "../../db/generated/prisma/enums";
import { FilterRule } from "../../utils/utils";

export const paginateExpenses = {
  query: fields.paginate("Expense").extend({
    productionDayId: fields.integerParam.optional(),
    productionDate: fields.date.optional(),
    minAmount: fields.doubleParam.optional(),
    maxAmount: fields.doubleParam.optional(),
    type: z.enum(Object.values(ExpenseType)).optional(),
    occurredFrom: fields.dateTime.optional(),
    occurredTo: fields.dateTime.optional(),
  }),
};
export const expenseRules: FilterRule<paginateExpensesDTO>[] = [
  { path: ["productionDayId"], param: "productionDayId" },
  { path: ["productionDay", "productionDate"], param: "productionDate" },
  { path: ["type"], param: "type" },
  { path: ["amount"], param: "minAmount", op: "gte" },
  { path: ["amount"], param: "maxAmount", op: "lte" },
  { path: ["occurredAt"], param: "occurredFrom", op: "gte" },
  { path: ["occurredAt"], param: "occurredTo", op: "lte" },
  { path: ["createdAt"], param: "createdFrom", op: "gte" },
  { path: ["createdAt"], param: "createdTo", op: "lte" },
];
export const getExpense = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};
export const createExpense = {
  body: z.strictObject({
    productionDayId: fields.integerBody,
    amount: fields.doubleBody,
    type: z.enum(ExpenseType),
    occurredAt: fields.dateTime.optional(),
    notes: z.string().optional(),
  }),
};
export const updateExpense = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
  body: z.strictObject({
    productionDayId: fields.integerBody.optional(),
    amount: fields.doubleBody.optional(),
    type: z.enum(ExpenseType).optional(),
    occurredAt: fields.dateTime.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteExpense = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};

export type paginateExpensesDTO = z.infer<typeof paginateExpenses.query>;
export type getExpenseParamsDTO = z.infer<typeof getExpense.params>;
export type createExpenseBodyDTO = z.infer<typeof createExpense.body>;
export type updateExpenseParamsDTO = z.infer<typeof updateExpense.params>;
export type updateExpenseBodyDTO = z.infer<typeof updateExpense.body>;
export type deleteExpenseParamsDTO = z.infer<typeof deleteExpense.params>;
