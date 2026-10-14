import z from "zod";
import { fields } from "../../utils/generalFields";

export const paginateProductionEntries = {
  query: fields.paginate("ProductionEntry").extend({
    productionDayId: fields.integerParam().optional(),
    variantId: fields.integerParam().optional(),
    productionDate: fields.date.optional(),
    itemName: fields.name.optional(),
    unitWeight: fields.doubleParam().optional(),
  }),
};
export const getProductionEntry = {
  params: z.strictObject({
    id: fields.integerParam(),
  }),
};
export const createProductionEntry = {
  body: z.strictObject({
    productionDayId: fields.integerBody(),
    variantId: fields.integerBody(),
    notes: z.string().optional(),
  }),
};
export const updateProductionEntry = {
  params: z.strictObject({
    id: fields.integerParam(),
  }),
  body: z.strictObject({
    productionDayId: fields.integerBody().optional(),
    variantId: fields.integerBody().optional(),
    notes: z.string().optional(),
  }),
};
export const deleteProductionEntry = {
  params: z.strictObject({
    id: fields.integerParam(),
  }),
};

export type paginateProductionEntriesDTO = z.infer<
  typeof paginateProductionEntries.query
>;
export type getProductionEntryParamsDTO = z.infer<
  typeof getProductionEntry.params
>;
export type createProductionEntryBodyDTO = z.infer<
  typeof createProductionEntry.body
>;
export type updateProductionEntryParamsDTO = z.infer<
  typeof updateProductionEntry.params
>;
export type updateProductionEntryBodyDTO = z.infer<
  typeof updateProductionEntry.body
>;
export type deleteProductionEntryParamsDTO = z.infer<
  typeof deleteProductionEntry.params
>;
