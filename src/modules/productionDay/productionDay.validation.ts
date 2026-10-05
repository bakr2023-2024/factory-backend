import z from "zod";
import { fields } from "../../utils/generalFields";

export const paginateProductionDays = {
  query: fields.paginate("ProductionDay").extend({
    weekId: fields.idParam.optional(),
    productionDate: fields.date.optional(),
    startedFrom: fields.dateTime.optional(),
    startedTo: fields.dateTime.optional(),
    endedFrom: fields.dateTime.optional(),
    endedTo: fields.dateTime.optional(),
  }),
};
export const getProductionDay = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};
export const createProductionDay = {
  body: z.strictObject({
    weekId: fields.idBody,
    productionDate: fields.date,
    startedAt: fields.dateTime,
    endedAt: fields.dateTime.optional(),
    notes: z.string().optional(),
  }),
};
export const updateProductionDay = {
  params: z.strictObject({
    id: fields.idParam,
  }),
  body: z.strictObject({
    weekId: fields.idBody.optional(),
    productionDate: fields.date.optional(),
    startedAt: fields.dateTime.optional(),
    endedAt: fields.dateTime.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteProductionDay = {
  params: z.strictObject({
    id: fields.idParam,
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
