import z from "zod";
import { fields } from "../../utils/generalFields";
import { PaymentType } from "../../db/generated/prisma/enums";

export const paginateRates = {
  query: fields.paginate("Rate").extend({
    laborerId: fields.idParam.optional(),
    laborerName: fields.name.optional(),
    laborerNumber: fields.number.optional(),
    seasonId: fields.idParam.optional(),
    from: fields.date.optional(),
    to: fields.date.optional(),
    paymentType: z.enum(PaymentType).optional(),
    minSalary: fields.unitPriceParam.optional(),
    maxSalary: fields.unitPriceParam.optional(),
  }),
};
export const getRate = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};
export const createRate = {
  body: z.strictObject({
    laborerId: fields.idBody,
    seasonId: fields.idBody,
    from: fields.date,
    to: fields.date.optional(),
    dailySalary: fields.unitPriceBody,
    paymentType: z.enum(PaymentType),
    notes: z.string().optional(),
  }),
};
export const updateRate = {
  params: z.strictObject({
    id: fields.idParam,
  }),
  body: z.strictObject({
    laborerId: fields.idBody.optional(),
    seasonId: fields.idBody.optional(),
    from: fields.date.optional(),
    to: fields.date.optional(),
    dailySalary: fields.unitPriceBody.optional(),
    paymentType: z.enum(PaymentType).optional(),
    notes: z.string().optional(),
  }),
};
export const deleteRate = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};

export type paginateRatesDTO = z.infer<typeof paginateRates.query>;
export type getRateParamsDTO = z.infer<typeof getRate.params>;
export type createRateBodyDTO = z.infer<typeof createRate.body>;
export type updateRateParamsDTO = z.infer<typeof updateRate.params>;
export type updateRateBodyDTO = z.infer<typeof updateRate.body>;
export type deleteRateParamsDTO = z.infer<typeof deleteRate.params>;
