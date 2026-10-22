import z from "zod";
import { fields } from "../../utils/generalFields";
import { FilterRule } from "../../utils/utils";

export const paginateProductionBatches = {
  query: fields.paginate("ProductionBatch").extend({
    productionEntryId: fields.integerParam.optional(),
    productionDayId: fields.integerParam.optional(),
    productionDate: fields.date.optional(),
    occurredFrom: fields.dateTime.optional(),
    occurredTo: fields.dateTime.optional(),
    itemName: fields.name.optional(),
    unitWeight: fields.doubleParam.optional(),
  }),
};
export const productionBatchRules: FilterRule<paginateProductionBatchesDTO>[] =
  [
    { path: ["productionEntryId"], param: "productionEntryId" },
    { path: ["productionEntry", "productionDayId"], param: "productionDayId" },
    {
      path: ["productionEntry", "productionDay", "productionDate"],
      param: "productionDate",
    },
    {
      path: ["productionEntry", "variant", "item", "name"],
      param: "itemName",
      op: "contains",
    },
    { path: ["productionEntry", "variant", "unitWeight"], param: "unitWeight" },
    { path: ["occurredAt"], param: "occurredFrom", op: "gte" },
    { path: ["occurredAt"], param: "occurredTo", op: "lte" },
    { path: ["createdAt"], param: "createdFrom", op: "gte" },
    { path: ["createdAt"], param: "createdTo", op: "lte" },
  ];
export const getProductionBatch = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};
export const createProductionBatch = {
  body: z.strictObject({
    productionEntryId: fields.integerBody,
    quantity: fields.integerBody,
    occurredAt: fields.dateTime.optional(),
    notes: z.string().optional(),
  }),
};
export const updateProductionBatch = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
  body: z.strictObject({
    productionEntryId: fields.integerBody.optional(),
    quantity: fields.integerBody.optional(),
    occurredAt: fields.dateTime.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteProductionBatch = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};

export type paginateProductionBatchesDTO = z.infer<
  typeof paginateProductionBatches.query
>;
export type getProductionBatchParamsDTO = z.infer<
  typeof getProductionBatch.params
>;
export type createProductionBatchBodyDTO = z.infer<
  typeof createProductionBatch.body
>;
export type updateProductionBatchParamsDTO = z.infer<
  typeof updateProductionBatch.params
>;
export type updateProductionBatchBodyDTO = z.infer<
  typeof updateProductionBatch.body
>;
export type deleteProductionBatchParamsDTO = z.infer<
  typeof deleteProductionBatch.params
>;
