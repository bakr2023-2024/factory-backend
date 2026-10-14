import z from "zod";
import { fields } from "../../utils/generalFields";

export const paginateLoans = {
  query: fields.paginate("Loan").extend({
    laborerId: fields.integerParam().optional(),
    laborerName: fields.name.optional(),
    laborerNumber: fields.number.optional(),
    seasonId: fields.integerParam().optional(),
    loanAmount: fields.doubleParam().optional(),
    loanedAt: fields.dateTime.optional(),
    paymentId: fields.integerParam().optional(),
  }),
};
export const getLoan = {
  params: z.strictObject({
    id: fields.integerParam(),
  }),
};
export const createLoan = {
  body: z.strictObject({
    laborerId: fields.integerBody(),
    seasonId: fields.integerBody(),
    loanAmount: fields.doubleBody(),
    loanedAt: fields.dateTime.optional(),
    notes: z.string().optional(),
  }),
};
export const updateLoan = {
  params: z.strictObject({
    id: fields.integerParam(),
  }),
  body: z.strictObject({
    laborerId: fields.integerBody().optional(),
    seasonId: fields.integerBody().optional(),
    loanAmount: fields.doubleBody().optional(),
    loanedAt: fields.dateTime.optional(),
    paymentId: fields.integerBody().optional(),
    notes: z.string().optional(),
  }),
};
export const deleteLoan = {
  params: z.strictObject({
    id: fields.integerParam(),
  }),
};

export type paginateLoansDTO = z.infer<typeof paginateLoans.query>;
export type getLoanParamsDTO = z.infer<typeof getLoan.params>;
export type createLoanBodyDTO = z.infer<typeof createLoan.body>;
export type updateLoanParamsDTO = z.infer<typeof updateLoan.params>;
export type updateLoanBodyDTO = z.infer<typeof updateLoan.body>;
export type deleteLoanParamsDTO = z.infer<typeof deleteLoan.params>;
