import z from "zod";
import { fields } from "../../utils/generalFields";

export const paginateExportItems = {
  query: fields.paginate("ExportItem").extend({
    customerId: fields.integerParam().optional(),
    variantId: fields.integerParam().optional(),
    exportId: fields.integerParam().optional(),
    itemId: fields.integerParam().optional(),
    customerName: fields.name.optional(),
    customerNumber: fields.number.optional(),
    itemName: fields.name.optional(),
    minPrice: fields.doubleParam().optional(),
    maxPrice: fields.doubleParam().optional(),
    occurredFrom:fields.dateTime.optional(),
    occurredTo:fields.dateTime.optional()
  }),
};
export const getExportItem = {
  params: z.strictObject({
    id: fields.integerParam(),
  }),
};
export const createExportItem = {
  body: z.strictObject({
    exportId: fields.integerBody(),
    variantId: fields.integerBody(),
    quantity: fields.integerBody(),
    unitPrice: fields.doubleBody().optional(),
    notes: z.string().optional(),
  }),
};
export const updateExportItem = {
  params: z.strictObject({
    id: fields.integerParam(),
  }),
  body: z.strictObject({
    exportId: fields.integerBody().optional(),
    variantId: fields.integerBody().optional(),
    quantity: fields.integerBody().optional(),
    unitPrice: fields.doubleBody().optional(),
    notes: z.string().optional(),
  }),
};
export const deleteExportItem = {
  params: z.strictObject({
    id: fields.integerParam(),
  }),
};

export type paginateExportItemsDTO = z.infer<typeof paginateExportItems.query>;
export type getExportItemParamsDTO = z.infer<typeof getExportItem.params>;
export type createExportItemBodyDTO = z.infer<typeof createExportItem.body>;
export type updateExportItemParamsDTO = z.infer<typeof updateExportItem.params>;
export type updateExportItemBodyDTO = z.infer<typeof updateExportItem.body>;
export type deleteExportItemParamsDTO = z.infer<typeof deleteExportItem.params>;
