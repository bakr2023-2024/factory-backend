import z from "zod";
import { fields } from "../../utils/generalFields";
import { FilterRule } from "../../utils/utils";

export const paginateProductionDays = {
  query: fields.paginate("ProductionDay").extend({
    weekId: fields.integerParam.optional(),
    seasonId: fields.integerParam.optional(),
    productionDate: fields.date.optional(),
    startedFrom: fields.dateTime.optional(),
    startedTo: fields.dateTime.optional(),
    endedFrom: fields.dateTime.optional(),
    endedTo: fields.dateTime.optional(),
  }),
};
export const productionDayRules: FilterRule<paginateProductionDaysDTO>[] = [
  { path: ["weekId"], param: "weekId" },
  { path: ["week", "seasonId"], param: "seasonId" },
  { path: ["productionDate"], param: "productionDate" },
  { path: ["startedAt"], param: "startedFrom", op: "gte" },
  { path: ["startedAt"], param: "startedTo", op: "lte" },
  { path: ["endedAt"], param: "endedFrom", op: "gte" },
  { path: ["endedAt"], param: "endedTo", op: "lte" },
  { path: ["createdAt"], param: "createdFrom", op: "gte" },
  { path: ["createdAt"], param: "createdTo", op: "lte" },
];
export const getProductionDay = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};
export const createProductionDay = {
  body: z.strictObject({
    weekId: fields.integerBody,
    productionDate: fields.date,
    startedAt: fields.dateTime,
    endedAt: fields.dateTime.optional(),
    notes: z.string().optional(),
  }),
};
export const updateProductionDay = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
  body: z.strictObject({
    weekId: fields.integerBody.optional(),
    productionDate: fields.date.optional(),
    startedAt: fields.dateTime.optional(),
    endedAt: fields.dateTime.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteProductionDay = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};

export type paginateProductionDaysDTO = z.infer<
  typeof paginateProductionDays.query
>;
export type getProductionDayParamsDTO = z.infer<typeof getProductionDay.params>;
export type createProductionDayBodyDTO = z.infer<
  typeof createProductionDay.body
>;
export type updateProductionDayParamsDTO = z.infer<
  typeof updateProductionDay.params
>;
export type updateProductionDayBodyDTO = z.infer<
  typeof updateProductionDay.body
>;
export type deleteProductionDayParamsDTO = z.infer<
  typeof deleteProductionDay.params
>;
