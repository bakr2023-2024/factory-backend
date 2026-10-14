import z from "zod";
import { fields } from "../../utils/generalFields";

export const paginateLoans = {
  query: fields.paginate("Loan").extend({
    laborerId: fields.idParam.optional(),
    laborerName: fields.name.optional(),
    laborerNumber: fields.number.optional(),
    seasonId: fields.idParam.optional(),
    loanAmount: fields.unitPriceParam.optional(),
    loanedAt: fields.dateTime.optional(),
    paymentId: fields.idParam.optional(),
  }),
};
export const getLoan = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};
export const createLoan = {
  body: z.strictObject({
    laborerId: fields.idBody,
    seasonId: fields.idBody,
    loanAmount: fields.unitPriceBody,
    loanedAt: fields.dateTime.optional(),
    notes: z.string().optional(),
  }),
};
export const updateLoan = {
  params: z.strictObject({
    id: fields.idParam,
  }),
  body: z.strictObject({
    laborerId: fields.idBody.optional(),
    seasonId: fields.idBody.optional(),
    loanAmount: fields.unitPriceBody.optional(),
    loanedAt: fields.dateTime.optional(),
    paymentId: fields.idBody.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteLoan = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};

export type paginateLoansDTO = z.infer<typeof paginateLoans.query>;
export type getLoanParamsDTO = z.infer<typeof getLoan.params>;
export type createLoanBodyDTO = z.infer<typeof createLoan.body>;
export type updateLoanParamsDTO = z.infer<typeof updateLoan.params>;
export type updateLoanBodyDTO = z.infer<typeof updateLoan.body>;
export type deleteLoanParamsDTO = z.infer<typeof deleteLoan.params>;
