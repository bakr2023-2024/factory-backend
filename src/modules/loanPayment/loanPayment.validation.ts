import z from "zod";
import { fields } from "../../utils/generalFields";
import { FilterRule } from "../../utils/utils";

export const paginateLoanPayments = {
  query: fields.paginate("LoanPayment").extend({
    rateId: fields.integerParam.optional(),
    laborerId: fields.integerParam.optional(),
    laborerName: fields.name.optional(),
    laborerNumber: fields.number.optional(),
    minAmount: fields.doubleParam.optional(),
    maxAmount: fields.doubleParam.optional(),
    occurredFrom: fields.dateTime.optional(),
    occurredTo: fields.dateTime.optional(),
    paymentId: fields.integerParam.optional(),
  }),
};
export const loanPaymentRules: FilterRule<paginateLoanPaymentsDTO>[] = [
  { path: ["rateId"], param: "rateId" },
  { path: ["rate", "laborer", "id"], param: "laborerId" },
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
export const getLoanPayment = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};
export const createLoanPayment = {
  body: z.strictObject({
    rateId: fields.integerBody,
    amount: fields.doubleBody,
    occurredAt: fields.dateTime.optional(),
    notes: z.string().optional(),
  }),
};
export const updateLoanPayment = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
  body: z.strictObject({
    rateId: fields.integerBody.optional(),
    amount: fields.doubleBody.optional(),
    occurredAt: fields.dateTime.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteLoanPayment = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};

export type paginateLoanPaymentsDTO = z.infer<
  typeof paginateLoanPayments.query
>;
export type getLoanPaymentParamsDTO = z.infer<typeof getLoanPayment.params>;
export type createLoanPaymentBodyDTO = z.infer<typeof createLoanPayment.body>;
export type updateLoanPaymentParamsDTO = z.infer<
  typeof updateLoanPayment.params
>;
export type updateLoanPaymentBodyDTO = z.infer<typeof updateLoanPayment.body>;
export type deleteLoanPaymentParamsDTO = z.infer<
  typeof deleteLoanPayment.params
>;
