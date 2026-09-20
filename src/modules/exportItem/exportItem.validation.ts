import z from "zod";
import { fields } from "../../utils/generalFields";

export const paginateExportItems = {
  query: fields.paginate("ExportItem").extend({
    customerId: fields.idParam.optional(),
    variantId: fields.idParam.optional(),
    exportId: fields.idParam.optional(),
    itemId: fields.idParam.optional(),
    customerName: fields.name.optional(),
    itemName: fields.name.optional(),
    minPrice: fields.unitPriceParam.optional(),
    maxPrice: fields.unitPriceParam.optional(),
  }),
};
export const getExportItem = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};
export const createExportItem = {
  body: z.strictObject({
    exportId: fields.idBody,
    variantId: fields.idBody,
    quantity: fields.quantity,
    unitPrice: fields.unitPriceBody.optional(),
    notes: z.string().optional(),
  }),
};
export const updateExportItem = {
  params: z.strictObject({
    id: fields.idParam,
  }),
  body: z.strictObject({
    exportId: fields.idBody.optional(),
    variantId: fields.idBody.optional(),
    quantity: fields.quantity.optional(),
    unitPrice: fields.unitPriceBody.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteExportItem = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};

export type paginateExportItemsDTO = z.infer<typeof paginateExportItems.query>;
export type getExportItemParamsDTO = z.infer<typeof getExportItem.params>;
export type createExportItemBodyDTO = z.infer<typeof createExportItem.body>;
export type updateExportItemParamsDTO = z.infer<typeof updateExportItem.params>;
export type updateExportItemBodyDTO = z.infer<typeof updateExportItem.body>;
export type deleteExportItemParamsDTO = z.infer<typeof deleteExportItem.params>;
