import z from "zod";
import { fields } from "../../utils/generalFields";
import { FilterRule } from "../../utils/utils";

export const paginatePayments = {
  query: fields.paginate("Payment").extend({
    rateId: fields.integerParam.optional(),
    laborerId: fields.integerParam.optional(),
    laborerName: fields.name.optional(),
    laborerNumber: fields.number.optional(),
    seasonId: fields.integerParam.optional(),
    minGross: fields.doubleParam.optional(),
    maxGross: fields.doubleParam.optional(),
    minLoans: fields.doubleParam.optional(),
    maxLoans: fields.doubleParam.optional(),
    minLoanPayments: fields.doubleParam.optional(),
    maxLoanPayments: fields.doubleParam.optional(),
    minNet: fields.doubleParam.optional(),
    maxNet: fields.doubleParam.optional(),
    occurredFrom: fields.dateTime.optional(),
    occurredTo: fields.dateTime.optional(),
  }),
};
export const paymentRules: FilterRule<paginatePaymentsDTO>[] = [
  { path: ["rateId"], param: "rateId" },
  { path: ["rate", "laborerId"], param: "laborerId" },
  { path: ["rate", "laborer", "name"], param: "laborerName", op: "contains" },
  {
    path: ["rate", "laborer", "number"],
    param: "laborerNumber",
    op: "contains",
  },
  { path: ["rate", "seasonId"], param: "seasonId" },
  { path: ["gross"], param: "minGross", op: "gte" },
  { path: ["gross"], param: "maxGross", op: "lte" },
  { path: ["loans"], param: "minLoans", op: "gte" },
  { path: ["loans"], param: "maxLoans", op: "lte" },
  { path: ["loanPayments"], param: "minLoanPayments", op: "gte" },
  { path: ["loanPayments"], param: "maxLoanPayments", op: "lte" },
  { path: ["net"], param: "minNet", op: "gte" },
  { path: ["net"], param: "maxNet", op: "lte" },
  { path: ["occurredAt"], param: "occurredFrom", op: "gte" },
  { path: ["occurredAt"], param: "occurredTo", op: "lte" },
  { path: ["createdAt"], param: "createdFrom", op: "gte" },
  { path: ["createdAt"], param: "createdTo", op: "lte" },
];
export const getPayment = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};
export const getPreview = {
  params: z.strictObject({
    rateId: fields.integerParam,
  }),
};
export const createPayment = {
  body: z.strictObject({
    rateId: fields.integerBody,
    gross: fields.doubleBody,
    loans: fields.doubleBody,
    loanPayments: fields.doubleBody,
    net: fields.doubleBody,
    occurredAt: fields.dateTime.optional(),
    notes: z.string().optional(),
  }),
};
export const deletePayment = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};

export type paginatePaymentsDTO = z.infer<typeof paginatePayments.query>;
export type getPaymentParamsDTO = z.infer<typeof getPayment.params>;
export type getPreviewParamsDTO = z.infer<typeof getPreview.params>;
export type createPaymentBodyDTO = z.infer<typeof createPayment.body>;
export type deletePaymentParamsDTO = z.infer<typeof deletePayment.params>;
