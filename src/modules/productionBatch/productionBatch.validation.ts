import z from "zod";
import { fields } from "../../utils/generalFields";

export const paginateProductionBatches = {
  query: fields.paginate("ProductionBatch").extend({
    productionEntryId: fields.idParam.optional(),
    productionDayId: fields.idParam.optional(),
    productionDate: fields.date.optional(),
    occurredFrom: fields.dateTime.optional(),
    occurredTo: fields.dateTime.optional(),
    itemName: fields.name.optional(),
    unitWeight: fields.unitWeightParam.optional(),
  }),
};
export const getProductionBatch = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};
export const createProductionBatch = {
  body: z.strictObject({
    productionEntryId: fields.idBody,
    quantity: fields.quantity,
    occurredAt: fields.dateTime,
    notes: z.string().optional(),
  }),
};
export const updateProductionBatch = {
  params: z.strictObject({
    id: fields.idParam,
  }),
  body: z.strictObject({
    productionEntryId: fields.idBody.optional(),
    quantity: fields.quantity.optional(),
    occurredAt: fields.dateTime.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteProductionBatch = {
  params: z.strictObject({
    id: fields.idParam,
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
