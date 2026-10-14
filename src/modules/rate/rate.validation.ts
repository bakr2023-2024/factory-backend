import z from "zod";
import { fields } from "../../utils/generalFields";
import { PaymentType } from "../../db/generated/prisma/enums";

export const paginateRates = {
  query: fields.paginate("Rate").extend({
    laborerId: fields.integerParam().optional(),
    laborerName: fields.name.optional(),
    laborerNumber: fields.number.optional(),
    seasonId: fields.integerParam().optional(),
    from: fields.date.optional(),
    to: fields.date.optional(),
    paymentType: z.enum(PaymentType).optional(),
    minSalary: fields.doubleParam().optional(),
    maxSalary: fields.doubleParam().optional(),
  }),
};
export const getRate = {
  params: z.strictObject({
    id: fields.integerParam(),
  }),
};
export const createRate = {
  body: z.strictObject({
    laborerId: fields.integerBody(),
    seasonId: fields.integerBody(),
    from: fields.date,
    to: fields.date.optional(),
    dailySalary: fields.doubleBody(),
    paymentType: z.enum(PaymentType),
    notes: z.string().optional(),
  }),
};
export const updateRate = {
  params: z.strictObject({
    id: fields.integerParam(),
  }),
  body: z.strictObject({
    laborerId: fields.integerBody().optional(),
    seasonId: fields.integerBody().optional(),
    from: fields.date.optional(),
    to: fields.date.optional(),
    dailySalary: fields.doubleBody().optional(),
    paymentType: z.enum(PaymentType).optional(),
    notes: z.string().optional(),
  }),
};
export const deleteRate = {
  params: z.strictObject({
    id: fields.integerParam(),
  }),
};

export type paginateRatesDTO = z.infer<typeof paginateRates.query>;
export type getRateParamsDTO = z.infer<typeof getRate.params>;
export type createRateBodyDTO = z.infer<typeof createRate.body>;
export type updateRateParamsDTO = z.infer<typeof updateRate.params>;
export type updateRateBodyDTO = z.infer<typeof updateRate.body>;
export type deleteRateParamsDTO = z.infer<typeof deleteRate.params>;
