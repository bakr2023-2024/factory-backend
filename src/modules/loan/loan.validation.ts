import z from "zod";
import { fields } from "../../utils/generalFields";
import { FilterRule } from "../../utils/utils";

export const paginateLoans = {
  query: fields.paginate("Loan").extend({
    rateId: fields.integerParam.optional(),
    productionDayId:fields.integerParam.optional(),
    productionDate:fields.date.optional(),
    laborerId: fields.integerParam.optional(),
    laborerName: fields.name.optional(),
    laborerNumber: fields.number.optional(),
    seasonId: fields.integerParam.optional(),
    minAmount: fields.doubleParam.optional(),
    maxAmount: fields.doubleParam.optional(),
    occurredFrom: fields.dateTime.optional(),
    occurredTo: fields.dateTime.optional(),
  }),
};
export const loanRules: FilterRule<paginateLoansDTO>[] = [
  { path: ["rateId"], param: "rateId" },
  {path:['productionDay','productionDate'],param:"productionDate"},
  {path:['productionDayId'],param:"productionDayId"},
  { path: ["rate", "seasonId"], param: "seasonId" },
  { path: ["rate", "laborerId"], param: "laborerId" },
  { path: ["rate", "laborer", "name"], param: "laborerName", op: "contains" },
  {
    path: ["rate", "laborer", "number"],
    param: "laborerNumber",
    op: "contains",
  },
  { path: ["amount"], param: "minAmount", op: "gte" },
  { path: ["amount"], param: "maxAmount", op: "lte" },
  { path: ["occurredAt"], param: "occurredFrom", op: "gte" },
  { path: ["occurredAt"], param: "occurredTo", op: "lte" },
  { path: ["createdAt"], param: "createdFrom", op: "gte" },
  { path: ["createdAt"], param: "createdTo", op: "lte" },
];
export const getLoan = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};
export const createLoan = {
  body: z.strictObject({
    rateId: fields.integerBody,
    productionDayId:fields.integerBody,
    amount: fields.doubleBody,
    occurredAt: fields.dateTime.optional(),
    notes: z.string().optional(),
  }),
};
export const updateLoan = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
  body: z.strictObject({
    rateId: fields.integerBody.optional(),
    productionDayId:fields.integerBody.optional(),
    amount: fields.doubleBody.optional(),
    occurredAt: fields.dateTime.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteLoan = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};

export type paginateLoansDTO = z.infer<typeof paginateLoans.query>;
export type getLoanParamsDTO = z.infer<typeof getLoan.params>;
export type createLoanBodyDTO = z.infer<typeof createLoan.body>;
export type updateLoanParamsDTO = z.infer<typeof updateLoan.params>;
export type updateLoanBodyDTO = z.infer<typeof updateLoan.body>;
export type deleteLoanParamsDTO = z.infer<typeof deleteLoan.params>;
