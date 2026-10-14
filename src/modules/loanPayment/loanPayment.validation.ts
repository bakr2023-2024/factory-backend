import z from "zod";
import { fields } from "../../utils/generalFields";

export const paginateLoanPayments = {
  query: fields.paginate("LoanPayment").extend({
    laborerId: fields.integerParam().optional(),
    laborerName: fields.name.optional(),
    laborerNumber: fields.number.optional(),
    loanId: fields.integerParam().optional(),
    amount: fields.doubleParam().optional(),
    repaidAt: fields.dateTime.optional(),
    paymentId: fields.integerParam().optional(),
  }),
};
export const getLoanPayment = {
  params: z.strictObject({
    id: fields.integerParam(),
  }),
};
export const createLoanPayment = {
  body: z.strictObject({
    loanId: fields.integerBody(),
    amount: fields.doubleBody(),
    repaidAt: fields.dateTime.optional(),
    notes: z.string().optional(),
  }),
};
export const updateLoanPayment = {
  params: z.strictObject({
    id: fields.integerParam(),
  }),
  body: z.strictObject({
    loanId: fields.integerBody().optional(),
    amount: fields.doubleBody().optional(),
    repaidAt: fields.dateTime.optional(),
    paymentId:fields.integerBody().optional(),
    notes: z.string().optional(),
  }),
};
export const deleteLoanPayment = {
  params: z.strictObject({
    id: fields.integerParam(),
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
