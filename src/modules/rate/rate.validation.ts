import z from "zod";
import { fields } from "../../utils/generalFields";
import { PaymentType } from "../../db/generated/prisma/enums";
import { FilterRule } from "../../utils/utils";

export const paginateRates = {
  query: fields.paginate("Rate").extend({
    laborerId: fields.integerParam.optional(),
    laborerName: fields.name.optional(),
    laborerNumber: fields.number.optional(),
    seasonId: fields.integerParam.optional(),
    from: fields.date.optional(),
    to: fields.date.optional(),
    paymentType: z.enum(PaymentType).optional(),
    minDailySalary: fields.doubleParam.optional(),
    maxDailySalary: fields.doubleParam.optional(),
  }),
};
export const rateRules: FilterRule<paginateRatesDTO>[] = [
  { path: ["laborerId"], param: "laborerId" },
  { path: ["laborer", "name"], param: "laborerName", op: "contains" },
  { path: ["laborer", "number"], param: "laborerNumber", op: "contains" },
  { path: ["seasonId"], param: "seasonId" },
  { path: ["from"], param: "from", op: "gte" },
  { path: ["to"], param: "to", op: "lte" },
  { path: ["paymentType"], param: "paymentType" },
  { path: ["dailySalary"], param: "minDailySalary", op: "gte" },
  { path: ["dailySalary"], param: "maxDailySalary", op: "lte" },
  { path: ["createdAt"], param: "createdFrom", op: "gte" },
  { path: ["createdAt"], param: "createdTo", op: "lte" },
];
export const getRate = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};
export const createRate = {
  body: z.strictObject({
    laborerId: fields.integerBody,
    seasonId: fields.integerBody,
    from: fields.date,
    to: fields.date.optional(),
    dailySalary: fields.doubleBody,
    paymentType: z.enum(PaymentType),
    notes: z.string().optional(),
  }),
};
export const updateRate = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
  body: z.strictObject({
    laborerId: fields.integerBody.optional(),
    seasonId: fields.integerBody.optional(),
    from: fields.date.optional(),
    to: fields.date.optional(),
    dailySalary: fields.doubleBody.optional(),
    paymentType: z.enum(PaymentType).optional(),
    notes: z.string().optional(),
  }),
};
export const deleteRate = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};

export type paginateRatesDTO = z.infer<typeof paginateRates.query>;
export type getRateParamsDTO = z.infer<typeof getRate.params>;
export type createRateBodyDTO = z.infer<typeof createRate.body>;
export type updateRateParamsDTO = z.infer<typeof updateRate.params>;
export type updateRateBodyDTO = z.infer<typeof updateRate.body>;
export type deleteRateParamsDTO = z.infer<typeof deleteRate.params>;
