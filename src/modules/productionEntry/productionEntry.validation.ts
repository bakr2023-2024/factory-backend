import z from "zod";
import { fields } from "../../utils/generalFields";
import { FilterRule } from "../../utils/utils";

export const paginateProductionEntries = {
  query: fields.paginate("ProductionEntry").extend({
    productionDayId: fields.integerParam.optional(),
    weekId: fields.integerParam.optional(),
    seasonId: fields.integerParam.optional(),
    variantId: fields.integerParam.optional(),
    productionDate: fields.date.optional(),
    itemName: fields.name.optional(),
    unitWeight: fields.doubleParam.optional(),
  }),
};
export const productionEntryRules: FilterRule<paginateProductionEntriesDTO>[] = [
  { path: ["productionDayId"], param: "productionDayId" },
  { path: ["productionDay", "weekId"], param: "weekId" },
  { path: ["productionDay", "week", "seasonId"], param: "seasonId" },
  { path: ["productionDay", "productionDate"], param: "productionDate" },
  { path: ["variantId"], param: "variantId" },
  { path: ["variant", "item", "name"], param: "itemName", op: "contains" },
  { path: ["variant", "unitWeight"], param: "unitWeight" },
  { path: ["createdAt"], param: "createdFrom", op: "gte" },
  { path: ["createdAt"], param: "createdTo", op: "lte" },
];
export const getProductionEntry = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};
export const createProductionEntry = {
  body: z.strictObject({
    productionDayId: fields.integerBody,
    variantId: fields.integerBody,
    notes: z.string().optional(),
  }),
};
export const updateProductionEntry = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
  body: z.strictObject({
    productionDayId: fields.integerBody.optional(),
    variantId: fields.integerBody.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteProductionEntry = {
  params: z.strictObject({
    id: fields.integerParam,
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
